import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

export default class ApplicationController extends Controller {
  @tracked x = 0;
  @tracked colors = ["#ff0055", "#0099ff", "#22cc88", "#ffaa00"];
  @tracked selected = this.colors[0];
}
