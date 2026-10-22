import { parseBdl } from '../src/data/bdl';
import { analyticalTotal } from '../src/data/quality';
import { mountApp } from '../src/ui/app';

describe('limite de detecção', () => {
  it('"<0,01" segue a política escolhida', () => {
    expect(parseBdl('<0,01', 'ausente')).toEqual({ value: null, bdl: true, detectionLimit: 0.01 });
    expect(parseBdl('< 0.5', 'metade').value).toBe(0.25);
    expect(parseBdl('<2 ppm', 'limite').value).toBe(2);
  });
  it('n.d., bdl e "não detectado" são sem dado; texto comum não é LD', () => {
    for (const t of ['n.d.', 'nd', 'BDL', 'b.d.l.', 'Não detectado']) expect(parseBdl(t, 'metade'), t).toEqual({ value: null, bdl: true });
    expect(parseBdl('basalto', 'metade').bdl).toBe(false);
    expect(parseBdl('<abc', 'metade').bdl).toBe(false);
  });
});

describe('soma analítica', () => {
  const ok = { SiO2: 50, TiO2: 1, Al2O3: 15, FeOt: 10, MnO: 0.2, MgO: 8, CaO: 11, Na2O: 2.5, K2O: 0.5, P2O5: 0.3, LOI: 1 };
  it('soma ~100 não gera aviso', () => {
    const t = analyticalTotal(ok)!;
    expect(t.total).toBeCloseTo(99.5, 5);
    expect(t.flag).toBeUndefined();
  });
  it('avisa soma fora de 98–101 e valores em fração', () => {
    expect(analyticalTotal({ ...ok, SiO2: 40 })!.flag).toMatch(/89,5%/);
    const frac = Object.fromEntries(Object.entries(ok).map(([k, v]) => [k, v / 100]));
    expect(analyticalTotal(frac)!.flag).toMatch(/frações/);
  });
  it('sem óxidos suficientes não opina', () => {
    expect(analyticalTotal({ SiO2: 50, Na2O: 2, K2O: 1 })).toBeNull();
  });
});

describe('interface: qualidade e LD', () => {
  const mount = () => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    const root = document.getElementById('app')!;
    mountApp(root);
    return root;
  };
  const paste = (root: HTMLElement, text: string) => {
    const ta = root.querySelector<HTMLTextAreaElement>('#paste')!;
    ta.value = text;
    ta.dispatchEvent(new Event('paste'));
  };
  it('"<0,01" vira sem dado (não "inválido") e a política muda o resultado', async () => {
    const root = mount();
    paste(root, 'SiO2;Na2O;K2O\n48;2;<0,01');
    await new Promise((r) => setTimeout(r, 5));
    expect(root.querySelector('#qc')!.textContent).toMatch(/1 valor\(es\) abaixo do limite/);
    const sel = root.querySelector<HTMLSelectElement>('#bdl-policy')!;
    sel.value = 'metade';
    sel.dispatchEvent(new Event('change'));
    expect(root.textContent).not.toMatch(/inválid/i);
  });
  it('avisa quando a soma dos óxidos está fora do esperado', async () => {
    const root = mount();
    paste(root, 'SiO2;TiO2;Al2O3;FeOt;MnO;MgO;CaO;Na2O;K2O;P2O5\n40;1;15;10;0.2;8;11;2.5;0.5;0.3');
    await new Promise((r) => setTimeout(r, 5));
    expect(root.querySelector('#qc')!.textContent).toMatch(/soma de óxidos fora de 98–101%/);
  });
});
