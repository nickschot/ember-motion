import Component from '@ember/component';
import layout from './element';

/**
 * This component is a workaround so we can use the synchronous willDestroyElement hook.
 * This component can in the future likely be replaced with a combination of the dynamic
 * tag helper and a (hopefully) to be introduced synchronous modifier destruction hook.
 */
export default Component.extend({
  layout,

  willDestroyElement() {
    this.onWillDestroyElement?.(this.element);
  }
});
