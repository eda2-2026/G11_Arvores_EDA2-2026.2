import assert from "node:assert/strict";
import test from "node:test";

import { desenharArvore } from "../js/visualizacao.js";

class ElementoSVG {
  constructor(nome) {
    this.nome = nome;
    this.atributos = {};
    this.filhos = [];
    this.textContent = "";
  }

  setAttribute(nome, valor) {
    this.atributos[nome] = valor;
  }

  append(...elementos) {
    this.filhos.push(...elementos);
  }

  replaceChildren(...elementos) {
    this.filhos = elementos;
  }
}

function criarSVG() {
  const documento = {
    createElementNS(_namespace, nome) {
      return new ElementoSVG(nome);
    },
  };
  const svg = new ElementoSVG("svg");
  svg.ownerDocument = documento;
  return svg;
}

function encontrarElementos(elemento, nome) {
  return elemento.filhos.flatMap((filho) => [
    ...(filho.nome === nome ? [filho] : []),
    ...encontrarElementos(filho, nome),
  ]);
}

test("desenha mensagem quando a árvore está vazia", () => {
  const svg = criarSVG();

  desenharArvore(svg, null);

  assert.equal(svg.atributos.viewBox, "0 0 800 240");
  assert.equal(svg.filhos[0].textContent, "Árvore vazia");
  assert.equal(svg.filhos[0].atributos.class, "mensagem-vazia");
});

test("desenha nós e arestas e destaca caminho e rotação", () => {
  const svg = criarSVG();
  const snapshot = {
    isbn: 20,
    titulo: "Livro vinte",
    altura: 2,
    fator: 0,
    esquerda: {
      isbn: 10,
      titulo: "Livro dez",
      altura: 1,
      fator: 0,
      esquerda: null,
      direita: null,
    },
    direita: {
      isbn: 30,
      titulo: "Livro trinta",
      altura: 1,
      fator: 0,
      esquerda: null,
      direita: null,
    },
  };

  desenharArvore(svg, snapshot, {
    caminhoBusca: [20, 10],
    ultimaRotacao: { tipo: "LL", isbns: [20, 10] },
  });

  const nos = encontrarElementos(svg, "g");
  const arestas = encontrarElementos(svg, "line");
  const noRaiz = nos.find((no) => no.atributos["data-isbn"] === "20");
  const noEsquerdo = nos.find((no) => no.atributos["data-isbn"] === "10");
  const noDireito = nos.find((no) => no.atributos["data-isbn"] === "30");
  const arestaDoCaminho = arestas.find((aresta) =>
    aresta.atributos.class.includes("aresta-caminho"),
  );

  assert.equal(svg.atributos.viewBox, "0 0 800 336");
  assert.equal(nos.length, 3);
  assert.equal(arestas.length, 2);
  assert.match(noRaiz.atributos.class, /no-caminho/);
  assert.match(noEsquerdo.atributos.class, /no-caminho/);
  assert.match(noRaiz.atributos.class, /rotacao-LL/);
  assert.match(noEsquerdo.atributos.class, /no-rotacao/);
  assert.doesNotMatch(noDireito.atributos.class, /no-caminho|no-rotacao/);
  assert.equal(arestaDoCaminho.atributos.x1, "400");
  assert.equal(arestaDoCaminho.atributos.x2, "288");
});
