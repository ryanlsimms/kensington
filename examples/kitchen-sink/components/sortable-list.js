class SortableList extends HTMLElement {
  #dragKey = null;
  /** @type {MutationObserver | null} */
  #observer = null;

  connectedCallback() {
    this.#markDraggable();
    const observer = new MutationObserver(() => this.#markDraggable());
    this.#observer = observer;
    observer.observe(this, { childList: true, subtree: true });
    this.addEventListener('dragstart', this.#onDragStart);
    this.addEventListener('dragover', this.#onDragOver);
    this.addEventListener('dragleave', this.#onDragLeave);
    this.addEventListener('drop', this.#onDrop);
    this.addEventListener('dragend', this.#onDragEnd);
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.removeEventListener('dragstart', this.#onDragStart);
    this.removeEventListener('dragover', this.#onDragOver);
    this.removeEventListener('dragleave', this.#onDragLeave);
    this.removeEventListener('drop', this.#onDrop);
    this.removeEventListener('dragend', this.#onDragEnd);
  }

  #markDraggable() {
    for (const el of /** @type {NodeListOf<HTMLElement>} */ (this.querySelectorAll('[data-key]'))) {
      el.draggable = true;
    }
  }

  #item(e) {
    return e.target.closest('[data-key]');
  }

  #onDragStart = e => {
    const item = this.#item(e);
    if (!item) { return; }
    this.#dragKey = item.dataset.key;
    e.dataTransfer.setData('text/plain', this.#dragKey);
    e.dataTransfer.effectAllowed = 'move';
    item.classList.add('dragging');
  };

  #onDragOver = e => {
    const item = this.#item(e);
    if (!item) { return; }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    item.classList.add('drag-over');
  };

  #onDragLeave = e => {
    const item = this.#item(e);
    if (!item) { return; }
    if (!item.contains(e.relatedTarget)) {
      item.classList.remove('drag-over');
    }
  };

  #onDrop = e => {
    const item = this.#item(e);
    if (!item) { return; }
    e.preventDefault();
    item.classList.remove('drag-over');
    const fromKey = this.#dragKey;
    const toKey = item.dataset.key;
    this.#dragKey = null;
    if (fromKey && fromKey !== toKey) {
      this.dispatchEvent(new CustomEvent('reorder', {
        bubbles: true,
        detail: { fromKey, toKey },
      }));
    }
  };

  #onDragEnd = e => {
    const item = this.#item(e);
    if (item) {
      item.classList.remove('dragging');
    }
    this.#dragKey = null;
  };
}

customElements.define('k-sortable-list', SortableList);
