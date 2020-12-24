import Component from '@glimmer/component';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';
import {copyComputedStyle, positionalValues, transformValues} from '../util';
import springToKeyframes from '../spring';
import { inject as service } from '@ember/service';
import { getDefaultTransition } from "../default-transitions";

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

export default class MotionComponent extends Component {
  @service motion;

  element;
  animation;
  animations = [];
  frames;
  sharedLayout;

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

    if (this.args.initial) {
      this.animate(element, {
        initial: this.args.initial,
        animate: this.args.animate
      });
    } else {
      this.animate(element, {
        animate: this.args.animate
      });
    }

    if (this.args.exit) {
      this.animate(element, {
        animate: this.args.animate,
        exit: this.args.exit,
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

    if (this.animation) {
      this.animation.pause();
      const timing = this.animation.effect.getComputedTiming();
      duration *= timing.progress;

      if (this.frames?.length) {
        // we need to invert the velocity we want to transfer to the new spring
        initialVelocity = -1 * progressToInterpolatedVelocity(timing.progress, this.frames);
      }
    }*/

    //console.log('animating', initial, animate, exit, duration, initialVelocity);

    /*this.animateTask.perform(this.element, {
      initialCssProps: initial,
      cssProps: animate,
      exitCssProps: exit,
      duration,
      initialVelocity
    });*/

    if (this.animations?.length) {
      const paused = this.animations.map((animation) => { animation.pause(); return animation; });
      this.animations = [];
    }

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

      const fromValues = initial ?? {};
      const toValues = exit ?? animate;

      // TODO translate transform related properties (e.g. "x, y" => "translateX(x) translateY(y))")
      // TODO put all transform related animations in a single animation so we don't need compositing
      // TODO take into account units

      const {
        toValuesNormal,
        toValuesTransform
      } = Object.entries(toValues).reduce((result, [key, value]) => {
        if (transformValues.includes(key)) {
          result.toValuesTransform[key] = value;
        } else {
          result.toValuesNormal[key] = value;
        }

        return result;
      }, {
        toValuesNormal: {},
        toValuesTransform: {}
      });

      this.animations = Object.entries(toValuesTransform).map(([key, toValue], index) => this.getValueAnimation(element, styles, key, fromValues[key], toValue, transition, index > 0 ? 'add' : 'replace')).filter(Boolean);
      this.animations = [...this.animations, ...Object.entries(toValuesNormal).map(([key, toValue]) => this.getValueAnimation(element, styles, key, fromValues[key], toValue, transition))].filter(Boolean);
      yield Promise.all(this.animations.map((a) => { if (a.persist) { a.persist(); } return a.finished }));

    } catch (error) {
      console.log('ERROR', error);
    } finally {
      this.styles = copyComputedStyle(element);
      this.boundingClientRect = element.getBoundingClientRect();
    }
  }).restartable())
  animateAllTask;

  @action
  getValueAnimation(element, styles, key, fromValue, toValue, transition, composite) {
    const options = {
      fromValue: fromValue ?? positionalValues[key]?.(this.boundingBox , styles) ?? styles[key],
      toValue,
      initialVelocity: 0
    };

    if (options.fromValue == options.toValue || (!isNaN(parseFloat(options.fromValue)) && parseFloat(options.fromValue) === parseFloat(options.toValue))) {
      return null;
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
    if (['x', 'y'].includes(key)) {
      return { transform: key === 'x' ? `translateX(${value}px)` : `translateY(${value}px)` }
    } else if (typeof value === 'number') {
      return { [key]: `${+value}px` };
    }

    return { [key]: value };
  }

  willDestroy() {
    // unregister first so we're sure we won't match against ourselves when matching layoutId
    this.sharedLayout?.unregisterMotion(this);

    if(this.args.layoutId && this.sharedLayout) {
      this.sharedLayout.notifyDestroying(this.args.layoutId, this.args.animate, this.boundingClientRect);
    }

    //console.log(this.element, this.element.getBoundingClientRect());
    //debugger;
    if (!this.args.orphan && this.element && this.args.exit) {
      const html = this.element.cloneNode(true);

      this.motion.addOrphan({
        html,
        pageOffset: {
          x: window.pageXOffset,
          y: window.pageYOffset
        },
        boundingBox: this.boundingBox,
        transition: this.args.transition,
        animate: this.args.animate,
        exit: this.args.exit
      });
    }
    super.willDestroy();
  }
}
