---
name: achadinho-motion
description: Transforma de 2 a 6 fotos de um achadinho (produto de afiliado Shopee, Amazon, Mercado Livre etc.) em um Reel vertical animado de ~25 s, com legenda palavra por palavra, carimbos, trilha, voz opcional pelo ElevenLabs e capa JPEG. Usar quando pedirem "faz um vídeo desse achadinho", "transforma essas fotos em Reel", "vídeo pro TikTok desse produto", "motion do produto" ou mandarem fotos de produto com o texto ou link do anúncio.
---

# achadinho-motion

Fotos do produto + texto do anúncio → `video.mp4` (1080×1920, H.264) + `capa.jpg`.

## O que precisa estar instalado

- Node 18+ e `ffmpeg` (com `ffprobe`)
- Python 3 com `numpy` e `scipy` (`pip install numpy scipy`)
- Só para voz: `ELEVENLABS_API_KEY` no ambiente e `openai-whisper` (`pip install openai-whisper`), que marca o tempo de cada palavra

Sem a chave, o vídeo sai só com legenda e trilha, e o tempo das palavras é estimado.

## Passo a passo

### 1. Juntar o material

Pedir ao usuário, se faltar:

- **2 a 6 fotos** do produto (a primeira vira a capa)
- **nome do produto**
- **texto do anúncio** (título, descrição, especificações). Se vier só o link, tentar ler a página. Loja que carrega por JavaScript (Shopee, por exemplo) costuma não abrir: nesse caso, pedir para colar o texto. **Não escrever roteiro sem o texto do anúncio.**
- opcional: @ do perfil (vai no canto do vídeo), palavra para "Comenta PALAVRA", cores da marca

### 2. Montar a pasta do projeto

Fora da pasta da skill, por exemplo `./reels/<produto>/`:

```
reels/luminaria-sensor/
├── roteiro.json
└── fotos/
    ├── 1.jpg
    ├── 2.jpg
    └── 3.jpg
```

### 3. Escrever o `roteiro.json`

Estrutura fixa de 6 cenas, cerca de 25 s e no máximo ~65 palavras no total:

| Cena | `tipo` | O que diz | Foto |
|---|---|---|---|
| 1 | `dor` | O problema do dia a dia, em pergunta ou provocação. Sem citar o produto. | não |
| 2 | `achado` | "Achei…" e o que o produto resolve. | sim |
| 3–5 | `sinal` | Uma função concreta por cena. | sim |
| 6 | `chamada` | O que fazer agora ("Comenta LUZ que eu te mando o link."). | não |

```json
{
  "produto": "Luminária LED com sensor de presença",
  "fotos": ["fotos/1.jpg", "fotos/2.jpg", "fotos/3.jpg"],
  "marca": "@seuperfil",
  "palavraChave": "LUZ",
  "mascote": "lupa",
  "cores": { "fundo": "#0B0B0F", "destaque": "#FFD400", "primaria": "#1E35C9", "claro": "#F2F4FF" },
  "capa": { "titulo": "Nunca mais tropeça no escuro", "destaque": "escuro", "foto": 0 },
  "cenas": [
    { "tipo": "dor", "fala": "Levantou de madrugada e tropeçou no escuro de novo?", "destaques": ["escuro"] },
    { "tipo": "achado", "fala": "Achei a luz que resolve isso sem fio nenhum.", "foto": 0, "destaques": ["fio"] },
    { "tipo": "sinal", "fala": "Acende sozinha quando você passa.", "foto": 1, "destaques": ["sozinha"], "fonte": "Sensor de movimento PIR: acende ao detectar presença" },
    { "tipo": "sinal", "fala": "Cola com fita, sem furar parede.", "foto": 2, "destaques": ["furar"], "carimbo": "Sem furo", "fonte": "Instalação com fita adesiva 3M" },
    { "tipo": "sinal", "fala": "E recarrega no cabo USB.", "foto": 0, "destaques": ["USB."], "fonte": "Bateria recarregável via USB" },
    { "tipo": "chamada", "fala": "Comenta LUZ que eu te mando o link.", "destaques": ["LUZ"] }
  ]
}
```

Campos:

- `fotos`: caminhos relativos à pasta do projeto. Em cada cena, `foto` é o índice nessa lista.
- `destaques`: palavras da `fala` que ganham caixa colorida, pop e soco de câmera. Escrever igual à fala; a pontuação é ignorada na comparação. Uma ou duas por cena.
- `carimbo`: texto curto (até 2 palavras) que bate em cima da foto. Na cena `achado`, o padrão é "Achado!".
- `fonte`: trecho do anúncio que comprova o `sinal`. Os scripts ignoram esse campo; ele serve para conferir.
- Opcionais: `marca`, `palavraChave` (mostra o botão "Comenta PALAVRA" na última cena), `mascote` (`"lupa"` ou `"nenhum"`), `cores`, `capa`.

### Regras do roteiro

- **Só funções que estão no anúncio.** Todo `sinal` precisa de `fonte`. Se o anúncio não diz, não entra. Na dúvida, perguntar ao usuário.
- Sem preço, desconto ou "acabando": muda rápido e o vídeo fica mentindo.
- Sem "melhor do mundo", "revolucionário", "você não vai acreditar".
- Frases curtas, faladas, em português do Brasil. Uma ideia por cena.
- A cena `dor` não cita o produto. A cena `chamada` diz uma ação só.
- Mostrar o roteiro ao usuário antes de gerar a voz: a voz gasta crédito.

### 4. Gerar

```bash
<pasta-desta-skill>/scripts/gerar.sh reels/luminaria-sensor
```

Em ordem:

1. `voz.py`: uma narração por cena (`voz/01-dor.wav` …), normalizada em -16 LUFS e 1,1× mais rápida. Só refaz a cena que mudou. Sem chave, pula.
2. `timeline.py`: tempo de cada palavra (whisper, ou estimativa sem voz) → `timeline.json`.
3. `trilha.py`: batida com efeitos nos cortes, destaques e carimbos → `trilha.wav`.
4. Remotion: `out/video.mp4` e `out/capa.jpg`.

Variáveis opcionais: `ELEVENLABS_VOICE_ID` (padrão: Leo, português neutro), `ELEVENLABS_MODEL` (padrão `eleven_v3`), `VELOCIDADE_VOZ` (padrão `1.1`), `WHISPER_MODEL` (padrão `small`).

Se o ElevenLabs responder `voice_not_found`, adicione a voz Leo em My Voices na sua conta ou use outra em `ELEVENLABS_VOICE_ID`.

A primeira execução roda `npm install` na pasta da skill. O whisper leva cerca de 1 minuto em CPU.

### 5. Conferir antes de entregar

Tirar uma folha de quadros e olhar:

```bash
ffmpeg -loglevel error -y -i out/video.mp4 -vf "fps=1/3,scale=270:480,tile=5x2" -frames:v 1 out/folha.jpg
```

Conferir:

- legenda dentro da tela, sem palavra cortada
- foto certa em cada `sinal`
- carimbo legível
- última cena com a chamada

Se a voz errou alguma palavra, mudar a grafia na `fala` (por exemplo, "u-ésse-bê" no lugar de "USB") e rodar de novo.

### 6. Entregar

Passar ao usuário os caminhos de `out/video.mp4` e `out/capa.jpg` e uma legenda curta para o post: gancho, duas linhas sobre o produto e a chamada. Lembrar de marcar o conteúdo como gerado por IA quando a plataforma pedir, se houver voz sintética.

## Ajustes finos

- Ver e mexer ao vivo: `npm run studio` na pasta da skill, colando o `timeline.json` nas props da composição `Reel`.
- Layout das cenas: `remotion/cenas.tsx`. Componentes (legenda, carimbo, foto, lupa): `remotion/componentes.tsx`.
- Efeitos sonoros: `scripts/trilha.py`.
