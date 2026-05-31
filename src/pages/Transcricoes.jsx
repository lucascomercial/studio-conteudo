// src/pages/Transcricoes.jsx
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { callOpenAIJSON } from '../lib/openai'
import { prompts } from '../lib/prompts'

const TIPOS = ['podcast', 'aula', 'entrevista', 'video', 'palestra', 'livro', 'outro']

const GATILHO_COLORS = {
  ego: 'bg-violet-500/10 text-violet-400',
  dinheiro: 'bg-amber-500/10 text-amber-400',
  medo: 'bg-red-500/10 text-red-400',
  tempo: 'bg-blue-500/10 text-blue-400',
  prejuizo: 'bg-orange-500/10 text-orange-400',
  vergonha: 'bg-pink-500/10 text-pink-400',
}

const POTENCIAL_COLORS = {
  alto: 'bg-emerald-500/10 text-emerald-400',
  medio: 'bg-amber-500/10 text-amber-400',
  baixo: 'bg-white/5 text-white/30',
}

const FORMATO_ICONES = {
  selfie_andando: '🚶 Selfie andando',
  mesa: '📋 Mesa',
  tom_calmo: '🧘 Tom calmo',
  resposta_agressiva: '⚡ Resposta agressiva',
}

function SpinIcon() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

export default function Transcricoes() {
  const [transcricoes, setTranscricoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [guiasPorTensao, setGuiasPorTensao] = useState({})
  const [gerandoTensao, setGerandoTensao] = useState({})
  const [guiasAbertos, setGuiasAbertos] = useState({})
  const [tomPorTensao, setTomPorTensao] = useState({})
  const [publicoPorTrans, setPublicoPorTrans] = useState({})
  const [tomPorTrans, setTomPorTrans] = useState({})

  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('aula')
  const [texto, setTexto] = useState('')
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    carregarTranscricoes()
  }, [])

  async function carregarTranscricoes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('transcricoes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }
    setTranscricoes(data || [])

    const { data: todosGuias, error: guiasError } = await supabase
      .from('guias_profundas')
      .select('*')

    if (guiasError) {
      console.error(guiasError)
      setLoading(false)
      return
    }

    const guiaPorTexto = new Map()
    for (const guia of todosGuias || []) {
      if (guia.tensao_texto) {
        guiaPorTexto.set(guia.tensao_texto, guia)
      }
    }

    const guiasMap = {}
    for (const trans of data || []) {
      if (trans.temas_brutos && Array.isArray(trans.temas_brutos)) {
        for (let idx = 0; idx < trans.temas_brutos.length; idx++) {
          const tensao = trans.temas_brutos[idx]
          const key = `${trans.id}_${idx}`
          const textoChave = tensao.tensao || tensao.tema
          if (textoChave && guiaPorTexto.has(textoChave)) {
            guiasMap[key] = guiaPorTexto.get(textoChave)
          }
        }
      }
    }
    setGuiasPorTensao(guiasMap)
    setLoading(false)
  }

  const handleProcessar = async () => {
    if (!texto.trim()) return
    setProcessando(true)
    try {
      const data = await callOpenAIJSON(prompts.processarTranscricao(texto, tipo, titulo))
      const { data: inserted } = await supabase
        .from('transcricoes')
        .insert({
          titulo: titulo || 'Sem título',
          tipo,
          conteudo_original: texto,
          resumo: data.resumo,
          insights: data.insights,
          hooks_gerados: data.hooks_fortes,
          status: 'processado',
          roteiros_gerados: data.roteiros?.length || 0,
        })
        .select()
      if (inserted) {
        setTranscricoes(prev => [inserted[0], ...prev])
        setTexto('')
        setTitulo('')
      }
    } catch (e) {
      console.error(e)
      alert('Erro ao processar. Verifique a conexão com a API.')
    } finally {
      setProcessando(false)
    }
  }

  const gerarGuiaParaTensao = async (transcricao, tensao, tensaoIndex) => {
    const key = `${transcricao.id}_${tensaoIndex}`
    if (gerandoTensao[key]) return
    setGerandoTensao(prev => ({ ...prev, [key]: true }))
    try {
      let tensaoId = tensao.id
      if (!tensaoId) {
        const { data: tensaoInserida, error: tensaoError } = await supabase
          .from('tensoes')
          .insert({
            transcricao_id: transcricao.id,
            tensao: tensao.tensao,
            emocao: tensao.emocao,
            antagonista: tensao.antagonista,
            gatilhos: tensao.gatilhos || [],
            cenas: tensao.cenas_sugeridas || [],
            frases_do_video: tensao.frases_do_video || [],
            formato_ideal: tensao.formato_ideal,
            potencial_viral: tensao.potencial_viral || 5,
            publico_sugerido: tensao.publico_sugerido || 'corretor',
            status: 'pendente'
          })
          .select()
        if (tensaoError) throw tensaoError
        tensaoId = tensaoInserida[0].id
      }

      console.log('Chamando gerar-guia com tensao_id:', tensaoId)
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-guia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          tensao_id: tensaoId,
          tensao_texto: tensao.tensao,
          tom: tomPorTensao[key] || tensao.tom_sugerido || 'confronto'
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro na Edge Function')

      // ✅ O guia completo já está no result.guia – usamos ele diretamente
      const guiaSalvo = result.guia

      // Atualiza o estado local imediatamente, sem precisar consultar o banco
      setGuiasPorTensao(prev => ({ ...prev, [key]: guiaSalvo }))
      setGuiasAbertos(prev => ({ ...prev, [key]: true }))
    } catch (err) {
      console.error(err)
      alert('Erro ao gerar guia: ' + err.message)
    } finally {
      setGerandoTensao(prev => ({ ...prev, [key]: false }))
    }
  }

  const extrairTensoes = async (transcricaoId) => {
    const key = `tensoes_${transcricaoId}`
    setGerandoTensao(prev => ({ ...prev, [key]: true }))
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extrair-tensoes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            transcricao_id: transcricaoId,
            publico: publicoPorTrans[transcricaoId] || 'corretor',
            tom: tomPorTrans[transcricaoId] || 'confronto'
          })
        }
      )
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Erro ao extrair')
      // Recarrega a transcrição para pegar os temas_brutos atualizados
      const { data: trans } = await supabase
        .from('transcricoes')
        .select('*')
        .eq('id', transcricaoId)
        .single()
      if (trans) {
        setTranscricoes(prev => prev.map(t => t.id === transcricaoId ? trans : t))
      }
    } catch (e) {
      console.error(e)
      alert('Erro ao extrair tensões: ' + e.message)
    } finally {
      setGerandoTensao(prev => ({ ...prev, [key]: false }))
    }
  }

  const toggleGuia = (key) => {
    setGuiasAbertos(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-white/[0.06] px-6 py-4">
        <h1 className="text-sm font-medium text-[#E8E6E1]">📚 Biblioteca de Transcrições</h1>
        <p className="text-xs text-white/30 mt-0.5">{transcricoes.length} transcrições salvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 mb-6">
          <h2 className="text-sm font-medium mb-3">➕ Nova Transcrição</h2>
          <div className="flex gap-2 mb-3">
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Título (opcional)..."
              className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-[#E8E6E1] placeholder-white/20"
            />
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-2 text-xs text-white/50"
            >
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Cole aqui o conteúdo da transcrição, aula, podcast ou qualquer texto..."
            rows={4}
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-[#E8E6E1] placeholder-white/20 resize-none"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleProcessar}
              disabled={processando || !texto.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/25 rounded-lg text-sm text-violet-300 transition-all disabled:opacity-40"
            >
              {processando ? <><SpinIcon /> Processando...</> : <>◈ Processar Transcrição</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-white/30">Carregando...</div>
        ) : transcricoes.length === 0 ? (
          <div className="text-center py-12 text-white/30">Nenhuma transcrição salva ainda.</div>
        ) : (
          <div className="space-y-4">
            {transcricoes.map(trans => (
              <div key={trans.id} className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === trans.id ? null : trans.id)}
                  className="w-full p-4 text-left hover:bg-white/[0.02] transition flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full">{trans.tipo}</span>
                      <span className="text-[10px] text-white/30">
                        {new Date(trans.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h3 className="font-medium text-[#E8E6E1]">{trans.titulo}</h3>
                    {trans.resumo && <p className="text-xs text-white/40 mt-1 line-clamp-2">{trans.resumo}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-white/30">📊 {trans.roteiros_gerados || 0} roteiros</span>
                      {trans.temas_brutos?.length > 0 && (
                        <span className="text-xs text-white/30">⚡ {trans.temas_brutos.length} tensões</span>
                      )}
                    </div>
                  </div>
                  <span className="text-white/30 text-lg">{expandedId === trans.id ? '−' : '+'}</span>
                </button>

                <AnimatePresence>
                  {expandedId === trans.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/[0.06]"
                    >
                      <div className="p-4 space-y-4">
                        {trans.resumo && (
                          <div>
                            <div className="text-[10px] uppercase text-white/30 mb-1">📝 Resumo</div>
                            <p className="text-sm text-white/60">{trans.resumo}</p>
                          </div>
                        )}

                        {/* Extrair tensões — com público e tom */}
                        {(!trans.temas_brutos || trans.temas_brutos.length === 0) && (
                          <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg space-y-2">
                            <span className="text-[10px] uppercase text-white/25">
                              {trans.status === 'processado' ? '⚠️ Sem tensões' : '⏳ Tensões não extraídas'}
                            </span>

                            {/* Público */}
                            <div className="flex gap-1.5">
                              <span className="text-[10px] text-white/30 self-center">Público:</span>
                              {[
                                { id: 'corretor',     label: '👔 Corretor'     },
                                { id: 'proprietario', label: '🏠 Proprietário' },
                              ].map(({ id, label }) => (
                                <button key={id}
                                  onClick={() => setPublicoPorTrans(prev => ({ ...prev, [trans.id]: id }))}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] transition border ${
                                    (publicoPorTrans[trans.id] || 'corretor') === id
                                      ? 'bg-violet-500/20 border-violet-500/30 text-violet-300'
                                      : 'bg-white/[0.03] border-white/[0.06] text-white/25 hover:bg-white/[0.07]'
                                  }`}>
                                  {label}
                                </button>
                              ))}
                            </div>

                            {/* Tom */}
                            <div className="flex gap-1.5">
                              <span className="text-[10px] text-white/30 self-center">Tom:</span>
                              {[
                                { id: 'confronto', label: '⚡ Confronto' },
                                { id: 'ajuda',     label: '🤝 Ajuda'     },
                              ].map(({ id, label }) => (
                                <button key={id}
                                  onClick={() => setTomPorTrans(prev => ({ ...prev, [trans.id]: id }))}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] transition border ${
                                    (tomPorTrans[trans.id] || 'confronto') === id
                                      ? id === 'confronto'
                                        ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                                        : 'bg-teal-500/20 border-teal-500/30 text-teal-300'
                                      : 'bg-white/[0.03] border-white/[0.06] text-white/25 hover:bg-white/[0.07]'
                                  }`}>
                                  {label}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() => extrairTensoes(trans.id)}
                              disabled={gerandoTensao[`tensoes_${trans.id}`]}
                              className="w-full text-xs px-3 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg transition disabled:opacity-40 flex items-center justify-center gap-1.5"
                            >
                              {gerandoTensao[`tensoes_${trans.id}`] ? <><SpinIcon /> Extraindo...</> : '⚡ Extrair tensões'}
                            </button>
                          </div>
                        )}

                        {trans.temas_brutos?.length > 0 && (
                          <div>
                            <div className="text-[10px] uppercase text-white/30 mb-2">⚡ Tensões extraídas</div>
                            <div className="space-y-3">
                              {trans.temas_brutos.map((tensao, idx) => {
                                const key = `${trans.id}_${idx}`
                                const guia = guiasPorTensao[key]
                                const gerando = gerandoTensao[key]
                                const guiaAberto = guiasAbertos[key]
                                return (
                                  <div key={idx} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-sm font-medium text-[#E8E6E1]}">{tensao.tensao || tensao.tema}</p>
                                          {guia && (
                                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                                              ✅ Guia gerado
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                          {tensao.gatilhos?.map(g => <span key={g} className={`text-[10px] px-2 py-0.5 rounded-full ${GATILHO_COLORS[g] || 'bg-white/10 text-white/40'}`}>{g}</span>)}
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${POTENCIAL_COLORS[tensao.potencial] || POTENCIAL_COLORS.medio}`}>
                                            potencial: {tensao.potencial_viral || tensao.potencial || 'médio'}
                                          </span>
                                        </div>
                                        {tensao.antagonista && <p className="text-xs text-white/40 mt-2">🎭 Antagonista: {tensao.antagonista}</p>}
                                        {tensao.formato_ideal && FORMATO_ICONES[tensao.formato_ideal] && (
                                          <p className="text-xs text-white/40 mt-1">🎬 {FORMATO_ICONES[tensao.formato_ideal]}</p>
                                        )}
                                      </div>
                                      {!guia ? (
                                        <button
                                          onClick={() => gerarGuiaParaTensao(trans, tensao, idx)}
                                          disabled={gerando}
                                          className="ml-2 text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 px-2 py-1 rounded whitespace-nowrap"
                                        >
                                          {gerando ? <SpinIcon /> : '🎬 Gerar guia profundo'}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => toggleGuia(key)}
                                          className="ml-2 text-xs bg-white/10 hover:bg-white/20 text-white/60 px-2 py-1 rounded whitespace-nowrap"
                                        >
                                          {guiaAberto ? '▼ Ocultar' : '▶ Mostrar guia'}
                                        </button>
                                      )}
                                    </div>
                                    {guia && guiaAberto && (
                                      <div className="mt-3 p-3 bg-white/[0.05] rounded-md space-y-2 text-sm">
                                        <div><span className="text-[10px] uppercase text-white/30">🎬 GANCHO</span><p className="text-amber-400">"{guia.gancho}"</p></div>
                                        <div><span className="text-[10px] uppercase text-white/30">🧠 LINHA DE RACIOCÍNIO</span><p className="text-white/80">{guia.linha_de_raciocinio}</p></div>
                                        <div><span className="text-[10px] uppercase text-white/30">📝 TÓPICOS</span><ul className="list-disc list-inside text-white/60 text-sm">{guia.topicos?.map((t,i)=><li key={i}>{t}</li>)}</ul></div>
                                        <div><span className="text-[10px] uppercase text-white/30">💬 FRASES IMPACTO</span>{guia.frases_impacto?.map((f,i)=><p key={i} className="text-white/50 italic">"{f}"</p>)}</div>
                                        <div><span className="text-[10px] uppercase text-white/30">📢 CTA</span><p className="text-emerald-400">"{guia.cta}"</p></div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}