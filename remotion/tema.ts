import { loadFont as carregarBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as carregarInstrument } from "@remotion/google-fonts/InstrumentSans";

const bricolage = carregarBricolage("normal", { weights: ["800"], subsets: ["latin", "latin-ext"] });
const instrument = carregarInstrument("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] });

export const FONTE_TITULO = bricolage.fontFamily;
export const FONTE_TEXTO = instrument.fontFamily;
export const LARGURA = 1080;
export const ALTURA = 1920;
export const TINTA = "#15161A";
export const BRANCO = "#FFFFFF";
export const LIMITE = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
