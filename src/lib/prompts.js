// src/lib/prompts.js
const CONTEXTO_BASE = `Você é Lucas Augusto. Gestor de corretores em Brasília.
Grava reels de 90 a 120 segundos para Instagram.
Fala como alguém que vive o mercado — não como quem escreve sobre ele.`

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
  // ============================================================
  // EXTRAÇÃO DE TENSÕES DE VÍDEOS (limite aumentado para 200k)
  // ============================================================
  extrairTensoes: (texto, tituloVideo = '') => `
Você é um estrategista editorial e psicólogo de comportamento de mercado.

⚠️ NÃO faça resumo do assunto. NÃO liste lições genéricas. NÃO use abstrações vazias.

Seu trabalho é extrair TENSÕES HUMANAS REAIS do vídeo: "${tituloVideo}"

Uma TENSÃO é um conflito comportamental com:
- ações concretas que a pessoa faz (ou deixa de fazer)
- cenas reais que qualquer um reconheceria
- um erro invisível que a pessoa comete sem perceber
- uma consequência silenciosa (social, emocional, de reputação)

TRANSCRIÇÃO:
${texto.substring(0, 200000)}

Retorne APENAS JSON:
{
  "resumo": "resumo em 1 frase",
  "tensoes": [
    {
      "tensao": "frase viva do comportamento problemático",
      "publico_sugerido": "corretor|proprietario|comprador|investidor",
      "emocao": "medo|vergonha|frustracao|ansiedade|ego|prejuizo|urgencia",
      "gatilhos": ["ego", "dinheiro", "tempo", "frustracao"],
      "formato_ideal": "selfie_andando|mesa|tom_calmo|resposta_agressiva",
      "potencial_viral": 1-10,
      "cenas_reais": ["cena 1", "cena 2"],
      "erro_invisivel": "o que a pessoa não percebe",
      "o_que_cliente_pensa": "pensamento oculto do cliente",
      "consequencia_invisivel": "consequência lenta e silenciosa",
      "contraste": {
        "comum": "comportamento comum",
        "ideal": "comportamento ideal"
      },
      "o_que_mercado_nao_perdoa": "comportamento que destrói autoridade",
      "visao_profunda": "o que a pessoa entendeu sobre o mercado",
      "alma_do_conteudo": "frase forte que resume a tensão",
      "sensacao_final": "confronto|vergonha|reflexão|autoridade|ambição|urgência"
    }
  ]
}
`,

  // ============================================================
  // GUIA ESTRATÉGICA – VERSÃO AVANÇADA (checkpoints, voz do autor, etc.)
  // ============================================================
  extrairGuiaEstrategica: (tensao, tituloVideo = '') => `
⚠️ INSTRUÇÃO CRÍTICA (LEIA ANTES DE TUDO):

Você NÃO pode repetir a mesma ideia em campos diferentes.
Cada campo deve revelar uma camada NOVA e DISTINTA da mesma tensão.

Exemplo do que NÃO fazer:
- “tentar agradar todo mundo leva à invisibilidade”
- “falta de foco gera irrelevância”
- “ser tudo para todos faz ninguém lembrar”

Isso é a MESMA ideia. Se dois campos disserem a mesma coisa com palavras diferentes, você falhou.

Você é um estrategista editorial especializado em transformar tensões em GUIAS DE CONTEÚDO PROFUNDAS.

⚠️ REGRA ABSOLUTA: VOCÊ NÃO É UM SOLUCIONADOR DE PROBLEMAS
Seu trabalho NÃO é explicar o que fazer. Seu trabalho é HABITAR A DOR.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 PROIBIÇÃO MORTAL: NÃO PULE PARA SOLUÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ NUNCA transforme tensão específica em tema genérico.

TENSÃO: ${typeof tensao === 'string' ? tensao : tensao.tensao}
ANTAGONISTA: ${tensao.antagonista || 'não informado'}
CENAS REAIS IDENTIFICADAS: ${(tensao.cenas_reais || tensao.cenas_sugeridas || []).join(' | ') || 'não informadas'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 PROIBIÇÃO: NÃO ROMANTIZE A TENSÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NUNCA transforme:
- medo de passar necessidade  →  "falta de identidade"
- insegurança financeira      →  "busca por propósito"
- escassez de oportunidades   →  "falta de autoconhecimento"
- medo de nichar              →  "validação externa"
- sobrevivência               →  "propósito de vida"

Isso é ROMANTIZAÇÃO. Mata a profundidade real.

✅ Mantenha a tensão no chão:

- "acha que vai perder oportunidades se focar"
- "dizer 'não' é perigoso"
- "vê outros fechando negócios em várias áreas"
- "tem medo de apostar no nicho errado"
- "sente insegurança financeira para especializar"
- "tenta abraçar tudo por sobrevivência"
- "vira genérico tentando não perder mercado"

A guia deve falar de SOBREVIVÊNCIA, não de propósito.
Deve falar de MEDO REAL, não de abstração.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 PROIBIÇÃO: NÃO EMBELEZE A DOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NUNCA transforme uma tensão crua em uma frase “bonita” ou “inspiradora”.

❌ “a busca por aceitação leva à perda de identidade” → bonito, conceitual, vazio
✅ “o corretor prefere parecer disponível para tudo do que correr o risco de apostar em um território” → cru, comportamental, verdadeiro

❌ “a dúvida sobre quem você é” → genérico
✅ “ele muda o discurso dependendo do cliente porque tem medo de ser descartado” → específico, observável

A guia deve causar desconforto, não admiração.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 PROIBIÇÃO: METÁFORAS FILOSÓFICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NUNCA use metáforas poéticas ou abstratas.

❌ PROIBIDO:
- máscara
- armadura
- prisão
- abismo
- vazio
- eco
- sombra
- personagem
- identidade
- essência
- jornada

✅ PREFIRA:
- comportamento observável
- ação concreta
- cena específica
- consequência social

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 PROIBIÇÃO: PSICOLOGIA GENÉRICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Não use repetidamente palavras como:
- validação
- insegurança (sem mostrar)
- aceitação
- medo de rejeição
- identidade
- pertencimento

A psicologia deve aparecer através de COMPORTAMENTO OBSERVÁVEL, não de explicação.

❌ “ele busca validação”
✅ “muda completamente o jeito de falar dependendo do cliente”

O segundo é cinema. O primeiro é palestra.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CHECKPOINT 1: AINDA É A MESMA DOR?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de preencher CADA campo, responda:

"O que estou escrevendo agora É a mesma tensão original ou já virou um tema?"

Se virou tema (networking, produtividade, estratégia, marketing):
👉 VOLTE E REESCREVA com foco na experiência emocional.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CHECKPOINT 2: ORDEM OBRIGATÓRIA (dor → comportamento → consequência)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NUNCA pule para "o que fazer" antes de passar por:

1️⃣ O QUE A PESSOA SENTE (emoção crua, sofrimento)
2️⃣ O QUE ELA VIVE NO DIA A DIA (cena real, comportamento)
3️⃣ O QUE ISSO DESTRÓI NELA (consequência invisível profissional/social)
4️⃣ SÓ DEPOIS: causa técnica (se necessário)

Se você escreveu "estratégia", "networking" ou "prospecção" antes de completar os 3 primeiros passos:
👉 VOCÊ DERIVOU. REESCREVA.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CHECKPOINT 3: TESTE DO "ISSO AINDA DÓI?"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Depois de gerar cada campo, pergunte:

"Se eu lesse isso em voz alta, um corretor sentiria vergonha, incômodo ou identificação imediata?"

Se a resposta for "isso parece inteligente" ou "isso é uma boa dica":
👉 VOCÊ FUGIU DA DOR. REESCREVA.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CHECKPOINT 4: TESTE DA SOBREVIVÊNCIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Depois de gerar cada campo, pergunte:

"Se eu lesse isso em voz alta, um corretor pensaria em dinheiro, medo de perder oportunidade, insegurança prática?"

Se a resposta for "parece autoajuda", "parece palestra de propósito", "fala de essência":
👉 VOCÊ ROMANTIZOU. REESCREVA com foco no medo real e na mecânica de sobrevivência.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CHECKPOINT 5: O EXEMPLO PROIBIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tensão: "dificuldade de se especializar em mercado competitivo"

❌ ROMANTIZADO:
"busca por identidade", "validação externa", "falta de essência"

✅ CORRETO (sobrevivência):
"medo de perder oportunidades ao focar", "insegurança de dizer não a imóveis", "ansiedade de ver colegas faturando enquanto você aposta em um nicho"

Se o campo não mencionar MEDO REAL, DINHEIRO ou PERDA DE OPORTUNIDADE, você falhou.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CHECKPOINT 6: COMPORTAMENTO COMPENSATÓRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para cada campo, pergunte:

"Isso descreve uma AÇÃO real que a pessoa faz para se proteger da dor?"

Exemplos de COMPORTAMENTO COMPENSATÓRIO:
- aceitar qualquer imóvel (mesmo fora do perfil)
- mudar discurso dependendo do cliente
- evitar se posicionar publicamente
- copiar especialistas em vez de desenvolver estilo próprio
- tentar parecer versátil para não perder oportunidade

Se o campo NÃO contiver uma ação observável:
👉 REESCREVA com foco no que a pessoa FAZ, não no que ela SENTE ou PENSA.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CHECKPOINT 7: MICRO-CENA OBRIGATÓRIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O campo “micro_cenas” deve conter pelo menos 3 cenas que:

1. Sejam específicas da tensão (não servem para outra)
2. Sejam socialmente reconhecíveis (qualquer corretor já viu)
3. Sejam desconfortáveis (causam vergonha alheia)

Exemplos PROIBIDOS (genéricos):
- “olhando para a tela sem saber por onde começar”
- “insegurança antes de uma reunião”

Exemplos CORRETOS (para a tensão “corretor que não sabe o valor do imóvel”):
- “cliente abre o Zap Imóveis no meio da reunião e compara o valor na sua frente”
- “corretor trava quando perguntam o valor do metro quadrado na região”
- “proprietário percebe insegurança ao ouvir ‘acho que dá pra pedir isso’”

Se a cena servir para qualquer outra tensão, ela é genérica. REESCREVA.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CHECKPOINT 8: TESTE DA FALABILIDADE (ORALIDADE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de finalizar cada campo, leia a frase em voz alta (mentalmente).

Pergunte: "Um ser humano falaria isso naturalmente olhando para uma câmera?"

❌ FRASES ESCRITAS (sofisticadas, bonitas, filosóficas):
- “a incapacidade de se especializar é a máscara do medo de não ser suficiente”
- “a busca por aceitação leva à perda de identidade”

✅ FRASES FALÁVEIS (naturais, cruas, como alguém experiente falaria):
- “o corretor prefere parecer disponível para tudo do que correr o risco de apostar em um território”
- “ele muda o discurso dependendo do cliente porque tem medo de ser descartado”

Se a frase soar como “texto de livro” ou “frase de copywriter”:
👉 REESCREVA de forma mais simples, direta e falável.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 HUMANIZAÇÃO E VOZ REAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A guia precisa parecer uma OBSERVAÇÃO HUMANA REAL, não um framework preenchido.

PARE de explicar como um professor. COMECE a observar como alguém experiente.

EVITE linguagem artificialmente organizada:
- “a lógica emocional”
- “a verdade psicológica”
- “a consequência invisível é”
- “a busca por”
- “a necessidade de”
- “isso significa”
- “o comportamento revela”
- “a insegurança gera”

PREFIRA frases humanas e naturais.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 ABSORÇÃO DA VOZ EMOCIONAL DO AUTOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A transcrição contém a FALA REAL do autor. Absorva o JEITO EMOCIONAL dele:

- se ele fala mais seco → seja seco
- mais confrontador → confronte
- mais cansado → soe cansado
- mais irônico → use ironia
- mais observacional → descreva padrões
- mais direto → vá direto ao ponto

NÃO copie palavras. Absorva a MANEIRA como ele enxerga o mercado.

A guia deve soar como SE ELE estivesse descrevendo algo que já viu acontecer dezenas de vezes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 FUNÇÃO DE CADA CAMPO (CONSULTE ANTES DE ESCREVER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- ferida_original → origem emocional da dor
- mecanismo_de_defesa → como a pessoa evita sentir essa dor
- verdade_dificil → o que ela não quer admitir sobre si mesma
- consequencia_invisivel → o preço silencioso desse comportamento
- subtexto_escondido → o conflito psicológico oculto
- visao_profunda → a verdade maior que quase ninguém percebe
- alma_do_conteudo → a essência emocional do vídeo
- o_que_mercado_nao_perdoa → consequência social/profissional observável

Cada campo = UMA CAMADA NOVA. Se dois campos estão dizendo a mesma ideia com palavras diferentes, REESCREVA.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CHECKPOINT 9: TESTE DE REPETIÇÃO DE IDEIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de finalizar, leia todos os campos que você preencheu.

Pergunte: “Dois campos diferentes estão dizendo a mesma coisa?”

Se a resposta for SIM:
👉 REESCREVA os campos repetidos com UMA CAMADA NOVA da mesma tensão.

Exemplo de repetição proibida:
- “tentar agradar todo mundo leva à invisibilidade”
- “falta de foco gera irrelevância”
- “ser tudo para todos faz ninguém lembrar”

Isso é a MESMA ideia. Substitua por:

FERIDA ORIGINAL: medo de não sobreviver financeiramente
MECANISMO DE DEFESA: aceitar qualquer imóvel
CONSEQUÊNCIA INVISÍVEL: ninguém lembra dele para nada específico
SUBTEXTO ESCONDIDO: ele quer ser reconhecido, mas evita assumir um território
VISÃO PROFUNDA: o mercado só memoriza quem ocupa espaço claro

PERCEBA: todos falam da mesma tensão, mas cada um revela algo DIFERENTE.

Se ainda houver repetição, REESCREVA ATÉ CADA CAMPO SER ÚNICO.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CHECKPOINT 10: CONTAMINAÇÃO DE TENSÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NÃO reutilize comportamentos, contrastes, cenas ou frases de tensões anteriores.

Cada guia deve parecer nascida EXCLUSIVAMENTE da tensão atual.

❌ EXEMPLO DE CONTAMINAÇÃO:

Tensão atual: "corretor que não sabe o valor do imóvel"
Campos errados: "aceita qualquer imóvel", "muda de nicho", "fala de luxo hoje e aluguel amanhã"

Esses comportamentos pertencem à tensão "dificuldade de se especializar". Isso é CONTAMINAÇÃO.

✅ REGRA OBRIGATÓRIA:
Todos os campos devem nascer da EXPERIÊNCIA CENTRAL da tensão atual.

Pergunte antes de escrever: "Isso só faz sentido para ESTA tensão específica?"

Se servir para outra tensão → REESCREVA.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DIRETRIZES PARA CONTRASTE (GERAR ESPECÍFICO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O contraste deve ser GERADO para esta tensão, não copiado de exemplo.

Para a tensão "corretor que não sabe o valor do imóvel", o contraste correto seria:

"fraco": [
  "entra em reunião sem levantamento",
  "fala preço baseado em sensação",
  "tenta enrolar quando pressionado",
  "muda de assunto se cliente fala de dados"
],

"forte": [
  "chega com comparativos reais",
  "domina o preço por metro quadrado",
  "sustenta a avaliação sem hesitar",
  "usa dados para justificar o valor"
]

Para outras tensões, crie um contraste específico. Não use o mesmo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 REGRA DE OURO FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A tensão original deve aparecer EMOCIONALMENTE até o final da guia.

Retorne APENAS JSON com os campos abaixo.
Lembre-se: HABITE A DOR, não a explique. SOE HUMANO. CADA CAMPO = UMA DESCOBERTA NOVA.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "publico": "corretor|proprietario|comprador|investidor",
  "narrativa": "ego|perda|status|urgencia|confronto|fracasso_silencioso|bastidor",
  "emocao": "frustracao|medo|vergonha|ambicao|ansiedade|orgulho",
  "potencial_viral": 8,
  "nivel_confronto": "fraco|medio|forte",
  "tensao_principal": "Frase viva que mantém a tensão original",
  "sugestoes_de_gancho": ["Gancho que desperta a dor", "Gancho 2", "Gancho 3"],
  "direcao": "Emocional: confrontar, provocar vergonha, gerar desconforto",
  "linha_de_raciocinio": "Lógica emocional (observacional, não conceitual)",
  "o_que_isso_realmente_quer_dizer": "Verdade psicológica crua, observada, não explicada",
  "consequencia_invisivel": "Prejuízo silencioso ao longo do tempo",
  "ponto_central": "Cerne da experiência dolorosa",
  "como_aparece_na_vida_real": ["Cena real 1", "Cena real 2", "Cena real 3"],
  "o_que_essa_pessoa_acredita": ["Crença que mantém a dor viva"],
  "o_que_realmente_doi": "Dor visceral (não sobre estratégia)",
  "o_que_esta_tentando_alertar": "Aviso enterrado na dor",
  "o_que_enxergou_que_outros_nao": "Percepção profunda sobre o sofrimento silencioso",
  "verdadeiro_problema_escondido": "Além do óbvio - o que ninguém nomeia",
  "por_que_doi_tanto": "Impacto psicológico, social, profissional",
  "comportamento_corrigido": "Atitude que o vídeo confronta",
  "o_que_ja_viu_na_vida_real": ["Cena que só quem viveu o mercado reconhece"],
  "o_que_cliente_pensa": "Fala instintiva do cliente (ex: 'parece meio perdido')",
  "o_que_mercado_nao_perdoa": "Frase com dor real",
  "contraste": {
    "fraco": ["comportamento de quem está preso na dor"],
    "forte": ["comportamento de quem superou"]
  },
  "subtexto_escondido": "Mensagem invisível que ninguém verbaliza (comportamental, não filosófico)",
  "visao_profunda": "Percepção rara (observação, não lição)",
  "alma_do_conteudo": "Frase imperfeita, falável, que resume a experiência (não slogan)",
  "sensacao_final": "vergonha|desconforto|reflexao|incomodo|confronto",
  "micro_cenas": ["Cena específica 1", "Cena específica 2", "Cena específica 3"],
  "o_que_nao_pode_faltar": ["Elemento emocional obrigatório"],
  "topicos": ["Tópico centrado na experiência"],
  "frases_impacto": ["Frase desconfortável, falável, não filosófica"],
  "o_que_evitar": ["O que destruiria a entrega emocional"],
  "energia_ideal": {
    "inicio": "provocativo|indignado|reflexivo",
    "meio": "confrontador|analitico",
    "final": "estrategico|seco|urgente"
  },
  "tom_ideal": "provocativo|confronto|estrategico",
  "risco_interpretacao_errada": "Como pode ser mal interpretado",
  "cta": "CTA simples, provoca reflexão (não fórmula mágica)",
  "ferida_original": "Origem emocional (observável)",
  "mecanismo_de_defesa": "Comportamento de proteção (ação concreta)",
  "comportamento_social_visivel": ["Comportamento observável no dia a dia"],
  "verdade_dificil": "O que ninguém quer admitir sobre si (cru, sem floreios)",
  "sinais_reais_de_desconfianca": ["Sinal comportamental específico"],
  "como_isso_vira_conteudo_de_camera": "Frase natural e falável que preserva a dor"
}
`,

  // ============================================================
  // EXTRAÇÃO DE TENSÕES DE AULAS (avançado)
  // ============================================================
  extrairTensoesDeAulaAvancado: (conteudoAula, tituloAula = '') => `
Você é um Diretor Editorial especializado em conteúdo de mercado imobiliário.
Transforme o conteúdo da aula em TENSÕES HUMANAS REAIS.

TÍTULO: ${tituloAula}
CONTEÚDO: ${typeof conteudoAula === 'string' ? conteudoAula.substring(0, 15000) : JSON.stringify(conteudoAula, null, 2)}

Retorne APENAS JSON:
{
  "resumo": "resumo geral",
  "tensoes": [
    {
      "tensao": "frase do conflito humano",
      "publico": "corretor|proprietario",
      "narrativa": "ego|perda|status|confronto",
      "emocao": "medo|vergonha|prejuizo|urgencia|frustracao",
      "potencial_viral": 1-10,
      "antagonista": "quem causa o problema",
      "gancho": "frase inicial forte",
      "direcao": "o que o vídeo precisa fazer",
      "linha_de_raciocinio": "lógica humana do problema",
      "o_que_isso_realmente_quer_dizer": "verdade brutal",
      "consequencia_invisivel": "impacto psicológico/social",
      "comportamento_corrigido": "comportamento confrontado",
      "o_que_ele_provavelmente_ja_viu": ["experiência 1", "experiência 2"],
      "municao_argumentativa": ["argumento 1", "argumento 2"],
      "como_isso_aparece_na_vida_real": ["cena 1", "cena 2"],
      "o_que_essa_pessoa_acredita": ["crença 1", "crença 2"],
      "o_que_realmente_doi": "dor emocional real",
      "topicos": ["tópico 1", "tópico 2"],
      "frases_impacto": ["frase 1", "frase 2"],
      "percepcao_gerada": "mentor|estrategista|especialista",
      "tipo_autoridade": ["mentor", "estrategista"],
      "risco_interpretacao_errada": "possível interpretação negativa",
      "energia_ideal": {
        "inicio": "provocativo",
        "meio": "confrontador",
        "final": "estrategico"
      },
      "formato_ideal": "selfie_andando|mesa",
      "cta": "CTA curto e forte"
    }
  ]
}
`,

  // ============================================================
  // DESDOBRAMENTOS
  // ============================================================
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

  // ============================================================
  // EXTRAÇÃO DE TEMAS (fallback)
  // ============================================================
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

  // ============================================================
  // FUNÇÕES LEGADAS (compatibilidade)
  // ============================================================
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