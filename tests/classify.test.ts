import { classifyRow } from '../src/core/classify';
import type { DiagramDef } from '../src/core/types';

const toy: DiagramDef = {
  id: 'toy', area: 'x', title: 'Toy',
  panels: [{ id: 'main', type: 'cartesian', xRange: [0, 2], yRange: [0, 1] }],
  fields: [
    { id: 'a', name: 'Campo A', color: '#f00', panel: 'main', polygon: [[0, 0], [1, 0], [1, 1], [0, 1]] },
    { id: 'b', name: 'Campo B', color: '#0f0', panel: 'main', polygon: [[1, 0], [2, 0], [2, 1], [1, 1]] },
  ],
  requiredColumns: [['X'], ['Y']],
  toPoint(row) {
    const x = row.X, y = row.Y;
    if (x == null || y == null) return { ok: false, reason: 'ausente', message: 'faltam X/Y' };
    if (typeof x !== 'number' || typeof y !== 'number' || x < 0) return { ok: false, reason: 'invalido', message: 'valor invalido' };
    return { ok: true, panel: 'main', xy: [x, y] };
  },
};

describe('classifyRow', () => {
  it('ponto interno', () => {
    const r = classifyRow(toy, { X: 0.5, Y: 0.5 });
    expect(r.status).toBe('ok'); expect(r.name).toBe('Campo A'); expect(r.fieldId).toBe('a');
  });
  it('fronteira compartilhada: no limite e primeiro campo declarado', () => {
    const r = classifyRow(toy, { X: 1, Y: 0.5 });
    expect(r.status).toBe('no limite'); expect(r.name).toBe('Campo A');
  });
  it('fora do campo', () => {
    expect(classifyRow(toy, { X: 5, Y: 0.5 }).status).toBe('fora do campo');
  });
  it('propaga motivo do toPoint', () => {
    expect(classifyRow(toy, { X: null, Y: 1 }).status).toBe('ausente');
    expect(classifyRow(toy, { X: -1, Y: 1 }).status).toBe('invalido');
  });
});
