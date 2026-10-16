import { classifyRow } from '../src/core/classify';
import { getDiagram } from '../src/diagrams';
import { renderDiagram } from '../src/core/render';
import type { DiagramDef, Row } from '../src/core/types';

const def = (id: string) => getDiagram(id) as DiagramDef;
const c = (id: string, row: Row, opts: Record<string, boolean> = {}) => classifyRow(def(id), row, opts);

describe('Granulometria (escala da figura + peneiras)', () => {
  it.each([
    [300, 'Matacão'], [256, 'Matacão'], [100, 'Bloco'], [64, 'Bloco'], [10, 'Seixo'], [4, 'Seixo'],
    [3, 'Grânulo'], [2, 'Grânulo'],
    [1.5, 'Areia muito grossa'], [1, 'Areia muito grossa'], [0.7, 'Areia grossa'], [0.3, 'Areia média'],
    [0.2, 'Areia fina'], [0.1, 'Areia muito fina'], [0.062, 'Areia muito fina'],
    [0.03, 'Silte'], [0.004, 'Silte'], [0.001, 'Argila'],
  ])('%d mm -> %s', (d, name) => {
    expect(c('granulometria', { Diametro: d }).name).toBe(name);
  });
  it('mensagem traz phi e malha (mesh) da faixa de areia', () => {
    const r = c('granulometria', { Diametro: 1.5 });
    expect(r.message).toContain('φ = -0.58');
    expect(r.message).toContain('mesh 10–18');
    expect(c('granulometria', { Diametro: 0.3 }).message).toContain('mesh 35–60');
  });
  it('ausente / invalido', () => {
    expect(c('granulometria', { Diametro: null }).status).toBe('ausente');
    expect(c('granulometria', { Diametro: 0 }).status).toBe('invalido');
    expect(c('granulometria', { Diametro: -1 }).status).toBe('invalido');
    expect(c('granulometria', { Diametro: 'x' as unknown as number }).status).toBe('invalido');
  });
  it('a tabela de referencia traz todas as classes', () => {
    expect(def('granulometria').referenceTable!.rows.map((r) => r[0])).toEqual([
      'Matacão', 'Bloco', 'Seixo', 'Grânulo', 'Areia muito grossa', 'Areia grossa', 'Areia média', 'Areia fina', 'Areia muito fina', 'Silte', 'Argila',
    ]);
  });
});

describe('Produtos piroclasticos', () => {
  it.each([[300, 'Brecha'], [100, 'Aglomerado'], [10, 'Lapili-tufo'], [1.5, 'Tufo cinerítico'], [0.5, 'Tufo cinerítico'], [0.01, 'Tufo cinerítico']])('%d mm -> %s', (d, n) => {
    expect(c('piroclasticos', { Diametro: d }).name).toBe(n);
  });
  it('mensagem diz o produto piroclastico', () => {
    expect(c('piroclasticos', { Diametro: 300 }).message).toContain('bloco');
    expect(c('piroclasticos', { Diametro: 10 }).message).toContain('lapili');
    expect(c('piroclasticos', { Diametro: 0.5 }).message).toContain('cinza');
  });
});

describe('Dobras: angulo interflanco', () => {
  it.each([[0, 'Isoclinal'], [15, 'Cerrada'], [30, 'Fechada'], [50, 'Fechada'], [70, 'Aberta'], [119, 'Aberta'], [120, 'Suave'], [180, 'Suave']])('%d° -> %s', (a, n) => {
    expect(c('dobras-interflanco', { Angulo: a }).name).toBe(n);
  });
  it('fora de 0-180 e invalido', () => {
    expect(c('dobras-interflanco', { Angulo: 200 }).status).toBe('invalido');
    expect(c('dobras-interflanco', { Angulo: -5 }).status).toBe('invalido');
    expect(c('dobras-interflanco', { Angulo: null }).status).toBe('ausente');
  });
});

describe('Exagero vertical (abaco): tan(aparente) = exagero x tan(real)', () => {
  it('45 graus com exagero 3 vira 71.6', () => {
    const r = c('exagero-vertical', { Exagero: 3, Mergulho: 45 });
    expect(r.name).toBe('71.6°');
    expect(r.xy![0]).toBe(45);
    expect(r.xy![1]).toBeCloseTo(71.565, 2);
  });
  it('exagero 1 nao muda; 0 e 90 ficam; invalidos', () => {
    expect(c('exagero-vertical', { Exagero: 1, Mergulho: 33 }).name).toBe('33°');
    expect(c('exagero-vertical', { Exagero: 5, Mergulho: 0 }).name).toBe('0°');
    expect(c('exagero-vertical', { Exagero: 5, Mergulho: 90 }).name).toBe('90°');
    expect(c('exagero-vertical', { Exagero: 0, Mergulho: 30 }).status).toBe('invalido');
    expect(c('exagero-vertical', { Exagero: 3, Mergulho: 95 }).status).toBe('invalido');
    expect(c('exagero-vertical', { Exagero: 3, Mergulho: null }).status).toBe('ausente');
  });
  it('curvas do abaco: exagero 2, 3, 5 e 10 como linhas de referencia', () => {
    const lines = def('exagero-vertical').extraLines!;
    expect(lines.map((l) => l.name)).toEqual(['2×', '3×', '5×', '10×']);
    const l3 = lines[1].points;
    const mid = l3.find((p) => Math.abs(p[0] - 45) < 0.5)!;
    expect(mid[1]).toBeCloseTo(71.565, 0);
  });
});

describe('Dobras de Fleuty', () => {
  const f = (MergulhoPA: number, CaimentoEixo: number) => c('dobras-fleuty', { MergulhoPA, CaimentoEixo });
  it.each([
    [85, 5, 'Normal horizontal'],
    [85, 15, 'Normal com caimento fraco'],
    [85, 45, 'Normal com caimento moderado'],
    [70, 20, 'Normal inclinada com caimento fraco'],
    [45, 5, 'Horizontal moderadamente inclinada'],
    [20, 5, 'Horizontal fracamente inclinada'],
    [5, 3, 'Recumbente'],
    [85, 85, 'Vertical'],
    [50, 49.5, 'Reclinada'],
  ])('plano axial %d° e eixo %d° -> %s', (dip, plunge, n) => {
    expect(f(dip, plunge).name).toBe(n);
  });
  it('caimento maior que o mergulho do plano axial e geometricamente impossivel', () => {
    expect(f(30, 50).status).toBe('invalido');
    expect(f(-1, 0).status).toBe('invalido');
    expect(f(95, 0).status).toBe('invalido');
    expect(f(40, null as unknown as number).status).toBe('ausente');
  });
  it('plota no grafico (x = mergulho do plano axial, y = caimento) e desenha a linha das reclinadas', () => {
    const r = f(70, 20);
    expect(r.xy).toEqual([70, 20]);
    expect(def('dobras-fleuty').extraLines!.some((l) => l.name.includes('reclinadas'))).toBe(true);
    const svg = renderDiagram(def('dobras-fleuty'), [{ id: '0', label: 'x', xy: [70, 20], panel: 'main', classification: 'x' }]);
    expect(svg.querySelectorAll('.pt')).toHaveLength(1);
    expect(svg.outerHTML).not.toContain('NaN');
  });
});

describe('Conglomerados (Pettijohn, 1975, modificado)', () => {
  const g = (row: Row) => c('conglomerados', row);
  it('ortoconglomerados', () => {
    expect(g({ Origem: 'extraformacional', Matriz: 5, Metaestaveis: 5 }).name).toBe('Conglomerado oligomítico');
    const p = g({ Origem: 'Extraformacional', Matriz: 5, Metaestaveis: 20 });
    expect(p.name).toBe('Conglomerado petromítico ou polimítico');
    expect(p.message).toContain('não define');
  });
  it('paraconglomerados', () => {
    expect(g({ Origem: 'extraformacional', Matriz: 30, MatrizLaminada: 'sim' }).name).toBe('Lamito ou argilito conglomerático');
    expect(g({ Origem: 'extraformacional', Matriz: 30, MatrizLaminada: 'não', Glacial: 'sim' }).name).toBe('Tilito (glacial)');
    expect(g({ Origem: 'extraformacional', Matriz: 30, MatrizLaminada: 'nao', Glacial: 'não' }).name).toBe('Tilóide (não glacial)');
  });
  it('intraformacional', () => {
    expect(g({ Origem: 'intraformacional' }).name).toBe('Conglomerado intraformacional');
  });
  it('dados que faltam: ausente com motivo', () => {
    expect(g({ Origem: 'extraformacional', Matriz: 5 }).status).toBe('ausente');
    expect(g({ Origem: 'extraformacional', Matriz: 30 }).status).toBe('ausente');
    expect(g({ Origem: null, Matriz: 5 }).status).toBe('ausente');
    expect(g({ Origem: 'talvez', Matriz: 5 }).status).toBe('invalido');
  });
});

describe('Tectonitos de falha (Sibson, 1977)', () => {
  const t = (row: Row) => c('tectonitos', row);
  it('sem coesao', () => {
    expect(t({ Coesao: 'não', Trama: 'aleatória', Fragmentos: 50 }).name).toBe('Brecha de falha');
    expect(t({ Coesao: 'não', Trama: 'aleatória', Fragmentos: 10 }).name).toBe('Farinha de rocha (gouge)');
    expect(t({ Coesao: 'não', Trama: 'foliada', Fragmentos: 50 }).status).toBe('fora do campo'); // "?" na figura
  });
  it('vitreo', () => {
    expect(t({ Coesao: 'sim', Vitreo: 'sim' }).name).toBe('Pseudotaquilito');
  });
  it('brechas de moagem (matriz < 10%)', () => {
    expect(t({ Coesao: 'sim', Trama: 'aleatória', Matriz: 5, TamFragmento: 1 }).name).toBe('Brecha de moagem');
    expect(t({ Coesao: 'sim', Trama: 'aleatória', Matriz: 5, TamFragmento: 0.3 }).name).toBe('Brecha de moagem fina');
    expect(t({ Coesao: 'sim', Trama: 'aleatória', Matriz: 5, TamFragmento: 0.05 }).name).toBe('Microbrecha de moagem');
  });
  it('series dos cataclasitos e dos milonitos', () => {
    expect(t({ Coesao: 'sim', Trama: 'aleatória', Matriz: 30 }).name).toBe('Protocataclasito');
    expect(t({ Coesao: 'sim', Trama: 'aleatória', Matriz: 70 }).name).toBe('Cataclasito');
    expect(t({ Coesao: 'sim', Trama: 'aleatória', Matriz: 95 }).name).toBe('Ultracataclasito');
    expect(t({ Coesao: 'sim', Trama: 'foliada', Matriz: 30 }).name).toBe('Protomilonito');
    expect(t({ Coesao: 'sim', Trama: 'foliada', Matriz: 70 }).name).toBe('Milonito');
    expect(t({ Coesao: 'sim', Trama: 'foliada', Matriz: 95 }).name).toBe('Ultramilonito (filonito)');
  });
  it('recristalizacao pronunciada e blastomilonito; foliada com matriz < 10% nao tem nome', () => {
    expect(t({ Coesao: 'sim', Trama: 'foliada', Recristalizacao: 'sim' }).name).toBe('Blastomilonito');
    expect(t({ Coesao: 'sim', Trama: 'foliada', Matriz: 5 }).status).toBe('fora do campo');
  });
  it('faltas', () => {
    expect(t({ Coesao: null }).status).toBe('ausente');
    expect(t({ Coesao: 'sim', Trama: 'aleatória' }).status).toBe('ausente'); // sem matriz
    expect(t({ Coesao: 'quem sabe' }).status).toBe('invalido');
  });
});

describe('modulos so de referencia', () => {
  it('estimativa de porcentagem e metamorficas existem e nao tem dados', () => {
    expect(def('estimativa-porcentagem').kind).toBe('reference');
    expect(def('rochas-metamorficas').kind).toBe('reference');
    expect(def('rochas-metamorficas').referenceTable!.rows.length).toBe(6);
  });
});
