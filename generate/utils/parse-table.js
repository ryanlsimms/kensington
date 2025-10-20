export default function parseTable(table, prop, otherProps) {
  return [...table.querySelectorAll('tbody tr')].map(tr => {
    return {
      [prop]: (tr.querySelector('th') ?? tr.querySelector('td:first-child')).textContent.trim(),
      ...Object.fromEntries(otherProps.map(([key, index]) => {
        const cell = tr.querySelector(`td:nth-child(${index})`);
        const cellContents = cell.textContent.trim().split(/;/).map(el => el.trim());
        return [key, cellContents]
      })),
    }
  });
}
