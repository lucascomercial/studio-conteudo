// src/components/MapaEditorial.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FORMATO_ICONES = {
  selfie_andando: '🚶 Selfie andando',
  mesa: '📋 Mesa',
  tom_calmo: '🧘 Tom calmo',
  resposta_agressiva: '⚡ Resposta agressiva',
}

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

const TOM_ICONES = {
  indignacao_estrategica: '😤 Indignação estratégica',
  autoridade_calma: '🧘 Autoridade calma',
  confronto_racional: '⚔️ Confronto racional',
  provocacao_elegante: '🎯 Provocação elegante',
  reflexao_dura: '🤔 Reflexão dura',
  especialista_experiente: '🎓 Especialista experiente',
}

export default function MapaEditorial({ guia, onClose, onRecriar }) {
  const [expandedSections, setExpandedSections] = useState({
    persona: true,
    antagonista: true,
    consequencia: true,
    cenas: true,
    ritmo: true,
    topicos: true,
    frases: true,
    naoFazer: true,
    comentarios: true,
    desdobramentos: true,
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const polarizacaoCor = () => {
    const score = guia.polarizacao_score || 5
    if (score >= 8) return 'text-red-400'
    if (score >= 6) return 'text-orange-400'
    return 'text-white/40'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-[#141416] border border-white/[0.08] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${guia.publico_alvo === 'corretor' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  🎯 {guia.publico_alvo === 'corretor' ? 'Corretor' : 'Proprietário'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${GATILHO_CORES[guia.gatilho_dominante] || 'bg-white/10'}`}>
                  🎯 Gatilho: {guia.gatilho_dominante}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full">
                  🎬 {TOM_ICONES[guia.tom_ideal] || guia.tom_ideal}
                </span>
                {guia.formato_ideal && (
                  <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full">
                    {FORMATO_ICONES[guia.formato_ideal]}
                  </span>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${polarizacaoCor()}`}>
                  ⚡ Polarização: {guia.polarizacao_score || 5}/10
                </span>
                {guia.score_viral && guia.score_viral >= 7 && (
                  <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                    🔥 Viral: {guia.score_viral}/10
                  </span>
                )}
              </div>
              <h2 className="text-lg font-medium text-[#E8E6E1]">{guia.titulo || guia.tensao}</h2>
              <p className="text-sm text-white/50 mt-1">Linha de raciocínio: {guia.linha_de_raciocinio}</p>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white/60">✕</button>
          </div>
        </div>

        {/* Content - Scrollável */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* 1. PERSONA */}
          <Section
            title="🎭 PERSONA"
            emoji="🎭"
            isOpen={expandedSections.persona}
            onToggle={() => toggleSection('persona')}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">Tipo:</span>
                <span className="text-xs font-medium text-white/80">{guia.persona_tipo || 'Não especificado'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">Emoção:</span>
                <span className="text-xs font-medium text-white/80">{guia.persona_emocional || 'Não especificado'}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-white/70 italic">"{guia.persona_descricao}"</p>
              </div>
            </div>
          </Section>

          {/* 2. ANTAGONISTA */}
          <Section
            title="⚔️ ANTAGONISTA"
            emoji="⚔️"
            isOpen={expandedSections.antagonista}
            onToggle={() => toggleSection('antagonista')}
          >
            <div className="space-y-2">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-white/80 font-medium">{guia.antagonista_nome || guia.antagonista}</p>
                <p className="text-xs text-white/50 mt-1">{guia.antagonista_descricao}</p>
              </div>
              <div className="text-sm text-white/60">
                <span className="text-white/40">Consequência invisível:</span> {guia.consequencia_invisivel}
              </div>
            </div>
          </Section>

          {/* 3. RITMO DO VÍDEO */}
          <Section
            title="⏱️ RITMO DO VÍDEO"
            emoji="⏱️"
            isOpen={expandedSections.ritmo}
            onToggle={() => toggleSection('ritmo')}
          >
            <div className="space-y-2">
              {guia.ritmo_video && Object.entries(guia.ritmo_video).map(([tempo, acao]) => (
                <div key={tempo} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-violet-400 font-mono">{tempo}</div>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-400 rounded-full" style={{ width: `${Math.random() * 50 + 50}%` }} />
                  </div>
                  <div className="text-xs text-white/70">{acao}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-white/40">
              Sugestão: grave seguindo essa estrutura de tempo para máxima retenção.
            </div>
          </Section>

          {/* 4. CENAS VISUAIS */}
          <Section
            title="🎬 CENAS VISUAIS"
            emoji="🎬"
            isOpen={expandedSections.cenas}
            onToggle={() => toggleSection('cenas')}
          >
            <ul className="space-y-2">
              {guia.cenas_visuais?.map((cena, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/70">
                  <span className="text-violet-400">🎬</span>
                  {cena}
                </li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-white/40">
              💡 Visualize essas imagens enquanto grava – elas ajudam a transmitir emoção.
            </div>
          </Section>

          {/* 5. TÓPICOS */}
          <Section
            title="📝 TÓPICOS PARA DESENVOLVER"
            emoji="📝"
            isOpen={expandedSections.topicos}
            onToggle={() => toggleSection('topicos')}
          >
            <ul className="space-y-1">
              {guia.topicos?.map((topico, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/70">
                  <span className="text-emerald-400">→</span>
                  {topico}
                </li>
              ))}
            </ul>
          </Section>

          {/* 6. FRASES DE IMPACTO */}
          <Section
            title="💬 FRASES DE IMPACTO"
            emoji="💬"
            isOpen={expandedSections.frases}
            onToggle={() => toggleSection('frases')}
          >
            <div className="space-y-2">
              {guia.frases_impacto?.map((frase, i) => (
                <div key={i} className="bg-amber-500/10 border-l-2 border-amber-500/30 p-2">
                  <p className="text-amber-400 text-sm italic">"{frase}"</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 7. O QUE NÃO FAZER */}
          <Section
            title="🚫 O QUE NÃO FAZER"
            emoji="🚫"
            isOpen={expandedSections.naoFazer}
            onToggle={() => toggleSection('naoFazer')}
          >
            <ul className="space-y-1">
              {guia.o_que_nao_fazer?.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-red-400/70">
                  <span>❌</span>
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          {/* 8. POSSÍVEIS COMENTÁRIOS */}
          <Section
            title="💬 POSSÍVEIS COMENTÁRIOS"
            emoji="💬"
            isOpen={expandedSections.comentarios}
            onToggle={() => toggleSection('comentarios')}
          >
            <div className="space-y-2">
              {guia.possiveis_comentarios?.map((comentario, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-2">
                  <p className="text-sm text-white/60">“{comentario}”</p>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-white/30">
              💡 Esses comentários indicam que o vídeo gerou identificação.
            </div>
          </Section>

          {/* 9. DESDOBRAMENTOS FUTUROS */}
          <Section
            title="🔄 DESDOBRAMENTOS FUTUROS"
            emoji="🔄"
            isOpen={expandedSections.desdobramentos}
            onToggle={() => toggleSection('desdobramentos')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {guia.desdobramentos?.map((desdob, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full">
                      {desdob.formato}
                    </span>
                  </div>
                  <p className="text-sm text-white/80">{desdob.titulo}</p>
                  <p className="text-xs text-white/40 mt-1">{desdob.angulo}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 10. GANCHO e CTA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
            <div>
              <div className="text-[10px] uppercase text-white/30 mb-1">🎬 GANCHO</div>
              <p className="text-amber-400 font-medium">"{guia.gancho}"</p>
            </div>
            <div>
              <div className="text-[10px] uppercase text-white/30 mb-1">📢 CTA</div>
              <p className="text-emerald-400 font-medium">"{guia.cta}"</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/[0.06] flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => onRecriar?.(guia)}
              className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 rounded-lg text-sm text-violet-400 transition"
            >
              🔄 Recriar mapa
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {/* marcar como gravado */}}
              className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-sm text-emerald-400 transition"
            >
              🎬 Marcar como gravado
            </button>
            <button
              onClick={() => {/* marcar como publicado */}}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm text-blue-400 transition"
            >
              📱 Marcar publicado
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-white/10 rounded-lg text-sm">Fechar</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Componente de seção expansível
function Section({ title, emoji, children, isOpen, onToggle }) {
  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-medium text-[#E8E6E1]">{title}</span>
        </div>
        <span className={`text-white/40 transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 space-y-3 border-t border-white/[0.06]"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}