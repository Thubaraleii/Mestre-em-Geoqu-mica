import { LITHOLOGIES, lithologySwatch, renderLithology, TINT } from '../src/ui/conventionsView';
import { getDiagram } from '../src/diagrams';
import { mountApp } from '../src/ui/app';

describe('convencoes litologicas', () => {
  it('33 litologias da legenda: 7 igneas, 9 metamorficas, 17 sedimentares', () => {
    expect(LITHOLOGIES).toHaveLength(33);
    const count = (g: string) => LITHOLOGIES.filter((l) => l.group === g).length;
    expect(count('Rochas ígneas')).toBe(7);
    expect(count('Rochas metamórficas')).toBe(9);
    expect(count('Rochas sedimentares')).toBe(17);
    expect(new Set(LITHOLOGIES.map((l) => l.name)).size).toBe(33);
  });
  it('cores sugeridas conforme a legenda; toda cor tem tom definido', () => {
    const by = (n: string) => LITHOLOGIES.find((l) => l.name === n)!;
    expect(by('Granito').color).toBe('Vermelho');
    expect(by('Basalto').color).toBe('Verde escuro');
    expect(by('Riolito').color).toBe('Cor de rosa');
    expect(by('Sienito').color).toBe('Verde claro');
    expect(by('Mármore calcítico').color).toBe('Azul escuro');
    expect(by('Mármore dolomítico').color).toBe('Azul claro');
    expect(by('Quartzito').color).toBe('Amarelo / Alaranjado');
    expect(by('Gnaisse').color).toBe('Salmão');
    expect(by('Migmatito').color).toBe('Vermelho claro');
    for (const l of LITHOLOGIES) if (l.color) expect(TINT[l.color], l.name).toBeDefined();
  });
  it('cada desenho e um SVG com o contorno e a camada de padrao, sem NaN', () => {
    for (const l of LITHOLOGIES) {
      const svg = lithologySwatch(l);
      expect(svg.querySelectorAll('path, circle').length, l.name).toBeGreaterThan(5);
      expect(svg.outerHTML, l.name).not.toContain('NaN');
    }
  });
  it('visao: 3 grupos e 33 desenhos legendados', () => {
    const v = renderLithology();
    expect(v.querySelectorAll('h3')).toHaveLength(3);
    expect(v.querySelectorAll('figure.lit-swatch')).toHaveLength(33);
    expect(v.querySelector('figure[data-name="Calcário oolítico"] figcaption')!.textContent).toBe('Calcário oolítico');
  });
  it('modulo no menu, sem painel de dados', () => {
    expect(getDiagram('convencoes-litologicas')!.kind).toBe('reference');
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    const root = document.getElementById('app')!;
    mountApp(root);
    root.querySelector<HTMLButtonElement>('[data-diagram="convencoes-litologicas"]')!.click();
    expect(root.querySelectorAll('#chart figure.lit-swatch')).toHaveLength(33);
    expect(root.querySelector('.app')!.classList.contains('no-data')).toBe(true);
  });
});
