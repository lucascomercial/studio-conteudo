import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function processarTodasTranscricoes() {
  // Busca todas as transcrições que possuem texto original e que ainda não foram processadas (ou todas)
  const { data: transcricoes, error } = await supabase
    .from('transcricoes')
    .select('id, titulo, conteudo_original')
    .not('conteudo_original', 'is', null)
    // Opcional: filtrar apenas as que ainda não têm tensões ou status pendente
    // .eq('status', 'pendente')
    .order('created_at', { ascending: true })

  if (error) throw error
  console.log(`📄 Encontradas ${transcricoes.length} transcrições com texto completo.`)

  for (const trans of transcricoes) {
    console.log(`\n🔄 Processando: ${trans.titulo || trans.id}`)
    try {
      // Chamar a Edge Function extrair-tensoes passando o transcricao_id
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/extrair-tensoes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcricao_id: trans.id })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro na Edge Function')

      console.log(`   ✅ Extraídas ${result.inserted} tensões. Resumo: ${result.resumo?.substring(0, 60) || 'sem resumo'}...`)
    } catch (err) {
      console.error(`   ❌ Erro: ${err.message}`)
    }
    // Pequena pausa para não sobrecarregar a Edge Function
    await new Promise(r => setTimeout(r, 1000))
  }
  console.log('\n🏁 Processamento finalizado.')
}

processarTodasTranscricoes()