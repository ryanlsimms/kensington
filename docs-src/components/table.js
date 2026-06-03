import { t } from 'kensington';
export function apiTable(headers, rows) {
  return t.table([
    t.thead(t.tr(headers.map(h => t.th(h)))),
    t.tbody(rows.map(row =>
      t.tr(row.map((cell, i) =>
        t.td({ dataLabel: headers[i] }, cell),
      )),
    )),
  ]);
}
