import type { Pt } from './geometry';
import type { DiagramDef, Panel } from './types';

export interface PlotPoint {
  id: string;
  label: string;
  xy: Pt;
  panel: string;
  group?: string;
  classification: string;
}

export interface RenderOptions {
  width?: number;
  height?: number;
  showLabels?: boolean;
}

const NS = 'http://www.w3.org/2000/svg';
const GROUP_COLORS = ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#444444'];
const TEXT = '#222';

type Attrs = Record<string, string | number>;

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Attrs = {}, text?: string): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

function niceStep(range: number, target = 8): number {
  const raw = range / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * pow;
}

function wrap(name: string, max = 15): string[] {
  const lines: string[] = [];
  for (const part of name.split('/')) {
    let cur = '';
    for (const w of part.split(' ')) {
      if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    }
    if (cur) lines.push(cur);
  }
  return lines;
}

function symbol(i: number, x: number, y: number, color: string): SVGElement {
  const r = 4.5;
  const common = { fill: color, stroke: '#111', 'stroke-width': 0.8 };
  switch (i % 4) {
    case 0: return el('circle', { cx: x, cy: y, r, ...common });
    case 1: return el('rect', { x: x - r, y: y - r, width: 2 * r, height: 2 * r, ...common });
    case 2: return el('polygon', { points: `${x},${y - r - 1} ${x + r + 1},${y + r} ${x - r - 1},${y + r}`, ...common });
    default: return el('polygon', { points: `${x},${y - r - 1} ${x + r + 1},${y} ${x},${y + r + 1} ${x - r - 1},${y}`, ...common });
  }
}

function bounds(def: DiagramDef): { x0: number; x1: number; y0: number; y1: number; ternary: boolean } {
  const cart = def.panels.find((p) => p.type === 'cartesian');
  if (cart?.xRange && cart.yRange) return { x0: cart.xRange[0], x1: cart.xRange[1], y0: cart.yRange[0], y1: cart.yRange[1], ternary: false };
  const pts = def.panels.flatMap((p) => p.outline ?? []);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), ternary: true };
}

export function renderDiagram(def: DiagramDef, points: PlotPoint[], opts: RenderOptions = {}): SVGSVGElement {
  const b = bounds(def);
  const W = opts.width ?? (b.ternary ? 640 : 760);
  const H = opts.height ?? (b.ternary ? 780 : 560);
  const groups = [...new Set(points.map((p) => p.group).filter((g): g is string => !!g))];
  const legendW = groups.length ? 160 : 0;
  const m = { l: b.ternary ? 50 : 64, r: (b.ternary ? 50 : 24) + legendW, t: 34, b: b.ternary ? 50 : 56 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  const sx = b.ternary ? Math.min(pw / bw, ph / bh) : pw / bw;
  const sy = b.ternary ? sx : ph / bh;
  const ox = m.l + (b.ternary ? (pw - bw * sx) / 2 : 0);
  const oy = m.t + ph - (b.ternary ? (ph - bh * sy) / 2 : 0);
  const X = (x: number) => ox + (x - b.x0) * sx;
  const Y = (y: number) => oy - (y - b.y0) * sy;
  const P = (p: Pt) => `${X(p[0]).toFixed(2)},${Y(p[1]).toFixed(2)}`;
  const pathOf = (poly: Pt[]) => 'M' + poly.map(P).join('L') + 'Z';

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'font-family': 'system-ui, Segoe UI, Arial, sans-serif' });
  svg.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }));
  svg.appendChild(el('text', { x: W / 2 - legendW / 2, y: 20, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600, fill: TEXT }, def.title));

  const fieldsG = el('g', { class: 'fields' });
  const labelsG = el('g', { class: 'field-labels', 'pointer-events': 'none' });
  for (const f of def.fields) {
    const path = el('path', { class: 'field', 'data-field-id': f.id, d: pathOf(f.polygon), fill: f.color, 'fill-opacity': 0.55, stroke: '#555', 'stroke-width': 0.8 });
    path.appendChild(el('title', {}, f.name));
    fieldsG.appendChild(path);
    if (opts.showLabels !== false) {
      const cx = f.polygon.reduce((s, p) => s + p[0], 0) / f.polygon.length;
      const cy = f.polygon.reduce((s, p) => s + p[1], 0) / f.polygon.length;
      const fs = b.ternary ? 7.5 : 10;
      let lines = wrap(f.name, b.ternary ? 13 : 14);
      if (f.short) {
        // nome só se couber no polígono; senão o código curto (o nome fica no hover e na lista de campos)
        const xs = f.polygon.map((p) => X(p[0])), ys = f.polygon.map((p) => Y(p[1]));
        const boxW = Math.max(...xs) - Math.min(...xs), boxH = Math.max(...ys) - Math.min(...ys);
        const needW = Math.max(...lines.map((l) => l.length)) * fs * 0.52, needH = lines.length * (fs + 1.5);
        if (boxW < needW || boxH < needH) lines = [f.short];
      }
      const t = el('text', { 'text-anchor': 'middle', 'font-size': fs, fill: TEXT });
      lines.forEach((ln, i) => t.appendChild(el('tspan', { x: X(cx).toFixed(2), y: (Y(cy) + (i - (lines.length - 1) / 2) * (fs + 1.5) + fs / 3).toFixed(2) }, ln)));
      labelsG.appendChild(t);
    }
  }
  svg.appendChild(fieldsG);
  for (const l of def.extraLines ?? []) {
    svg.appendChild(el('path', { class: 'extra', d: 'M' + l.points.map(P).join('L'), fill: 'none', stroke: '#000', 'stroke-width': 1.2, 'stroke-dasharray': '5 3' }));
  }
  svg.appendChild(labelsG);

  const decorate = (p: Panel) => {
    if (p.type === 'cartesian' && p.xRange && p.yRange) {
      svg.appendChild(el('rect', { x: X(p.xRange[0]), y: Y(p.yRange[1]), width: (p.xRange[1] - p.xRange[0]) * sx, height: (p.yRange[1] - p.yRange[0]) * sy, fill: 'none', stroke: '#222' }));
      const sxStep = niceStep(p.xRange[1] - p.xRange[0]), syStep = niceStep(p.yRange[1] - p.yRange[0]);
      for (let v = Math.ceil(p.xRange[0] / sxStep) * sxStep; v <= p.xRange[1] + 1e-9; v += sxStep) {
        svg.appendChild(el('line', { x1: X(v), x2: X(v), y1: Y(p.yRange[0]), y2: Y(p.yRange[0]) + 5, stroke: '#222' }));
        svg.appendChild(el('text', { x: X(v), y: Y(p.yRange[0]) + 18, 'text-anchor': 'middle', 'font-size': 11, fill: TEXT }, String(+v.toFixed(6))));
      }
      for (let v = Math.ceil(p.yRange[0] / syStep) * syStep; v <= p.yRange[1] + 1e-9; v += syStep) {
        svg.appendChild(el('line', { x1: X(p.xRange[0]) - 5, x2: X(p.xRange[0]), y1: Y(v), y2: Y(v), stroke: '#222' }));
        svg.appendChild(el('text', { x: X(p.xRange[0]) - 8, y: Y(v) + 4, 'text-anchor': 'end', 'font-size': 11, fill: TEXT }, String(+v.toFixed(6))));
      }
      if (p.xLabel) svg.appendChild(el('text', { x: X((p.xRange[0] + p.xRange[1]) / 2), y: H - 12, 'text-anchor': 'middle', 'font-size': 13, fill: TEXT }, p.xLabel));
      if (p.yLabel) svg.appendChild(el('text', { transform: `translate(16 ${Y((p.yRange[0] + p.yRange[1]) / 2)}) rotate(-90)`, 'text-anchor': 'middle', 'font-size': 13, fill: TEXT }, p.yLabel));
    }
    if (p.outline) svg.appendChild(el('path', { class: 'outline', d: pathOf(p.outline), fill: 'none', stroke: '#222', 'stroke-width': 1.4 }));
    for (const l of p.labels ?? []) {
      svg.appendChild(el('text', { x: X(l.at[0]), y: Y(l.at[1]) + 4, 'text-anchor': l.anchor ?? 'middle', 'font-size': 14, 'font-weight': 600, fill: TEXT }, l.text));
    }
  };
  def.panels.forEach(decorate);

  const ptsG = el('g', { class: 'points' });
  const tol = 1e-9;
  for (const pt of points) {
    const [px, py] = pt.xy;
    if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
    if (px < b.x0 - tol || px > b.x1 + tol || py < b.y0 - tol || py > b.y1 + tol) continue;
    const gi = pt.group ? groups.indexOf(pt.group) : -1;
    const color = gi >= 0 ? GROUP_COLORS[gi % GROUP_COLORS.length] : '#d62728';
    const g = el('g', { class: 'pt', 'data-id': pt.id });
    g.appendChild(el('title', {}, `${pt.label} — ${pt.classification}`));
    g.appendChild(symbol(gi < 0 ? 0 : gi, X(px), Y(py), color));
    ptsG.appendChild(g);
  }
  svg.appendChild(ptsG);

  groups.forEach((g, i) => {
    const item = el('g', { class: 'legend-item' });
    const ly = m.t + 10 + i * 20, lx = W - legendW + 10;
    item.appendChild(symbol(i, lx + 6, ly, GROUP_COLORS[i % GROUP_COLORS.length]));
    item.appendChild(el('text', { x: lx + 18, y: ly + 4, 'font-size': 12, fill: TEXT }, g));
    svg.appendChild(item);
  });
  return svg;
}
