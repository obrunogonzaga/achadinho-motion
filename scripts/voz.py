"""Gera a narração de cada cena pelo ElevenLabs. Sem ELEVENLABS_API_KEY, não faz nada."""

import hashlib
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

API = "https://api.elevenlabs.io/v1/text-to-speech/{voz}?output_format=mp3_44100_128"
VOZ_PADRAO = "GK4ZNLi5L8ZOBBT2Kaww"
MODELO_PADRAO = "eleven_v3"
VELOCIDADE_PADRAO = "1.1"


def arquivo_da_cena(indice, cena):
    return f"voz/{indice + 1:02d}-{cena['tipo']}"


def assinatura(texto, voz, modelo, velocidade):
    return hashlib.sha256(f"{texto}|{voz}|{modelo}|{velocidade}".encode()).hexdigest()


def pedir_audio(texto, chave, voz, modelo):
    corpo = json.dumps({"text": texto, "model_id": modelo, "language_code": "pt"}).encode()
    pedido = urllib.request.Request(API.format(voz=voz), data=corpo, method="POST")
    pedido.add_header("xi-api-key", chave)
    pedido.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(pedido, timeout=120) as resposta:
            return resposta.read()
    except urllib.error.HTTPError as erro:
        sys.exit(f"ElevenLabs recusou ({erro.code}): {erro.read().decode()[:300]}")


def converter_para_wav(mp3, wav, velocidade):
    filtro = f"atempo={velocidade},loudnorm=I=-16:TP=-1.5:LRA=11"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3), "-af", filtro, "-ar", "48000", "-ac", "1", str(wav)], check=True)


def gerar_cena(projeto, indice, cena, config):
    base = projeto / arquivo_da_cena(indice, cena)
    marca = assinatura(cena["fala"], config["voz"], config["modelo"], config["velocidade"])
    registro = base.with_suffix(".txt")
    if base.with_suffix(".wav").exists() and registro.exists() and registro.read_text() == marca:
        return
    mp3 = base.with_suffix(".mp3")
    mp3.write_bytes(pedir_audio(cena["fala"], config["chave"], config["voz"], config["modelo"]))
    converter_para_wav(mp3, base.with_suffix(".wav"), config["velocidade"])
    mp3.unlink()
    registro.write_text(marca)
    print(f"voz: {base.name}.wav")


def ler_config():
    return {
        "chave": os.environ.get("ELEVENLABS_API_KEY"),
        "voz": os.environ.get("ELEVENLABS_VOICE_ID", VOZ_PADRAO),
        "modelo": os.environ.get("ELEVENLABS_MODEL", MODELO_PADRAO),
        "velocidade": os.environ.get("VELOCIDADE_VOZ", VELOCIDADE_PADRAO),
    }


def main(projeto):
    config = ler_config()
    if not config["chave"]:
        print("voz: sem ELEVENLABS_API_KEY, vídeo sai só com legenda e trilha")
        return
    roteiro = json.loads((projeto / "roteiro.json").read_text())
    (projeto / "voz").mkdir(exist_ok=True)
    for indice, cena in enumerate(roteiro["cenas"]):
        gerar_cena(projeto, indice, cena, config)


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
