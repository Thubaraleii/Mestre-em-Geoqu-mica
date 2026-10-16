// Construtor de diagramas ternários modais (ultramáficas, gabroicas, tufos, arenitos...).
// Cada campo é um polígono em composição [topo, esquerda, direita] em %. O mesmo polígono
// desenha o campo e classifica a amostra; um clique no gráfico faz o caminho inverso (fromPoint).
import { ternaryXY, type Pt } from '../core/geometry';
import type { DiagramDef, Field, Panel, PointResult, Row } from '../core/types';
import { readNum } from '../core/values';

export type Comp = [number, number, number];
export interface TriField { name: string; poly: Comp[] }
export interface TriPanel {
  id: string;
  offsetY: number;
  corners: [string, string, string]; // rótulos: topo, esquerda, direita
  columns: [string, string, string]; // colunas canônicas: topo, esquerda, direita
  fields: TriField[];
  /** colunas extras gravadas por um clique e no exemplo (ex.: matriz) */
  extra?: Record<string, number>;
}

export const H = Math.sqrt(3) / 2;
const round = (n: number) => Math.round(n * 1e9) / 1e9;

export function compXY(c: Comp, offsetY = 0): Pt {
  const [x, y] = ternaryXY(c[0], c[1], c[2]);
  return [round(x), round(y + offsetY)];
}

/** faixa de topo t1-t2 (%) × razão r1-r2 = direita/(esquerda+direita); vértices repetidos (ápice) são fundidos */
export function bandPoly(t1: number, t2: number, r1: number, r2: number): Comp[] {
  const at = (t: number, r: number): Comp => [t, (100 - t) * (1 - r), (100 - t) * r];
  const raw = [at(t1, r1), at(t1, r2), at(t2, r2), at(t2, r1)];
  const out: Comp[] = [];
  for (const c of raw) {
    const q = c.map(round) as Comp;
    const last = out[out.length - 1];
    if (!last || last.some((v, i) => v !== q[i])) out.push(q);
  }
  if (out.length > 1 && out[0].every((v, i) => v === out[out.length - 1][i])) out.pop();
  return out;
}

export type Band = [t1: number, t2: number, r1: number, r2: number, name: string];
export const bands = (list: Band[]): TriField[] => list.map(([t1, t2, r1, r2, name]) => ({ name, poly: bandPoly(t1, t2, r1, r2) }));

const PALETTE = ['#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#ccebc5', '#a8ddb5', '#7bccc4', '#43a2ca', '#fed976', '#feb24c', '#fd8d3c', '#bcbddc', '#9e9ac8', '#c6dbef', '#fdd0a2', '#d9f0a3'];

/** composição normalizada a 100: lê as 3 colunas; vazio = 0, mas as três vazias = ausente */
function readComp(row: Row, cols: [string, string, string]): { ok: true; comp: Comp } | { ok: false; reason: 'ausente' | 'invalido'; message: string } {
  const v = cols.map((c) => readNum(row, c));
  if (v.some((x) => x === 'bad')) return { ok: false, reason: 'invalido', message: 'valor não numérico' };
  if (v.every((x) => x === null)) return { ok: false, reason: 'ausente', message: `faltam ${cols.join(', ')}` };
  const n = v.map((x) => (x as number | null) ?? 0);
  if (n.some((x) => x < 0)) return { ok: false, reason: 'invalido', message: 'valor negativo' };
  const s = n[0] + n[1] + n[2];
  if (s <= 0) return { ok: false, reason: 'invalido', message: 'soma igual a zero' };
  return { ok: true, comp: [(n[0] * 100) / s, (n[1] * 100) / s, (n[2] * 100) / s] };
}

export interface TernarySpec {
  id: string;
  title: string;
  area?: string;
  panels: TriPanel[];
  /** escolhe o painel da amostra (padrão: o primeiro); pode recusar com motivo */
  route?: (row: Row) => string | { fail: 'fora do campo' | 'invalido'; message: string };
  optionalColumns?: string[][];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function exampleCsv(panels: TriPanel[]): string {
  const cols = [...new Set(panels.flatMap((p) => p.columns))];
  const extras = [...new Set(panels.flatMap((p) => Object.keys(p.extra ?? {})))];
  const lines = [['Amostra', ...cols, ...extras].join(',')];
  let n = 0;
  for (const p of panels) {
    for (const f of p.fields) {
      n++;
      const c = [0, 1, 2].map((i) => f.poly.reduce((a, q) => a + q[i], 0) / f.poly.length);
      const vals: Record<string, number | string> = {};
      p.columns.forEach((col, i) => { vals[col] = r1(c[i]); });
      for (const [k, v] of Object.entries(p.extra ?? {})) vals[k] = v;
      lines.push([`Exemplo ${n} ${f.name}`, ...[...cols, ...extras].map((k) => vals[k] ?? '')].join(','));
    }
  }
  return lines.join('\n') + '\n';
}

export function buildTernary(spec: TernarySpec): DiagramDef {
  const panels: Panel[] = spec.panels.map((p) => ({
    id: p.id, type: 'ternary', corners: p.corners,
    outline: [compXY([100, 0, 0], p.offsetY), compXY([0, 100, 0], p.offsetY), compXY([0, 0, 100], p.offsetY)],
    labels: [
      { text: p.corners[0], at: [0.5, H + p.offsetY + 0.045], anchor: 'middle' },
      { text: p.corners[1], at: [-0.03, p.offsetY], anchor: 'end' },
      { text: p.corners[2], at: [1.03, p.offsetY], anchor: 'start' },
    ],
  }));
  let idx = 0;
  const fields: Field[] = spec.panels.flatMap((p) => p.fields.map((f) => {
    const i = idx++;
    return { id: `${p.id}-${i}`, name: f.name, short: String(i + 1), panel: p.id, color: PALETTE[i % PALETTE.length], polygon: f.poly.map((c) => compXY(c, p.offsetY)) };
  }));
  const byId = new Map(spec.panels.map((p) => [p.id, p]));

  const toPoint = (row: Row): PointResult => {
    let id = spec.panels[0].id;
    if (spec.route) {
      const r = spec.route(row);
      if (typeof r !== 'string') return { ok: false, reason: r.fail, message: r.message };
      id = r;
    }
    const p = byId.get(id)!;
    const c = readComp(row, p.columns);
    if (!c.ok) return c;
    return { ok: true, panel: p.id, xy: compXY(c.comp, p.offsetY) };
  };

  const fromPoint = ([x, y]: Pt): Row | null => {
    for (const p of spec.panels) {
      const ly = y - p.offsetY;
      const t = ly / H;
      const right = x - t / 2, left = 1 - t - right;
      const tol = 1e-9;
      if (t < -tol || t > 1 + tol || right < -tol || left < -tol) continue;
      const row: Row = {};
      p.columns.forEach((c, i) => { row[c] = r1([t, left, right][i] * 100); });
      Object.assign(row, p.extra ?? {});
      return row;
    }
    return null;
  };

  const cols = [...new Set(spec.panels.flatMap((p) => p.columns))];
  return {
    id: spec.id, area: spec.area ?? 'igneas', title: spec.title,
    panels, fields,
    requiredColumns: cols.map((c) => [c]),
    optionalColumns: spec.optionalColumns,
    toPoint, fromPoint,
    exampleCsv: exampleCsv(spec.panels),
  };
}
