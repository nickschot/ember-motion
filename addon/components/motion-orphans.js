import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class MotionOrphansComponent extends Component {
  @service motion;

  element;
  offsetRect;

  @action
  onInsert(element) {
    this.element = element;
    // TODO: take page offset/scroll into account

    const boundingBox = this.element.getBoundingClientRect();
    this.offsetRect = {
      x: window.pageXOffset + boundingBox.x,
      y: window.pageYOffset + boundingBox.y,
    };
  }
}
