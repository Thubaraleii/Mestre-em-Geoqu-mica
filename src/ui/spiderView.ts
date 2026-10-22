import { normalize } from '../diagrams/spiders';
import type { DiagramDef, Row } from '../core/types';

const NS = 'http://www.w3.org/2000/svg';
const COLORS = ['#B35A2E', '#2E7D73', '#222E2E', '#C9A227', '#7FB2A9', '#8A6B4A', '#D98E63', '#5E7370'];

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}, text?: string): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Spider: amostra/manto primitivo (log) por elemento, uma linha por amostra. */
export function renderSpider(def: DiagramDef, rows: Row[], labels: string[], groups: (string | undefined)[]): SVGSVGElement {
  const sp = def.spider!;
  const W = 900, H = 520, m = { l: 64, r: 150, t: 40, b: 70 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const series = rows.map((r) => normalize(r, sp.elements).values);
  const flat = series.flat().filter((v): v is number => v !== null);
  let lo = flat.length ? Math.floor(Math.log10(Math.min(...flat))) : 0;
  let hi = flat.length ? Math.ceil(Math.log10(Math.max(...flat))) : 3;
  if (hi <= lo) hi = lo + 1;
  const X = (i: number) => m.l + (sp.elements.length === 1 ? pw / 2 : (i * pw) / (sp.elements.length - 1));
  const Y = (v: number) => m.t + ph - ((Math.log10(v) - lo) / (hi - lo)) * ph;

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'font-family': 'system-ui, Segoe UI, Arial, sans-serif' });
  svg.append(el('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }));
  svg.append(el('text', { x: W / 2 - 40, y: 22, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600, fill: '#222' }, def.title));
  svg.append(el('rect', { x: m.l, y: m.t, width: pw, height: ph, fill: 'none', stroke: '#222' }));
  for (let k = lo; k <= hi; k++) {
    svg.append(el('line', { x1: m.l, x2: m.l + pw, y1: Y(10 ** k), y2: Y(10 ** k), stroke: '#ddd' }));
    svg.append(el('text', { x: m.l - 8, y: Y(10 ** k) + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#222' }, String(10 ** k)));
  }
  svg.append(el('text', { transform: `translate(16 ${m.t + ph / 2}) rotate(-90)`, 'text-anchor': 'middle', 'font-size': 12, fill: '#222' }, sp.ylabel));
  sp.elements.forEach((e, i) => {
    svg.append(el('line', { x1: X(i), x2: X(i), y1: m.t, y2: m.t + ph, stroke: '#eee' }));
    svg.append(el('text', { x: X(i), y: m.t + ph + 16, 'text-anchor': 'middle', 'font-size': 11, fill: '#222' }, e));
  });

  const uniq = [...new Set(groups.filter((g): g is string => !!g))];
  const colorOf = (i: number) => (groups[i] ? COLORS[uniq.indexOf(groups[i]!) % COLORS.length] : COLORS[0]);
  series.forEach((vals, i) => {
    const path = vals.map((v, j) => (v === null ? null : ([X(j), Y(v)] as [number, number]))).filter((p): p is [number, number] => p !== null);
    const g = el('g', { class: 'spider-line', 'data-id': i });
    g.append(el('title', {}, labels[i]));
    if (path.length > 1) g.append(el('polyline', { points: path.map((p) => p.join(',')).join(' '), fill: 'none', stroke: colorOf(i), 'stroke-width': 1.5 }));
    for (const p of path) g.append(el('circle', { cx: p[0], cy: p[1], r: 3, fill: colorOf(i), stroke: '#111', 'stroke-width': 0.6 }));
    svg.append(g);
  });
  uniq.forEach((g, i) => {
    const y = m.t + 10 + i * 20, x = W - m.r + 14;
    svg.append(el('circle', { cx: x, cy: y, r: 4, fill: COLORS[i % COLORS.length] }));
    svg.append(el('text', { x: x + 12, y: y + 4, 'font-size': 12, fill: '#222' }, g));
  });
  svg.append(el('text', { x: m.l, y: H - 10, 'font-size': 10, fill: '#666' }, sp.source));
  return svg;
}
