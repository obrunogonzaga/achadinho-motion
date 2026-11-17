"""Gera a narração de cada cena.

Ordem: VOZ_COMANDO (qualquer TTS por linha de comando), depois ELEVENLABS_API_KEY. Sem nenhum dos dois, não faz nada.
"""

import hashlib
import json
import os
import shlex
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

API = "https://api.elevenlabs.io/v1/text-to-speech/{voz}?output_format=mp3_44100_128"
VOZ_PADRAO = "GK4ZNLi5L8ZOBBT2Kaww"
MODELO_PADRAO = "eleven_v3"
VELOCIDADE_PADRAO = "1.1"


def base_da_cena(projeto, indice, cena):
    return projeto / "voz" / f"{indice + 1:02d}-{cena['tipo']}"


def pedir_elevenlabs(texto, config, destino):
    corpo = json.dumps({"text": texto, "model_id": config["modelo"], "language_code": "pt"}).encode()
    pedido = urllib.request.Request(API.format(voz=config["voz"]), data=corpo, method="POST")
    pedido.add_header("xi-api-key", config["chave"])
    pedido.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(pedido, timeout=120) as resposta:
            destino.write_bytes(resposta.read())
    except urllib.error.HTTPError as erro:
        sys.exit(f"ElevenLabs recusou ({erro.code}): {erro.read().decode()[:300]}")


def rodar_comando(texto, config, destino, palavras):
    valores = {"texto": texto, "saida": str(destino), "palavras": str(palavras)}
    argumentos = [parte.format(**valores) for parte in shlex.split(config["comando"])]
    resultado = subprocess.run(argumentos, capture_output=True, text=True)
    if resultado.returncode != 0 or not destino.exists():
        sys.exit(f"VOZ_COMANDO falhou: {resultado.stderr.strip()[-300:]}")


def converter_para_wav(origem, wav, velocidade):
    filtros = [f"atempo={velocidade}"] if velocidade != "1" else []
    filtros.append("loudnorm=I=-16:TP=-1.5:LRA=11")
    comando = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(origem), "-af", ",".join(filtros), "-ar", "48000", "-ac", "1", str(wav)]
    subprocess.run(comando, check=True)


def sintetizar(texto, config, base):
    palavras = base.with_suffix(".palavras.json")
    palavras.unlink(missing_ok=True)
    with tempfile.TemporaryDirectory() as pasta:
        bruto = Path(pasta) / "voz.mp3"
        if config["comando"]:
            rodar_comando(texto, config, bruto, palavras)
        else:
            pedir_elevenlabs(texto, config, bruto)
        converter_para_wav(bruto, base.with_suffix(".wav"), config["velocidade"])
    if config["velocidade"] != "1":
        palavras.unlink(missing_ok=True)


def assinatura(texto, config):
    partes = [texto, config["comando"] or "", config["voz"], config["modelo"], config["velocidade"]]
    return hashlib.sha256("|".join(partes).encode()).hexdigest()


def gerar_cena(base, cena, config):
    marca = assinatura(cena["fala"], config)
    registro = base.with_suffix(".txt")
    if base.with_suffix(".wav").exists() and registro.exists() and registro.read_text() == marca:
        return
    sintetizar(cena["fala"], config, base)
    registro.write_text(marca)
    print(f"voz: {base.name}.wav")


def ler_config():
    comando = os.environ.get("VOZ_COMANDO")
    return {
        "comando": comando,
        "chave": os.environ.get("ELEVENLABS_API_KEY"),
        "voz": os.environ.get("ELEVENLABS_VOICE_ID", VOZ_PADRAO),
        "modelo": os.environ.get("ELEVENLABS_MODEL", MODELO_PADRAO),
        "velocidade": os.environ.get("VELOCIDADE_VOZ", "1" if comando else VELOCIDADE_PADRAO),
    }


def main(projeto):
    config = ler_config()
    if not config["comando"] and not config["chave"]:
        print("voz: sem VOZ_COMANDO nem ELEVENLABS_API_KEY, vídeo sai só com legenda e trilha")
        return
    roteiro = json.loads((projeto / "roteiro.json").read_text())
    (projeto / "voz").mkdir(exist_ok=True)
    for indice, cena in enumerate(roteiro["cenas"]):
        gerar_cena(base_da_cena(projeto, indice, cena), cena, config)


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
