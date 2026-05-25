// src/pages/Aulas.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function SpinIcon({ size = 4 }) {
  return (
    <svg className={`animate-spin w-${size} h-${size} shrink-0`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function Aulas() {
  const [aulas, setAulas] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [processandoAula, setProcessandoAula] = useState(null)
  const [tensoesPorAula, setTensoesPorAula] = useState({})
  const [guias, setGuias] = useState({})
  const [gerandoGuiaId, setGerandoGuiaId] = useState(null)
  const [error, setError] = useState(null)

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

  useEffect(() => {
    carregarAulas()
  }, [])

  async function carregarAulas() {
    setLoading(true)
    setError(null)
    const { data: aulasData, error: aulasError } = await supabase
      .from('aulas')
      .select('*')
      .order('ordem', { ascending: true })
    if (aulasError) {
      console.error(aulasError)
      setError('Erro ao carregar aulas: ' + aulasError.message)
      setLoading(false)
      return
    }
    setAulas(aulasData || [])
    for (const aula of aulasData || []) {
      const { data: tensoes, error: tensoesError } = await supabase
        .from('tensoes')
        .select('*')
        .eq('aula_id', aula.id)
      if (tensoesError) console.error(tensoesError)
      setTensoesPorAula(prev => ({ ...prev, [aula.id]: tensoes || [] }))
    }
    setLoading(false)
  }

  async function extrairTensoes(aulaId) {
    setProcessandoAula(aulaId)
    setError(null)
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/extrair-tensoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ aula_id: aulaId })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)

      // Recarregar tensões da aula
      const { data: novasTensoes } = await supabase
        .from('tensoes')
        .select('*')
        .eq('aula_id', aulaId)
      setTensoesPorAula(prev => ({ ...prev, [aulaId]: novasTensoes || [] }))
      setAulas(prev => prev.map(a => a.id === aulaId ? { ...a, status: 'conceitos_extraidos' } : a))
      alert(`✅ ${result.inserted || novasTensoes?.length || 0} tensões extraídas!`)
    } catch (err) {
      console.error(err)
      setError(`Erro ao extrair tensões: ${err.message}`)
      alert(`Erro: ${err.message}`)
    } finally {
      setProcessandoAula(null)
    }
  }

  async function gerarMapaMental(tensaoId, tensaoTexto) {
    setGerandoGuiaId(tensaoId)
    setError(null)
    try {
      // Verificar se já existe guia
      const { data: guiaExistente } = await supabase
        .from('guias_profundas')
        .select('*')
        .eq('tensao_id', tensaoId)
        .maybeSingle()
      if (guiaExistente) {
        setGuias(prev => ({ ...prev, [tensaoId]: guiaExistente }))
        alert('Mapa mental já existe!')
        return
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/gerar-guia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ tensao_id: tensaoId, tensao_texto: tensaoTexto })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)

      const { data: guiaSalvo } = await supabase
        .from('guias_profundas')
        .select('*')
        .eq('tensao_id', tensaoId)
        .single()
      setGuias(prev => ({ ...prev, [tensaoId]: guiaSalvo }))
      alert('✅ Mapa mental gerado!')
    } catch (err) {
      console.error(err)
      setError(`Erro ao gerar mapa mental: ${err.message}`)
      alert(`Erro: ${err.message}`)
    } finally {
      setGerandoGuiaId(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-white/30">Carregando aulas...</div>
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-white/[0.06] px-6 py-4 bg-[#0C0C0E]/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-sm font-medium text-[#E8E6E1]">📚 Biblioteca de Aulas</h1>
        <p className="text-xs text-white/30 mt-0.5">{aulas.length} aulas disponíveis</p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {aulas.map(aula => {
            const tensoes = tensoesPorAula[aula.id] || []
            const processando = processandoAula === aula.id
            const expandida = expandedId === aula.id
            return (
              <div key={aula.id} className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
                <div
                  className="p-4 flex items-start justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandida ? null : aula.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        aula.status === 'conceitos_extraidos'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-white/10 text-white/40'
                      }`}>
                        {aula.status === 'conceitos_extraidos' ? '✅ Conceitos extraídos' : '📝 Pendente'}
                      </span>
                      <span className="text-[10px] text-white/30">Aula {aula.ordem || aula.id}</span>
                    </div>
                    <h3 className="text-base font-medium text-[#E8E6E1]">{aula.titulo}</h3>
                    <div className="text-xs text-white/30 mt-1">{tensoes.length} tensões extraídas</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {aula.status !== 'conceitos_extraidos' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); extrairTensoes(aula.id) }}
                        disabled={processando}
                        className="text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 px-3 py-1 rounded disabled:opacity-50"
                      >
                        {processando ? <><SpinIcon size={3} /> Extraindo...</> : '🎬 Extrair tensões'}
                      </button>
                    )}
                    <span className="text-white/30 text-lg">{expandida ? '−' : '+'}</span>
                  </div>
                </div>

                {expandida && (
                  <div className="border-t border-white/[0.06] p-4 space-y-4">
                    {tensoes.length === 0 ? (
                      <p className="text-sm text-white/30 text-center py-4">Nenhuma tensão extraída ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-[10px] uppercase text-white/30 mb-1">⚡ Tensões extraídas</div>
                        {tensoes.map(tensao => {
                          const guia = guias[tensao.id]
                          const gerando = gerandoGuiaId === tensao.id
                          return (
                            <div key={tensao.id} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
                              <p className="text-sm text-white/80">{tensao.tensao}</p>
                              <div className="flex justify-end mt-2">
                                {!guia ? (
                                  <button
                                    onClick={() => gerarMapaMental(tensao.id, tensao.tensao)}
                                    disabled={gerando}
                                    className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-2 py-1 rounded disabled:opacity-50"
                                  >
                                    {gerando ? <><SpinIcon size={3} /> Gerando...</> : '🧠 Gerar mapa mental'}
                                  </button>
                                ) : (
                                  <span className="text-xs text-emerald-400">✅ Mapa gerado</span>
                                )}
                              </div>
                              {guia && (
                                <div className="mt-3 p-2 bg-white/5 rounded text-xs space-y-1">
                                  <p><span className="text-white/40">🎬 Gancho:</span> {guia.gancho}</p>
                                  <p><span className="text-white/40">🧠 Linha:</span> {guia.linha_de_raciocinio}</p>
                                  <p><span className="text-white/40">📢 CTA:</span> {guia.cta}</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}