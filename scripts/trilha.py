"""Gera trilha.wav (batida + efeitos nos cortes, destaques e carimbos) a partir de timeline.json."""

import json
import sys
from pathlib import Path

import numpy as np

from instrumentos import Mix, TAXA, aplica_reverb, baixo, bumbo, chimbal, eixo, finaliza, glissando, palma, prato, ruido_filtrado, salva_wav, toca_assinatura

BPM = 124
BATIDA = 60 / BPM
BAIXOS = ("A1", "F1", "C2", "G1")


def whoosh(segundos=0.32):
    t = eixo(segundos)
    envelope = (t / segundos) ** 2.2 * np.exp(-np.maximum(t - segundos * 0.85, 0) * 60)
    return ruido_filtrado(segundos, 500, 7000) * envelope


def pop():
    t = eixo(0.09)
    return np.sin(2 * np.pi * np.cumsum(380 + 900 * np.exp(-t * 60)) / TAXA) * np.exp(-t * 40)


def batida_de_fundo(mix, fim):
    for compasso in range(int(fim / BATIDA) // 4):
        primeira = compasso * 4
        mix.bat(baixo(BAIXOS[compasso % 4], 0.45), primeira, 0.2)
        mix.bat(bumbo(0.35), primeira)
        mix.bat(bumbo(0.25), primeira + 2.5)
        for passo in (1, 3):
            mix.bat(palma(), primeira + passo, 0.08, 0.2)
        for oitavo in range(8):
            mix.bat(chimbal(0.04), primeira + oitavo * 0.5, 0.03)


def carimbo(mix, segundos):
    mix.toca(bumbo(1.0), segundos, 0.95)
    mix.toca(palma(), segundos, 0.5, 0.3)
    mix.toca(prato(), segundos, 0.2, 0.3)


def segundos(cena, quadro, fps):
    return (cena["inicio"] + quadro) / fps


def momento_do_carimbo(cena):
    destacadas = [p["quadro"] for p in cena["palavras"] if p["destaque"]]
    return destacadas[0] if destacadas else cena["palavras"][-1]["quadro"]


def efeitos_da_cena(mix, cena, fps):
    for palavra in cena["palavras"]:
        if palavra["destaque"]:
            mix.toca(pop(), segundos(cena, palavra["quadro"], fps), 0.4)
    if cena["tipo"] == "achado" or cena["carimbo"]:
        carimbo(mix, segundos(cena, momento_do_carimbo(cena), fps))
    if cena["tipo"] == "chamada":
        mix.toca(glissando(200, 800, 0.4), cena["inicio"] / fps - 0.1, 0.1)
        toca_assinatura(mix, segundos(cena, momento_do_carimbo(cena), fps) / BATIDA, 0.4)


def cortes(mix, cenas, fps):
    for cena in cenas[1:]:
        corte = cena["inicio"] / fps
        mix.toca(whoosh(), corte - 0.3, 0.32)
        mix.toca(bumbo(0.7), corte, 0.6)


def main(projeto):
    caminho = projeto / "timeline.json"
    timeline = json.loads(caminho.read_text())
    fps, cenas = timeline["fps"], timeline["cenas"]
    duracao = timeline["duracaoFrames"] / fps
    mix = Mix(duracao, BATIDA)
    batida_de_fundo(mix, cenas[-1]["inicio"] / fps)
    cortes(mix, cenas, fps)
    for cena in cenas:
        efeitos_da_cena(mix, cena, fps)
    salva_wav(projeto / "trilha.wav", finaliza(aplica_reverb(mix), duracao))
    timeline["trilha"] = "trilha.wav"
    caminho.write_text(json.dumps(timeline, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
