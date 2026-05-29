import Kensington from 'kensington';

export {
  computed,
  effect,
  isBrowser,
  registerComponents,
  renderForHydration,
  signal,
} from 'kensington';

class TaskListEngine extends Kensington {
  sortableList = this.createCustomTag('k-sortable-list', { onreorder: Function });
}

const t = new TaskListEngine({ validationLevel: 'error' });

export default t;
