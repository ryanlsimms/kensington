import { t } from 'kensington';
export function devtoolsMock() {
  return t.div({ class: 'devtools-mock', ariaHidden: 'true' }, [
    t.div({ class: 'dtm-header' }, [
      t.span('Kensington DevTools'),
      t.span({ class: 'dtm-close' }, '✕'),
    ]),
    t.div({ class: 'dtm-tabs' }, [
      t.button({ class: 'dtm-tab dtm-active' }, 'Signals'),
      t.button({ class: 'dtm-tab' }, 'Computed'),
      t.button({ class: 'dtm-tab' }, 'Effects'),
      t.button({ class: 'dtm-tab' }, 'DOM'),
      t.button({ class: 'dtm-tab' }, 'Log'),
    ]),
    t.div({ class: 'dtm-filter' }, [
      t.input({ class: 'dtm-filter-input', type: 'text', placeholder: 'Filter…', disabled: true }),
    ]),
    t.table({ class: 'dtm-table' }, [
      t.colgroup([
        t.col({ style: { width: '38px' } }),
        t.col(),
        t.col({ style: { width: '42px' } }),
        t.col({ style: { width: '30px' } }),
        t.col({ style: { width: '34px' } }),
      ]),
      t.thead(t.tr([
        t.th('ID'),
        t.th('Value'),
        t.th('Sets'),
        t.th({ class: 'dtm-center' }, 'DOM'),
        t.th('Sub'),
      ])),
      t.tbody([
        t.tr([
          t.td({ class: 'dtm-id' }, '#1'),
          t.td(t.span({ class: 'dtm-val' }, '"idle"')),
          t.td({ class: 'dtm-num' }, '×0'),
          t.td({ class: 'dtm-center dtm-eye-visible' }, '●'),
          t.td({ class: 'dtm-num' }, '1'),
        ]),
        t.tr([
          t.td({ class: 'dtm-id' }, '#2'),
          t.td(t.span({ class: 'dtm-val' }, '42')),
          t.td({ class: 'dtm-num' }, '×3'),
          t.td({ class: 'dtm-center dtm-eye-visible' }, '●'),
          t.td({ class: 'dtm-num' }, '2'),
        ]),
        t.tr([
          t.td({ class: 'dtm-id' }, '#3'),
          t.td(t.span({ class: 'dtm-val' }, '["a","b","c"]')),
          t.td({ class: 'dtm-num' }, '×1'),
          t.td({ class: 'dtm-center dtm-eye-hidden' }, '○'),
          t.td({ class: 'dtm-num' }, '1'),
        ]),
      ]),
    ]),
    t.div({ class: 'dtm-footer' }, [
      t.span('3 signals'),
      t.div({ class: 'dtm-totals' }, [
        t.span('×4 sets'),
        t.span('4 subs'),
      ]),
    ]),
  ]);
}
