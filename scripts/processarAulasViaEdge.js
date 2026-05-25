import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const EDGE_FUNCTION_URL = 'https://krvrljlwzjmixniibjaw.supabase.co/functions/v1/extrair-tensoes'

async function processarTodasAulas() {
  // Buscar aulas que ainda NÃO foram processadas (status diferente de 'processado')
  // Ou se preferir processar todas independente do status, remova o filtro.
  const { data: aulas, error } = await supabase
    .from('aulas')
    .select('id, titulo, status')
    .neq('status', 'processado')   // processa apenas pendentes/erro
    .order('id')

  if (error) throw error
  if (!aulas || aulas.length === 0) {
    console.log('✅ Todas as aulas já foram processadas!')
    return
  }

  console.log(`📚 Processando ${aulas.length} aulas via Edge Function...\n`)

  for (const aula of aulas) {
    console.log(`🔄 [${aula.id}] ${aula.titulo}`)
    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ aula_id: aula.id })
      })

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }

      console.log(`   ✅ ${result.inserted} tensões extraídas`)
    } catch (err) {
      console.error(`   ❌ Erro: ${err.message}`)
      // Marcar aula com erro (opcional)
      await supabase.from('aulas').update({ status: 'erro' }).eq('id', aula.id)
    }
    // Pequena pausa para não sobrecarregar a Edge Function
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log('\n🎉 Processamento finalizado!')
}

processarTodasAulas().catch(console.error)