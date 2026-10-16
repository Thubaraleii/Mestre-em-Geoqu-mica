import type { Classification, DiagramDef } from '../core/types';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Tabela de referência do módulo; as linhas das classes das amostras ficam destacadas e contadas. */
export function renderTableView(def: DiagramDef, classes: Classification[], labels: string[], selected: number | null): HTMLElement {
  const t = def.referenceTable!;
  const root = el('div', 'criteria-view table-view');
  root.append(el('h2', '', def.title));
  if (t.note) root.append(el('p', 'note', t.note));

  const counts = new Map<string, number>();
  for (const c of classes) if (c.name) counts.set(c.name, (counts.get(c.name) ?? 0) + 1);
  const sel = selected !== null ? classes[selected] : undefined;
  if (sel) {
    root.append(el('p', 'selected-line', `Amostra selecionada: ${labels[selected!]} → ${sel.name ?? sel.status}`));
    if (sel.message) root.append(el('p', 'note', sel.message));
  } else if (def.kind === 'table') {
    root.append(el('p', 'note', 'Carregue dados e clique numa linha da tabela para ver a classe da amostra destacada aqui.'));
  }

  const showCounts = def.kind === 'table' && classes.length > 0;
  const table = el('table', 'criteria reftable');
  const head = el('tr');
  t.head.forEach((h) => head.append(el('th', '', h)));
  if (showCounts) head.append(el('th', 'val', 'Amostras'));
  const thead = el('thead');
  thead.append(head);
  table.append(thead);
  const body = el('tbody');
  for (const row of t.rows) {
    const tr = el('tr');
    tr.dataset.key = row[0];
    const n = counts.get(row[0]) ?? 0;
    if (n > 0) tr.classList.add('hit');
    if (sel?.name === row[0]) tr.classList.add('sel');
    row.forEach((cell, i) => tr.append(el(i === 0 ? 'th' : 'td', i === 0 ? 'crit' : '', cell)));
    if (showCounts) tr.append(el('td', 'val', n ? String(n) : ''));
    body.append(tr);
  }
  table.append(body);
  root.append(table);
  return root;
}
