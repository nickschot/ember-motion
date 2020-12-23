import Component from '@glimmer/component';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';
import { positionalValues } from '../util';
import springToKeyframes from '../spring';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/template';
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
      console.log('setting shared layout component', sharedLayoutGuid);
      this.sharedLayout = this.motion.getSharedLayoutComponent(sharedLayoutGuid);
      this.sharedLayout.registerMotion(this);
    }

    if (this.args.initial) {
      this.animate(element, {
        initial: this.args.initial,
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

  get styles() {
    let styles = '';
    console.log(this.args.orphan?.boundingBox);
    if (this.args.orphan) {
      const x = this.args.orphan.boundingBox.x + this.args.orphan.pageOffset.x;
      const y = this.args.orphan.boundingBox.y + this.args.orphan.pageOffset.y;
      styles = `position: absolute; left: ${x}px; top: ${y}px;`;
    }

    console.log(styles);

    return htmlSafe(styles);
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

  /*@(task(function*(element, { duration: _duration, initialVelocity, initialCssProps, cssProps, exitCssProps }){
    try {
    const styles = getComputedStyle(element);
    this.boundingBox = this.element.getBoundingClientRect();

    // TODO: make generic
    let start = initialCssProps.borderColor;//initialCssProps ? initialCssProps.x : positionalValues['x'](this.boundingBox , styles);
    let end = cssProps.borderColor;//cssProps.x;

    if (this.args.orphan && exitCssProps) {
      start = cssProps.x;
      end = exitCssProps.x;
    }

    const {
      // eslint-disable-next-line no-unused-vars
      type: typeArg,
      ...transitionOptions
    } = this.args.transition ?? {};

    let {
      easing = 'linear',
      fill = 'both'
    } = transitionOptions;

    let keyframes = [];
    let duration = _duration;

    if (this.type === 'spring') {
      this.frames = springToKeyframes({
        // critically damped by default
        mass: 1,
        stiffness: 100,
        damping: 20,
        ...transitionOptions,
        fromValue: start,
        toValue: end,
        initialVelocity
      });

      // TODO: do this work in the springToKeyframes loop
      // serialize generated frames into keyframes suitable for Web Animations
      keyframes = this.frames.map(({ value }) => ({
        transform: `translate(${value}px)`
      }));
      duration = this.frames[this.frames.length - 1]?.time;
      easing = 'linear'; // force easing to be linear, which is the only sensible easing for a spring
    } else if (this.type === 'tween') {
      /!*keyframes = [
        { transform: start },
        { transform: `translate(${end}px)`}
      ];*!/
      keyframes = [
        { borderColor: start },
        { borderColor: end }
      ];
    }

    // play the animation
    this.animation = element.animate(keyframes, {
      fill,
      easing,
      duration
    });
    this.animation.play();
    yield this.animation.finished;

    // cleanup
    this.animation = null;
    this.frames = null;

    } finally {
      console.log('set boundingbox');
      this.boundingBox = this.element.getBoundingClientRect();
      console.log('set boundingbox', this.boundingBox);
      if (this.args.orphan) {
        this.motion.removeOrphan(this.args.orphan);
      }
    }
  }).restartable())
  animateTask;
*/
  @(task(function*({ element, initial, animate, exit, transition }) {
    try {
      // TODO: make a copy of the properties we need
      const styles = { transform: getComputedStyle(element)["transform"] };
      console.log(styles);
      this.boundingBox = this.element.getBoundingClientRect();

      const fromValues = initial ?? {};
      const toValues = exit ?? animate;

      // TODO translate transform related properties (e.g. x, y => translate(x, y))
      // TODO take into account units
      this.animations = Object.entries(toValues)
        .map(([key, toValue], index) => this.getValueAnimation(element, styles, key, fromValues[key], toValue, transition, index > 0 ? 'add' : 'replace'));
      yield Promise.all(this.animations.map((a) => { a.persist(); return a.finished }));

    } catch (error) {
      console.log('ERROR', error);
    }
  }).restartable())
  animateAllTask;

  @action
  getValueAnimation(element, styles, key, fromValue, toValue, transition, composite) {
    const options = {
      fromValue: fromValue ?? positionalValues[key](this.boundingBox , styles),
      toValue,
      initialVelocity: 0
    };
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
      console.log(keyframes);
    }

    console.log(animation);

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
    }

    return { [key]: value };
  }

  willDestroy() {
    // unregister first so we're sure we won't match against ourselves when matching layoutId
    this.sharedLayout?.unregisterMotion(this);

    if(this.args.layoutId && this.sharedLayout) {
      this.sharedLayout.notifyDestroying(this.args.layoutId, this.args.animate);
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
