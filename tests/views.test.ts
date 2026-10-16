import { dotCount, percentCircle } from '../src/ui/percentView';
import { mountApp } from '../src/ui/app';

let root: HTMLElement;
beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<div id="app"></div>';
  root = document.getElementById('app')!;
  mountApp(root);
});
const open = (id: string) => root.querySelector<HTMLButtonElement>(`[data-diagram="${id}"]`)!.click();
const example = () => root.querySelector<HTMLButtonElement>('#example')!.click();
const classes = () => [...root.querySelectorAll('td.cls')].map((c) => c.textContent);

describe('modulos de tabela (granulometria, tectonitos, conglomerados...)', () => {
  it('granulometria: exemplo classifica, destaca e conta as linhas da tabela de referencia', () => {
    open('granulometria');
    example();
    expect(classes()).toEqual(['Matacão', 'Bloco', 'Seixo', 'Grânulo', 'Areia muito grossa', 'Areia grossa', 'Areia média', 'Areia fina', 'Areia muito fina', 'Silte', 'Argila']);
    expect(root.querySelectorAll('#chart table.reftable tbody tr')).toHaveLength(11);
    expect(root.querySelectorAll('#chart tr.hit')).toHaveLength(11);
    expect(root.querySelector('#chart tr.sel')!.getAttribute('data-key')).toBe('Matacão');
    root.querySelectorAll<HTMLTableRowElement>('#table tbody tr')[8].click();
    expect(root.querySelector('#chart tr.sel')!.getAttribute('data-key')).toBe('Areia muito fina');
  });

  it('tectonitos: exemplo cobre os 13 nomes e a mensagem de "?" aparece como fora do campo', () => {
    open('tectonitos');
    example();
    expect(classes()).toHaveLength(10);
    expect(classes()).toContain('Blastomilonito');
    expect(root.querySelectorAll('#chart table.reftable tbody tr')).toHaveLength(13);
  });

  it('conglomerados: exemplo de 6 linhas, todas classificadas', () => {
    open('conglomerados');
    example();
    expect(classes()).toEqual([
      'Conglomerado oligomítico', 'Conglomerado petromítico ou polimítico', 'Lamito ou argilito conglomerático',
      'Tilito (glacial)', 'Tilóide (não glacial)', 'Conglomerado intraformacional',
    ]);
  });

  it('dobras de interflanco e piroclasticos carregam exemplo', () => {
    open('dobras-interflanco'); example();
    expect(classes()).toEqual(['Isoclinal', 'Cerrada', 'Fechada', 'Aberta', 'Suave']);
    open('piroclasticos'); example();
    expect(classes()).toEqual(['Brecha', 'Aglomerado', 'Lapili-tufo', 'Tufo cinerítico', 'Tufo cinerítico', 'Tufo cinerítico']);
  });
});

describe('graficos: Fleuty e exagero vertical', () => {
  it('Fleuty: grafico com campos, linha das reclinadas e pontos do exemplo', () => {
    open('dobras-fleuty');
    example();
    expect(root.querySelector('#chart svg')).not.toBeNull();
    expect(root.querySelectorAll('#chart path.field').length).toBeGreaterThan(10);
    expect(root.querySelectorAll('#chart path.extra')).toHaveLength(1);
    expect(root.querySelectorAll('#chart .pt')).toHaveLength(8);
    expect(classes()).toContain('Vertical');
    expect(classes()).toContain('Reclinada');
  });

  it('exagero vertical: curvas do abaco e pontos', () => {
    open('exagero-vertical');
    example();
    expect(root.querySelectorAll('#chart path.extra')).toHaveLength(4);
    expect(root.querySelectorAll('#chart .pt')).toHaveLength(8);
    expect(classes()[3]).toBe('71.6°');
  });
});

describe('modulos so de referencia (sem painel de dados)', () => {
  it('rochas metamorficas: tabela de 6 linhas e painel de dados escondido', () => {
    open('rochas-metamorficas');
    expect(root.querySelectorAll('#chart table.reftable tbody tr')).toHaveLength(6);
    expect(root.querySelector('.app')!.classList.contains('no-data')).toBe(true);
    open('tas');
    expect(root.querySelector('.app')!.classList.contains('no-data')).toBe(false);
  });

  it('estimativa de porcentagem: circulos gerados e campo de porcentagem', () => {
    open('estimativa-porcentagem');
    expect(root.querySelectorAll('.percent-gallery svg')).toHaveLength(20); // 10 porcentagens x 2 granulacoes
    expect(root.querySelectorAll('.percent-out svg')).toHaveLength(2);
    const input = root.querySelector<HTMLInputElement>('#percent-input')!;
    const before = root.querySelector('.percent-out svg')!.querySelectorAll('ellipse').length;
    input.value = '40'; input.dispatchEvent(new Event('input'));
    expect(root.querySelector('.percent-out svg')!.querySelectorAll('ellipse').length).toBeGreaterThan(before);
  });

  it('a quantidade de graos cobre a porcentagem pedida (area ~ p%)', () => {
    for (const p of [1, 5, 20, 50]) {
      const n = dotCount(p, 4.32, 2.24);
      // cobertura esperada com sobreposicao aleatoria: 1 - exp(-n a / A)
      const cover = 1 - Math.exp(-(n * 4.32 * 2.24) / (60 * 60));
      expect(cover * 100).toBeCloseTo(p, 0);
    }
    expect(percentCircle(10, 3, 1).querySelectorAll('ellipse').length).toBe(dotCount(10, 3 * 1.35, 3 * 0.7));
    expect(dotCount(0, 3, 2)).toBe(0);
  });
});
