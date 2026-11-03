// Paleta MAFic: basalto, gabro, rocha ígnea, feições geológicas (vinho), sedimento e off-white, mais variações.
// Preenchimentos legados (verdes, azuis, roxos...) são remapeados para a família de marca mais próxima
// mantendo a luminosidade, para que campos vizinhos continuem distinguíveis.
export const BRAND = { basalt: '#1E1E22', gabbro: '#3A3A40', igneous: '#6B6B73', crimson: '#7A1F28', sediment: '#D6D3CB', offwhite: '#F6F3EE' } as const;

/** cores de série (pontos/grupos), em ordem de contraste */
export const SERIES = ['#7A1F28', '#3A3A40', '#C0525E', '#6B6B73', '#C98A4B', '#1E1E22', '#A89F94', '#E3A6AC'];

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** família de marca (matiz, saturação) para o matiz de entrada */
function family(h: number): [number, number] {
  if (h >= 335 || h < 22) return [350, 0.50];   // vermelhos/rosas -> vinho (feições geológicas)
  if (h < 65) return [30, 0.30];                // laranjas/amarelos -> sedimento quente
  return [250, 0.06];                           // verdes/azuis/roxos -> cinzas de rocha ígnea
}

const cache = new Map<string, string>();
/** remapeia uma cor hex (#rrggbb) para a paleta de marca, preservando a luminosidade */
export function brandColor(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const key = hex.toLowerCase();
  let out = cache.get(key);
  if (!out) {
    const [h, s, l] = hexToHsl(key);
    if (s < 0.08) out = key; // cinzas ficam como estão
    else { const [fh, fs] = family(h); out = hslToHex(fh, Math.min(fs, s * 0.9 + 0.1), l); }
    cache.set(key, out);
  }
  return out;
}
