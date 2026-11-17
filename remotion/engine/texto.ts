export type Pedaco = { texto: string; destaque: boolean };

const UNIDADES = ["zero", "um", "dois", "tres", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

const primeiraPalavraDoNumero = (valor: number): string => {
  if (valor >= 2000) return primeiraPalavraDoNumero(Math.floor(valor / 1000));
  if (valor >= 1000) return "mil";
  if (valor === 100) return "cem";
  if (valor >= 100) return CENTENAS[Math.floor(valor / 100)];
  if (valor >= 20) return DEZENAS[Math.floor(valor / 10)];
  return UNIDADES[valor];
};

export const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

export const comoFalado = (texto: string) => (/^\d/.test(texto) ? primeiraPalavraDoNumero(parseInt(texto, 10)) : normalizar(texto));

export const separarFala = (fala: string): Pedaco[] =>
  fala
    .split(/(\[[^\]]+\])/)
    .filter(Boolean)
    .flatMap((parte) => {
      const destaque = parte.startsWith("[");
      return parte.replace(/[[\]]/g, "").split(/\s+/).filter(Boolean).map((texto) => ({ texto, destaque }));
    })
    .reduce<Pedaco[]>((pedacos, pedaco) => {
      const anterior = pedacos[pedacos.length - 1];
      if (anterior && /^[.,!?:;…]+$/.test(pedaco.texto)) return [...pedacos.slice(0, -1), { ...anterior, texto: anterior.texto + pedaco.texto }];
      return [...pedacos, pedaco];
    }, []);

export const semMarcas = (fala: string) => separarFala(fala).map((pedaco) => pedaco.texto).join(" ");

export const juntarDestaques = (pedacos: Pedaco[]) =>
  pedacos.reduce<Pedaco[]>((juntos, pedaco) => {
    const anterior = juntos[juntos.length - 1];
    if (anterior?.destaque && pedaco.destaque) return [...juntos.slice(0, -1), { ...anterior, texto: `${anterior.texto} ${pedaco.texto}` }];
    return [...juntos, pedaco];
  }, []);
