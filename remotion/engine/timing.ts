import { comoFalado, separarFala, type Pedaco } from "./texto.ts";
import type { Cena, CenaFicha, Cores, Ficha, Palavra, PalavraFalada, Timeline } from "../tipos.ts";

export const FPS = 30;
export const ANTECIPA_CORTE = 0.15;
export const FOLGA_FINAL = 2.5;
const JANELA = 4;
const PASSO_ESTIMADO = 0.3;

export const CORES_PADRAO: Cores = { fundo: "#0B0B0F", destaque: "#FFD400", primaria: "#1E35C9", claro: "#F2F4FF" };

const tokens = (fala: string) => separarFala(fala).map((pedaco) => comoFalado(pedaco.texto)).filter(Boolean);

const casaCabeca = (palavras: PalavraFalada[], indice: number, cabeca: string[]) =>
  cabeca.every((token, desvio) => comoFalado(palavras[indice + desvio]?.text ?? "") === token);

const acharInicio = (palavras: PalavraFalada[], cena: CenaFicha, cursor: number) => {
  const todos = tokens(cena.fala);
  for (let tamanho = Math.min(4, todos.length); tamanho > 0; tamanho -= 1) {
    const indice = palavras.findIndex((_, i) => i >= cursor && casaCabeca(palavras, i, todos.slice(0, tamanho)));
    if (indice >= 0) return indice;
  }
  throw new Error(`Cena "${cena.tipo}": não achei "${cena.fala.slice(0, 40)}" no áudio. Gere a voz de novo ou ajuste a fala.`);
};

export const acharInicios = (ficha: Ficha, palavras: PalavraFalada[]) =>
  ficha.cenas.reduce<number[]>((inicios, cena) => [...inicios, acharInicio(palavras, cena, inicios.length ? inicios[inicios.length - 1] + 1 : 0)], []);

const casarPedacos = (pedacos: Pedaco[], palavras: PalavraFalada[]) => {
  let cursor = 0;
  return pedacos.map((pedaco) => {
    const alvo = comoFalado(pedaco.texto);
    const limite = Math.min(palavras.length, cursor + JANELA);
    const achou = palavras.slice(cursor, limite).findIndex((palavra) => comoFalado(palavra.text) === alvo);
    if (achou < 0) return null;
    cursor += achou + 1;
    return palavras[cursor - 1].start;
  });
};

const preencher = (tempos: (number | null)[], base: number) =>
  tempos.map((tempo, indice) => {
    if (tempo !== null) return tempo;
    const antes = tempos.slice(0, indice).reverse().findIndex((t) => t !== null);
    const depois = tempos.slice(indice + 1).findIndex((t) => t !== null);
    if (antes >= 0 && depois >= 0) {
      const a = tempos[indice - antes - 1] as number;
      const b = tempos[indice + depois + 1] as number;
      return a + ((b - a) * (antes + 1)) / (antes + depois + 2);
    }
    if (antes >= 0) return (tempos[indice - antes - 1] as number) + PASSO_ESTIMADO * (antes + 1);
    if (depois >= 0) return Math.max(base, (tempos[indice + depois + 1] as number) - PASSO_ESTIMADO * (depois + 1));
    return base + PASSO_ESTIMADO * indice;
  });

const montarPalavras = (cena: CenaFicha, palavras: PalavraFalada[], inicioQuadro: number): Palavra[] => {
  const pedacos = separarFala(cena.fala);
  const tempos = preencher(casarPedacos(pedacos, palavras), palavras[0]?.start ?? 0);
  return pedacos.map((pedaco, indice) => ({ texto: pedaco.texto, destaque: pedaco.destaque, quadro: Math.max(0, Math.round(tempos[indice] * FPS) - inicioQuadro) }));
};

const caminhoDaFoto = (arquivo?: string) => (arquivo ? `fotos/${arquivo}` : null);

const montarCenas = (ficha: Ficha, palavras: PalavraFalada[], fimQuadro: number): Cena[] => {
  const inicios = acharInicios(ficha, palavras);
  const quadroDeCorte = (indice: number) => (indice === 0 ? 0 : Math.round((palavras[inicios[indice]].start - ANTECIPA_CORTE) * FPS));
  let sinais = 0;
  return ficha.cenas.map((cena, indice) => {
    const inicio = quadroDeCorte(indice);
    const fim = indice + 1 < inicios.length ? quadroDeCorte(indice + 1) : fimQuadro;
    sinais += cena.tipo === "sinal" ? 1 : 0;
    const daCena = palavras.slice(inicios[indice], inicios[indice + 1] ?? palavras.length);
    return {
      tipo: cena.tipo, inicio, fim, foto: caminhoDaFoto(cena.foto), carimbo: cena.carimbo ?? null,
      numero: cena.tipo === "sinal" ? sinais : null, palavras: montarPalavras(cena, daCena, inicio),
    };
  });
};

const tituloDaCapa = (ficha: Ficha) => ficha.capa?.titulo ?? ficha.cenas[0].fala;

const fotoDaCapa = (ficha: Ficha) => caminhoDaFoto(ficha.capa?.foto ?? ficha.cenas.find((cena) => cena.foto)?.foto);

type Opcoes = { voz: string | null; trilha?: string | null };

export const montarTimeline = (ficha: Ficha, palavras: PalavraFalada[], { voz, trilha = null }: Opcoes): Timeline => {
  const duracaoFrames = Math.round((palavras[palavras.length - 1].end + FOLGA_FINAL) * FPS);
  return {
    fps: FPS, duracaoFrames, voz, trilha, volumeTrilha: voz ? 0.45 : 0.9,
    cores: { ...CORES_PADRAO, ...ficha.cores }, mascote: ficha.mascote ?? "lupa",
    marca: ficha.marca ?? null, palavraChave: ficha.palavraChave ?? null,
    capa: { titulo: tituloDaCapa(ficha), foto: fotoDaCapa(ficha) },
    cenas: montarCenas(ficha, palavras, duracaoFrames),
  };
};
