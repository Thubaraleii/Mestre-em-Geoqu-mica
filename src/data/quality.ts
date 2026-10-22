// Controle de qualidade analítico: soma dos óxidos de maiores e unidade.
// Uma análise de rocha total deve somar perto de 100% (incluindo a perda ao fogo); fora de 98-101% costuma indicar
// elemento faltando, dado de outra unidade (fração, ppm) ou erro de digitação. O app avisa, não corrige.
import type { Row } from '../core/types';

export const TOTAL_MIN = 98;
export const TOTAL_MAX = 101;
/** mínimo de óxidos de maiores presentes para a soma ter significado */
export const MIN_OXIDES = 8;

export const MAJOR_OXIDES = ['SiO2', 'TiO2', 'Al2O3', 'MnO', 'MgO', 'CaO', 'Na2O', 'K2O', 'P2O5'] as const;
export const IRON = ['FeOt', 'Fe2O3t', 'Fe2O3', 'FeO'] as const;
export const QUALITY_COLUMNS = [...MAJOR_OXIDES, ...IRON, 'LOI'];

const num = (r: Row, k: string): number | null => {
  const v = r[k];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

export interface TotalCheck { total: number; present: number; flag?: string }

/** Soma dos óxidos de maiores (+ LOI, se houver). Ferro: usa o ferro total quando existe; senão Fe2O3 + FeO. */
export function analyticalTotal(row: Row): TotalCheck | null {
  let total = 0, present = 0;
  for (const ox of MAJOR_OXIDES) {
    const v = num(row, ox);
    if (v !== null) { total += v; present++; }
  }
  const feT = num(row, 'FeOt') ?? num(row, 'Fe2O3t');
  if (feT !== null) { total += feT; present++; } else {
    const f3 = num(row, 'Fe2O3'), f2 = num(row, 'FeO');
    if (f3 !== null || f2 !== null) { total += (f3 ?? 0) + (f2 ?? 0); present++; }
  }
  if (present < MIN_OXIDES) return null;
  total += num(row, 'LOI') ?? 0;
  const fmt = (n: number) => n.toFixed(1).replace('.', ',');
  if (total > 0.9 && total < 1.1) return { total, present, flag: `soma dos óxidos = ${total.toFixed(3).replace('.', ',')}: os valores parecem frações, não wt%` };
  if (total < TOTAL_MIN || total > TOTAL_MAX) return { total, present, flag: `soma dos óxidos = ${fmt(total)}% (esperado entre ${TOTAL_MIN} e ${TOTAL_MAX}%)` };
  return { total, present };
}
