# Como adicionar um diagrama

Um diagrama é um objeto `DiagramDef` (veja `src/core/types.ts`). O mesmo objeto desenha o gráfico e classifica as amostras.

## 1. Crie o arquivo em `src/diagrams/`

Exemplo mínimo (diagrama cartesiano com dois campos):

```ts
import type { DiagramDef } from '../core/types';
import { readNum } from '../core/values';

export const meuDiagrama: DiagramDef = {
  id: 'meu-diagrama',          // usado no menu e no projeto salvo
  area: 'igneas',
  title: 'Meu diagrama (Autor, 2024)',
  panels: [{ id: 'main', type: 'cartesian', xLabel: 'X', yLabel: 'Y', xRange: [0, 100], yRange: [0, 10] }],
  fields: [
    { id: 'a', name: 'Campo A', color: '#a1d99b', panel: 'main', polygon: [[0, 0], [50, 0], [50, 10], [0, 10]] },
    { id: 'b', name: 'Campo B', color: '#fdae6b', panel: 'main', polygon: [[50, 0], [100, 0], [100, 10], [50, 10]] },
  ],
  requiredColumns: [['X'], ['Y']],   // nomes canônicos; o app detecta as colunas da tabela
  toPoint(row) {
    const x = readNum(row, 'X'), y = readNum(row, 'Y');
    if (x === 'bad' || y === 'bad') return { ok: false, reason: 'invalido', message: 'valor não numérico' };
    if (x === null || y === null) return { ok: false, reason: 'ausente', message: 'faltam X ou Y' };
    return { ok: true, panel: 'main', xy: [x, y] };
  },
};
```

Regras:
- Cada campo é um polígono `[x, y][]` no espaço do diagrama. Campos que dividem uma fronteira devem usar os mesmos vértices.
- `toPoint` converte uma linha em coordenadas ou devolve o motivo (`ausente`, `invalido`).
- Para diagramas ternários use `ternaryXY` de `src/core/geometry.ts` e preencha `outline` e `labels` do painel (veja `src/diagrams/qapf-shared.ts`).
- Opcional: `optionalColumns`, `options` (caixas de seleção na interface), `extraLines` (linhas de referência) e `short` nos campos (código curto quando o nome não cabe).

## 2. Registre em `src/diagrams/index.ts`

```ts
export const diagrams: DiagramDef[] = [tas, qapfPlutonic, qapfVolcanic, meuDiagrama];
```

## 3. Ative no menu

Em `src/ui/menu.ts`, troque a entrada "em breve" correspondente adicionando o `diagramId`: `m('Nome do módulo', 'meu-diagrama')`.

## 4. Teste

Crie `tests/meu-diagrama.test.ts` com:
- uma amostra de classificação conhecida para cada campo (`classifyRow(meuDiagrama, {...})`);
- um teste de cobertura por grade (veja `tests/tas.test.ts`) garantindo que não há sobreposição nem buracos;
- casos de borda: valor ausente, negativo, fora do domínio.

Rode `npm test`.
