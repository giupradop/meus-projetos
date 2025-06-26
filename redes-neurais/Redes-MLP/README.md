#  Projeto Redes Neurais MLP - Classificação de Câncer de Mama

Este projeto implementa e compara diferentes arquiteturas de redes neurais do tipo MLP (Perceptron Multi-Camadas) aplicadas ao conjunto de dados **Breast Cancer Wisconsin Diagnostic**, utilizando Python com Keras (TensorFlow) e treinamento com o otimizador SGD.

##  Base de Dados

- **Fonte**: UCI Machine Learning Repository  
- **Nome**: Breast Cancer Wisconsin (Diagnostic)  
- **Total de amostras**: 569  
- **Atributos**: 30 características extraídas de imagens de exames de mama  
- **Tarefa**: Classificação binária (`M` = maligno, `B` = benigno)

##  Metodologia

- Os dados foram normalizados com `StandardScaler`
- Divisão dos dados:
  - 64% treino
  - 16% validação
  - 20% teste
- Treinamento com SGD usando:
  - `binary_crossentropy` como função de perda
  - `sigmoid` na saída
  - `relu` nas camadas ocultas
  - `early stopping` com paciência de 10 épocas
  - Treinamento de até 100 épocas
  - Batch size: 32

##  Modelos Avaliados

Foram testadas 5 arquiteturas diferentes, com e sem o uso de **momentum**:

| Modelo | Arquitetura               |
|--------|---------------------------|
| M1     | Linear (sem camada oculta)  
| M2     | 1 camada oculta (5 neurônios)  
| M3     | 1 camada oculta (10 neurônios)  
| M4     | 2 camadas ocultas (10 e 5 neurônios)  
| M5     | 2 camadas ocultas (20 e 10 neurônios)  

##  Resultados

Todos os modelos obtiveram excelente desempenho, com destaque para o uso de **momentum**, que reduziu o valor da perda e aumentou a estabilidade do treinamento.

| Modelo                        | Val Acc | Test Acc | Val Loss | Test Loss |
|------------------------------|---------|----------|----------|-----------|
| M1 - Linear (com momentum)   | 96.70%  | **98.25%** | 0.0769   | **0.0663** |
| M3 - 1 camada (10) + momentum| **97.80%** | 97.37% | 0.0848   | 0.0782    |
| M4 - 2 camadas (10-5) + mom. | 95.60%  | 98.25%   | 0.0843   | 0.0805    |
| M5 - 2 camadas (20-10) + mom.| 95.60%  | 98.25%   | 0.0941   | 0.0809    |

##  Conclusão

Modelos simples como o **linear com momentum** foram capazes de atingir altíssima acurácia com baixa perda, superando inclusive redes mais profundas. O uso de **momentum no otimizador SGD** se mostrou essencial para acelerar a convergência e melhorar a confiança das previsões.


