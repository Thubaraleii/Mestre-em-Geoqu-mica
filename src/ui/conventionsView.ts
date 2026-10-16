// Convenções litológicas cartográficas: padrões desenhados pelo app (SVG) a partir da legenda de referência do usuário,
// com a cor sugerida de cada rocha. Os desenhos são aproximações dos símbolos, não cópias das figuras do livro.
const NS = 'http://www.w3.org/2000/svg';

type Layer =
  | { kind: 'marks'; glyph: '+' | 'v' | '^' | 'L' | 'x' | 'dot' | 'circle' | 'dash' | 'tick' | 'c'; dx: number; dy: number; size?: number; offset?: boolean }
  | { kind: 'bricks'; slant?: boolean; w?: number; h?: number }
  | { kind: 'hlines'; gap: number; dashed?: boolean }
  | { kind: 'diag'; gap: number; dir?: 1 | -1 }
  | { kind: 'wave'; gap: number }
  | { kind: 'angular' };

export interface Lithology { name: string; group: 'Rochas ígneas' | 'Rochas metamórficas' | 'Rochas sedimentares'; color?: string; layers: Layer[] }

export const TINT: Record<string, string> = {
  'Vermelho': '#f4b6b6', 'Verde escuro': '#9cc9a0', 'Cor de rosa': '#f9d0dc', 'Verde intermediário': '#bde0b5', 'Verde claro': '#d7efc8',
  'Azul escuro': '#9db8e6', 'Azul claro': '#cfe0f7', 'Marrom': '#d9bfa0', 'Amarelo / Alaranjado': '#fbe7a1', 'Cinza / Marrom': '#d4cbc2',
  'Lilás / Roxo': '#d9c7ee', 'Salmão': '#f6c7b0', 'Vermelho claro': '#f8d4d4',
};

const dots = (dx = 9, dy = 9): Layer => ({ kind: 'marks', glyph: 'dot', dx, dy, offset: true });

export const LITHOLOGIES: Lithology[] = [
  { name: 'Granito', group: 'Rochas ígneas', color: 'Vermelho', layers: [{ kind: 'marks', glyph: '+', dx: 14, dy: 12, size: 4, offset: true }] },
  { name: 'Diabásio', group: 'Rochas ígneas', color: 'Verde escuro', layers: [{ kind: 'marks', glyph: 'v', dx: 14, dy: 12, size: 4, offset: true }] },
  { name: 'Basalto', group: 'Rochas ígneas', color: 'Verde escuro', layers: [{ kind: 'marks', glyph: 'v', dx: 9, dy: 9, size: 3 }] },
  { name: 'Riolito', group: 'Rochas ígneas', color: 'Cor de rosa', layers: [{ kind: 'marks', glyph: '+', dx: 10, dy: 12, size: 3, offset: true }, dots(10, 6)] },
  { name: 'Andesito', group: 'Rochas ígneas', color: 'Verde intermediário', layers: [{ kind: 'marks', glyph: 'x', dx: 18, dy: 12, size: 3 }, { kind: 'marks', glyph: 'v', dx: 18, dy: 12, size: 3, offset: true }] },
  { name: 'Gabro / Piroxenito', group: 'Rochas ígneas', color: 'Verde escuro', layers: [{ kind: 'marks', glyph: '^', dx: 14, dy: 12, size: 4, offset: true }] },
  { name: 'Sienito', group: 'Rochas ígneas', color: 'Verde claro', layers: [{ kind: 'marks', glyph: 'L', dx: 14, dy: 12, size: 4, offset: true }] },
  { name: 'Mármore calcítico', group: 'Rochas metamórficas', color: 'Azul escuro', layers: [{ kind: 'bricks' }] },
  { name: 'Mármore dolomítico', group: 'Rochas metamórficas', color: 'Azul claro', layers: [{ kind: 'bricks', slant: true }] },
  { name: 'Filito', group: 'Rochas metamórficas', color: 'Marrom', layers: [{ kind: 'marks', glyph: 'tick', dx: 10, dy: 9, size: 4, offset: true }] },
  { name: 'Quartzito', group: 'Rochas metamórficas', color: 'Amarelo / Alaranjado', layers: [dots(5, 5)] },
  { name: 'Metassiltito', group: 'Rochas metamórficas', color: 'Cinza / Marrom', layers: [{ kind: 'diag', gap: 8 }, { kind: 'marks', glyph: 'tick', dx: 16, dy: 12, size: 3, offset: true }] },
  { name: 'Metarritmito', group: 'Rochas metamórficas', color: 'Cinza / Marrom', layers: [{ kind: 'diag', gap: 7 }] },
  { name: 'Xisto', group: 'Rochas metamórficas', color: 'Lilás / Roxo', layers: [{ kind: 'wave', gap: 12 }, { kind: 'marks', glyph: 'tick', dx: 14, dy: 12, size: 3, offset: true }] },
  { name: 'Gnaisse', group: 'Rochas metamórficas', color: 'Salmão', layers: [{ kind: 'wave', gap: 9 }, { kind: 'diag', gap: 18, dir: -1 }] },
  { name: 'Migmatito', group: 'Rochas metamórficas', color: 'Vermelho claro', layers: [{ kind: 'wave', gap: 10 }, { kind: 'marks', glyph: 'dash', dx: 16, dy: 14, size: 5, offset: true }] },
  { name: 'Calcário', group: 'Rochas sedimentares', layers: [{ kind: 'bricks' }] },
  { name: 'Dolomito', group: 'Rochas sedimentares', layers: [{ kind: 'bricks', slant: true }] },
  { name: 'Calcarenito', group: 'Rochas sedimentares', layers: [{ kind: 'bricks', w: 14, h: 7 }] },
  { name: 'Calcário estratificado', group: 'Rochas sedimentares', layers: [{ kind: 'bricks', w: 22, h: 14 }, { kind: 'hlines', gap: 14 }] },
  { name: 'Calcário oolítico', group: 'Rochas sedimentares', layers: [{ kind: 'bricks' }, { kind: 'marks', glyph: 'circle', dx: 20, dy: 10, size: 2 }] },
  { name: 'Folhelho', group: 'Rochas sedimentares', layers: [{ kind: 'hlines', gap: 8, dashed: true }] },
  { name: 'Folhelho com níveis calcários', group: 'Rochas sedimentares', layers: [{ kind: 'hlines', gap: 8, dashed: true }, { kind: 'bricks', w: 24, h: 16 }] },
  { name: 'Folhelho carbonoso', group: 'Rochas sedimentares', layers: [{ kind: 'hlines', gap: 8, dashed: true }, { kind: 'marks', glyph: 'c', dx: 16, dy: 8, size: 3, offset: true }] },
  { name: 'Argilito', group: 'Rochas sedimentares', layers: [{ kind: 'hlines', gap: 6, dashed: true }] },
  { name: 'Siltito', group: 'Rochas sedimentares', layers: [{ kind: 'hlines', gap: 8, dashed: true }, dots(8, 8)] },
  { name: 'Arenito', group: 'Rochas sedimentares', layers: [dots(7, 7)] },
  { name: 'Arenito argiloso', group: 'Rochas sedimentares', layers: [dots(7, 7), { kind: 'hlines', gap: 14, dashed: true }] },
  { name: 'Arenito com níveis calcários', group: 'Rochas sedimentares', layers: [dots(7, 7), { kind: 'bricks', w: 24, h: 16 }] },
  { name: 'Conglomerado', group: 'Rochas sedimentares', layers: [dots(8, 8), { kind: 'marks', glyph: 'circle', dx: 18, dy: 14, size: 3, offset: true }] },
  { name: 'Brecha', group: 'Rochas sedimentares', layers: [{ kind: 'angular' }] },
  { name: 'Diamictito', group: 'Rochas sedimentares', layers: [dots(8, 8), { kind: 'angular' }] },
  { name: 'Tilito', group: 'Rochas sedimentares', layers: [{ kind: 'bricks', w: 14, h: 10 }, dots(8, 8)] },
];

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

const W = 96, H = 60;

function drawLayer(svg: SVGSVGElement, l: Layer): void {
  const stroke = { stroke: '#222', 'stroke-width': 0.9, fill: 'none' };
  if (l.kind === 'marks') {
    let row = 0;
    for (let y = l.dy / 2; y < H; y += l.dy, row++) {
      for (let x = (l.offset && row % 2 ? l.dx / 2 : 0) + l.dx / 2; x < W; x += l.dx) {
        const s = l.size ?? 3;
        switch (l.glyph) {
          case '+': svg.append(el('path', { d: `M${x - s} ${y}H${x + s}M${x} ${y - s}V${y + s}`, ...stroke })); break;
          case 'x': svg.append(el('path', { d: `M${x - s} ${y - s}L${x + s} ${y + s}M${x - s} ${y + s}L${x + s} ${y - s}`, ...stroke })); break;
          case 'v': svg.append(el('path', { d: `M${x - s} ${y - s}L${x} ${y + s}L${x + s} ${y - s}`, ...stroke })); break;
          case '^': svg.append(el('path', { d: `M${x - s} ${y + s}L${x} ${y - s}L${x + s} ${y + s}`, ...stroke })); break;
          case 'L': svg.append(el('path', { d: `M${x - s} ${y - s}V${y + s}H${x + s}`, ...stroke })); break;
          case 'dot': svg.append(el('circle', { cx: x, cy: y, r: 0.9, fill: '#222' })); break;
          case 'circle': svg.append(el('circle', { cx: x, cy: y, r: s, ...stroke })); break;
          case 'dash': svg.append(el('path', { d: `M${x - s} ${y}H${x + s}`, ...stroke })); break;
          case 'tick': svg.append(el('path', { d: `M${x - s} ${y + s / 2}L${x + s} ${y - s / 2}`, ...stroke })); break;
          case 'c': svg.append(el('path', { d: `M${x + s} ${y - s}A${s} ${s} 0 1 0 ${x + s} ${y + s}`, ...stroke })); break;
        }
      }
    }
  } else if (l.kind === 'bricks') {
    const w = l.w ?? 20, h = l.h ?? 10;
    for (let y = 0, r = 0; y <= H; y += h, r++) {
      svg.append(el('path', { d: `M0 ${y}H${W}`, ...stroke }));
      for (let x = (r % 2 ? w / 2 : 0); x <= W; x += w) {
        svg.append(el('path', { d: l.slant ? `M${x} ${y}L${x + h / 2} ${Math.min(y + h, H)}` : `M${x} ${y}V${Math.min(y + h, H)}`, ...stroke }));
      }
    }
  } else if (l.kind === 'hlines') {
    for (let y = l.gap / 2; y < H; y += l.gap) svg.append(el('path', { d: `M4 ${y}H${W - 4}`, ...stroke, ...(l.dashed ? { 'stroke-dasharray': '6 3' } : {}) }));
  } else if (l.kind === 'diag') {
    const d = l.dir ?? 1;
    for (let k = -H; k < W + H; k += l.gap) svg.append(el('path', { d: d === 1 ? `M${k} ${H}L${k + H} 0` : `M${k} 0L${k + H} ${H}`, ...stroke }));
  } else if (l.kind === 'wave') {
    for (let y = l.gap / 2; y < H; y += l.gap) {
      let d = `M0 ${y}`;
      for (let x = 0; x < W; x += 12) d += `q3 -3 6 0t6 0`;
      svg.append(el('path', { d, ...stroke }));
    }
  } else {
    for (const [x, y, s] of [[14, 12, 8], [40, 20, 10], [70, 14, 9], [24, 42, 9], [56, 44, 8], [80, 40, 8]] as [number, number, number][]) {
      svg.append(el('path', { d: `M${x} ${y - s / 2}L${x + s / 2} ${y - s / 4}L${x + s / 3} ${y + s / 2}L${x - s / 3} ${y + s / 2}L${x - s / 2} ${y - s / 5}Z`, ...stroke }));
    }
  }
}

export function lithologySwatch(l: Lithology): SVGSVGElement {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H });
  const clip = el('clipPath', { id: `clip-${l.name.replace(/\W+/g, '-')}` });
  clip.append(el('rect', { x: 0, y: 0, width: W, height: H }));
  svg.append(clip);
  svg.append(el('rect', { x: 0, y: 0, width: W, height: H, fill: l.color ? TINT[l.color] : '#ffffff' }));
  const g = el('g', { 'clip-path': `url(#${clip.getAttribute('id')})` });
  svg.append(g);
  for (const layer of l.layers) {
    const tmp = el('svg', { viewBox: `0 0 ${W} ${H}` });
    drawLayer(tmp, layer);
    g.append(...tmp.childNodes);
  }
  svg.append(el('rect', { x: 0.5, y: 0.5, width: W - 1, height: H - 1, fill: 'none', stroke: '#111', 'stroke-width': 1.2 }));
  return svg;
}

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function renderLithology(): HTMLElement {
  const root = h('div', 'criteria-view conventions');
  root.append(h('h2', '', 'Convenções litológicas cartográficas'));
  root.append(h('p', 'note', 'Padrões desenhados pelo app a partir da legenda de referência (aproximações dos símbolos). A cor de fundo é a cor sugerida para a rocha no mapa; sem cor indicada na legenda, o fundo é branco.'));
  for (const group of ['Rochas ígneas', 'Rochas metamórficas', 'Rochas sedimentares'] as const) {
    root.append(h('h3', '', group));
    const grid = h('div', 'swatch-grid');
    for (const l of LITHOLOGIES.filter((x) => x.group === group)) {
      const item = h('figure', 'lit-swatch');
      item.dataset.name = l.name;
      item.append(lithologySwatch(l), h('figcaption', '', l.name));
      if (l.color) item.append(h('small', '', l.color));
      grid.append(item);
    }
    root.append(grid);
  }
  return root;
}
