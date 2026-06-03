import { layout } from './layout.js';
import { apiContent, apiSidebar } from './pages/api/index.js';
import { architectureContent, architectureSidebar } from './pages/architecture/index.js';
import { basicsContent, basicsSidebar } from './pages/basics/index.js';
import { examplesContent, examplesSidebar } from './pages/examples/index.js';
import { reactivityContent, reactivitySidebar } from './pages/reactivity/index.js';

const pages = [
  { id: 'basics', label: 'Basics', sidebar: basicsSidebar, content: basicsContent },
  { id: 'reactivity', label: 'Reactive data', sidebar: reactivitySidebar, content: reactivityContent },
  { id: 'examples', label: 'Examples', sidebar: examplesSidebar, content: examplesContent },
  { id: 'api', label: 'API', sidebar: apiSidebar, content: apiContent },
  {
    id: 'architecture',
    label: 'Architecture',
    sidebar: architectureSidebar,
    content: architectureContent,
    hideFromNav: true,
  },
];

export function generateHtml() {
  return layout(pages);
}
