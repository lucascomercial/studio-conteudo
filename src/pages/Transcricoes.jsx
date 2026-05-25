// src/pages/Transcricoes.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { callOpenAIJSON, callOpenAIJSONPremium } from '../lib/openai'
import { prompts } from '../lib/prompts'
import MapaMentalProfundo from '../components/MapaMentalProfundo'

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

  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('aula')
  const [texto, setTexto] = useState('')
  const [processando, setProcessando] = useState(false)
  const [modalGuia, setModalGuia] = useState(null) // { guia, tensao, trans, idx }
  const [recriandoKey, setRecriandoKey] = useState(null)

  useEffect(() => {
    carregarTranscricoes()
  }, [])

  async function carregarTranscricoes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('transcricoes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setTranscricoes(data || [])
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
      // Verificar se já existe guia
      const { data: guiaExistente } = await supabase
        .from('guias_profundas')
        .select('*')
        .eq('tensao_texto', tensao.tensao)
        .maybeSingle()

      let guia
      if (guiaExistente) {
        guia = guiaExistente
      } else {
        // 1. Salvar a tensão primeiro (para ter ID)
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
        const tensaoId = tensaoInserida[0].id

        // 2. Gerar guia diretamente
        const guiaGerado = await callOpenAIJSONPremium(prompts.extrairGuiaEstrategica(tensao))

        // 3. Salvar guia
        const { data: inserted, error } = await supabase
          .from('guias_profundas')
          .insert({
            tensao_id: tensaoId,
            tensao_texto: tensao.tensao,
            titulo: tensao.tensao.substring(0, 80),
            publico_alvo: guiaGerado.publico,
            gancho: guiaGerado.sugestoes_de_gancho?.[0] || '',
            sugestoes_de_gancho: guiaGerado.sugestoes_de_gancho,
            direcao: guiaGerado.direcao,
            comportamentos_reais: guiaGerado.comportamentos_reais,
            o_que_essa_pessoa_acredita: guiaGerado.o_que_essa_pessoa_acredita,
            erro_invisivel: guiaGerado.erro_invisivel,
            o_que_realmente_doi: guiaGerado.o_que_realmente_doi,
            o_que_mercado_pensa: guiaGerado.o_que_mercado_pensa,
            contraste: guiaGerado.contraste,
            alma_do_conteudo: guiaGerado.alma_do_conteudo,
            sensacao_final: guiaGerado.sensacao_final,
            topicos: guiaGerado.topicos,
            frases_fortes: guiaGerado.frases_impacto,
            energia_ideal: guiaGerado.energia_ideal,
            cta: guiaGerado.cta,
            status: 'pendente',
          })
          .select()
        if (error) throw error
        guia = inserted[0]
      }

      setGuiasPorTensao(prev => ({ ...prev, [key]: guia }))
      setGuiasAbertos(prev => ({ ...prev, [key]: true }))
    } catch (err) {
      console.error(err)
      alert('Erro ao gerar guia: ' + err.message)
    } finally {
      setGerandoTensao(prev => ({ ...prev, [key]: false }))
    }
  }

  const recriarGuia = async (tensao, trans, idx) => {
    const key = `${trans.id}_${idx}`
    setRecriandoKey(key)
    try {
      // Deleta guia existente pelo texto da tensão
      await supabase.from('guias_profundas').delete().eq('tensao_texto', tensao.tensao || tensao.tema)
      // Remove do estado local
      setGuiasPorTensao(prev => { const n = {...prev}; delete n[key]; return n })
      // Gera nova guia
      await gerarGuiaParaTensao(trans, tensao, idx)
    } catch (err) {
      console.error(err)
      alert('Erro ao recriar: ' + err.message)
    } finally {
      setRecriandoKey(null)
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
        {/* Nova transcrição */}
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
                                        <p className="text-sm font-medium text-[#E8E6E1]}">{tensao.tensao || tensao.tema}</p>
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
                                      <button
                                        onClick={() => gerarGuiaParaTensao(trans, tensao, idx)}
                                        disabled={gerando}
                                        className="ml-2 text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 px-2 py-1 rounded whitespace-nowrap"
                                      >
                                        {gerando ? <SpinIcon /> : '🎬 Gerar guia profundo'}
                                      </button>
                                    </div>
                                    {guia && (
                                      <div className="mt-3">
                                        <button
                                          onClick={() => toggleGuia(key)}
                                          className="text-[10px] uppercase text-white/30 hover:text-white/50 transition"
                                        >
                                          {guiaAberto ? '▼ Ocultar guia' : '▶ Mostrar guia'}
                                        </button>
                                        {guiaAberto && (
                                          <div className="mt-2 p-3 bg-white/[0.05] rounded-md space-y-2 text-sm">
                                            {/* Preview rápido */}
                                            <div><span className="text-[10px] uppercase text-white/30">🎬 GANCHO</span><p className="text-amber-400">"{guia.gancho || guia.sugestoes_de_gancho?.[0]}"</p></div>
                                            {guia.tensao_principal && <div><span className="text-[10px] uppercase text-white/30">⚡ TENSÃO</span><p className="text-white/80">{guia.tensao_principal}</p></div>}
                                            {guia.alma_do_conteudo && <div><span className="text-[10px] uppercase text-white/30">💡 ALMA</span><p className="text-violet-400 italic">"{guia.alma_do_conteudo}"</p></div>}
                                            <div><span className="text-[10px] uppercase text-white/30">📢 CTA</span><p className="text-emerald-400">"{guia.cta}"</p></div>
                                            <div className="flex gap-2 pt-2">
                                              <button
                                                onClick={() => setModalGuia({ guia, tensao, trans, idx })}
                                                className="text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 px-3 py-1.5 rounded transition"
                                              >
                                                🧠 Ver guia completo
                                              </button>
                                              <button
                                                onClick={() => recriarGuia(tensao, trans, idx)}
                                                disabled={recriandoKey === key}
                                                className="text-xs bg-white/10 hover:bg-white/20 text-white/50 px-3 py-1.5 rounded transition disabled:opacity-40"
                                              >
                                                {recriandoKey === key ? '⏳ Recriando...' : '🔄 Recriar'}
                                              </button>
                                            </div>
                                          </div>
                                        )}
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

      {/* Modal guia completo */}
      <AnimatePresence>
        {modalGuia && (
          <MapaMentalProfundo
            guia={modalGuia.guia}
            onClose={() => setModalGuia(null)}
            onRecriar={async () => {
              await recriarGuia(modalGuia.tensao, modalGuia.trans, modalGuia.idx)
              setModalGuia(null)
            }}
          />
        )}
      </AnimatePresence>
  )
}