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
  it('nenhum preenchimento sai da paleta: vinho, sedimento quente ou cinza de rocha (sem azul/verde/violeta)', () => {
    for (const d of diagrams) for (const f of d.fields) {
      const c = brandColor(f.color);
      const n = parseInt(c.slice(1), 16), mx = Math.max(n >> 16 & 255, n >> 8 & 255, n & 255), mn = Math.min(n >> 16 & 255, n >> 8 & 255, n & 255);
      const sat = mx === mn ? 0 : (mx - mn) / (255 - Math.abs(mx + mn - 255));
      const h = hue(c);
      const ok = sat < 0.2 || h >= 335 || h <= 50;
      expect(ok, `${d.id}/${f.id} ${f.color}->${c} hue ${h} sat ${sat.toFixed(2)}`).toBe(true);
    }
  });
  it('preserva a luminosidade: claro continua claro', () => {
    const lum = (c: string) => { const n = parseInt(c.slice(1), 16); return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11; };
    expect(Math.abs(lum(brandColor('#6baed6')) - lum('#6baed6'))).toBeLessThan(25);
  });
  it('série tem 8 cores distintas começando por vinho e gabro', () => {
    expect(new Set(SERIES).size).toBe(8);
    expect(SERIES.slice(0, 2)).toEqual(['#7A1F28', '#3A3A40']);
  });
});
