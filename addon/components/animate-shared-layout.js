import Component from '@glimmer/component';
import { guidFor } from '@ember/object/internals';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { getRelativeOffsetRect } from '../util';

export default class AnimateSharedLayoutComponent extends Component {
  @service motion;

  guid = guidFor(this);
  children = new Set(); // TODO: layoutId's must be unique among the motions registered here
  element;

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
  notifyDestroying(layoutId, initialProps, boundingBox) {
    const motion = [...this.children].find((m) => m.args.layoutId === layoutId);
    motion.animateAllTask.cancelAll();

    if (motion) {
      const offset = getRelativeOffsetRect(motion.element.getBoundingClientRect(), boundingBox);
      const initial = {
        ...initialProps,
        ...offset
      };
      const animate = {
        ...Object.entries(initial).reduce((result, [k, v]) => {
          // TODO: set appropriate default value for type
          result[k] = 0;
          return result;
        }, {}),
        ...motion.args.animate
      };

      motion.animate(null, { initial, animate });
    }
  }
}
