import type { DiagramDef } from '../core/types';
import { tas } from './tas';
import { qapfPlutonic } from './qapf-plutonic';
import { qapfVolcanic } from './qapf-volcanic';
import { peate } from './peate';
import { peatePlots } from './peate-plots';

export const diagrams: DiagramDef[] = [tas, qapfPlutonic, qapfVolcanic, peate, ...peatePlots];

export function getDiagram(id: string): DiagramDef | undefined {
  return diagrams.find((d) => d.id === id);
}
