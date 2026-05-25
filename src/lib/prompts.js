// src/lib/prompts.js
const CONTEXTO_BASE = `Você é Lucas Augusto. Gestor de corretores em Brasília.
Grava reels de 90 a 120 segundos para Instagram.
Fala como alguém que vive o mercado — não como quem escreve sobre ele.`

// ─── Chunking ─────────────────────────────────────────────────────────────────
const CHUNK_SIZE    = 25000
const CHUNK_OVERLAP = 1500
const MAX_CHUNKS    = 8

export function chunkTranscript(texto) {
  if (texto.length <= CHUNK_SIZE) return [texto]
  const chunks = []
  let start = 0
  while (start < texto.length && chunks.length < MAX_CHUNKS) {
    let end = start + CHUNK_SIZE
    if (end < texto.length) {
      const bp = texto.lastIndexOf('\n\n', end)
      if (bp > start + CHUNK_SIZE * 0.7) { end = bp }
      else {
        const sp = texto.lastIndexOf('. ', end)
        if (sp > start + CHUNK_SIZE * 0.7) end = sp + 1
      }
    }
    chunks.push(texto.slice(start, end).trim())
    start = end - CHUNK_OVERLAP
  }
  return chunks
}

export const prompts = {
  // ───────────────────────────────────────────────────────────────────────────
  // EXTRAÇÃO DE TENSÕES DE VÍDEOS (modelo barato - gpt-4o-mini)
  // ───────────────────────────────────────────────────────────────────────────
  extrairTensoes: (texto, tituloVideo = '') => `
Você é um estrategista editorial e psicólogo de comportamento de mercado.

⚠️ NÃO faça resumo do assunto. NÃO liste lições genéricas. NÃO use abstrações vazias.

Seu trabalho é extrair TENSÕES HUMANAS REAIS do vídeo: "${tituloVideo}"

Uma TENSÃO é um conflito comportamental com:
- ações concretas que a pessoa faz (ou deixa de fazer)
- cenas reais que qualquer um reconheceria
- um erro invisível que a pessoa comete sem perceber
- uma consequência silenciosa (social, emocional, de reputação)
- um contraste claro entre o comportamento comum e o ideal

TRANSCRIÇÃO:
${texto.substring(0, 25000)}

Para CADA tensão identificada, retorne APENAS JSON com a estrutura abaixo. TODOS os campos são obrigatórios.

{
  "resumo": "resumo geral do vídeo em 1 frase",

  "tensoes": [
    {
      "tensao": "Frase viva que descreve o comportamento problemático (ex: 'corretor que fala com tanta gente que não cria conexão com ninguém')",

      "publico_sugerido": "corretor|proprietario|comprador|investidor",

      "emocao": "medo|vergonha|frustracao|ansiedade|ego|prejuizo|urgencia",

      "gatilhos": ["ego", "dinheiro", "tempo", "frustracao"],

      "formato_ideal": "selfie_andando|mesa|tom_calmo|resposta_agressiva",

      "potencial_viral": 1-10,

      "cenas_reais": [
        "Cena concreta 1 (ex: 'esquece detalhes do cliente')",
        "Cena concreta 2 (ex: 'responde no automático')"
      ],

      "erro_invisivel": "O que a pessoa não percebe que está errado (ex: 'Ele acha que volume significa produtividade.')",

      "o_que_cliente_pensa": "Pensamento oculto do cliente (ex: 'Esse corretor parece superficial.')",

      "consequencia_invisivel": "Consequência lenta e silenciosa (ex: 'vira um corretor descartável no mercado')",

      "contraste": {
        "comum": "Descrição do comportamento comum (ex: 'fala demais, força fechamento, busca validação')",
        "ideal": "Descrição do comportamento ideal (ex: 'conduz com calma, transmite segurança, pensa longo prazo')"
      },

      "o_que_mercado_nao_perdoa": "Comportamento que destrói autoridade (ex: 'O mercado de luxo não perdoa improviso.')",

      "visao_profunda": "O que a pessoa do vídeo entendeu sobre o mercado (ex: 'Quem atende todo mundo igual nunca constrói autoridade.')",

      "alma_do_conteudo": "Frase forte que resume toda a tensão (ex: 'Quantidade sem profundidade só gera cansaço.')",

      "sensacao_final": "Sentimento que o vídeo precisa deixar (ex: 'confronto|vergonha|reflexão|autoridade|ambição|urgência|sofisticação|maturidade')"
    }
  ]
}
`,

  // ───────────────────────────────────────────────────────────────────────────
  // GUIA ESTRATÉGICA (VERSÃO DEFINITIVA – COMPORTAMENTAL E VIVIDA)
  // ───────────────────────────────────────────────────────────────────────────
  extrairGuiaEstrategica: (tensao, tituloVideo = '') => `
Você é um especialista em psicologia de mercado e comportamento humano.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJETIVO: EXTRAÇÃO DE TENSÃO HUMANA REAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NÃO resuma o assunto.
NÃO liste ensinamentos genéricos.
NÃO crie conteúdo motivacional.

Traduza: "O que essa tensão revela sobre comportamento humano e mercado?"

A guia precisa gerar CLAREZA MENTAL — não roteiro.
Quem lê deve entender profundamente o comportamento humano e conseguir falar sobre isso olhando pra câmera.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROIBIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ "importância de X"
❌ "construir confiança"
❌ "credibilidade no mercado"
❌ "impacto do comprometimento"
❌ qualquer linguagem corporativa ou motivacional
❌ repetir ideias com nomes diferentes
❌ ser abstrato ou genérico

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TENSÃO: ${typeof tensao === 'string' ? tensao : tensao.tensao}
ANTAGONISTA: ${tensao.antagonista || 'não informado'}
CENAS JÁ IDENTIFICADAS: ${(tensao.cenas_reais || tensao.cenas_sugeridas || []).join(' | ') || 'não informadas'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Retorne APENAS JSON. Cada campo deve adicionar informação NOVA — não repetir o anterior.

{
  "publico": "corretor|proprietario|comprador|investidor",

  "tensao_principal": "Frase viva e específica que descreve o conflito humano. NÃO genérica. Ex: 'Corretor que fala com tanta gente que não cria conexão com ninguém'",

  "como_aparece_na_vida_real": [
    "Comportamento observável concreto (ex: 'esquece detalhes do cliente')",
    "Segunda cena real (ex: 'responde no automático sem personalizar')",
    "Terceira cena real (ex: 'gagueja quando perguntam detalhes do imóvel')",
    "Quarta cena real (ex: 'força urgência falsa pra fechar logo')"
  ],

  "erro_invisivel": "O erro psicológico que a pessoa NÃO percebe. Ex: 'Ele acha que volume significa produtividade.'",

  "o_que_cliente_realmente_pensa": "Pensamento oculto do cliente que nunca é verbalizado. Ex: 'Esse corretor parece superficial.'",

  "o_que_realmente_doi": "A dor emocional REAL — não superficial. RUIM: 'perder vendas'. BOM: 'trabalhar muito sem construir reputação'",

  "consequencia_invisivel": "A consequência lenta e silenciosa que ninguém percebe na hora. Ex: 'vira um corretor descartável no mercado'",

  "o_que_mercado_nao_perdoa": "Comportamento específico que destrói autoridade nesse contexto. Ex: 'O mercado de luxo não perdoa improviso.'",

  "contraste": {
    "fraco": [
      "comportamento do profissional fraco 1",
      "comportamento do profissional fraco 2",
      "comportamento do profissional fraco 3"
    ],
    "forte": [
      "comportamento do profissional forte 1",
      "comportamento do profissional forte 2",
      "comportamento do profissional forte 3"
    ]
  },

  "visao_profunda": "O que essa pessoa entendeu sobre o mercado que a maioria não entende. Ex: 'Quem atende todo mundo igual nunca constrói autoridade.'",

  "alma_do_conteudo": "UMA frase forte que resume toda a tensão. Memorável. Ex: 'Quantidade sem profundidade só gera cansaço.'",

  "sensacao_final": "confronto|vergonha|reflexão|autoridade|ambição|urgência|sofisticação|maturidade",

  "sugestoes_de_gancho": [
    "Gancho 1 — específico, sem pergunta genérica",
    "Gancho 2",
    "Gancho 3"
  ],

  "frases_impacto": [
    "Frase cortável 1 — funciona sozinha como corte ou legenda",
    "Frase cortável 2",
    "Frase cortável 3"
  ],

  "energia_ideal": {
    "inicio": "provocativo|indignado|reflexivo|frio",
    "meio": "confrontador|analítico|pesado|irônico",
    "final": "estratégico|seco|desconfortável|silencioso"
  },

  "cta": "Frase curta e polarizadora — não pergunta de marketing. Ex: 'Vai continuar assim ou vai mudar?'"
}
`,

  // ───────────────────────────────────────────────────────────────────────────
  // EXTRAÇÃO DE TENSÕES DE AULAS (modelo avançado - gpt-4o)
  // ───────────────────────────────────────────────────────────────────────────
  extrairTensoesDeAulaAvancado: (conteudoAula, tituloAula = '') => `
Você é um Diretor Editorial especializado em conteúdo de mercado imobiliário.

⚠️ SUA FUNÇÃO NÃO É CRIAR CONTEÚDO GENÉRICO, MOTIVACIONAL OU "BONITO".
Sua função é transformar tensões do mercado em guias CIRÚRGICAS: densas, humanas, específicas, SEM burocracia.

════════════════════════════════════════
REGRAS ABSOLUTAS
════════════════════════════════════════

❌ EVITE abstrações genéricas:
   "Autoconfiança é importante", "Preparação é a chave do sucesso"

✅ PREFIRA: cenas reais, comportamento humano, consequências sociais, ego profissional, perda de autoridade.

NÃO use linguagem de coach. NÃO use: "acredite em você", "mindset", "basta querer".

O foco é AUTORIDADE. Não motivação.

════════════════════════════════════════
CONTEÚDO DA AULA
════════════════════════════════════════
TÍTULO: ${tituloAula}

CONTEÚDO:
${typeof conteudoAula === 'string' ? conteudoAula.substring(0, 15000) : JSON.stringify(conteudoAula, null, 2)}

════════════════════════════════════════
ESTRUTURA OBRIGATÓRIA (APENAS JSON)
════════════════════════════════════════

Retorne APENAS JSON com esta estrutura EXATA:

{
  "resumo": "resumo geral das tensões encontradas",
  "tensoes": [
    {
      "tensao": "frase curta e viva do conflito humano",
      "publico": "corretor|proprietario",
      "narrativa": "ego|perda|status|confronto",
      "emocao": "medo|vergonha|prejuizo|urgencia|frustracao",
      "potencial_viral": 1-10,
      "antagonista": "quem ou o que causa o problema",
      "persona": "corretor_sem_posicionamento|proprietario_inseguro|corretor_cansado",
      
      "gancho": "frase inicial forte (máx 12 palavras)",
      "direcao": "o que o vídeo precisa fazer emocionalmente",
      "linha_de_raciocinio": "lógica humana do problema",
      
      "o_que_isso_realmente_quer_dizer": "verdade brutal por trás do tema",
      "consequencia_invisivel": "impacto psicológico/social que ninguém percebe",
      
      "comportamento_corrigido": "o comportamento que está sendo confrontado",
      
      "o_que_ele_provavelmente_ja_viu": [
        "experiência real 1",
        "experiência real 2",
        "experiência real 3"
      ],
      
      "municao_argumentativa": [
        "argumento 1",
        "argumento 2",
        "argumento 3"
      ],
      
      "como_isso_aparece_na_vida_real": [
        "cena real 1",
        "cena real 2",
        "cena real 3"
      ],
      
      "o_que_essa_pessoa_acredita": [
        "crença errada 1",
        "crença errada 2"
      ],
      
      "o_que_realmente_doi": "dor emocional real",
      
      "topicos": ["tópico 1", "tópico 2", "tópico 3"],
      "frases_impacto": ["frase 1", "frase 2", "frase 3"],
      
      "percepcao_gerada": "mentor|estrategista|especialista|experiente|vendedor",
      "tipo_autoridade": ["mentor", "estrategista", "especialista", "lider"],
      "risco_interpretacao_errada": "possível interpretação negativa",
      
      "energia_ideal": {
        "inicio": "provocativo|analitico|indignado|reflexivo",
        "meio": "provocativo|analitico|indignado|reflexivo",
        "final": "provocativo|analitico|indignado|reflexivo"
      },
      
      "formato_ideal": "selfie_andando|mesa|tom_calmo|resposta_agressiva",
      "cta": "CTA curto e forte"
    }
  ]
}
`,

  // ─── DESDOBRAMENTOS (mantido) ───────────────────────────────────────────────
  gerarDesdobramentos: (tensao) => `
Para esta tensão, gere 4 desdobramentos:

TENSÃO: ${typeof tensao === 'string' ? tensao : tensao.tensao}

Retorne JSON:
{
  "desdobramentos": [
    {"formato": "reel_provocativo", "titulo": "...", "angulo": "...", "cta": "..."},
    {"formato": "carrossel", "titulo": "...", "angulo": "...", "cta": "..."},
    {"formato": "bastidor", "titulo": "...", "angulo": "...", "cta": "..."},
    {"formato": "corte", "titulo": "...", "angulo": "...", "cta": "..."}
  ]
}`,

  // ─── EXTRAÇÃO DE TEMAS (fallback) ─────────────────────────────────────────
  extrairTemasBrutos: (texto, tituloVideo = '') => `
Extraia temas do vídeo: "${tituloVideo}"

TRANSCRIÇÃO:
${texto.substring(0, 20000)}

Retorne JSON:
{
  "resumo": "...",
  "temas_brutos": [
    {
      "tema": "...",
      "gatilhos": ["dinheiro", "ego"],
      "potencial": "alto|medio|baixo",
      "antagonista": "...",
      "cenas_sugeridas": ["cena 1", "cena 2"]
    }
  ]
}`,

  // ─── FUNÇÕES LEGADAS (manter para compatibilidade) ─────────────────────────
  processarTranscricao: (texto, tipo, tituloVideo) => `...`,
  processarChunk: (chunk, tipo, tituloVideo, chunkIndex, totalChunks) => `...`,
  consolidarChunks: (resumos, tituloVideo) => `...`,
  gerarVariacoes: (roteiro, quantidade) => `...`,
  gerarRoteiro: (tema, pilar, publico, tom) => `...`,
  gerarRoteiroDeTema: (tema, tom, publico, tituloVideo) => `...`,
  expandirRoteiro: (rascunho, palavrasAtuais, tema, tom, publico) => `...`,
  melhorarGancho: (gancho, contexto) => `...`,
  reaproveitar: (roteiro) => `...`,
  sugerirTemas: (pilares_usados, temas_recentes) => `...`,
  avaliarViral: (roteiro) => `...`,
  analisarEstilo: (texto) => `...`
}