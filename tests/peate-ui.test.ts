import { mountApp } from '../src/ui/app';

let root: HTMLElement;
beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<div id="app"></div>';
  root = document.getElementById('app')!;
  mountApp(root);
  root.querySelector<HTMLButtonElement>('[data-diagram="peate-1992"]')!.click();
});

const loadExample = () => root.querySelector<HTMLButtonElement>('#example')!.click();
const classes = () => [...root.querySelectorAll('td.cls')].map((c) => c.textContent);

describe('modulo Peate na interface', () => {
  it('mostra a tabela dos 12 criterios e 6 magma-tipos, sem grafico', () => {
    expect(root.querySelector('h1.title')!.textContent).toContain('Peate');
    expect(root.querySelectorAll('#chart table.criteria tbody tr')).toHaveLength(12);
    expect(root.querySelectorAll('#chart table.criteria thead th.type')).toHaveLength(6);
    expect(root.querySelector('#chart svg')).toBeNull();
    expect(root.querySelector<HTMLButtonElement>('#pick-mode')!.disabled).toBe(true);
    expect(root.querySelector<HTMLButtonElement>('#export-svg')!.disabled).toBe(true);
    expect(root.querySelector<HTMLButtonElement>('#export-png')!.disabled).toBe(true);
  });

  it('exemplo: classifica as 10 linhas', () => {
    loadExample();
    const c = classes();
    expect(c.slice(0, 6)).toEqual(['Urubici', 'Pitanga', 'Paranapanema', 'Ribeira', 'Esmeralda', 'Gramado']);
    expect(c[6]).toMatch(/^Gramado ⚠ LOI 3\.1/);
    expect(c[7]).toBe('Gramado');
    expect(c[8]).toMatch(/^Não classificado/);
    expect(root.querySelector('[data-status-row="9"]')!.textContent).toBe('ausente');
  });

  it('clicar numa linha mostra o veredito dela, criterio a criterio', () => {
    loadExample();
    expect(root.querySelector('.selected-line')!.textContent).toContain('Urubici');
    // a amostra 1 (Urubici) atende os 12 criterios de Urubici
    const urubiciCol = 2; // criterio, amostra, Urubici
    const first = [...root.querySelectorAll('#chart tbody tr')].map((tr) => tr.children[urubiciCol] as HTMLElement);
    expect(first.every((td) => td.classList.contains('ok'))).toBe(true);
    root.querySelectorAll<HTMLTableRowElement>('#table tbody tr')[1].click();
    expect(root.querySelector('.selected-line')!.textContent).toContain('Exemplo 02 Pitanga');
    expect(root.querySelector('.selected-line')!.textContent).toContain('→ Pitanga');
    // Pitanga atende os 12 criterios de Pitanga
    const pitangaCol = 3; // criterio, amostra, Urubici, Pitanga
    const cells = [...root.querySelectorAll('#chart tbody tr')].map((tr) => tr.children[pitangaCol] as HTMLElement);
    expect(cells.every((td) => td.classList.contains('ok'))).toBe(true);
    // e falha em Sr para Urubici (450 nao e > 550)
    const sr = [...root.querySelectorAll('#chart tbody tr')].find((tr) => tr.querySelector('th')!.textContent!.startsWith('Sr (')) as HTMLElement;
    expect(sr.children[2].classList.contains('fail')).toBe(true);
    expect(root.querySelectorAll('#table tbody tr.selected')).toHaveLength(1);
  });

  it('rodape mostra quantos criterios cada tipo nao atende', () => {
    loadExample();
    const foot = [...root.querySelectorAll('#chart tfoot td.fails')].map((td) => td.textContent);
    expect(foot).toHaveLength(6);
    expect(foot[0]).toBe('0'); // Urubici (linha 1)
  });

  it('prioridade Urubici > Pitanga e uma opcao ligada por padrao', () => {
    loadExample();
    const cb = root.querySelector<HTMLInputElement>('#opt-prioridade')!;
    expect(cb.checked).toBe(true);
    expect(classes()[0]).toBe('Urubici');
    cb.checked = false;
    cb.dispatchEvent(new Event('change'));
    expect(classes()[0]).toBe('Ambíguo: Urubici / Pitanga');
    expect(root.querySelector('[data-status-row="0"]')!.textContent).toBe('ambiguo');
  });

  it('colunas opcionais ficam disponiveis (Sr, Ba, LOI...)', () => {
    loadExample();
    for (const c of ['SiO2', 'P2O5', 'Fe2O3t', 'FeOt', 'Sr', 'Ba', 'LOI']) {
      expect(root.querySelector(`#map-${c}`), c).not.toBeNull();
    }
    expect(root.querySelector<HTMLSelectElement>('#map-Sr')!.value).toBe('Sr');
  });

  it('trocar para TAS reabilita exportacao e botao de pontos', () => {
    loadExample();
    root.querySelector<HTMLButtonElement>('[data-diagram="tas"]')!.click();
    expect(root.querySelector<HTMLButtonElement>('#export-svg')!.disabled).toBe(false);
    expect(root.querySelector<HTMLButtonElement>('#pick-mode')!.disabled).toBe(false);
    expect(root.querySelector('#chart svg')).not.toBeNull();
  });
});
