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
Você é um estrategista editorial especializado em transformar transcrições em GUIAS DE CONTEÚDO PROFUNDAS para vídeos curtos de Instagram/TikTok.

⚠️ O objetivo NÃO é criar roteiro pronto.
O objetivo é criar uma GUIA DE ENTENDIMENTO PROFUNDO da mensagem.
A guia precisa ajudar o criador a entender, sentir e improvisar naturalmente olhando pra câmera.
NÃO seja superficial. Evite frases genéricas, motivacionais ou "conteúdo de coach".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ REGRA MAIS IMPORTANTE: PRESERVE A TENSÃO ORIGINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A tensão abaixo é ESPECÍFICA. NÃO a generalize.

❌ PROIBIDO:
- Pegar "dependência de tráfego pago" e transformar em "trabalhar muito não é bom"
- Pegar "corretor que foge de objeção" e transformar em "comunicação é importante"
- Pegar "proprietário que não baixa preço" e transformar em "precificação é difícil"

✅ OBRIGATÓRIO:
- Preservar o mecanismo EXATO do problema
- Aprofundar a dor ESPECÍFICA dessa tensão
- Encontrar a contradição psicológica REAL
- Mostrar cenas que só fazem sentido NESSA tensão específica
- O gancho, tópicos e CTA devem convergir para A MESMA tensão

Se a tensão é "dependência de tráfego pago", tudo deve girar em torno disso:
- dor: "quando o anúncio para, o corretor desaparece"
- subtexto: "usa tráfego pago para esconder falta de posicionamento"
- cta: "Seu mercado te conhece ou só conhece seus anúncios?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ A TENSÃO ORIGINAL É SAGRADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NÃO substitua por tema mais amplo.
NÃO derive para: produtividade · motivação · esforço · disciplina genérica · burnout.
Todos os campos devem ORBITAR a tensão original.
Se qualquer campo começar a derivar: CORRIJA.

Antes de gerar cada campo, responda internamente:
→ Qual é o mecanismo INVISÍVEL desta tensão específica?
→ Qual dependência ou contradição existe?
→ Qual dor ESPECÍFICA essa situação gera?
→ Qual comportamento concreto isso produz?
→ Qual consequência social ou profissional aparece?

EXEMPLOS DE DERIVA PROIBIDA:
"foge de objeção" → ❌ "comunicação é importante" → ✅ "muda de assunto quando cliente questiona o preço"
"proprietário não baixa preço" → ❌ "precificação é difícil" → ✅ "acredita que apego emocional tem valor de mercado"
"dependência de tráfego pago" → ❌ "trabalhar muito não adianta" → ✅ "corretor virou refém da campanha — quando para, ele desaparece"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TENSÃO: \${typeof tensao === 'string' ? tensao : tensao.tensao}
ANTAGONISTA: \${tensao.antagonista || 'não informado'}
CENAS JÁ IDENTIFICADAS: \${(tensao.cenas_reais || tensao.cenas_sugeridas || []).join(' | ') || 'não informadas'}

Retorne APENAS JSON com todos os campos abaixo. Seja cruelmente específico e humano.

{
  "publico": "corretor|proprietario|comprador|investidor",
  "narrativa": "ego|perda|status|urgencia|confronto|fracasso_silencioso|bastidor",
  "emocao": "frustracao|medo|vergonha|ambicao|ansiedade|orgulho",
  "potencial_viral": 8,
  "nivel_confronto": "fraco|medio|forte",

  "tensao_principal": "Frase viva e específica — NÃO genérica. Ex: Corretor que fala com tanta gente que não cria conexão com ninguém",

  "sugestoes_de_gancho": [
    "Gancho 1 — frase curta e forte que abre o vídeo",
    "Gancho 2",
    "Gancho 3"
  ],

  "direcao": "Como o criador deve conduzir a fala. Ex: confronto direto, reflexão silenciosa, alerta, bastidor, provocação elegante",

  "linha_de_raciocinio": "Lógica central do conteúdo em 1-3 frases",

  "o_que_isso_realmente_quer_dizer": "Mensagem escondida por trás da fala",

  "consequencia_invisivel": "Prejuízo silencioso que isso gera ao longo do tempo",

  "ponto_central": "Ideia MAIS importante do vídeo",

  "como_aparece_na_vida_real": [
    "Cena real específica 1 — ex: cliente faz pergunta simples e o corretor trava",
    "Cena real específica 2 — ex: corretor olha pro gerente antes de responder",
    "Cena real específica 3 — ex: cliente percebe insegurança no tom",
    "Cena real específica 4"
  ],

  "o_que_essa_pessoa_acredita": [
    "Crença interna errada 1",
    "Crença interna errada 2"
  ],

  "o_que_realmente_doi": "Dor emocional REAL desta tensão específica — não genérica. Ex para tráfego pago: perceber que depois de anos no mercado ninguém procura você espontaneamente",

  "o_que_esta_tentando_alertar": "Aviso escondido no conteúdo",

  "o_que_enxergou_que_outros_nao": "Percepção mais profunda que esse conteúdo possui",

  "verdadeiro_problema_escondido": "Além da superfície. Ex: o corretor usa improviso para esconder insegurança",

  "por_que_doi_tanto": "Impacto psicológico, social e profissional",

  "comportamento_corrigido": "Qual atitude o vídeo combate",

  "o_que_ja_viu_na_vida_real": [
    "Cena que alguém experiente já testemunhou 1",
    "Cena que alguém experiente já testemunhou 2",
    "Cena que alguém experiente já testemunhou 3"
  ],

  "o_que_cliente_pensa": "Pensamento oculto do cliente que nunca é verbalizado",

  "o_que_mercado_nao_perdoa": "Comportamento que destrói autoridade nesse contexto",

  "contraste": {
    "fraco": [
      "comportamento fraco 1",
      "comportamento fraco 2",
      "comportamento fraco 3"
    ],
    "forte": [
      "comportamento forte 1",
      "comportamento forte 2",
      "comportamento forte 3"
    ]
  },

  "subtexto_escondido": "Mensagem invisível desta tensão específica. Ex para tráfego pago: o corretor usa tráfego pago para esconder falta de posicionamento",

  "visao_profunda": "O que essa pessoa entendeu que a maioria não entende",

  "alma_do_conteudo": "UMA frase que resume a essência emocional. Memorável.",

  "sensacao_final": "reflexao|vergonha|urgencia|ambicao|incomodo|inspiracao|confronto|maturidade",

  "micro_cenas": [
    "Cena visual rápida 1 — ex: cliente esperando resposta enquanto corretor olha o celular",
    "Cena visual rápida 2",
    "Cena visual rápida 3",
    "Cena visual rápida 4"
  ],

  "o_que_nao_pode_faltar": [
    "Elemento obrigatório na fala 1",
    "Elemento obrigatório na fala 2"
  ],

  "topicos": [
    "Tópico central 1",
    "Tópico central 2",
    "Tópico central 3"
  ],

  "frases_impacto": [
    "Frase natural e impactante 1",
    "Frase natural e impactante 2",
    "Frase natural e impactante 3"
  ],

  "o_que_evitar": [
    "Coisa que destruiria o conteúdo 1",
    "Coisa que destruiria o conteúdo 2"
  ],

  "energia_ideal": {
    "inicio": "provocativo|indignado|reflexivo|frio|estrategico",
    "meio": "confrontador|analitico|pesado|ironico|mentor",
    "final": "estrategico|seco|desconfortavel|silencioso|urgente"
  },

  "tom_ideal": "provocativo|estrategico|analitico|mentor|confronto|sofisticado|indignado|calmo",

  "risco_interpretacao_errada": "Como esse conteúdo pode ser mal interpretado",

  "cta": "CTA curto e polarizador — não pergunta de marketing"
}
`,
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