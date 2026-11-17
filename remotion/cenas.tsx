import type { CSSProperties } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Camera, Carimbo, FotoDoProduto, Legenda, Mascote, Numero, usePop } from "./componentes";
import { BRANCO, FONTE_TITULO, LIMITE, TINTA } from "./tema";
import type { Cena, Timeline, TipoCena } from "./tipos";

type PropsCena = { cena: Cena; timeline: Timeline };

const momentosDeDestaque = (cena: Cena) => cena.palavras.filter((palavra) => palavra.destaque).map((palavra) => palavra.quadro);

const momentoDoCarimbo = (cena: Cena) => momentosDeDestaque(cena)[0] ?? cena.palavras[cena.palavras.length - 1].quadro;

const CenaDor = ({ cena, timeline }: PropsCena) => {
  const { cores } = timeline;
  return (
    <AbsoluteFill style={{ background: cores.fundo }}>
      <Camera socos={momentosDeDestaque(cena)}>
        <Legenda palavras={cena.palavras} cor={BRANCO} corDestaque={{ cor: cores.destaque, corTexto: cores.fundo }} topo={760} tamanho={124} />
      </Camera>
    </AbsoluteFill>
  );
};

const FotoDeFundo = ({ foto }: { foto: string }) => {
  const quadro = useCurrentFrame();
  const aproximacao = interpolate(quadro, [0, 150], [1.08, 1.22], LIMITE);
  return (
    <AbsoluteFill>
      <Img src={staticFile(foto)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${aproximacao})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.82) 78%)" }} />
    </AbsoluteFill>
  );
};

const CenaGancho = ({ cena, timeline }: PropsCena) => {
  const { cores } = timeline;
  return (
    <AbsoluteFill style={{ background: cores.fundo }}>
      <Camera socos={momentosDeDestaque(cena)}>
        {cena.foto ? <FotoDeFundo foto={cena.foto} /> : null}
        <Legenda palavras={cena.palavras} cor={BRANCO} corDestaque={{ cor: cores.destaque, corTexto: cores.fundo }} topo={cena.foto ? 1240 : 760} tamanho={120} />
      </Camera>
    </AbsoluteFill>
  );
};

const CenaAchado = ({ cena, timeline }: PropsCena) => {
  const { cores } = timeline;
  const carimbo = momentoDoCarimbo(cena);
  return (
    <AbsoluteFill style={{ background: cores.destaque }}>
      <Camera socos={[carimbo]}>
        {cena.foto ? <FotoDoProduto foto={cena.foto} inicio={2} topo={500} tamanho={780} /> : null}
        <Carimbo texto={cena.carimbo ?? "Achado!"} inicio={carimbo} cor={cores.primaria} topo={410} direita={60} />
        <Legenda palavras={cena.palavras} cor={cores.primaria} corDestaque={{ cor: cores.primaria, corTexto: cores.destaque }} topo={1380} />
      </Camera>
    </AbsoluteFill>
  );
};

const CenaSinal = ({ cena, timeline }: PropsCena) => {
  const { cores } = timeline;
  const carimbo = momentoDoCarimbo(cena);
  return (
    <AbsoluteFill style={{ background: cores.claro }}>
      <Camera socos={[carimbo]}>
        {cena.foto ? <FotoDoProduto foto={cena.foto} inicio={0} topo={300} tamanho={720} giro={cena.numero && cena.numero % 2 === 0 ? 3 : -3} /> : null}
        {cena.numero ? <Numero valor={cena.numero} inicio={2} cor={cores.primaria} corTexto={BRANCO} /> : null}
        {cena.carimbo ? <Carimbo texto={cena.carimbo} inicio={carimbo} cor={cores.primaria} topo={880} direita={80} giro={8} /> : null}
        <Legenda palavras={cena.palavras} cor={TINTA} corDestaque={{ cor: cores.destaque, corTexto: TINTA }} topo={1150} />
      </Camera>
    </AbsoluteFill>
  );
};

const BotaoComenta = ({ palavra, inicio, cor, corTexto }: { palavra: string; inicio: number; cor: string; corTexto: string }) => {
  const quadro = useCurrentFrame();
  const pop = usePop(inicio);
  const pulso = 1 + 0.06 * Math.max(0, Math.sin((quadro - inicio) * 0.35));
  const estilo: CSSProperties = { position: "absolute", top: 1180, left: 70, right: 70, padding: "34px 40px 42px", borderRadius: 80, background: cor, color: corTexto, textAlign: "center", font: `800 92px/1 ${FONTE_TITULO}`, transform: `scale(${pop * pulso})` };
  return <div style={estilo}>Comenta {palavra}</div>;
};

const MascotePulando = ({ mascote, inicio, cor }: { mascote: string; inicio: number; cor: string }) => {
  const quadro = useCurrentFrame();
  const pop = usePop(inicio);
  const pulo = Math.abs(Math.sin((quadro - inicio) * 0.22)) * -40;
  return (
    <div style={{ position: "absolute", top: 1420, right: 90, transform: `translateY(${pulo}px) scale(${pop})` }}>
      <Mascote mascote={mascote} tamanho={300} cor={cor} olharX={-14} olharY={-6} />
    </div>
  );
};

const CenaChamada = ({ cena, timeline }: PropsCena) => {
  const { cores, palavraChave, mascote } = timeline;
  return (
    <AbsoluteFill style={{ background: cores.destaque }}>
      <Camera socos={momentosDeDestaque(cena)}>
        <Legenda palavras={cena.palavras} cor={cores.primaria} corDestaque={{ cor: cores.primaria, corTexto: cores.destaque }} topo={420} />
        {palavraChave ? <BotaoComenta palavra={palavraChave} inicio={cena.palavras[0].quadro} cor={cores.primaria} corTexto={BRANCO} /> : null}
        <MascotePulando mascote={mascote} inicio={4} cor={cores.primaria} />
      </Camera>
    </AbsoluteFill>
  );
};

export const VISUAIS: Record<TipoCena, (props: PropsCena) => React.JSX.Element> = {
  gancho: CenaGancho,
  dor: CenaDor,
  achado: CenaAchado,
  sinal: CenaSinal,
  chamada: CenaChamada,
};
