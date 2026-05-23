const STYLES = `
  :host {
    display: block;
    height: 6px;
    background: color-mix(in srgb, var(--color-border) 25%, var(--color-syn-bg));
    cursor: pointer;
    position: relative;
  }
  :host(.hidden) { display: none; }
  .thumb {
    position: absolute;
    top: 0;
    height: 100%;
    background: var(--color-border);
    cursor: grab;
    min-width: 24px;
  }
  :host(.dragging) .thumb { cursor: grabbing; }
`;

class ScrollBar extends HTMLElement {
  #pre = null;
  #thumb = null;
  #ro = null;
  #dragged = false;

  connectedCallback() {
    if (this.#thumb) { return; }
    const shadow = this.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = STYLES;
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    shadow.append(style, thumb);
    this.#thumb = thumb;
    this.#initDrag();
    this.#initTrackClick();
  }

  attach(pre) {
    this.#pre = pre;
    pre.addEventListener('scroll', () => this.#update(), { passive: true });
    this.#ro = new ResizeObserver(() => this.#update());
    this.#ro.observe(pre);
    this.#update();
  }

  #update() {
    const pre = this.#pre;
    if (!pre || !this.#thumb) { return; }
    const { clientWidth, scrollWidth, scrollLeft } = pre;
    const overflow = scrollWidth > clientWidth;
    this.classList.toggle('hidden', !overflow);
    if (!overflow) { return; }
    this.#thumb.style.width = (clientWidth / scrollWidth * 100) + '%';
    this.#thumb.style.left = (scrollLeft / scrollWidth * 100) + '%';
  }

  #initDrag() {
    const thumb = this.#thumb;

    thumb.addEventListener('mousedown', e => {
      e.preventDefault();
      const startX = e.clientX;
      const startScroll = this.#pre.scrollLeft;
      this.#dragged = false;
      this.classList.add('dragging');
      const onMove = e => {
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 2) { this.#dragged = true; }
        const { scrollWidth, clientWidth } = this.#pre;
        this.#pre.scrollLeft = startScroll + dx * scrollWidth / clientWidth;
      };
      const onUp = () => {
        this.classList.remove('dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    thumb.addEventListener('touchstart', e => {
      e.preventDefault();
      const startX = e.touches[0].clientX;
      const startScroll = this.#pre.scrollLeft;
      this.#dragged = false;
      this.classList.add('dragging');
      const onMove = e => {
        const dx = e.touches[0].clientX - startX;
        if (Math.abs(dx) > 2) { this.#dragged = true; }
        const { scrollWidth, clientWidth } = this.#pre;
        this.#pre.scrollLeft = startScroll + dx * scrollWidth / clientWidth;
      };
      const onEnd = () => {
        this.classList.remove('dragging');
        thumb.removeEventListener('touchmove', onMove);
        thumb.removeEventListener('touchend', onEnd);
      };
      thumb.addEventListener('touchmove', onMove, { passive: false });
      thumb.addEventListener('touchend', onEnd);
    }, { passive: false });
  }

  #initTrackClick() {
    this.addEventListener('click', e => {
      if (this.#dragged) { this.#dragged = false; return; }
      if (e.composedPath().includes(this.#thumb)) { return; }
      const rect = this.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const { scrollWidth, clientWidth } = this.#pre;
      this.#pre.scrollLeft = ratio * scrollWidth - clientWidth / 2;
    });
  }

  disconnectedCallback() {
    this.#ro?.disconnect();
  }
}

customElements.define('scroll-bar', ScrollBar);
