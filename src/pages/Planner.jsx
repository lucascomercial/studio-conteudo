// src/pages/Planner.jsx
// Kanban semanal de gravação — arrasta guias para os dias da semana
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

function SpinIcon() {
  return (
    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

function getInicioSemana(offset = 0) {
  const hoje = new Date()
  const dia = hoje.getDay()
  const diff = dia === 0 ? -6 : 1 - dia // começa na segunda
  const segunda = new Date(hoje)
  segunda.setDate(hoje.getDate() + diff + offset * 7)
  segunda.setHours(0, 0, 0, 0)
  return segunda
}

function getDiasSemana(offset = 0) {
  const inicio = getInicioSemana(offset)
  return DIAS_SEMANA.map((nome, i) => {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    return {
      nome,
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      isHoje: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
    }
  })
}

function GuiaCard({ guia, onDragStart, onAbrir, compact = false }) {
  const publico = guia.publico_alvo === 'proprietario' ? '🏠' : '👔'
  const tom = guia.tom_roteiro === 'ajuda' ? '🤝' : '⚡'
  const status = guia.status

  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart(guia) }}
      onClick={() => onAbrir && onAbrir(guia)}
      className={`bg-[#1a1a1c] border border-white/[0.07] rounded-lg p-2.5 cursor-pointer hover:border-white/20 transition-all select-none ${compact ? '' : 'mb-2'}`}
    >
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <p className="text-xs text-[#E8E6E1] leading-snug line-clamp-2 flex-1">
          {guia.titulo || guia.tensao_texto}
        </p>
        <div className="flex gap-0.5 shrink-0">
          <span className="text-[10px]">{publico}</span>
          <span className="text-[10px]">{tom}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {guia.roteiro_video && <span className="text-[9px] text-white/30 bg-white/[0.05] px-1.5 py-0.5 rounded">corrido</span>}
        {guia.roteiro_cortes && <span className="text-[9px] text-white/30 bg-white/[0.05] px-1.5 py-0.5 rounded">cortes</span>}
        {guia.roteiro_aprovado && <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">✓ aprovado</span>}
        {status === 'gravado' && <span className="text-[9px] text-amber-400 ml-auto">🎬 gravado</span>}
        {status === 'publicado' && <span className="text-[9px] text-emerald-400 ml-auto">📱 publicado</span>}
      </div>
    </div>
  )
}


function Coluna({ titulo, date, label, isHoje, guias, onDragOver, onDrop, onDragStart, onRemover, onAbrir, meta = 3 }) {
  const gravados = guias.filter(g => g.status === 'gravado' || g.status === 'publicado').length
  const [isDragOver, setIsDragOver] = useState(false)

  return (
    <div
      className={`flex flex-col min-w-[200px] w-[200px] shrink-0 rounded-xl border transition-all ${
        isHoje
          ? 'border-violet-500/40 bg-violet-500/5'
          : isDragOver
          ? 'border-white/20 bg-white/[0.04]'
          : 'border-white/[0.06] bg-[#111113]'
      }`}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); onDragOver(e) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => { setIsDragOver(false); onDrop(e, date) }}
    >
      {/* Header */}
      <div className={`px-3 py-2.5 border-b ${isHoje ? 'border-violet-500/30' : 'border-white/[0.06]'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-xs font-medium ${isHoje ? 'text-violet-300' : 'text-white/60'}`}>
              {titulo} {isHoje && <span className="text-[10px] text-violet-400/70">hoje</span>}
            </div>
            <div className="text-[10px] text-white/25">{label}</div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${gravados >= meta ? 'text-emerald-400' : 'text-white/30'}`}>
              {gravados}/{meta}
            </div>
            <div className="text-[9px] text-white/20">gravados</div>
          </div>
        </div>
        {/* Barra de meta */}
        <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${gravados >= meta ? 'bg-emerald-500' : 'bg-violet-500'}`}
            style={{ width: `${Math.min((guias.length / meta) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 min-h-[120px]">
        {guias.map(guia => (
          <div key={guia.id} className="relative group">
            <GuiaCard guia={guia} onDragStart={onDragStart} onAbrir={onAbrir} compact />
            <button
              onClick={() => onRemover(guia.id)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-4 h-4 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded text-[9px] flex items-center justify-center transition-all"
              title="Remover do dia"
            >×</button>
          </div>
        ))}
        {guias.length === 0 && (
          <div className={`h-16 rounded-lg border-2 border-dashed flex items-center justify-center ${isDragOver ? 'border-violet-500/40 bg-violet-500/5' : 'border-white/[0.06]'}`}>
            <span className="text-[10px] text-white/20">arraste aqui</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Planner() {
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [dias, setDias] = useState([])
  const [guiasPorDia, setGuiasPorDia] = useState({})
  const [fila, setFila] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(null)
  const [guiaAberta, setGuiaAberta] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [montando, setMontando] = useState(false)
  const [filtroPublico, setFiltroPublico] = useState('todos')

  useEffect(() => {
    const d = getDiasSemana(semanaOffset)
    setDias(d)
    carregar(d)
  }, [semanaOffset])

  async function carregar(diasDaSemana) {
    setLoading(true)
    const datas = diasDaSemana.map(d => d.date)
    const inicio = datas[0]
    const fim = datas[datas.length - 1]

    // Guias programadas para essa semana
    const { data: programadas } = await supabase
      .from('guias_profundas')
      .select('id, titulo, tensao_texto, publico_alvo, tom_roteiro, status, roteiro_video, roteiro_cortes, roteiro_aprovado, dia_gravacao, ordem_dia, potencial_viral')
      .gte('dia_gravacao', inicio)
      .lte('dia_gravacao', fim)
      .order('ordem_dia', { ascending: true })

    // Guias na fila (separadas sem dia)
    const { data: naFila } = await supabase
      .from('guias_profundas')
      .select('id, titulo, tensao_texto, publico_alvo, tom_roteiro, status, roteiro_video, roteiro_cortes, roteiro_aprovado, potencial_viral')
      .eq('status', 'separado')
      .is('dia_gravacao', null)
      .order('potencial_viral', { ascending: false })
      .limit(30)

    // Monta por dia
    const porDia = {}
    datas.forEach(d => { porDia[d] = [] })
    ;(programadas || []).forEach(g => {
      if (porDia[g.dia_gravacao]) {
        porDia[g.dia_gravacao].push(g)
      }
    })

    setGuiasPorDia(porDia)
    setFila(naFila || [])
    setLoading(false)
  }

  const montarHoje = async () => {
    const hoje = getDiasSemana(semanaOffset).find(d => d.isHoje)?.date
    if (!hoje) return
    setMontando(true)

    // Pega guias com roteiro aprovado da fila
    const comRoteiro = fila.filter(g => g.roteiro_aprovado)
    const semRoteiro = fila.filter(g => !g.roteiro_aprovado)
    const fonte = comRoteiro.length > 0 ? comRoteiro : semRoteiro

    const corretores = fonte.filter(g => g.publico_alvo !== 'proprietario')
    const proprietarios = fonte.filter(g => g.publico_alvo === 'proprietario')

    const selecionadas = [
      ...corretores.slice(0, 2),
      ...proprietarios.slice(0, 1),
    ].slice(0, 3)

    if (selecionadas.length === 0) {
      alert('Nenhuma guia na fila para montar a grade.')
      setMontando(false)
      return
    }

    if (proprietarios.length === 0) {
      alert('⚠️ Sem guias de proprietário na fila. Importe mais conteúdo em Transcrições.')
    }

    for (let i = 0; i < selecionadas.length; i++) {
      const g = selecionadas[i]
      await supabase.from('guias_profundas')
        .update({ dia_gravacao: hoje, ordem_dia: i, status: 'separado' })
        .eq('id', g.id)
    }

    await carregar(getDiasSemana(semanaOffset))
    setMontando(false)
  }

  const handleDragStart = (guia) => setDragging(guia)

  const handleDrop = async (e, date) => {
    e.preventDefault()
    if (!dragging) return
    setSalvando(true)

    const guiaId = dragging.id
    const guiaAtual = dragging

    // Remove da fila local
    setFila(prev => prev.filter(g => g.id !== guiaId))

    // Remove do dia anterior se tinha
    setGuiasPorDia(prev => {
      const novo = { ...prev }
      Object.keys(novo).forEach(d => {
        novo[d] = novo[d].filter(g => g.id !== guiaId)
      })
      // Adiciona no novo dia
      const ordemAtual = (novo[date] || []).length
      novo[date] = [...(novo[date] || []), { ...guiaAtual, dia_gravacao: date, ordem_dia: ordemAtual }]
      return novo
    })

    // Salva no banco
    await supabase.from('guias_profundas')
      .update({
        dia_gravacao: date,
        status: 'separado',
        ordem_dia: (guiasPorDia[date] || []).length
      })
      .eq('id', guiaId)

    setDragging(null)
    setSalvando(false)
  }

  const handleRemover = async (guiaId) => {
    // Remove do dia e volta para fila sem data
    const guia = Object.values(guiasPorDia).flat().find(g => g.id === guiaId)
    if (!guia) return

    setGuiasPorDia(prev => {
      const novo = { ...prev }
      Object.keys(novo).forEach(d => { novo[d] = novo[d].filter(g => g.id !== guiaId) })
      return novo
    })
    setFila(prev => [{ ...guia, dia_gravacao: null }, ...prev])

    await supabase.from('guias_profundas')
      .update({ dia_gravacao: null, ordem_dia: 0 })
      .eq('id', guiaId)
  }

  const filaMostrada = fila.filter(g =>
    filtroPublico === 'todos' ? true : g.publico_alvo === filtroPublico
  )

  const totalSemana = Object.values(guiasPorDia).flat().length
  const gravadosSemana = Object.values(guiasPorDia).flat().filter(g => g.status === 'gravado' || g.status === 'publicado').length

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-white/25">
      <SpinIcon />
    </div>
  )

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-medium text-[#E8E6E1]">📅 Planner de Gravação</h1>
          <p className="text-[10px] text-white/30 mt-0.5">
            {totalSemana} programados · {gravadosSemana} gravados essa semana
          </p>
        </div>
        <div className="flex items-center gap-2">
          {salvando && <SpinIcon />}
          <button onClick={montarHoje} disabled={montando}
            className="text-xs px-3 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 transition disabled:opacity-40">
            {montando ? '⏳' : '⚡'} Montar hoje
          </button>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSemanaOffset(s => s - 1)}
              className="text-xs px-2 py-1.5 rounded-lg border border-white/[0.06] text-white/30 hover:bg-white/[0.06] transition">
              ←
            </button>
            <button onClick={() => setSemanaOffset(0)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${semanaOffset === 0 ? 'bg-violet-500/20 border-violet-500/30 text-violet-300' : 'border-white/[0.06] text-white/30 hover:bg-white/[0.06]'}`}>
              {semanaOffset === 0 ? 'Esta semana' : semanaOffset < 0 ? `${Math.abs(semanaOffset)}s atrás` : `+${semanaOffset}s`}
            </button>
            <button onClick={() => setSemanaOffset(s => s + 1)}
              className="text-xs px-2 py-1.5 rounded-lg border border-white/[0.06] text-white/30 hover:bg-white/[0.06] transition">
              →
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Fila lateral */}
        <div className="w-[220px] shrink-0 border-r border-white/[0.06] flex flex-col">
          <div className="px-3 py-2.5 border-b border-white/[0.06]">
            <div className="text-xs text-white/50 font-medium mb-1.5">
              📋 Fila ({fila.length})
            </div>
            <div className="flex gap-2 mb-2 text-[10px]">
              <span className="text-violet-400">👔 {fila.filter(g => g.publico_alvo !== 'proprietario').length}</span>
              <span className={fila.filter(g => g.publico_alvo === 'proprietario').length < 3 ? 'text-amber-400' : 'text-teal-400'}>
                🏠 {fila.filter(g => g.publico_alvo === 'proprietario').length}
                {fila.filter(g => g.publico_alvo === 'proprietario').length < 3 && ' ⚠️'}
              </span>
            </div>
            <div className="flex gap-1">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'corretor', label: '👔' },
                { id: 'proprietario', label: '🏠' },
              ].map(({ id, label }) => (
                <button key={id} onClick={() => setFiltroPublico(id)}
                  className={`flex-1 text-[10px] py-1 rounded transition ${filtroPublico === id ? 'bg-white/15 text-white/70' : 'text-white/25 hover:bg-white/[0.07]'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5"
            onDragOver={e => e.preventDefault()}
            onDrop={async e => {
              e.preventDefault()
              if (!dragging || !dragging.dia_gravacao) return
              await handleRemover(dragging.id)
              setDragging(null)
            }}
          >
            {filaMostrada.length === 0 && (
              <div className="text-center py-6">
                <p className="text-[10px] text-white/20">Fila vazia</p>
                <p className="text-[10px] text-white/15 mt-1">Separe guias em Roteiros</p>
              </div>
            )}
            {filaMostrada.map(guia => (
              <GuiaCard key={guia.id} guia={guia} onDragStart={handleDragStart} onAbrir={setGuiaAberta} compact />
            ))}
          </div>
        </div>

        {/* Kanban */}
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-3 h-full" style={{ minWidth: `${dias.length * 212}px` }}>
            {dias.map(dia => (
              <Coluna
                key={dia.date}
                titulo={dia.nome}
                date={dia.date}
                label={dia.label}
                isHoje={dia.isHoje}
                guias={guiasPorDia[dia.date] || []}
                onDragStart={handleDragStart}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onRemover={handleRemover}
                onAbrir={setGuiaAberta}
                meta={3}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Modal de guia */}
      {guiaAberta && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setGuiaAberta(null)}>
          <div className="bg-[#141416] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/[0.06] flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#E8E6E1] leading-snug">{guiaAberta.titulo || guiaAberta.tensao_texto}</p>
                <div className="flex gap-2 mt-1.5">
                  <span className="text-[10px] text-white/30">{guiaAberta.publico_alvo === 'proprietario' ? '🏠 Proprietário' : '👔 Corretor'}</span>
                  <span className="text-[10px] text-white/30">{guiaAberta.tom_roteiro === 'ajuda' ? '🤝 Ajuda' : '⚡ Confronto'}</span>
                  {guiaAberta.potencial_viral >= 7 && <span className="text-[10px] text-red-400">🔥 {guiaAberta.potencial_viral}</span>}
                </div>
              </div>
              <button onClick={() => setGuiaAberta(null)} className="text-white/30 hover:text-white/60 text-xl leading-none ml-4">×</button>
            </div>
            <div className="p-4 space-y-3">
              {guiaAberta.gancho && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="text-[10px] uppercase text-amber-400/60 mb-1">🎬 Gancho</div>
                  <p className="text-sm text-[#E8E6E1]">"{guiaAberta.gancho}"</p>
                </div>
              )}
              {guiaAberta.alma_do_conteudo && (
                <div className="p-3 border border-white/[0.08] rounded-xl text-center">
                  <div className="text-[10px] uppercase text-white/20 mb-1">⚡ Alma</div>
                  <p className="text-xs font-medium text-amber-400">{guiaAberta.alma_do_conteudo}</p>
                </div>
              )}
              {guiaAberta.roteiro_video && (
                <div>
                  <div className="text-[10px] uppercase text-white/20 mb-1.5">🎙️ Corrido</div>
                  <p className="text-xs text-white/55 leading-relaxed whitespace-pre-wrap bg-white/[0.02] p-3 rounded-lg">{guiaAberta.roteiro_video}</p>
                </div>
              )}
              {guiaAberta.roteiro_cortes && (
                <div>
                  <div className="text-[10px] uppercase text-white/20 mb-1.5">✂️ Cortes</div>
                  <pre className="text-xs text-white/55 leading-relaxed whitespace-pre-wrap bg-white/[0.02] p-3 rounded-lg font-sans">{guiaAberta.roteiro_cortes}</pre>
                </div>
              )}
              {guiaAberta.cta && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="text-[10px] uppercase text-emerald-400/60 mb-1">📢 CTA</div>
                  <p className="text-xs text-white/70">"{guiaAberta.cta}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
