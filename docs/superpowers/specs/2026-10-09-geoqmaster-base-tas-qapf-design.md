# GeoQMaster — Base, TAS e QAPF (design)

Data: 2026-10-09

## Objetivo

Aplicação web única que reúne diagramas e classificações geológicas. O usuário cola ou importa amostras, vê os pontos plotados nos diagramas e recebe a classificação automática de cada amostra. O projeto é um repositório git editável: adicionar um diagrama novo deve exigir apenas um arquivo novo.

## Decomposição em sub-projetos

1. **Base + diagramas plotáveis TAS e QAPF** (este documento).
2. Demais diagramas plotáveis (ultramáficas, gabroicos, arenitos, conglomerados, fácies metamórficas etc.).
3. Referências visuais (texturas, estruturas, convenções, tabela cronoestratigráfica, mapa geológico, estimativa de porcentagem).

Cada sub-projeto tem seu próprio ciclo de spec, plano e implementação.

## Escopo desta entrega

- Motor genérico de renderização e classificação.
- Entrada de dados (colar, importar CSV/XLSX, digitar).
- Diagramas: TAS, QAPF plutônico, QAPF vulcânico.
- Menu em árvore com a lista completa de áreas e módulos; os não implementados aparecem acinzentados ("em breve").

Fora do escopo: contas de usuário, backend, banco de dados, norma CIPW (evolução futura).

## Tecnologia

Vite + TypeScript, sem framework de UI, SVG próprio. Saída estática, publicável no GitHub Pages. Roda 100% no navegador.

## Estrutura

```
src/core/      geometry.ts (ponto-em-polígono, transformação ternária), render.ts (DiagramDef -> SVG), export.ts (SVG, PNG, CSV)
src/data/      parse.ts (colar/CSV/XLSX -> tabela), store.ts (localStorage, projeto .json)
src/diagrams/  um arquivo por diagrama + index.ts (registro)
src/ui/        menu, painel de dados, painel do gráfico
samples/       CSVs de exemplo
tests/         testes de classificação
docs/          como adicionar um diagrama
```

### DiagramDef

Objeto de dados com: tipo de eixo (cartesiano ou ternário), limites e rótulos, lista de campos (nome, polígono, cor) e função de entrada que converte colunas da amostra em coordenadas. O mesmo `DiagramDef` alimenta o renderizador e o classificador, de modo que o gráfico e a classificação não podem divergir.

## Interface e dados

- Layout: menu em árvore à esquerda, gráfico SVG ao centro (zoom, hover com nome e classificação), tabela editável de dados à direita ou embaixo.
- Entrada: colar da planilha (cabeçalho na primeira linha), importar `.csv`/`.xlsx`, digitar na tabela.
- Mapeamento de colunas: detecção automática de nomes conhecidos (`SiO2`, `Na2O`, `K2O`, `Q`, `A`, `P`, `F` e variações como `SiO2_wt`); seletor manual quando faltar.
- Agrupamento opcional por coluna (`Grupo`, `Unidade` ou `Litologia`) define cor e símbolo.
- Resultado: ponto no gráfico e coluna "Classificação" preenchida na tabela.
- Saídas: SVG, PNG, CSV classificado, arquivo de projeto `.json`.
- Persistência: autosave em `localStorage`; arquivo de projeto para transportar e versionar.

## Diagramas

### TAS (Le Bas et al., 1986; Le Maitre, 2002)

- Eixos: SiO2 (aprox. 41–77%) em X, Na2O + K2O (0–16%) em Y.
- Campos: picrobasalto, basalto, andesito basáltico, andesito, dacito, riolito, traquibasalto, traquiandesito basáltico, traquiandesito, traquito/traquidacito, tefrito/basanito, fonotefrito, tefrifonolito, fonolito, foidito.
- Opcionais: linha alcalina/subalcalina (Irvine & Baragar); versão plutônica (Middlemost, 1994).
- Pré-processamento: normalização anidra a 100%; conversão de ferro total opcional.

### QAPF (Streckeisen, 1976; Le Maitre, 2002)

- Duplo triângulo: Q-A-P (superior) e A-P-F (inferior). Q, A, P, F modais são renormalizados a 100% no triângulo correto.
- Versão plutônica: campos numerados e nomeados.
- Versão vulcânica: mesma geometria com nomenclatura vulcânica.
- O TAS é o caminho principal para vulcânicas com análise química; o QAPF vulcânico serve a rochas com moda.

## Casos de borda

- Ponto sobre fronteira: regra fixa (limite inferior inclusivo), marcado como "no limite".
- QAPF com Q > 0 e F > 0: inválido, com aviso.
- Valores ausentes, negativos ou soma zero: amostra sinalizada e não plotada.
- Fora do domínio: sinalizada como "fora do campo".

## Testes

- Amostras de classificação conhecida para cada campo de cada diagrama.
- Varredura em grade confirmando que os campos cobrem o diagrama sem buracos nem sobreposições.
- Casos de borda acima.
- Polígonos transcritos das publicações originais e conferidos contra elas.
