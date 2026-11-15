import { criarLivro } from "./livro.js";

export const LIVROS_EXEMPLO = [
  { isbn: 9788535902770, titulo: "Dom Casmurro", autor: "Machado de Assis", ano: 1899 },
  { isbn: 9788520925154, titulo: "Grande Sertão: Veredas", autor: "João Guimarães Rosa", ano: 1956 },
  { isbn: 9788535914849, titulo: "A Hora da Estrela", autor: "Clarice Lispector", ano: 1977 },
  { isbn: 9788508045154, titulo: "Capitães da Areia", autor: "Jorge Amado", ano: 1937 },
  { isbn: 9788503012056, titulo: "Vidas Secas", autor: "Graciliano Ramos", ano: 1938 },
  { isbn: 9788508040415, titulo: "O Cortiço", autor: "Aluísio Azevedo", ano: 1890 },
  { isbn: 9788594318603, titulo: "Memórias Póstumas de Brás Cubas", autor: "Machado de Assis", ano: 1881 },
  { isbn: 9788508040958, titulo: "Iracema", autor: "José de Alencar", ano: 1865 },
  { isbn: 9788535907539, titulo: "A Moreninha", autor: "Joaquim Manuel de Macedo", ano: 1844 },
  { isbn: 9788508113174, titulo: "O Ateneu", autor: "Raul Pompeia", ano: 1888 },
  { isbn: 9788535902373, titulo: "Sagarana", autor: "João Guimarães Rosa", ano: 1946 },
  { isbn: 9788508044195, titulo: "Quincas Borba", autor: "Machado de Assis", ano: 1891 },
];

export function criarAcervoExemplo() {
  return LIVROS_EXEMPLO.map(criarLivro);
}
