// Magma-tipos basálticos do Paraná: critérios de classificação de
// Peate, Hawkesworth & Mantovani (1992), Bull Volcanol 55:119-139, Tabela 2 (p. 123).
// Valores transcritos do artigo original: ">" e "<" são estritos; faixas "a-b" são inclusivas.
// Ti em ppm = TiO2 (wt%) x 5993,2 (derivado dos pesos atômicos). Óxidos em wt%, elementos-traço em ppm.
import type { Classification, DiagramDef, Row } from '../core/types';
import { FEOT_TO_FE2O3T, TI_PPM_PER_TIO2 } from '../core/constants';
import { readNum } from '../core/values';

export type Rule = { gt: number } | { lt: number } | { range: [number, number] };
export type Verdict = 'ok' | 'fail' | 'na';

export interface Criterion { id: string; label: string; unit: string }
export interface PeateType { id: string; name: string; group: 'Alto-Ti' | 'Baixo-Ti'; rules: Record<string, Rule> }

export const CRITERIA: Criterion[] = [
  { id: 'SiO2', label: 'SiO₂', unit: '%' },
  { id: 'TiO2', label: 'TiO₂', unit: '%' },
  { id: 'P2O5', label: 'P₂O₅', unit: '%' },
  { id: 'Fe2O3t', label: 'Fe₂O₃(t)', unit: '%' },
  { id: 'Sr', label: 'Sr', unit: 'ppm' },
  { id: 'Ba', label: 'Ba', unit: 'ppm' },
  { id: 'Zr', label: 'Zr', unit: 'ppm' },
  { id: 'TiZr', label: 'Ti/Zr', unit: '' },
  { id: 'TiY', label: 'Ti/Y', unit: '' },
  { id: 'ZrY', label: 'Zr/Y', unit: '' },
  { id: 'SrY', label: 'Sr/Y', unit: '' },
  { id: 'BaY', label: 'Ba/Y', unit: '' },
];

const gt = (gt: number): Rule => ({ gt });
const lt = (lt: number): Rule => ({ lt });
const rg = (a: number, b: number): Rule => ({ range: [a, b] });

export const PEATE_TYPES: PeateType[] = [
  { id: 'urubici', name: 'Urubici', group: 'Alto-Ti', rules: {
    SiO2: gt(49), TiO2: gt(3.3), P2O5: gt(0.45), Fe2O3t: lt(14.5), Sr: gt(550), Ba: gt(500), Zr: gt(250),
    TiZr: gt(57), TiY: gt(500), ZrY: gt(6.5), SrY: gt(14), BaY: gt(14) } },
  { id: 'pitanga', name: 'Pitanga', group: 'Alto-Ti', rules: {
    SiO2: gt(47), TiO2: gt(2.8), P2O5: gt(0.35), Fe2O3t: rg(12.5, 18), Sr: gt(350), Ba: gt(200), Zr: gt(200),
    TiZr: gt(60), TiY: gt(350), ZrY: gt(5.5), SrY: gt(8), BaY: gt(9) } },
  { id: 'paranapanema', name: 'Paranapanema', group: 'Alto-Ti', rules: {
    SiO2: rg(48, 53), TiO2: rg(1.7, 3.2), P2O5: rg(0.2, 0.8), Fe2O3t: rg(12.5, 17), Sr: rg(200, 450), Ba: rg(200, 650), Zr: rg(120, 250),
    TiZr: gt(65), TiY: gt(350), ZrY: rg(4.0, 7.0), SrY: rg(4.5, 15), BaY: rg(5, 19) } },
  { id: 'ribeira', name: 'Ribeira', group: 'Baixo-Ti', rules: {
    SiO2: rg(49, 52), TiO2: rg(1.5, 2.3), P2O5: rg(0.15, 0.5), Fe2O3t: rg(12, 16), Sr: rg(200, 375), Ba: rg(200, 600), Zr: rg(100, 200),
    TiZr: gt(65), TiY: gt(300), ZrY: rg(3.5, 7.0), SrY: rg(5, 17), BaY: rg(6, 19) } },
  { id: 'esmeralda', name: 'Esmeralda', group: 'Baixo-Ti', rules: {
    SiO2: rg(48, 55), TiO2: rg(1.1, 2.3), P2O5: rg(0.1, 0.35), Fe2O3t: rg(12, 17), Sr: lt(250), Ba: rg(90, 400), Zr: rg(65, 210),
    TiZr: gt(60), TiY: lt(330), ZrY: rg(2.0, 5.0), SrY: lt(9), BaY: lt(12) } },
  { id: 'gramado', name: 'Gramado', group: 'Baixo-Ti', rules: {
    SiO2: rg(49, 60), TiO2: rg(0.7, 2.0), P2O5: rg(0.05, 0.4), Fe2O3t: rg(9, 16), Sr: rg(140, 400), Ba: rg(100, 700), Zr: rg(65, 275),
    TiZr: lt(70), TiY: lt(330), ZrY: rg(3.5, 6.5), SrY: lt(13), BaY: lt(19) } },
];

export { TI_PPM_PER_TIO2, FEOT_TO_FE2O3T }; // derivadas dos pesos atômicos IUPAC em src/core/constants.ts
export const MIN_EVALUABLE = 5; // mínimo de critérios com dado para classificar
export const LOI_LIMIT = 2.5; // Peate et al. descartaram análises com LOI > 2,5 wt%

export function evaluateRule(rule: Rule, v: number): boolean {
  if ('gt' in rule) return v > rule.gt;
  if ('lt' in rule) return v < rule.lt;
  return v >= rule.range[0] && v <= rule.range[1];
}

export function ruleText(rule: Rule): string {
  if ('gt' in rule) return `> ${rule.gt}`;
  if ('lt' in rule) return `< ${rule.lt}`;
  return `${rule.range[0]} – ${rule.range[1]}`;
}

export interface PeateTypeDetail { results: Record<string, Verdict>; fails: number; evaluable: number }
export interface PeateDetail {
  values: Record<string, number | null>;
  perType: Record<string, PeateTypeDetail>;
  evaluable: number;
  altered: boolean;
  matches: string[];
}

const INPUTS = ['SiO2', 'TiO2', 'P2O5', 'Fe2O3t', 'FeOt', 'Sr', 'Ba', 'Zr', 'Y', 'LOI'];

function ratio(a: number | null, b: number | null): number | null {
  return a !== null && b !== null && b > 0 ? a / b : null;
}

export function criteriaValues(row: Row): Record<string, number | null> | 'bad' {
  const raw: Record<string, number | null> = {};
  for (const k of INPUTS) {
    const v = readNum(row, k);
    if (v === 'bad') return 'bad';
    raw[k] = v;
  }
  if (INPUTS.some((k) => raw[k] !== null && (raw[k] as number) < 0)) return 'bad';
  const fe = raw.Fe2O3t ?? (raw.FeOt !== null ? raw.FeOt * FEOT_TO_FE2O3T : null);
  const ti = raw.TiO2 !== null ? raw.TiO2 * TI_PPM_PER_TIO2 : null;
  return {
    SiO2: raw.SiO2, TiO2: raw.TiO2, P2O5: raw.P2O5, Fe2O3t: fe, Sr: raw.Sr, Ba: raw.Ba, Zr: raw.Zr,
    TiZr: ratio(ti, raw.Zr), TiY: ratio(ti, raw.Y), ZrY: ratio(raw.Zr, raw.Y), SrY: ratio(raw.Sr, raw.Y), BaY: ratio(raw.Ba, raw.Y),
  };
}

export function classifyPeate(row: Row, opts: Record<string, boolean>): Classification {
  const values = criteriaValues(row);
  if (values === 'bad') return { status: 'invalido', message: 'valor não numérico ou negativo' };
  const evaluable = CRITERIA.filter((c) => values[c.id] !== null).length;
  if (evaluable < MIN_EVALUABLE) {
    return { status: 'ausente', message: `${evaluable} critérios com dado; mínimo ${MIN_EVALUABLE} (ex.: TiO2, Zr e Y)` };
  }
  const perType: Record<string, PeateTypeDetail> = {};
  for (const t of PEATE_TYPES) {
    const results: Record<string, Verdict> = {};
    let fails = 0;
    for (const c of CRITERIA) {
      const v = values[c.id];
      results[c.id] = v === null ? 'na' : evaluateRule(t.rules[c.id], v) ? 'ok' : 'fail';
      if (results[c.id] === 'fail') fails++;
    }
    perType[t.id] = { results, fails, evaluable };
  }
  const loi = readNum(row, 'LOI');
  const altered = typeof loi === 'number' && loi > LOI_LIMIT;
  const flag = altered ? ` ⚠ LOI ${loi}` : '';
  const note = altered ? `LOI > ${LOI_LIMIT} wt%: amostra possivelmente alterada (Peate et al. descartaram essas análises).` : '';

  let matches = PEATE_TYPES.filter((t) => perType[t.id].fails === 0).map((t) => t.id);
  const all = matches;
  let extra = '';
  if (opts.prioridade && matches.includes('urubici') && matches.includes('pitanga')) {
    matches = matches.filter((m) => m !== 'pitanga');
    extra = 'Também satisfaz os critérios de Pitanga; Urubici prevalece por ter limites mais restritivos.';
  }
  const detail: PeateDetail = { values, perType, evaluable, altered, matches: all };
  const name = (id: string) => PEATE_TYPES.find((t) => t.id === id)!.name;
  const message = [extra, note].filter(Boolean).join(' ') || undefined;

  if (matches.length === 1) return { status: 'ok', fieldId: matches[0], name: name(matches[0]) + flag, message, detail };
  if (matches.length > 1) {
    return { status: 'ambiguo', name: `Ambíguo: ${matches.map(name).join(' / ')}${flag}`, message: ['Mais de um magma-tipo satisfaz todos os critérios avaliáveis.', note].filter(Boolean).join(' '), detail };
  }
  const best = PEATE_TYPES.reduce((a, b) => (perType[b.id].fails < perType[a.id].fails ? b : a));
  const f = perType[best.id].fails;
  return {
    status: 'nao classificado',
    name: `Não classificado (≈ ${best.name}, ${f} ${f === 1 ? 'critério fora' : 'critérios fora'})${flag}`,
    message: ['Nenhum magma-tipo satisfaz todos os critérios.', note].filter(Boolean).join(' '),
    detail,
  };
}

export const peate: DiagramDef = {
  id: 'peate-1992',
  area: 'igneas',
  kind: 'criteria',
  title: 'Magma-tipos do Paraná (Peate et al., 1992)',
  panels: [],
  fields: [],
  requiredColumns: [['TiO2'], ['Zr'], ['Y']],
  optionalColumns: [['SiO2'], ['P2O5'], ['Fe2O3t'], ['FeOt'], ['Sr'], ['Ba'], ['LOI']],
  options: [{ id: 'prioridade', label: 'Se Urubici e Pitanga coincidirem, escolher Urubici (limites mais restritivos)' }],
  defaultOptions: { prioridade: true },
  toPoint: () => ({ ok: false, reason: 'invalido', message: 'este módulo não tem gráfico' }),
  classify: classifyPeate,
};
