// QAPF plutônico (Streckeisen, 1976; Le Maitre et al., 2002, campos 1-15).
// Limites: Q em 5/20/60/90 e F em 10/60; razão P/(A+P) em 10/35/65/90 (F < 10 e Q > 0)
// e 10/50/90 (F 10-60). Q ou F = 0-5/0-10 são as bandas dos campos 6-10 e 6'-10'.
import type { DiagramDef } from '../core/types';
import { bandsToFields, qapfFromPoint, qapfToPoint, QAPF_PANELS, type BandSpec } from './qapf-shared';

const R4 = [0, 0.1, 0.35, 0.65, 0.9, 1] as const;
type Five = [string, string, string, string, string];
const five = (panel: 'qap' | 'apf', t1: number, t2: number, names: Five, codes: Five): BandSpec[] =>
  names.map((n, i) => [panel, t1, t2, R4[i], R4[i + 1], n, codes[i]] as BandSpec);

const specs: BandSpec[] = [
  ['qap', 90, 100, 0, 1, 'Quartzolito', '1a'],
  ['qap', 60, 90, 0, 1, 'Granitoide rico em quartzo', '1b'],
  ...five('qap', 20, 60,
    ['Granito de feldspato alcalino', 'Sienogranito', 'Monzogranito', 'Granodiorito', 'Tonalito'],
    ['2', '3a', '3b', '4', '5']),
  ...five('qap', 5, 20,
    ['Quartzo sienito de feldspato alcalino', 'Quartzo sienito', 'Quartzo monzonito', 'Quartzo monzodiorito/Quartzo monzogabro', 'Quartzo diorito/Quartzo gabro/Quartzo anortosito'],
    ['6*', '7*', '8*', '9*', '10*']),
  ...five('qap', 0, 5,
    ['Sienito de feldspato alcalino', 'Sienito', 'Monzonito', 'Monzodiorito/Monzogabro', 'Diorito/Gabro/Anortosito'],
    ['6', '7', '8', '9', '10']),
  ...five('apf', 0, 10,
    ['Sienito de feldspato alcalino com foides', 'Sienito com foides', 'Monzonito com foides', 'Monzodiorito/Monzogabro com foides', 'Diorito/Gabro com foides'],
    ["6'", "7'", "8'", "9'", "10'"]),
  ['apf', 10, 60, 0, 0.1, 'Foid sienito', '11'],
  ['apf', 10, 60, 0.1, 0.5, 'Foid monzosienito', '12'],
  ['apf', 10, 60, 0.5, 0.9, 'Foid monzodiorito/Foid monzogabro', '13'],
  ['apf', 10, 60, 0.9, 1, 'Foid diorito/Foid gabro', '14'],
  ['apf', 60, 100, 0, 1, 'Foidolito', '15'],
];

export const qapfPlutonic: DiagramDef = {
  id: 'qapf-plutonica',
  area: 'igneas',
  title: 'QAPF - rochas plutônicas (Streckeisen, 1976)',
  panels: QAPF_PANELS,
  fields: bandsToFields(specs),
  requiredColumns: [['Q'], ['A'], ['P'], ['F']],
  toPoint: (row) => qapfToPoint(row),
  fromPoint: qapfFromPoint,
};
