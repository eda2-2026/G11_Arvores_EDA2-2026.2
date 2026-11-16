import { criarAcervoExemplo } from "./acervo.js";
import { ArvoreAVL } from "./avl.js";
import { criarLivro } from "./livro.js";
import { desenharArvore } from "./visualizacao.js";

class ErroValidacao extends Error {}

function obterElemento(documento, id) {
  const elemento = documento.getElementById(id);

  if (!elemento) {
    throw new Error(`Elemento obrigatório não encontrado: #${id}`);
  }

  return elemento;
}

function lerInteiroPositivo(documento, id, rotulo) {
  const valor = obterElemento(documento, id).value.trim();
  const numero = Number(valor);

  if (!valor || !Number.isSafeInteger(numero) || numero <= 0) {
    throw new ErroValidacao(`${rotulo} deve ser um número inteiro positivo.`);
  }

  return numero;
}

function mostrarErroValidacao(elemento, erro) {
  if (!(erro instanceof ErroValidacao)) {
    throw erro;
  }

  mostrarMensagem(elemento, erro.message, "erro");
}

function mostrarMensagem(elemento, mensagem, tipo = "") {
  elemento.textContent = mensagem;
  elemento.classList.remove("sucesso", "erro");

  if (tipo) {
    elemento.classList.add(tipo);
  }
}

function ordenarPorTitulo(livros) {
  return [...livros].sort((a, b) =>
    a.titulo.localeCompare(b.titulo, "pt-BR", { sensitivity: "base" })
      || a.isbn - b.isbn,
  );
}

export function inicializarAplicacao(documento = document) {
  const arvore = new ArvoreAVL();
  const mensagem = obterElemento(documento, "mensagem");
  const resultadoBusca = obterElemento(documento, "buscar-resultado");
  const resultadoIntervalo = obterElemento(documento, "intervalo-resultado");
  const listaCatalogo = obterElemento(documento, "catalogo-lista");
  const avisoCatalogoVazio = obterElemento(documento, "catalogo-vazio");
  const svgArvore = obterElemento(documento, "arvore-svg");
  const metricas = {
    nos: obterElemento(documento, "metricas-nos"),
    altura: obterElemento(documento, "metricas-altura"),
    rotacoes: obterElemento(documento, "metricas-rotacoes"),
    rotacao: obterElemento(documento, "rotacao-info"),
  };

  function desenhar(caminhoBusca = []) {
    desenharArvore(svgArvore, arvore.snapshot(), {
      caminhoBusca,
      ultimaRotacao: arvore.ultimaRotacao,
    });
  }

  function atualizarMetricas() {
    metricas.nos.textContent = String(arvore.tamanho);
    metricas.altura.textContent = String(arvore.altura);
    metricas.rotacoes.textContent = String(arvore.rotacoes);

    const rotacao = arvore.ultimaRotacao;
    metricas.rotacao.textContent = rotacao
      ? `Última rotação: ${rotacao.tipo} (${rotacao.isbns.join(" → ")}).`
      : "Nenhuma rotação nesta operação.";
  }

  function atualizarCatalogo() {
    const livros = ordenarPorTitulo(arvore.emOrdem());
    listaCatalogo.replaceChildren();
    avisoCatalogoVazio.hidden = livros.length > 0;

    for (const livro of livros) {
      const linha = documento.createElement("tr");

      for (const valor of [livro.titulo, livro.autor, livro.ano, livro.isbn]) {
        const celula = documento.createElement("td");
        celula.textContent = String(valor);
        linha.append(celula);
      }

      listaCatalogo.append(linha);
    }
  }

  function atualizarInterface(caminhoBusca = []) {
    atualizarMetricas();
    atualizarCatalogo();
    desenhar(caminhoBusca);
  }

  for (const livro of criarAcervoExemplo()) {
    arvore.inserir(livro);
  }

  atualizarInterface();

  obterElemento(documento, "cadastrar-form").addEventListener("submit", (evento) => {
    evento.preventDefault();

    try {
      const livro = criarLivro({
        isbn: lerInteiroPositivo(documento, "cadastro-isbn", "ISBN"),
        titulo: obterElemento(documento, "cadastro-titulo").value.trim(),
        autor: obterElemento(documento, "cadastro-autor").value.trim(),
        ano: lerInteiroPositivo(documento, "cadastro-ano", "Ano"),
      });

      if (!livro.titulo || !livro.autor) {
        throw new ErroValidacao("Título e autor são obrigatórios.");
      }

      const resultado = arvore.inserir(livro);

      if (!resultado.inserido) {
        atualizarInterface();
        mostrarMensagem(mensagem, `Já existe um livro com o ISBN ${livro.isbn}.`, "erro");
        return;
      }

      obterElemento(documento, "cadastrar-form").reset();
      mostrarMensagem(mensagem, `Livro "${livro.titulo}" cadastrado.`, "sucesso");
      mostrarMensagem(resultadoBusca, "");
      mostrarMensagem(resultadoIntervalo, "");
      atualizarInterface();
    } catch (erro) {
      mostrarErroValidacao(mensagem, erro);
    }
  });

  obterElemento(documento, "remover-form").addEventListener("submit", (evento) => {
    evento.preventDefault();

    try {
      const isbn = lerInteiroPositivo(documento, "remover-isbn", "ISBN");

      if (!arvore.remover(isbn)) {
        atualizarInterface();
        mostrarMensagem(mensagem, `Nenhum livro encontrado com o ISBN ${isbn}.`, "erro");
        return;
      }

      obterElemento(documento, "remover-form").reset();
      mostrarMensagem(mensagem, `Livro com ISBN ${isbn} removido.`, "sucesso");
      mostrarMensagem(resultadoBusca, "");
      mostrarMensagem(resultadoIntervalo, "");
      atualizarInterface();
    } catch (erro) {
      mostrarErroValidacao(mensagem, erro);
    }
  });

  obterElemento(documento, "buscar-form").addEventListener("submit", (evento) => {
    evento.preventDefault();

    try {
      const isbn = lerInteiroPositivo(documento, "buscar-isbn", "ISBN");
      const resultado = arvore.buscar(isbn);

      if (!resultado.livro) {
        mostrarMensagem(mensagem, `Nenhum livro encontrado com o ISBN ${isbn}.`, "erro");
        mostrarMensagem(
          resultadoBusca,
          `Livro não encontrado. Caminho: ${resultado.caminho.join(" → ") || "vazio"}.`,
          "erro",
        );
        desenhar(resultado.caminho);
        return;
      }

      const livro = resultado.livro;
      mostrarMensagem(mensagem, `Livro "${livro.titulo}" encontrado.`, "sucesso");
      mostrarMensagem(
        resultadoBusca,
        `${livro.titulo} — ${livro.autor} (${livro.ano}). Caminho: ${resultado.caminho.join(" → ")}.`,
        "sucesso",
      );
      desenhar(resultado.caminho);
    } catch (erro) {
      mostrarErroValidacao(mensagem, erro);
      mostrarMensagem(resultadoBusca, "");
    }
  });

  obterElemento(documento, "intervalo-form").addEventListener("submit", (evento) => {
    evento.preventDefault();

    try {
      const minimo = lerInteiroPositivo(documento, "intervalo-min", "ISBN inicial");
      const maximo = lerInteiroPositivo(documento, "intervalo-max", "ISBN final");

      if (minimo > maximo) {
        throw new ErroValidacao("O ISBN inicial deve ser menor ou igual ao ISBN final.");
      }

      const livros = arvore.intervalo(minimo, maximo);
      const resultado = livros.length
        ? livros.map((livro) => `${livro.titulo} (ISBN ${livro.isbn})`).join("; ")
        : "Nenhum livro encontrado nesse intervalo.";

      mostrarMensagem(
        mensagem,
        `Consulta concluída: ${livros.length} livro(s) encontrado(s).`,
        "sucesso",
      );
      mostrarMensagem(resultadoIntervalo, resultado, livros.length ? "sucesso" : "");
      mostrarMensagem(resultadoBusca, "");
      desenhar();
    } catch (erro) {
      mostrarErroValidacao(mensagem, erro);
      mostrarMensagem(resultadoIntervalo, "");
    }
  });

  return arvore;
}

if (typeof document !== "undefined") {
  inicializarAplicacao(document);
}