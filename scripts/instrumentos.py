from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

TAXA = 48000
SEMITONS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
ruido = np.random.default_rng(27)


def hz(nota):
    return 440.0 * 2 ** ((SEMITONS[nota[0]] + 12 * (int(nota[-1]) + 1) - 69) / 12)


def eixo(segundos):
    return np.arange(int(segundos * TAXA)) / TAXA


def marimba(nota, segundos=0.7):
    t, f = eixo(segundos), hz(nota)
    corpo = np.sin(2 * np.pi * f * t) * np.exp(-t * 7)
    brilho = 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 26)
    return corpo + brilho + 0.08 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 70)


def sino(nota, segundos=1.6):
    t, f = eixo(segundos), hz(nota)
    parciais = [(1, 1, 2.6), (2.76, 0.4, 5.5), (5.4, 0.18, 11)]
    return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d) for r, a, d in parciais)


def corda(nota, segundos=1.0):
    atraso = int(TAXA / hz(nota))
    excitacao = np.zeros(int(segundos * TAXA))
    excitacao[:atraso] = ruido.uniform(-1, 1, atraso)
    denominador = np.zeros(atraso + 2)
    denominador[0], denominador[atraso], denominador[atraso + 1] = 1, -0.497, -0.497
    return lfilter([1], denominador, excitacao)


def baixo(nota, segundos=0.24):
    t, f = eixo(segundos), hz(nota)
    serra = 2 * (t * f % 1) - 1
    filtro = butter(2, 780, "low", fs=TAXA, output="sos")
    envelope = np.minimum(t * 300, 1) * np.exp(-t * 7)
    return (sosfilt(filtro, serra) + 0.9 * np.sin(2 * np.pi * f * t)) * envelope


def bumbo(forca=1.0):
    t = eixo(0.34)
    fase = 2 * np.pi * np.cumsum(46 + 110 * np.exp(-t * 34)) / TAXA
    return forca * np.sin(fase) * np.exp(-t * 11)


def ruido_filtrado(segundos, baixa, alta):
    filtro = butter(2, [baixa, alta], "band", fs=TAXA, output="sos")
    return sosfilt(filtro, ruido.uniform(-1, 1, int(segundos * TAXA)))


def palma():
    t = eixo(0.2)
    rajadas = sum(np.exp(-np.maximum(t - inicio, 0) * 90) * (t >= inicio) for inicio in (0, 0.012, 0.024))
    return ruido_filtrado(0.2, 900, 3600) * rajadas


def chimbal(segundos=0.05):
    return ruido_filtrado(segundos, 6500, 15000) * np.exp(-eixo(segundos) * 75)


def prato():
    return ruido_filtrado(1.3, 3000, 14000) * np.exp(-eixo(1.3) * 3.4)


def clique_interruptor():
    t = eixo(0.05)
    return ruido_filtrado(0.05, 1800, 7000) * np.exp(-t * 240) + 0.5 * np.sin(2 * np.pi * 180 * t) * np.exp(-t * 120)


def bip_piscada():
    t = eixo(0.1)
    return np.sin(2 * np.pi * np.cumsum(620 + 500 * t * 10) / TAXA) * np.exp(-t * 34)


def glissando(inicio_hz, fim_hz, segundos):
    t = eixo(segundos)
    curva = inicio_hz * (fim_hz / inicio_hz) ** (t / segundos)
    vibrato = 1 + 0.012 * np.sin(2 * np.pi * 7 * t)
    envelope = np.minimum(t * 40, 1) * np.minimum((segundos - t) * 25, 1)
    return np.sin(2 * np.pi * np.cumsum(curva * vibrato) / TAXA) * envelope


def pino_batendo():
    t = eixo(0.28)
    madeira = np.sin(2 * np.pi * 240 * t) * np.exp(-t * 34) + 0.5 * np.sin(2 * np.pi * 610 * t) * np.exp(-t * 60)
    return madeira + 0.45 * ruido_filtrado(0.28, 1500, 6000) * np.exp(-t * 120)


class Mix:
    def __init__(self, duracao, batida):
        self.seco = np.zeros(int(duracao * TAXA) + TAXA)
        self.molhado = np.zeros_like(self.seco)
        self.batida = batida

    def toca(self, som, segundos, volume=1.0, reverb=0.0):
        inicio = int(segundos * TAXA)
        fim = min(inicio + len(som), len(self.seco))
        self.seco[inicio:fim] += volume * som[: fim - inicio]
        self.molhado[inicio:fim] += volume * reverb * som[: fim - inicio]

    def bat(self, som, batida, volume=1.0, reverb=0.0):
        self.toca(som, batida * self.batida, volume, reverb)


ASSINATURA = [(0, "G4", "G5"), (0.5, "E5", "E6"), (1.5, "D5", "D6"), (2, "C5", "C6")]
ACORDES = {
    "C": ["C4", "E4", "G4", "C5"],
    "G": ["B3", "D4", "G4", "B4"],
    "Am": ["A3", "C4", "E4", "A4"],
    "F": ["A3", "C4", "F4", "A4"],
}
BAIXO_FUNK = ["A1", "A1", "C2", "A1", "E2", "D2", "C2", "G1"]
ALTURAS_ETIQUETAS = ["A4", "C5", "D5", "E5", "G5", "A5", "C6", "D6"]
ARPEJO = {"C": ["C5", "E5", "G5", "E5"], "G": ["B4", "D5", "G5", "D5"], "Am": ["C5", "E5", "A5", "E5"], "F": ["C5", "F5", "A5", "F5"]}


def toca_assinatura(mix, batida_inicial, volume=0.5):
    for desvio, grave, agudo in ASSINATURA:
        mix.bat(marimba(grave), batida_inicial + desvio, volume, 0.25)
        mix.bat(sino(agudo), batida_inicial + desvio, volume * 0.45, 0.4)


def dedilha(mix, acorde, batida, volume=0.16):
    for indice, nota in enumerate(ACORDES[acorde]):
        mix.toca(corda(nota), batida * mix.batida + indice * 0.012, volume, 0.2)


def bateria_funk(mix, batida):
    mix.bat(bumbo(1.0), batida)
    if batida % 2 == 1:
        mix.bat(palma(), batida, 0.34, 0.25)
    mix.bat(chimbal(), batida + 0.5, 0.22)


def toca_compasso_claro(mix, batida, acorde):
    dedilha(mix, acorde, batida, 0.1)
    mix.bat(bumbo(0.55), batida)
    mix.bat(bumbo(0.4), batida + 1)
    for passo, nota in enumerate(ARPEJO[acorde]):
        mix.bat(marimba(nota, 0.5), batida + passo * 0.5, 0.2, 0.25)
    for fora_do_tempo in (0.5, 1.5):
        mix.bat(chimbal(), batida + fora_do_tempo, 0.11)


def secao_busca(mix, digitou, achou):
    mix.toca(pino_batendo(), digitou, 0.25)
    for desvio, nota in ((0, "E6"), (0.1, "A6")):
        mix.toca(sino(nota), achou + desvio, 0.26, 0.5)


def secao_final(mix, luz, pino, acorde_final):
    primeira = luz / mix.batida
    final = acorde_final / mix.batida
    for batida, acorde in zip(primeira + np.arange(6), ("C", "G", "C", "F", "C", "G")):
        dedilha(mix, acorde, batida, 0.1)
        mix.bat(bumbo(0.8), batida)
        mix.bat(chimbal(), batida + 0.5, 0.14)
    for batida in (primeira + 1, primeira + 3, primeira + 5):
        mix.bat(palma(), batida, 0.2, 0.25)
    toca_assinatura(mix, primeira, 0.5)
    toca_assinatura(mix, primeira + 4, 0.55)
    mix.toca(pino_batendo(), pino, 0.9, 0.25)
    mix.toca(sino("G6"), pino, 0.14, 0.5)
    for nota in ("C4", "E4", "G4", "C5", "E5"):
        mix.bat(marimba(nota, 1.2), final, 0.26, 0.5)
    mix.bat(bumbo(0.7), final)


def aplica_reverb(mix):
    t = eixo(1.1)
    resposta = ruido.normal(0, 1, len(t)) * np.exp(-t * 5.5)
    resposta /= np.sqrt(np.sum(resposta ** 2))
    cauda = fftconvolve(mix.molhado, resposta)[: len(mix.seco)]
    return mix.seco + cauda


def finaliza(sinal, duracao):
    amostras = int(duracao * TAXA)
    saida = sinal[:amostras].copy()
    fade = int(0.06 * TAXA)
    saida[-fade:] *= np.linspace(1, 0, fade)
    saida = np.tanh(saida * 1.15) / np.tanh(1.15)
    return saida / np.max(np.abs(saida)) * 0.89


def salva_wav(destino: Path, sinal):
    wavfile.write(destino, TAXA, (sinal * 32767).astype(np.int16))
    print(destino)
