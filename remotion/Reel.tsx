import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { VISUAIS } from "./cenas";
import { Lupa, Marca, Progresso } from "./componentes";
import { BRANCO } from "./tema";
import type { Cena, Timeline } from "./tipos";

const Voz = ({ cena, atraso }: { cena: Cena; atraso: number }) => {
  if (!cena.voz) return null;
  return (
    <Sequence from={atraso} layout="none">
      <Audio src={staticFile(cena.voz)} />
    </Sequence>
  );
};

const Cenas = ({ timeline }: { timeline: Timeline }) => (
  <>
    {timeline.cenas.map((cena, indice) => {
      const Visual = VISUAIS[cena.tipo];
      return (
        <Sequence key={indice} from={cena.inicio} durationInFrames={cena.fim - cena.inicio}>
          <Visual cena={cena} timeline={timeline} />
          <Voz cena={cena} atraso={timeline.atrasoVoz} />
        </Sequence>
      );
    })}
  </>
);

const LupaDoCanto = ({ timeline }: { timeline: Timeline }) => {
  const quadro = useCurrentFrame();
  const ultima = timeline.cenas[timeline.cenas.length - 1];
  if (timeline.mascote !== "lupa" || quadro >= ultima.inicio) return null;
  const olharX = Math.sin(quadro * 0.08) * 14;
  const piscando = quadro % 90 < 4;
  return (
    <div style={{ position: "absolute", bottom: 50, right: 50 }}>
      <Lupa tamanho={170} cor={timeline.cores.primaria} olharX={olharX} olharY={-8} piscando={piscando} />
    </div>
  );
};

export const Reel = (timeline: Timeline) => (
  <AbsoluteFill style={{ background: timeline.cores.fundo, overflow: "hidden" }}>
    {timeline.trilha ? <Audio src={staticFile(timeline.trilha)} volume={timeline.volumeTrilha} /> : null}
    <Cenas timeline={timeline} />
    <Progresso duracao={timeline.duracaoFrames} cor={timeline.cores.primaria} borda={timeline.cores.destaque} />
    <LupaDoCanto timeline={timeline} />
    {timeline.marca ? <Marca texto={timeline.marca} cor={timeline.cores.primaria} corTexto={BRANCO} /> : null}
  </AbsoluteFill>
);
