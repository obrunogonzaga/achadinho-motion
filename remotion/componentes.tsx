import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BRANCO, FONTE_TEXTO, FONTE_TITULO, LIMITE, TINTA } from "./tema";
import type { Palavra } from "./tipos";

const MAX_PALAVRAS_POR_BLOCO = 6;

export const usePop = (inicio: number, rigidez = 220) => {
  const quadro = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: quadro - inicio, fps, config: { damping: 11, stiffness: rigidez } });
};

const somarImpactos = (quadro: number, momentos: number[], duracao: number, forca: (passado: number) => number) =>
  momentos.reduce((total, momento) => {
    const passado = quadro - momento;
    return passado < 0 || passado > duracao ? total : total + forca(passado);
  }, 0);

export const Camera = ({ socos = [], children }: { socos?: number[]; children: ReactNode }) => {
  const quadro = useCurrentFrame();
  const entrada = interpolate(quadro, [0, 7], [1.14, 1], LIMITE);
  const deriva = interpolate(quadro, [0, 160], [1, 1.05], LIMITE);
  const soco = somarImpactos(quadro, socos, 14, (passado) => 0.07 * Math.exp(-passado / 4));
  const tremor = somarImpactos(quadro, socos, 10, (passado) => 22 * (1 - passado / 10));
  const desfoque = interpolate(quadro, [0, 5], [10, 0], LIMITE);
  const deslocamento = `translate(${Math.sin(quadro * 2.7) * tremor}px, ${Math.cos(quadro * 3.3) * tremor}px)`;
  return (
    <AbsoluteFill style={{ transform: `${deslocamento} scale(${entrada * deriva + soco})`, filter: `blur(${desfoque}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

export const Destaque = ({ children, cor, corTexto }: { children: ReactNode; cor: string; corTexto: string }) => (
  <span style={{ display: "inline-block", padding: "0 16px 8px", borderRadius: 16, background: cor, color: corTexto, transform: "rotate(-2deg)" }}>
    {children}
  </span>
);

type CorDestaque = { cor: string; corTexto: string };

type Unidade = { texto: string; quadro: number; destaque: boolean; palavras: number };

const agruparDestaques = (palavras: Palavra[]) =>
  palavras.reduce<Unidade[]>((unidades, palavra) => {
    const anterior = unidades[unidades.length - 1];
    const continua = anterior?.destaque && palavra.destaque && !/[.!?,:;]$/.test(anterior.texto);
    if (continua) return [...unidades.slice(0, -1), { ...anterior, texto: `${anterior.texto} ${palavra.texto}`, palavras: anterior.palavras + 1 }];
    return [...unidades, { texto: palavra.texto, quadro: palavra.quadro, destaque: palavra.destaque, palavras: 1 }];
  }, []);

const UnidadeAnimada = ({ unidade, corDestaque }: { unidade: Unidade; corDestaque: CorDestaque }) => {
  const pop = usePop(unidade.quadro);
  const conteudo = unidade.destaque ? <Destaque {...corDestaque}>{unidade.texto}</Destaque> : unidade.texto;
  const estilo: CSSProperties = { display: "inline-block", whiteSpace: "nowrap", margin: "0 0.12em", opacity: Math.min(pop * 3, 1), transform: `translateY(${(1 - pop) * 40}px) scale(${0.6 + pop * 0.4})` };
  return <span style={estilo}>{conteudo}</span>;
};

const separarPorPontuacao = (unidades: Unidade[]) =>
  unidades.reduce<Unidade[][]>((trechos, unidade) => {
    trechos[trechos.length - 1].push(unidade);
    if (/[.!?,:;]$/.test(unidade.texto)) trechos.push([]);
    return trechos;
  }, [[]]).filter((trecho) => trecho.length > 0);

const contarPalavras = (unidades: Unidade[]) => unidades.reduce((total, unidade) => total + unidade.palavras, 0);

const dividirIgualmente = (trecho: Unidade[]) => {
  const partes = Math.ceil(contarPalavras(trecho) / MAX_PALAVRAS_POR_BLOCO);
  const alvo = contarPalavras(trecho) / partes;
  return trecho.reduce<Unidade[][]>((blocos, unidade) => {
    const atual = blocos[blocos.length - 1];
    if (atual.length && contarPalavras(atual) + unidade.palavras > Math.ceil(alvo)) return [...blocos, [unidade]];
    atual.push(unidade);
    return blocos;
  }, [[]]);
};

export const separarEmBlocos = (palavras: Palavra[]) => separarPorPontuacao(agruparDestaques(palavras)).flatMap(dividirIgualmente);

const tamanhoDaFonte = (bloco: Unidade[], base: number) => {
  const letras = bloco.reduce((total, unidade) => total + unidade.texto.length, 0);
  if (letras > 26) return base * 0.78;
  if (letras > 18) return base * 0.9;
  return base;
};

type PropsLegenda = { palavras: Palavra[]; cor: string; corDestaque: CorDestaque; topo: number; tamanho?: number };

export const Legenda = ({ palavras, cor, corDestaque, topo, tamanho = 112 }: PropsLegenda) => {
  const quadro = useCurrentFrame();
  const blocos = separarEmBlocos(palavras);
  const visivel = [...blocos].reverse().find((bloco) => bloco[0].quadro <= quadro) ?? blocos[0];
  const estilo: CSSProperties = { position: "absolute", top: topo, left: 70, right: 70, textAlign: "center", textWrap: "balance", color: cor, font: `800 ${tamanhoDaFonte(visivel, tamanho)}px/1.12 ${FONTE_TITULO}`, letterSpacing: "-0.03em" };
  return (
    <div style={estilo}>
      {visivel.map((unidade) => <UnidadeAnimada key={`${unidade.quadro}-${unidade.texto}`} unidade={unidade} corDestaque={corDestaque} />)}
    </div>
  );
};

type PropsCarimbo = { texto: string; inicio: number; cor: string; topo: number; direita: number; giro?: number };

export const Carimbo = ({ texto, inicio, cor, topo, direita, giro = -12 }: PropsCarimbo) => {
  const quadro = useCurrentFrame();
  if (quadro < inicio) return null;
  const batida = interpolate(quadro - inicio, [0, 5], [2.4, 1], LIMITE);
  const opacidade = interpolate(quadro - inicio, [0, 3], [0, 1], LIMITE);
  const estilo: CSSProperties = { position: "absolute", top: topo, right: direita, padding: "14px 34px 18px", border: `10px solid ${cor}`, borderRadius: 22, color: cor, font: `800 84px/1 ${FONTE_TITULO}`, letterSpacing: "0.02em", textTransform: "uppercase", opacity: opacidade, transform: `rotate(${giro}deg) scale(${batida})`, background: "rgba(255,255,255,0.88)" };
  return <div style={estilo}>{texto}</div>;
};

type PropsCartao = { foto: string; inicio: number; topo: number; tamanho: number; giro?: number; borda?: string };

export const CartaoFoto = ({ foto, inicio, topo, tamanho, giro = -3, borda = BRANCO }: PropsCartao) => {
  const quadro = useCurrentFrame();
  const pop = usePop(inicio, 160);
  const aproximacao = interpolate(quadro - inicio, [0, 150], [1, 1.12], LIMITE);
  const moldura: CSSProperties = { position: "absolute", top: topo, left: "50%", width: tamanho, height: tamanho, marginLeft: -tamanho / 2, borderRadius: 48, overflow: "hidden", border: `14px solid ${borda}`, boxShadow: "0 40px 90px rgba(0,0,0,0.35)", transform: `rotate(${giro * pop}deg) scale(${pop})`, background: BRANCO };
  return (
    <div style={moldura}>
      <Img src={staticFile(foto)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${aproximacao})` }} />
    </div>
  );
};

const FotoSolta = ({ foto, inicio, topo, tamanho, giro = -3 }: PropsCartao) => {
  const quadro = useCurrentFrame();
  const pop = usePop(inicio, 160);
  const flutua = Math.sin((quadro - inicio) * 0.07) * 14;
  const estilo: CSSProperties = { position: "absolute", top: topo, left: "50%", width: tamanho, height: tamanho, marginLeft: -tamanho / 2, objectFit: "contain", filter: "drop-shadow(0 40px 50px rgba(0,0,0,0.35))", transform: `translateY(${flutua}px) rotate(${giro * pop}deg) scale(${pop})` };
  return <Img src={staticFile(foto)} style={estilo} />;
};

export const ehRecorte = (foto: string) => foto.endsWith("-recorte.png");

export const FotoDoProduto = (props: PropsCartao) => (ehRecorte(props.foto) ? <FotoSolta {...props} /> : <CartaoFoto {...props} />);

export const Numero =({ valor, inicio, cor, corTexto }: { valor: number; inicio: number; cor: string; corTexto: string }) => {
  const pop = usePop(inicio);
  const estilo: CSSProperties = { position: "absolute", top: 150, left: 80, width: 150, height: 150, borderRadius: "50%", background: cor, color: corTexto, font: `800 100px/150px ${FONTE_TITULO}`, textAlign: "center", transform: `scale(${pop}) rotate(${(1 - pop) * -90}deg)` };
  return <div style={estilo}>{valor}</div>;
};

type PropsLupa = { tamanho: number; cor: string; olharX?: number; olharY?: number; piscando?: boolean };

export const Lupa = ({ tamanho, cor, olharX = 0, olharY = 0, piscando = false }: PropsLupa) => {
  const alturaOlho = piscando ? 2 : 26;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 200 200">
      <rect x="118" y="122" width="30" height="78" rx="15" fill={cor} transform="rotate(-45 133 161)" />
      <circle cx="84" cy="84" r="66" fill="#EAF6FF" stroke={cor} strokeWidth="16" />
      <path d="M44 58 Q58 34 86 30" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" fill="none" />
      {[62, 106].map((centro) => (
        <g key={centro}>
          <ellipse cx={centro} cy="88" rx="15" ry={alturaOlho} fill={BRANCO} stroke={TINTA} strokeWidth="5" />
          {piscando ? null : <circle cx={centro + olharX * 0.5} cy={88 + olharY * 0.5} r="8" fill={TINTA} />}
        </g>
      ))}
    </svg>
  );
};

export const Progresso = ({ duracao, cor, borda }: { duracao: number; cor: string; borda: string }) => {
  const quadro = useCurrentFrame();
  const largura = interpolate(quadro, [0, duracao], [0, 100], LIMITE);
  return <div style={{ position: "absolute", top: 0, left: 0, height: 14, width: `${largura}%`, background: cor, borderRight: `6px solid ${borda}` }} />;
};

export const Marca = ({ texto, cor, corTexto }: { texto: string; cor: string; corTexto: string }) => (
  <div style={{ position: "absolute", bottom: 82, left: 60, padding: "16px 34px 20px", borderRadius: 26, background: cor, color: corTexto, font: `700 42px/1 ${FONTE_TEXTO}` }}>
    {texto}
  </div>
);
