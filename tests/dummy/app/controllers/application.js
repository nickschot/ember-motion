import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

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
  @tracked colors = ["#ff0055", "#0099ff", "#22cc88", "#ffaa00"];
  @tracked selected = this.colors[0];
}
