import Component from '@glimmer/component';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';

export default class MotionComponent extends Component {
  element;

  @action
  setElement(element) {
    this.element = element;
  }

  @action
  animate(element, [values]) {
    console.log(...arguments);
    this.animateTask.perform(element, values);
  }

  @(task(function*(element, values){
    console.log('currentValues', this.currentValues);
    // TODO: animate
  }).drop())
  animateTask;
}
