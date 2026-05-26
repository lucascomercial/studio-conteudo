// scripts/atualizar-titulos-transcricoes.js
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Extrai o ID do YouTube de qualquer formato (URL, ID puro, texto com "YouTube")
function extractYouTubeId(text) {
  if (!text) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^/?]+)/,
    /youtube\.com\/shorts\/([^/?]+)/,
    /^[a-zA-Z0-9_-]{11}$/,
    /(?:YouTube|youtube)\s+([a-zA-Z0-9_-]{11})/
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Busca o título real do vídeo usando oEmbed (gratuito, sem chave)
async function getYouTubeTitle(videoId) {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  const res = await fetch(oembedUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.title
}

async function atualizarTitulos() {
  // Busca todas as transcrições que têm video_url (assumindo que são do YouTube)
  const { data: transcricoes, error } = await supabase
    .from('transcricoes')
    .select('id, video_url, titulo, video_titulo')
    .not('video_url', 'is', null)

  if (error) throw error
  console.log(`📄 Encontradas ${transcricoes.length} transcrições com URL.`)

  let atualizados = 0
  let ignorados = 0

  for (const trans of transcricoes) {
    const videoId = extractYouTubeId(trans.video_url)
    if (!videoId) {
      console.log(`⚠️ Ignorando (não foi possível extrair ID do YouTube): ${trans.video_url}`)
      ignorados++
      continue
    }

    // Verifica se o título atual já parece válido (não é genérico "YouTube xxxx")
    const tituloAtual = trans.titulo || ''
    if (tituloAtual && !tituloAtual.toLowerCase().includes('youtube') && tituloAtual.length > 10) {
      console.log(`⏩ Título já parece correto: "${tituloAtual}"`)
      ignorados++
      continue
    }

    try {
      const tituloReal = await getYouTubeTitle(videoId)
      const { error: updateError } = await supabase
        .from('transcricoes')
        .update({
          titulo: tituloReal,
          video_titulo: tituloReal
        })
        .eq('id', trans.id)

      if (updateError) throw updateError
      console.log(`✅ Atualizado: "${tituloReal}"`)
      atualizados++
    } catch (err) {
      console.error(`❌ Erro no vídeo ${videoId}: ${err.message}`)
    }
    await new Promise(resolve => setTimeout(resolve, 300)) // pequena pausa
  }

  console.log(`\n🏁 Finalizado. Atualizados: ${atualizados}, Ignorados: ${ignorados}`)
}

atualizarTitulos()