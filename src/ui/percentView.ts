// Estimativa visual de porcentagem: círculos com grãos desenhados por código (sem copiar as figuras do livro).
const NS = 'http://www.w3.org/2000/svg';
const R = 60;

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** Quantidade de grãos para cobrir `percent`% da área, descontando a sobreposição aleatória: n = -ln(1-p) · A / a */
export function dotCount(percent: number, rx: number, ry: number): number {
  const p = Math.min(Math.max(percent, 0), 99) / 100;
  return Math.max(0, Math.round((-Math.log(1 - p) * R * R) / (rx * ry))); // max evita -0
}

export function percentCircle(percent: number, grain: number, seed = 1): SVGSVGElement {
  const rx = grain * 1.35, ry = grain * 0.7;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `${-R - 2} ${-R - 2} ${2 * R + 4} ${2 * R + 4}`);
  svg.setAttribute('width', '120'); svg.setAttribute('height', '120');
  const c = document.createElementNS(NS, 'circle');
  c.setAttribute('r', String(R)); c.setAttribute('fill', '#fff'); c.setAttribute('stroke', '#222'); c.setAttribute('stroke-width', '1.2');
  svg.append(c);
  const rand = rng(seed * 7919 + Math.round(percent * 100));
  const n = dotCount(percent, rx, ry);
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * (R - rx - 1);
    const e = document.createElementNS(NS, 'ellipse');
    e.setAttribute('cx', (Math.cos(a) * d).toFixed(2)); e.setAttribute('cy', (Math.sin(a) * d).toFixed(2));
    e.setAttribute('rx', rx.toFixed(2)); e.setAttribute('ry', ry.toFixed(2));
    e.setAttribute('transform', `rotate(${Math.round(rand() * 180)} ${(Math.cos(a) * d).toFixed(2)} ${(Math.sin(a) * d).toFixed(2)})`);
    e.setAttribute('fill', '#111');
    svg.append(e);
  }
  return svg;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

const COARSE = 3.2, FINE = 1.5;

export function renderPercentView(): HTMLElement {
  const root = el('div', 'criteria-view percent-view');
  root.append(el('h2', '', 'Estimativa visual de porcentagem'));
  root.append(el('p', 'note', 'Compare a lâmina ou o afloramento com os círculos: cada um mostra a proporção de grãos escuros (1% a 50%) em duas granulações. Desenhos gerados pelo app; a área coberta é a porcentagem indicada.'));

  const out = el('div', 'percent-out');
  const input = el('input'); input.type = 'number'; input.min = '0.5'; input.max = '90'; input.step = '0.5'; input.value = '15'; input.id = 'percent-input';
  const label = el('label', 'check');
  label.append(el('span', '', 'Porcentagem: '), input, el('span', '', ' %'));
  const draw = () => {
    const p = Math.min(Math.max(Number(input.value) || 0, 0.5), 90);
    out.replaceChildren();
    for (const [g, name] of [[COARSE, 'grão grosso'], [FINE, 'grão fino']] as const) {
      const f = el('figure'); f.append(percentCircle(p, g, 3), el('figcaption', '', `${p}% · ${name}`));
      out.append(f);
    }
  };
  input.addEventListener('input', draw);
  root.append(label, out);
  draw();

  const gallery = el('div', 'percent-gallery');
  for (const set of [[1, 2, 3, 5, 10], [15, 20, 30, 40, 50]]) {
    const col = el('div', 'percent-col');
    for (const p of set) {
      const row = el('div', 'percent-row');
      row.append(el('strong', '', `${p}%`), percentCircle(p, COARSE, 1), percentCircle(p, FINE, 2));
      col.append(row);
    }
    gallery.append(col);
  }
  root.append(gallery);
  return root;
}
