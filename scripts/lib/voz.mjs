import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { gravarJson, lerJson } from "./projeto.mjs";
import { textoDaNarracao } from "./roteiro.mjs";

const ELEVENLABS = "https://api.elevenlabs.io/v1/text-to-speech";
const VOZ_PADRAO = "GK4ZNLi5L8ZOBBT2Kaww";
const MODELO_PADRAO = "eleven_v3";

const EXIGE = { comando: "VOZ_COMANDO", elevenlabs: "ELEVENLABS_API_KEY" };

export const escolherProvedor = (pedido) => {
  if (pedido && EXIGE[pedido] && !process.env[EXIGE[pedido]]) throw new Error(`--voz ${pedido} precisa de ${EXIGE[pedido]} no ambiente.`);
  if (pedido) return pedido;
  if (process.env.VOZ_COMANDO) return "comando";
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  return "nenhuma";
};

const dividirComando = (modelo) => (modelo.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((parte) => parte.replace(/^["']|["']$/g, ""));

const gerarPorComando = (texto, caminhos) => {
  const pasta = mkdtempSync(path.join(tmpdir(), "achadinho-"));
  const arquivo = path.join(pasta, "narracao.txt");
  writeFileSync(arquivo, texto);
  const valores = { texto, arquivo, saida: caminhos.vozOriginal, palavras: caminhos.palavrasOriginais };
  const [programa, ...argumentos] = dividirComando(process.env.VOZ_COMANDO).map((parte) => parte.replace(/\{(\w+)\}/g, (_, chave) => valores[chave] ?? `{${chave}}`));
  try {
    execFileSync(programa, argumentos, { stdio: "inherit" });
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
};

const palavrasDosCaracteres = ({ characters, character_start_times_seconds: inicios, character_end_times_seconds: fins }) =>
  characters.reduce((palavras, caractere, indice) => {
    if (/\s/.test(caractere)) return palavras;
    const atual = palavras[palavras.length - 1];
    const continua = atual && indice > 0 && !/\s/.test(characters[indice - 1]);
    if (continua) return [...palavras.slice(0, -1), { ...atual, text: atual.text + caractere, end: fins[indice] }];
    return [...palavras, { text: caractere, start: inicios[indice], end: fins[indice] }];
  }, []);

const gerarPorElevenLabs = async (texto, ficha, caminhos) => {
  const voz = process.env.ELEVENLABS_VOICE_ID ?? VOZ_PADRAO;
  const tag = ficha.emocao ? `[${ficha.emocao}] ` : "";
  const resposta = await fetch(`${ELEVENLABS}/${voz}/with-timestamps`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text: `${tag}${texto}`, model_id: process.env.ELEVENLABS_MODEL ?? MODELO_PADRAO, language_code: "pt" }),
  });
  if (!resposta.ok) throw new Error(`ElevenLabs recusou (${resposta.status}): ${(await resposta.text()).slice(0, 300)}`);
  const dados = await resposta.json();
  writeFileSync(caminhos.vozOriginal, Buffer.from(dados.audio_base64, "base64"));
  gravarJson(caminhos.palavrasOriginais, { words: palavrasDosCaracteres(dados.alignment) });
};

const transcreverComWhisper = (caminhos) => {
  const pasta = mkdtempSync(path.join(tmpdir(), "achadinho-whisper-"));
  const modelo = process.env.WHISPER_MODEL ?? "small";
  console.log(`voz: o TTS não devolveu o tempo das palavras, transcrevendo com whisper (${modelo})`);
  execFileSync("whisper", [caminhos.vozOriginal, "--model", modelo, "--language", "pt", "--word_timestamps", "True", "--output_format", "json", "--output_dir", pasta, "--fp16", "False"], { stdio: "ignore" });
  const resultado = lerJson(path.join(pasta, `${path.parse(caminhos.vozOriginal).name}.json`));
  rmSync(pasta, { recursive: true, force: true });
  const words = resultado.segments.flatMap((segmento) => segmento.words ?? []).map(({ word, start, end }) => ({ text: word.trim(), start, end }));
  gravarJson(caminhos.palavrasOriginais, { words });
};

const assinatura = (texto, provedor) => createHash("sha256").update([texto, provedor, process.env.VOZ_COMANDO ?? "", process.env.ELEVENLABS_VOICE_ID ?? ""].join("|")).digest("hex");

const vozEstaEmDia = (caminhos, marca) =>
  existsSync(caminhos.vozOriginal) && existsSync(caminhos.palavrasOriginais) && existsSync(caminhos.assinaturaDaVoz) && readFileSync(caminhos.assinaturaDaVoz, "utf8") === marca;

export const garantirVoz = async (ficha, caminhos, { provedor, forcar = false }) => {
  if (provedor === "nenhuma") return console.log("voz: nenhuma (sem VOZ_COMANDO nem ELEVENLABS_API_KEY). O vídeo sai com legenda e trilha.");
  const texto = textoDaNarracao(ficha);
  const marca = assinatura(texto, provedor);
  if (!forcar && vozEstaEmDia(caminhos, marca)) return console.log("voz: já existe e o roteiro não mudou (use --force para refazer)");
  rmSync(caminhos.palavrasOriginais, { force: true });
  mkdirSync(path.dirname(caminhos.vozOriginal), { recursive: true });
  console.log(`voz: gerando por ${provedor} (${texto.length} caracteres)`);
  if (provedor === "comando") gerarPorComando(texto, caminhos);
  else await gerarPorElevenLabs(texto, ficha, caminhos);
  if (!existsSync(caminhos.vozOriginal)) throw new Error("A voz não foi gerada: confira o VOZ_COMANDO (use {saida} para o arquivo de áudio).");
  if (!existsSync(caminhos.palavrasOriginais)) transcreverComWhisper(caminhos);
  writeFileSync(caminhos.assinaturaDaVoz, marca);
};
