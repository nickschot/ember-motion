import Service from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class MotionService extends Service {
  @tracked orphans = new Set();
  @tracked sharedLayoutComponents = new Map();

  @action
  addOrphan(orphan) {
    this.orphans = new Set([...this.orphans, orphan]);
  }

  @action
  removeOrphan(orphan) {
    this.orphans.delete(orphan);
    this.orphans = this.orphans;
  }

  @action
  registerSharedLayoutComponent(ref) {
    this.sharedLayoutComponents.set(ref.guid, ref);
  }

  @action
  unregisterSharedLayoutComponent(ref) {
    this.sharedLayoutComponents.delete(ref.guid);
  }

  getSharedLayoutComponent(guid) {
    return this.sharedLayoutComponents.get(guid);
  }
}
