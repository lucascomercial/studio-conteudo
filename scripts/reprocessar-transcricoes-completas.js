import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Extrai ID do YouTube de qualquer string (URL ou ID puro)
function extractYouTubeId(text) {
  if (!text) return null
  // Padrões de URL do YouTube
  const urlPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^/?]+)/,
    /youtube\.com\/shorts\/([^/?]+)/
  ]
  for (const pattern of urlPatterns) {
    const match = text.match(pattern)
    if (match) return match[1]
  }
  // Se for exatamente o ID (11 caracteres alfanuméricos + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text
  // Se contiver "YouTube" seguido do ID (ex: "YouTube IjCNNiPbkYg")
  const matchWord = text.match(/(?:YouTube|youtube)\s+([a-zA-Z0-9_-]{11})/)
  if (matchWord) return matchWord[1]
  return null
}

function isInstagramUrl(url) {
  return /instagram\.com/.test(url)
}

function isTikTokUrl(url) {
  return /tiktok\.com/.test(url)
}

async function reprocessarTranscricoes() {
  // Buscar todas as transcrições que têm video_url
  const { data: transcricoes, error } = await supabase
    .from('transcricoes')
    .select('id, titulo, video_url, video_titulo')
    .not('video_url', 'is', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  console.log(`🎥 Encontradas ${transcricoes.length} transcrições com URL.`)

  for (const trans of transcricoes) {
    console.log(`\n🔄 Processando: ${trans.video_titulo || trans.titulo || trans.id}`)
    let originalUrl = trans.video_url
    let correctedUrl = null
    let platform = null

    // Tenta corrigir URL se for YouTube
    const videoId = extractYouTubeId(originalUrl)
    if (videoId) {
      correctedUrl = `https://www.youtube.com/watch?v=${videoId}`
      platform = 'youtube'
      console.log(`   📹 URL corrigida: ${correctedUrl}`)
    } else if (isInstagramUrl(originalUrl)) {
      correctedUrl = originalUrl
      platform = 'instagram'
    } else if (isTikTokUrl(originalUrl)) {
      correctedUrl = originalUrl
      platform = 'tiktok'
    } else {
      console.error(`❌ Não foi possível extrair ID de plataforma da URL: "${originalUrl}". Pulando.`)
      continue
    }

    // Atualiza a URL no banco se mudou
    if (correctedUrl && correctedUrl !== originalUrl) {
      const { error: updateUrlError } = await supabase
        .from('transcricoes')
        .update({ video_url: correctedUrl })
        .eq('id', trans.id)
      if (updateUrlError) {
        console.warn(`   ⚠️ Não foi possível atualizar URL: ${updateUrlError.message}`)
      } else {
        console.log(`   ✅ URL atualizada no banco`)
      }
    } else if (!correctedUrl) {
      correctedUrl = originalUrl
    }

    try {
      // Chamar a Edge Function para obter a transcrição completa
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/video-transcript`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: correctedUrl })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro na Edge Function')
      const textoCompleto = data.text
      const tituloVideo = data.title || trans.video_titulo || trans.titulo

      // Atualizar a transcrição com o texto completo e título
      const { error: updateError } = await supabase
        .from('transcricoes')
        .update({
          conteudo_original: textoCompleto,
          video_titulo: tituloVideo,
          titulo: tituloVideo
        })
        .eq('id', trans.id)
      if (updateError) throw updateError
      console.log(`   ✅ Transcrição atualizada (${textoCompleto.length} caracteres)`)

    } catch (err) {
      console.error(`   ❌ Falha: ${err.message}`)
    }
    // Pequena pausa para não sobrecarregar
    await new Promise(r => setTimeout(r, 1500))
  }
  console.log('\n🏁 Processamento finalizado.')
}

reprocessarTranscricoes()