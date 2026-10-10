import type { Row } from './types';

/** Lê um valor numérico: número, null (ausente) ou 'bad' (texto não numérico, NaN ou infinito). */
export function readNum(row: Row, key: string): number | null | 'bad' {
  const v = row[key];
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 'bad';
  return 'bad';
}
