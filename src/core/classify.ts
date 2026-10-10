import { pointInPolygon } from './geometry';
import type { Classification, DiagramDef, Row } from './types';

export function classifyRow(def: DiagramDef, row: Row, opts: Record<string, boolean> = {}): Classification {
  const pt = def.toPoint(row, opts);
  if (!pt.ok) return { status: pt.reason, message: pt.message };
  const edgeHits: Classification[] = [];
  for (const f of def.fields) {
    if ((f.panel ?? def.panels[0].id) !== pt.panel) continue;
    const where = pointInPolygon(pt.xy, f.polygon);
    if (where === 'inside') return { status: 'ok', fieldId: f.id, name: f.name, panel: pt.panel, xy: pt.xy };
    if (where === 'edge') edgeHits.push({ status: 'no limite', fieldId: f.id, name: f.name, panel: pt.panel, xy: pt.xy });
  }
  // Em fronteira entre dois ou mais campos: 'no limite' (vale o primeiro declarado). Na borda externa de um campo só: ok.
  if (edgeHits.length === 1) return { ...edgeHits[0], status: 'ok' };
  return edgeHits[0] ?? { status: 'fora do campo', panel: pt.panel, xy: pt.xy, message: 'fora de qualquer campo' };
}
