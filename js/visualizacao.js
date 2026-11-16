const NS_SVG = "http://www.w3.org/2000/svg";
const ESPACAMENTO_HORIZONTAL = 112;
const ESPACAMENTO_VERTICAL = 112;
const MARGEM = 56;
const LARGURA_MINIMA = 800;
const ALTURA_MINIMA = 240;

function criarElemento(svg, nome, atributos = {}, texto = null) {
  const elemento = svg.ownerDocument.createElementNS(NS_SVG, nome);

  for (const [atributo, valor] of Object.entries(atributos)) {
    if (valor !== undefined && valor !== null) {
      elemento.setAttribute(atributo, String(valor));
    }
  }

  if (texto !== null) {
    elemento.textContent = texto;
  }

  return elemento;
}

function normalizarChaves(chaves) {
  return Array.isArray(chaves)
    ? new Set(chaves.map(Number).filter(Number.isFinite))
    : new Set();
}

function coletarPosicoes(raiz) {
  const posicoes = new Map();
  const arestas = [];
  let indice = 0;
  let profundidadeMaxima = 0;

  function posicionar(no, profundidade = 0, pai = null) {
    if (!no) {
      return;
    }

    posicionar(no.esquerda, profundidade + 1, no);

    const posicao = {
      x: MARGEM + indice * ESPACAMENTO_HORIZONTAL,
      y: MARGEM + profundidade * ESPACAMENTO_VERTICAL,
      no,
    };
    indice += 1;
    profundidadeMaxima = Math.max(profundidadeMaxima, profundidade);
    posicoes.set(Number(no.isbn), posicao);

    if (pai) {
      arestas.push({
        pai: Number(pai.isbn),
        filho: Number(no.isbn),
      });
    }

    posicionar(no.direita, profundidade + 1, no);
  }

  posicionar(raiz);

  return {
    posicoes,
    arestas,
    largura: Math.max(
      LARGURA_MINIMA,
      Math.max(0, indice - 1) * ESPACAMENTO_HORIZONTAL + MARGEM * 2,
    ),
    altura: Math.max(
      ALTURA_MINIMA,
      (profundidadeMaxima + 1) * ESPACAMENTO_VERTICAL + MARGEM * 2,
    ),
  };
}

function tituloResumido(titulo) {
  const texto = String(titulo ?? "");
  return texto.length > 15 ? `${texto.slice(0, 14)}...` : texto;
}

function criarNo(svg, posicao, caminho, isbnsRotacao, tipoRotacao) {
  const { no, x, y } = posicao;
  const isbn = Number(no.isbn);
  const classes = ["no-arvore"];

  if (caminho.has(isbn)) {
    classes.push("no-caminho");
  }

  if (isbnsRotacao.has(isbn)) {
    classes.push("no-rotacao");
  }

  if (isbnsRotacao.has(isbn) && tipoRotacao) {
    classes.push(`rotacao-${tipoRotacao}`);
  }

  const grupo = criarElemento(svg, "g", {
    class: classes.join(" "),
    "data-isbn": isbn,
    transform: `translate(${x} ${y})`,
  });
  const descricao = `ISBN ${isbn}; ${no.titulo ?? "sem título"}; altura ${no.altura}; fator ${no.fator}`;

  grupo.append(
    criarElemento(svg, "title", {}, descricao),
    criarElemento(svg, "circle", { r: 34 }),
    criarElemento(svg, "text", {
      class: "isbn",
      y: 4,
      textLength: String(isbn).length > 10 ? 57 : undefined,
      lengthAdjust: "spacingAndGlyphs",
    }, String(isbn)),
    criarElemento(svg, "text", {
      class: "titulo-no",
      y: 51,
    }, tituloResumido(no.titulo)),
  );

  return grupo;
}

function criarAresta(svg, de, para, caminho) {
  const classes = ["aresta"];

  if (caminho.has(`${de.no.isbn}->${para.no.isbn}`)) {
    classes.push("aresta-caminho");
  }

  return criarElemento(svg, "line", {
    class: classes.join(" "),
    x1: de.x,
    y1: de.y,
    x2: para.x,
    y2: para.y,
  });
}

export function desenharArvore(svg, snapshot, {
  caminhoBusca = [],
  ultimaRotacao = null,
} = {}) {
  if (!svg || typeof svg.replaceChildren !== "function" || !svg.ownerDocument) {
    throw new TypeError("É necessário fornecer um elemento SVG válido.");
  }

  if (!snapshot) {
    svg.setAttribute("viewBox", `0 0 ${LARGURA_MINIMA} ${ALTURA_MINIMA}`);
    svg.replaceChildren(
      criarElemento(svg, "text", {
        class: "mensagem-vazia",
        x: LARGURA_MINIMA / 2,
        y: ALTURA_MINIMA / 2,
        "text-anchor": "middle",
      }, "Árvore vazia"),
    );
    return;
  }

  const { posicoes, arestas, largura, altura } = coletarPosicoes(snapshot);
  const caminho = Array.isArray(caminhoBusca) ? caminhoBusca : [];
  const chavesCaminho = normalizarChaves(caminho);
  const caminhoArestas = new Set();

  for (let indice = 1; indice < caminho.length; indice += 1) {
    caminhoArestas.add(`${Number(caminho[indice - 1])}->${Number(caminho[indice])}`);
  }

  const chavesRotacao = normalizarChaves(ultimaRotacao?.isbns);
  const tiposRotacao = new Set(["LL", "RR", "LR", "RL"]);
  const tipoRotacao = tiposRotacao.has(ultimaRotacao?.tipo) ? ultimaRotacao.tipo : null;
  const elementos = [];

  const deslocamentoHorizontal = Math.max(
    0,
    (largura - (Math.max(0, posicoes.size - 1) * ESPACAMENTO_HORIZONTAL + MARGEM * 2)) / 2,
  );
  for (const posicao of posicoes.values()) {
    posicao.x += deslocamentoHorizontal;
  }

  svg.setAttribute("viewBox", `0 0 ${largura} ${altura}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMin meet");

  for (const aresta of arestas) {
    const posicaoPai = posicoes.get(aresta.pai);
    const posicaoFilho = posicoes.get(aresta.filho);
    elementos.push(criarAresta(svg, posicaoPai, posicaoFilho, caminhoArestas));
  }

  for (const posicao of posicoes.values()) {
    elementos.push(criarNo(svg, posicao, chavesCaminho, chavesRotacao, tipoRotacao));
  }

  svg.replaceChildren(...elementos);
}