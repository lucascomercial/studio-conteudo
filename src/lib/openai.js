// src/lib/openai.js
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-proxy`

function sanitizeForJSON(text) {
  if (!text) return ''
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

export async function callOpenAI(prompt, options = {}) {
  const { model = 'gpt-4o-mini', max_tokens = 4000 } = options

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ prompt: typeof prompt === 'string' ? sanitizeForJSON(prompt) : prompt, model, max_tokens })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error: ${err}`)
  }

  const data = await response.json()
  return data.content
}

// Função auxiliar para reparar JSON malformado
function repairJSON(str) {
  // Remove blocos de código markdown
  str = str.replace(/```json/g, '').replace(/```/g, '')
  // Remove trailing commas
  str = str.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
  // Adiciona aspas em chaves sem aspas
  str = str.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
  // Remove quebras de linha e espaços extras
  str = str.trim()
  return str
}

export async function callOpenAIJSON(prompt, options = {}) {
  const text = await callOpenAI(prompt, { max_tokens: 4000, ...options })
  let clean = repairJSON(text)
  try {
    return JSON.parse(clean)
  } catch (firstError) {
    // Tenta extrair o primeiro objeto JSON
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(repairJSON(match[0]))
      } catch (e) {
        console.error('JSON inválido mesmo após reparo:', clean)
        throw firstError
      }
    }
    throw firstError
  }
}

export async function callOpenAIJSONPremium(prompt) {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      prompt: typeof prompt === 'string' ? sanitizeForJSON(prompt) : prompt,
      model: 'gpt-4o',
      max_tokens: 4096,
      temperature: 0.85,
      top_p: 0.95,
    })
  })
  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Edge Function error (${response.status}): ${errText}`)
  }
  const data = await response.json()
  let text = data.content || ''
  text = repairJSON(text)
  return JSON.parse(text)
}