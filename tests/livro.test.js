import assert from "node:assert/strict";
import test from "node:test";

import { LIVROS_EXEMPLO, criarAcervoExemplo } from "../js/acervo.js";
import { criarLivro } from "../js/livro.js";

test("criarLivro normaliza os campos", () => {
  const livro = criarLivro({
    isbn: "9788535902770",
    titulo: "Dom Casmurro",
    autor: "Machado de Assis",
    ano: "1899",
  });

  assert.deepEqual(livro, {
    isbn: 9788535902770,
    titulo: "Dom Casmurro",
    autor: "Machado de Assis",
    ano: 1899,
  });
});

test("acervo de exemplo tem ISBNs únicos e devolve cópias", () => {
  const acervo = criarAcervoExemplo();

  assert.equal(acervo.length, LIVROS_EXEMPLO.length);
  assert.ok(acervo.length >= 10);
  assert.equal(new Set(acervo.map((livro) => livro.isbn)).size, acervo.length);
  assert.notEqual(acervo[0], LIVROS_EXEMPLO[0]);
});
