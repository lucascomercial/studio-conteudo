// src/components/PainelIdentidade.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PainelIdentidade() {
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarPerfil()
  }, [])

  async function carregarPerfil() {
    const { data: perfilData } = await supabase.from('perfil_criador').select('*')
    const perfilObj = {}
    perfilData?.forEach(p => { perfilObj[p.chave] = p.valor })

    const { data: historico } = await supabase
      .from('historico_conteudo')
      .select('*')
      .order('data_gravacao', { ascending: false })
      .limit(20)

    const scores = { operacional: 0, estrategico: 0, mentor: 0, especialista: 0, vendedor: 0 }
    historico?.forEach(h => {
      if (h.score_autoridade) {
        scores.operacional += h.score_autoridade.operacional || 0
        scores.estrategico += h.score_autoridade.estrategico || 0
        scores.mentor += h.score_autoridade.mentor || 0
        scores.especialista += h.score_autoridade.especialista || 0
        scores.vendedor += h.score_autoridade.vendedor || 0
      }
    })

    const total = historico?.length || 1
    const percepcao = Object.entries(scores).sort((a,b) => b[1] - a[1])[0]?.[0] || 'estrategico'

    setPerfil({
      formato_ideal: perfilObj.formato_ideal || 'selfie_andando',
      tom_predominante: perfilObj.tom_predominante || 'provocativo',
      energia_dominante: perfilObj.energia_dominante || 'agressivo',
      percepcao_dominante: percepcao,
      scores: {
        operacional: Math.round(scores.operacional / total),
        estrategico: Math.round(scores.estrategico / total),
        mentor: Math.round(scores.mentor / total),
        especialista: Math.round(scores.especialista / total),
        vendedor: Math.round(scores.vendedor / total)
      }
    })
    setLoading(false)
  }

  if (loading) return <div className="text-white/30 p-8 text-center">Analisando sua identidade...</div>

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-[#E8E6E1]">🎯 Seu Painel de Identidade</h1>
        <p className="text-sm text-white/30 mt-1">Como o mercado percebe você hoje</p>
      </div>

      <div className="bg-gradient-to-r from-violet-500/20 to-emerald-500/20 border border-white/[0.08] rounded-xl p-6 text-center">
        <div className="text-[10px] uppercase text-white/30 mb-2">PERCEPÇÃO DOMINANTE</div>
        <div className="text-3xl font-bold text-[#E8E6E1] capitalize">{perfil?.percepcao_dominante}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[10px] uppercase text-white/30 mb-2">⚡ ENERGIA DA MARCA</div>
          <div className="text-xl font-medium capitalize">{perfil?.energia_dominante}</div>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-violet-400 rounded-full" style={{ width: '70%' }} />
          </div>
        </div>

        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[10px] uppercase text-white/30 mb-2">🎭 FORMATO IDEAL</div>
          <div className="text-xl font-medium">
            {perfil?.formato_ideal === 'selfie_andando' && '🚶 Selfie andando'}
            {perfil?.formato_ideal === 'mesa' && '📋 Mesa'}
            {perfil?.formato_ideal === 'tom_calmo' && '🧘 Tom calmo'}
            {perfil?.formato_ideal === 'resposta_agressiva' && '⚡ Resposta agressiva'}
          </div>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
        <div className="text-[10px] uppercase text-white/30 mb-3">📊 SCORE DE AUTORIDADE</div>
        <div className="space-y-2">
          <div><span className="text-white/40">Estratégico:</span> {perfil?.scores.estrategico}%</div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${perfil?.scores.estrategico}%` }} />
          </div>
          <div><span className="text-white/40">Mentor:</span> {perfil?.scores.mentor}%</div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-violet-400 rounded-full" style={{ width: `${perfil?.scores.mentor}%` }} />
          </div>
          <div><span className="text-white/40">Especialista:</span> {perfil?.scores.especialista}%</div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${perfil?.scores.especialista}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}