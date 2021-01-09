import Component from '@glimmer/component';
import { guidFor } from '@ember/object/internals';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { task, all } from 'ember-concurrency';

export default class AnimateSharedLayoutComponent extends Component {
  @service motion;

  guid = guidFor(this);
  children = new Set(); // TODO: layoutId's must be unique among the motions registered here, add assertion
  element;
  outGoing = new Map();

  constructor() {
    super(...arguments);

    this.motion.registerSharedLayoutComponent(this);
  }

  willDestroy() {
    this.motion.unregisterSharedLayoutComponent(this);
    super.willDestroy();
  }

  registerMotion(motion) {
    this.children.add(motion);
  }

  unregisterMotion(motion) {
    this.children.delete(motion);
  }

  get layoutIds() {
    return this.children.map((m) => m.args.layoutId).filter(Boolean);
  }

  @action
  onInsert(element) {
    this.element = element;
  }

  @action
  async notifyDestroying(layoutId, data) {
    this.notifyDestroyingTask.perform(layoutId, data);
  }

  @task(function* (layoutId, data) {
    const children = [...this.children];
    const animations = [];

    // Do before measurements on the other children.
    for (let c of children) {
      animations.push(c.animateLayout());
    }

    // Set the outgoing element so it will do it's move.
    this.outGoing.set(layoutId, data);

    // Wait for the after measurements to complete. This also occurs within the
    // animateLayout call, but after a "microwait". In practice this means it
    // will always happen after the outgoing element was rendered.
    yield all(animations);

    // Now we can trigger the actual animation on the children.
    animations.forEach((taskInstance, i) => {
      children[i].animate(null, taskInstance.value);
    });

    // Remove the outgoing element again as we already started the animation
    this.outGoing.delete(layoutId);
  })
  notifyDestroyingTask;
}
