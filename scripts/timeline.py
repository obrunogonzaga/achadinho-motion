"""Lê roteiro.json (e a voz, se houver) e escreve timeline.json com o quadro de cada palavra."""

import difflib
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

FPS = 30
ATRASO_VOZ = 3
FOLGA_ENTRE_CENAS = 6
FOLGA_FINAL = 36
MODELO_WHISPER = os.environ.get("WHISPER_MODEL", "small")
CORES_PADRAO = {"fundo": "#0B0B0F", "destaque": "#FFD400", "primaria": "#1E35C9", "claro": "#F2F4FF"}
TIPOS = {"dor", "achado", "sinal", "chamada"}


def normalizar(texto):
    return re.sub(r"[^\w$]", "", texto.lower())


def transcrever(wavs):
    if not wavs:
        return {}
    with tempfile.TemporaryDirectory() as pasta:
        comando = ["whisper", *map(str, wavs), "--model", MODELO_WHISPER, "--language", "pt", "--word_timestamps", "True",
                   "--output_format", "json", "--output_dir", pasta, "--fp16", "False"]
        subprocess.run(comando, check=True, capture_output=True)
        return {wav: palavras_ouvidas(Path(pasta) / f"{wav.stem}.json") for wav in wavs}


def palavras_ouvidas(arquivo):
    resultado = json.loads(arquivo.read_text())
    return [(palavra["word"].strip(), palavra["start"]) for segmento in resultado["segments"] for palavra in segmento.get("words", [])]


def alinhar(tokens, ouvidas):
    inicios = [None] * len(tokens)
    comparador = difflib.SequenceMatcher(None, [normalizar(t) for t in tokens], [normalizar(p) for p, _ in ouvidas], autojunk=False)
    for bloco in comparador.get_matching_blocks():
        for desvio in range(bloco.size):
            inicios[bloco.a + desvio] = ouvidas[bloco.b + desvio][1]
    return preencher_lacunas(inicios)


def preencher_lacunas(inicios):
    conhecidos = [(indice, valor) for indice, valor in enumerate(inicios) if valor is not None]
    if not conhecidos:
        return [indice * 0.35 for indice in range(len(inicios))]
    preenchidos = list(inicios)
    for indice, valor in enumerate(inicios):
        if valor is None:
            antes = [c for c in conhecidos if c[0] < indice]
            depois = [c for c in conhecidos if c[0] > indice]
            preenchidos[indice] = interpolar(indice, antes[-1] if antes else None, depois[0] if depois else None)
    return preenchidos


def interpolar(indice, antes, depois):
    if antes and depois:
        return antes[1] + (depois[1] - antes[1]) * (indice - antes[0]) / (depois[0] - antes[0])
    if antes:
        return antes[1] + 0.3 * (indice - antes[0])
    return max(depois[1] - 0.3 * (depois[0] - indice), 0)


def estimar_inicios(tokens):
    inicios, tempo = [], 0.0
    for token in tokens:
        inicios.append(tempo)
        tempo += 0.26 + 0.035 * len(token)
        tempo += 0.38 if re.search(r"[.!?]$", token) else 0.2 if re.search(r"[,;:]$", token) else 0
    return inicios, tempo + 0.2


def duracao_do_audio(wav):
    saida = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)], check=True, capture_output=True, text=True)
    return float(saida.stdout.strip())


def arquivo_de_voz(projeto, indice, cena):
    return projeto / "voz" / f"{indice + 1:02d}-{cena['tipo']}.wav"


def tempos_da_cena(projeto, wav, ouvidas, tokens):
    if wav not in ouvidas:
        inicios, duracao = estimar_inicios(tokens)
        return inicios, duracao, None
    return alinhar(tokens, ouvidas[wav]), duracao_do_audio(wav), wav.relative_to(projeto).as_posix()


def montar_palavras(tokens, inicios, destaques):
    alvos = {normalizar(d) for d in destaques}
    return [{"texto": t, "quadro": ATRASO_VOZ + round(inicio * FPS), "destaque": normalizar(t) in alvos} for t, inicio in zip(tokens, inicios)]


def caminho_da_foto(roteiro, indice):
    if indice is None:
        return None
    return roteiro["fotos"][indice]


def montar_cena(projeto, roteiro, ouvidas, indice, inicio, numero):
    cena = roteiro["cenas"][indice]
    tokens = cena["fala"].split()
    inicios, duracao, voz = tempos_da_cena(projeto, arquivo_de_voz(projeto, indice, cena), ouvidas, tokens)
    ultima = indice == len(roteiro["cenas"]) - 1
    tamanho = ATRASO_VOZ + round(duracao * FPS) + (FOLGA_FINAL if ultima else FOLGA_ENTRE_CENAS)
    return {
        "tipo": cena["tipo"], "inicio": inicio, "fim": inicio + tamanho, "voz": voz,
        "foto": caminho_da_foto(roteiro, cena.get("foto")), "carimbo": cena.get("carimbo"),
        "numero": numero, "palavras": montar_palavras(tokens, inicios, cena.get("destaques", [])),
    }


def montar_cenas(projeto, roteiro):
    wavs = [arquivo_de_voz(projeto, i, c) for i, c in enumerate(roteiro["cenas"])]
    ouvidas = transcrever([wav for wav in wavs if wav.exists()])
    cenas, inicio, sinais = [], 0, 0
    for indice, cena in enumerate(roteiro["cenas"]):
        sinais += cena["tipo"] == "sinal"
        numero = sinais if cena["tipo"] == "sinal" else None
        cenas.append(montar_cena(projeto, roteiro, ouvidas, indice, inicio, numero))
        inicio = cenas[-1]["fim"]
    return cenas


def montar_capa(roteiro):
    primeira = roteiro["cenas"][0]
    capa = roteiro.get("capa", {})
    destaques = primeira.get("destaques", [])
    return {
        "titulo": capa.get("titulo", primeira["fala"]),
        "destaque": capa.get("destaque", destaques[0] if destaques else None),
        "foto": caminho_da_foto(roteiro, capa.get("foto", 0 if roteiro["fotos"] else None)),
    }


def validar(projeto, roteiro):
    erros = [f"cena {i + 1}: tipo '{c['tipo']}' inválido" for i, c in enumerate(roteiro["cenas"]) if c["tipo"] not in TIPOS]
    erros += [f"foto não encontrada: {f}" for f in roteiro.get("fotos", []) if not (projeto / f).exists()]
    erros += [f"cena {i + 1}: foto {c['foto']} fora da lista" for i, c in enumerate(roteiro["cenas"]) if c.get("foto") is not None and c["foto"] >= len(roteiro["fotos"])]
    if erros:
        sys.exit("roteiro.json com problema:\n- " + "\n- ".join(erros))


def main(projeto):
    roteiro = json.loads((projeto / "roteiro.json").read_text())
    roteiro.setdefault("fotos", [])
    validar(projeto, roteiro)
    cenas = montar_cenas(projeto, roteiro)
    tem_voz = any(cena["voz"] for cena in cenas)
    timeline = {
        "fps": FPS, "duracaoFrames": cenas[-1]["fim"], "atrasoVoz": ATRASO_VOZ, "trilha": None,
        "volumeTrilha": 0.45 if tem_voz else 0.9, "cores": {**CORES_PADRAO, **roteiro.get("cores", {})},
        "mascote": roteiro.get("mascote", "lupa"), "marca": roteiro.get("marca"),
        "palavraChave": roteiro.get("palavraChave"), "capa": montar_capa(roteiro), "cenas": cenas,
    }
    (projeto / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=1))
    print(f"timeline: {len(cenas)} cenas, {timeline['duracaoFrames'] / FPS:.1f} s, {'com' if tem_voz else 'sem'} voz")


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
