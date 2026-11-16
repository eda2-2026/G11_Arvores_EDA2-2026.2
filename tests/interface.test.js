import assert from "node:assert/strict";
import test from "node:test";

import { inicializarAplicacao } from "../js/app.js";
import { LIVROS_EXEMPLO } from "../js/acervo.js";
import { criarDocumentoInterface } from "./helpers/fake-dom.js";

function iniciar() {
  const documento = criarDocumentoInterface();
  const arvore = inicializarAplicacao(documento);
  return { documento, arvore };
}

function preencher(documento, valores) {
  for (const [id, valor] of Object.entries(valores)) {
    documento.getElementById(id).value = String(valor);
  }
}

function enviar(documento, idFormulario) {
  documento.getElementById(idFormulario).dispatch("submit");
}

function livrosNaTabela(documento) {
  return documento.getElementById("catalogo-lista").children.map((linha) =>
    linha.children.map((celula) => celula.textContent),
  );
}

function elementosSVG(documento, tagName) {
  const encontrar = (elemento) => elemento.children.flatMap((filho) => [
    ...(filho.tagName === tagName ? [filho] : []),
    ...encontrar(filho),
  ]);
  return encontrar(documento.getElementById("arvore-svg"));
}

test("inicializa acervo, métricas e catálogo ordenado por título", () => {
  const { documento, arvore } = iniciar();
  const titulos = livrosNaTabela(documento).map(([titulo]) => titulo);
  const esperado = LIVROS_EXEMPLO
    .map((livro) => livro.titulo)
    .sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));

  assert.equal(arvore.tamanho, LIVROS_EXEMPLO.length);
  assert.equal(documento.getElementById("metricas-nos").textContent, "12");
  assert.equal(documento.getElementById("metricas-altura").textContent, String(arvore.altura));
  assert.equal(documento.getElementById("metricas-rotacoes").textContent, String(arvore.rotacoes));
  assert.deepEqual(titulos, esperado);
  assert.equal(documento.getElementById("catalogo-vazio").hidden, true);
  assert.equal(elementosSVG(documento, "g").length, LIVROS_EXEMPLO.length);
});

test("cadastra livro e atualiza tabela e métricas", () => {
  const { documento, arvore } = iniciar();
  preencher(documento, {
    "cadastro-isbn": 1111111111,
    "cadastro-titulo": "A Biblioteca",
    "cadastro-autor": "Ana Autora",
    "cadastro-ano": 2024,
  });

  enviar(documento, "cadastrar-form");

  assert.equal(arvore.tamanho, 13);
  assert.equal(documento.getElementById("metricas-nos").textContent, "13");
  assert.equal(documento.getElementById("mensagem").classList.contains("sucesso"), true);
  assert.equal(documento.getElementById("cadastro-isbn").value, "");
  assert.equal(livrosNaTabela(documento)[0][0], "A Biblioteca");
});

test("rejeita entrada inválida e ISBN duplicado", () => {
  const { documento, arvore } = iniciar();
  preencher(documento, {
    "cadastro-isbn": 100,
    "cadastro-titulo": "Título sem autor",
    "cadastro-autor": "   ",
    "cadastro-ano": 2024,
  });
  enviar(documento, "cadastrar-form");

  assert.equal(arvore.tamanho, 12);
  assert.equal(documento.getElementById("mensagem").classList.contains("erro"), true);
  assert.match(documento.getElementById("mensagem").textContent, /Título e autor/);
  assert.equal(elementosSVG(documento, "g").length, 12);

  preencher(documento, {
    "cadastro-isbn": LIVROS_EXEMPLO[0].isbn,
    "cadastro-titulo": "Duplicado",
    "cadastro-autor": "Outro autor",
    "cadastro-ano": 2024,
  });
  enviar(documento, "cadastrar-form");

  assert.equal(arvore.tamanho, 12);
  assert.match(documento.getElementById("mensagem").textContent, /Já existe/);
  assert.equal(elementosSVG(documento, "g").length, 12);
});

test("atualiza o SVG após cadastro, rotação e remoção", () => {
  const { documento, arvore } = iniciar();
  const livros = [
    { isbn: 9780000000001, titulo: "Livro baixo um" },
    { isbn: 9780000000002, titulo: "Livro baixo dois" },
  ];

  for (const livro of livros) {
    preencher(documento, {
      "cadastro-isbn": livro.isbn,
      "cadastro-titulo": livro.titulo,
      "cadastro-autor": "Autora",
      "cadastro-ano": 2024,
    });
    enviar(documento, "cadastrar-form");
  }

  let nos = elementosSVG(documento, "g");
  assert.equal(arvore.tamanho, 14);
  assert.equal(nos.length, 14);
  assert.equal(arvore.ultimaRotacao.tipo, "LR");
  assert.match(documento.getElementById("rotacao-info").textContent, /LR/);
  assert.equal(nos.filter((no) => no.classList.contains("no-rotacao")).length, 3);

  preencher(documento, { "remover-isbn": livros[1].isbn });
  enviar(documento, "remover-form");

  nos = elementosSVG(documento, "g");
  assert.equal(arvore.tamanho, 13);
  assert.equal(nos.length, 13);
  assert.equal(nos.some((no) => no.attributes["data-isbn"] === String(livros[1].isbn)), false);
});

test("busca destaca caminho e informa quando o livro não existe", () => {
  const { documento } = iniciar();
  preencher(documento, { "buscar-isbn": LIVROS_EXEMPLO[0].isbn });
  enviar(documento, "buscar-form");

  assert.match(documento.getElementById("buscar-resultado").textContent, /Dom Casmurro/);
  assert.equal(documento.getElementById("buscar-resultado").classList.contains("sucesso"), true);
  assert.ok(elementosSVG(documento, "g").some((no) =>
    no.classList.contains("no-caminho"),
  ));

  preencher(documento, { "buscar-isbn": 1 });
  enviar(documento, "buscar-form");

  assert.match(documento.getElementById("mensagem").textContent, /Nenhum livro encontrado/);
  assert.equal(documento.getElementById("buscar-resultado").classList.contains("erro"), true);
});

test("remove livros e reporta ISBN inexistente", () => {
  const { documento, arvore } = iniciar();
  const isbn = LIVROS_EXEMPLO[0].isbn;
  preencher(documento, { "remover-isbn": isbn });
  enviar(documento, "remover-form");

  assert.equal(arvore.tamanho, 11);
  assert.equal(documento.getElementById("metricas-nos").textContent, "11");
  assert.equal(documento.getElementById("mensagem").classList.contains("sucesso"), true);

  preencher(documento, { "remover-isbn": isbn });
  enviar(documento, "remover-form");

  assert.equal(arvore.tamanho, 11);
  assert.equal(documento.getElementById("mensagem").classList.contains("erro"), true);
});

test("consulta intervalo inclusivo e valida seus limites", () => {
  const { documento } = iniciar();
  preencher(documento, {
    "intervalo-min": 9788508040000,
    "intervalo-max": 9788508049999,
  });
  enviar(documento, "intervalo-form");

  assert.match(documento.getElementById("intervalo-resultado").textContent, /O Cortiço/);
  assert.equal(documento.getElementById("intervalo-resultado").classList.contains("sucesso"), true);

  preencher(documento, {
    "intervalo-min": 200,
    "intervalo-max": 100,
  });
  enviar(documento, "intervalo-form");

  assert.equal(documento.getElementById("mensagem").classList.contains("erro"), true);
  assert.match(documento.getElementById("mensagem").textContent, /inicial deve ser menor/);
});