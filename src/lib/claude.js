// src/lib/openai.js
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-proxy`

export async function callOpenAI(prompt, options = {}) {
  const {
    model = 'gpt-4o-mini',
    max_tokens = 2000,
  } = options

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ prompt, model, max_tokens })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error: ${err}`)
  }

  const data = await response.json()
  return data.content
}

export async function callOpenAIJSON(prompt, options = {}) {
  const text = await callOpenAI(prompt, { max_tokens: 4000, ...options })
  
  let clean = text.trim()
  if (clean.startsWith('```')) {
    clean = clean.split('```')[1]
    if (clean.startsWith('json')) clean = clean.slice(4)
  }
  clean = clean.trim()
  
  return JSON.parse(clean)
}