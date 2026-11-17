import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { VISUAIS } from "./cenas";
import { Marca, Mascote, Progresso } from "./componentes";
import { BRANCO } from "./tema";
import type { Timeline } from "./tipos";

const Cenas = ({ timeline }: { timeline: Timeline }) => (
  <>
    {timeline.cenas.map((cena, indice) => {
      const Visual = VISUAIS[cena.tipo];
      return (
        <Sequence key={indice} from={cena.inicio} durationInFrames={cena.fim - cena.inicio}>
          <Visual cena={cena} timeline={timeline} />
        </Sequence>
      );
    })}
  </>
);

const MascoteDoCanto = ({ timeline }: { timeline: Timeline }) => {
  const quadro = useCurrentFrame();
  const ultima = timeline.cenas[timeline.cenas.length - 1];
  if (timeline.mascote === "nenhum" || quadro >= ultima.inicio) return null;
  const olharX = Math.sin(quadro * 0.08) * 14;
  const piscando = quadro % 90 < 4;
  return (
    <div style={{ position: "absolute", bottom: 50, right: 50 }}>
      <Mascote mascote={timeline.mascote} tamanho={170} cor={timeline.cores.primaria} olharX={olharX} olharY={-8} piscando={piscando} />
    </div>
  );
};

export const Reel = (timeline: Timeline) => (
  <AbsoluteFill style={{ background: timeline.cores.fundo, overflow: "hidden" }}>
    {timeline.trilha ? <Audio src={staticFile(timeline.trilha)} volume={timeline.volumeTrilha} /> : null}
    {timeline.voz ? <Audio src={staticFile(timeline.voz)} /> : null}
    <Cenas timeline={timeline} />
    <Progresso duracao={timeline.duracaoFrames} cor={timeline.cores.primaria} borda={timeline.cores.destaque} />
    <MascoteDoCanto timeline={timeline} />
    {timeline.marca ? <Marca texto={timeline.marca} cor={timeline.cores.primaria} corTexto={BRANCO} /> : null}
  </AbsoluteFill>
);
