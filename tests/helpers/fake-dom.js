class FakeClassList {
  constructor() {
    this.classes = new Set();
  }

  add(...classes) {
    for (const classe of classes) {
      this.classes.add(classe);
    }
  }

  remove(...classes) {
    for (const classe of classes) {
      this.classes.delete(classe);
    }
  }

  contains(classe) {
    return this.classes.has(classe);
  }
}

export class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.attributes = {};
    this.classList = new FakeClassList();
    this.listeners = new Map();
    this.value = "";
    this.defaultValue = "";
    this.textContent = "";
    this.hidden = false;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);

    if (name === "class") {
      this.classList.remove(...this.classList.classes);
      this.classList.add(...String(value).split(/\s+/).filter(Boolean));
    }
  }

  append(...elements) {
    this.children.push(...elements);
  }

  replaceChildren(...elements) {
    this.children = elements;
  }

  addEventListener(name, callback) {
    const callbacks = this.listeners.get(name) ?? [];
    callbacks.push(callback);
    this.listeners.set(name, callbacks);
  }

  dispatch(name) {
    const event = { preventDefault() {} };
    for (const callback of this.listeners.get(name) ?? []) {
      callback(event);
    }
  }

  reset() {
    const redefinir = (elemento) => {
      if (elemento.tagName === "input") {
        elemento.value = elemento.defaultValue;
      }

      for (const filho of elemento.children) {
        redefinir(filho);
      }
    };

    redefinir(this);
  }
}

export class FakeDocument {
  constructor() {
    this.elementos = new Map();
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  createElementNS(_namespace, tagName) {
    return this.createElement(tagName);
  }

  getElementById(id) {
    return this.elementos.get(id) ?? null;
  }

  registrar(id, tagName = "div", pai = null) {
    const elemento = this.createElement(tagName);
    elemento.id = id;
    this.elementos.set(id, elemento);
    pai?.append(elemento);
    return elemento;
  }
}

export function criarDocumentoInterface() {
  const documento = new FakeDocument();

  const cadastro = documento.registrar("cadastrar-form", "form");
  documento.registrar("cadastro-isbn", "input", cadastro);
  documento.registrar("cadastro-titulo", "input", cadastro);
  documento.registrar("cadastro-autor", "input", cadastro);
  documento.registrar("cadastro-ano", "input", cadastro);

  const remocao = documento.registrar("remover-form", "form");
  documento.registrar("remover-isbn", "input", remocao);

  const busca = documento.registrar("buscar-form", "form");
  documento.registrar("buscar-isbn", "input", busca);
  documento.registrar("buscar-resultado", "div", busca);

  const intervalo = documento.registrar("intervalo-form", "form");
  documento.registrar("intervalo-min", "input", intervalo);
  documento.registrar("intervalo-max", "input", intervalo);
  documento.registrar("intervalo-resultado", "div", intervalo);

  documento.registrar("mensagem", "p");
  documento.registrar("metricas-nos", "dd");
  documento.registrar("metricas-altura", "dd");
  documento.registrar("metricas-rotacoes", "dd");
  documento.registrar("rotacao-info", "p");
  documento.registrar("arvore-svg", "svg");
  documento.registrar("catalogo-lista", "tbody");
  documento.registrar("catalogo-vazio", "p");

  return documento;
}