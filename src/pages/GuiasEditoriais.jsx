// src/pages/GuiasEditoriais.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { callOpenAIJSON } from '../lib/openai'
import { prompts } from '../lib/prompts'
import MapaEditorial from '../components/MapaEditorial'

const GATILHO_CORES = {
  medo: 'bg-red-500/20 text-red-400',
  ego: 'bg-violet-500/20 text-violet-400',
  vergonha: 'bg-pink-500/20 text-pink-400',
  status: 'bg-emerald-500/20 text-emerald-400',
  urgencia: 'bg-blue-500/20 text-blue-400',
  prejuizo: 'bg-orange-500/20 text-orange-400',
  ambicao: 'bg-emerald-500/20 text-emerald-400',
  frustracao: 'bg-amber-500/20 text-amber-400',
}

const OBJETIVO_ICONES = {
  autoridade: '🎓 Gerar autoridade',
  atrair_proprietario: '🏠 Atrair proprietário',
  posicionamento_alto_padrao: '💎 Posicionamento alto padrão',
  compartilhamento: '🔄 Compartilhamento',
  corrigir_comportamento: '🔧 Corrigir comportamento',
}

export default function GuiasEditoriais() {
  const [guias, setGuias] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalGuia, setModalGuia] = useState(null)
  
  // Filtros
  const [filtroPublico, setFiltroPublico] = useState('')
  const [filtroGatilho, setFiltroGatilho] = useState('')
  const [filtroObjetivo, setFiltroObjetivo] = useState('')
  const [filtroTom, setFiltroTom] = useState('')
  const [filtroFormato, setFiltroFormato] = useState('')
  const [filtroIntensidade, setFiltroIntensidade] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregarGuias()
  }, [])

  async function carregarGuias() {
    setLoading(true)
    const { data, error } = await supabase
      .from('guias_editoriais')
      .select('*')
      .order('score_viral', { ascending: false, nullsLast: true })
      .order('created_at', { ascending: false })
    
    if (!error) setGuias(data || [])
    setLoading(false)
  }

  const guiasFiltradas = guias.filter(guia => {
    if (filtroPublico && guia.publico_alvo !== filtroPublico) return false
    if (filtroGatilho && guia.gatilho_dominante !== filtroGatilho) return false
    if (filtroObjetivo && guia.objetivo_estrategico !== filtroObjetivo) return false
    if (filtroTom && guia.tom_ideal !== filtroTom) return false
    if (filtroFormato && guia.formato_ideal !== filtroFormato) return false
    if (filtroIntensidade && guia.intensidade !== filtroIntensidade) return false
    if (filtroStatus && guia.status !== filtroStatus) return false
    if (busca) {
      const termo = busca.toLowerCase()
      return (guia.titulo?.toLowerCase().includes(termo) ||
              guia.tensao?.toLowerCase().includes(termo))
    }
    return true
  })

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-white/30">Carregando...</div>
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-4 bg-[#0C0C0E]/80 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-sm font-medium text-[#E8E6E1]">🎯 Central de Execução Editorial</h1>
          <p className="text-xs text-white/30 mt-0.5">{guiasFiltradas.length} de {guias.length} mapas editoriais</p>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="border-b border-white/[0.06] px-6 py-3 overflow-x-auto bg-[#0E0E10]">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Buscar mapa..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.06] rounded-lg pl-7 pr-3 py-1.5 text-xs w-48"
          />

          <select value={filtroPublico} onChange={e => setFiltroPublico(e.target.value)} className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs">
            <option value="">Todos públicos</option>
            <option value="corretor">🎯 Corretor</option>
            <option value="proprietario">🏠 Proprietário</option>
          </select>

          <select value={filtroGatilho} onChange={e => setFiltroGatilho(e.target.value)} className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs">
            <option value="">Todos gatilhos</option>
            <option value="medo">😨 Medo</option>
            <option value="ego">🦚 Ego</option>
            <option value="vergonha">😳 Vergonha</option>
            <option value="prejuizo">💸 Prejuízo</option>
            <option value="urgencia">⏰ Urgência</option>
          </select>

          <select value={filtroObjetivo} onChange={e => setFiltroObjetivo(e.target.value)} className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs">
            <option value="">Todos objetivos</option>
            <option value="autoridade">🎓 Autoridade</option>
            <option value="atrair_proprietario">🏠 Atrair proprietário</option>
            <option value="compartilhamento">🔄 Compartilhamento</option>
            <option value="corrigir_comportamento">🔧 Corrigir</option>
          </select>

          <select value={filtroIntensidade} onChange={e => setFiltroIntensidade(e.target.value)} className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs">
            <option value="">🌡️ Intensidade</option>
            <option value="leve">🌿 Leve</option>
            <option value="medio">📈 Médio</option>
            <option value="forte">💪 Forte</option>
            <option value="polarizador">⚡ Polarizador</option>
          </select>

          {(busca || filtroPublico || filtroGatilho || filtroObjetivo || filtroIntensidade) && (
            <button onClick={() => {
              setBusca('')
              setFiltroPublico('')
              setFiltroGatilho('')
              setFiltroObjetivo('')
              setFiltroIntensidade('')
            }} className="text-xs text-white/30 hover:text-white/60">
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {guiasFiltradas.map(guia => (
            <div
              key={guia.id}
              onClick={() => setModalGuia(guia)}
              className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 cursor-pointer hover:bg-[#161618] transition"
            >
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${guia.publico_alvo === 'corretor' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {guia.publico_alvo === 'corretor' ? '🎯 Corretor' : '🏠 Proprietário'}
                </span>
                {guia.gatilho_dominante && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${GATILHO_CORES[guia.gatilho_dominante] || 'bg-white/10'}`}>
                    {guia.gatilho_dominante}
                  </span>
                )}
                {guia.score_viral && guia.score_viral >= 7 && (
                  <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">🔥 {guia.score_viral}</span>
                )}
                {guia.intensidade === 'polarizador' && (
                  <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">⚡ Polarizador</span>
                )}
              </div>
              <h3 className="text-sm font-medium text-[#E8E6E1] line-clamp-2">{guia.tensao}</h3>
              {guia.linha_de_raciocinio && (
                <p className="text-xs text-white/40 mt-1 line-clamp-2">{guia.linha_de_raciocinio}</p>
              )}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.06]">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  guia.status === 'gravado' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/30'
                }`}>
                  {guia.status === 'gravado' ? '🎬 Gravado' : '📝 Pendente'}
                </span>
                <span className="text-[10px] text-white/30">
                  {OBJETIVO_ICONES[guia.objetivo_estrategico] || guia.objetivo_estrategico}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {modalGuia && (
          <MapaEditorial
            guia={modalGuia}
            onClose={() => setModalGuia(null)}
            onRecriar={(novoGuia) => {
              setGuias(prev => [novoGuia, ...prev])
              setModalGuia(novoGuia)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}