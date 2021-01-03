import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ApplicationController extends Controller {
  @tracked x = 0;
  get y() {
    return this.x / 2;
  }
  get background() {
    return this.x ? 'blue' : 'red';
  }
  get borderRadius() {
    return this.x / 10;
  }
  get rotate() {
    return this.x > 0 ? 30 : 0;
  }
  @tracked colors = ['#ff0055', '#0099ff', '#22cc88', '#ffaa00'];
  @tracked selected = this.colors[0];

  @tracked list1 = ['Item 1', 'Item 2', 'Item 3', 'Item 6'];
  @tracked list2 = ['Item 4', 'Item 5'];

  @action
  moveToList2(item) {
    this.list1.splice(this.list1.indexOf(item), 1);
    this.list1 = this.list1;
    const list2 = [...new Set([...this.list2, item])];
    list2.sort((a, b) => (a === b ? 0 : a > b ? 1 : -1));
    this.list2 = list2;
  }

  @action
  moveToList1(item) {
    this.list2.splice(this.list2.indexOf(item), 1);
    this.list2 = this.list2;
    const list1 = [...new Set([...this.list1, item])];
    list1.sort((a, b) => (a === b ? 0 : a > b ? 1 : -1));
    this.list1 = list1;
  }
}
