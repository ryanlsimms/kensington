import { effect, signal, t } from 'kensington';

const modalRoot = document.createElement('div');
modalRoot.id = 'modal-root';
document.body.append(modalRoot);

const isOpen = signal(false);

function modal() {
  return t.div({
    class: 'overlay',
    onclick: e => {
      if (e.target === e.currentTarget) { isOpen.set(false); }
    },
  }, [
    t.div({ class: 'modal' }, [
      t.div({ class: 'modal-header' }, [
        t.h2({ class: 'modal-title' }, 'Portal modal'),
        t.button({
          type: 'button',
          class: 'close-btn',
          onclick: () => isOpen.set(false),
        }, [ '×']),
      ]),
      t.div({ class: 'modal-body' }, [
        t.p([
          'This modal is rendered into a ',
          t.code('#modal-root'),
          ' element appended to ',
          t.code('<body>'),
          ', not inside the app tree.',
        ]),
        t.p('Open the DOM inspector to confirm. The modal node is a sibling of the app, not a descendant.'),
      ]),
      t.div({ class: 'modal-footer' }, [
        t.button({ type: 'button', onclick: () => isOpen.set(false) }, 'Close'),
      ]),
    ]),
  ]);
}

let mountedModal = null;

effect(() => {
  if (isOpen.get()) {
    mountedModal = modal().toElement();
    modalRoot.append(mountedModal);
  } else if (mountedModal) {
    mountedModal.remove();
    mountedModal = null;
  }
});

const app = t.div([
  t.h1('Portal'),
  t.p({ class: 'description' }, [
    'Kensington has no portal API. To render into a different DOM subtree, create the element with ',
    t.code('toElement()'),
    ' and append it manually.',
  ]),
  t.button({ type: 'button', onclick: () => isOpen.set(true) }, 'Open modal'),
]);

document.body.append(app.toElement());
