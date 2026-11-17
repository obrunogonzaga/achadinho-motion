---
name: achadinho-motion
description: Transforma de 2 a 6 fotos de um achadinho (produto de afiliado Shopee, Amazon, Mercado Livre etc.) em um Reel vertical animado de ~30 s, com legenda palavra por palavra, produto recortado, carimbos, trilha, voz opcional e capa JPEG. Usar quando pedirem "faz um vídeo desse achadinho", "transforma essas fotos em Reel", "vídeo pro TikTok desse produto", "motion do produto", ou mandarem fotos de produto com o texto ou o link do anúncio.
---

# achadinho-motion

Todo Reel é uma **ficha** (`roteiro.json`) numa pasta de projeto, fora da pasta da skill. A ficha não tem segundos: cada cena traz a fala, a foto e os destaques, que são palavras da própria fala entre colchetes. A voz é gerada de uma vez para o roteiro inteiro, e os tempos saem dela.

```
reels/luminaria-sensor/
├── roteiro.json
└── fotos/
    ├── 1.jpg
    ├── 2.jpg
    └── 3.jpg
```

As etapas rodam com `node <pasta-desta-skill>/scripts/reel.mjs <pasta-do-projeto> <etapa>`. Nos exemplos abaixo, `reel` é esse comando.

## Fluxo

As paradas marcadas com ⏸ esperam a aprovação do usuário. Não pule nenhuma.

1. **Material.** Pedir o que faltar:
   - **2 a 6 fotos** do produto;
   - **nome do produto**;
   - **texto do anúncio** (título, descrição, especificações). Se vier só o link, tentar ler a página. Loja que carrega por JavaScript, como a Shopee, costuma não abrir: nesse caso, pedir para colar o texto. **Não escrever roteiro sem o texto do anúncio.**
   - opcionais: @ do perfil, palavra para "Comenta PALAVRA", cores da marca.
2. **Ficha.** `reel <pasta> novo`, copiar as fotos para `fotos/` e preencher o `roteiro.json` (regras abaixo).
3. ⏸ **Roteiro.** Rodar `reel <pasta> preparar` (escreve a narração e recorta as fotos marcadas) e mostrar:
   - a tabela que a etapa imprime (cena, fala, foto, fonte);
   - o trecho do anúncio que comprova cada `sinal`;
   - o custo da voz (0 num TTS local; no ElevenLabs, 1 caractere ≈ 1 crédito).

   Abrir os recortes (`fotos/*-recorte.png`). Se um sair ruim, tirar o `recorte: true` e usar a foto inteira. Só seguir para a voz com "aprovado".
4. **Finalizar.** `reel <pasta> finalizar` gera a voz (se faltar), monta o áudio com as pausas, confere os tempos, gera a trilha, renderiza e checa. Ler a folha `out/folha.png` e conferir:
   - legenda inteira na tela, sem palavra cortada;
   - foto certa em cada `sinal`;
   - carimbo legível;
   - última cena com a chamada.

   Corrigir na ficha e rodar `reel <pasta> render` e `reel <pasta> checagem` de novo. Ajuste visual (foto, carimbo, cor, destaque) nunca pede voz nova. Mudar a fala pede.
5. ⏸ **Entrega.** Abrir `out/video.mp4` e informar:
   - a duração;
   - o custo da voz;
   - os avisos da checagem;
   - uma legenda curta para o post: gancho, duas linhas sobre o produto e a chamada.

## Regras da ficha

```json
{
  "produto": "Luminária LED com sensor de presença",
  "anuncio": "https://…",
  "marca": "@seuperfil",
  "palavraChave": "LUZ",
  "mascote": "lupa",
  "cores": { "fundo": "#0B0B0F", "destaque": "#FFD400", "primaria": "#1E35C9", "claro": "#F2F4FF" },
  "fotos": [{ "arquivo": "1.jpg", "recorte": true }, { "arquivo": "2.jpg" }, { "arquivo": "3.jpg" }],
  "capa": { "titulo": "Nunca mais tropeça no [escuro]", "foto": "1-recorte.png" },
  "cenas": [
    { "tipo": "dor", "fala": "Levantou de madrugada e tropeçou no [escuro] de novo?" },
    { "tipo": "achado", "fala": "Achei a luz que resolve isso [sem fio] nenhum.", "foto": "1-recorte.png" },
    { "tipo": "sinal", "fala": "Acende [sozinha] quando você passa.", "foto": "2.jpg", "fonte": "Sensor PIR: acende ao detectar movimento" },
    { "tipo": "sinal", "fala": "Cola com fita, sem [furar] parede.", "foto": "3.jpg", "carimbo": "Sem furo", "fonte": "Instalação com fita adesiva 3M" },
    { "tipo": "sinal", "fala": "E recarrega no cabo [USB].", "foto": "1.jpg", "fonte": "Bateria recarregável via USB" },
    { "tipo": "chamada", "fala": "Comenta [LUZ] que eu te mando o link." }
  ]
}
```

- **Estrutura fixa:** 6 cenas, nesta ordem: `dor`, `achado`, 3 × `sinal`, `chamada`.
- **Duração:** 22 a 40 s, mirando ~30 s. No máximo ~65 palavras no total. Cada cena fica pelo menos 3,5 s na tela, com pausa de quase 1 s depois da fala, então frase curta é melhor que texto corrido.
- **Destaque:** 1 ou 2 por cena, entre colchetes na fala: `"sem [furar] parede"`. Várias palavras seguidas viram uma caixa só: `"[sem fio]"`. Os colchetes saem antes da voz.
- **Fotos:** `fotos[]` lista os arquivos de `fotos/`. Com `recorte: true`, a etapa `recorte` cria `<nome>-recorte.png` sem fundo (macOS). Nas cenas, `foto` é o nome do arquivo: o recorte flutua com sombra, e a foto inteira vira um card.
- **Só o que está no anúncio.** Todo `sinal` leva `fonte` com o trecho do anúncio. Se o anúncio não diz, não entra. Na dúvida, perguntar.
- **Proibido:** preço, desconto, cupom, frete grátis, "acabando". Muda rápido e o vídeo fica mentindo. A checagem acusa.
- **Proibido:** imagem gerada do produto. Só fotos do anúncio ou do usuário.
- **Tom:** frases curtas e faladas, em português do Brasil. Uma ideia por cena. Sem "melhor do mundo", "revolucionário" ou "você não vai acreditar".
- **`dor`** não cita o produto. **`chamada`** pede uma ação só e fala a `palavraChave`, se houver.
- `carimbo`: até 2 palavras, batendo na foto no primeiro destaque. Na cena `achado`, o padrão é "Achado!".
- `emocao` (opcional): tag de emoção do ElevenLabs v3, como `excited`. Ignorada por outros TTS.

## Voz

| Provedor | Como ligar | Custo |
|---|---|---|
| `comando` | `VOZ_COMANDO` com qualquer TTS de linha de comando | o do seu TTS |
| `elevenlabs` | `ELEVENLABS_API_KEY` | 1 caractere ≈ 1 crédito |
| `nenhuma` | sem nada configurado | 0, só legenda e trilha |

Com os dois configurados, vale o `VOZ_COMANDO`. Para forçar um provedor: `--voz elevenlabs`.

- `VOZ_COMANDO` aceita `{texto}` ou `{arquivo}` (o texto num arquivo), `{saida}` (o mp3) e, se o TTS devolver o tempo das palavras, `{palavras}` no formato `{"words":[{"text","start","end"}]}`. Exemplo: `VOZ_COMANDO='meutts say -f {arquivo} -o {saida} -w {palavras}'`.
- Sem `{palavras}`, o tempo de cada palavra sai do whisper (`pip install openai-whisper`; cerca de 1 min em CPU).
- No ElevenLabs, os tempos vêm na própria resposta. Variáveis: `ELEVENLABS_VOICE_ID` (padrão: Leo, português neutro), `ELEVENLABS_MODEL` (padrão `eleven_v3`). Se responder `voice_not_found`, adicione a voz em My Voices ou troque o `ELEVENLABS_VOICE_ID`. Nunca repita uma chamada que falhou sem olhar o erro: cada chamada cobra.
- A voz só é refeita quando a fala muda. `reel <pasta> voz` força.
- A etapa `audio` insere as pausas entre as cenas e, se passar de 40 s, acelera até 1,12×. Acima disso, corte texto. `--tempo 1.05` fixa a velocidade.

## Etapas

| Etapa | O que faz |
|---|---|
| `novo` | Cria `roteiro.json` de modelo e `fotos/` |
| `roteiro` | Escreve `voz/narracao.txt` e imprime a tabela |
| `recorte` | Gera `fotos/<nome>-recorte.png` das fotos com `recorte: true` |
| `voz` | Gera a voz de novo (`voz/original.mp3` e os tempos) |
| `audio` | Gera a voz se faltar, monta `voz/voz.mp3` com as pausas e escreve `timeline.json` |
| `tempos` | Mostra quanto dura cada cena e avisa cena curta, longa ou sem destaque |
| `trilha` | Gera `trilha.wav` (batida e efeitos nos cortes, destaques e carimbos) |
| `render` | Gera `out/video.mp4` (1080×1920, H.264) e `out/capa.jpg` |
| `checagem` | Fotos, fonte dos sinais, preço na fala, duração e folha de quadros |

Combos: `preparar` (roteiro → recorte) e `finalizar` (audio → trilha → render → checagem).

## Erros comuns

| Mensagem | O que fazer |
|---|---|
| `não achei "…" no áudio` | A fala mudou depois da voz, ou o TTS leu diferente. Rode `voz` de novo |
| `cena … usa "x", que não está em fotos[]` | Registre o arquivo em `fotos[]` ou corrija o nome |
| `faltando em fotos/: …-recorte.png` | Rode a etapa `recorte` |
| `Mesmo em 1.12× o vídeo passa de 40 s` | Corte texto da ficha |
| `⚠ curta` em `tempos` | Normal em cena de 1 frase; só mude se a cena parecer corrida no vídeo |

## Ajustes finos

- Ver ao vivo: `npm run studio` na pasta da skill, colando o `timeline.json` nas props da composição `Reel`.
- Uma cena ou componente novo entra em `remotion/` (`cenas.tsx`, `componentes.tsx`), nunca na ficha.
- Ritmo (pausa, mínimo por cena, duração alvo): `remotion/engine/ritmo.ts`.
- Efeitos sonoros: `scripts/trilha.py`.
