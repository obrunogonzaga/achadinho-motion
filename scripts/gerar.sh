#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "uso: scripts/gerar.sh <pasta-do-projeto>" >&2
  exit 1
fi

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
PROJETO="$(cd "$1" && pwd)"
SAIDA="$PROJETO/out"
PROPS=(--props="$PROJETO/timeline.json" --public-dir="$PROJETO")

python3 "$RAIZ/scripts/voz.py" "$PROJETO"
python3 "$RAIZ/scripts/timeline.py" "$PROJETO"
python3 "$RAIZ/scripts/trilha.py" "$PROJETO"

cd "$RAIZ"
[ -d node_modules ] || npm install --silent
mkdir -p "$SAIDA"
npx remotion render remotion/index.ts Reel "$SAIDA/video.mp4" "${PROPS[@]}" --codec=h264 --crf=18 --audio-bitrate=192k --log=error
npx remotion still remotion/index.ts Capa "$SAIDA/capa.jpg" "${PROPS[@]}" --image-format=jpeg --jpeg-quality=92 --log=error

echo "pronto: $SAIDA/video.mp4 e $SAIDA/capa.jpg"
