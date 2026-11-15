export function criarLivro({ isbn, titulo, autor, ano }) {
  return {
    isbn: Number(isbn),
    titulo: String(titulo),
    autor: String(autor),
    ano: Number(ano),
  };
}
