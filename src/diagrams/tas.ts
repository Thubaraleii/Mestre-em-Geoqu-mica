// TAS - Total Alkali-Silica (Le Bas et al., 1986; Le Maitre et al., 2002), recortado em SiO2 41-77, álcalis 0-16.
// Procedência dos vértices:
//  - parte inferior/média: transcrição do pyrolite (config_lemaitre.json), CONFIRMADA contra o GCDkit do usuário
//    (tests/tas-gcdkit.test.ts) e contra o SVG da Wikimedia (coordenadas de Le Maitre 2002);
//  - parte superior (foidito/fonolito/traquito): a transcrição do pyrolite estava ERRADA (fronteira foidito/fonolito
//    vertical e quebra em (63; 16,2)); corrigida com GCDkit + Wikimedia, que concordam entre si: fronteira foidito/fonolito
//    sobe de (52,5; 14) para a esquerda, e fonolito/traquito é a reta (57,6; 11,7)-(61; 13,5)-(63,83; 15). Prolongadas até y = 16
//    por extrapolação (a figura publicada para antes): CONFERIR com Le Maitre (2002), Fig. 2.14.
//  - divergências ABERTAS entre as fontes, mantidas como no pyrolite: (a) fronteira dacito/riolito: reta (69; 8)-(77,3; 0) no pyrolite e na
//    Wikimedia, mas curva (69; 8)-(73,5; 3)-(75,78; 0) no GCDkit; (b) limite superior do riolito: inclinado no pyrolite, horizontal em y = 13 no GCDkit.
//  - o GCDkit não traça a divisão traquito/traquidacito (só rótulos); o app usa um único campo, como Le Maitre (2002).
import type { Pt } from '../core/geometry';
import type { DiagramDef, Field } from '../core/types';
import { readNum } from '../core/values';

const X_MIN = 41, X_MAX = 77, Y_MIN = 0, Y_MAX = 16;

const f = (id: string, name: string, color: string, polygon: Pt[]): Field => ({ id, name, color, polygon, panel: 'tas' });

const fields: Field[] = [
  f('picrobasalt', 'Picrobasalto', '#c7e9c0', [[41, 0], [41, 3], [45, 3], [45, 0]]),
  f('basalt', 'Basalto', '#a1d99b', [[45, 0], [45, 5], [52, 5], [52, 0]]),
  f('basaltic-andesite', 'Andesito basáltico', '#fdd0a2', [[52, 0], [52, 5], [57, 5.9], [57, 0]]),
  f('andesite', 'Andesito', '#fdae6b', [[57, 0], [57, 5.9], [63, 7], [63, 0]]),
  f('dacite', 'Dacito', '#fcbba1', [[63, 0], [63, 7], [69, 8], [77, 0.3], [77, 0]]),
  f('rhyolite', 'Riolito', '#fb9a99', [[69, 8], [69, 13], [77, 10.06], [77, 0.3]]),
  f('trachybasalt', 'Traquibasalto', '#bcbddc', [[45, 5], [49.4, 7.3], [52, 5]]),
  f('basaltic-trachyandesite', 'Traquiandesito basáltico', '#9e9ac8', [[49.4, 7.3], [53, 9.3], [57, 5.9], [52, 5]]),
  f('trachyandesite', 'Traquiandesito', '#807dba', [[53, 9.3], [57.6, 11.7], [63, 7], [57, 5.9]]),
  f('trachyte', 'Traquito/Traquidacito', '#dadaeb', [[57.6, 11.7], [63.83, 15], [69, 13], [69, 8], [63, 7]]),
  f('tephrite', 'Tefrito/Basanito', '#9ecae1', [[41, 3], [41, 7], [45, 9.4], [49.4, 7.3], [45, 5], [45, 3]]),
  f('phonotephrite', 'Fonotefrito', '#6baed6', [[45, 9.4], [48.4, 11.5], [53, 9.3], [49.4, 7.3]]),
  f('tephriphonolite', 'Tefrifonolito', '#4292c6', [[48.4, 11.5], [52.5, 14], [57.6, 11.7], [53, 9.3]]),
  f('phonolite', 'Fonolito', '#c6dbef', [[52.5, 14], [47.83, 16], [65.72, 16], [57.6, 11.7]]),
  f('foidite', 'Foidito', '#deebf7', [[41, 7], [41, 16], [47.83, 16], [52.5, 14], [48.4, 11.5], [45, 9.4]]),
];

const MAJORS = ['SiO2', 'TiO2', 'Al2O3', 'Fe2O3', 'FeO', 'MnO', 'MgO', 'CaO', 'Na2O', 'K2O', 'P2O5'];

export const tas: DiagramDef = {
  id: 'tas',
  area: 'igneas',
  title: 'TAS (Le Bas et al., 1986)',
  panels: [{
    id: 'tas', type: 'cartesian',
    xLabel: 'SiO2 (% em peso)', yLabel: 'Na2O + K2O (% em peso)',
    xRange: [X_MIN, X_MAX], yRange: [Y_MIN, Y_MAX],
  }],
  fields,
  requiredColumns: [['SiO2'], ['Na2O'], ['K2O']],
  optionalColumns: [['TiO2'], ['Al2O3'], ['Fe2O3'], ['FeO'], ['FeOt'], ['MnO'], ['MgO'], ['CaO'], ['P2O5']],
  options: [
    { id: 'anidro', label: 'Normalizar para base anidra (100%)' },
    { id: 'ferro', label: 'Usar ferro total (FeOt) na normalização' },
  ],
  fromPoint([x, y]) {
    if (x < X_MIN || x > X_MAX || y < Y_MIN || y > Y_MAX) return null;
    // o total de álcalis vai em Na2O e K2O fica 0 (a tabela precisa das duas colunas)
    return { SiO2: Math.round(x * 100) / 100, Na2O: Math.round(y * 100) / 100, K2O: 0 };
  },
  toPoint(row, opts) {
    const si = readNum(row, 'SiO2'), na = readNum(row, 'Na2O'), k = readNum(row, 'K2O');
    if (si === 'bad' || na === 'bad' || k === 'bad') return { ok: false, reason: 'invalido', message: 'valor não numérico' };
    if (si === null || na === null || k === null) return { ok: false, reason: 'ausente', message: 'faltam SiO2, Na2O ou K2O' };
    if (si < 0 || na < 0 || k < 0) return { ok: false, reason: 'invalido', message: 'valor negativo' };
    let x = si, y = na + k;
    if (opts.anidro) {
      let sum = 0, count = 0;
      const useTotalFe = opts.ferro && readNum(row, 'FeOt') !== null;
      for (const ox of MAJORS) {
        if (useTotalFe && (ox === 'FeO' || ox === 'Fe2O3')) continue;
        const v = readNum(row, ox);
        if (typeof v === 'number') { sum += v; count++; }
      }
      if (useTotalFe) {
        const fe = readNum(row, 'FeOt');
        if (typeof fe === 'number') { sum += fe; count++; }
      }
      if (count < 8 || sum <= 0) {
        return { ok: false, reason: 'invalido', message: 'óxidos insuficientes para normalizar a base anidra' };
      }
      x = (si * 100) / sum;
      y = ((na + k) * 100) / sum;
    }
    return { ok: true, panel: 'tas', xy: [x, y] };
  },
};
