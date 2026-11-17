import { existsSync, mkdirSync } from "node:fs";
import { gravarJson } from "./projeto.mjs";

const MODELO = {
  produto: "TODO: nome do produto",
  anuncio: "TODO: link do anúncio",
  marca: "@seuperfil",
  palavraChave: "TODO",
  mascote: "lupa",
  fotos: [{ arquivo: "1.jpg", recorte: true }, { arquivo: "2.jpg" }, { arquivo: "3.jpg" }],
  capa: { titulo: "TODO: título com [destaque]", foto: "1-recorte.png" },
  cenas: [
    { tipo: "dor", fala: "TODO: o problema do dia a dia, com uma palavra em [destaque]." },
    { tipo: "achado", fala: "Achei TODO.", foto: "1-recorte.png" },
    { tipo: "sinal", fala: "TODO: primeira função.", foto: "2.jpg", fonte: "TODO: trecho do anúncio" },
    { tipo: "sinal", fala: "TODO: segunda função.", foto: "3.jpg", fonte: "TODO: trecho do anúncio" },
    { tipo: "sinal", fala: "TODO: terceira função.", foto: "1.jpg", fonte: "TODO: trecho do anúncio" },
    { tipo: "chamada", fala: "Comenta [TODO] que eu te mando o link." },
  ],
};

export const criarProjeto = (caminhos) => {
  if (existsSync(caminhos.ficha)) throw new Error(`Já existe: ${caminhos.ficha}`);
  mkdirSync(caminhos.fotos, { recursive: true });
  gravarJson(caminhos.ficha, MODELO);
  console.log(`ficha criada: ${caminhos.ficha}\ncoloque as fotos em ${caminhos.fotos}`);
};
