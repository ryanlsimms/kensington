(function docsInit() {
  // scrollspy
  const links = document.querySelectorAll('nav#sidebar ul a[href^="#"]');
  const linkMap = new Map(Array.from(links, l => [l.getAttribute('href').slice(1), l]));
  const targets = Array.from(document.querySelectorAll('[id]')).filter(el => linkMap.has(el.id));

  function update() {
    const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;
    let active = targets[0];
    if (nearBottom) {
      active = targets[targets.length - 1];
    } else {
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= 80) { active = el; }
      }
    }
    links.forEach(l => l.classList.remove('active'));
    if (active) { linkMap.get(active.id).classList.add('active'); }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();

  // mobile menu
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('menu-backdrop');
  const closeIcon =
    '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
    '<path d="M2 2L16 16M16 2L2 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const openIcon = toggle.innerHTML;

  function openMenu() {
    sidebar.classList.add('open');
    backdrop.classList.add('open');
    toggle.innerHTML = closeIcon;
    toggle.setAttribute('aria-label', 'Close navigation');
  }

  function closeMenu() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('open');
    toggle.innerHTML = openIcon;
    toggle.setAttribute('aria-label', 'Open navigation');
  }

  toggle.addEventListener('click', () => sidebar.classList.contains('open') ? closeMenu() : openMenu());
  backdrop.addEventListener('click', closeMenu);
  links.forEach(l => l.addEventListener('click', closeMenu));

  // copy buttons
  document.querySelectorAll('pre[class*="language-"]').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code');
      navigator.clipboard.writeText((code ?? pre).textContent).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
    pre.appendChild(btn);
  });
}());
