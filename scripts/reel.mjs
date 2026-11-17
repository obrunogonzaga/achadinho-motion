// Esteira de um Reel. Uso: node scripts/reel.mjs <pasta> <etapa> [--force] [--tempo 1.05|auto] [--voz comando|elevenlabs|nenhuma]
import { montarAudio } from "./lib/audio.mjs";
import { checarReel } from "./lib/checagem.mjs";
import { criarProjeto } from "./lib/novo.mjs";
import { caminhosDoProjeto, carregarFicha } from "./lib/projeto.mjs";
import { recortarFotos } from "./lib/recorte.mjs";
import { gerarTrilha, renderizar } from "./lib/render.mjs";
import { escreverRoteiro } from "./lib/roteiro.mjs";
import { conferirTempos } from "./lib/tempos.mjs";
import { escolherProvedor, garantirVoz } from "./lib/voz.mjs";

const ETAPAS = {
  roteiro: ({ ficha, caminhos }) => escreverRoteiro(ficha, caminhos),
  recorte: ({ ficha, caminhos, opcoes }) => recortarFotos(ficha, caminhos, opcoes),
  voz: ({ ficha, caminhos, opcoes }) => garantirVoz(ficha, caminhos, { ...opcoes, forcar: true }),
  audio: async ({ ficha, caminhos, opcoes }) => {
    await garantirVoz(ficha, caminhos, opcoes);
    montarAudio(ficha, caminhos, opcoes);
    conferirTempos(ficha, caminhos);
  },
  tempos: ({ ficha, caminhos }) => conferirTempos(ficha, caminhos),
  trilha: ({ caminhos }) => gerarTrilha(caminhos),
  render: ({ caminhos }) => renderizar(caminhos),
  checagem: ({ ficha, caminhos, opcoes }) => checarReel(ficha, caminhos, opcoes),
};

const COMBOS = { preparar: ["roteiro", "recorte"], finalizar: ["audio", "trilha", "render", "checagem"] };

const USO = `uso: node scripts/reel.mjs <pasta> <etapa> [--force] [--tempo 1.05|auto] [--voz comando|elevenlabs|nenhuma]
etapas: novo, ${Object.keys(ETAPAS).join(", ")}
combos: preparar (${COMBOS.preparar.join(" → ")}), finalizar (${COMBOS.finalizar.join(" → ")})
voz: comando (VOZ_COMANDO), elevenlabs (ELEVENLABS_API_KEY) ou nenhuma. Sem --voz, usa o que estiver configurado.`;

const lerArgumentos = (argv) => {
  const comValor = ["--tempo", "--voz"];
  const posicionais = [];
  const opcoes = { forcar: argv.includes("--force") };
  for (let indice = 0; indice < argv.length; indice += 1) {
    if (comValor.includes(argv[indice])) {
      opcoes[argv[indice].slice(2)] = argv[indice + 1];
      indice += 1;
    } else if (!argv[indice].startsWith("--")) posicionais.push(argv[indice]);
  }
  return { pasta: posicionais[0], etapa: posicionais[1], opcoes: { ...opcoes, provedor: escolherProvedor(opcoes.voz) } };
};

const rodarEtapas = async (nomes, contexto) => {
  for (const nome of nomes) {
    console.log(`\n▸ ${nome}`);
    await ETAPAS[nome](contexto);
  }
};

const principal = async () => {
  const { pasta, etapa, opcoes } = lerArgumentos(process.argv.slice(2));
  const conhecida = etapa === "novo" || etapa in ETAPAS || etapa in COMBOS;
  if (!pasta || !conhecida) throw new Error(USO);
  const caminhos = caminhosDoProjeto(pasta);
  if (etapa === "novo") return criarProjeto(caminhos);
  const ficha = carregarFicha(caminhos);
  await rodarEtapas(COMBOS[etapa] ?? [etapa], { ficha, caminhos, opcoes });
};

principal().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
