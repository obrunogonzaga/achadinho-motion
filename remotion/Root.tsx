import { Composition, Still, type CalculateMetadataFunction } from "remotion";
import { Capa } from "./Capa";
import { Reel } from "./Reel";
import { ALTURA, LARGURA } from "./tema";
import type { Timeline } from "./tipos";

const palavras = (texto: string, inicio: number, destaques: string[] = []) =>
  texto.split(" ").map((palavra, indice) => ({ texto: palavra, quadro: inicio + indice * 9, destaque: destaques.includes(palavra) }));

const DEMONSTRACAO: Timeline = {
  fps: 30,
  duracaoFrames: 240,
  atrasoVoz: 3,
  trilha: null,
  volumeTrilha: 0.5,
  cores: { fundo: "#0B0B0F", destaque: "#FFD400", primaria: "#1E35C9", claro: "#F2F4FF" },
  mascote: "lupa",
  marca: "@seuperfil",
  palavraChave: "MOTION",
  capa: { titulo: "Coloque o título da capa aqui", destaque: "título", foto: null },
  cenas: [
    { tipo: "dor", inicio: 0, fim: 60, voz: null, foto: null, carimbo: null, numero: null, palavras: palavras("Cansou de tropeçar no escuro?", 3, ["escuro?"]) },
    { tipo: "achado", inicio: 60, fim: 120, voz: null, foto: null, carimbo: "Achado!", numero: null, palavras: palavras("Achei a solução por pouco.", 3, ["solução"]) },
    { tipo: "sinal", inicio: 120, fim: 180, voz: null, foto: null, carimbo: null, numero: 1, palavras: palavras("Acende sozinha quando você passa.", 3, ["sozinha"]) },
    { tipo: "chamada", inicio: 180, fim: 240, voz: null, foto: null, carimbo: null, numero: null, palavras: palavras("Comenta MOTION que eu te mando.", 3, ["MOTION"]) },
  ],
};

const calcularMetadados: CalculateMetadataFunction<Timeline> = ({ props }) => ({
  durationInFrames: props.duracaoFrames,
  fps: props.fps,
});

export const Raiz = () => (
  <>
    <Composition id="Reel" component={Reel} width={LARGURA} height={ALTURA} fps={30} durationInFrames={DEMONSTRACAO.duracaoFrames} defaultProps={DEMONSTRACAO} calculateMetadata={calcularMetadados} />
    <Still id="Capa" component={Capa} width={LARGURA} height={ALTURA} defaultProps={DEMONSTRACAO} />
  </>
);
