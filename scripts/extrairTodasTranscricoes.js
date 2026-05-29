extrairTodasTranscricoes// scripts/extrairTodasTranscricoes.js
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://krvrljlwzjmixniibjaw.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_o44TLlA8lHdrWH3taisjoA_sIDqCwB6'

const supabase = createClient(supabaseUrl, supabaseKey)

async function extrairTodasTranscricoes() {
  console.log('🔍 Buscando transcrições...\n')
  
  let todas = []
  let page = 0
  const pageSize = 100
  let hasMore = true

  while (hasMore) {
    const from = page * pageSize
    const to = from + pageSize - 1
    console.log(`📥 Buscando registros ${from} a ${to}...`)
    
    const { data, error } = await supabase
      .from('transcricoes')
      .select('id, titulo, video_titulo, video_url, tipo, conteudo_original, resumo, created_at')
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (error) {
      console.error('Erro:', error)
      break
    }
    if (!data || data.length === 0) break
    
    todas.push(...data)
    page++
    console.log(`   ✅ ${data.length} registros (total: ${todas.length})`)
  }
  
  console.log(`\n📊 TOTAL DE TRANSCRIÇÕES: ${todas.length}\n`)
  
  // Estatísticas
  let totalChars = 0
  for (const t of todas) {
    if (t.conteudo_original) totalChars += t.conteudo_original.length
  }
  console.log(`📏 Caracteres totais: ${totalChars.toLocaleString()}`)
  
  // Salvar JSON completo
  const jsonPath = path.join(__dirname, '../transcricoes_completas.json')
  fs.writeFileSync(jsonPath, JSON.stringify(todas, null, 2))
  console.log(`💾 JSON salvo: ${jsonPath}`)
  
  // Salvar apenas textos (para análise de estilo)
  const textos = todas
    .filter(t => t.conteudo_original)
    .map(t => `--- ${t.titulo || t.video_titulo || 'Vídeo'} ---\n${t.conteudo_original}`)
    .join('\n\n\n')
  const txtPath = path.join(__dirname, '../transcricoes_textos.txt')
  fs.writeFileSync(txtPath, textos)
  console.log(`📄 Textos combinados salvos: ${txtPath}`)
  
  return todas
}

extrairTodasTranscricoes().catch(console.error)