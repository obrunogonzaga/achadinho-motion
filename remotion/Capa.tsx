import { AbsoluteFill } from "remotion";
import { CartaoFoto, Destaque, Lupa, Marca } from "./componentes";
import { BRANCO, FONTE_TITULO } from "./tema";
import type { Timeline } from "./tipos";

const normalizar = (texto: string) => texto.toLowerCase().replace(/[^\p{L}\p{N}$]/gu, "");

const Titulo = ({ timeline }: { timeline: Timeline }) => {
  const { titulo, destaque } = timeline.capa;
  const { cores } = timeline;
  return (
    <div style={{ position: "absolute", top: 170, left: 70, right: 70, textAlign: "center", textWrap: "balance", color: cores.primaria, font: `800 112px/1.08 ${FONTE_TITULO}`, letterSpacing: "-0.03em" }}>
      {titulo.split(" ").map((palavra, indice) => {
        const destacada = destaque !== null && normalizar(palavra) === normalizar(destaque);
        return (
          <span key={indice} style={{ display: "inline-block", margin: "0 0.12em" }}>
            {destacada ? <Destaque cor={cores.primaria} corTexto={cores.destaque}>{palavra}</Destaque> : palavra}
          </span>
        );
      })}
    </div>
  );
};

export const Capa = (timeline: Timeline) => (
  <AbsoluteFill style={{ background: timeline.cores.destaque }}>
    {timeline.capa.foto ? <CartaoFoto foto={timeline.capa.foto} inicio={-60} topo={760} tamanho={760} /> : null}
    <Titulo timeline={timeline} />
    {timeline.mascote === "lupa" ? (
      <div style={{ position: "absolute", bottom: 90, right: 70 }}>
        <Lupa tamanho={240} cor={timeline.cores.primaria} olharX={-12} olharY={-8} />
      </div>
    ) : null}
    {timeline.marca ? <Marca texto={timeline.marca} cor={timeline.cores.primaria} corTexto={BRANCO} /> : null}
  </AbsoluteFill>
);
