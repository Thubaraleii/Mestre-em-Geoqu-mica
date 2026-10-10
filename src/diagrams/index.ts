import type { DiagramDef } from '../core/types';
import { tas } from './tas';
import { qapfPlutonic } from './qapf-plutonic';
import { qapfVolcanic } from './qapf-volcanic';

export const diagrams: DiagramDef[] = [tas, qapfPlutonic, qapfVolcanic];

export function getDiagram(id: string): DiagramDef | undefined {
  return diagrams.find((d) => d.id === id);
}
