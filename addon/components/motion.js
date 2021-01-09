import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { assert } from '@ember/debug';
import { task, all } from 'ember-concurrency';

import {
  copyComputedStyle,
  getRelativeOffsetRect,
  microwait,
  positionalValues,
  transformValues,
} from '../-private/util';
import { cumulativeTransform, parseTransform } from '../-private/transform/transform';
import { decomposeTransform } from '../-private/transform/matrix';
import { calculateMagicMove } from '../-private/motion/magic-move';
import { getValueAnimation } from '../-private/animation/get-value-animation';
import { getTransformAnimation } from '../-private/animation/get-transform-animation';

export default class MotionComponent extends Component {
  @service motion;

  element;
  animations = [];
  sharedLayout;

  // measurements
  computedStyles;
  cumulativeTransform;
  boundingClientRect;

  @action
  onInsert(element) {
    this.element = element;

    let sharedLayoutGuid;
    let parent = this.element.parentNode;
    while (!sharedLayoutGuid && parent) {
      sharedLayoutGuid = parent.getAttribute('data-animated-shared-layout-id');
      if (sharedLayoutGuid) {
        break;
      }

      if (parent.parentNode instanceof Element) {
        parent = parent.parentNode;
      } else {
        parent = null;
      }
    }

    if (sharedLayoutGuid) {
      this.sharedLayout = this.motion.getSharedLayoutComponent(sharedLayoutGuid);
      this.sharedLayout.registerMotion(this);
    }

    if (this.sharedLayout?.outGoing.has(this.args.layoutId)) {
      this.animateIncoming(this.args.layoutId);
    } else if (this.args.initial) {
      this.animate(element, {
        initial: this.args.initial,
        animate: this.args.animate,
      });
    } else if (this.args.exit) {
      if (!this.args.orphan) {
        console.error('Cannot animate exit without a <MotionOrphans/> component');
      }

      const offset = getRelativeOffsetRect(this.args.orphanOffsetRect, this.args.orphan.boundingBox);
      this.animate(element, {
        animate: {
          ...offset,
        },
        exit: {
          ...this.args.exit,
          x: (this.args.exit.x ?? 0) + offset.x,
          y: (this.args.exit.y ?? 0) + offset.y,
        },
      });
    } else {
      // FIXME this is the case for this.initial === false
      this.animate(element, {
        animate: this.args.animate,
      });
    }

    assert(
      `Measurements incomplete. Was the animate action called on insertion?`,
      this.styles && this.boundingClientRect && this.cumulativeTransform
    );
  }

  @action
  onUpdate(element, [animate]) {
    this.animate(element, {
      animate,
    });
  }

  @action
  animate(_, { initial, animate, exit }) {
    // duration is only used for non-spring easings
    /*let duration = this.duration;
    let initialVelocity = 0;

    if (this.animateTask.isRunning) {
      this.animation.pause();
      const timing = this.animation.effect.getComputedTiming();
      duration *= timing.progress;

      if (this.frames?.length) {
        // we need to invert the velocity we want to transfer to the new spring
        initialVelocity = -1 * progressToInterpolatedVelocity(timing.progress, this.frames);
      }
    }*/

    return this.animateTask.perform({
      element: this.element,
      initial,
      animate,
      exit,
      transition: { ...this.args.transition /*, duration*/ },
      initialVelocity: 0,
    });
  }

  @(task(function* ({ element, initial, animate = {}, exit, transition }) {
    try {
      this.updateMeasurements();

      const fromValues = initial ?? (this.args.orphan && exit ? animate : {});
      const toValues = exit ?? animate;

      // TODO take into account the proper units

      const { toValuesNormal, toValuesTransform, fromValuesTransform } = Object.entries(toValues).reduce(
        (result, [key, value]) => {
          if (transformValues.includes(key)) {
            result.toValuesTransform[key] = value;

            if (fromValues[key]) {
              result.fromValuesTransform[key] = fromValues[key];
            }
          } else {
            result.toValuesNormal[key] = value;
          }

          return result;
        },
        {
          toValuesNormal: {},
          toValuesTransform: {},
          fromValuesTransform: {},
        }
      );

      const { translateX: x, translateY: y, ...decomposed } = decomposeTransform(parseTransform(this.styles.transform));

      const { animation: transformAnimation, duration: transformDuration } = getTransformAnimation(
        element,
        toValuesTransform,
        {
          x,
          y,
          scaleX: decomposed.scaleX,
          scaleY: decomposed.scaleY,
          skewX: decomposed.skewX,
          skewY: decomposed.skewY,
          rotate: decomposed.rotate,
          ...fromValuesTransform,
        },
        this.args.transition
      );

      const valueAnimations = Object.entries(toValuesNormal).map(([key, toValue]) => {
        const fromValue = fromValues[key] ?? positionalValues[key]?.(this.boundingBox, this.styles) ?? this.styles[key];

        // FIXME: workaround because we do not support "complex" values for springa nimations yet
        let type = transition.type;
        let duration = transition.duration;
        if (isNaN(fromValue) || isNaN(toValue)) {
          type = 'tween';
          duration = transformDuration;
        }

        return getValueAnimation({
          element,
          key,
          fromValue,
          toValue,
          transition: { ...transition, type, duration },
        });
      });

      this.animations = [transformAnimation, ...valueAnimations].filter(Boolean);
      yield all(this.animations.map((a) => a.finished));
    } catch (error) {
      console.log('ERROR', error);
    } finally {
      this.updateMeasurements();

      if (this.args.orphan) {
        this.motion.removeOrphan(this.args.orphan);
      }
    }
  }).restartable())
  animateTask;

  @action
  animateLayout() {
    return this.animateLayoutTask.perform({
      sourceTransform: this.cumulativeTransform,
      sourceBoundingClientRect: this.boundingClientRect,
    });
  }

  @(task(function* ({ sourceTransform, sourceBoundingClientRect }) {
    // measure bounds after layout animation
    yield microwait();

    this.updateMeasurements();

    const targetTransform = this.cumulativeTransform;
    const targetBoundingClientRect = this.boundingClientRect;

    const initial = {
      ...calculateMagicMove({
        sourceTransform,
        targetTransform,
        sourceBoundingClientRect,
        targetBoundingClientRect,
      }),
    };

    const animate = {
      ...Object.entries(initial).reduce((result, [k, v]) => {
        // TODO: set appropriate default value for type
        result[k] = 0;
        return result;
      }, {}),
      scaleX: 1,
      scaleY: 1,
      ...this.args.animate,
    };

    // return animation options
    return { initial, animate };
  }).restartable())
  animateLayoutTask;

  @action
  animateIncoming(layoutId) {
    const {
      animate: initialProps,
      boundingClientRect: sourceBoundingClientRect,
      cumulativeTransform: sourceTransform,
    } = this.sharedLayout.outGoing.get(layoutId);
    this.sharedLayout.outGoing.delete(layoutId);

    this.updateMeasurements();

    const targetTransform = this.cumulativeTransform;
    const targetBoundingClientRect = this.boundingClientRect;

    const initial = {
      ...initialProps,
      ...calculateMagicMove({
        sourceTransform,
        targetTransform,
        sourceBoundingClientRect,
        targetBoundingClientRect,
      }),
    };

    const animate = {
      ...Object.entries(initial).reduce((result, [k, v]) => {
        // TODO: set appropriate default value for type
        result[k] = 0;
        return result;
      }, {}),
      scaleX: 1,
      scaleY: 1,
      ...this.args.animate,
    };

    this.animate(null, { initial, animate });
  }

  @action
  updateMeasurements() {
    this.styles = copyComputedStyle(this.element);
    // TODO: normalize against page offset
    this.boundingClientRect = this.element.getBoundingClientRect();
    this.cumulativeTransform = cumulativeTransform(this.element);
  }

  /**
   * Action that handles tasks we need to do in a synchronous willDestroyElement hook.
   * @param element
   */
  @action
  onWillDestroyElement(element) {
    if (this.animateTask.isRunning) {
      this.animateTask.cancelAll();
    }

    if (this.animateLayoutTask.isRunning) {
      this.animateLayoutTask.cancelAll();
    }

    this.boundingClientRect = element.getBoundingClientRect();
    this.computedStyles = copyComputedStyle(element);
    this.cumulativeTransform = cumulativeTransform(element);

    if (!this.args.orphan && this.args.exit) {
      this.motion.addOrphan({
        html: element.cloneNode(true),
        boundingBox: {
          x: window.pageXOffset + this.boundingClientRect.x,
          y: window.pageYOffset + this.boundingClientRect.y,
        },
        transition: this.args.transition,
        animate: this.computedStyles,
        exit: this.args.exit,
      });
    }

    if (!this.args.orphan) {
      // unregister first so we're sure we won't match against ourselves when matching layoutId
      this.sharedLayout?.unregisterMotion(this);

      if (this.args.layoutId && this.sharedLayout) {
        this.sharedLayout.notifyDestroying(this.args.layoutId, {
          animate: this.args.animate,
          boundingClientRect: this.boundingClientRect,
          cumulativeTransform: this.cumulativeTransform,
        });
      }
    }
  }
}
