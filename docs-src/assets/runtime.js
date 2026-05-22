import { effect, registerComponents } from 'kensington';
import { currentPage, activeSection } from './state.js';
import { initScrollspy } from './scrollspy.js';
import { signalDemo } from '../components/signal-demo.js';
import { searchDocs } from '../components/search.js';
import { copyButton } from '../components/copy-button.js';
import { pageTabs } from '../components/page-tabs.js';
import { comparisonsModal } from '../pages/basics/modals.js';

// ── DOM refs ──────────────────────────────────────────────────────

const pageContents = Array.from(document.querySelectorAll('[data-page-content]'));
const pageNavs = Array.from(document.querySelectorAll('[data-page-nav]'));
const nav = document.getElementById('sidebar');
const toggle = document.getElementById('menu-toggle');

// ── Page switching ────────────────────────────────────────────────

function handlePageSwitch(id) {
  history.pushState({}, '', id === 'basics' ? location.pathname : `?page=${id}`);
  pageContents.forEach(el => el.classList.toggle('page-inactive', el.dataset.pageContent !== id));
  pageNavs.forEach(el => el.classList.toggle('page-inactive', el.dataset.pageNav !== id));
  window.scrollTo({ top: 0, behavior: 'instant' });
  activeSection.set(null);
  initScrollspy();
  if (toggle) { toggle.checked = false; }
}

function navigateTo(id) {
  if (toggle) { toggle.checked = false; }
  const target = document.getElementById(id.slice(1));
  if (target) {
    target.scrollIntoView();
    history.replaceState(null, '', id);
  }
}

effect(() => {
  handlePageSwitch(currentPage.get())
});

// ── Sidebar nav links ─────────────────────────────────────────────

nav.querySelectorAll('a[href^="#"]').forEach(l => l.addEventListener('click', e => {
  e.preventDefault();
  navigateTo(l.getAttribute('href'))
}));

// ── Components ────────────────────────────────────────────────────

registerComponents({ signalDemo, searchDocs, copyButton, pageTabs, comparisonsModal });
