const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function importarAulas() {
  const aulas = JSON.parse(fs.readFileSync('aulas_extraidas.json', 'utf-8'));
  console.log(`📥 Importando ${aulas.length} aulas...`);
  
  for (const aula of aulas) {
    const { data, error } = await supabase
      .from('aulas')
      .insert({
        titulo: `Aula ${aula.numero} - ${aula.titulo}`,
        conteudo: aula.conteudo,
        status: 'pendente',
        ordem: parseInt(aula.numero)
      })
      .select();
    
    if (error) {
      console.error(`❌ Erro na aula ${aula.numero}:`, error.message);
    } else {
      console.log(`✅ Aula ${aula.numero} importada (ID: ${data[0].id})`);
    }
  }
}

importarAulas().catch(console.error);
