// src/pages/GravacaoRapida.jsx
// Modo foco — funil separado → gravado → publicado
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

function SpinIcon() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

const STATUS = {
  separado:  { label: '🔵 Separado',  bg: 'bg-blue-500/20',     text: 'text-blue-400',    ring: 'ring-blue-500/40'    },
  gravado:   { label: '🎬 Gravado',   bg: 'bg-amber-500/20',    text: 'text-amber-400',   ring: 'ring-amber-500/40'   },
  publicado: { label: '📱 Publicado', bg: 'bg-emerald-500/20',  text: 'text-emerald-400', ring: 'ring-emerald-500/40' },
}

export default function GravacaoRapida() {
  const [guias, setGuias]           = useState([])
  const [index, setIndex]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [filtro, setFiltro]         = useState('separado')
  const [salvando, setSalvando]     = useState(false)
  const [feedback, setFeedback]     = useState(null)
  const [verRoteiro, setVerRoteiro] = useState(false)
  const [verTira, setVerTira] = useState(false)
  const [gerandoTira, setGerandoTira] = useState(false)
  const [gerandoRoteiro, setGerandoRoteiro] = useState(false)
  const [modalMetricas, setModalMetricas] = useState(false)
  const [views, setViews] = useState('')
  const [likes, setLikes] = useState('')
  const [contadores, setContadores] = useState({ separado: 0, gravado: 0, publicado: 0 })

  useEffect(() => { carregar(filtro) }, [filtro])

  async function carregar(status) {
    setLoading(true)
    setIndex(0)
    setVerRoteiro(false)
    const { data } = await supabase
      .from('guias_profundas')
      .select(`id, titulo, tensao_texto, gancho, sugestoes_de_gancho,
               alma_do_conteudo, como_isso_vira_conteudo_de_camera,
               micro_cenas, frases_fortes, cta, roteiro_video,
               energia_ideal, publico_alvo, emocao, potencial_viral,
               status, tipo_gancho, tipo_verdade, updated_at`)
      .eq('status', status)
      .order('potencial_viral', { ascending: false })
    setGuias(data || [])
    setLoading(false)
    buscarContadores()
  }

  async function buscarContadores() {
    const [s, g, p] = await Promise.all([
      supabase.from('guias_profundas').select('id', { count: 'exact', head: true }).eq('status', 'separado'),
      supabase.from('guias_profundas').select('id', { count: 'exact', head: true }).eq('status', 'gravado'),
      supabase.from('guias_profundas').select('id', { count: 'exact', head: true }).eq('status', 'publicado'),
    ])
    setContadores({ separado: s.count || 0, gravado: g.count || 0, publicado: p.count || 0 })
  }

  const gerarTira = async () => {
    if (!guia?.id || !guia?.roteiro_video) return
    setGerandoTira(true)
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-tira`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ guia_id: guia.id })
      })
      const data = await resp.json()
      if (data.tira) {
        setGuias(prev => prev.map(g => g.id === guia.id ? { ...g, tira_teleprompter: data.tira } : g))
        setVerTira(true)
      }
    } catch (e) { console.error(e) }
    finally { setGerandoTira(false) }
  }

  const gerarNovoRoteiro = async () => {
    if (!guia?.id) return
    setGerandoRoteiro(true)
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-roteiro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ guia_id: guia.id })
      })
      const data = await resp.json()
      if (data.roteiro) {
        setGuias(prev => prev.map(g => g.id === guia.id ? { ...g, roteiro_video: data.roteiro } : g))
        setVerRoteiro(true)
      }
    } catch (e) { console.error(e) }
    finally { setGerandoRoteiro(false) }
  }

  const aprovarRoteiro = async () => {
    if (!guia?.id) return
    await supabase.from('guias_profundas').update({ roteiro_aprovado: true }).eq('id', guia.id)
    setGuias(prev => prev.map(g => g.id === guia.id ? { ...g, roteiro_aprovado: true } : g))
  }

  const salvarMetricas = async () => {
    if (!guia?.id) return
    await supabase.from('guias_profundas').update({
      views_publicado: parseInt(views) || 0,
      likes_publicado: parseInt(likes) || 0,
    }).eq('id', guia.id)
    setModalMetricas(false)
    setViews(''); setLikes('')
    setGuias(prev => prev.map(g => g.id === guia.id
      ? { ...g, views_publicado: parseInt(views) || 0, likes_publicado: parseInt(likes) || 0 }
      : g))
  }

  const atualizarStatus = async (novoStatus) => {
    if (!guia || salvando) return
    setSalvando(true)
    await supabase.from('guias_profundas')
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', guia.id)
    setFeedback(novoStatus)

    // Se marcou como separado, gera tira de teleprompter em background
    if (novoStatus === 'gravado' && guia.roteiro_video && !guia.tira_teleprompter) {
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-tira`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ guia_id: guia.id })
      }).catch(e => console.warn('Tira em background falhou:', e))
    }

    setTimeout(() => {
      setFeedback(null)
      setSalvando(false)
      setGuias(prev => prev.filter(g => g.id !== guia.id))
      setIndex(i => Math.min(i, Math.max(0, guias.length - 2)))
      buscarContadores()
    }, 900)
  }

  const guia = guias[index]
  const gancho = guia?.gancho ||
    (Array.isArray(guia?.sugestoes_de_gancho) && guia.sugestoes_de_gancho[0]) || ''

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-white/25"><SpinIcon /></div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-[#0C0C0E]">

      {/* Header — funil de 3 etapas */}
      <div className="sticky top-0 z-10 bg-[#0C0C0E]/95 backdrop-blur border-b border-white/[0.05] px-4 py-3">
        <div className="flex gap-2 max-w-lg mx-auto">
          {Object.keys(STATUS).map((s, i) => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                filtro === s
                  ? `${STATUS[s].bg} ${STATUS[s].text} ring-1 ${STATUS[s].ring}`
                  : 'bg-white/[0.03] text-white/20 hover:bg-white/[0.06] hover:text-white/35'
              }`}
            >
              {STATUS[s].label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filtro === s ? 'bg-black/20' : 'bg-white/[0.06]'}`}>
                {contadores[s]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista vazia */}
      {guias.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6 text-center">
          <div className="text-4xl opacity-10">
            {filtro === 'separado' ? '🔵' : filtro === 'gravado' ? '🎬' : '📱'}
          </div>
          <p className="text-white/25 text-sm">
            {filtro === 'separado'
              ? 'Nenhuma guia separada para gravação'
              : filtro === 'gravado'
              ? 'Nenhuma guia gravada ainda'
              : 'Nenhuma guia publicada ainda'}
          </p>
          {filtro !== 'separado' && (
            <button onClick={() => setFiltro('separado')}
              className="text-xs text-white/30 hover:text-white/50 transition mt-1">
              Ver separadas →
            </button>
          )}
          {filtro === 'separado' && (
            <p className="text-xs text-white/20 mt-1">
              Vá em Roteiros e marque guias como "Separado"
            </p>
          )}
        </div>
      )}

      {/* Card de gravação */}
      {guia && (
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">

          {/* Progresso */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs text-white/20">{index + 1} / {guias.length}</span>
            <div className="flex items-center gap-2">
              {guia.emocao && <span className="text-[10px] text-white/25">{guia.emocao}</span>}
              {(guia.potencial_viral || 0) >= 7 && (
                <span className="text-[10px] text-red-400 font-medium">🔥 {guia.potencial_viral}</span>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={guia.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4"
            >
              {/* Tensão */}
              <h1 className="text-xl font-medium text-[#E8E6E1] leading-snug tracking-tight">
                {guia.titulo || guia.tensao_texto}
              </h1>

              {/* Gancho — destaque */}
              {gancho && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="text-[10px] uppercase tracking-widest text-amber-400/60 mb-2">
                    🎬 Gancho {guia.tipo_gancho ? `· ${guia.tipo_gancho}` : ''}
                  </div>
                  <p className="text-[15px] text-[#E8E6E1] font-medium leading-relaxed">
                    "{gancho}"
                  </p>
                </div>
              )}

              {/* Frase para câmera */}
              {guia.como_isso_vira_conteudo_de_camera && (
                <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                  <div className="text-[10px] uppercase tracking-widest text-violet-400/60 mb-1.5">🎙️ Frase para câmera</div>
                  <p className="text-sm text-white/75 italic">"{guia.como_isso_vira_conteudo_de_camera}"</p>
                </div>
              )}

              {/* Alma */}
              {guia.alma_do_conteudo && (
                <div className="text-center py-3 border border-white/[0.08] rounded-xl bg-white/[0.02]">
                  <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">⚡ Alma</div>
                  <p className="text-sm font-medium text-amber-400">{guia.alma_do_conteudo}</p>
                </div>
              )}

              {/* Energia */}
              {guia.energia_ideal && (
                <div className="grid grid-cols-3 gap-2">
                  {['inicio', 'meio', 'final'].map(e => (
                    <div key={e} className="text-center p-2 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                      <div className="text-[9px] uppercase text-white/20 mb-0.5">{e}</div>
                      <div className="text-xs text-white/55">{guia.energia_ideal?.[e]}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Micro-cenas */}
              {guia.micro_cenas?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/20 mb-2">🎥 Cenas</div>
                  <ul className="space-y-1.5">
                    {guia.micro_cenas.slice(0, 3).map((c, i) => (
                      <li key={i} className="flex gap-2 text-xs text-white/45">
                        <span className="text-white/20 shrink-0">→</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Frases de impacto */}
              {guia.frases_fortes?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/20 mb-2">💬 Frases</div>
                  <ul className="space-y-1.5">
                    {guia.frases_fortes.slice(0, 3).map((f, i) => (
                      <li key={i} className="text-xs text-white/50 border-l border-white/[0.08] pl-2.5 italic">"{f}"</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              {guia.cta && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="text-[10px] uppercase tracking-widest text-emerald-400/60 mb-1">📢 CTA</div>
                  <p className="text-sm text-white/75">"{guia.cta}"</p>
                </div>
              )}

              {/* Roteiro colapsável */}
              {guia.roteiro_video && (
                <div>
                  <button onClick={() => setVerRoteiro(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition">
                    <span className="text-xs text-white/40">🎙️ Roteiro completo</span>
                    <span className="text-[10px] text-white/25">{verRoteiro ? '▲ Ocultar' : '▼ Ver'}</span>
                  </button>
                  <AnimatePresence>
                    {verRoteiro && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-2 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                          <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{guia.roteiro_video}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Tira de teleprompter */}
              {guia.roteiro_video && (
                <div>
                  <div className="flex items-center justify-between">
                    <button onClick={() => setVerTira(v => !v)}
                      className="flex-1 flex items-center justify-between px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition mr-2">
                      <span className="text-xs text-white/40">📺 Tira teleprompter</span>
                      <span className="text-[10px] text-white/25">{verTira ? '▲' : '▼'}</span>
                    </button>
                    {!guia.tira_teleprompter && (
                      <button onClick={gerarTira} disabled={gerandoTira}
                        className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-white/40 hover:bg-white/[0.07] transition disabled:opacity-40 whitespace-nowrap">
                        {gerandoTira ? <SpinIcon /> : '⚡ Gerar'}
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {verTira && guia.tira_teleprompter && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-2 p-4 bg-black/40 border border-white/[0.08] rounded-xl font-mono">
                          <pre className="text-sm text-emerald-300/90 leading-relaxed whitespace-pre-wrap">{guia.tira_teleprompter}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Feedback de roteiro */}
              {guia.roteiro_video && filtro === 'separado' && (
                <div className="flex gap-2">
                  <button onClick={aprovarRoteiro} disabled={guia.roteiro_aprovado}
                    className={`flex-1 py-2 rounded-lg text-xs transition border ${
                      guia.roteiro_aprovado
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/[0.04] border-white/[0.07] text-white/30 hover:bg-white/[0.08]'
                    }`}>
                    {guia.roteiro_aprovado ? '✓ Roteiro aprovado' : '👍 Aprovar roteiro'}
                  </button>
                  <button onClick={gerarNovoRoteiro} disabled={gerandoRoteiro}
                    className="flex-1 py-2 rounded-lg text-xs bg-white/[0.04] border border-white/[0.07] text-white/30 hover:bg-white/[0.08] transition">
                    {gerandoRoteiro ? <SpinIcon /> : '🔄 Gerar outro'}
                  </button>
                </div>
              )}

              {/* Métricas ao publicar */}
              {filtro === 'publicado' && (
                <div>
                  {guia.views_publicado > 0 ? (
                    <div className="flex gap-3 px-3 py-2 bg-white/[0.03] rounded-lg text-xs text-white/40">
                      <span>👁️ {guia.views_publicado.toLocaleString()} views</span>
                      <span>❤️ {guia.likes_publicado?.toLocaleString() || 0} likes</span>
                      <button onClick={() => setModalMetricas(true)} className="ml-auto text-white/25 hover:text-white/50">editar</button>
                    </div>
                  ) : (
                    <button onClick={() => setModalMetricas(true)}
                      className="w-full py-2 rounded-lg text-xs bg-white/[0.03] border border-white/[0.06] text-white/30 hover:bg-white/[0.07] transition">
                      📊 Registrar views e likes
                    </button>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="space-y-2 pt-2">
                {/* Navegação */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIndex(i => Math.max(0, i-1)); setVerRoteiro(false) }}
                    disabled={index === 0}
                    className="px-3 py-2.5 rounded-lg border border-white/[0.06] text-white/25 hover:text-white/50 transition disabled:opacity-20 text-sm"
                  >←</button>
                  <button
                    onClick={() => { setIndex(i => Math.min(guias.length-1, i+1)); setVerRoteiro(false) }}
                    disabled={index >= guias.length - 1}
                    className="flex-1 py-2.5 rounded-lg border border-white/[0.06] text-white/25 hover:text-white/45 text-sm transition disabled:opacity-20"
                  >Próxima →</button>
                </div>

                {/* Botões de avanço no funil */}
                <div className="flex gap-2">
                  {filtro === 'separado' && (
                    <motion.button
                      onClick={() => atualizarStatus('gravado')}
                      disabled={salvando}
                      animate={feedback === 'gravado' ? { scale: [1, 1.03, 1] } : {}}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition border ${
                        feedback === 'gravado'
                          ? 'bg-amber-500/30 border-amber-500/40 text-amber-200'
                          : 'bg-amber-500/15 border-amber-500/25 text-amber-400 hover:bg-amber-500/25'
                      }`}
                    >
                      {feedback === 'gravado' ? '✓ Gravado!' : salvando ? <SpinIcon /> : '🎬 Marcar como gravado'}
                    </motion.button>
                  )}

                  {filtro === 'gravado' && (
                    <motion.button
                      onClick={() => atualizarStatus('publicado')}
                      disabled={salvando}
                      animate={feedback === 'publicado' ? { scale: [1, 1.03, 1] } : {}}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition border ${
                        feedback === 'publicado'
                          ? 'bg-emerald-500/30 border-emerald-500/40 text-emerald-200'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {feedback === 'publicado' ? '✓ Publicado!' : salvando ? <SpinIcon /> : '📱 Marcar como publicado'}
                    </motion.button>
                  )}

                  {filtro === 'publicado' && (
                    <div className="flex-1 py-3 rounded-xl text-sm text-center text-emerald-400/50 border border-emerald-500/10">
                      ✓ Publicado
                    </div>
                  )}

                  {/* Voltar etapa */}
                  <button
                    onClick={() => atualizarStatus(
                      filtro === 'gravado' ? 'separado' :
                      filtro === 'publicado' ? 'gravado' : 'pendente'
                    )}
                    disabled={salvando}
                    className="px-3 py-3 rounded-xl border border-white/[0.06] text-white/25 hover:text-white/45 text-xs transition"
                    title="Voltar etapa"
                  >↩</button>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Gravados hoje */}
      <GravadosHoje key={filtro} />

      {/* Modal de métricas */}
      <AnimatePresence>
        {modalMetricas && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setModalMetricas(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#141416] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm space-y-4">
              <h3 className="text-sm font-medium text-[#E8E6E1]">📊 Registrar performance</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase text-white/30 mb-1 block">Views</label>
                  <input type="number" value={views} onChange={e => setViews(e.target.value)} placeholder="0"
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-[#E8E6E1] placeholder-white/20" />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-white/30 mb-1 block">Likes</label>
                  <input type="number" value={likes} onChange={e => setLikes(e.target.value)} placeholder="0"
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-[#E8E6E1] placeholder-white/20" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModalMetricas(false)}
                  className="flex-1 py-2 bg-white/[0.06] rounded-lg text-sm text-white/40">Cancelar</button>
                <button onClick={salvarMetricas}
                  className="flex-1 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-sm text-emerald-400">Salvar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function GravadosHoje() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0]
    supabase.from('guias_profundas')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'gravado')
      .gte('updated_at', hoje)
      .then(({ count: c }) => setCount(c || 0))
  }, [])

  if (count === null) return null
  return (
    <div className="py-6 text-center border-t border-white/[0.04]">
      <p className="text-2xl font-medium text-white/15">{count}</p>
      <p className="text-[10px] uppercase tracking-widest text-white/15 mt-0.5">gravados hoje</p>
    </div>
  )
}
