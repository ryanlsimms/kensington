import { effect } from 'kensington';

import { activeSection } from './state.js';

const nav = document.getElementById('sidebar');

let lastActiveLinks = [];
let lastTargets = [];
let userHasScrolled = false;

function updateScrollspy() {
  if (!lastActiveLinks.length) { return; }
  const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;
  let active = lastTargets[0];
  if (nearBottom) {
    active = lastTargets[lastTargets.length - 1];
  } else {
    for (const el of lastTargets) {
      if (el.getBoundingClientRect().top <= 160) { active = el; }
    }
  }
  activeSection.set(active ? active.id : null);
}

export function initScrollspy() {
  userHasScrolled = false;
  const visibleNav = nav.querySelector('[data-page-nav]:not(.page-inactive)');
  lastActiveLinks = visibleNav ? Array.from(visibleNav.querySelectorAll('ul a[href^="#"]')) : [];
  const linkIds = new Set(lastActiveLinks.map(l => l.getAttribute('href').slice(1)));
  lastTargets = Array.from(
    document.querySelectorAll('[data-page-content]:not(.page-inactive) [id]'),
  ).filter(el => linkIds.has(el.id));
  updateScrollspy();
}

function scrollNavToActive(link) {
  const sidebarPages = nav.querySelector('.sidebar-pages');
  const sidebarPagesBottom = sidebarPages?.getBoundingClientRect().bottom;
  const navTop = nav.getBoundingClientRect().top;
  const topBoundary = sidebarPages ? sidebarPagesBottom : navTop;
  const navBottom = nav.getBoundingClientRect().bottom;
  const linkRect = link.getBoundingClientRect();
  if (linkRect.top < topBoundary) {
    nav.scrollTop -= topBoundary - linkRect.top + 16;
  } else if (linkRect.bottom > navBottom) {
    nav.scrollTop += linkRect.bottom - navBottom + 16;
  }
}

effect(() => {
  const active = activeSection.get();
  lastActiveLinks.forEach(l => l.classList.remove('active'));
  if (active) {
    const link = lastActiveLinks.find(l => l.getAttribute('href') === `#${active}`);
    if (link) {
      link.classList.add('active');
      scrollNavToActive(link);
    }
    if (userHasScrolled) {
      history.replaceState(null, '', `#${active}`);
    }
  }
});

window.addEventListener('scroll', () => {
  userHasScrolled = true;
  updateScrollspy();
}, { passive: true });
