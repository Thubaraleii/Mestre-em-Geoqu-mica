import { classifyRow } from '../src/core/classify';
import { pointInPolygon } from '../src/core/geometry';
import { tas } from '../src/diagrams/tas';

const c = (SiO2: number, alk: number) => classifyRow(tas, { SiO2, Na2O: alk, K2O: 0 });

describe('TAS', () => {
  it.each([
    [43, 1, 'Picrobasalto'],
    [48, 2, 'Basalto'],
    [54, 2, 'Andesito basáltico'],
    [60, 3, 'Andesito'],
    [66, 2, 'Dacito'],
    [75, 8, 'Riolito'],
    [48, 6, 'Traquibasalto'],
    [43, 5, 'Tefrito/Basanito'],
    [50, 9, 'Fonotefrito'],
    [52, 11, 'Tefrifonolito'],
    [58, 8, 'Traquiandesito'],
    [53, 7, 'Traquiandesito basáltico'],
    [62, 12, 'Traquito/Traquidacito'],
    [55, 13, 'Fonolito'],
    [43, 10, 'Foidito'],
  ])('SiO2=%d alcalis=%d -> %s', (s, a, name) => {
    const r = c(s, a);
    expect(r.status).toBe('ok');
    expect(r.name).toBe(name);
  });

  it('soma Na2O + K2O', () => {
    expect(classifyRow(tas, { SiO2: 48, Na2O: 3, K2O: 3 }).name).toBe('Traquibasalto');
  });
  it('fora do dominio', () => {
    expect(c(35, 2).status).toBe('fora do campo');
    expect(c(80, 2).status).toBe('fora do campo');
  });
  it('ausente e invalido', () => {
    expect(classifyRow(tas, { SiO2: 50, K2O: 1 }).status).toBe('ausente');
    expect(classifyRow(tas, { SiO2: 50, Na2O: -1, K2O: 1 }).status).toBe('invalido');
    expect(classifyRow(tas, { SiO2: 'abc' as unknown as number, Na2O: 1, K2O: 1 }).status).toBe('invalido');
  });
  it('anidra sem oxidos suficientes e invalida (sem NaN)', () => {
    const r = classifyRow(tas, { SiO2: 50, Na2O: 3, K2O: 1 }, { anidro: true });
    expect(r.status).toBe('invalido');
  });
  it('anidra renormaliza para 100%', () => {
    // soma 97 -> fator 100/97
    const row = { SiO2: 48.5, TiO2: 1, Al2O3: 15, Fe2O3: 3, FeO: 8, MnO: 0.2, MgO: 8, CaO: 10, Na2O: 2, K2O: 1.3, P2O5: 0 };
    const r = classifyRow(tas, row, { anidro: true });
    expect(r.xy![0]).toBeCloseTo(48.5 * (100 / 97), 6);
  });
  it('ferro total substitui FeO + Fe2O3 na soma', () => {
    const row = { SiO2: 50, TiO2: 1, Al2O3: 15, FeOt: 10, MnO: 0.2, MgO: 8, CaO: 10, Na2O: 2, K2O: 1, P2O5: 0.3 };
    const r = classifyRow(tas, row, { anidro: true, ferro: true });
    expect(r.xy![0]).toBeCloseTo(50 * (100 / 97.5), 6);
  });
  it('campos cobrem o dominio sem sobreposicao', () => {
    let overlaps = 0;
    const uncovered: [number, number][] = [];
    for (let x = 41.05; x < 77; x += 0.1) {
      for (let y = 0.05; y < 16; y += 0.1) {
        const where = tas.fields.map((f) => pointInPolygon([x, y], f.polygon));
        if (where.filter((w) => w === 'inside').length > 1) overlaps++;
        if (where.every((w) => w === 'outside')) uncovered.push([x, y]);
      }
    }
    expect(overlaps).toBe(0);
    // unica regiao sem campo: canto superior direito (sem rochas no TAS)
    expect(uncovered.filter(([x, y]) => !(x > 63 && y > 10))).toEqual([]);
  });
  it('15 campos', () => {
    expect(tas.fields).toHaveLength(15);
  });
});
