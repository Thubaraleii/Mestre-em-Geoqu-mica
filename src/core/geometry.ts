export type Pt = [number, number];

const EPS = 1e-9;

function onSegment(p: Pt, a: Pt, b: Pt): boolean {
  const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  if (Math.abs(cross) / len > EPS) return false;
  const dot = (p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]);
  return dot >= -EPS && dot <= len * len + EPS;
}

export function pointInPolygon(p: Pt, poly: Pt[]): 'inside' | 'edge' | 'outside' {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (onSegment(p, a, b)) return 'edge';
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) {
      inside = !inside;
    }
  }
  return inside ? 'inside' : 'outside';
}

/** a no vertice superior, b embaixo-esquerda, c embaixo-direita; base de largura 1. */
export function ternaryXY(a: number, b: number, c: number): Pt {
  const s = a + b + c;
  const [na, nb, nc] = [a / s, b / s, c / s];
  void nb;
  return [nc + na / 2, (na * Math.sqrt(3)) / 2];
}
