import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { semMarcas } from "../../remotion/engine/texto.ts";

export const textoDaNarracao = (ficha) => ficha.cenas.map((cena) => semMarcas(cena.fala)).join("\n\n");

const linhaDaTabela = (cena, indice) => `| ${indice + 1} | ${cena.tipo} | ${cena.fala} | ${cena.foto ?? "—"} | ${cena.fonte ?? "—"} |`;

export const escreverRoteiro = (ficha, caminhos) => {
  const texto = textoDaNarracao(ficha);
  mkdirSync(path.dirname(caminhos.narracao), { recursive: true });
  writeFileSync(caminhos.narracao, `${texto}\n`);
  const palavras = texto.split(/\s+/).length;
  console.log(["| # | cena | fala | foto | fonte |", "|---|---|---|---|---|", ...ficha.cenas.map(linhaDaTabela)].join("\n"));
  console.log(`\nnarração: ${palavras} palavras, ${texto.length} caracteres (no ElevenLabs, ≈ ${texto.length} créditos)`);
};
