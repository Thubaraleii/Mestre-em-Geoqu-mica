import { brandColor, SERIES } from '../src/core/palette';
import { diagrams } from '../src/diagrams';

const hue = (hex: string) => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return -1;
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return h * 60;
};

describe('paleta de marca', () => {
  it('nenhum preenchimento sai fora das famílias de marca (sem azul/violeta/rosa)', () => {
    for (const d of diagrams) for (const f of d.fields) {
      const h = hue(brandColor(f.color));
      if (h < 0) continue;
      expect(h >= 15 && h <= 50 || h >= 160 && h <= 195, `${d.id}/${f.id} ${f.color}->${brandColor(f.color)} hue ${h}`).toBe(true);
    }
  });
  it('preserva a luminosidade: claro continua claro', () => {
    const lum = (c: string) => { const n = parseInt(c.slice(1), 16); return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11; };
    expect(Math.abs(lum(brandColor('#6baed6')) - lum('#6baed6'))).toBeLessThan(25);
  });
  it('série tem 8 cores distintas começando por teal e ferro', () => {
    expect(new Set(SERIES).size).toBe(8);
    expect(SERIES.slice(0, 2)).toEqual(['#2E7D73', '#B35A2E']);
  });
});
