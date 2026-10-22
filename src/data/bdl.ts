// Valores abaixo do limite de detecção (LD): "<0,01", "< 0.5", "n.d.", "bdl"...
// Em geoquímica não se descarta nem se inventa o dado em silêncio: o tratamento é uma escolha explícita do usuário
// (substituição por LD/2 é a convenção mais comum; "sem dado" é a mais conservadora).
export type BdlPolicy = 'ausente' | 'metade' | 'limite';

export const BDL_LABEL: Record<BdlPolicy, string> = {
  ausente: 'Abaixo do limite (<LD) = sem dado',
  metade: 'Abaixo do limite = metade do LD',
  limite: 'Abaixo do limite = o próprio LD',
};

const LESS_THAN = /^\s*(?:<=|<|≤)\s*(\d+(?:[.,]\d+)?)\s*(?:ppm|ppb|wt\s*%|%)?\s*$/i;
const NOT_DETECTED = /^\s*(?:n\.?\s?d\.?|bdl|b\.?\s?d\.?\s?l\.?|<\s*l[dq]|<\s*lod|n[aã]o\s+detectado|abaixo\s+do\s+limite)\s*$/i;

export interface BdlResult { value: number | null; bdl: boolean; detectionLimit?: number }

/** Interpreta uma célula de texto. Texto que não é limite de detecção devolve `bdl: false` e `value: null`. */
export function parseBdl(text: string, policy: BdlPolicy): BdlResult {
  const m = LESS_THAN.exec(text);
  if (m) {
    const dl = Number(m[1].replace(',', '.'));
    if (!Number.isFinite(dl) || dl < 0) return { value: null, bdl: true };
    const value = policy === 'metade' ? dl / 2 : policy === 'limite' ? dl : null;
    return { value, bdl: true, detectionLimit: dl };
  }
  if (NOT_DETECTED.test(text)) return { value: null, bdl: true }; // sem valor de LD: não há o que substituir
  return { value: null, bdl: false };
}
