import { ABERTURA, pausaDepoisDe } from "./ritmo.ts";
import { separarFala } from "./texto.ts";
import type { Ficha, PalavraFalada } from "../tipos.ts";

const duracaoDaPalavra = (texto: string) => 0.3 + 0.04 * texto.length;

const respiro = (texto: string) => (/[.!?]$/.test(texto) ? 0.38 : /[,;:]$/.test(texto) ? 0.2 : 0);

const estimarCena = (fala: string, inicio: number) =>
  separarFala(fala).reduce<PalavraFalada[]>((palavras, { texto }) => {
    const anterior = palavras[palavras.length - 1];
    const start = anterior ? anterior.end + respiro(anterior.text) : inicio;
    return [...palavras, { text: texto, start, end: start + duracaoDaPalavra(texto) }];
  }, []);

export const estimarPalavras = (ficha: Ficha): PalavraFalada[] => {
  let inicio = ABERTURA;
  return ficha.cenas.flatMap((cena) => {
    const palavras = estimarCena(cena.fala, inicio);
    const fim = palavras[palavras.length - 1].end;
    inicio = fim + pausaDepoisDe(fim - palavras[0].start);
    return palavras;
  });
};
