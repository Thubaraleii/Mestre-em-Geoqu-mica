# GeoQMASTER

Notebook de análise geoquímica de amostras de diques e soleiras da Província Magmática do Paraná (dados compilados na planilha `Compilação dados quimicos PMP_S_EDFsimp.xlsx`, aba **"EDF dados gerais"**). O notebook lê, limpa e trata os dados brutos e, a partir deles, gera gráficos de distribuição, mapas geográficos e diagramas de classificação geoquímica (tipos de magma: Urubici, Pitanga, Paranapanema, Ribeira, Esmeralda e Gramado).

Feito para rodar no **Google Colab**, com a planilha de dados salva no Google Drive do usuário.

## Requisitos

- Conta Google com acesso ao Google Drive (o notebook monta o Drive automaticamente na primeira célula).
- A planilha `Compilação dados quimicos PMP_S_EDFsimp.xlsx` precisa estar em `MyDrive` (raiz do Google Drive), com a aba `EDF dados gerais`. Se o arquivo estiver em outra pasta, ajuste o caminho na variável `arquivo` do Bloco 1.
- Bibliotecas Python: `pandas`, `numpy`, `matplotlib`, `scipy`, `geopandas`, `contextily`, `xyzservices`. As duas últimas (mapas com fundo de satélite) já vêm pré-instaladas por um `!pip install` dentro do próprio notebook (Bloco 3) — não precisa instalar nada manualmente.

## Como rodar

1. Abra o notebook no Google Colab.
2. Rode a primeira célula para montar o Google Drive (vai pedir autorização de acesso).
3. Rode as células em ordem, de cima para baixo — os blocos dependem uns dos outros (por exemplo, o Bloco 4 usa o `df` já limpo pelo Bloco 1).
4. Se só quiser refazer um gráfico específico depois de mexer no código, é preciso ter rodado antes o Bloco 1 (leitura dos dados) e, no caso dos Blocos 4 e 5, todas as células de função daquele bloco antes da célula de execução final.

## Estrutura do notebook

**Célula inicial — Conexão com o Google Drive**
Monta o Drive em `/content/drive` para o pandas conseguir ler a planilha.

**Bloco 1 — Leitura e tratamento dos dados**
Lê a planilha Excel, remove colunas vazias/sem nome, limpa valores numéricos problemáticos (textos como `"< 13"`, `"6965 829"` ou vírgula decimal `"3,5"`), padroniza colunas categóricas (`Sample`, `Referência`, `Locality`, `Petrology`, `Country rock`, `ATi/BTi`, `Magma Type`) e cria razões geoquímicas úteis (`Zr/Y`, `Nb/Y`, `Sr/Y`, `TiO2/SiO2`). Também separa uma tabela à parte (`df_mapa`) só com as amostras que têm coordenadas Lat/Long válidas, e salva a tabela tratada em `EDF_dados_gerais_tratado.xlsx`.

**Bloco 2 — Gráficos matplotlib**
Quatro gráficos exploratórios, cada um com uma função de desenho seguida da chamada que gera o gráfico:
- Distribuição das amostras por magma-tipo (gráfico de barras).
- Distribuição de TiO2 por ATi/BTi (boxplot).
- Comparação geoquímica SiO2 vs TiO2, colorida por Magma Type (dispersão).
- Razões geoquímicas Zr/Y vs Nb/Y, coloridas por ATi/BTi (dispersão).

**Bloco 3 — Mapa com variação geoquímica e fundo de satélite**
Função `plotar_mapa_geoquimico()` que plota cada amostra na sua posição geográfica (coordenadas UTM, colunas `Long`/`Lat`), colorindo os pontos conforme uma variável química (ex.: TiO2, MgO) e, opcionalmente, separando por grupo (ex.: ATi/BTi) com marcadores diferentes. O fundo de satélite vem do Esri World Imagery via `contextily`. Duas chamadas de exemplo já estão prontas (variação de TiO2 sem grupo, e variação de MgO separando ATi/BTi).

**Bloco 4 — Diagrama binário MgO vs TiO2 com campos arredondados**
O bloco principal da apresentação. Desenha, no fundo do gráfico, os campos de literatura dos seis tipos de magma como polígonos preenchidos e suavizados, e por cima plota os pontos das amostras (triângulo = dique, quadrado = soleira; verde-limão = ATi, azul = BTi). Está dividido em cinco partes:
1. `suavizar_poligono()` — transforma poucos vértices em uma curva arredondada (spline de Catmull-Rom feita à mão).
2. `campos_mgo_tio2_arredondados` — dicionário com a cor, a posição do rótulo e os vértices de cada campo (Gramado, Ribeira, Esmeralda, Paranapanema, Pitanga, Urubici). É aqui que se ajusta a forma dos polígonos ponto por ponto para aproximar da figura de referência da literatura.
3. `desenhar_campos_arredondados()` — percorre o dicionário e desenha cada campo como um polígono colorido com o nome escrito por cima.
4. `obter_estilo_ponto()` — decide o marcador e a cor de cada amostra conforme `Petrology` (dique/soleira) e `ATi/BTi`.
5. `plotar_mgo_tio2_com_campos_arredondados()` — monta o gráfico final: campos no fundo, linha diagonal pontilhada separando Baixo-Ti/Alto-Ti, pontos das amostras por cima, e legenda manual.

**Bloco 5 — Diagrama Ti/Y vs Ti/Zr**
Mesma lógica do Bloco 4, mas autocontido em uma única célula e usando outra técnica de suavização (spline paramétrico do `scipy.interpolate.splprep`/`splev`, em vez da suavização manual). Calcula as razões Ti/Y e Ti/Zr (estimando Ti a partir do TiO2 quando a coluna `Ti` não existe), redesenha os seis campos de literatura nesse novo espaço de razões e plota as amostras por cima, com a mesma legenda e o mesmo esquema de cores/marcadores do Bloco 4.

## Personalização

- **Ajustar a forma dos campos geológicos:** edite as tuplas `(x, y)` dentro de `coords` no dicionário `campos_mgo_tio2_arredondados` (Bloco 4) ou `campos_tiy_tizr` (Bloco 5). Cada tupla é um vértice; a função de suavização conecta esses vértices numa curva fechada. Adicionar mais vértices dá mais controle sobre reentrâncias e ondulações.
- **Trocar a variável ou o agrupamento do mapa:** basta chamar `plotar_mapa_geoquimico()` com outros valores em `variavel` (ex.: `"SiO2"`, `"Zr/Y"`) e `grupo` (ex.: `"Magma Type"`).
- **Caminho da planilha:** se o arquivo Excel mudar de nome ou local no Drive, atualize a variável `arquivo` no Bloco 1.
