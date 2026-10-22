// Constantes de conversão DERIVADAS dos pesos atômicos padrão (IUPAC/CIAAW, valores abreviados 2021),
// em vez de números soltos espalhados pelo código. Toda conversão óxido <-> elemento do app sai daqui.
// Fonte dos pesos: https://ciaaw.org/atomic-weights.htm (Commission on Isotopic Abundances and Atomic Weights).

export const ATOMIC_WEIGHT = {
  H: 1.008, O: 15.999, Na: 22.98977, Mg: 24.305, Al: 26.98154, Si: 28.085, P: 30.97376,
  K: 39.0983, Ca: 40.078, Ti: 47.867, Mn: 54.93804, Fe: 55.845,
} as const;

const A = ATOMIC_WEIGHT;

/** massa molar (g/mol) dos óxidos principais */
export const MOLAR_MASS = {
  SiO2: A.Si + 2 * A.O,
  TiO2: A.Ti + 2 * A.O,
  Al2O3: 2 * A.Al + 3 * A.O,
  Fe2O3: 2 * A.Fe + 3 * A.O,
  FeO: A.Fe + A.O,
  MnO: A.Mn + A.O,
  MgO: A.Mg + A.O,
  CaO: A.Ca + A.O,
  Na2O: 2 * A.Na + A.O,
  K2O: 2 * A.K + A.O,
  P2O5: 2 * A.P + 5 * A.O,
} as const;

const PPM_PER_WT_PERCENT = 1e4;

/** ppm de elemento por 1 wt% do óxido */
export const K_PPM_PER_K2O = (PPM_PER_WT_PERCENT * 2 * A.K) / MOLAR_MASS.K2O;
export const P_PPM_PER_P2O5 = (PPM_PER_WT_PERCENT * 2 * A.P) / MOLAR_MASS.P2O5;
export const TI_PPM_PER_TIO2 = (PPM_PER_WT_PERCENT * A.Ti) / MOLAR_MASS.TiO2;

/** Fe2O3 equivalente a 1 de FeO total (2 FeO -> Fe2O3) e o inverso */
export const FEOT_TO_FE2O3T = MOLAR_MASS.Fe2O3 / (2 * MOLAR_MASS.FeO);
export const FE2O3_TO_FEO = (2 * MOLAR_MASS.FeO) / MOLAR_MASS.Fe2O3;
