// src/components/RadarEstrategico.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function RadarEstrategico() {
  const [insights, setInsights] = useState([])
  const [buracos, setBuracos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const { data: historico } = await supabase
      .from('historico_conteudo')
      .select('*')
      .order('data_gravacao', { ascending: false })
      .limit(50)

    const { data: tensoes } = await supabase
      .from('tensoes')
      .select('*')
      .order('potencial_viral', { ascending: false })

    const insightsLista = []
    const publicos = { corretor: 0, proprietario: 0 }
    const gatilhosUsados = {}

    historico?.forEach(h => {
      if (h.publico_alvo) publicos[h.publico_alvo]++
      if (h.gatilho_principal) gatilhosUsados[h.gatilho_principal] = (gatilhosUsados[h.gatilho_principal] || 0) + 1
    })

    if (publicos.corretor > publicos.proprietario * 2 && publicos.proprietario > 0) {
      insightsLista.push({
        tipo: 'desequilibrio',
        mensagem: `⚠️ Você falou sobre corretor ${publicos.corretor}x e sobre proprietário ${publicos.proprietario}x. O dono do imóvel também precisa de conteúdo.`
      })
    } else if (publicos.proprietario === 0 && publicos.corretor > 3) {
      insightsLista.push({
        tipo: 'buraco',
        mensagem: `🎯 VOCÊ NUNCA FALOU PARA O PROPRIETÁRIO. Esse é seu maior buraco de conteúdo.`
      })
    }

    const gatilhoTop = Object.entries(gatilhosUsados).sort((a,b) => b[1] - a[1])[0]
    if (gatilhoTop && gatilhoTop[1] >= 5) {
      insightsLista.push({
        tipo: 'saturacao',
        mensagem: `🔥 Gatilho "${gatilhoTop[0]}" saturado (${gatilhoTop[1]}x). Explore outros gatilhos.`
      })
    }

    const usadasIds = new Set(historico?.map(h => h.tensao_id) || [])
    const tensoesPotenciais = tensoes?.filter(t => !usadasIds.has(t.id) && (t.potencial_viral || 0) >= 7) || []
    if (tensoesPotenciais.length > 0) {
      insightsLista.push({
        tipo: 'oportunidade',
        mensagem: `💎 ${tensoesPotenciais.length} tensões de alto potencial não usadas. A mais forte: "${tensoesPotenciais[0].tensao}"`
      })
    }

    setBuracos([
      { topico: "medo do proprietário", status: "não explorado" },
      { topico: "vergonha de baixar preço", status: "não explorado" },
      { topico: "ego do dono do imóvel", status: "não explorado" },
    ])

    setInsights(insightsLista)
    setLoading(false)
  }

  if (loading) return <div className="text-white/30 p-4 text-center">Carregando radar...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-xl font-medium text-[#E8E6E1]">📡 Radar Estratégico</h1>
      <p className="text-sm text-white/30 -mt-2">Insights sobre sua estratégia de conteúdo</p>

      {insights.map((insight, i) => (
        <div key={i} className={`p-4 rounded-xl border ${
          insight.tipo === 'oportunidade' ? 'bg-emerald-500/10 border-emerald-500/20' :
          insight.tipo === 'saturacao' ? 'bg-amber-500/10 border-amber-500/20' :
          insight.tipo === 'desequilibrio' ? 'bg-red-500/10 border-red-500/20' :
          'bg-violet-500/10 border-violet-500/20'
        }`}>
          <p className="text-sm">{insight.mensagem}</p>
        </div>
      ))}

      {buracos.length > 0 && (
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[10px] uppercase text-white/30 mb-2">🎯 BURACOS DE CONTEÚDO</div>
          <div className="flex flex-wrap gap-2">
            {buracos.map((b, i) => (
              <span key={i} className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full">{b.topico}</span>
            ))}
          </div>
        </div>
      )}

      {insights.length === 0 && (
        <div className="text-center text-white/30 py-12">Continue criando! Coletando dados para te dar insights.</div>
      )}
    </div>
  )
}