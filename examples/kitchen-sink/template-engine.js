import Kensington from 'kensington';

class TaskListEngine extends Kensington {
  sortableList = this.createCustomTag('k-sortable-list', { onreorder: Function });
}

const t = new TaskListEngine({ validationLevel: 'error' });

export default t;
