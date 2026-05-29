// scripts/analisar_estilo.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuração do Supabase (mesma do frontend)
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

async function analisarEstilo() {
  console.log('📖 Lendo transcrições...')
  const textosPath = path.join(__dirname, '../transcricoes_textos.txt')
  const textos = fs.readFileSync(textosPath, 'utf-8')
  
  // Pega os primeiros 60.000 caracteres (suficiente para capturar o estilo)
  const amostra = textos.substring(0, 60000)
  
  console.log('🧠 Enviando para OpenAI (via Edge Function) para análise de estilo...')
  
  const prompt = `
Você é um especialista em oratória e análise de discurso.

Analise as transcrições abaixo e extraia o ESTILO DE ORATÓRIA do autor.

TRANSCRIÇÕES:
${amostra}

Retorne APENAS JSON com este formato EXATO (sem texto antes ou depois):

{
  "estilo_geral": "descrição do estilo em uma frase",
  "abertura_tipica": "como ele começa os vídeos (ex: pergunta retórica, afirmação forte, história curta)",
  "estrutura_frases": "curtas|médias|longas - e descreva o ritmo",
  "vocabulario": ["palavra1", "palavra2", "palavra3", "palavra4", "palavra5"],
  "conectivos": ["conectivo1", "conectivo2", "conectivo3"],
  "ganchos_tipicos": ["gancho1", "gancho2", "gancho3"],
  "re_hooks": ["re-hook1", "re-hook2"],
  "cta_tipico": "como ele finaliza os vídeos (ex: pergunta provocativa, desafio)",
  "tom": "confrontador|educador|mentor|provocador|analítico",
  "intensidade": "leve|medio|forte|polarizador"
}
`
  
  let estilo
  try {
    const resposta = await callOpenAI(prompt)
    // Limpar possível marcação JSON
    const cleaned = resposta.replace(/```json/g, '').replace(/```/g, '').trim()
    estilo = JSON.parse(cleaned)
  } catch (err) {
    console.error('❌ Erro ao analisar estilo:', err)
    return
  }
  
  console.log('\n✅ PERFIL DE ESTILO GERADO:\n')
  console.log(JSON.stringify(estilo, null, 2))
  
  // Salvar perfil
  const perfilPath = path.join(__dirname, '../perfil_estilo.json')
  fs.writeFileSync(perfilPath, JSON.stringify(estilo, null, 2))
  console.log(`\n💾 Perfil salvo em: ${perfilPath}`)
  
  // Exibir instruções para atualizar a Edge Function
  console.log('\n🔧 INSTRUÇÕES PARA ATUALIZAR A EDGE FUNCTION:')
  console.log('1. Abra supabase/functions/gerar-guia/index.ts')
  console.log('2. Substitua a constante ESTILO_ORATORIA pelo JSON acima')
  console.log('3. Faça o deploy: supabase functions deploy gerar-guia --no-verify-jwt')
}

analisarEstilo().catch(console.error)