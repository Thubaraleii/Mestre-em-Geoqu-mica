// Arredondamento (Powers, 1953) e grau de seleção (Folk e Ward, 1957, nas 5 classes da figura de referência).
// Sem reproduzir as fotografias do livro: tabelas de referência e calculadoras.
import type { Classification, DiagramDef } from '../core/types';
import { readNum } from '../core/values';

const stub: DiagramDef['toPoint'] = () => ({ ok: false, reason: 'invalido', message: 'este módulo não tem gráfico' });
const ok = (name: string, message?: string): Classification => ({ status: 'ok', name, message });
const fmt = (n: number) => String(+n.toFixed(2)).replace('.', ',');

// ---------- arredondamento ----------
// limites inferiores do índice de arredondamento de Powers (0 a 1)
const ROUND: { name: string; min: number }[] = [
  { name: 'Bem arredondado', min: 0.7 },
  { name: 'Arredondado', min: 0.49 },
  { name: 'Subarredondado', min: 0.35 },
  { name: 'Subanguloso', min: 0.25 },
  { name: 'Anguloso', min: 0.17 },
  { name: 'Muito anguloso', min: 0.12 },
];

export const arredondamento: DiagramDef = {
  id: 'arredondamento', area: 'sedimentar', kind: 'table',
  title: 'Grau de arredondamento e esfericidade (Powers, 1953)',
  panels: [], fields: [], requiredColumns: [['Arredondamento']], optionalColumns: [['Esfericidade']], toPoint: stub,
  referenceTable: {
    head: ['Classe', 'Índice de arredondamento (Powers)', 'Aspecto'],
    rows: [
      ['Muito anguloso', '0,12 – 0,17', 'arestas e vértices vivos, sem desgaste'],
      ['Anguloso', '0,17 – 0,25', 'arestas vivas, cantos levemente gastos'],
      ['Subanguloso', '0,25 – 0,35', 'cantos nitidamente gastos, faces originais preservadas'],
      ['Subarredondado', '0,35 – 0,49', 'cantos arredondados, faces ainda reconhecíveis'],
      ['Arredondado', '0,49 – 0,70', 'faces quase apagadas, cantos bem arredondados'],
      ['Bem arredondado', '0,70 – 1,00', 'sem faces, cantos ou arestas originais'],
    ],
    note: 'Seis classes de arredondamento de Powers (1953). A esfericidade (alta ou baixa) é uma segunda dimensão independente: informe "alta" ou "baixa" na coluna Esfericidade e o app a anexa ao resultado. Limite inferior inclusivo.',
  },
  classify(row) {
    const r = readNum(row, 'Arredondamento');
    if (r === 'bad') return { status: 'invalido', message: 'índice não numérico' };
    if (r === null) return { status: 'ausente', message: 'falta a coluna Arredondamento (índice de 0 a 1)' };
    if (r < 0 || r > 1) return { status: 'invalido', message: 'o índice de arredondamento vai de 0 a 1' };
    const cls = ROUND.find((c) => r >= c.min);
    if (!cls) return { status: 'fora do campo', message: 'abaixo de 0,12: menos arredondado que a classe "muito anguloso" de Powers' };
    const e = row.Esfericidade;
    const sph = e === null || e === undefined || e === '' ? null : String(e).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
    if (sph !== null && sph !== 'alta' && sph !== 'baixa') return { status: 'invalido', message: 'Esfericidade deve ser alta ou baixa' };
    return ok(cls.name, sph ? `esfericidade ${sph}` : undefined);
  },
  exampleCsv: 'Amostra,Arredondamento,Esfericidade\nExemplo 1,0.14,baixa\nExemplo 2,0.2,baixa\nExemplo 3,0.3,alta\nExemplo 4,0.4,alta\nExemplo 5,0.6,baixa\nExemplo 6,0.85,alta\n',
};

// ---------- seleção ----------
const SORT: { name: string; max: number; range: string }[] = [
  { name: 'Muito bem selecionado', max: 0.35, range: '< 0,35' },
  { name: 'Bem selecionado', max: 0.5, range: '0,35 – 0,50' },
  { name: 'Moderadamente selecionado', max: 1, range: '0,50 – 1,00' },
  { name: 'Mal selecionado', max: 2, range: '1,00 – 2,00' },
  { name: 'Muito mal selecionado', max: Infinity, range: '> 2,00' },
];

/** desvio-padrão gráfico inclusivo de Folk e Ward: (φ84 − φ16)/4 + (φ95 − φ5)/6,6 */
export const sigmaFolkWard = (p5: number, p16: number, p84: number, p95: number) => (p84 - p16) / 4 + (p95 - p5) / 6.6;

export const selecao: DiagramDef = {
  id: 'selecao', area: 'sedimentar', kind: 'table',
  title: 'Grau de seleção (Folk e Ward, 1957)',
  panels: [], fields: [], requiredColumns: [],
  optionalColumns: [['Sigma'], ['Phi5'], ['Phi16'], ['Phi84'], ['Phi95']], toPoint: stub,
  referenceTable: {
    head: ['Classe', 'Desvio-padrão σφ'],
    rows: SORT.map((s) => [s.name, s.range]),
    note: 'Informe Sigma (σφ) ou os percentis Phi5, Phi16, Phi84 e Phi95 da curva granulométrica; com os percentis o app calcula σφ = (φ84 − φ16)/4 + (φ95 − φ5)/6,6 (Folk e Ward, 1957). As sete classes originais foram agrupadas nas cinco da figura de referência. Limite superior exclusivo.',
  },
  classify(row) {
    let s = readNum(row, 'Sigma');
    if (s === 'bad') return { status: 'invalido', message: 'Sigma não numérico' };
    let how = 'σφ informado';
    if (s === null) {
      const p = ['Phi5', 'Phi16', 'Phi84', 'Phi95'].map((k) => readNum(row, k));
      if (p.some((v) => v === 'bad')) return { status: 'invalido', message: 'percentil não numérico' };
      if (p.some((v) => v === null)) return { status: 'ausente', message: 'informe Sigma ou os quatro percentis Phi5, Phi16, Phi84 e Phi95' };
      const [a, b, c, d] = p as number[];
      if (!(a <= b && b <= c && c <= d)) return { status: 'invalido', message: 'os percentis φ devem crescer: Phi5 ≤ Phi16 ≤ Phi84 ≤ Phi95' };
      s = sigmaFolkWard(a, b, c, d);
      how = 'σφ calculado dos percentis';
    }
    if (s < 0) return { status: 'invalido', message: 'σφ não pode ser negativo' };
    const cls = SORT.find((c) => s! < c.max)!;
    return ok(cls.name, `${how}: σφ = ${fmt(s)}`);
  },
  exampleCsv: 'Amostra,Sigma,Phi5,Phi16,Phi84,Phi95\nExemplo 1 sigma,0.25,,,,\nExemplo 2 sigma,0.45,,,,\nExemplo 3 sigma,0.8,,,,\nExemplo 4 percentis,,-1,0,2.5,3.5\nExemplo 5 percentis,,-2,-1,3,5\n',
};

export const sedimentar: DiagramDef[] = [arredondamento, selecao];
