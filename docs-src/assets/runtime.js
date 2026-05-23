import { effect, registerComponents } from 'kensington';
import { currentPage, activeSection } from './state.js';
import { initScrollspy } from './scrollspy.js';
import { signalDemo } from '../components/signal-demo.js';
import { searchDocs } from '../components/search.js';
import { copyButton } from '../components/copy-button.js';
import { pageTabs } from '../components/page-tabs.js';
import { comparisonsModal } from '../pages/basics/modals.js';
import './scroll-bar.js';

// ── DOM refs ──────────────────────────────────────────────────────

const pageContents = Array.from(document.querySelectorAll('[data-page-content]'));
const pageNavs = Array.from(document.querySelectorAll('[data-page-nav]'));
const nav = document.getElementById('sidebar');
const toggle = document.getElementById('menu-toggle');
const initStyle = document.getElementById('page-init');

// ── Custom scrollbars ─────────────────────────────────────────────

customElements.whenDefined('scroll-bar').then(() => {
  document.querySelectorAll('.code-wrap').forEach(wrap => {
    const pre = wrap.querySelector('pre[class*="language-"]');
    if (!pre) { return; }
    const bar = document.createElement('scroll-bar');
    wrap.appendChild(bar);
    bar.attach(pre);
  });
});

// ── Page switching ────────────────────────────────────────────────

let isFirstPageSwitch = true;

function handlePageSwitch(id) {
  if (!isFirstPageSwitch) {
    history.pushState({}, '', id === 'basics' ? location.pathname : `?page=${id}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  isFirstPageSwitch = false;
  pageContents.forEach(el => el.classList.toggle('page-inactive', el.dataset.pageContent !== id));
  pageNavs.forEach(el => el.classList.toggle('page-inactive', el.dataset.pageNav !== id));
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
  handlePageSwitch(currentPage.get());
  initStyle?.remove();
});

if (location.hash) {
  const el = document.getElementById(location.hash.slice(1));
  if (el) { el.scrollIntoView(); }
}

// ── Sidebar nav links ─────────────────────────────────────────────

nav.querySelectorAll('a[href^="#"]').forEach(l => l.addEventListener('click', e => {
  e.preventDefault();
  navigateTo(l.getAttribute('href'))
}));

// ── Components ────────────────────────────────────────────────────

registerComponents({ signalDemo, searchDocs, copyButton, pageTabs, comparisonsModal });
