import { FEOT_TO_FE2O3T, TI_PPM_PER_TIO2 } from '../src/core/constants';
import { classifyRow } from '../src/core/classify';
import { CRITERIA, peate, PEATE_TYPES } from '../src/diagrams/peate';
import type { Row } from '../src/core/types';

const OPTS = { prioridade: true };
const cls = (row: Row, opts: Record<string, boolean> = OPTS) => classifyRow(peate, row, opts);

// uma amostra que satisfaz todos os 12 critérios de cada tipo (valores calculados à mão a partir da Tabela 2)
const S: Record<string, Row> = {
  urubici: { SiO2: 50, TiO2: 4, P2O5: 0.6, Fe2O3t: 13, Sr: 700, Ba: 800, Zr: 300, Y: 40 },
  pitanga: { SiO2: 48, TiO2: 3.2, P2O5: 0.45, Fe2O3t: 15, Sr: 450, Ba: 500, Zr: 280, Y: 38 },
  paranapanema: { SiO2: 50, TiO2: 2.6, P2O5: 0.4, Fe2O3t: 14, Sr: 330, Ba: 400, Zr: 190, Y: 33 },
  ribeira: { SiO2: 50, TiO2: 2.0, P2O5: 0.3, Fe2O3t: 14, Sr: 300, Ba: 400, Zr: 150, Y: 37 },
  esmeralda: { SiO2: 52, TiO2: 1.3, P2O5: 0.15, Fe2O3t: 13, Sr: 180, Ba: 200, Zr: 100, Y: 26 },
  gramado: { SiO2: 54, TiO2: 1.0, P2O5: 0.1, Fe2O3t: 11, Sr: 200, Ba: 250, Zr: 110, Y: 28 },
};

describe('Peate et al. (1992) - Tabela 2', () => {
  it('12 criterios e 6 magma-tipos, cada tipo com regra para os 12', () => {
    expect(CRITERIA.map((c) => c.id)).toEqual(['SiO2', 'TiO2', 'P2O5', 'Fe2O3t', 'Sr', 'Ba', 'Zr', 'TiZr', 'TiY', 'ZrY', 'SrY', 'BaY']);
    expect(PEATE_TYPES.map((t) => t.name)).toEqual(['Urubici', 'Pitanga', 'Paranapanema', 'Ribeira', 'Esmeralda', 'Gramado']);
    for (const t of PEATE_TYPES) expect(Object.keys(t.rules).sort()).toEqual(CRITERIA.map((c) => c.id).sort());
  });

  it.each(Object.entries(S))('amostra tipica de %s cai so nele', (id, row) => {
    const r = cls(row);
    expect(r.status).toBe('ok');
    expect(r.name).toBe(PEATE_TYPES.find((t) => t.id === id)!.name);
  });

  it('sem prioridade, Urubici tambem satisfaz Pitanga: ambiguo', () => {
    const r = cls(S.urubici, {});
    expect(r.status).toBe('ambiguo');
    expect(r.name).toBe('Ambíguo: Urubici / Pitanga');
  });
  it('com prioridade, escolhe Urubici e avisa que Pitanga tambem serve', () => {
    const r = cls(S.urubici);
    expect(r.name).toBe('Urubici');
    expect(r.message).toContain('Pitanga');
  });

  it('limites: ">" e estrito, faixa e inclusiva', () => {
    // Y = 36 mantém Ti/Y > 500 mesmo com TiO2 baixo, isolando o limite do TiO2 (> 3.3)
    expect(cls({ ...S.urubici, TiO2: 3.3, Y: 36 }).name).not.toBe('Urubici');
    expect(cls({ ...S.urubici, TiO2: 3.31, Y: 36 }).name).toBe('Urubici');
    // faixa inclusiva: Paranapanema com Zr = 250 (limite superior 120-250) continua Paranapanema
    const para = { ...S.paranapanema, TiO2: 2.8, Y: 40 };
    expect(cls({ ...para, Zr: 250 }).name).toBe('Paranapanema');
    expect(cls({ ...para, Zr: 251 }).name).not.toBe('Paranapanema');
    // Gramado: TiO2 0.7-2.0 inclusivo (Zr/Y escolhidos para manter as razoes dentro das faixas)
    const gra = { ...S.gramado, Zr: 180, Y: 40 };
    expect(cls({ ...gra, TiO2: 2.0 }).name).toBe('Gramado');
    expect(cls({ ...gra, TiO2: 2.01 }).name).not.toBe('Gramado');
  });

  it('razoes sao calculadas com Ti = TiO2 x 5993,2 ppm (derivado dos pesos atômicos)', () => {
    const r = cls(S.pitanga);
    const v = (r.detail as { values: Record<string, number> }).values;
    expect(v.TiZr).toBeCloseTo((3.2 * TI_PPM_PER_TIO2) / 280, 6);
    expect(v.TiY).toBeCloseTo((3.2 * TI_PPM_PER_TIO2) / 38, 6);
    expect(v.ZrY).toBeCloseTo(280 / 38, 6);
    expect(v.SrY).toBeCloseTo(450 / 38, 6);
    expect(v.BaY).toBeCloseTo(500 / 38, 6);
  });

  it('FeOt vira Fe2O3(t) quando Fe2O3t esta ausente', () => {
    const { Fe2O3t: _f, ...rest } = S.urubici;
    void _f;
    const r = cls({ ...rest, FeOt: 11.7 });
    const v = (r.detail as { values: Record<string, number> }).values;
    expect(v.Fe2O3t).toBeCloseTo(11.7 * FEOT_TO_FE2O3T, 6);
  });

  it('criterio sem dado nao conta contra a amostra', () => {
    const { Ba: _b, Sr: _s, ...rest } = S.gramado;
    void _b; void _s;
    const r = cls(rest);
    expect(r.name).toBe('Gramado');
  });
  it('minimo de 5 criterios avaliaveis', () => {
    // TiO2, Zr, Ti/Zr, Ti/Y e Zr/Y = 5 avaliaveis: ja classifica
    expect(cls({ TiO2: 1, Zr: 110, Y: 28 }).status).not.toBe('ausente');
    // so TiO2 e Zr = 3 avaliaveis (TiO2, Zr, Ti/Zr): ausente
    const r = cls({ TiO2: 1, Zr: 110 });
    expect(r.status).toBe('ausente');
    expect(r.message).toContain('5');
    expect(cls({ SiO2: 50, TiO2: 1 }).status).toBe('ausente');
  });
  it('valores invalidos', () => {
    expect(cls({ ...S.gramado, TiO2: -1 }).status).toBe('invalido');
    expect(cls({ ...S.gramado, Zr: 'abc' as unknown as number }).status).toBe('invalido');
  });
  it('Y ou Zr zero nao gera NaN: razoes ficam sem dado', () => {
    const r = cls({ ...S.gramado, Y: 0 });
    expect(JSON.stringify(r)).not.toContain('NaN');
    const v = (r.detail as { values: Record<string, number | null> }).values;
    expect(v.TiY).toBeNull(); expect(v.ZrY).toBeNull();
  });
  it('LOI > 2.5 marca a amostra como alterada, mas classifica', () => {
    const r = cls({ ...S.gramado, LOI: 3.1 });
    expect(r.status).toBe('ok');
    expect(r.name).toContain('Gramado');
    expect(r.name).toContain('LOI');
    expect(cls({ ...S.gramado, LOI: 2.5 }).name).toBe('Gramado');
  });
  it('nenhum tipo satisfaz: nao classificado com melhor ajuste', () => {
    const r = cls({ SiO2: 50, TiO2: 2.5, P2O5: 0.3, Fe2O3t: 14, Sr: 100, Ba: 100, Zr: 400, Y: 20 });
    expect(r.status).toBe('nao classificado');
    expect(r.name).toMatch(/^Não classificado/);
  });
  it('detalhe por tipo traz ok/fail/na para os 12 criterios', () => {
    const d = cls(S.gramado).detail as { perType: Record<string, { results: Record<string, string> }> };
    expect(Object.keys(d.perType)).toHaveLength(6);
    expect(Object.values(d.perType.gramado.results).every((x) => x === 'ok')).toBe(true);
  });
});
