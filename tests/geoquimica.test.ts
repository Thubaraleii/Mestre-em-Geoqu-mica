import { classifyRow } from '../src/core/classify';
import { pointInPolygon } from '../src/core/geometry';
import { renderDiagram } from '../src/core/render';
import { getDiagram } from '../src/diagrams';
import { parseText } from '../src/data/parse';
import type { DiagramDef, Row } from '../src/core/types';

const def = (id: string) => getDiagram(id) as DiagramDef;
const name = (id: string, row: Row) => classifyRow(def(id), row).name;

describe('Shand (1943)', () => {
  it('indices molares: metaluminoso, peraluminoso, peralcalino', () => {
    expect(name('shand-1943', { Al2O3: 15, CaO: 8, Na2O: 3, K2O: 1.5 })).toBe('Metaluminoso');
    expect(name('shand-1943', { Al2O3: 15, CaO: 1, Na2O: 3, K2O: 4 })).toBe('Peraluminoso');
    expect(name('shand-1943', { Al2O3: 10, CaO: 0.5, Na2O: 7, K2O: 5 })).toBe('Peralcalino');
  });
  it('A/CNK e A/NK calculados com massas moleculares', () => {
    const r = classifyRow(def('shand-1943'), { Al2O3: 15, CaO: 8, Na2O: 3, K2O: 1.5 });
    const nk = 3 / 61.98 + 1.5 / 94.2, a = 15 / 101.96;
    expect(r.xy![0]).toBeCloseTo(a / (8 / 56.08 + nk), 6);
    expect(r.xy![1]).toBeCloseTo(a / nk, 6);
  });
  it('faltas e invalidos; Na2O + K2O = 0 nao gera infinito', () => {
    expect(classifyRow(def('shand-1943'), { Al2O3: 15, CaO: 8, Na2O: 3 }).status).toBe('ausente');
    expect(classifyRow(def('shand-1943'), { Al2O3: -1, CaO: 8, Na2O: 3, K2O: 1 }).status).toBe('invalido');
    expect(classifyRow(def('shand-1943'), { Al2O3: 15, CaO: 8, Na2O: 0, K2O: 0 }).status).toBe('invalido');
  });
});

describe('AFM (Irvine e Baragar, 1971)', () => {
  it('toleitica acima da curva, calcio-alcalina abaixo', () => {
    expect(name('afm', { Na2O: 2.5, K2O: 0.8, FeOt: 12, MgO: 6 })).toBe('Série toleítica');
    expect(name('afm', { Na2O: 3.5, K2O: 2, FeOt: 6, MgO: 3 })).toBe('Série cálcio-alcalina');
  });
  it('FeOt vem de Fe2O3 e FeO quando ausente (Fe2O3 x 0.8998 + FeO)', () => {
    const a = classifyRow(def('afm'), { Na2O: 2.5, K2O: 0.8, Fe2O3: 4, FeO: 8.4, MgO: 6 });
    const b = classifyRow(def('afm'), { Na2O: 2.5, K2O: 0.8, FeOt: 4 * 0.8998 + 8.4, MgO: 6 });
    expect(a.xy![0]).toBeCloseTo(b.xy![0], 9);
    expect(a.xy![1]).toBeCloseTo(b.xy![1], 9);
  });
  it('ausente / invalido', () => {
    expect(classifyRow(def('afm'), { Na2O: 2, K2O: 1, MgO: 5 }).status).toBe('ausente');
    expect(classifyRow(def('afm'), { Na2O: 0, K2O: 0, FeOt: 0, MgO: 0 }).status).toBe('invalido');
  });
  it('dois campos cobrem o triangulo sem buraco nem sobreposicao', () => {
    const d = def('afm'); const [top, left, right] = d.panels[0].outline!;
    let overlaps = 0; const gaps: string[] = [];
    for (let t = 0.43; t < 100; t += 1.5) for (let l = 0.37; l < 100 - t; l += 1.5) {
      const r = 100 - t - l; if (r <= 0.2) continue;
      const xy: [number, number] = [(t * top[0] + l * left[0] + r * right[0]) / 100, (t * top[1] + l * left[1] + r * right[1]) / 100];
      const hits = d.fields.filter((f) => pointInPolygon(xy, f.polygon) === 'inside').length;
      if (hits > 1) overlaps++; if (hits === 0) gaps.push(`${t},${l}`);
    }
    expect(overlaps).toBe(0); expect(gaps).toEqual([]);
  });
  it('curva do PDF como linha de referencia', () => {
    expect(def('afm').extraLines![0].points.length).toBe(10);
  });
});

describe('Pearce e Norry (1979)', () => {
  const pn = (Zr: number, ratio: number) => classifyRow(def('pearce-norry-1979'), { Zr, Y: Zr / ratio });
  it('regioes puras', () => {
    expect(pn(20, 1.5).name).toBe('Basaltos de arco de ilha (IAB)');
    expect(pn(100, 2).name).toBe('Basaltos de cadeia meso-oceânica (MORB)');
    // o WPB e um paralelogramo inclinado: em Zr/Y = 7 vai de Zr ~145 a ~415 ppm
    expect(pn(280, 7).name).toBe('Basaltos intraplaca (WPB)');
    expect(pn(500, 7).status).toBe('fora do campo');
  });
  it('os campos se sobrepoem: ambiguo, com os campos citados', () => {
    const r = pn(45, 2.3);
    expect(r.status).toBe('ambiguo');
    expect(r.name).toContain('IAB');
    expect(r.name).toContain('MORB');
  });
  it('fora dos campos; logaritmos; invalidos', () => {
    expect(pn(1500, 3).status).toBe('fora do campo');
    expect(pn(100, 2).xy![0]).toBeCloseTo(2, 9);
    expect(classifyRow(def('pearce-norry-1979'), { Zr: 0, Y: 5 }).status).toBe('invalido');
    expect(classifyRow(def('pearce-norry-1979'), { Zr: 100, Y: null }).status).toBe('ausente');
  });
  it('eixos logaritmicos com ticks 1-2-5 e sem NaN', () => {
    const svg = renderDiagram(def('pearce-norry-1979'), []);
    const labels = [...svg.querySelectorAll('text')].map((t) => t.textContent);
    for (const v of ['10', '20', '50', '100', '200', '500', '1000', '1', '2', '5']) expect(labels).toContain(v);
    expect(svg.outerHTML).not.toContain('NaN');
  });
});

describe('Winchester e Floyd (1977)', () => {
  // posicoes (px) dos rotulos de campo no PNG exportado pelo GCDkit; cada rotulo tem de cair no campo que nomeia
  const X = (px: number) => -2 + (px - 78) / 493.7;
  const Yv = (py: number) => Math.log10(5) - (py - 78) / 173.4;
  const row = (px: number, py: number): Row => ({ Nb: 10 ** X(px), Y: 1, TiO2: 1, Zr: 10 ** (Yv(py) + 4) });
  it.each([
    [955, 148, 'Comendito / Pantelerito'],
    [1395, 149, 'Fonolito'],
    [747, 290, 'Riolito'],
    [1243, 342, 'Traquito'],
    [291, 372, 'Riodacito / Dacito'],
    [1096, 426, 'Traquiandesito'],
    [196, 443, 'Andesito'],
    [282, 564, 'Andesito / Basalto'],
    [1372, 547, 'Basanito / Nefelinito'],
    [1093, 637, 'Basalto alcalino'],
    [440, 668, 'Basalto subalcalino'],
  ])('rotulo em (%d, %d) px cai em %s', (px, py, n) => {
    expect(name('winchester-floyd-1977', row(px, py))).toBe(n);
  });
  it('razoes: Nb/Y e Zr/TiO2 com TiO2 em ppm (wt% x 10000)', () => {
    const r = classifyRow(def('winchester-floyd-1977'), { Nb: 6, Y: 30, Zr: 150, TiO2: 2 });
    expect(r.xy![0]).toBeCloseTo(Math.log10(0.2), 9);
    expect(r.xy![1]).toBeCloseTo(Math.log10(150 / 20000), 9);
  });
  it('faltas e invalidos', () => {
    expect(classifyRow(def('winchester-floyd-1977'), { Nb: 6, Y: 30, Zr: 150 }).status).toBe('ausente');
    expect(classifyRow(def('winchester-floyd-1977'), { Nb: 0, Y: 30, Zr: 150, TiO2: 2 }).status).toBe('invalido');
  });
});

describe('exemplos dos modulos de geoquimica', () => {
  it.each([['shand-1943'], ['afm'], ['pearce-norry-1979'], ['winchester-floyd-1977']])('%s: exemplo classifica todas as linhas', (id) => {
    const d = def(id);
    const t = parseText(d.exampleCsv!);
    expect(t.rows.length).toBeGreaterThan(1);
    for (const r of t.rows) expect(['ok', 'ambiguo', 'fora do campo']).toContain(classifyRow(d, r, {}).status);
  });
  it('exemplo do AFM e do Shand batem com o nome da linha', () => {
    for (const id of ['shand-1943', 'afm']) {
      const d = def(id);
      for (const r of parseText(d.exampleCsv!).rows) {
        const expected = String(r.Amostra).replace(/^Exemplo \d+ /, '').toLowerCase();
        expect(classifyRow(d, r, {}).name!.toLowerCase()).toContain(expected.replace('toleítica', 'toleítica').slice(0, 5));
      }
    }
  });
});
