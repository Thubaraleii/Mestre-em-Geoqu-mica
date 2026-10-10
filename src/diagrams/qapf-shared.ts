// Base comum do QAPF (Streckeisen, 1974/1976; Le Maitre et al., 2002).
// Espaço do diagrama: vértice Q em (0.5, h), A em (0, 0), P em (1, 0), F em (0.5, -h), h = sqrt(3)/2.
// Painel 'qap' = triângulo superior (Q, A, P); painel 'apf' = triângulo inferior (F, A, P).
import { ternaryXY, type Pt } from '../core/geometry';
import type { Field, PointResult, Row } from '../core/types';
import { readNum } from '../core/values';

export const H = Math.sqrt(3) / 2;
export type QapfPanel = 'qap' | 'apf';

/** t = Q (painel qap) ou F (painel apf); a, p = feldspato alcalino e plagioclásio. */
export function qapfXY(panel: QapfPanel, t: number, a: number, p: number): Pt {
  const [x, y] = ternaryXY(t, a, p);
  return panel === 'qap' ? [x, y] : [x, -y];
}

const round = (n: number) => Math.round(n * 1e9) / 1e9;

/** Faixa t1-t2 (% de Q ou F) × razão r1-r2 de P/(A+P). Vértices coincidentes (ápice) são fundidos. */
export function band(panel: QapfPanel, t1: number, t2: number, r1: number, r2: number): Pt[] {
  const pt = (t: number, r: number): Pt => qapfXY(panel, t, (100 - t) * (1 - r), (100 - t) * r);
  const raw = [pt(t1, r1), pt(t1, r2), pt(t2, r2), pt(t2, r1)];
  const out: Pt[] = [];
  for (const p of raw) {
    const q: Pt = [round(p[0]), round(p[1])];
    const last = out[out.length - 1];
    if (!last || last[0] !== q[0] || last[1] !== q[1]) out.push(q);
  }
  const first = out[0], end = out[out.length - 1];
  if (out.length > 1 && first[0] === end[0] && first[1] === end[1]) out.pop();
  return out;
}

const PALETTE = ['#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#dd3497', '#ccebc5', '#a8ddb5', '#7bccc4', '#43a2ca', '#0868ac', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c'];

export type BandSpec = [panel: QapfPanel, t1: number, t2: number, r1: number, r2: number, name: string];

export function bandsToFields(specs: BandSpec[]): Field[] {
  return specs.map(([panel, t1, t2, r1, r2, name], i) => ({
    id: `${panel}-${i}`,
    name,
    panel,
    color: PALETTE[i % PALETTE.length],
    polygon: band(panel, t1, t2, r1, r2),
  }));
}

export const QAPF_PANELS = [
  {
    id: 'qap', type: 'ternary' as const, corners: ['Q', 'A', 'P'] as [string, string, string],
    outline: [[0.5, H], [0, 0], [1, 0]] as Pt[],
    labels: [
      { text: 'Q', at: [0.5, H + 0.04] as Pt, anchor: 'middle' as const },
      { text: 'A', at: [-0.03, 0] as Pt, anchor: 'end' as const },
      { text: 'P', at: [1.03, 0] as Pt, anchor: 'start' as const },
    ],
  },
  {
    id: 'apf', type: 'ternary' as const, corners: ['F', 'A', 'P'] as [string, string, string],
    outline: [[0.5, -H], [0, 0], [1, 0]] as Pt[],
    labels: [{ text: 'F', at: [0.5, -H - 0.07] as Pt, anchor: 'middle' as const }],
  },
];

const NUDGE = 1e-6;

/** Q, A, P, F modais -> ponto. Q e F em branco valem 0; A e P são obrigatórios. */
export function qapfToPoint(row: Row): PointResult {
  const q = readNum(row, 'Q'), a = readNum(row, 'A'), p = readNum(row, 'P'), f = readNum(row, 'F');
  if ([q, a, p, f].some((v) => v === 'bad')) return { ok: false, reason: 'invalido', message: 'valor não numérico' };
  if (a === null || p === null) return { ok: false, reason: 'ausente', message: 'faltam A ou P' };
  const Q = (q as number | null) ?? 0, A = a as number, P = p as number, F = (f as number | null) ?? 0;
  if (Q < 0 || A < 0 || P < 0 || F < 0) return { ok: false, reason: 'invalido', message: 'valor negativo' };
  if (Q > 0 && F > 0) return { ok: false, reason: 'invalido', message: 'Q e F não ocorrem juntos' };
  const panel: QapfPanel = F > 0 ? 'apf' : 'qap';
  const t = panel === 'apf' ? F : Q;
  if (t + A + P <= 0) return { ok: false, reason: 'invalido', message: 'soma Q+A+P (ou F+A+P) igual a zero' };
  const xy = qapfXY(panel, t, A, P);
  // Q = F = 0 (eixo A-P) pertence aos campos 6-10 do triângulo superior: limite inferior inclusivo.
  if (t === 0) xy[1] = NUDGE;
  return { ok: true, panel, xy };
}
