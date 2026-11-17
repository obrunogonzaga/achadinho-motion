import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { DURACAO_ALVO } from "../../remotion/engine/ritmo.ts";
import { arquivosConhecidos } from "./projeto.mjs";

const QUADROS_NA_FOLHA = 15;
const FALA_DE_PRECO = /R\$|reais|%|desconto|promo|cupom|frete gr[aá]tis|acabando|[uú]ltimas unidades/i;

const relatar = (passou, textoOk, textoProblema) => console.log(passou ? `✓ ${textoOk}` : `⚠ ${textoProblema}`);

const conferirFotos = (ficha, caminhos) => {
  const usadas = [...new Set([...ficha.cenas.map((cena) => cena.foto), ficha.capa?.foto].filter(Boolean))];
  const faltando = usadas.filter((arquivo) => !existsSync(path.join(caminhos.fotos, arquivo)));
  const conhecidos = arquivosConhecidos(ficha);
  const sobrando = readdirSync(caminhos.fotos).filter((arquivo) => !usadas.includes(arquivo) && !conhecidos.has(arquivo));
  relatar(!faltando.length, `${usadas.length} fotos usadas, todas na pasta`, `faltando em fotos/: ${faltando.join(", ")} (rode a etapa recorte?)`);
  if (sobrando.length) console.log(`· sobrando em fotos/ (não usadas): ${sobrando.join(", ")}`);
};

const conferirRoteiro = (ficha) => {
  const semFonte = ficha.cenas.filter((cena) => cena.tipo === "sinal" && !cena.fonte?.trim());
  relatar(!semFonte.length, "todo sinal tem fonte no anúncio", `${semFonte.length} sinal(is) sem fonte: confira no anúncio antes de publicar`);
  const comPreco = ficha.cenas.filter((cena) => FALA_DE_PRECO.test(cena.fala));
  relatar(!comPreco.length, "sem preço, desconto ou urgência na fala", `fala com preço ou urgência (muda rápido): ${comPreco.map((cena) => cena.tipo).join(", ")}`);
};

const duracaoDoVideo = (arquivo) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivo]).toString());

const conferirVideo = (caminhos) => {
  if (!existsSync(caminhos.video)) return console.log("⚠ vídeo ainda não renderizado");
  const duracao = duracaoDoVideo(caminhos.video);
  const [minimo, maximo] = DURACAO_ALVO;
  relatar(duracao >= minimo && duracao <= maximo, `duração ${duracao.toFixed(1)} s`, `duração ${duracao.toFixed(1)} s fora de ${minimo}–${maximo} s`);
  const filtro = `fps=${QUADROS_NA_FOLHA}/${duracao},scale=216:384,tile=5x3:padding=6`;
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", caminhos.video, "-vf", filtro, "-frames:v", "1", caminhos.folha]);
  console.log(`· folha de quadros: ${caminhos.folha}`);
};

export const checarReel = (ficha, caminhos, { provedor }) => {
  conferirFotos(ficha, caminhos);
  conferirRoteiro(ficha);
  conferirVideo(caminhos);
  if (provedor !== "nenhuma") console.log("· voz sintética: ligue o selo de conteúdo de IA quando a plataforma pedir");
};
