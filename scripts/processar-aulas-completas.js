import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 1. Extrair tensões de aulas pendentes
async function extrairTensoesAulas() {
  const { data: aulas, error } = await supabase
    .from('aulas')
    .select('id, titulo')
    .neq('status', 'processado')  // ou .eq('status', 'pendente')
    .order('ordem', { ascending: true })

  if (error) throw error
  console.log(`📚 Aulas pendentes: ${aulas.length}`)

  for (const aula of aulas) {
    console.log(`\n🔄 Extraindo tensões da aula: ${aula.titulo} (${aula.id})`)
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
      if (!response.ok) throw new Error(result.error || 'Erro')
      console.log(`✅ Inseridas ${result.inserted} tensões`)
    } catch (err) {
      console.error(`❌ Falha: ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 1500))
  }
}

// 2. Gerar guias para todas as tensões que não têm guia
async function gerarGuiasParaTensoes() {
  // Buscar tensões de aula que não possuem guia associado
  const { data: tensoes, error } = await supabase
    .from('tensoes')
    .select(`
      id,
      tensao,
      aula_id,
      guias_profundas (id)
    `)
    .not('aula_id', 'is', null)
    .order('aula_id', { ascending: true })

  if (error) throw error

  const tensoesSemGuia = tensoes.filter(t => !t.guias_profundas || t.guias_profundas.length === 0)
  console.log(`\n📊 Total de tensões de aula: ${tensoes.length}`)
  console.log(`🎯 Tensões sem guia: ${tensoesSemGuia.length}`)

  for (const tensao of tensoesSemGuia) {
    console.log(`\n🔄 Gerando guia para: "${tensao.tensao.substring(0, 50)}..."`)
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/gerar-guia`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tensao_id: tensao.id,
          tensao_texto: tensao.tensao
        })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro')
      console.log(`✅ Guia gerado`)
    } catch (err) {
      console.error(`❌ Falha: ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 1000))
  }
}

async function main() {
  console.log('🚀 Iniciando processamento completo de aulas...\n')
  await extrairTensoesAulas()
  await gerarGuiasParaTensoes()
  console.log('\n🏁 Processamento finalizado!')
}

main().catch(console.error)