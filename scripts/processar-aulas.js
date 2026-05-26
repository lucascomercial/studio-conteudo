import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function processarTodasAulas() {
  // Busca aulas que ainda não foram processadas (status pendente)
  const { data: aulas, error } = await supabase
    .from('aulas')
    .select('id, titulo')
    .eq('status', 'pendente')
    .order('ordem', { ascending: true })

  if (error) throw error
  console.log(`📚 Encontradas ${aulas.length} aulas pendentes.`)

  for (const aula of aulas) {
    console.log(`\n🔄 Processando aula: ${aula.titulo} (${aula.id})`)
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/extrair-tensoes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ aula_id: aula.id })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro na Edge Function')
      console.log(`✅ Sucesso: ${result.inserted} tensões inseridas`)
    } catch (err) {
      console.error(`❌ Erro: ${err.message}`)
    }
    // Aguarda 1 segundo entre chamadas para não sobrecarregar
    await new Promise(r => setTimeout(r, 1000))
  }
  console.log('\n🏁 Processamento finalizado.')
}

processarTodasAulas()