// src/pages/GravacaoRapida.jsx
// Modo foco — só o que está programado para HOJE, em ordem
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

export default function GravacaoRapida() {
  const [guias, setGuias]           = useState([])
  const [index, setIndex]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [salvando, setSalvando]     = useState(false)
  const [feedback, setFeedback]     = useState(null)
  const [verRoteiro, setVerRoteiro] = useState(false)
  const [verTira, setVerTira]       = useState(false)
  const [gerandoTira, setGerandoTira]     = useState(false)
  const [gerandoRoteiro, setGerandoRoteiro] = useState(false)
  const [formatoRoteiro, setFormatoRoteiro] = useState('corrido')
  const [editando, setEditando] = useState(false)
  const [textoEditado, setTextoEditado] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [tomRoteiro, setTomRoteiro] = useState('confronto')
  const [modalMetricas, setModalMetricas] = useState(false)
  const [views, setViews] = useState('')
  const [likes, setLikes] = useState('')

  const hoje = new Date().toISOString().split('T')[0]

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    setIndex(0)
    setVerRoteiro(false)

    const { data } = await supabase
      .from('guias_profundas')
      .select(`id, titulo, tensao_texto, gancho, sugestoes_de_gancho,
               alma_do_conteudo, como_isso_vira_conteudo_de_camera,
               micro_cenas, frases_fortes, cta, roteiro_video, roteiro_cortes,
               tira_teleprompter, roteiro_aprovado, tom_roteiro,
               energia_ideal, publico_alvo, emocao, potencial_viral,
               status, tipo_gancho, tipo_verdade, dia_gravacao, ordem_dia`)
      .eq('dia_gravacao', hoje)
      .neq('status', 'publicado')
      .order('ordem_dia', { ascending: true })

    setGuias(data || [])
    setLoading(false)
  }

  const guia = guias[index]
  const gancho = guia?.gancho ||
    (Array.isArray(guia?.sugestoes_de_gancho) && guia.sugestoes_de_gancho[0]) || ''

  const salvarEdicao = async () => {
    if (!guia?.id || !textoEditado.trim()) return
    setSalvandoEdicao(true)
    const campo = formatoRoteiro === 'cortes' ? 'roteiro_cortes' : 'roteiro_video'
    await supabase.from('guias_profundas').update({ [campo]: textoEditado }).eq('id', guia.id)
    setGuias(prev => prev.map(g => g.id === guia.id ? { ...g, [campo]: textoEditado } : g))
    setSalvandoEdicao(false)
    setEditando(false)
  }

  const iniciarEdicao = () => {
    const texto = formatoRoteiro === 'cortes' ? guia?.roteiro_cortes : guia?.roteiro_video
    setTextoEditado(texto || '')
    setEditando(true)
    setVerRoteiro(true)
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

  const gerarNovoRoteiro = async (estilo = formatoRoteiro) => {
    if (!guia?.id) return
    setGerandoRoteiro(true)
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-roteiro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ guia_id: guia.id, estilo, tom: tomRoteiro })
      })
      const data = await resp.json()
      if (data.roteiro) {
        const campo = estilo === 'cortes' ? 'roteiro_cortes' : 'roteiro_video'
        setGuias(prev => prev.map(g => g.id === guia.id ? { ...g, [campo]: data.roteiro } : g))
        setVerRoteiro(true)
        setFormatoRoteiro(estilo)
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
      ? { ...g, views_publicado: parseInt(views) || 0, likes_publicado: parseInt(likes) || 0 } : g))
  }

  const atualizarStatus = async (novoStatus) => {
    if (!guia || salvando) return
    setSalvando(true)
    await supabase.from('guias_profundas')
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', guia.id)
    setFeedback(novoStatus)

    if (novoStatus === 'gravado' && guia.roteiro_video && !guia.tira_teleprompter) {
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-tira`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ guia_id: guia.id })
      }).catch(() => {})
    }

    setTimeout(() => {
      setFeedback(null)
      setSalvando(false)
      setGuias(prev => prev.map(g => g.id === guia.id ? { ...g, status: novoStatus } : g))
      if (novoStatus === 'gravado') {
        setIndex(i => Math.min(i + 1, guias.length - 1))
        setVerRoteiro(false)
        setVerTira(false)
      }
    }, 800)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-white/25"><SpinIcon /></div>
  )

  // Vazio
  if (guias.length === 0) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 px-6 text-center">
      <div className="text-4xl opacity-20">🎬</div>
      <p className="text-white/40 text-sm">Nenhum vídeo programado para hoje</p>
      <p className="text-white/20 text-xs">Abra o Planner e arraste guias para hoje</p>
      <a href="/planner" className="text-xs text-violet-400 hover:text-violet-300 transition mt-2">
        Ir para o Planner →
      </a>
    </div>
  )

  const gravadosHoje = guias.filter(g => g.status === 'gravado' || g.status === 'publicado').length

  return (
    <div className="flex flex-col min-h-screen bg-[#0C0C0E]">

      {/* Header minimalista */}
      <div className="sticky top-0 z-10 bg-[#0C0C0E]/95 backdrop-blur border-b border-white/[0.05] px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-xs text-white/40">Hoje · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {guias.map((g, i) => (
                <button key={g.id} onClick={() => { setIndex(i); setVerRoteiro(false); setVerTira(false) }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === index ? 'bg-white/60 scale-125' :
                    g.status === 'gravado' ? 'bg-amber-400/60' :
                    g.status === 'publicado' ? 'bg-emerald-400/60' :
                    'bg-white/20'
                  }`} />
              ))}
            </div>
            <span className={`text-xs font-medium ${gravadosHoje >= guias.length ? 'text-emerald-400' : 'text-white/30'}`}>
              {gravadosHoje}/{guias.length}
            </span>
          </div>
        </div>
      </div>

      {/* Card principal */}
      {guia && (
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">

          {/* Status badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              guia.status === 'gravado' ? 'bg-amber-500/20 text-amber-400' :
              guia.status === 'publicado' ? 'bg-emerald-500/20 text-emerald-400' :
              'bg-white/10 text-white/30'
            }`}>
              {guia.status === 'gravado' ? '🎬 Gravado' : guia.status === 'publicado' ? '📱 Publicado' : '📝 Pendente'}
            </span>
            <span className="text-[10px] text-white/20">{guia.publico_alvo === 'proprietario' ? '🏠 Proprietário' : '👔 Corretor'}</span>
            {(guia.potencial_viral || 0) >= 7 && <span className="text-[10px] text-red-400">🔥 {guia.potencial_viral}</span>}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={guia.id} onAnimationStart={() => { setEditando(false); setVerRoteiro(false) }}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }} className="flex flex-col gap-4">

              <h1 className="text-xl font-medium text-[#E8E6E1] leading-snug tracking-tight">
                {guia.titulo || guia.tensao_texto}
              </h1>

              {gancho && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="text-[10px] uppercase tracking-widest text-amber-400/60 mb-2">🎬 Gancho</div>
                  <p className="text-[15px] text-[#E8E6E1] font-medium leading-relaxed">"{gancho}"</p>
                </div>
              )}

              {guia.como_isso_vira_conteudo_de_camera && (
                <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                  <div className="text-[10px] uppercase tracking-widest text-violet-400/60 mb-1.5">🎙️ Frase para câmera</div>
                  <p className="text-sm text-white/75 italic">"{guia.como_isso_vira_conteudo_de_camera}"</p>
                </div>
              )}

              {guia.alma_do_conteudo && (
                <div className="text-center py-3 border border-white/[0.08] rounded-xl bg-white/[0.02]">
                  <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">⚡ Alma</div>
                  <p className="text-sm font-medium text-amber-400">{guia.alma_do_conteudo}</p>
                </div>
              )}

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

              {guia.cta && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="text-[10px] uppercase tracking-widest text-emerald-400/60 mb-1">📢 CTA</div>
                  <p className="text-sm text-white/75">"{guia.cta}"</p>
                </div>
              )}

              {/* Roteiro — tabs corrido/cortes */}
              {(guia.roteiro_video || guia.roteiro_cortes) && (
                <div>
                  <div className="flex gap-1.5 mb-2">
                    {[{id:'corrido',label:'🎙️ Corrido',tem:!!guia.roteiro_video},{id:'cortes',label:'✂️ Cortes',tem:!!guia.roteiro_cortes}].map(({id,label,tem}) => (
                      <button key={id} onClick={() => { setFormatoRoteiro(id); setVerRoteiro(true) }}
                        className={`flex-1 py-2 rounded-lg text-xs transition border flex items-center justify-center gap-1.5 ${formatoRoteiro===id&&verRoteiro?'bg-white/[0.08] border-white/[0.12] text-white/70':'bg-white/[0.03] border-white/[0.06] text-white/30 hover:bg-white/[0.06]'}`}>
                        {label} {!tem&&<span className="text-[9px] text-white/20">gerar</span>}
                      </button>
                    ))}
                    <button onClick={() => setVerRoteiro(v=>!v)}
                      className="px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[10px] text-white/25 hover:bg-white/[0.06] transition">
                      {verRoteiro ? '▲' : '▼'}
                    </button>
                  </div>
                  <AnimatePresence>
                    {verRoteiro && (
                      <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                        {(formatoRoteiro==='corrido' ? guia.roteiro_video : guia.roteiro_cortes) ? (
                          editando ? (
                            <div className="space-y-2">
                              <textarea
                                value={textoEditado}
                                onChange={e => setTextoEditado(e.target.value)}
                                rows={12}
                                className="w-full bg-white/[0.04] border border-violet-500/30 rounded-xl px-4 py-3 text-sm text-[#E8E6E1] leading-relaxed resize-none focus:outline-none focus:border-violet-500/60 font-sans"
                              />
                              <div className="flex gap-2">
                                <button onClick={() => setEditando(false)}
                                  className="flex-1 py-2 bg-white/[0.06] rounded-lg text-xs text-white/40 hover:bg-white/[0.1] transition">
                                  Cancelar
                                </button>
                                <button onClick={salvarEdicao} disabled={salvandoEdicao}
                                  className="flex-1 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-40 flex items-center justify-center gap-1.5">
                                  {salvandoEdicao ? <><SpinIcon /> Salvando...</> : '✓ Salvar edição'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative group">
                              <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                                {formatoRoteiro==='cortes' ? (
                                  <pre className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap font-sans">{guia.roteiro_cortes}</pre>
                                ) : (
                                  <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{guia.roteiro_video}</p>
                                )}
                              </div>
                              <button
                                onClick={iniciarEdicao}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[10px] px-2 py-1 bg-white/[0.08] hover:bg-white/[0.15] text-white/50 rounded-lg transition-all"
                              >
                                ✏️ Editar
                              </button>
                            </div>
                          )
                        ) : (
                          <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-center">
                            <p className="text-xs text-white/30 mb-3">Roteiro {formatoRoteiro} não gerado</p>
                            <button onClick={() => gerarNovoRoteiro(formatoRoteiro)} disabled={gerandoRoteiro}
                              className="px-4 py-2 bg-violet-500/20 border border-violet-500/30 text-violet-300 rounded-lg text-xs hover:bg-violet-500/30 transition disabled:opacity-40">
                              {gerandoRoteiro ? <SpinIcon /> : `⚡ Gerar ${formatoRoteiro}`}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Tira teleprompter */}
              {guia.roteiro_video && (
                <div>
                  <div className="flex gap-2">
                    <button onClick={() => setVerTira(v=>!v)}
                      className="flex-1 flex items-center justify-between px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition">
                      <span className="text-xs text-white/40">📺 Tira teleprompter</span>
                      <span className="text-[10px] text-white/25">{verTira?'▲':'▼'}</span>
                    </button>
                    {!guia.tira_teleprompter && (
                      <button onClick={gerarTira} disabled={gerandoTira}
                        className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-white/40 hover:bg-white/[0.07] transition disabled:opacity-40">
                        {gerandoTira ? <SpinIcon /> : '⚡'}
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {verTira && guia.tira_teleprompter && (
                      <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                        <div className="mt-2 p-4 bg-black/40 border border-white/[0.08] rounded-xl font-mono">
                          <pre className="text-sm text-emerald-300/90 leading-relaxed whitespace-pre-wrap">{guia.tira_teleprompter}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Tom + feedback roteiro */}
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  <span className="text-[10px] text-white/25 self-center">Tom:</span>
                  {[{id:'confronto',label:'⚡ Confronto'},{id:'ajuda',label:'🤝 Ajuda'}].map(({id,label}) => (
                    <button key={id} onClick={() => setTomRoteiro(id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs transition border ${tomRoteiro===id?id==='confronto'?'bg-rose-500/20 border-rose-500/30 text-rose-300':'bg-teal-500/20 border-teal-500/30 text-teal-300':'bg-white/[0.03] border-white/[0.06] text-white/25 hover:bg-white/[0.07]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={aprovarRoteiro} disabled={guia.roteiro_aprovado}
                    className={`flex-1 py-2 rounded-lg text-xs transition border ${guia.roteiro_aprovado?'bg-emerald-500/20 border-emerald-500/30 text-emerald-400':'bg-white/[0.04] border-white/[0.07] text-white/30 hover:bg-white/[0.08]'}`}>
                    {guia.roteiro_aprovado ? '✓ Aprovado' : '👍 Aprovar roteiro'}
                  </button>
                  <button onClick={() => gerarNovoRoteiro(formatoRoteiro)} disabled={gerandoRoteiro}
                    className="flex-1 py-2 rounded-lg text-xs bg-white/[0.04] border border-white/[0.07] text-white/30 hover:bg-white/[0.08] transition disabled:opacity-40">
                    {gerandoRoteiro ? <SpinIcon /> : `🔄 Gerar outro`}
                  </button>
                </div>
              </div>

              {/* Publicar métricas */}
              {guia.status === 'publicado' && (
                <button onClick={() => setModalMetricas(true)}
                  className="w-full py-2 rounded-lg text-xs bg-white/[0.03] border border-white/[0.06] text-white/30 hover:bg-white/[0.07] transition">
                  📊 {guia.views_publicado > 0 ? `${guia.views_publicado.toLocaleString()} views · editar` : 'Registrar views e likes'}
                </button>
              )}

              {/* Ações principais */}
              <div className="space-y-2 pt-1">
                {guia.status !== 'gravado' && guia.status !== 'publicado' && (
                  <motion.button onClick={() => atualizarStatus('gravado')} disabled={salvando}
                    animate={feedback==='gravado'?{scale:[1,1.03,1]}:{}}
                    className={`w-full py-3 rounded-xl text-sm font-medium transition border ${feedback==='gravado'?'bg-amber-500/30 border-amber-500/40 text-amber-200':'bg-amber-500/15 border-amber-500/25 text-amber-400 hover:bg-amber-500/25'}`}>
                    {feedback==='gravado'?'✓ Marcado!':salvando?<SpinIcon />:'🎬 Marcar como gravado'}
                  </motion.button>
                )}
                {guia.status === 'gravado' && (
                  <motion.button onClick={() => atualizarStatus('publicado')} disabled={salvando}
                    animate={feedback==='publicado'?{scale:[1,1.03,1]}:{}}
                    className={`w-full py-3 rounded-xl text-sm font-medium transition border ${feedback==='publicado'?'bg-emerald-500/30 border-emerald-500/40 text-emerald-200':'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}>
                    {feedback==='publicado'?'✓ Publicado!':salvando?<SpinIcon />:'📱 Marcar como publicado'}
                  </motion.button>
                )}
                {(guia.status === 'gravado' || guia.status === 'publicado') && (
                  <button onClick={() => atualizarStatus('separado')} disabled={salvando}
                    className="w-full py-2 rounded-xl border border-white/[0.06] text-white/25 hover:text-white/45 text-xs transition">
                    ↩ Voltar para separado
                  </button>
                )}
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Modal métricas */}
      <AnimatePresence>
        {modalMetricas && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setModalMetricas(false)}>
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
              onClick={e => e.stopPropagation()}
              className="bg-[#141416] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm space-y-4">
              <h3 className="text-sm font-medium text-[#E8E6E1]">📊 Performance</h3>
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
                <button onClick={() => setModalMetricas(false)} className="flex-1 py-2 bg-white/[0.06] rounded-lg text-sm text-white/40">Cancelar</button>
                <button onClick={salvarMetricas} className="flex-1 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-sm text-emerald-400">Salvar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
