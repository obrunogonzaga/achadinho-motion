export type TipoCena = "dor" | "achado" | "sinal" | "chamada";

export type Palavra = { texto: string; quadro: number; destaque: boolean };

export type Cena = {
  tipo: TipoCena;
  inicio: number;
  fim: number;
  voz: string | null;
  foto: string | null;
  carimbo: string | null;
  numero: number | null;
  palavras: Palavra[];
};

export type Cores = { fundo: string; destaque: string; primaria: string; claro: string };

export type Timeline = {
  fps: number;
  duracaoFrames: number;
  atrasoVoz: number;
  trilha: string | null;
  volumeTrilha: number;
  cores: Cores;
  mascote: "lupa" | "nenhum";
  marca: string | null;
  palavraChave: string | null;
  capa: { titulo: string; destaque: string | null; foto: string | null };
  cenas: Cena[];
};
