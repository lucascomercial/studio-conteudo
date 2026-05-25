import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { aula_id } = await req.json()
    if (!aula_id) throw new Error('Missing aula_id')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    // Buscar aula
    const { data: aula, error } = await supabaseAdmin
      .from('aulas')
      .select('id, titulo, conteudo')
      .eq('id', aula_id)
      .single()
    if (error) throw error

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) throw new Error('OPENAI_API_KEY not set')

    const prompt = `
Extraia do conteúdo abaixo os CONCEITOS CENTRAIS (máx 5), DORES REAIS (máx 5) e ERROS NORMALIZADOS (máx 5).

Formato JSON:
{
  "conceitos": ["conceito 1", "conceito 2"],
  "dores": ["dor 1", "dor 2"],
  "erros": ["erro 1", "erro 2"]
}

Conteúdo da aula:
${aula.conteudo.substring(0, 8000)}
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)

    const allItems = [...result.conceitos, ...result.dores, ...result.erros]
    for (const texto of allItems) {
      await supabaseAdmin.from('tensoes').insert({
        tensao: texto,
        aula_id: aula.id,
        fonte: 'aula',
        status: 'pendente',
        potencial_viral: 5
      })
    }

    await supabaseAdmin
      .from('aulas')
      .update({ status: 'conceitos_extraidos', processado_em: new Date().toISOString() })
      .eq('id', aula.id)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    })
  }
})
