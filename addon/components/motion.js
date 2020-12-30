import Component from '@glimmer/component';
import { action } from '@ember/object';
import { task, all } from 'ember-concurrency';
import {
  copyComputedStyle,
  getRelativeOffsetRect,
  positionalValues,
  transformValues
} from '../util';
import springToKeyframes from '../spring';
import { inject as service } from '@ember/service';
import { getDefaultTransition } from "../default-transitions";
import { cumulativeTransform, parseTransform } from "../transform";
import {serializeValuesAsTransform} from "../transform-utils";
import MatrixMath from '../matrix-math';

function isTransitionDefined({
  when,
  delay,
  delayChildren,
  staggerChildren,
  staggerDirection,
  repeat,
  repeatType,
  repeatDelay,
  from,
  ...transition
}) {
  return !!Object.keys(transition).length
}

export function toDegrees (angle) {
  return angle * (180 / Math.PI);
}

export function toRadians (angle) {
  return angle * (Math.PI / 180);
}

export default class MotionComponent extends Component {
  @service motion;

  element;
  animation;
  animations = [];
  frames;
  sharedLayout;
  computedStyles;
  boundingClientRect;

  @action
  onInsert(element) {
    this.element = element;

    let sharedLayoutGuid;
    let parent = this.element.parentNode;
    while(!sharedLayoutGuid && parent) {
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
      const {
        boundingBox: sourceBoundingClientRect,
        initialProps,
        sourceCumulativeTransform: sourceMatrix,
        //styles
      } = this.sharedLayout.outGoing.get(this.args.layoutId);
      this.sharedLayout.outGoing.delete(this.args.layoutId);

      const targetMatrix = cumulativeTransform(this.element);
      const targetBoundingClientRect = this.element.getBoundingClientRect();

      const sourceMatrix_4x4 = [
        sourceMatrix.a, sourceMatrix.b, 0, 0,
        sourceMatrix.c, sourceMatrix.d, 0, 0,
        0, 0, 1, 0,
        sourceMatrix.tx, sourceMatrix.ty, 0, 1
      ];
      const targetMatrix_4x4 = [
        targetMatrix.a, targetMatrix.b, 0, 0,
        targetMatrix.c, targetMatrix.d, 0, 0,
        0, 0, 1, 0,
        targetMatrix.tx, targetMatrix.ty, 0, 1
      ];

      const decomposedSourceMatrix = MatrixMath.decomposeMatrix(sourceMatrix_4x4);
      const decomposedTargetMatrix = MatrixMath.decomposeMatrix(targetMatrix_4x4);

      const scaleX = decomposedSourceMatrix.scaleX / decomposedTargetMatrix.scaleX;
      const scaleY = decomposedSourceMatrix.scaleY / decomposedTargetMatrix.scaleY;

      const skewX = decomposedSourceMatrix.skewX - decomposedTargetMatrix.skewX;
      const skewY = decomposedSourceMatrix.skewY - decomposedTargetMatrix.skewY;

      const rotate = decomposedSourceMatrix.rotate - decomposedTargetMatrix.rotate;

      // X/Y should be the diff between the source transform origin & target transform origin
      let x = (sourceBoundingClientRect.x + sourceBoundingClientRect.width / 2) - (targetBoundingClientRect.x + targetBoundingClientRect.width / 2);
      let y = (sourceBoundingClientRect.y + sourceBoundingClientRect.height / 2) - (targetBoundingClientRect.y + targetBoundingClientRect.height / 2);

      // scale correction
      x /= decomposedTargetMatrix.scaleX;
      y /= decomposedTargetMatrix.scaleY;

      // rotation correction
      const rotate_rad = -1 * toRadians(decomposedTargetMatrix.rotate);

      // compensate for translateY based on rotation
      let y_d1 = y - Math.cos(rotate_rad) * y;
      let x_d1 = Math.sin(rotate_rad) * y;

      // compensate for translateX based on rotation
      let x_d2 = x - Math.cos(rotate_rad) * x;
      let y_d2 = Math.sin(rotate_rad) * x;

      x -= x_d1;
      y -= y_d1;
      x -= x_d2;
      y += y_d2;

      // skew correction
      let x_delta = Math.tan(toRadians(decomposedTargetMatrix.skewX)) * y;
      let y_delta = Math.tan(toRadians(decomposedTargetMatrix.skewY)) * x;
      console.log(rotate, 'DELTA', x_delta, y_delta, decomposedTargetMatrix.skewX, decomposedTargetMatrix.skewY);

      x -= x_delta;
      y -= y_delta;

      const initial = {
        ...initialProps,
        x,
        y,
        scaleX,
        scaleY,
        rotate,
        skewX,
        skewY
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
    } else if (this.args.initial) {
      this.animate(element, {
        initial: this.args.initial,
        animate: this.args.animate
      });
    } else if (this.args.exit) {
      if (!this.args.orphan) {
        console.error('Cannot animate exit without a <MotionOrphans/> component');
      }

      const offset = getRelativeOffsetRect(this.args.orphanOffsetRect, this.args.orphan.boundingBox);
      this.animate(element, {
        animate: {
          ...offset
        },
        exit: {
          ...this.args.exit,
          x: (this.args.exit.x ?? 0) + offset.x,
          y: (this.args.exit.y ?? 0) + offset.y
        },
      });
    } else {
      // FIXME this is the case for this.initial === false
      this.animate(element, {
        animate: this.args.animate
      });
    }
  }

  @action
  onUpdate(element, [animate]) {
    this.animate(element, {
      animate
    });
  }

  @action
  animate(_, { initial, animate, exit }) {
    // duration is only used for non-spring easings
    /*let duration = this.duration;
    let initialVelocity = 0;

    if (this.animateAllTask.isRunning) {
      this.animation.pause();
      const timing = this.animation.effect.getComputedTiming();
      duration *= timing.progress;

      if (this.frames?.length) {
        // we need to invert the velocity we want to transfer to the new spring
        initialVelocity = -1 * progressToInterpolatedVelocity(timing.progress, this.frames);
      }
    }*/

    //console.log(ownTransform(this.element), cumulativeTransform(this.element));

    this.animateAllTask.perform({
      element: this.element,
      initial,
      animate,
      exit,
      transition: { ...this.args.transition/*, duration*/ },
      initialVelocity: 0
    });
  }

  @(task(function*({ element, initial, animate, exit, transition }) {
    try {
      const styles = copyComputedStyle(element);
      this.styles = styles;
      this.boundingBox = this.element.getBoundingClientRect();

      const fromValues = initial ?? (this.args.orphan && exit ? animate : {});
      const toValues = exit ?? animate;

      // TODO translate transform related properties (e.g. "x, y" => "translateX(x) translateY(y))")
      // TODO put all transform related animations in a single animation so we don't need compositing
      // TODO take into account units

      const {
        toValuesNormal,
        toValuesTransform,
        fromValuesTransform
      } = Object.entries(toValues).reduce((result, [key, value]) => {
        if (transformValues.includes(key)) {
          result.toValuesTransform[key] = value;

          if (fromValues[key]) {
            result.fromValuesTransform[key] = fromValues[key];
          }
        } else {
          result.toValuesNormal[key] = value;
        }

        return result;
      }, {
        toValuesNormal: {},
        toValuesTransform: {},
        fromValuesTransform: {}
      });

      const fromTransform = parseTransform(styles.transform);//ownTransform(element);
      const decomposed3d = MatrixMath.decomposeMatrix([
        fromTransform.a, fromTransform.b, 0, 0,
        fromTransform.c, fromTransform.d, 0, 0,
        0, 0, 1, 0,
        fromTransform.tx, fromTransform.ty, 0, 1
      ]);

      const transformAnimation = this.getTransformAnimation(element, toValuesTransform, {
        x: decomposed3d.translateX,
        y: decomposed3d.translateY,
        scaleX: decomposed3d.scaleX,
        scaleY: decomposed3d.scaleY,
        rotate: decomposed3d.rotate,
        skewX: decomposed3d.skewX,
        skewY: decomposed3d.skewY,
        ...fromValuesTransform
      });
      this.animations = [transformAnimation, ...this.animations, ...Object.entries(toValuesNormal).map(([key, toValue]) => this.getValueAnimation(element, styles, key, fromValues[key], toValue, transition))].filter(Boolean);
      yield all(this.animations.map((a) => { /*if (a.persist) { a.persist(); }*/ return a.finished }));

    } catch (error) {
      console.log('ERROR', error);
    } finally {
      if (this.args.orphan) {
        this.motion.removeOrphan(this.args.orphan);
      }
    }
  }).restartable())
  animateAllTask;

  @action
  getTransformAnimation(element, toValues, fromValues) {
    // TODO: what if we don't have x/y ???
    let springFrom = Math.sqrt(Math.pow(fromValues.x ?? 0, 2) + Math.pow(fromValues.y ?? 0, 2));
    let springTo = Math.sqrt(Math.pow(toValues.x ?? 0, 2) + Math.pow(toValues.y ?? 0, 2));

    const fromTransformString = serializeValuesAsTransform(fromValues);
    const toTransformString = serializeValuesAsTransform(toValues);

    console.log('FROM: ', fromTransformString);
    console.log('TO: ', toTransformString);

    if (fromTransformString === toTransformString || (springFrom === 0 && springTo === springFrom)) {
      return element.animate([
        {
          transform: fromTransformString
        },
        {
          transform: toTransformString
        }
      ], {
        fill: "both",
        easing: "linear",
        duration: 0,
        composite: "replace"
      });
    }

    // TODO: add tween support
    const frames = springToKeyframes({
      fromValue: 0,
      initialVelocity: 0,
      ...getDefaultTransition('x', springTo - springFrom),
      ...(this.args.transition?.type === "spring" ? this.args.transition : undefined),
    });

    // TODO: implement this as a callback in the spring so we can save doing this map operation
    const keyframes = frames.map(({ value }) => {
      const scalar = value / (springTo - springFrom);
      const frame = Object.fromEntries(
        Object
          .entries(toValues)
          .map(([key, toValue]) => [key, (fromValues[key] ?? 0) + scalar * (toValue - (fromValues[key] ?? 0))])
      );

      return {
        transform: serializeValuesAsTransform(frame)
      };
    });

    return element.animate(keyframes, {
      fill: "both",
      easing: "linear",
      duration: frames[frames.length - 1].time,
      composite: "replace"
    });
  }

  @action
  getValueAnimation(element, styles, key, fromValue, toValue, transition, composite) {
    const options = {
      fromValue: fromValue ?? positionalValues[key]?.(this.boundingBox , styles) ?? styles[key],
      toValue,
      initialVelocity: 0
    };

    // if the values are identical, apply an animation with a duration of 0 so we at least have the styles applied
    if (options.fromValue == options.toValue || (!isNaN(parseFloat(options.fromValue)) && parseFloat(options.fromValue) === parseFloat(options.toValue))) {
      return element.animate([
        this.keyValueToCss(key, options.fromValue),
        this.keyValueToCss(key, options.toValue)
      ], {
        fill: "both",
        easing: "linear",
        duration: 0,
        composite
      })
    }

    const animation = isTransitionDefined(transition)
      ? { ...options, ...transition }
      : { ...options, ...getDefaultTransition(key, toValue)};

    let keyframes = [];
    if (animation.type === "spring") {
      let frames = springToKeyframes(animation);
      keyframes = frames.map(({ value }) => this.keyValueToCss(key, value));
      animation.duration = frames[frames.length - 1].time;
    } else if (animation.type === "tween") {
      animation.easing = animation.easing ?? "linear";
      animation.duration = animation.duration ?? 300;
      keyframes = [
        this.keyValueToCss(key, animation.fromValue),
        this.keyValueToCss(key, animation.toValue)
      ];
    }

    return element.animate(keyframes, {
      fill: "both",
      easing: animation.easing,
      duration: animation.duration,
      composite
    });
  }

  keyValueToCss(key, value) {
    if (typeof value === 'number' && !['opacity'].includes(key)) {
      return { [key]: `${parseFloat(value)}px` };
    }

    return { [key]: value };
  }

  /**
   * Action that handles tasks we need to do in a synchronous willDestroyElement hook.
   * @param element
   */
  @action
  onWillDestroyElement(element) {
    if (this.animateAllTask.isRunning) {
      this.animateAllTask.cancelAll();
    }

    this.boundingClientRect = element.getBoundingClientRect();
    this.computedStyles = copyComputedStyle(element);
    this.cumulativeTransform = cumulativeTransform(element);

    if (!this.args.orphan && this.args.exit) {
      this.motion.addOrphan({
        html: element.cloneNode(true),
        boundingBox: {
          x: window.pageXOffset + this.boundingClientRect.x,
          y: window.pageYOffset + this.boundingClientRect.y
        },
        transition: this.args.transition,
        animate: this.computedStyles,
        exit: this.args.exit
      });
    }

    if (!this.args.orphan) {
      // unregister first so we're sure we won't match against ourselves when matching layoutId
      this.sharedLayout?.unregisterMotion(this);

      if(this.args.layoutId && this.sharedLayout) {
        this.sharedLayout.notifyDestroying(this.args.layoutId, {
          ...this.args.animate,
          x: positionalValues['x']?.(this.boundingClientRect , this.computedStyles),
          y: positionalValues['y']?.(this.boundingClientRect , this.computedStyles),
          borderColor: this.computedStyles.borderColor
        }, this.boundingClientRect, this.cumulativeTransform, this.computedStyles);
      }
    }
  }
}
