import type Kensington from 'kensington';
import type { ContentMethod } from 'kensington';

declare class TaskListEngine extends Kensington {
  sortableList: ContentMethod<{ 'onreorder'?: (e: CustomEvent) => void }>;
}

declare const t: TaskListEngine;
export default t;
