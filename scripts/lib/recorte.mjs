import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { RAIZ_DA_SKILL, nomeDoRecorte } from "./projeto.mjs";

const FONTE = path.join(RAIZ_DA_SKILL, "tools", "recorte.swift");
const BINARIO = path.join(RAIZ_DA_SKILL, "tools", "bin", "recorte");

const compilarFerramenta = () => {
  if (existsSync(BINARIO) && statSync(BINARIO).mtimeMs > statSync(FONTE).mtimeMs) return;
  mkdirSync(path.dirname(BINARIO), { recursive: true });
  console.log("compilando a ferramenta de recorte (macOS Vision)…");
  execFileSync("swiftc", ["-O", FONTE, "-o", BINARIO], { stdio: "inherit" });
};

export const recortarFotos = (ficha, caminhos, { forcar = false }) => {
  const alvos = ficha.fotos.filter((foto) => foto.recorte);
  if (!alvos.length) return console.log("recorte: nenhuma foto com recorte: true");
  if (process.platform !== "darwin") return console.log("recorte: só funciona no macOS. Recorte à mão e salve como <nome>-recorte.png em fotos/");
  compilarFerramenta();
  for (const foto of alvos) {
    const saida = path.join(caminhos.fotos, nomeDoRecorte(foto.arquivo));
    if (existsSync(saida) && !forcar) {
      console.log(`recorte: já existe ${path.basename(saida)}`);
      continue;
    }
    execFileSync(BINARIO, [path.join(caminhos.fotos, foto.arquivo), saida], { stdio: "inherit" });
  }
};
