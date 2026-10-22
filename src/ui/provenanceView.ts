import { provenanceOf, schemeId, STATUS_LABEL } from '../diagrams/provenance';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function list(title: string, items: string[], cls: string): HTMLElement | null {
  if (!items.length) return null;
  const box = el('div', cls);
  box.append(el('strong', '', title));
  const ul = el('ul');
  for (const i of items) ul.append(el('li', '', i));
  box.append(ul);
  return box;
}

/** Selo de procedência do esquema + detalhes recolhíveis: fontes, o que foi conferido e o que NÃO foi. */
export function renderProvenance(id: string): HTMLElement {
  const p = provenanceOf(id);
  const root = el('details', 'provenance');
  root.dataset.status = p.status;
  const sum = el('summary');
  sum.append(el('span', `badge badge-${p.status}`, STATUS_LABEL[p.status]), el('span', 'scheme-id', schemeId(id)));
  if (p.pending.length) sum.append(el('span', 'pending-count', `${p.pending.length} ponto${p.pending.length > 1 ? 's' : ''} a conferir`));
  root.append(sum);
  const body = el('div', 'prov-body');
  for (const b of [list('Fontes', p.sources, 'prov-sources'), list('Conferido', p.verified, 'prov-verified'), list('A conferir / limitações', p.pending, 'prov-pending')]) if (b) body.append(b);
  root.append(body);
  return root;
}
