import Component from '@glimmer/component';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';
import { positionalValues } from '../util';
import springToKeyframes, { progressToInterpolatedVelocity } from '../spring';

export default class MotionComponent extends Component {
  element;
  animation;
  frames;

  get type() {
    return this.args.transition?.type ?? 'spring'
  }

  get duration() {
    return this.args.transition?.duration ?? 500;
  }

  @action
  onInsert(element) {
    this.element = element;

    if (this.args.initial) {
      this.animate(element, {
        initial: this.args.initial,
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
  animate(element, { initial, animate }) {
    // duration is only used for non-spring easings
    let duration = this.duration;
    let initialVelocity = 0;

    if (this.animation) {
      this.animation.pause();
      const timing = this.animation.effect.getComputedTiming();
      duration *= timing.progress;

      if (this.frames?.length) {
        // we need to invert the velocity we want to transfer to the new spring
        initialVelocity = -1 * progressToInterpolatedVelocity(timing.progress, this.frames);
      }
    }

    this.animateTask.perform(element, {
      initialCssProps: initial,
      cssProps: animate,
      duration,
      initialVelocity
    });
  }

  @(task(function*(element, { duration: _duration, initialVelocity, initialCssProps, cssProps }){
    const styles = getComputedStyle(element);
    const boundingBox = element.getBoundingClientRect();

    // TODO: make generic
    let start = initialCssProps ? initialCssProps.x : positionalValues['x'](boundingBox , styles);
    let end = cssProps.x;

    const {
      // eslint-disable-next-line no-unused-vars
      type: typeArg,
      ...transitionOptions
    } = this.args.transition;

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
      keyframes = [
        { transform: start },
        { transform: `translate(${end}px)`}
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
  }).restartable())
  animateTask;
}
