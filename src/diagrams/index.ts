import type { DiagramDef } from '../core/types';
import { tas } from './tas';

export const diagrams: DiagramDef[] = [tas];

export function getDiagram(id: string): DiagramDef | undefined {
  return diagrams.find((d) => d.id === id);
}
