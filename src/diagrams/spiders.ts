// Spiders normalizados ao manto primitivo, como nos gráficos exportados pelo GCDkit do usuário
// ("Primitive Mantle Norm (Sun and McDonough, 1989)"): multielementar e ETR.
// Valores de normalização (ppm) de Sun e McDonough (1989): conferir com a publicação antes de uso formal.
import type { Classification, DiagramDef, Row } from '../core/types';
import { readNum } from '../core/values';

export const PM: Record<string, number> = {
  Cs: 0.032, Rb: 0.635, Ba: 6.989, Th: 0.085, U: 0.021, Nb: 0.713, Ta: 0.041, K: 250, La: 0.687, Ce: 1.775, Pb: 0.185, Pr: 0.276,
  Sr: 21.1, P: 95, Nd: 1.354, Zr: 11.2, Hf: 0.309, Sm: 0.444, Eu: 0.168, Ti: 1300, Gd: 0.596, Tb: 0.108, Dy: 0.737, Y: 4.55,
  Ho: 0.164, Er: 0.48, Tm: 0.074, Yb: 0.493, Lu: 0.074,
};

/** conversões de óxido (wt%) para elemento (ppm), as mesmas do GCDkit: K2O x 8301, P2O5 x 4364, TiO2 x 5994 */
export const OXIDE_TO_ELEMENT: Record<string, [string, number]> = { K: ['K2O', 8301], P: ['P2O5', 4364], Ti: ['TiO2', 5994] };

export const MULTI_ORDER = ['Cs', 'Rb', 'Ba', 'Th', 'U', 'Nb', 'Ta', 'K', 'La', 'Ce', 'Pb', 'Pr', 'Sr', 'P', 'Nd', 'Zr', 'Hf', 'Sm', 'Eu', 'Ti', 'Gd', 'Tb', 'Dy', 'Y', 'Ho', 'Er', 'Tm', 'Yb', 'Lu'];
export const REE_ORDER = ['La', 'Ce', 'Pr', 'Nd', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Y', 'Ho', 'Er', 'Tm', 'Yb', 'Lu'];

/** valor em ppm de um elemento (ou null); 'bad' se o dado for inválido */
export function elementPpm(row: Row, el: string): number | null | 'bad' {
  const v = readNum(row, el);
  if (v === 'bad') return 'bad';
  if (v !== null) return v;
  const ox = OXIDE_TO_ELEMENT[el];
  if (!ox) return null;
  const o = readNum(row, ox[0]);
  if (o === 'bad') return 'bad';
  return o === null ? null : o * ox[1];
}

/** razão amostra/manto primitivo por elemento; null onde falta dado ou o valor não é positivo (escala log) */
export function normalize(row: Row, elements: string[]): { values: (number | null)[]; bad: boolean } {
  let bad = false;
  const values = elements.map((el) => {
    const v = elementPpm(row, el);
    if (v === 'bad') { bad = true; return null; }
    return v === null || v <= 0 ? null : v / PM[el];
  });
  return { values, bad };
}

const MIN_ELEMENTS = 3;

function build(id: string, title: string, elements: string[], example: string): DiagramDef {
  const extra = ['K2O', 'P2O5', 'TiO2'].filter((o) => elements.some((e) => OXIDE_TO_ELEMENT[e]?.[0] === o)).map((o) => [o]);
  return {
    id, area: 'igneas', kind: 'spider', title,
    panels: [], fields: [],
    requiredColumns: [],
    optionalColumns: [...elements.map((e) => [e]), ...extra],
    spider: { elements, norm: PM, source: 'Sun e McDonough (1989), manto primitivo', ylabel: 'amostra / manto primitivo' },
    toPoint: () => ({ ok: false, reason: 'invalido', message: 'este módulo não tem gráfico de pontos' }),
    classify(row): Classification {
      const { values, bad } = normalize(row, elements);
      if (bad) return { status: 'invalido', message: 'valor não numérico ou negativo' };
      const n = values.filter((v) => v !== null).length;
      if (n < MIN_ELEMENTS) return { status: 'ausente', message: `${n} elemento(s) com dado; mínimo ${MIN_ELEMENTS}` };
      return { status: 'ok', name: `${n} de ${elements.length} elementos`, message: 'normalizado ao manto primitivo' };
    },
    exampleCsv: example,
  };
}

export const spiderMulti = build(
  'spider-manto-primitivo', 'Spider multielementar normalizado ao manto primitivo (Sun e McDonough, 1989)', MULTI_ORDER,
  'Amostra,Grupo,Rb,Ba,Th,U,Nb,Ta,K2O,La,Ce,Pr,Sr,P2O5,Nd,Zr,Hf,Sm,Eu,TiO2,Gd,Tb,Dy,Y,Ho,Er,Tm,Yb,Lu\n'
  + 'Exemplo 1 alto-Ti,Alto-Ti,22,520,4.1,1.0,38,2.3,1.9,45,95,11,560,0.55,45,320,7.5,10,3.2,3.6,9,1.3,6.5,35,1.3,3.4,0.45,2.9,0.42\n'
  + 'Exemplo 2 baixo-Ti,Baixo-Ti,38,380,5.8,1.4,11,0.8,2.1,28,57,6.5,210,0.18,26,130,3.4,5.1,1.4,1.1,4.6,0.75,4.3,30,0.9,2.6,0.4,2.7,0.4\n',
);

export const spiderREE = build(
  'spider-ree', 'Spider de ETR normalizado ao manto primitivo (Sun e McDonough, 1989)', REE_ORDER,
  'Amostra,Grupo,La,Ce,Pr,Nd,Sm,Eu,Gd,Tb,Dy,Y,Ho,Er,Tm,Yb,Lu\n'
  + 'Exemplo 1 alto-Ti,Alto-Ti,45,95,11,45,10,3.2,9,1.3,6.5,35,1.3,3.4,0.45,2.9,0.42\n'
  + 'Exemplo 2 baixo-Ti,Baixo-Ti,28,57,6.5,26,5.1,1.4,4.6,0.75,4.3,30,0.9,2.6,0.4,2.7,0.4\n',
);

export const spiders: DiagramDef[] = [spiderMulti, spiderREE];
