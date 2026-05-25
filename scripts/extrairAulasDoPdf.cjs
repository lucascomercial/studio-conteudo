const fs = require('fs');
const pdf = require('pdf-parse');

async function extrairAulasDoPdf(caminhoPdf) {
  console.log('📄 Lendo PDF...');
  const dataBuffer = fs.readFileSync(caminhoPdf);
  const data = await pdf(dataBuffer);
  const textoCompleto = data.text;
  
  // Padrão para identificar "AULA XX" (ajuste conforme necessário)
  const regexAula = /(AULA|Aula)\s+(\d+)[\s–-]+([^\n]+)/gi;
  const linhas = textoCompleto.split('\n');
  
  const aulas = [];
  let aulaAtual = null;
  let conteudoAtual = [];
  
  for (const linha of linhas) {
    const match = linha.match(regexAula);
    if (match) {
      if (aulaAtual) {
        aulas.push({
          numero: aulaAtual.numero,
          titulo: aulaAtual.titulo,
          conteudo: conteudoAtual.join('\n').trim()
        });
      }
      const partes = linha.match(/(AULA|Aula)\s+(\d+)[\s–-]+(.+)/i);
      if (partes) {
        aulaAtual = {
          numero: partes[2],
          titulo: partes[3].trim()
        };
      }
      conteudoAtual = [];
    } else if (aulaAtual) {
      conteudoAtual.push(linha);
    }
  }
  
  if (aulaAtual) {
    aulas.push({
      numero: aulaAtual.numero,
      titulo: aulaAtual.titulo,
      conteudo: conteudoAtual.join('\n').trim()
    });
  }
  
  console.log(`📚 Total de aulas extraídas: ${aulas.length}`);
  return aulas;
}

async function main() {
  const caminho = process.argv[2];
  if (!caminho) {
    console.error('Uso: node extrairAulasDoPdf.cjs <caminho_do_pdf>');
    process.exit(1);
  }
  const aulas = await extrairAulasDoPdf(caminho);
  fs.writeFileSync('aulas_extraidas.json', JSON.stringify(aulas, null, 2));
  console.log('✅ Arquivo aulas_extraidas.json salvo');
}

main().catch(console.error);
