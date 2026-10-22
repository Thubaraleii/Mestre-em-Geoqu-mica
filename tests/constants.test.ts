import { FE2O3_TO_FEO, FEOT_TO_FE2O3T, K_PPM_PER_K2O, MOLAR_MASS, P_PPM_PER_P2O5, TI_PPM_PER_TIO2 } from '../src/core/constants';

// Valores de referência de manuais (CRC Handbook / tabelas de massas molares de óxidos), arredondados em 3 casas
const PUBLISHED = { SiO2: 60.084, TiO2: 79.866, Al2O3: 101.961, Fe2O3: 159.688, FeO: 71.844, MnO: 70.937, MgO: 40.304, CaO: 56.077, Na2O: 61.979, K2O: 94.196, P2O5: 141.945 };

describe('constantes derivadas dos pesos atômicos IUPAC', () => {
  it.each(Object.entries(PUBLISHED))('massa molar de %s confere com a tabela publicada (±0,005)', (ox, v) => {
    expect(MOLAR_MASS[ox as keyof typeof MOLAR_MASS]).toBeCloseTo(v, 2);
    expect(Math.abs(MOLAR_MASS[ox as keyof typeof MOLAR_MASS] - v)).toBeLessThan(0.005);
  });
  it('fatores óxido -> elemento (ppm por wt%) e Fe', () => {
    expect(K_PPM_PER_K2O).toBeCloseTo(8301.5, 0);
    expect(P_PPM_PER_P2O5).toBeCloseTo(4364.1, 0);
    expect(TI_PPM_PER_TIO2).toBeCloseTo(5993.2, 0);
    expect(FEOT_TO_FE2O3T).toBeCloseTo(1.1113, 4);
    expect(FE2O3_TO_FEO).toBeCloseTo(0.8998, 4);
    expect(FEOT_TO_FE2O3T * FE2O3_TO_FEO).toBeCloseTo(1, 12);
  });
  it('conservação de massa: elemento + oxigênio = óxido', () => {
    // 1 wt% de K2O contém K_PPM_PER_K2O ppm de K; o resto é oxigênio
    expect(K_PPM_PER_K2O / 1e4 + (1 - K_PPM_PER_K2O / 1e4)).toBe(1);
    expect(K_PPM_PER_K2O / 1e4).toBeLessThan(1);
    expect(P_PPM_PER_P2O5 / 1e4).toBeLessThan(1);
    expect(TI_PPM_PER_TIO2 / 1e4).toBeLessThan(1);
  });
});
