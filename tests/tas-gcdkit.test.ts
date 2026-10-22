// Validação do TAS contra uma implementação independente: a geometria exportada pelo GCDkit do usuário
// (fixture gerada por scripts/extract-gcdkit-tas.py a partir de "TAS Volcanic (Le Maitre et al. 1989).pdf").
// Os polígonos do app vieram de outra fonte (pyrolite), então a concordância aqui não é circular.
// Este teste já achou um erro real: a região superior (foidito/fonolito/traquito) estava errada no app.
import { readFileSync } from 'node:fs';
import { classifyRow } from '../src/core/classify';
import type { Pt } from '../src/core/geometry';
import { tas } from '../src/diagrams/tas';

interface Fixture { segments: [number, number, number, number][]; labels: { text: string; x: number; y: number }[]; calibration_residual: [number, number] }
const fx: Fixture = JSON.parse(readFileSync('tests/fixtures/tas-gcdkit.json', 'utf8'));

const TOL = 0.12; // unidades do diagrama (% em peso)
const DOMAIN = { x0: 41, x1: 77, y0: 0, y1: 16 };

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = dx || dy ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
const along = (a: Pt, b: Pt, n = 6): Pt[] => Array.from({ length: n }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / (n - 1), a[1] + ((b[1] - a[1]) * i) / (n - 1)] as Pt);
const inside = (p: Pt, m = 0.3) => p[0] > DOMAIN.x0 + m && p[0] < DOMAIN.x1 - m && p[1] > DOMAIN.y0 + m && p[1] < DOMAIN.y1 - m;
const near = (p: Pt, q: Pt) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.15;

const ours: [Pt, Pt][] = tas.fields.flatMap((f) => f.polygon.map((p, i) => [p, f.polygon[(i + 1) % f.polygon.length]] as [Pt, Pt]));
// só segmentos de fronteira (>= 0,3): marcas de escala e glifos ficam de fora
const theirs: [Pt, Pt][] = fx.segments
  .filter(([a, b, c, d]) => Math.hypot(c - a, d - b) >= 0.3)
  .map(([a, b, c, d]) => [[a, b], [c, d]] as [Pt, Pt]);
const minDist = (p: Pt, edges: [Pt, Pt][]) => Math.min(...edges.map(([a, b]) => distToSegment(p, a, b)));

// DIVERGÊNCIAS ABERTAS (documentadas em src/diagrams/tas.ts): o app segue o pyrolite onde GCDkit e pyrolite discordam
//  - fronteira dacito/riolito: GCDkit curva (69; 8)-(73,5; 3)-(75,78; 0); pyrolite e Wikimedia: reta até ~(77,3; 0)
//  - limite superior do riolito: GCDkit horizontal em y = 13; pyrolite inclinado
//  - moldura do GCDkit (topo em y = 15,5): não é fronteira de campo
const EXEMPT_THEIRS = (a: Pt, b: Pt) => {
  const topFrame = a[1] > 15.4 || b[1] > 15.4; // moldura superior do GCDkit (y = 15,5) e seus fechos
  const rhyoTop = Math.abs(a[1] - 13) < 0.05 && Math.abs(b[1] - 13) < 0.05 && Math.min(a[0], b[0]) >= 68.9;
  const dacRhy = [a, b].some((p) => near(p, [73.5, 3]) || near(p, [75.78, 0]));
  return topFrame || rhyoTop || dacRhy;
};
const EXEMPT_OURS = (a: Pt, b: Pt) => {
  const dacRhy = [a, b].some((p) => near(p, [77, 0.3])) && [a, b].some((p) => near(p, [69, 8]));
  const rhyoTop = [a, b].some((p) => near(p, [77, 10.06])) || [a, b].every((p) => Math.abs(p[0] - 77) < 1e-6);
  return dacRhy || rhyoTop;
};
const onFrame = (p: Pt) => p[0] <= DOMAIN.x0 + 1e-6 || p[0] >= DOMAIN.x1 - 1e-6 || p[1] <= DOMAIN.y0 + 1e-6 || p[1] >= DOMAIN.y1 - 1e-6;

describe('TAS: app x GCDkit (Le Maitre et al., 1989)', () => {
  it('a extração do PDF tem fronteiras e calibração consistente', () => {
    expect(fx.calibration_residual[0]).toBeLessThan(0.01);
    expect(fx.calibration_residual[1]).toBeLessThan(0.01);
    expect(theirs.length).toBeGreaterThan(30);
  });

  it('cada segmento interno do GCDkit existe no app (exceto as divergências documentadas)', () => {
    const missing: string[] = [];
    for (const [a, b] of theirs) {
      if (EXEMPT_THEIRS(a, b)) continue;
      // a moldura do gráfico (x = 35/80, y = 0) e o que cai fora do domínio do app não contam
      const pts = along(a, b).filter((p) => inside(p, 0.25));
      if (!pts.length) continue;
      const worst = Math.max(...pts.map((p) => minDist(p, ours)));
      if (worst > TOL) missing.push(`(${a[0]},${a[1]})-(${b[0]},${b[1]}) desvio ${worst.toFixed(2)}`);
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('cada aresta interna do app existe no GCDkit (exceto as divergências documentadas)', () => {
    const extra: string[] = [];
    for (const [a, b] of ours) {
      if (onFrame(a) && onFrame(b) && (a[0] === b[0] || a[1] === b[1])) continue;
      if (EXEMPT_OURS(a, b)) continue;
      // o GCDkit só desenha até y = 15: o prolongamento do app até y = 16 é extrapolação (documentada) e não é comparado
      const pts = along(a, b).filter((p) => inside(p, 0.25) && p[1] <= 15);
      if (!pts.length) continue;
      const worst = Math.max(...pts.map((p) => minDist(p, theirs)));
      if (worst > TOL) extra.push(`(${a[0]},${a[1]})-(${b[0]},${b[1]}) desvio ${worst.toFixed(2)}`);
    }
    expect(extra, extra.join('\n')).toEqual([]);
  });

  it('cada rótulo de campo do GCDkit cai no campo de mesmo nome no app', () => {
    const map: Record<string, string> = {
      'Phonotephrite': 'Fonotefrito', 'Foidite': 'Foidito', 'Trachyandesite': 'Traquiandesito', 'Trachybasalt': 'Traquibasalto', 'Dacite': 'Dacito',
      'Andesite': 'Andesito', 'Phonolite': 'Fonolito', 'Basalt': 'Basalto', 'Tephriphonolite': 'Tefrifonolito', 'Picrobasalt': 'Picrobasalto',
      'Rhyolite': 'Riolito', 'Trachyte': 'Traquito/Traquidacito', 'Trachydacite': 'Traquito/Traquidacito',
    };
    const wrong: string[] = [];
    for (const l of fx.labels) {
      if (l.x < DOMAIN.x0 || l.x > DOMAIN.x1 || l.y > DOMAIN.y1) continue; // rótulo fora do domínio do app (ex.: foidito em SiO2 = 37)
      // "Basaltic" / "Trachyandesite" é um rótulo de DUAS linhas: a 2ª linha (y < 8,2) nomeia o traquiandesito basáltico
      const expected = l.text === 'Trachyandesite' && l.y < 8.2 ? 'Traquiandesito basáltico' : map[l.text];
      if (!expected) continue;
      const got = classifyRow(tas, { SiO2: l.x, Na2O: l.y, K2O: 0 }).name;
      if (got !== expected) wrong.push(`${l.text} (${l.x}, ${l.y}) -> ${got}`);
    }
    expect(wrong, wrong.join('\n')).toEqual([]);
  });

  it('REGRESSÃO do erro achado: a fronteira foidito/fonolito sobe para a esquerda e fonolito/traquito é reta', () => {
    // antes: fronteira vertical em SiO2 = 52,5 e quebra em (63; 16,2)
    expect(classifyRow(tas, { SiO2: 50.5, Na2O: 15.5, K2O: 0 }).name).toBe('Fonolito'); // acima da linha (52,5; 14)-(49; 15,5)
    expect(classifyRow(tas, { SiO2: 50.5, Na2O: 13.0, K2O: 0 }).name).toBe('Foidito');
    expect(classifyRow(tas, { SiO2: 63, Na2O: 14, K2O: 0 }).name).toBe('Traquito/Traquidacito'); // à direita da reta fonolito/traquito
    expect(classifyRow(tas, { SiO2: 62, Na2O: 15, K2O: 0 }).name).toBe('Fonolito');
  });
});
