const STYLES = `
  :host {
    display: block;
    cursor: pointer;
    position: relative;
    background: color-mix(in srgb, var(--color-border) 25%, var(--color-syn-bg));
  }
  :host(:not([vertical])) {
    height: 6px;
  }
  :host([vertical]) {
    width: 6px;
    height: 100%;
  }
  :host(.hidden) { display: none; }
  .thumb {
    position: absolute;
    background: var(--color-border);
    cursor: grab;
  }
  :host(:not([vertical])) .thumb {
    top: 0;
    height: 100%;
    min-width: 24px;
  }
  :host([vertical]) .thumb {
    left: 0;
    width: 100%;
    min-height: 24px;
  }
  :host(.dragging) .thumb { cursor: grabbing; }
`;

class ScrollBar extends HTMLElement {
  #el = null;
  #axis = 'x';
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

  attach(el, { axis = 'x' } = {}) {
    this.#el = el;
    this.#axis = axis;
    if (axis === 'y') {
      this.setAttribute('vertical', '');
    }
    el.addEventListener('scroll', () => this.#update(), { passive: true });
    this.#ro = new ResizeObserver(() => this.#update());
    this.#ro.observe(el);
    this.#update();
  }

  #update() {
    const el = this.#el;
    if (!el || !this.#thumb) { return; }
    if (this.#axis === 'y') {
      const { clientHeight, scrollHeight, scrollTop } = el;
      const overflow = scrollHeight > clientHeight;
      this.classList.toggle('hidden', !overflow);
      if (!overflow) { return; }
      this.#thumb.style.height = (clientHeight / scrollHeight * 100) + '%';
      this.#thumb.style.top = (scrollTop / scrollHeight * 100) + '%';
    } else {
      const { clientWidth, scrollWidth, scrollLeft } = el;
      const overflow = scrollWidth > clientWidth;
      this.classList.toggle('hidden', !overflow);
      if (!overflow) { return; }
      this.#thumb.style.width = (clientWidth / scrollWidth * 100) + '%';
      this.#thumb.style.left = (scrollLeft / scrollWidth * 100) + '%';
    }
  }

  #initDrag() {
    const thumb = this.#thumb;

    thumb.addEventListener('mousedown', e => {
      e.preventDefault();
      const isY = this.#axis === 'y';
      const startPos = isY ? e.clientY : e.clientX;
      const startScroll = isY ? this.#el.scrollTop : this.#el.scrollLeft;
      this.#dragged = false;
      this.classList.add('dragging');
      const onMove = e => {
        const d = (isY ? e.clientY : e.clientX) - startPos;
        if (Math.abs(d) > 2) { this.#dragged = true; }
        if (isY) {
          this.#el.scrollTop = startScroll + d * this.#el.scrollHeight / this.#el.clientHeight;
        } else {
          this.#el.scrollLeft = startScroll + d * this.#el.scrollWidth / this.#el.clientWidth;
        }
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
      const isY = this.#axis === 'y';
      const startPos = isY ? e.touches[0].clientY : e.touches[0].clientX;
      const startScroll = isY ? this.#el.scrollTop : this.#el.scrollLeft;
      this.#dragged = false;
      this.classList.add('dragging');
      const onMove = e => {
        const d = (isY ? e.touches[0].clientY : e.touches[0].clientX) - startPos;
        if (Math.abs(d) > 2) { this.#dragged = true; }
        if (isY) {
          this.#el.scrollTop = startScroll + d * this.#el.scrollHeight / this.#el.clientHeight;
        } else {
          this.#el.scrollLeft = startScroll + d * this.#el.scrollWidth / this.#el.clientWidth;
        }
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
      if (this.#axis === 'y') {
        const ratio = (e.clientY - rect.top) / rect.height;
        this.#el.scrollTop = ratio * this.#el.scrollHeight - this.#el.clientHeight / 2;
      } else {
        const ratio = (e.clientX - rect.left) / rect.width;
        this.#el.scrollLeft = ratio * this.#el.scrollWidth - this.#el.clientWidth / 2;
      }
    });
  }

  disconnectedCallback() {
    this.#ro?.disconnect();
  }
}

customElements.define('scroll-bar', ScrollBar);
