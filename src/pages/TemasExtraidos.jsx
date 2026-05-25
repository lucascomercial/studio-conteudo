// src/pages/TemasExtraidos.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { callOpenAIJSON, callOpenAIJSONPremium } from '../lib/openai'
import { prompts } from '../lib/prompts'

export default function TemasExtraidos() {
  const [transcricoes, setTranscricoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [gerandoIds, setGerandoIds] = useState(new Set())
  const [excluindoIds, setExcluindoIds] = useState(new Set())

  useEffect(() => {
    carregarTemas()
  }, [])

  async function carregarTemas() {
    setLoading(true)
    const { data, error } = await supabase
      .from('transcricoes')
      .select('id, titulo, temas_brutos, created_at')
      .order('created_at', { ascending: false })

    if (!error) setTranscricoes(data || [])
    setLoading(false)
  }

  const excluirTema = async (transcricaoId, temaIndex) => {
    const key = `${transcricaoId}-${temaIndex}`
    if (excluindoIds.has(key)) return
    setExcluindoIds(prev => new Set(prev).add(key))

    try {
      const transcricao = transcricoes.find(t => t.id === transcricaoId)
      if (!transcricao) return

      const novosTemas = [...(transcricao.temas_brutos || [])]
      novosTemas.splice(temaIndex, 1)

      const { error } = await supabase
        .from('transcricoes')
        .update({ temas_brutos: novosTemas })
        .eq('id', transcricaoId)

      if (error) throw error

      setTranscricoes(prev =>
        prev.map(t =>
          t.id === transcricaoId ? { ...t, temas_brutos: novosTemas } : t
        )
      )
    } catch (err) {
      console.error('Erro ao excluir tema:', err)
      alert('Erro ao excluir: ' + err.message)
    } finally {
      setExcluindoIds(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const gerarRoteiro = async (tema, transcricaoId, temaIndex) => {
    const key = `${transcricaoId}-${temaIndex}`
    if (gerandoIds.has(key)) return
    setGerandoIds(prev => new Set(prev).add(key))

    try {
      const tom = 'provocativo'
      const publico = 'corretor'
      const tituloVideo = transcricoes.find(t => t.id === transcricaoId)?.titulo || ''

      let roteiro
      try {
        // Tenta com modelo premium (gpt-4o)
        roteiro = await callOpenAIJSONPremium(
          prompts.gerarRoteiroDeTema(tema, tom, publico, tituloVideo)
        )
      } catch (err) {
        console.warn('Falha no modelo premium, usando fallback gpt-4o-mini:', err.message)
        roteiro = await callOpenAIJSON(
          prompts.gerarRoteiroDeTema(tema, tom, publico, tituloVideo)
        )
      }

      // Converte formato antigo (gancho+corpo) para o novo (hook+setup+...)
      let hook = roteiro.hook || roteiro.gancho
      let corpo = roteiro.corpo
      let cta = roteiro.cta

      if (!roteiro.setup && roteiro.gancho) {
        const frases = (roteiro.corpo || '').split(/\.\s+/).filter(f => f.length > 15)
        corpo = [
          frases[0] || '',
          frases[1] || '',
          frases[2] || '',
          frases[3] || '',
          frases[4] || ''
        ].join(' ')
        cta = roteiro.cta || ''
      } else if (roteiro.setup) {
        corpo = [
          roteiro.setup,
          roteiro.escalada_1,
          roteiro.escalada_2,
          roteiro.virada,
          roteiro.payoff
        ].filter(Boolean).join(' ')
        cta = roteiro.cta || ''
        hook = roteiro.hook
      }

      if (!corpo || corpo.length < 50) {
        throw new Error('Corpo do roteiro muito curto')
      }

      const { data, error } = await supabase
        .from('roteiros')
        .insert({
          titulo: roteiro.titulo || tema.tema?.substring(0, 60),
          gancho: hook,
          corpo: corpo,
          cta: cta,
          pilar: roteiro.pilar || 'mentalidade',
          publico: publico,
          tom: tom,
          duracao: '~90 seg',
          status: 'backlog',
          origem: 'transcricao',   // usa valor já aceito pela constraint
          potencial_viral: tema.potencial === 'alto' ? 5 : 3,
        })
        .select()

      if (error) throw error
      alert(`✅ Roteiro "${data[0].titulo}" salvo com sucesso!`)
    } catch (err) {
      console.error(err)
      alert('Erro ao gerar roteiro: ' + err.message)
    } finally {
      setGerandoIds(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const todosTemas = transcricoes.flatMap(trans =>
    (trans.temas_brutos || []).map((tema, idx) => ({
      ...tema,
      transcricaoId: trans.id,
      temaIndex: idx,
      videoTitulo: trans.titulo,
      videoData: trans.created_at,
    }))
  )

  const temasFiltrados = todosTemas.filter(t =>
    t.tema?.toLowerCase().includes(filtro.toLowerCase()) ||
    t.antagonista?.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-white/30">Carregando temas...</div>
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-medium text-[#E8E6E1]">🏷️ Todos os Temas Extraídos</h1>
          <p className="text-sm text-white/30 mt-1">
            {todosTemas.length} temas • {transcricoes.length} vídeos processados
          </p>
        </div>
        <input
          type="text"
          placeholder="Buscar tema ou antagonista..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-[#E8E6E1] placeholder-white/25 w-full sm:w-64"
        />
      </div>

      {temasFiltrados.length === 0 && (
        <div className="text-center py-12 text-white/30">Nenhum tema encontrado.</div>
      )}

      <div className="space-y-4">
        {temasFiltrados.map((tema, idx) => {
          const gerando = gerandoIds.has(`${tema.transcricaoId}-${tema.temaIndex}`)
          const excluindo = excluindoIds.has(`${tema.transcricaoId}-${tema.temaIndex}`)
          return (
            <div key={idx} className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#E8E6E1]">{tema.tema}</p>
                  {tema.antagonista && (
                    <p className="text-xs text-white/40 mt-1">↳ {tema.antagonista}</p>
                  )}
                </div>
                <div className="flex gap-1.5 items-center">
                  {tema.gatilhos?.slice(0, 3).map(g => (
                    <span key={g} className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-white/50">
                      {g}
                    </span>
                  ))}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    tema.potencial === 'alto' ? 'bg-emerald-500/20 text-emerald-400' :
                    tema.potencial === 'medio' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {tema.potencial || 'médio'}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-xs text-white/40 space-y-1">
                <div><span className="text-white/30">🎬 Vídeo:</span> {tema.videoTitulo || 'Sem título'}</div>
                {tema.consequencia_financeira && (
                  <div><span className="text-white/30">💰 Perda:</span> {tema.consequencia_financeira}</div>
                )}
                {tema.insight_central && (
                  <div><span className="text-white/30">💡 Insight:</span> {tema.insight_central}</div>
                )}
              </div>

              {tema.cenas_sugeridas?.length > 0 && (
                <div className="mt-3 pt-2 border-t border-white/[0.06]">
                  <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Cenas sugeridas</p>
                  <ul className="space-y-0.5">
                    {tema.cenas_sugeridas.slice(0, 2).map((cena, i) => (
                      <li key={i} className="text-xs text-white/35 flex gap-1">
                        <span>→</span> {cena}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-white/[0.06]">
                <button
                  onClick={() => excluirTema(tema.transcricaoId, tema.temaIndex)}
                  disabled={excluindo}
                  className="text-xs text-red-400/70 hover:text-red-400 transition disabled:opacity-40"
                >
                  {excluindo ? 'Excluindo...' : '🗑️ Excluir'}
                </button>
                <button
                  onClick={() => gerarRoteiro(tema, tema.transcricaoId, tema.temaIndex)}
                  disabled={gerando}
                  className="text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 px-3 py-1 rounded transition disabled:opacity-40"
                >
                  {gerando ? 'Gerando...' : '◈ Gerar roteiro'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}