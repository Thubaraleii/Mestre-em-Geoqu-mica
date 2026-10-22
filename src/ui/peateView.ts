import type { Classification } from '../core/types';
import { CRITERIA, PEATE_TYPES, ruleText, type PeateDetail } from '../diagrams/peate';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

const fmt = (v: number | null | undefined) => (v === null || v === undefined ? '—' : Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2));

/** Tabela 2 de Peate et al. (1992) com o veredito da amostra selecionada (✓ atende, ✗ não atende, – sem dado). */
export function renderPeateView(classes: Classification[], labels: string[], selected: number | null): HTMLElement {
  const root = el('div', 'criteria-view');
  root.append(el('h2', '', 'Critérios de classificação dos magma-tipos do Paraná'));
  root.append(el('p', 'note', 'Peate, Hawkesworth & Mantovani (1992), Bull. Volcanol. 55:119-139, Tabela 2. ">" e "<" são estritos; faixas (a – b) são inclusivas. Óxidos em wt%, elementos em ppm; Ti (ppm) = TiO₂ × 5993,2.'));

  // contagem por magma-tipo
  const counts = new Map<string, number>();
  const bump = (k: string) => counts.set(k, (counts.get(k) ?? 0) + 1);
  for (const c of classes) {
    if (c.status === 'ok' && c.fieldId) bump(PEATE_TYPES.find((t) => t.id === c.fieldId)!.name);
    else if (c.status === 'ambiguo') bump('Ambíguo');
    else if (c.status === 'nao classificado') bump('Não classificado');
    else bump(c.status === 'ausente' ? 'Dados insuficientes' : 'Inválido');
  }
  if (classes.length) {
    const parts = [...counts].map(([k, v]) => `${k}: ${v}`);
    root.append(el('p', 'tally', `${classes.length} amostras — ${parts.join(' · ')}`));
  }

  const sel = selected !== null ? classes[selected] : undefined;
  const detail = sel?.detail as PeateDetail | undefined;
  if (sel) {
    root.append(el('p', 'selected-line', `Amostra selecionada: ${labels[selected!]} → ${sel.name ?? sel.status}`));
    if (sel.message) root.append(el('p', 'note', sel.message));
  } else {
    root.append(el('p', 'note', 'Carregue dados e clique numa linha da tabela para ver, critério a critério, o que a amostra atende.'));
  }

  const table = el('table', 'criteria');
  const thead = el('thead');
  const g = el('tr');
  g.append(el('th', '', ''), el('th', '', ''));
  const hi = el('th', 'grp', "'High-Ti'"); hi.colSpan = 3;
  const lo = el('th', 'grp', "'Low-Ti'"); lo.colSpan = 3;
  g.append(hi, lo);
  const h2 = el('tr');
  h2.append(el('th', '', 'Critério'), el('th', 'val', 'Amostra'));
  for (const t of PEATE_TYPES) h2.append(el('th', 'type', t.name));
  thead.append(g, h2);

  const tbody = el('tbody');
  for (const c of CRITERIA) {
    const tr = el('tr');
    tr.append(el('th', 'crit', c.unit ? `${c.label} (${c.unit})` : c.label));
    tr.append(el('td', 'val', detail ? fmt(detail.values[c.id]) : ''));
    for (const t of PEATE_TYPES) {
      const v = detail?.perType[t.id].results[c.id];
      const mark = v === 'ok' ? '✓' : v === 'fail' ? '✗' : v === 'na' ? '–' : '';
      const td = el('td', `rule ${v ?? ''}`.trim(), ruleText(t.rules[c.id]));
      if (mark) td.append(el('span', 'mark', ` ${mark}`));
      tr.append(td);
    }
    tbody.append(tr);
  }

  const tfoot = el('tfoot');
  const foot = el('tr');
  foot.append(el('th', 'crit', 'Critérios fora'), el('td', 'val', detail ? `${detail.evaluable} avaliados` : ''));
  for (const t of PEATE_TYPES) {
    const f = detail?.perType[t.id].fails;
    foot.append(el('td', `fails ${f === 0 ? 'ok' : f === undefined ? '' : 'fail'}`.trim(), f === undefined ? '' : String(f)));
  }
  tfoot.append(foot);

  table.append(thead, tbody, tfoot);
  root.append(table);
  return root;
}
