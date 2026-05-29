// scripts/extrair_instagram.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://krvrljlwzjmixniibjaw.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_o44TLlA8lHdrWH3taisjoA_sIDqCwB6'
const edgeFunctionUrl = `${supabaseUrl}/functions/v1/openai-proxy`

async function callOpenAI(prompt) {
  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      prompt: prompt,
      model: 'gpt-4o',
      max_tokens: 2000,
    }),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Edge function error: ${err}`)
  }
  const data = await response.json()
  return data.content
}

async function extrairInstagram() {
  console.log('📥 Lendo arquivo CSV...')
  const csvPath = path.join(__dirname, '../transcricoes_instagram.csv')
  if (!fs.existsSync(csvPath)) {
    console.error(`Arquivo não encontrado: ${csvPath}`)
    console.log('Certifique-se de que o CSV está na raiz do projeto com esse nome.')
    return
  }
  // Ler com tratamento de BOM (UTF-8 com BOM)
  let csvContent = fs.readFileSync(csvPath, 'utf-8')
  if (csvContent.charCodeAt(0) === 0xFEFF) {
    csvContent = csvContent.slice(1)
  }
  const records = parse(csvContent, { columns: true, skip_empty_lines: true })
  console.log(`✅ ${records.length} registros encontrados.`)

  // Extrair texto da coluna 'transcript' (ou 'caption' como fallback)
  const textos = records
    .map(r => {
      let text = r.transcript || r.caption || ''
      if (text && typeof text === 'string') {
        // Remove quebras de linha excessivas e espaços
        text = text.replace(/\s+/g, ' ').trim()
        return text
      }
      return ''
    })
    .filter(t => t && t.length > 30)
    .slice(0, 20) // pega até 20

  console.log(`📝 Extraídos ${textos.length} textos com tamanho médio de ${Math.round(textos.reduce((a,b) => a + b.length, 0) / (textos.length || 1))} caracteres.`)

  if (textos.length === 0) {
    console.error('Nenhum texto encontrado nas colunas "transcript" ou "caption".')
    console.log('Colunas disponíveis (primeiras 10):', Object.keys(records[0] || {}).slice(0, 10))
    return
  }

  const amostra = textos.join('\n\n---\n\n')

  console.log('🧠 Analisando estilo com IA (usando transcrições completas)...')
  const prompt = `
Você é um especialista em oratória e análise de discurso para conteúdo de mercado imobiliário.

Abaixo estão 20 transcrições completas de Reels do Instagram (áudio transcrito). 
Analise o ESTILO DE ORATÓRIA do influenciador: como ele fala, os recursos que usa, a construção das frases, o tom, os ganchos, os conectivos, o vocabulário característico e como ele finaliza os vídeos.

TRANSCRIÇÕES:
${amostra.substring(0, 60000)}

Retorne APENAS JSON com este formato EXATO:

{
  "estilo_geral": "descrição resumida do estilo (ex: direto, provocativo, mentor, educador, etc.)",
  "abertura_tipica": "como ele começa os vídeos (ex: pergunta retórica, afirmação forte, história curta, dados)",
  "estrutura_frases": "curtas|médias|longas - e descreva o ritmo (rápido, pausado, etc.)",
  "vocabulario": ["palavra1", "palavra2", "palavra3", "palavra4", "palavra5"],
  "conectivos": ["conectivo1", "conectivo2", "conectivo3"],
  "ganchos_tipicos": ["gancho1", "gancho2", "gancho3"],
  "re_hooks": ["re-hook1", "re-hook2"],
  "cta_tipico": "como ele finaliza os vídeos (ex: pergunta provocativa, desafio, pedido de comentário)",
  "tom": "confrontador|educador|mentor|provocador|analítico|inspirador",
  "intensidade": "leve|medio|forte|polarizador"
}
`
  const resposta = await callOpenAI(prompt)
  const cleaned = resposta.replace(/```json/g, '').replace(/```/g, '').trim()
  const perfil = JSON.parse(cleaned)

  console.log('\n✅ PERFIL DE ESTILO GERADO:\n')
  console.log(JSON.stringify(perfil, null, 2))

  const perfilPath = path.join(__dirname, '../perfil_estilo_instagram.json')
  fs.writeFileSync(perfilPath, JSON.stringify(perfil, null, 2))
  console.log(`\n💾 Perfil salvo em: ${perfilPath}`)

  console.log('\n🔧 Agora substitua a constante ESTILO_ORATORIA na edge function gerar-guia pelo conteúdo deste arquivo e faça deploy:')
  console.log('supabase functions deploy gerar-guia --no-verify-jwt')
}

extrairInstagram().catch(console.error)