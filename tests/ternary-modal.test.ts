import { classifyRow } from '../src/core/classify';
import { pointInPolygon } from '../src/core/geometry';
import { getDiagram } from '../src/diagrams';
import { parseText } from '../src/data/parse';
import type { DiagramDef, Row } from '../src/core/types';

const def = (id: string) => getDiagram(id) as DiagramDef;
const name = (id: string, row: Row) => classifyRow(def(id), row).name;

describe('Ultramaficas: Ol-Opx-Cpx', () => {
  const id = 'ultramaficas-opx-cpx';
  it.each([
    [95, 3, 2, 'Dunito'],
    [60, 39, 1, 'Harzburgito'],
    [60, 36, 4, 'Lherzolito'],
    [60, 1, 39, 'Wehrlito'],
    [25, 74, 1, 'Olivina ortopiroxenito'],
    [25, 37.5, 37.5, 'Olivina websterito'],
    [25, 1, 74, 'Olivina clinopiroxenito'],
    [5, 94, 1, 'Ortopiroxenito'],
    [5, 47.5, 47.5, 'Websterito'],
    [5, 1, 94, 'Clinopiroxenito'],
  ])('Ol=%d Opx=%d Cpx=%d -> %s', (Ol, Opx, Cpx, n) => {
    expect(name(id, { Ol, Opx, Cpx })).toBe(n);
  });
  it('renormaliza e classifica; ausente/invalido', () => {
    expect(name(id, { Ol: 47.5, Opx: 19.5, Cpx: 0.5 })).toBe('Harzburgito'); // soma 67.5: Ol 70%, Cpx/(Opx+Cpx) = 2.5%
    expect(classifyRow(def(id), { Ol: null, Opx: null, Cpx: null }).status).toBe('ausente');
    expect(classifyRow(def(id), { Ol: 0, Opx: 0, Cpx: 0 }).status).toBe('invalido');
    expect(classifyRow(def(id), { Ol: -1, Opx: 5, Cpx: 5 }).status).toBe('invalido');
  });
  it('Ol=90 e fronteira entre dunito e peridotito: no limite', () => {
    expect(classifyRow(def(id), { Ol: 90, Opx: 5, Cpx: 5 }).status).toBe('no limite');
  });
});

describe('Ultramaficas: Ol-Px-Hbl', () => {
  const id = 'ultramaficas-px-hbl';
  it.each([
    [95, 3, 2, 'Dunito'],
    [60, 39, 1, 'Piroxênio peridotito'],
    [60, 20, 20, 'Piroxênio hornblenda peridotito'],
    [60, 1, 39, 'Hornblenda peridotito'],
    [25, 50, 25, 'Olivina hornblenda piroxenito'],
    [25, 25, 50, 'Olivina piroxênio hornblendito'],
    [5, 94, 1, 'Piroxenito'],
    [5, 70, 25, 'Hornblenda piroxenito'],
    [5, 25, 70, 'Piroxênio hornblendito'],
    [5, 1, 94, 'Hornblendito'],
  ])('Ol=%d Px=%d Hbl=%d -> %s', (Ol, Px, Hbl, n) => {
    expect(name(id, { Ol, Px, Hbl })).toBe(n);
  });
});

describe('Gabroicas', () => {
  it.each([
    [95, 3, 2, 'Anortosito'],
    [50, 48, 2, 'Gabro/Gabronorito/Norito'],
    [50, 25, 25, 'Olivina gabro/Olivina gabronorito/Olivina norito'],
    [50, 1, 49, 'Troctolito'],
    [80, 19, 1, 'Gabro/Gabronorito/Norito (leuco-)'],
    [20, 79, 1, 'Gabro/Gabronorito/Norito (mela-)'],
    [5, 60, 35, 'Rochas ultramáficas com plagioclásio'],
  ])('Plag-Px-Ol: Plag=%d Px=%d Ol=%d -> %s', (Plag, Px, Ol, n) => {
    expect(name('gabroicas-plag-px-ol', { Plag, Px, Ol })).toBe(n);
  });
  it.each([
    [95, 3, 2, 'Anortosito'],
    [50, 48, 2, 'Gabro/Gabronorito/Norito'],
    [50, 25, 25, 'Piroxênio hornblenda gabro/gabronorito/norito'],
    [50, 1, 49, 'Hornblenda gabro'],
    [5, 94, 1, 'Piroxenito com plagioclásio'],
    [5, 70, 25, 'Hornblenda piroxenito com plagioclásio'],
    [5, 25, 70, 'Piroxênio hornblendito com plagioclásio'],
    [5, 1, 94, 'Hornblendito com plagioclásio'],
  ])('Plag-Px-Hbl: Plag=%d Px=%d Hbl=%d -> %s', (Plag, Px, Hbl, n) => {
    expect(name('gabroicas-plag-px-hbl', { Plag, Px, Hbl })).toBe(n);
  });
});

describe('Tufos', () => {
  it.each([
    [80, 10, 10, 'Tufo vítrico'],
    [20, 70, 10, 'Tufo lítico'],
    [20, 10, 70, 'Tufo de cristal'],
  ])('Vidro=%d Frag=%d Crist=%d -> %s', (Vidro, FragRocha, Cristais, n) => {
    expect(name('tufos', { Vidro, FragRocha, Cristais })).toBe(n);
  });
});

describe('Arenitos e grauvacas (Dott, 1964)', () => {
  const s = (Q: number, Feld: number, Lit: number, Matriz: number | null) => name('arenitos', { Q, Feld, Lit, Matriz });
  it('matriz < 15%: arenitos', () => {
    expect(s(97, 2, 1, 5)).toBe('Quartzo arenito');
    expect(s(85, 12, 3, 5)).toBe('Subarcósio');
    expect(s(85, 3, 12, 5)).toBe('Arenito sublítico');
    expect(s(50, 40, 10, 5)).toBe('Arcósio');
    expect(s(50, 10, 40, 5)).toBe('Arenito lítico');
  });
  it('matriz em branco conta como < 15%', () => {
    expect(s(50, 40, 10, null)).toBe('Arcósio');
  });
  it('matriz 15-75%: grauvacas', () => {
    expect(s(97, 2, 1, 30)).toBe('Quartzo grauvaca');
    expect(s(60, 30, 10, 30)).toBe('Grauvaca feldspática');
    expect(s(60, 10, 30, 30)).toBe('Grauvaca lítica');
  });
  it('matriz > 75%: fora do diagrama', () => {
    const r = classifyRow(def('arenitos'), { Q: 60, Feld: 30, Lit: 10, Matriz: 90 });
    expect(r.status).toBe('fora do campo');
    expect(r.message).toContain('75');
  });
  it('limites: F = 25 e a fronteira subarcosio/arcosio', () => {
    expect(classifyRow(def('arenitos'), { Q: 75, Feld: 25, Lit: 0, Matriz: 5 }).status).toBe('no limite');
  });
});

describe('cobertura sem buracos nem sobreposicao (todos os triangulos)', () => {
  const ids = ['ultramaficas-opx-cpx', 'ultramaficas-px-hbl', 'gabroicas-plag-px-ol', 'gabroicas-plag-px-hbl', 'tufos', 'arenitos'];
  it.each(ids)('%s', (id) => {
    const d = def(id);
    let overlaps = 0; const gaps: string[] = [];
    for (const p of d.panels) {
      const outline = p.outline!;
      const [top, left, right] = outline;
      // passos com fração .43/.37 para a grade nunca cair exatamente numa fronteira (5, 10, 35, 65, 90...)
      for (let t = 0.43; t < 100; t += 1.5) for (let l = 0.37; l < 100 - t; l += 1.5) {
        const r = 100 - t - l; if (r <= 0.2) continue;
        const xy: [number, number] = [
          (t / 100) * top[0] + (l / 100) * left[0] + (r / 100) * right[0],
          (t / 100) * top[1] + (l / 100) * left[1] + (r / 100) * right[1],
        ];
        const hits = d.fields.filter((f) => f.panel === p.id && pointInPolygon(xy, f.polygon) === 'inside').length;
        if (hits > 1) overlaps++;
        if (hits === 0) gaps.push(`${p.id}:${t},${l},${r}`);
      }
    }
    expect(overlaps).toBe(0);
    expect(gaps).toEqual([]);
  });
});

describe('clique no grafico (fromPoint) e exemplos', () => {
  it('ida e volta: clicar no centro de cada campo devolve a mesma classificacao', () => {
    for (const id of ['ultramaficas-opx-cpx', 'ultramaficas-px-hbl', 'gabroicas-plag-px-ol', 'gabroicas-plag-px-hbl', 'tufos', 'arenitos']) {
      const d = def(id);
      for (const f of d.fields) {
        const cx = f.polygon.reduce((a, p) => a + p[0], 0) / f.polygon.length;
        const cy = f.polygon.reduce((a, p) => a + p[1], 0) / f.polygon.length;
        const row = d.fromPoint!([cx, cy]);
        expect(row, `${id} ${f.name}`).not.toBeNull();
        const c = classifyRow(d, row!, {});
        expect(c.name, `${id} ${f.name}`).toBe(f.name);
      }
    }
  });
  it('fora do triangulo: null', () => {
    expect(def('tufos').fromPoint!([5, 5])).toBeNull();
  });
  it('exemplo gerado: uma linha por campo, todas classificam no proprio campo', () => {
    for (const id of ['ultramaficas-opx-cpx', 'gabroicas-plag-px-ol', 'tufos', 'arenitos']) {
      const d = def(id);
      expect(d.exampleCsv, id).toBeDefined();
      const t = parseText(d.exampleCsv!);
      expect(t.rows).toHaveLength(d.fields.length);
      for (const row of t.rows) {
        const expected = String(row.Amostra).replace(/^Exemplo \d+ /, '');
        expect(classifyRow(d, row, {}).name, `${id} ${expected}`).toBe(expected);
      }
    }
  });
});
