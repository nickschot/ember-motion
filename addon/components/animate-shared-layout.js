import Component from '@glimmer/component';
import { guidFor } from '@ember/object/internals';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class AnimateSharedLayoutComponent extends Component {
  @service motion;

  guid = guidFor(this);
  children = new Set(); // TODO: layoutId's must be unique among the motions registered here
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
  notifyDestroying(layoutId, data) {
    this.outGoing.set(layoutId, data);
  }
}
