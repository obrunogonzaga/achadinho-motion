import { existsSync } from "node:fs";
import { DURACAO_ALVO, MINIMO_POR_CENA } from "../../remotion/engine/ritmo.ts";
import { lerJson } from "./projeto.mjs";

const CENA_LONGA = 8;

const avisoDaCena = (segundos, destaques) => {
  if (segundos < MINIMO_POR_CENA - 0.3) return "  ⚠ curta";
  if (segundos > CENA_LONGA) return "  ⚠ longa";
  if (destaques === 0) return "  · sem [destaque]";
  if (destaques > 3) return "  ⚠ destaque demais";
  return "";
};

const descreverCena = (cena, fps) => {
  const segundos = (cena.fim - cena.inicio) / fps;
  const destaques = cena.palavras.filter((palavra) => palavra.destaque).length;
  return `${cena.tipo.padEnd(8)} ${(cena.inicio / fps).toFixed(2).padStart(6)} s  ${segundos.toFixed(1).padStart(4)} s${avisoDaCena(segundos, destaques)}`;
};

export const conferirTempos = (ficha, caminhos) => {
  if (!existsSync(caminhos.timeline)) throw new Error("Sem timeline.json: rode a etapa audio antes.");
  const timeline = lerJson(caminhos.timeline);
  timeline.cenas.forEach((cena) => console.log(descreverCena(cena, timeline.fps)));
  const duracao = timeline.duracaoFrames / timeline.fps;
  const [minimo, maximo] = DURACAO_ALVO;
  console.log(`${duracao >= minimo && duracao <= maximo ? "✓" : "⚠"} duração ${duracao.toFixed(1)} s (alvo ${minimo}–${maximo} s)`);
  const chamada = ficha.cenas.find((cena) => cena.tipo === "chamada");
  if (ficha.palavraChave && chamada && !chamada.fala.toUpperCase().includes(ficha.palavraChave.toUpperCase())) {
    console.log(`⚠ a chamada não fala a palavra "${ficha.palavraChave}"`);
  }
};
