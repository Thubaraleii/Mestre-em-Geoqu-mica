import type { Pt } from './geometry';

export type Row = Record<string, number | string | null>;

export interface Field {
  id: string;
  name: string;
  polygon: Pt[];
  color: string;
  panel?: string;
  /** código curto (ex.: número do campo), usado quando o nome não cabe no gráfico */
  short?: string;
  /** opacidade do preenchimento (padrão 0.55); campos que se sobrepõem usam valores baixos */
  opacity?: number;
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
  /** classificador por regras (sem polígonos): quando existe, substitui a classificação por campos */
  classify?(row: Row, opts: Record<string, boolean>): Classification;
  /** 'criteria' = tabela de critérios (Peate); 'table' = classificação por regras com tabela de referência;
   *  'reference' = só consulta, sem dados do usuário */
  kind?: 'criteria' | 'table' | 'reference';
  /** tabela de referência exibida no lugar do gráfico: a 1ª coluna de cada linha é a classe (igual a Classification.name) */
  referenceTable?: { head: string[]; rows: string[][]; note?: string };
  /** grupo (legenda) e cor de cada ponto a partir da classificação, em vez da coluna de grupo */
  pointStyle?(c: Classification): { group: string; color: string };
  /** CSV de exemplo do módulo (botão "Carregar exemplo"); sem ele o app usa o padrão do módulo */
  exampleCsv?: string;
  /** valores iniciais das opções (a escolha do usuário prevalece) */
  defaultOptions?: Record<string, boolean>;
  /** Inverso de toPoint: coordenada do diagrama -> valores das colunas canônicas; null se fora do diagrama. */
  fromPoint?(xy: Pt): Row | null;
}

export interface Classification {
  status: 'ok' | 'no limite' | 'fora do campo' | 'ausente' | 'invalido' | 'ambiguo' | 'nao classificado';
  /** dados extras do classificador (ex.: detalhe por critério) */
  detail?: unknown;
  fieldId?: string;
  name?: string;
  panel?: string;
  xy?: Pt;
  message?: string;
}
