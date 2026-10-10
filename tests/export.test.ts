import { rowsToCsv, svgToString } from '../src/core/export';
import { renderDiagram } from '../src/core/render';
import { tas } from '../src/diagrams/tas';
import { parseText } from '../src/data/parse';

describe('export', () => {
  it('svgToString tem xmlns e volta a ser SVG', () => {
    const s = svgToString(renderDiagram(tas, []));
    expect(s.startsWith('<?xml')).toBe(true);
    const doc = new DOMParser().parseFromString(s, 'image/svg+xml');
    expect(doc.documentElement.nodeName).toBe('svg');
    expect(doc.documentElement.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });
  it('CSV com colunas extras e aspas', () => {
    const csv = rowsToCsv(
      [{ id: 'a;b', SiO2: 49.5, nota: 'diz "oi"' }],
      [{ status: 'ok', name: 'Basalto' }],
    ).replace(/^\uFEFF/, '');
    const [head, line] = csv.split('\r\n');
    expect(head).toBe('id;SiO2;nota;Classificação;Status');
    expect(line).toBe('"a;b";49,5;"diz ""oi""";Basalto;ok');
  });
  it('CSV so com cabecalho; valores nulos viram vazio; reimportavel', () => {
    expect(rowsToCsv([], []).replace(/^\uFEFF/, '').trim()).toBe('Classificação;Status');
    const csv = rowsToCsv([{ a: 1.5, b: null }], [{ status: 'ausente', message: 'x' }]);
    const t = parseText(csv.replace(/^\uFEFF/, ''));
    expect(t.rows[0].a).toBe(1.5);
  });
});
