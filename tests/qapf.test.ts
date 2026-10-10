import { classifyRow } from '../src/core/classify';
import { pointInPolygon } from '../src/core/geometry';
import { qapfPlutonic } from '../src/diagrams/qapf-plutonic';
import { qapfVolcanic } from '../src/diagrams/qapf-volcanic';
import { qapfXY } from '../src/diagrams/qapf-shared';
import type { DiagramDef } from '../src/core/types';

const name = (d: DiagramDef, Q: number, A: number, P: number, F = 0) => classifyRow(d, { Q, A, P, F }).name;

describe('QAPF plutonico', () => {
  it.each([
    [95, 2, 3, 0, 'Quartzolito'],
    [70, 15, 15, 0, 'Granitoide rico em quartzo'],
    [30, 60, 5, 0, 'Granito de feldspato alcalino'],
    [30, 50, 20, 0, 'Sienogranito'],
    [30, 35, 35, 0, 'Monzogranito'],
    [30, 20, 50, 0, 'Granodiorito'],
    [30, 5, 65, 0, 'Tonalito'],
    [10, 85, 5, 0, 'Quartzo sienito de feldspato alcalino'],
    [10, 60, 30, 0, 'Quartzo sienito'],
    [10, 45, 45, 0, 'Quartzo monzonito'],
    [10, 25, 65, 0, 'Quartzo monzodiorito/Quartzo monzogabro'],
    [10, 5, 85, 0, 'Quartzo diorito/Quartzo gabro/Quartzo anortosito'],
    [2, 45, 53, 0, 'Monzonito'],
    [0, 5, 95, 0, 'Diorito/Gabro/Anortosito'],
    [0, 95, 5, 0, 'Sienito de feldspato alcalino'],
    [0, 45, 45, 5, 'Monzonito com foides'],
    [0, 70, 0, 30, 'Foid sienito'],
    [0, 60, 20, 20, 'Foid monzosienito'],
    [0, 20, 60, 20, 'Foid monzodiorito/Foid monzogabro'],
    [0, 5, 75, 20, 'Foid diorito/Foid gabro'],
    [0, 10, 10, 80, 'Foidolito'],
  ])('Q=%d A=%d P=%d F=%d -> %s', (Q, A, P, F, n) => {
    const r = classifyRow(qapfPlutonic, { Q, A, P, F });
    expect(r.status).toBe('ok');
    expect(r.name).toBe(n);
  });

  it('renormaliza para 100%', () => {
    expect(name(qapfPlutonic, 15, 17.5, 17.5)).toBe('Monzogranito');
  });
  it('Q e F juntos sao invalidos', () => {
    expect(classifyRow(qapfPlutonic, { Q: 10, A: 40, P: 40, F: 10 }).status).toBe('invalido');
  });
  it('tudo zero e invalido; A ou P ausentes e ausente; negativo e invalido', () => {
    expect(classifyRow(qapfPlutonic, { Q: 0, A: 0, P: 0, F: 0 }).status).toBe('invalido');
    expect(classifyRow(qapfPlutonic, { Q: 30, A: 40, P: null, F: null }).status).toBe('ausente');
    expect(classifyRow(qapfPlutonic, { Q: -1, A: 40, P: 40, F: 0 }).status).toBe('invalido');
  });
  it('Q e F em branco valem zero', () => {
    expect(classifyRow(qapfPlutonic, { Q: null, A: 5, P: 95, F: null }).name).toBe('Diorito/Gabro/Anortosito');
  });
  it('ponto sobre a fronteira A/(A+P)=35 e no limite', () => {
    const r = classifyRow(qapfPlutonic, { Q: 30, A: 45.5, P: 24.5, F: 0 });
    expect(r.status).toBe('no limite');
  });
  it('apenas quartzo / apenas feldspatoide nao quebra', () => {
    expect(name(qapfPlutonic, 100, 0, 0)).toBe('Quartzolito');
    expect(name(qapfPlutonic, 0, 0, 0, 100)).toBe('Foidolito');
  });

  const lattice = (panel: 'qap' | 'apf', def: DiagramDef, allowUncovered: (q: number) => boolean) => {
    let overlaps = 0; const gaps: string[] = [];
    for (let t = 0.5; t < 100; t += 1) for (let a = 0.37; a < 100 - t; a += 1) {
      const p = 100 - t - a; if (p <= 0.2) continue;
      const xy = qapfXY(panel, t, a, p);
      const hits = def.fields.filter((f) => f.panel === panel && pointInPolygon(xy, f.polygon) === 'inside').length;
      if (hits > 1) overlaps++;
      if (hits === 0 && !allowUncovered(t)) gaps.push(`${t},${a},${p}`);
    }
    return { overlaps, gaps };
  };
  it('plutonico: campos cobrem os dois triangulos sem sobreposicao', () => {
    for (const panel of ['qap', 'apf'] as const) {
      const { overlaps, gaps } = lattice(panel, qapfPlutonic, () => false);
      expect(overlaps).toBe(0);
      expect(gaps).toEqual([]);
    }
  });
  it('volcanico: sem sobreposicao; unica regiao sem campo e Q > 60', () => {
    const upper = lattice('qap', qapfVolcanic, (q) => q > 60);
    expect(upper.overlaps).toBe(0); expect(upper.gaps).toEqual([]);
    const lower = lattice('apf', qapfVolcanic, () => false);
    expect(lower.overlaps).toBe(0); expect(lower.gaps).toEqual([]);
  });
});

describe('QAPF vulcanico', () => {
  it.each([
    [30, 60, 5, 0, 'Riolito de feldspato alcalino'],
    [30, 35, 35, 0, 'Riolito'],
    [30, 20, 50, 0, 'Dacito'],
    [10, 85, 5, 0, 'Quartzo traquito de feldspato alcalino'],
    [10, 45, 45, 0, 'Quartzo latito'],
    [2, 45, 53, 0, 'Latito'],
    [0, 5, 95, 0, 'Andesito/Basalto'],
    [0, 70, 0, 30, 'Fonolito'],
    [0, 10, 10, 80, 'Foidito'],
  ])('Q=%d A=%d P=%d F=%d -> %s', (Q, A, P, F, n) => {
    expect(classifyRow(qapfVolcanic, { Q, A, P, F }).name).toBe(n);
  });
  it('Q > 60 nao tem nome no diagrama vulcanico', () => {
    expect(classifyRow(qapfVolcanic, { Q: 80, A: 10, P: 10, F: 0 }).status).toBe('fora do campo');
  });
});
