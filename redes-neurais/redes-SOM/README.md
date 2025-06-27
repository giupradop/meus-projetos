# Projeto 2 - Redes Neurais Não Supervisionadas: Self-Organizing Map (SOM)

Este projeto consiste na aplicação da técnica de **Self-Organizing Map (SOM)** para análise não supervisionada de agrupamentos (clusters) e detecção de outliers em dois conjuntos de dados: **Wine Quality (vinho tinto)** e **Land Mines-1**.

---

## Objetivos

- Aplicar o modelo SOM em datasets tabulares com múltiplos atributos.
- Identificar padrões naturais, clusters e outliers.
- Avaliar a homogeneidade dos agrupamentos utilizando rótulos reais disponíveis.
- Variar os parâmetros da rede (tamanho do grid, taxa de aprendizado, número de iterações) para otimizar a representação dos dados.

---

## Datasets

1. **Land Mines-1**  
   Fonte: [UCI Machine Learning Repository](https://archive.ics.uci.edu/ml/datasets/land+mines-1)  
   Dados de radar para detecção de minas terrestres, contendo múltiplas características dimensionais.

2. **Wine Quality (Red Wine)**  
   Fonte: [UCI Machine Learning Repository](https://archive.ics.uci.edu/ml/datasets/wine+quality)  
   Dados químicos de vinhos tintos, com 1599 amostras e 11 atributos.

---

## Metodologia

- Os dados foram importados diretamente do UCI Repository utilizando a biblioteca `ucimlrepo` para garantir um código autocontido.
- Aplicou-se o pré-processamento com normalização MinMax para adequar os dados à rede SOM.
- Treinaram-se múltiplas redes SOM com diferentes configurações de grade, taxa de aprendizado e número de iterações.
- A seleção do melhor modelo foi feita com base no **menor erro de quantização**, que avalia a fidelidade da representação dos dados.
- Visualizou-se a **U-Matrix** para análise dos clusters e regiões de maior distância.
- Detectaram-se outliers a partir do erro de quantização individual de cada amostra.
- Avaliou-se a **homogeneidade dos clusters** pela consistência dos rótulos originais associados aos dados, calculando a pureza média dos neurônios ativados.

---

## Resultados

- O SOM demonstrou capacidade de agrupar dados similares em regiões próximas no mapa, formando clusters coerentes e bem definidos.
- Outliers foram identificados como amostras com alta distância ao neurônio vencedor, indicando possíveis anomalias ou ruídos.
- A homogeneidade média dos clusters foi satisfatória em ambos os datasets, confirmando a qualidade do agrupamento.

---
