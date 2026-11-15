import assert from "node:assert/strict";
import test from "node:test";

import { criarAcervoExemplo } from "../js/acervo.js";
import { ArvoreAVL } from "../js/avl.js";

function livro(isbn, titulo = `Livro ${isbn}`) {
  return { isbn, titulo, autor: "Autor", ano: 2000 };
}

function verificarInvariantes(no) {
  if (!no) {
    return { altura: 0 };
  }

  const esquerda = verificarInvariantes(no.esquerda);
  const direita = verificarInvariantes(no.direita);
  const altura = 1 + Math.max(esquerda.altura, direita.altura);

  assert.equal(no.altura, altura);
  assert.equal(no.fator, esquerda.altura - direita.altura);
  assert.ok(Math.abs(no.fator) <= 1);

  if (no.esquerda) {
    assert.ok(no.esquerda.isbn < no.isbn);
  }

  if (no.direita) {
    assert.ok(no.direita.isbn > no.isbn);
  }

  return { altura };
}

function inserirSequencia(arvore, isbns) {
  for (const isbn of isbns) {
    arvore.inserir(livro(isbn));
  }
}

test("árvore avl começa vazia", () => {
  const arvore = new ArvoreAVL();

  assert.equal(arvore.tamanho, 0);
  assert.equal(arvore.altura, 0);
  assert.deepEqual(arvore.emOrdem(), []);
  assert.equal(arvore.snapshot(), null);
});

test("inserção mantém a ordem por ISBN e as invariantes", () => {
  const arvore = new ArvoreAVL();
  inserirSequencia(arvore, [50, 30, 70, 20, 40, 60, 80, 10]);

  assert.equal(arvore.tamanho, 8);
  assert.equal(arvore.altura, 4);
  assert.deepEqual(
    arvore.emOrdem().map((item) => item.isbn),
    [10, 20, 30, 40, 50, 60, 70, 80],
  );
  verificarInvariantes(arvore.snapshot());
});

test("ISBN duplicado não altera a árvore", () => {
  const arvore = new ArvoreAVL();
  arvore.inserir(livro(100));

  const resultado = arvore.inserir(livro(100));

  assert.equal(resultado.inserido, false);
  assert.equal(arvore.tamanho, 1);
});

test("sequência crescente permanece balanceada", () => {
  const arvore = new ArvoreAVL();
  const isbns = Array.from({ length: 15 }, (_, indice) => indice + 1);
  inserirSequencia(arvore, isbns);

  assert.equal(arvore.altura, 4);
  assert.ok(arvore.rotacoes > 0);
  assert.deepEqual(
    arvore.emOrdem().map((item) => item.isbn),
    isbns,
  );
  verificarInvariantes(arvore.snapshot());
});

test("identifica as rotações LL, RR, LR e RL", () => {
  const casos = [
    { isbns: [30, 20, 10], tipo: "LL" },
    { isbns: [10, 20, 30], tipo: "RR" },
    { isbns: [30, 10, 20], tipo: "LR" },
    { isbns: [10, 30, 20], tipo: "RL" },
  ];

  for (const caso of casos) {
    const arvore = new ArvoreAVL();
    inserirSequencia(arvore, caso.isbns);

    assert.equal(arvore.ultimaRotacao.tipo, caso.tipo);
    assert.ok(arvore.ultimaRotacao.isbns.length >= 2);
    verificarInvariantes(arvore.snapshot());
  }
});

test("busca devolve o livro e o caminho percorrido", () => {
  const arvore = new ArvoreAVL();
  inserirSequencia(arvore, [50, 30, 70, 20, 40, 60, 80]);

  const encontrado = arvore.buscar(40);
  assert.equal(encontrado.livro.isbn, 40);
  assert.equal(encontrado.caminho[0], 50);
  assert.equal(encontrado.caminho.at(-1), 40);

  const ausente = arvore.buscar(45);
  assert.equal(ausente.livro, null);
  assert.deepEqual(ausente.caminho, [50, 30, 40]);
});

test("percurso em ordem devolve o acervo ordenado por ISBN", () => {
  const arvore = new ArvoreAVL();
  const acervo = criarAcervoExemplo();

  for (const item of acervo) {
    arvore.inserir(item);
  }

  assert.equal(arvore.tamanho, acervo.length);
  assert.deepEqual(
    arvore.emOrdem().map((item) => item.isbn),
    [...acervo].map((item) => item.isbn).sort((a, b) => a - b),
  );
  verificarInvariantes(arvore.snapshot());
});

test("snapshot expõe altura, fator e título de cada nó", () => {
  const arvore = new ArvoreAVL();
  arvore.inserir(livro(30, "Trinta"));
  arvore.inserir(livro(20, "Vinte"));
  arvore.inserir(livro(10, "Dez"));

  const raiz = arvore.snapshot();

  assert.equal(raiz.isbn, 20);
  assert.equal(raiz.titulo, "Vinte");
  assert.equal(raiz.altura, 2);
  assert.equal(raiz.fator, 0);
  assert.equal(raiz.esquerda.isbn, 10);
  assert.equal(raiz.direita.isbn, 30);
});

test("limpar esvazia a árvore", () => {
  const arvore = new ArvoreAVL();
  inserirSequencia(arvore, [3, 2, 1]);

  arvore.limpar();

  assert.equal(arvore.tamanho, 0);
  assert.equal(arvore.altura, 0);
  assert.equal(arvore.snapshot(), null);
});
