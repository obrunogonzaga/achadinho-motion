import { AbsoluteFill } from "remotion";
import { Destaque, FotoDoProduto, Marca, Mascote } from "./componentes";
import { juntarDestaques, separarFala } from "./engine/texto.ts";
import { BRANCO, FONTE_TITULO } from "./tema";
import type { Timeline } from "./tipos";

const Titulo = ({ timeline }: { timeline: Timeline }) => {
  const { cores } = timeline;
  return (
    <div style={{ position: "absolute", top: 170, left: 70, right: 70, textAlign: "center", textWrap: "balance", color: cores.primaria, font: `800 112px/1.08 ${FONTE_TITULO}`, letterSpacing: "-0.03em" }}>
      {juntarDestaques(separarFala(timeline.capa.titulo)).map((pedaco, indice) => (
        <span key={indice} style={{ display: "inline-block", whiteSpace: "nowrap", margin: "0 0.12em" }}>
          {pedaco.destaque ? <Destaque cor={cores.primaria} corTexto={cores.destaque}>{pedaco.texto}</Destaque> : pedaco.texto}
        </span>
      ))}
    </div>
  );
};

export const Capa = (timeline: Timeline) => (
  <AbsoluteFill style={{ background: timeline.cores.destaque }}>
    {timeline.capa.foto ? <FotoDoProduto foto={timeline.capa.foto} inicio={-60} topo={760} tamanho={760} /> : null}
    <Titulo timeline={timeline} />
    {timeline.mascote !== "nenhum" ? (
      <div style={{ position: "absolute", bottom: 90, right: 70 }}>
        <Mascote mascote={timeline.mascote} tamanho={240} cor={timeline.cores.primaria} olharX={-12} olharY={-8} />
      </div>
    ) : null}
    {timeline.marca ? <Marca texto={timeline.marca} cor={timeline.cores.primaria} corTexto={BRANCO} /> : null}
  </AbsoluteFill>
);
