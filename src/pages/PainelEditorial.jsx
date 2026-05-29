// src/pages/PainelEditorial.jsx
// Painel de inteligência editorial — analisa o que você grava e o que está faltando
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function SpinIcon() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

function BarraProgresso({ valor, max, cor = 'bg-violet-500' }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full ${cor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-white/30 w-6 text-right">{valor}</span>
    </div>
  )
}

export default function PainelEditorial() {
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState(null)
  const [analiseIA, setAnaliseIA] = useState(null)
  const [gerandoAnalise, setGerandoAnalise] = useState(false)

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    setLoading(true)

    // Busca todas as guias
    const { data: guias } = await supabase
      .from('guias_profundas')
      .select('status, publico_alvo, emocao, tipo_verdade, tipo_gancho, potencial_viral, views_publicado, likes_publicado, created_at, tensao_texto, narrativa')

    if (!guias) { setLoading(false); return }

    // Processa os dados
    const total        = guias.length
    const publicadas   = guias.filter(g => g.status === 'publicado')
    const gravadas     = guias.filter(g => g.status === 'gravado')
    const separadas    = guias.filter(g => g.status === 'separado')
    const pendentes    = guias.filter(g => g.status === 'pendente')

    // Público
    const porPublico = {
      corretor:     guias.filter(g => g.publico_alvo === 'corretor').length,
      proprietario: guias.filter(g => g.publico_alvo === 'proprietario').length,
    }

    // Emoções dominantes
    const emocoes = {}
    guias.forEach(g => { if (g.emocao) emocoes[g.emocao] = (emocoes[g.emocao] || 0) + 1 })

    // Tipos de verdade
    const verdades = {}
    guias.forEach(g => { if (g.tipo_verdade) verdades[g.tipo_verdade] = (verdades[g.tipo_verdade] || 0) + 1 })

    // Tipos de abertura
    const aberturas = {}
    guias.forEach(g => { if (g.tipo_gancho) aberturas[g.tipo_gancho] = (aberturas[g.tipo_gancho] || 0) + 1 })

    // Performance das publicadas
    const comViews = publicadas.filter(g => (g.views_publicado || 0) > 0)
    const totalViews = comViews.reduce((s, g) => s + (g.views_publicado || 0), 0)
    const totalLikes = comViews.reduce((s, g) => s + (g.likes_publicado || 0), 0)
    const mediaViews = comViews.length > 0 ? Math.round(totalViews / comViews.length) : 0

    // Top tensões por views
    const topTensoes = publicadas
      .filter(g => (g.views_publicado || 0) > 0)
      .sort((a, b) => (b.views_publicado || 0) - (a.views_publicado || 0))
      .slice(0, 5)

    // DNA esperado (193 vídeos reais)
    const dnaEsperado = {
      constatacao: 41, afirmacao: 38, pergunta: 21,
      fracasso_invisivel: 37, vergonha_silenciosa: 23, medo_social: 21,
      corretor: 75, proprietario: 25,
    }

    setDados({
      total, publicadas: publicadas.length, gravadas: gravadas.length,
      separadas: separadas.length, pendentes: pendentes.length,
      porPublico, emocoes, verdades, aberturas,
      mediaViews, totalViews, totalLikes,
      topTensoes, comViews: comViews.length,
      dnaEsperado,
    })
    setLoading(false)
  }

  async function gerarAnaliseIA() {
    if (!dados) return
    setGerandoAnalise(true)

    const contexto = `
Sou Lucas Marques, gestor de corretores em Brasilia.
Aqui esta o resumo do meu conteudo publicado no Instagram:

FUNIL:
- Total de guias: ${dados.total}
- Publicadas: ${dados.publicadas} | Gravadas: ${dados.gravadas} | Separadas: ${dados.separadas} | Pendentes: ${dados.pendentes}

PUBLICO:
- Corretor: ${dados.porPublico.corretor} (${dados.total > 0 ? Math.round(dados.porPublico.corretor/dados.total*100) : 0}%)
- Proprietario: ${dados.porPublico.proprietario} (${dados.total > 0 ? Math.round(dados.porPublico.proprietario/dados.total*100) : 0}%)

TIPOS DE VERDADE USADOS:
${Object.entries(dados.verdades).map(([k,v]) => `- ${k}: ${v}`).join('\n') || 'Nenhum registrado ainda'}

TIPOS DE ABERTURA:
${Object.entries(dados.aberturas).map(([k,v]) => `- ${k}: ${v}`).join('\n') || 'Nenhum registrado ainda'}

EMOCOES DOMINANTES:
${Object.entries(dados.emocoes).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v]) => `- ${k}: ${v}`).join('\n') || 'Nenhuma registrada ainda'}

PERFORMANCE:
- ${dados.comViews} guias com views registradas
- Media de views: ${dados.mediaViews}
- Total views: ${dados.totalViews}

DNA IDEAL (193 videos reais do criador):
- 41% constatacao, 38% afirmacao, 21% pergunta
- 37% fracasso_invisivel, 23% vergonha_silenciosa, 21% medo_social
- 75% corretor, 25% proprietario
`

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          prompt: `Voce e um consultor editorial especializado em criadores de conteudo para o mercado imobiliario brasileiro.

${contexto}

Analise os dados acima e me responda:

1. PADROES QUE ESTOU REPETINDO DEMAIS
Quais tipos de verdade, emocao ou publico estou sobre-usando? Seja especifico.

2. O QUE ESTA FALTANDO NA MINHA GRADE
Quais angulos, publicos ou emocoes o DNA real pede que ainda nao apareceram no meu conteudo?

3. PROXIMAS 5 TENSOES SUGERIDAS
Baseado no que esta faltando, sugira 5 tensoes especificas para o mercado imobiliario de Brasilia que eu deveria criar. Seja especifico — nao genericas.

4. ALERTA EDITORIAL
Uma observacao direta e crua sobre o que voce viu nos dados. Como o Lucas falaria para si mesmo.

Responda de forma direta, sem enrolacao, sem elogios. Maximo 400 palavras no total.`,
          model: 'deepseek-chat',
          max_tokens: 800,
          temperature: 0.5
        })
      })
      const data = await resp.json()
      setAnaliseIA(data.content || data.response || '')
    } catch (e) {
      console.error(e)
      setAnaliseIA('Erro ao gerar análise. Tente novamente.')
    }
    setGerandoAnalise(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-white/25"><SpinIcon /></div>
  )

  if (!dados) return null

  const maxEmocao = Math.max(...Object.values(dados.emocoes), 1)
  const maxVerdade = Math.max(...Object.values(dados.verdades), 1)
  const maxAbertura = Math.max(...Object.values(dados.aberturas), 1)

  // Detecta desequilíbrios vs DNA
  const pctCorretor = dados.total > 0 ? dados.porPublico.corretor / dados.total * 100 : 0
  const alertas = []
  if (pctCorretor > 85) alertas.push('Pouco conteúdo para proprietários — DNA pede 25%')
  if (pctCorretor < 60) alertas.push('Poucos conteúdos para corretores — DNA pede 75%')

  const aberturas = dados.aberturas
  const totalAberturas = Object.values(aberturas).reduce((a, b) => a + (b as number), 0)
  if (totalAberturas > 5) {
    const pctConst = (aberturas['constatação'] || 0) / totalAberturas * 100
    if (pctConst > 60) alertas.push('Muitas aberturas com "constatação" — varie com afirmação e pergunta')
    const pctPerg = (aberturas['pergunta'] || 0) / totalAberturas * 100
    if (pctPerg < 10) alertas.push('Poucas aberturas com pergunta — DNA usa 21%')
  }

  const verdades = dados.verdades
  const totalVerdades = Object.values(verdades).reduce((a, b) => a + (b as number), 0)
  if (totalVerdades > 5) {
    const pctFI = (verdades['fracasso_invisivel'] || 0) / totalVerdades * 100
    if (pctFI > 55) alertas.push('Muitos "fracasso invisível" — explore vergonha_silenciosa e medo_social')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-white/[0.06] px-6 py-4">
        <h1 className="text-sm font-medium text-[#E8E6E1]">🧭 Painel Editorial</h1>
        <p className="text-xs text-white/30 mt-0.5">Análise do seu conteúdo baseada no DNA real</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Funil */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Pendente', valor: dados.pendentes,  cor: 'text-white/50',    bg: 'bg-white/[0.04]'    },
            { label: 'Separado', valor: dados.separadas,  cor: 'text-blue-400',    bg: 'bg-blue-500/10'     },
            { label: 'Gravado',  valor: dados.gravadas,   cor: 'text-amber-400',   bg: 'bg-amber-500/10'    },
            { label: 'Publicado',valor: dados.publicadas, cor: 'text-emerald-400', bg: 'bg-emerald-500/10'  },
          ].map(({ label, valor, cor, bg }) => (
            <div key={label} className={`${bg} border border-white/[0.06] rounded-xl p-3 text-center`}>
              <div className={`text-2xl font-medium ${cor}`}>{valor}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Alertas de desequilíbrio */}
        {alertas.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] uppercase text-white/30">⚠️ Alertas editoriais</div>
            {alertas.map((a, i) => (
              <div key={i} className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
                <span>→</span>{a}
              </div>
            ))}
          </div>
        )}

        {/* Público */}
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[10px] uppercase text-white/30 mb-3">🎯 Público</div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>Corretor</span>
                <span className="text-white/25">{Math.round(pctCorretor)}% · alvo: 75%</span>
              </div>
              <BarraProgresso valor={dados.porPublico.corretor} max={dados.total} cor="bg-violet-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>Proprietário</span>
                <span className="text-white/25">{Math.round(100 - pctCorretor)}% · alvo: 25%</span>
              </div>
              <BarraProgresso valor={dados.porPublico.proprietario} max={dados.total} cor="bg-teal-500" />
            </div>
          </div>
        </div>

        {/* Tipos de verdade */}
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[10px] uppercase text-white/30 mb-3">🔍 Tipos de verdade usados</div>
          {Object.keys(dados.verdades).length === 0 ? (
            <p className="text-xs text-white/25">Nenhum registrado ainda</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(dados.verdades)
                .sort((a, b) => b[1] - a[1])
                .map(([tipo, count]) => (
                <div key={tipo}>
                  <div className="flex justify-between text-xs text-white/50 mb-1">
                    <span>{tipo.replace(/_/g, ' ')}</span>
                  </div>
                  <BarraProgresso valor={count as number} max={maxVerdade} cor="bg-rose-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tipos de abertura */}
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[10px] uppercase text-white/30 mb-3">🎬 Tipos de abertura</div>
          {Object.keys(dados.aberturas).length === 0 ? (
            <p className="text-xs text-white/25">Nenhum registrado ainda</p>
          ) : (
            <div className="space-y-2">
              {[
                { tipo: 'constatação', alvo: 41, cor: 'bg-amber-500' },
                { tipo: 'afirmação',   alvo: 38, cor: 'bg-blue-500'  },
                { tipo: 'pergunta',    alvo: 21, cor: 'bg-violet-500' },
              ].map(({ tipo, alvo, cor }) => (
                <div key={tipo}>
                  <div className="flex justify-between text-xs text-white/50 mb-1">
                    <span>{tipo}</span>
                    <span className="text-white/25">alvo: {alvo}%</span>
                  </div>
                  <BarraProgresso valor={dados.aberturas[tipo] || 0} max={maxAbertura} cor={cor} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emoções */}
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[10px] uppercase text-white/30 mb-3">😤 Emoções dominantes</div>
          {Object.keys(dados.emocoes).length === 0 ? (
            <p className="text-xs text-white/25">Nenhuma registrada ainda</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(dados.emocoes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([emocao, count]) => (
                <div key={emocao}>
                  <div className="text-xs text-white/50 mb-1">{emocao}</div>
                  <BarraProgresso valor={count as number} max={maxEmocao} cor="bg-pink-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance */}
        {dados.comViews > 0 && (
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
            <div className="text-[10px] uppercase text-white/30 mb-3">📊 Performance publicados</div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="text-xl font-medium text-emerald-400">{dados.mediaViews.toLocaleString()}</div>
                <div className="text-[10px] text-white/25">média views</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-medium text-blue-400">{dados.totalViews.toLocaleString()}</div>
                <div className="text-[10px] text-white/25">total views</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-medium text-pink-400">{dados.totalLikes.toLocaleString()}</div>
                <div className="text-[10px] text-white/25">total likes</div>
              </div>
            </div>
            {dados.topTensoes.length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-white/25 mb-2">🏆 Top tensões</div>
                {dados.topTensoes.map((g, i) => (
                  <div key={g.tensao_texto} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-[10px] text-white/20 w-4">{i+1}</span>
                    <span className="flex-1 text-xs text-white/60 line-clamp-1">{g.tensao_texto}</span>
                    <span className="text-xs text-emerald-400">{(g.views_publicado || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Análise IA */}
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase text-white/30">🤖 Guia editorial com IA</div>
            <button
              onClick={gerarAnaliseIA}
              disabled={gerandoAnalise}
              className="text-xs px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg transition disabled:opacity-40 flex items-center gap-1.5"
            >
              {gerandoAnalise ? <><SpinIcon /> Analisando...</> : '⚡ Analisar agora'}
            </button>
          </div>
          {analiseIA ? (
            <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{analiseIA}</div>
          ) : (
            <p className="text-xs text-white/25">
              Clique em "Analisar agora" para receber um diagnóstico editorial baseado nos seus dados reais:
              o que você está repetindo, o que está faltando e 5 tensões sugeridas para criar.
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
