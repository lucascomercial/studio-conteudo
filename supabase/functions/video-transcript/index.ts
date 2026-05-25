// supabase/functions/video-transcript/index.ts
// Suporta: YouTube, Instagram, TikTok
// Deploy: supabase functions deploy video-transcript

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Detecta plataforma pela URL ────────────────────────────────────────────
function detectPlatform(url: string): 'youtube' | 'instagram' | 'tiktok' | null {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/instagram\.com/.test(url))         return 'instagram'
  if (/tiktok\.com/.test(url))            return 'tiktok'
  return null
}

// ─── Extrai ID do YouTube ────────────────────────────────────────────────────
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// ─── YouTube: busca transcrição via InnerTube API ────────────────────────────
async function getYouTubeTranscript(videoId: string): Promise<{ text: string; title: string }> {
  // 1. Busca a página do vídeo para pegar os dados iniciais
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    }
  })
  const html = await pageRes.text()

  // Extrai título
  const titleMatch = html.match(/<title>(.+?) - YouTube<\/title>/)
  const title = titleMatch ? titleMatch[1] : 'Sem título'

  // Extrai ytInitialPlayerResponse
  const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:var |<\/script>)/)
  if (!playerMatch) throw new Error('Não foi possível extrair dados do vídeo')

  const playerData = JSON.parse(playerMatch[1])
  const captions = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks

  if (!captions || captions.length === 0) {
    throw new Error('Este vídeo não tem legendas/transcrição disponível')
  }

  // Prefere pt-BR, depois pt, depois qualquer automática
  const track = captions.find((c: any) => c.languageCode === 'pt-BR')
    || captions.find((c: any) => c.languageCode === 'pt')
    || captions.find((c: any) => c.kind === 'asr')
    || captions[0]

  // 2. Baixa o XML da transcrição
  const transcriptRes = await fetch(track.baseUrl + '&fmt=json3')
  const transcriptData = await transcriptRes.json()

  // 3. Converte para texto limpo
  const text = transcriptData.events
    ?.filter((e: any) => e.segs)
    .map((e: any) => e.segs.map((s: any) => s.utf8).join(''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!text) throw new Error('Transcrição vazia')

  return { text, title }
}

// ─── Instagram / TikTok: via Apify ──────────────────────────────────────────
async function getApifyTranscript(url: string, platform: 'instagram' | 'tiktok'): Promise<{ text: string; title: string }> {
  const APIFY_TOKEN = Deno.env.get('APIFY_API_TOKEN')
  if (!APIFY_TOKEN) throw new Error('APIFY_API_TOKEN não configurado')

  // Actor IDs do Apify (estáveis e bem avaliados)
  const actorId = platform === 'instagram'
    ? 'bulletproof~instagram-transcript-extractor'
    : 'agentx~tiktok-transcript'

  // Inicia o run
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=60`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }
  )

  if (!runRes.ok) {
    const err = await runRes.text()
    throw new Error(`Apify error: ${err}`)
  }

  const results = await runRes.json()
  if (!results || results.length === 0) throw new Error('Nenhum resultado retornado pelo Apify')

  const item = results[0]

  // Normaliza o resultado (diferentes actors retornam campos diferentes)
  const text = item.transcript || item.text || item.plainText
    || item.segments?.map((s: any) => s.text).join(' ')
    || ''

  const title = item.title || item.description?.slice(0, 80) || `${platform} vídeo`

  if (!text) throw new Error('Transcrição não disponível para este vídeo')

  return { text, title }
}

// ─── Handler principal ───────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { url } = await req.json()
    if (!url) throw new Error('URL não fornecida')

    const platform = detectPlatform(url)
    if (!platform) throw new Error('Plataforma não suportada. Use YouTube, Instagram ou TikTok.')

    let result: { text: string; title: string }

    if (platform === 'youtube') {
      const videoId = extractYouTubeId(url)
      if (!videoId) throw new Error('ID do vídeo YouTube inválido')
      result = await getYouTubeTranscript(videoId)
    } else {
      result = await getApifyTranscript(url, platform)
    }

    return new Response(
      JSON.stringify({ platform, ...result }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
