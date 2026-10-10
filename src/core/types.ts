import type { Pt } from './geometry';

export type Row = Record<string, number | string | null>;

export interface Field {
  id: string;
  name: string;
  polygon: Pt[];
  color: string;
  panel?: string;
}

export interface Panel {
  id: string;
  type: 'cartesian' | 'ternary';
  xLabel?: string;
  yLabel?: string;
  xRange?: Pt;
  yRange?: Pt;
  /** ternary: [topo, esquerda, direita] */
  corners?: [string, string, string];
  /** contorno do painel (ternário), em coordenadas do diagrama */
  outline?: Pt[];
  /** rótulos de vértices/eixos, em coordenadas do diagrama */
  labels?: { text: string; at: Pt; anchor?: 'start' | 'middle' | 'end' }[];
}

export type PointResult =
  | { ok: true; panel: string; xy: Pt }
  | { ok: false; reason: 'ausente' | 'invalido' | 'fora do campo'; message: string };

export interface ExtraLine { id: string; name: string; points: Pt[]; panel?: string }

export interface DiagramDef {
  id: string;
  area: string;
  title: string;
  panels: Panel[];
  fields: Field[];
  requiredColumns: string[][];
  /** colunas opcionais (usadas só por opções, ex.: normalização anidra) */
  optionalColumns?: string[][];
  /** opções liga/desliga exibidas na interface */
  options?: { id: string; label: string }[];
  extraLines?: ExtraLine[];
  toPoint(row: Row, opts: Record<string, boolean>): PointResult;
}

export interface Classification {
  status: 'ok' | 'no limite' | 'fora do campo' | 'ausente' | 'invalido';
  fieldId?: string;
  name?: string;
  panel?: string;
  xy?: Pt;
  message?: string;
}
