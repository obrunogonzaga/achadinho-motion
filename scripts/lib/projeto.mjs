import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ_DA_SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const TIPOS = new Set(["gancho", "dor", "achado", "sinal", "chamada"]);

export const nomeDoRecorte = (arquivo) => arquivo.replace(/\.[^.]+$/, "-recorte.png");

export const caminhosDoProjeto = (pasta) => {
  const raiz = path.resolve(process.env.INIT_CWD ?? process.cwd(), pasta);
  const em = (...partes) => path.join(raiz, ...partes);
  return {
    raiz,
    ficha: em("roteiro.json"),
    fotos: em("fotos"),
    narracao: em("voz", "narracao.txt"),
    vozOriginal: em("voz", "original.mp3"),
    palavrasOriginais: em("voz", "original.json"),
    assinaturaDaVoz: em("voz", "original.assinatura"),
    voz: em("voz", "voz.mp3"),
    palavras: em("voz", "palavras.json"),
    timeline: em("timeline.json"),
    trilha: em("trilha.wav"),
    video: em("out", "video.mp4"),
    capa: em("out", "capa.jpg"),
    folha: em("out", "folha.png"),
  };
};

export const lerJson = (arquivo) => JSON.parse(readFileSync(arquivo, "utf8"));

export const gravarJson = (arquivo, dados) => {
  mkdirSync(path.dirname(arquivo), { recursive: true });
  writeFileSync(arquivo, `${JSON.stringify(dados, null, 1)}\n`);
};

export const arquivosConhecidos = (ficha) => new Set(ficha.fotos.flatMap((foto) => [foto.arquivo, ...(foto.recorte ? [nomeDoRecorte(foto.arquivo)] : [])]));

const mascoteEhArquivo = (ficha) => ficha.mascote && !["lupa", "nenhum"].includes(ficha.mascote);

const problemasDaFicha = (ficha, caminhos) => {
  const conhecidos = arquivosConhecidos(ficha);
  return [
    ...ficha.cenas.filter((cena) => !TIPOS.has(cena.tipo)).map((cena) => `tipo de cena inválido: "${cena.tipo}"`),
    ...ficha.fotos.filter((foto) => !existsSync(path.join(caminhos.fotos, foto.arquivo))).map((foto) => `foto não está em fotos/: ${foto.arquivo}`),
    ...ficha.cenas.filter((cena) => cena.foto && !conhecidos.has(cena.foto)).map((cena) => `cena ${cena.tipo} usa "${cena.foto}", que não está em fotos[]`),
    ...ficha.cenas.filter((cena) => !cena.fala?.trim()).map((cena) => `cena ${cena.tipo} sem fala`),
    ...(mascoteEhArquivo(ficha) && !existsSync(path.join(caminhos.raiz, ficha.mascote)) ? [`mascote não encontrado: ${ficha.mascote}`] : []),
  ];
};

export const carregarFicha = (caminhos) => {
  if (!existsSync(caminhos.ficha)) throw new Error(`Não achei ${caminhos.ficha}. Crie com a etapa novo.`);
  const ficha = { fotos: [], ...lerJson(caminhos.ficha) };
  const problemas = problemasDaFicha(ficha, caminhos);
  if (problemas.length) throw new Error(`roteiro.json com problema:\n- ${problemas.join("\n- ")}`);
  return ficha;
};

export const lerMascoteSvg = (ficha, caminhos) => {
  if (!ficha.mascote?.endsWith(".svg")) return null;
  return readFileSync(path.join(caminhos.raiz, ficha.mascote), "utf8")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/<\?xml[^>]*>/, "")
    .trim();
};
