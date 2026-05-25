// src/components/GerenciadorAulas.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// URL da Edge Function (ajuste se necessário)
const EDGE_GERAR_GUIA = 'https://krvrljlwzjmixniibjaw.supabase.co/functions/v1/gerar-guia'

export default function GerenciadorAulas() {
  const [aulas, setAulas] = useState([])
  const [loading, setLoading] = useState(true)
  const [processandoAulaId, setProcessandoAulaId] = useState(null)
  const [progresso, setProgresso] = useState({ atual: 0, total: 0, mensagem: '' })
  const [expandedAula, setExpandedAula] = useState(null)

  useEffect(() => {
    carregarAulas()
  }, [])

  async function carregarAulas() {
    setLoading(true)
    const { data, error } = await supabase
      .from('aulas')
      .select(`
        *,
        tensoes (
          id,
          tensao,
          emocao,
          antagonista,
          gatilhos,
          cenas,
          formato_ideal,
          potencial_viral,
          publico_sugerido,
          mapa_gerado,
          mapa_gerado_em,
          o_que_isso_realmente_quer_dizer,
          consequencia_invisivel,
          como_isso_aparece_na_vida_real,
          o_que_essa_pessoa_acredita,
          o_que_realmente_doi,
          subtexto_escondido,
          micro_cenas
        )
      `)
      .order('id', { ascending: true })

    if (!error && data) {
      const aulasFormatadas = data.map(aula => ({
        ...aula,
        total_tensoes: aula.tensoes?.length || 0,
        mapas_gerados: aula.tensoes?.filter(t => t.mapa_gerado).length || 0,
        tensoes_pendentes: aula.tensoes?.filter(t => !t.mapa_gerado) || [],
        tensoes_processadas: aula.tensoes?.filter(t => t.mapa_gerado) || []
      }))
      setAulas(aulasFormatadas)
    }
    setLoading(false)
  }

  // Chama a Edge Function para gerar um mapa mental (guia) a partir de uma tensão
  async function gerarMapaParaTensao(tensao) {
    try {
      const response = await fetch(EDGE_GERAR_GUIA, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          tensao_id: tensao.id,
          tensao_texto: tensao.tensao
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na Edge Function')
      }
      const result = await response.json()
      return result.success === true
    } catch (err) {
      console.error('Erro ao gerar mapa:', err)
      return false
    }
  }

  // Gera mapas para todas as tensões pendentes de uma aula
  async function gerarMapasParaAula(aula) {
    const pendentes = aula.tensoes_pendentes
    if (pendentes.length === 0) {
      alert(`✅ Aula "${aula.titulo}" já tem todas as tensões processadas!`)
      return
    }

    const confirmar = confirm(
      `🎯 Gerar mapas para TODAS as ${pendentes.length} tensões da aula "${aula.titulo}"?`
    )
    if (!confirmar) return

    setProcessandoAulaId(aula.id)
    setProgresso({ atual: 0, total: pendentes.length, mensagem: 'Iniciando...' })

    let sucessos = 0
    for (let i = 0; i < pendentes.length; i++) {
      const tensao = pendentes[i]
      setProgresso({
        atual: i + 1,
        total: pendentes.length,
        mensagem: `Gerando mapa: ${tensao.tensao.substring(0, 50)}...`
      })
      const ok = await gerarMapaParaTensao(tensao)
      if (ok) sucessos++
      // Pequena pausa para não sobrecarregar a Edge Function
      await new Promise(r => setTimeout(r, 800))
    }

    setProgresso({ atual: 0, total: 0, mensagem: '' })
    setProcessandoAulaId(null)
    alert(`✅ Concluído! ${sucessos} de ${pendentes.length} mapas gerados.`)
    carregarAulas() // recarrega para atualizar status
  }

  const toggleExpand = (aulaId) => {
    setExpandedAula(expandedAula === aulaId ? null : aulaId)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-white/30">Carregando aulas...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-medium text-[#E8E6E1] mb-6">📚 Gerenciador de Aulas</h1>

      {aulas.length === 0 && (
        <div className="text-center py-12 text-white/30">
          Nenhuma aula encontrada. Importe as aulas primeiro.
        </div>
      )}

      {progresso.total > 0 && (
        <div className="mb-4 p-3 bg-violet-500/20 border border-violet-500/30 rounded-lg">
          <div className="text-sm text-violet-300">{progresso.mensagem}</div>
          <div className="w-full bg-white/10 rounded-full h-2 mt-2">
            <div className="bg-violet-400 h-2 rounded-full" style={{ width: `${(progresso.atual / progresso.total) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {aulas.map(aula => (
          <div key={aula.id} className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
            {/* Cabeçalho da aula - CLICÁVEL */}
            <div
              className="p-4 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition flex justify-between items-center"
              onClick={() => toggleExpand(aula.id)}
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-medium text-[#E8E6E1]">{aula.titulo}</h2>
                  <span className="text-xs text-white/40">({aula.total_tensoes} tensões)</span>
                  <span className="text-xs text-emerald-400">✅ {aula.mapas_gerados} mapas</span>
                  {aula.tensoes_pendentes.length > 0 && (
                    <span className="text-xs text-amber-400">⏳ {aula.tensoes_pendentes.length} pendentes</span>
                  )}
                </div>
                <div className="text-xs text-white/30 mt-1">
                  Criada em {new Date(aula.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {aula.tensoes_pendentes.length > 0 && processandoAulaId !== aula.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); gerarMapasParaAula(aula) }}
                    className="px-3 py-1 bg-violet-500/20 hover:bg-violet-500/30 rounded text-xs text-violet-400"
                  >
                    🎯 Gerar todos ({aula.tensoes_pendentes.length})
                  </button>
                )}
                <span className={`text-white/30 transition-transform ${expandedAula === aula.id ? 'rotate-90' : ''}`}>
                  ›
                </span>
              </div>
            </div>

            {/* Conteúdo expansível */}
            {expandedAula === aula.id && (
              <div className="p-4 border-t border-white/[0.06] space-y-4">
                {/* Tensões pendentes (sem mapa) */}
                {aula.tensoes_pendentes.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-amber-400 mb-2">⏳ Pendentes</div>
                    <div className="space-y-3">
                      {aula.tensoes_pendentes.map(tensao => (
                        <div key={tensao.id} className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.08]">
                          <p className="text-sm text-white/80">{tensao.tensao}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {tensao.gatilhos?.slice(0,2).map(g => (
                              <span key={g} className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full">{g}</span>
                            ))}
                            {tensao.potencial_viral >= 7 && (
                              <span className="text-[10px] px-2 py-0.5 bg-red-500/20 rounded-full">🔥 Viral: {tensao.potencial_viral}</span>
                            )}
                          </div>
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={async () => {
                                const ok = await gerarMapaParaTensao(tensao)
                                if (ok) {
                                  alert('✅ Mapa gerado!')
                                  carregarAulas()
                                } else {
                                  alert('❌ Erro ao gerar mapa. Verifique o console.')
                                }
                              }}
                              className="text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 px-3 py-1 rounded"
                            >
                              🎬 Gerar mapa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tensões já processadas */}
                {aula.tensoes_processadas.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-emerald-400 mb-2">✅ Mapas gerados</div>
                    <div className="space-y-2">
                      {aula.tensoes_processadas.map(tensao => (
                        <div key={tensao.id} className="bg-white/[0.02] p-2 rounded-lg">
                          <p className="text-sm text-white/50 line-through">{tensao.tensao}</p>
                          <div className="text-[10px] text-white/30">
                            Gerado em {new Date(tensao.mapa_gerado_em).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aula.total_tensoes === 0 && (
                  <p className="text-sm text-white/30 text-center">Nenhuma tensão extraída para esta aula.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}