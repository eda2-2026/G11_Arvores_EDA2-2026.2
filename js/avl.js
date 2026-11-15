function alturaDoNo(no) {
  return no ? no.altura : 0;
}

function fatorDoNo(no) {
  return no ? alturaDoNo(no.esquerda) - alturaDoNo(no.direita) : 0;
}

export class ArvoreAVL {
  constructor() {
    this.raiz = null;
    this.quantidade = 0;
    this.totalRotacoes = 0;
    this.registroRotacao = null;
    this.rotacoesDaOperacao = 0;
  }

  get tamanho() {
    return this.quantidade;
  }

  get altura() {
    return alturaDoNo(this.raiz);
  }

  get rotacoes() {
    return this.totalRotacoes;
  }

  get ultimaRotacao() {
    return this.registroRotacao;
  }

  inserir(livro) {
    this.registroRotacao = null;
    this.rotacoesDaOperacao = 0;

    const chave = Number(livro?.isbn);

    if (!Number.isFinite(chave)) {
      return { inserido: false, rotacoes: 0 };
    }

    const resultado = this._inserir(this.raiz, chave, livro);
    this.raiz = resultado.no;

    if (resultado.inserido) {
      this.quantidade += 1;
    }

    return { inserido: resultado.inserido, rotacoes: this.rotacoesDaOperacao };
  }

  _inserir(no, chave, livro) {
    if (!no) {
      return {
        no: { chave, valor: livro, esquerda: null, direita: null, altura: 1 },
        inserido: true,
      };
    }

    if (chave === no.chave) {
      return { no, inserido: false };
    }

    let resultado;

    if (chave < no.chave) {
      resultado = this._inserir(no.esquerda, chave, livro);
      no.esquerda = resultado.no;
    } else {
      resultado = this._inserir(no.direita, chave, livro);
      no.direita = resultado.no;
    }

    if (!resultado.inserido) {
      return { no, inserido: false };
    }

    return { no: this._rebalancear(no), inserido: true };
  }

  _rebalancear(no) {
    this._atualizarAltura(no);
    const fator = fatorDoNo(no);

    if (fator > 1) {
      if (fatorDoNo(no.esquerda) < 0) {
        this._registrarRotacao("LR", [
          no.chave,
          no.esquerda.chave,
          no.esquerda.direita.chave,
        ]);
        no.esquerda = this._rotacionarEsquerda(no.esquerda);
      } else {
        this._registrarRotacao("LL", [no.chave, no.esquerda.chave]);
      }

      return this._rotacionarDireita(no);
    }

    if (fator < -1) {
      if (fatorDoNo(no.direita) > 0) {
        this._registrarRotacao("RL", [
          no.chave,
          no.direita.chave,
          no.direita.esquerda.chave,
        ]);
        no.direita = this._rotacionarDireita(no.direita);
      } else {
        this._registrarRotacao("RR", [no.chave, no.direita.chave]);
      }

      return this._rotacionarEsquerda(no);
    }

    return no;
  }

  _registrarRotacao(tipo, isbns) {
    this.registroRotacao = { tipo, isbns };
  }

  _rotacionarDireita(no) {
    const novaRaiz = no.esquerda;
    no.esquerda = novaRaiz.direita;
    novaRaiz.direita = no;
    this._atualizarAltura(no);
    this._atualizarAltura(novaRaiz);
    this.totalRotacoes += 1;
    this.rotacoesDaOperacao += 1;
    return novaRaiz;
  }

  _rotacionarEsquerda(no) {
    const novaRaiz = no.direita;
    no.direita = novaRaiz.esquerda;
    novaRaiz.esquerda = no;
    this._atualizarAltura(no);
    this._atualizarAltura(novaRaiz);
    this.totalRotacoes += 1;
    this.rotacoesDaOperacao += 1;
    return novaRaiz;
  }

  _atualizarAltura(no) {
    if (no) {
      no.altura = 1 + Math.max(alturaDoNo(no.esquerda), alturaDoNo(no.direita));
    }
  }

  buscar(isbn) {
    const chave = Number(isbn);
    const caminho = [];

    if (!Number.isFinite(chave)) {
      return { livro: null, caminho };
    }

    let atual = this.raiz;

    while (atual) {
      caminho.push(atual.chave);

      if (chave === atual.chave) {
        return { livro: atual.valor, caminho };
      }

      atual = chave < atual.chave ? atual.esquerda : atual.direita;
    }

    return { livro: null, caminho };
  }

  emOrdem() {
    const livros = [];

    const percorrer = (no) => {
      if (!no) {
        return;
      }

      percorrer(no.esquerda);
      livros.push(no.valor);
      percorrer(no.direita);
    };

    percorrer(this.raiz);
    return livros;
  }

  snapshot() {
    const mapear = (no) => {
      if (!no) {
        return null;
      }

      return {
        isbn: no.chave,
        titulo: no.valor.titulo,
        altura: no.altura,
        fator: fatorDoNo(no),
        esquerda: mapear(no.esquerda),
        direita: mapear(no.direita),
      };
    };

    return mapear(this.raiz);
  }

  remover(isbn) {
    this.registroRotacao = null;
    this.rotacoesDaOperacao = 0;

    const chave = Number(isbn);

    if (!Number.isFinite(chave)) {
      return false;
    }

    const resultado = this._remover(this.raiz, chave);
    this.raiz = resultado.no;

    if (resultado.removido) {
      this.quantidade -= 1;
    }

    return resultado.removido;
  }

  _remover(no, chave) {
    if (!no) {
      return { no: null, removido: false };
    }

    if (chave < no.chave) {
      const resultado = this._remover(no.esquerda, chave);
      no.esquerda = resultado.no;

      if (!resultado.removido) {
        return { no, removido: false };
      }
    } else if (chave > no.chave) {
      const resultado = this._remover(no.direita, chave);
      no.direita = resultado.no;

      if (!resultado.removido) {
        return { no, removido: false };
      }
    } else {
      if (!no.esquerda && !no.direita) {
        return { no: null, removido: true };
      }

      if (!no.esquerda) {
        return { no: no.direita, removido: true };
      }

      if (!no.direita) {
        return { no: no.esquerda, removido: true };
      }

      const sucessor = this._minimo(no.direita);
      no.chave = sucessor.chave;
      no.valor = sucessor.valor;
      const resultado = this._remover(no.direita, sucessor.chave);
      no.direita = resultado.no;
    }

    return { no: this._rebalancear(no), removido: true };
  }

  _minimo(no) {
    let atual = no;

    while (atual.esquerda) {
      atual = atual.esquerda;
    }

    return atual;
  }

  intervalo(min, max) {
    const de = Number(min);
    const ate = Number(max);

    if (!Number.isFinite(de) || !Number.isFinite(ate) || de > ate) {
      return [];
    }

    const livros = [];

    const percorrer = (no) => {
      if (!no) {
        return;
      }

      if (no.chave > de) {
        percorrer(no.esquerda);
      }

      if (no.chave >= de && no.chave <= ate) {
        livros.push(no.valor);
      }

      if (no.chave < ate) {
        percorrer(no.direita);
      }
    };

    percorrer(this.raiz);
    return livros;
  }

  limpar() {
    this.raiz = null;
    this.quantidade = 0;
    this.totalRotacoes = 0;
    this.registroRotacao = null;
    this.rotacoesDaOperacao = 0;
  }
}
