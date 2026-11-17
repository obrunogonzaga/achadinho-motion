import { Composition, Still, type CalculateMetadataFunction } from "remotion";
import { Capa } from "./Capa";
import { estimarPalavras } from "./engine/estimativa.ts";
import { montarTimeline } from "./engine/timing.ts";
import { Reel } from "./Reel";
import { ALTURA, LARGURA } from "./tema";
import type { Ficha, Timeline } from "./tipos";

const FICHA_DEMONSTRACAO: Ficha = {
  produto: "Demonstração",
  marca: "@seuperfil",
  palavraChave: "MOTION",
  fotos: [],
  capa: { titulo: "Coloque o [título] da capa aqui" },
  cenas: [
    { tipo: "dor", fala: "Cansou de tropeçar no [escuro?]" },
    { tipo: "achado", fala: "Achei a [solução] por pouco." },
    { tipo: "sinal", fala: "Acende [sozinha] quando você passa." },
    { tipo: "chamada", fala: "Comenta [MOTION] que eu te mando." },
  ],
};

const DEMONSTRACAO: Timeline = montarTimeline(FICHA_DEMONSTRACAO, estimarPalavras(FICHA_DEMONSTRACAO), { voz: null });

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
