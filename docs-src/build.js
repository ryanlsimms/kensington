import Kensington from '../esm/index.js';
import { basicsSidebar, basicsContent } from './pages/basics/index.js';
import { reactivitySidebar, reactivityContent } from './pages/reactivity/index.js';
import { examplesSidebar, examplesContent } from './pages/examples/index.js';
import { apiSidebar, apiContent } from './pages/api/index.js';
import { architectureSidebar, architectureContent } from './pages/architecture/index.js';
import { layout } from './layout.js';

const pages = [
  { id: 'basics', label: 'Basics', sidebar: basicsSidebar, content: basicsContent },
  { id: 'reactivity', label: 'Reactive data', sidebar: reactivitySidebar, content: reactivityContent },
  { id: 'examples', label: 'Examples', sidebar: examplesSidebar, content: examplesContent },
  { id: 'api', label: 'API', sidebar: apiSidebar, content: apiContent },
  { id: 'architecture', label: 'Architecture', sidebar: architectureSidebar, content: architectureContent, hideFromNav: true },
];

export function generateHtml() {
  return layout(new Kensington(), pages);
}
