import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { estimarPalavras } from "../../remotion/engine/estimativa.ts";
import { ABERTURA, DURACAO_ALVO, TEMPO_MAXIMO, pausaDepoisDe } from "../../remotion/engine/ritmo.ts";
import { FOLGA_FINAL, acharInicios, montarTimeline } from "../../remotion/engine/timing.ts";
import { gravarJson, lerJson, lerMascoteSvg } from "./projeto.mjs";

const lerPalavras = (arquivo) => {
  const dados = lerJson(arquivo);
  return (Array.isArray(dados) ? dados : dados.words).filter((palavra) => !palavra.text.startsWith("["));
};

const pontoDeCorte = (palavras, indice) => (palavras[indice - 1].end + palavras[indice].start) / 2;

const montarSegmentos = (palavras, inicios) =>
  inicios.map((inicio, ordem) => {
    const proximo = inicios[ordem + 1];
    const ultima = palavras[(proximo ?? palavras.length) - 1];
    return {
      de: ordem === 0 ? Math.max(0, palavras[0].start - 0.08) : pontoDeCorte(palavras, inicio),
      ate: proximo ? pontoDeCorte(palavras, proximo) : ultima.end + 0.25,
      fala: ultima.end - palavras[inicio].start,
      respiroNatural: proximo ? palavras[proximo].start - ultima.end : 0,
    };
  });

const silencioExtra = (segmentos, ordem, tempo) => {
  if (ordem === 0) return ABERTURA;
  const anterior = segmentos[ordem - 1];
  return Math.max(0, pausaDepoisDe(anterior.fala / tempo) - anterior.respiroNatural / tempo);
};

const duracaoTotal = (segmentos, tempo) => segmentos.reduce((total, segmento, ordem) => total + silencioExtra(segmentos, ordem, tempo) + (segmento.ate - segmento.de) / tempo, FOLGA_FINAL);

const escolherTempo = (segmentos, pedido) => {
  if (pedido && pedido !== "auto") return Number(pedido);
  const maximo = DURACAO_ALVO[1];
  for (let tempo = 1; tempo <= TEMPO_MAXIMO + 1e-9; tempo += 0.01) {
    if (duracaoTotal(segmentos, tempo) <= maximo) return Math.round(tempo * 100) / 100;
  }
  throw new Error(`Mesmo em ${TEMPO_MAXIMO}× o vídeo passa de ${maximo} s. Corte texto do roteiro.`);
};

const filtroDeMontagem = (segmentos, tempo) => {
  const ajuste = tempo === 1 ? "" : `,atempo=${tempo}`;
  const partes = segmentos.flatMap((segmento, ordem) => [
    `aevalsrc=0:s=48000:d=${silencioExtra(segmentos, ordem, tempo).toFixed(3)}[z${ordem}]`,
    `[0:a]atrim=start=${segmento.de.toFixed(3)}:end=${segmento.ate.toFixed(3)},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=mono${ajuste}[s${ordem}]`,
  ]);
  const ordemDaConcatenacao = segmentos.map((_, ordem) => `[z${ordem}][s${ordem}]`).join("");
  return [...partes, `${ordemDaConcatenacao}concat=n=${segmentos.length * 2}:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[saida]`].join(";");
};

const deslocarPalavras = (palavras, inicios, segmentos, tempo) => {
  let deslocamento = 0;
  return segmentos.flatMap((segmento, ordem) => {
    deslocamento += silencioExtra(segmentos, ordem, tempo);
    const base = deslocamento;
    deslocamento += (segmento.ate - segmento.de) / tempo;
    const daCena = palavras.slice(inicios[ordem], inicios[ordem + 1] ?? palavras.length);
    const mover = (segundos) => +(base + (segundos - segmento.de) / tempo).toFixed(3);
    return daCena.map((palavra) => ({ ...palavra, start: mover(palavra.start), end: mover(palavra.end) }));
  });
};

const montarVoz = (ficha, caminhos, pedidoDeTempo) => {
  const palavras = lerPalavras(caminhos.palavrasOriginais);
  const inicios = acharInicios(ficha, palavras);
  const segmentos = montarSegmentos(palavras, inicios);
  const tempo = escolherTempo(segmentos, pedidoDeTempo);
  const filtro = filtroDeMontagem(segmentos, tempo);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", caminhos.vozOriginal, "-filter_complex", filtro, "-map", "[saida]", "-b:a", "192k", caminhos.voz]);
  const finais = deslocarPalavras(palavras, inicios, segmentos, tempo);
  gravarJson(caminhos.palavras, { tempo, words: finais });
  console.log(`áudio: voz.mp3 · ${duracaoTotal(segmentos, tempo).toFixed(1)} s · tempo ${tempo}`);
  return finais;
};

export const montarAudio = (ficha, caminhos, { provedor, tempo }) => {
  const comVoz = provedor !== "nenhuma" && existsSync(caminhos.vozOriginal);
  const palavras = comVoz ? montarVoz(ficha, caminhos, tempo) : estimarPalavras(ficha);
  if (!comVoz) gravarJson(caminhos.palavras, { tempo: 1, words: palavras });
  const voz = comVoz ? path.relative(caminhos.raiz, caminhos.voz) : null;
  gravarJson(caminhos.timeline, { ...montarTimeline(ficha, palavras, { voz }), mascoteSvg: lerMascoteSvg(ficha, caminhos) });
  console.log(`timeline: ${ficha.cenas.length} cenas, ${comVoz ? "com" : "sem"} voz`);
};
