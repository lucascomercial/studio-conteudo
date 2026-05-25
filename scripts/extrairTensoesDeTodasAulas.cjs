const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function callOpenAI(prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });
  const data = await response.json();
  console.log('🔍 Resposta da OpenAI (primeiros 200 chars):', data.choices[0].message.content.substring(0, 200));
  return data.choices[0].message.content;
}

async function extrairTensoesDaAula(aula) {
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
`;
  const resposta = await callOpenAI(prompt);
  try {
    return JSON.parse(resposta);
  } catch (e) {
    console.error('❌ Erro ao fazer parse do JSON. Resposta recebida:', resposta);
    throw new Error('Resposta não é JSON válido');
  }
}

async function processarTodasAulas() {
  const { data: aulas, error } = await supabase
    .from('aulas')
    .select('id, titulo, conteudo')
    .eq('status', 'pendente')
    .order('ordem');

  if (error) throw error;
  console.log(`📚 Processando ${aulas.length} aulas...`);

  for (const aula of aulas) {
    console.log(`🧠 Extraindo tensões da aula ${aula.id}: ${aula.titulo}`);
    try {
      const { conceitos, dores, erros } = await extrairTensoesDaAula(aula);
      const todos = [...(conceitos || []), ...(dores || []), ...(erros || [])];
      if (todos.length === 0) throw new Error('Nenhum conceito/dor/erro extraído');

      for (const texto of todos) {
        if (texto && texto.trim()) {
          await supabase.from('tensoes').insert({
            tensao: texto,
            aula_id: aula.id,
            fonte: 'aula',
            status: 'pendente',
            potencial_viral: 5
          });
        }
      }
      await supabase.from('aulas').update({ 
        status: 'conceitos_extraidos',
        processado_em: new Date().toISOString()
      }).eq('id', aula.id);
      console.log(`✅ Aula ${aula.id} concluída (${todos.length} itens).`);
    } catch (err) {
      console.error(`❌ Erro na aula ${aula.id}:`, err.message);
      await supabase.from('aulas').update({ status: 'erro' }).eq('id', aula.id);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('🎉 Processamento finalizado!');
}

processarTodasAulas().catch(console.error);