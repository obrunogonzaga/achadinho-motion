# achadinho-motion

Skill para Claude Code (e outros agentes que leem `SKILL.md`) que transforma fotos de um achadinho em Reel animado.

Você manda de 2 a 6 fotos do produto e o texto do anúncio. O agente:

1. escreve a ficha de ~30 s (dor → achado → 3 sinais → chamada), só com funções que estão no anúncio, e para para você aprovar;
2. recorta o produto do fundo (macOS);
3. gera a narração do roteiro inteiro com o seu TTS de linha de comando ou pelo ElevenLabs;
4. sincroniza cada palavra da legenda com a voz e põe pausas entre as cenas;
5. monta a trilha com efeitos sonoros;
6. renderiza o vídeo 1080×1920 e a capa no Remotion e confere o resultado (duração, fotos, fonte de cada função, preço na fala, folha de quadros).

Saída: `video.mp4` (H.264) e `capa.jpg`, prontos para Reels, TikTok e Shorts.

## Instalar

```bash
git clone https://github.com/obrunogonzaga/achadinho-motion ~/.claude/skills/achadinho-motion
cd ~/.claude/skills/achadinho-motion && npm install
pip install numpy scipy openai-whisper
```

Também precisa de Node 22.18+ e `ffmpeg`. O recorte do produto usa o Vision do macOS (precisa do `swiftc`); em outro sistema, salve o recorte à mão.

O `openai-whisper` só é usado quando o seu TTS não devolve o tempo das palavras.

Para ter voz, escolha uma opção.

Um TTS seu, de linha de comando (por exemplo, um modelo aberto rodando na sua GPU):

```bash
export VOZ_COMANDO='meutts say -f {arquivo} -o {saida} -w {palavras}'
```

Ou o ElevenLabs:

```bash
export ELEVENLABS_API_KEY=...
```

Sem voz, o vídeo sai só com legenda e trilha.

## Usar

No Claude Code, mande as fotos e o texto do anúncio:

> Faz um vídeo desse achadinho. Fotos em ./fotos-luminaria, anúncio: "Luminária LED com sensor de presença, fita 3M, recarrega via USB…"

Ou rode na mão (formato da ficha no [SKILL.md](SKILL.md)):

```bash
SKILL=~/.claude/skills/achadinho-motion
node $SKILL/scripts/reel.mjs reels/luminaria-sensor novo       # cria roteiro.json e fotos/
node $SKILL/scripts/reel.mjs reels/luminaria-sensor preparar   # narração + recorte
node $SKILL/scripts/reel.mjs reels/luminaria-sensor finalizar  # voz, áudio, trilha, render, checagem
```

O resultado fica em `reels/luminaria-sensor/out/`.

## Personalizar

No `roteiro.json`:

- `cores`: fundo, destaque, primária e claro
- `marca`: o @ do perfil no canto
- `palavraChave`: mostra o botão "Comenta PALAVRA" no final
- `mascote`: `"lupa"`, `"nenhum"` ou o arquivo do mascote da sua marca (`"mascote.svg"`, com fundo transparente)

Para mudar o visual, edite `remotion/cenas.tsx` e veja ao vivo com `npm run studio`.

## Licença

O código deste repositório é MIT (veja [LICENSE](LICENSE)).

**Atenção: o Remotion, usado para renderizar, tem licença própria.** É grátis para pessoas físicas, empresas com até 3 funcionários e organizações sem fins lucrativos. Empresas maiores precisam de uma licença paga. Confira em [remotion.dev/license](https://www.remotion.dev/license) antes de usar comercialmente.

As fontes (Bricolage Grotesque e Instrument Sans) são do Google Fonts, sob a licença OFL. A voz padrão é uma voz da biblioteca do ElevenLabs e segue os termos da sua conta lá.

Feito pelo [Achou, morou?](https://instagram.com/achou.morou).
