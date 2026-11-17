export type TipoCena = "gancho" | "dor" | "achado" | "sinal" | "chamada";

export type Cores = { fundo: string; destaque: string; primaria: string; claro: string };

export type FotoFicha = { arquivo: string; recorte?: boolean };

export type CenaFicha = {
  tipo: TipoCena;
  fala: string;
  foto?: string;
  carimbo?: string;
  fonte?: string;
};

export type Ficha = {
  produto: string;
  anuncio?: string;
  marca?: string;
  palavraChave?: string;
  mascote?: "lupa" | "nenhum" | string;
  emocao?: string;
  cores?: Partial<Cores>;
  fotos: FotoFicha[];
  capa?: { titulo?: string; foto?: string };
  cenas: CenaFicha[];
};

export type PalavraFalada = { text: string; start: number; end: number };

export type Palavra = { texto: string; quadro: number; destaque: boolean };

export type Cena = {
  tipo: TipoCena;
  inicio: number;
  fim: number;
  foto: string | null;
  carimbo: string | null;
  numero: number | null;
  palavras: Palavra[];
};

export type Timeline = {
  fps: number;
  duracaoFrames: number;
  voz: string | null;
  trilha: string | null;
  volumeTrilha: number;
  cores: Cores;
  mascote: string;
  mascoteSvg: string | null;
  marca: string | null;
  palavraChave: string | null;
  capa: { titulo: string; foto: string | null };
  cenas: Cena[];
};
