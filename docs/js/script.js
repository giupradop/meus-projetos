let nos = [];
let relacionamentos = [];
let idParaMateria = {}; // Mapa de ~id → { codigo, nome, ... }
let indiceSelecionado = -1;


function removerAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function carregarCSV() {
  return Promise.all([
    fetch('data/node-export.csv').then(r => r.text()),
    fetch('data/relationship-export.csv').then(r => r.text())
  ]).then(([nosText, relText]) => {
    nos = Papa.parse(nosText, { header: true }).data;
    relacionamentos = Papa.parse(relText, { header: true }).data;

    // Preencher mapa de ~id → { codigo, nome, ... }
    nos.forEach(n => {
      if (n["~id"] && n.codigo) {
        idParaMateria[n["~id"]] = n;
      }
    });
  });
}

function encontrarMateria(busca) {
  const buscaTrim = busca.trim();
  if (!buscaTrim) return null;

  if (/^\d+$/.test(buscaTrim)) {
    // Se for número, busca por código
    return nos.find(n => n.codigo === buscaTrim);
  } else {
    const nomeLimpo = removerAcentos(buscaTrim.toLowerCase());

    // 1. Busca nome exato (ignorando acentos)
    const exata = nos.find(n => {
      if (!n.nome) return false;
      const nomeMateria = removerAcentos(n.nome.toLowerCase());
      return nomeMateria === nomeLimpo;
    });

    if (exata) return exata;

    // 2. Se não encontrar exato, busca por nome que contenha
    return nos.find(n => {
      if (!n.nome) return false;
      const nomeMateria = removerAcentos(n.nome.toLowerCase());
      return nomeMateria.includes(nomeLimpo);
    });
  }
}



function montarGrafo(codigoBase) {
  let nodesMap = {};
  let edges = [];

  function getNodeIdByCodigo(codigo) {
    const entrada = Object.entries(idParaMateria).find(([id, m]) => m.codigo === codigo);
    return entrada ? entrada[0] : null;
  }

  function adicionarNodePorCodigo(codigo) {
    if (nodesMap[codigo]) return;

    const materia = nos.find(n => n.codigo === codigo);
    if (!materia) return;

    nodesMap[codigo] = {
      data: { id: codigo, name: materia.nome }
    };

    const origemId = getNodeIdByCodigo(codigo);
    if (!origemId) return;

const modoReverso = document.getElementById('modoReverso')?.checked;

relacionamentos.forEach(rel => {
  const origemRel = rel["~start_node_id"];
  const destinoRel = rel["~end_node_id"];

  if (modoReverso && destinoRel === origemId) {
    // Modo reverso: pega quem depende da matéria
    const origemNode = idParaMateria[origemRel];
    if (origemNode && origemNode.codigo) {
      edges.push({
        data: { source: origemNode.codigo, target: codigo }
      });
      adicionarNodePorCodigo(origemNode.codigo);
    }
  } else if (!modoReverso && origemRel === origemId) {
    // Modo normal: pega os pré-requisitos da matéria
    const destinoNode = idParaMateria[destinoRel];
    if (destinoNode && destinoNode.codigo) {
      edges.push({
        data: { source: codigo, target: destinoNode.codigo }
      });
      adicionarNodePorCodigo(destinoNode.codigo);
    }
  }
});

  }

  adicionarNodePorCodigo(codigoBase);

  return {
    nodes: Object.values(nodesMap),
    edges: edges
  };
}

// Função para listar relacionados: pré-requisitos (reverso=false) ou dependentes (reverso=true)
function listarRelacionados(codigoBase, reverso = false) {
  const origemId = Object.entries(idParaMateria).find(([id, m]) => m.codigo === codigoBase)?.[0];
  if (!origemId) return [];

  const relacionados = relacionamentos
    .filter(rel => {
      if (reverso) {
        return rel["~end_node_id"] === origemId;
      } else {
        return rel["~start_node_id"] === origemId;
      }
    })
    .map(rel => {
      const idRelacionado = reverso ? rel["~start_node_id"] : rel["~end_node_id"];
      return idParaMateria[idRelacionado];
    })
    .filter(x => x !== undefined);

  return relacionados;
}

// Função para mostrar a lista na tela
function mostrarListaRelacionados(codigoBase, reverso = false) {
  const listaDiv = document.getElementById('lista-relacionados');
  listaDiv.innerHTML = '';

  const relacionados = listarRelacionados(codigoBase, reverso);

  if (relacionados.length === 0) {
    listaDiv.innerHTML = '<p>Nenhuma matéria relacionada encontrada.</p>';
    return;
  }

  const materia = nos.find(n => n.codigo === codigoBase);
  const titulo = reverso ? 'Matérias que dependem de' : 'Pré-requisitos de';

  const header = document.createElement('h3');
  header.textContent = `${titulo} "${materia?.nome || codigoBase}":`;
  listaDiv.appendChild(header);

  const ul = document.createElement('ul');
  relacionados.forEach(mat => {
    const li = document.createElement('li');
    li.textContent = `${mat.nome} (Código: ${mat.codigo})`;
    ul.appendChild(li);
  });

  listaDiv.appendChild(ul);
}

// Dentro do clique do botão Buscar, após mostrar o grafo, adiciona a chamada para mostrar a lista

document.getElementById('btnBuscar').addEventListener('click', () => {
  const nomeBusca = document.getElementById('busca').value.trim();
  if (!nomeBusca) {
    alert('Digite o nome da matéria!');
    return;
  }

  const materia = encontrarMateria(nomeBusca);
  mostrarInfoMateria(materia);

  if (materia) {
    const elements = montarGrafo(materia.codigo);
    inicializarGrafo(elements);

    const reverso = document.getElementById('modoReverso')?.checked || false;
    mostrarListaRelacionados(materia.codigo, reverso);
  }
});


function mostrarInfoMateria(materia) {
  if (!materia) {
    document.getElementById('info').innerHTML = '<p>Matéria não encontrada.</p>';
    return;
  }

  document.getElementById('info').innerHTML = `
    <h2>${materia.nome}</h2>
    <p><b>Código:</b> ${materia.codigo}</p>
    <p><b>Categoria:</b> ${materia.categoria || '-'}</p>
    <p><b>Termo:</b> ${materia.termo || '-'}</p>
    <p><b>CH Teórica:</b> ${materia.ch_teorica || '0'}</p>
    <p><b>CH Prática:</b> ${materia.ch_pratica || '0'}</p>
    <p><b>CH Extensão:</b> ${materia.ch_extensao || '0'}</p>
  `;
}

let cy;
let ultimoNoSelecionado = null;


function inicializarGrafo(elements) {
  if (cy) cy.destroy();


  cy = cytoscape({
    container: document.getElementById('cy'),
    elements: elements,
    layout: {
      name: 'breadthfirst',
      directed: true,
      padding: 10,
      animate: true,         // animação ao arranjar o grafo
      animationDuration: 800 // duração em ms
    },
    style: [
      {
  selector: 'node',
      style: {
        'shape': 'roundrectangle',     // retângulo com bordas arredondadas
        'label': 'data(name)',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': '#000',
        'background-color': '#61bffc',
        'padding-left': '10px',
        'padding-right': '10px',
        'width': 'label',              // ajusta largura conforme texto
        'height': 'label',             // ajusta altura conforme texto
        'font-size': 12,
        'text-wrap': 'wrap',
        'text-max-width': 120,         // limita largura máxima
        'border-width': 0,
        'border-color': '#000'
      }
    },
      {
        selector: 'node.selecionado',
        style: {
          'background-color': '#ff6666', // cor do nó selecionado
          'border-width': 3,
          'border-color': '#b22222'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#aaa',
          'target-arrow-color': '#aaa',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      }
    ]
    
  }
    );
    const tooltip = document.getElementById('tooltip');

cy.on('mouseover', 'node', (evt) => {
  const node = evt.target;
  const codigo = node.id();
  const materia = nos.find(n => n.codigo === codigo);
  if (!materia) return;

  tooltip.innerHTML = `
    <b>${materia.nome}</b><br>
    Código: ${materia.codigo}<br>
    Categoria: ${materia.categoria || '-'}<br>
    Termo: ${materia.termo || '0'}<br>
  `;
  tooltip.style.display = 'block';
});

cy.on('mouseout', 'node', () => {
  tooltip.style.display = 'none';
});

cy.on('mousemove', (evt) => {
  tooltip.style.left = (evt.originalEvent.pageX + 15) + 'px';
  tooltip.style.top = (evt.originalEvent.pageY + 15) + 'px';
});


  // Função para mostrar só o nó selecionado e os vizinhos (pré e pós)
  function expandirNoSelecionado(codigo) {
    cy.elements().addClass('escondido'); // esconde tudo
    cy.nodes().removeClass('escondido');
    cy.edges().removeClass('escondido');

    // Esconde tudo menos o nó selecionado + vizinhos (in + out edges)
    cy.nodes().forEach(n => {
      if (n.id() !== codigo &&
          !n.connectedEdges().some(e => e.source().id() === codigo || e.target().id() === codigo)) {
        n.addClass('escondido');
      }
    });

    cy.edges().forEach(e => {
      if (e.source().id() !== codigo && e.target().id() !== codigo) {
        e.addClass('escondido');
      }
    });
  }

  // Remove a classe que esconde
  cy.style()
    .selector('.escondido')
    .style('display', 'none')
    .update();

  cy.on('tap', 'node', (evt) => {
    const node = evt.target;
    const codigo = node.id();

    // Remove destaque do anterior
    if (ultimoNoSelecionado) {
      cy.getElementById(ultimoNoSelecionado).removeClass('selecionado');
    }

    // Destaca o selecionado
    node.addClass('selecionado');
    ultimoNoSelecionado = codigo;

    // Atualiza info da matéria
    const materia = nos.find(n => n.codigo === codigo);
    mostrarInfoMateria(materia);

    // Expande só em torno do nó clicado
    expandirNoSelecionado(codigo);

    // Reroda layout com animação para se ajustar ao filtro
    cy.layout({
      name: 'breadthfirst',
      directed: true,
      padding: 10,
      animate: true,
      animationDuration: 600
    }).run();
  });

  
}


document.getElementById('btnBuscar').addEventListener('click', () => {
  const nomeBusca = document.getElementById('busca').value.trim();
  if (!nomeBusca) {
    alert('Digite o nome da matéria!');
    return;
  }

  const materia = encontrarMateria(nomeBusca);
  mostrarInfoMateria(materia);

  if (materia) {
    const elements = montarGrafo(materia.codigo);
    inicializarGrafo(elements);
  }
});

window.onload = () => {
  carregarCSV().then(() => {
    console.log('Dados carregados!');
  });
};

const campoBusca = document.getElementById('busca');
const listaSugestoes = document.getElementById('sugestoes');

campoBusca.addEventListener('input', () => {
  const termoRaw = campoBusca.value.toLowerCase();
  const termo = removerAcentos(termoRaw);
  listaSugestoes.innerHTML = '';
  indiceSelecionado = -1; // Zera o índice ao digitar

  if (!termo || termo.length < 2) {
    listaSugestoes.style.display = 'none';
    return;
  }

  const sugestoes = nos
    .filter(n => {
      if (!n.nome) return false;
      const nome = removerAcentos(n.nome.toLowerCase());
      return nome.includes(termo);
    })
    .slice(0, 8);

  if (sugestoes.length === 0) {
    listaSugestoes.style.display = 'none';
    return;
  }

  sugestoes.forEach((materia, index) => {
    const item = document.createElement('li');
    item.textContent = materia.nome;
    item.style.padding = '4px 8px';
    item.style.cursor = 'pointer';

    item.addEventListener('click', () => {
      campoBusca.value = materia.nome;
      listaSugestoes.style.display = 'none';
      document.getElementById('btnBuscar').click();
    });

    listaSugestoes.appendChild(item);
  });

  listaSugestoes.style.display = 'block';
  
});

campoBusca.addEventListener('keydown', (e) => {
  const itens = listaSugestoes.querySelectorAll('li');
  if (listaSugestoes.style.display === 'none' || itens.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    indiceSelecionado = (indiceSelecionado + 1) % itens.length;
    atualizarSelecaoSugestoes(itens);
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    indiceSelecionado = (indiceSelecionado - 1 + itens.length) % itens.length;
    atualizarSelecaoSugestoes(itens);
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    if (indiceSelecionado >= 0 && indiceSelecionado < itens.length) {
      itens[indiceSelecionado].click();
    }
  }
  listaSugestoes.querySelectorAll('li').forEach((li, i) => {
  if (i === indiceSelecionado) {
    li.classList.add('selected');
    li.scrollIntoView({ block: 'nearest' }); // <-- Aqui faz o scroll suave pro item visível
  } else {
    li.classList.remove('selected');
  }
});

});


document.addEventListener('click', (e) => {
  if (e.target !== campoBusca) {
    listaSugestoes.style.display = 'none';
  }
});

function atualizarSelecaoSugestoes(itens) {
  itens.forEach((item, idx) => {
    if (idx === indiceSelecionado) {
      item.classList.add('sugestao-selecionada');
    } else {
      item.classList.remove('sugestao-selecionada');
    }
  });
}

