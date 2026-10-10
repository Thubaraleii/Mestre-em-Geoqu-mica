import { pointInPolygon } from './geometry';
import type { Classification, DiagramDef, Row } from './types';

export function classifyRow(def: DiagramDef, row: Row, opts: Record<string, boolean> = {}): Classification {
  const pt = def.toPoint(row, opts);
  if (!pt.ok) return { status: pt.reason, message: pt.message };
  let edgeHit: Classification | null = null;
  for (const f of def.fields) {
    if ((f.panel ?? def.panels[0].id) !== pt.panel) continue;
    const where = pointInPolygon(pt.xy, f.polygon);
    if (where === 'inside') return { status: 'ok', fieldId: f.id, name: f.name, panel: pt.panel, xy: pt.xy };
    if (where === 'edge' && !edgeHit) {
      edgeHit = { status: 'no limite', fieldId: f.id, name: f.name, panel: pt.panel, xy: pt.xy };
    }
  }
  return edgeHit ?? { status: 'fora do campo', panel: pt.panel, xy: pt.xy, message: 'fora de qualquer campo' };
}
