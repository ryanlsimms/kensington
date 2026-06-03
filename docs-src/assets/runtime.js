import './scroll-bar.js';

import { effect, registerComponents } from 'kensington';

import { copyButton } from '../components/copy-button.js';
import { pageTabs } from '../components/page-tabs.js';
import { searchDocs } from '../components/search.js';
import { signalDemo } from '../components/signal-demo.js';
import { comparisonsModal } from '../pages/basics/modals.js';
import { initScrollspy } from './scrollspy.js';
import { activeSection, currentPage } from './state.js';

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

  const sidebarBar = document.createElement('scroll-bar');
  sidebarBar.id = 'sidebar-scrollbar';
  nav.insertAdjacentElement('afterend', sidebarBar);
  sidebarBar.attach(nav, { axis: 'y' });
});

// ── Sticky h2 stuck-state detection ──────────────────────────
//
// Each section h2 is wrapped in a div.h2-slot. The slot itself is position:
// sticky (its containing block is the section, so it stays pinned through the
// whole section). The slot's min-height is locked to the h2's natural unstuck
// box height. That way, when .is-stuck is toggled on the slot, the h2 inside
// shrinks visually but the slot keeps the same flow space so content below
// doesn't jump.
//
// Inactive pages are display:none, so their h2s have offsetHeight === 0 at
// measure time. We skip those and rely on measureStickyH2s() being called
// from handlePageSwitch when a page is revealed.
//
// IntersectionObserver has an inherent notification delay (the spec lets
// browsers batch callbacks ~100-200ms), which would make the .is-stuck class
// lag behind the pin. A passive scroll listener with requestAnimationFrame is
// frame-accurate.
const stickyHeadings = Array.from(document.querySelectorAll('section h2'));
const stickySlots = stickyHeadings.map(h2 => {
  if (h2.parentElement?.classList.contains('h2-slot')) {
    return h2.parentElement;
  }
  const slot = document.createElement('div');
  slot.className = 'h2-slot';
  h2.replaceWith(slot);
  slot.appendChild(h2);
  return slot;
});

function measureStickyH2s() {
  for (let i = 0; i < stickyHeadings.length; i++) {
    const slot = stickySlots[i];
    const h2 = stickyHeadings[i];
    const wasStuck = slot.classList.contains('is-stuck');
    if (wasStuck) { slot.classList.remove('is-stuck'); }
    slot.style.minHeight = '';
    const naturalHeight = h2.offsetHeight;
    // Hidden h2s (page-inactive ancestor → display:none) measure as 0. Leave
    // their slot unmeasured; the call from handlePageSwitch will pick them up
    // when their page becomes active.
    if (naturalHeight > 0) {
      slot.style.minHeight = `${naturalHeight}px`;
    }
    if (wasStuck) { slot.classList.add('is-stuck'); }
  }
}

if (stickyHeadings.length > 0) {
  const topbarHeight = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--topbar-height'),
  ) || 44;
  const pinLine = topbarHeight + 2;
  let scheduled = false;
  const updateStuck = () => {
    scheduled = false;
    for (const slot of stickySlots) {
      slot.classList.toggle('is-stuck', slot.getBoundingClientRect().top <= pinLine);
    }
  };
  const scheduleStuck = () => {
    if (scheduled) { return; }
    scheduled = true;
    requestAnimationFrame(updateStuck);
  };
  window.addEventListener('scroll', scheduleStuck, { passive: true });
  window.addEventListener('resize', () => { measureStickyH2s(); scheduleStuck(); }, { passive: true });
  measureStickyH2s();
  updateStuck();
}

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
  // Newly-visible page's h2 slots haven't been measured yet (their h2s were
  // display:none on first load). Re-measure now that they're in flow.
  measureStickyH2s();
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
  // The inline init script in <head> sets html[data-page=…] so static CSS can
  // hide the SSR-default page before runtime loads. Now that runtime owns
  // visibility via .page-inactive, drop the attribute so its CSS doesn't pin
  // the original page visible when the user navigates away.
  document.documentElement.removeAttribute('data-page');
});

if (location.hash) {
  const el = document.getElementById(location.hash.slice(1));
  if (el) { el.scrollIntoView(); }
}

// ── Sidebar nav links ─────────────────────────────────────────────

nav.querySelectorAll('a[href^="#"]').forEach(l => l.addEventListener('click', e => {
  e.preventDefault();
  navigateTo(l.getAttribute('href'));
}));

// ── Components ────────────────────────────────────────────────────

registerComponents({ signalDemo, searchDocs, copyButton, pageTabs, comparisonsModal });
