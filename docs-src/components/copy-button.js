import { t, signal, computed } from 'kensington';

export function copyButton() {
  const copied = signal(false);

  return t.button({
    class: computed(() => copied.get() ? 'copy-btn copied' : 'copy-btn'),
    onclick: e => {
      const wrap = e.currentTarget.closest('.code-wrap');
      const code = wrap?.querySelector('code') ?? wrap?.querySelector('pre');
      navigator.clipboard.writeText(code?.textContent ?? '').then(() => {
        copied.set(true);
        setTimeout(() => copied.set(false), 2000);
      });
    },
  }, computed(() => copied.get() ? 'Copied!' : 'Copy'));
}
