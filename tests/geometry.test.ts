import { pointInPolygon, ternaryXY, type Pt } from '../src/core/geometry';

const sq: Pt[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
const L: Pt[] = [[0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2]];

describe('pointInPolygon', () => {
  it('quadrado', () => {
    expect(pointInPolygon([0.5, 0.5], sq)).toBe('inside');
    expect(pointInPolygon([1, 0.5], sq)).toBe('edge');
    expect(pointInPolygon([0, 0], sq)).toBe('edge');
    expect(pointInPolygon([2, 2], sq)).toBe('outside');
  });
  it('poligono concavo', () => {
    expect(pointInPolygon([0.5, 1.5], L)).toBe('inside');
    expect(pointInPolygon([1.5, 1.5], L)).toBe('outside');
  });
});

describe('ternaryXY', () => {
  const h = Math.sqrt(3) / 2;
  it('vertices', () => {
    const [ax, ay] = ternaryXY(1, 0, 0);
    expect(ax).toBeCloseTo(0.5); expect(ay).toBeCloseTo(h);
    const [bx, by] = ternaryXY(0, 1, 0);
    expect(bx).toBeCloseTo(0); expect(by).toBeCloseTo(0);
    const [cx, cy] = ternaryXY(0, 0, 1);
    expect(cx).toBeCloseTo(1); expect(cy).toBeCloseTo(0);
  });
  it('centroide e renormalizacao', () => {
    const [x, y] = ternaryXY(1, 1, 1);
    expect(x).toBeCloseTo(0.5); expect(y).toBeCloseTo(h / 3);
    const [x2, y2] = ternaryXY(20, 20, 20);
    expect(x2).toBeCloseTo(0.5); expect(y2).toBeCloseTo(h / 3);
  });
});
