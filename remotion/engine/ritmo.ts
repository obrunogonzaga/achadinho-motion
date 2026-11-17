export const ABERTURA = 0.35;
export const PAUSA_ENTRE_CENAS = 0.85;
export const MINIMO_POR_CENA = 3.5;
export const DURACAO_ALVO: [number, number] = [22, 40];
export const TEMPO_MAXIMO = 1.12;

export const pausaDepoisDe = (duracaoDaFala: number) => Math.max(PAUSA_ENTRE_CENAS, MINIMO_POR_CENA - duracaoDaFala);
