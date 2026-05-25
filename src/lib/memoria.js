// src/lib/memoria.js
import { supabase } from './supabase.js'

// Buscar memória recente para evitar repetição
export async function getMemoriaProibida(tipo, limite = 10) {
  try {
    const { data, error } = await supabase
      .rpc('get_memoria_ia', { p_tipo: tipo, p_limite: limite })
    
    if (error) {
      console.error('Erro ao buscar memória:', error)
      return []
    }
    
    return data || []
  } catch (e) {
    console.error('Erro ao buscar memória:', e)
    return []
  }
}

// Registrar item usado
export async function registrarItemMemoria(tipo, conteudo) {
  if (!conteudo || conteudo.length < 10) return
  
  try {
    const { error } = await supabase
      .rpc('registrar_uso_memoria', { p_tipo: tipo, p_conteudo: conteudo })
    
    if (error) {
      console.error('Erro ao registrar memória:', error)
    }
  } catch (e) {
    console.error('Erro ao registrar memória:', e)
  }
}

// Buscar e formatar para o prompt
export async function getPromptMemoria() {
  try {
    const [hooks, analogias, arquétipos, payoffs] = await Promise.all([
      getMemoriaProibida('hook', 8),
      getMemoriaProibida('analogia', 6),
      getMemoriaProibida('arquétipo', 5),
      getMemoriaProibida('payoff', 5),
    ])
    
    let prompt = ''
    
    if (hooks.length) {
      prompt += '⚠️ PROIBIDO REPETIR ESTES HOOKS:\n' + hooks.map(h => `- "${h.conteudo}"`).join('\n') + '\n\n'
    }
    
    if (analogias.length) {
      prompt += '⚠️ PROIBIDO REPETIR ESTAS ANALOGIAS:\n' + analogias.map(a => `- "${a.conteudo}"`).join('\n') + '\n\n'
    }
    
    if (arquétipos.length) {
      prompt += '⚠️ PROIBIDO REPETIR ESTES ARQUÉTIPOS:\n' + arquétipos.map(a => `- ${a.conteudo}`).join('\n') + '\n\n'
    }
    
    if (payoffs.length) {
      prompt += '⚠️ PROIBIDO REPETIR ESTES PAYOFFS:\n' + payoffs.map(p => `- "${p.conteudo}"`).join('\n') + '\n\n'
    }
    
    return prompt
  } catch (e) {
    console.error('Erro ao gerar prompt de memória:', e)
    return ''
  }
}