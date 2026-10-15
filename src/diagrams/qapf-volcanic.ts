// QAPF vulcânico (Le Maitre et al., 2002): mesma geometria do plutônico, nomenclatura vulcânica.
// Q > 60 não tem nome no diagrama publicado.
import type { DiagramDef } from '../core/types';
import { bandsToFields, qapfFromPoint, qapfToPoint, QAPF_PANELS, type BandSpec } from './qapf-shared';

const specs: BandSpec[] = [
  ['qap', 20, 60, 0, 0.1, 'Riolito de feldspato alcalino', '2'],
  ['qap', 20, 60, 0.1, 0.65, 'Riolito', '3'],
  ['qap', 20, 60, 0.65, 1, 'Dacito', '4'],
  ['qap', 5, 20, 0, 0.1, 'Quartzo traquito de feldspato alcalino', '6*'],
  ['qap', 5, 20, 0.1, 0.35, 'Quartzo traquito', '7*'],
  ['qap', 5, 20, 0.35, 0.65, 'Quartzo latito', '8*'],
  ['qap', 5, 20, 0.65, 1, 'Quartzo andesito/Quartzo basalto', '9*'],
  ['qap', 0, 5, 0, 0.1, 'Traquito de feldspato alcalino', '6'],
  ['qap', 0, 5, 0.1, 0.35, 'Traquito', '7'],
  ['qap', 0, 5, 0.35, 0.65, 'Latito', '8'],
  ['qap', 0, 5, 0.65, 1, 'Andesito/Basalto', '9'],
  ['apf', 0, 10, 0, 0.1, 'Traquito de feldspato alcalino com foides', "6'"],
  ['apf', 0, 10, 0.1, 0.35, 'Traquito com foides', "7'"],
  ['apf', 0, 10, 0.35, 0.65, 'Latito com foides', "8'"],
  ['apf', 0, 10, 0.65, 1, 'Andesito/Basalto com foides', "9'"],
  ['apf', 10, 60, 0, 0.1, 'Fonolito', '11'],
  ['apf', 10, 60, 0.1, 0.5, 'Fonolito tefrítico', '12'],
  ['apf', 10, 60, 0.5, 0.9, 'Basanito fonolítico/Tefrito fonolítico', '13'],
  ['apf', 10, 60, 0.9, 1, 'Tefrito/Basanito', '14'],
  ['apf', 60, 100, 0, 1, 'Foidito', '15'],
];

export const qapfVolcanic: DiagramDef = {
  id: 'qapf-vulcanica',
  area: 'igneas',
  title: 'QAPF - rochas vulcânicas (Le Maitre et al., 2002)',
  panels: QAPF_PANELS,
  fields: bandsToFields(specs),
  requiredColumns: [['Q'], ['A'], ['P'], ['F']],
  toPoint: (row) => qapfToPoint(row),
  fromPoint: qapfFromPoint,
};
