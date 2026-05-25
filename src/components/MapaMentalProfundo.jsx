// src/components/MapaMentalProfundo.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MapaMentalProfundo({ guia, onClose, onRecriar }) {
  const [expandedSections, setExpandedSections] = useState({
    superficie: true,
    comportamento: true,
    psicologia: true,
    execucao: true
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const getViralBadge = (score) => {
    if (score >= 8) return { bg: 'bg-red-500/20', text: 'text-red-400', label: '🔥 Altíssimo potencial' }
    if (score >= 6) return { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '⚡ Alto potencial' }
    return { bg: 'bg-white/10', text: 'text-white/40', label: '📈 Médio potencial' }
  }

  const viralBadge = getViralBadge(guia.potencial_viral || 5)

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
        className="bg-[#141416] border border-white/[0.08] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${guia.publico_alvo === 'corretor' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  🎯 {guia.publico_alvo === 'corretor' ? 'Corretor' : 'Proprietário'}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full">
                  📖 {guia.narrativa || 'Não definida'}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full">
                  😰 {guia.emocao || 'Não definida'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${viralBadge.bg} ${viralBadge.text}`}>
                  {viralBadge.label}
                </span>
                {guia.intensidade === 'forte' && (
                  <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                    ⚔️ Polarizador
                  </span>
                )}
              </div>
              <h2 className="text-lg font-medium text-[#E8E6E1]">{guia.titulo || guia.tensao_texto}</h2>
              {guia.persona_tipo && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-white/40">🎭 Persona:</span>
                  <span className="text-xs text-white/80">{guia.persona_tipo.replace(/_/g, ' ')}</span>
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white/60">✕</button>
          </div>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* GANCHO + DIREÇÃO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-amber-500/10 border-l-2 border-amber-500/30 p-3 rounded-r-lg">
              <div className="text-[10px] uppercase text-amber-400/70 mb-1">🎬 GANCHO</div>
              <p className="text-amber-400 font-medium">"{guia.gancho}"</p>
            </div>
            <div className="bg-violet-500/10 border-l-2 border-violet-500/30 p-3 rounded-r-lg">
              <div className="text-[10px] uppercase text-violet-400/70 mb-1">🎯 DIREÇÃO</div>
              <p className="text-sm text-white/80">{guia.direcao || 'Confrontar o comportamento errado'}</p>
            </div>
          </div>

          {/* LINHA DE RACIOCÍNIO */}
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-[10px] uppercase text-white/30 mb-1">🧠 LINHA DE RACIOCÍNIO</div>
            <p className="text-sm text-white/70">{guia.linha_de_raciocinio}</p>
          </div>

          {/* PROFUNDIDADE */}
          <Section
            title="🧠 O QUE ISSO REALMENTE QUER DIZER"
            isOpen={expandedSections.superficie}
            onToggle={() => toggleSection('superficie')}
          >
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-white/80 italic">{guia.o_que_isso_realmente_quer_dizer}</p>
              </div>
              <div>
                <div className="text-[10px] uppercase text-white/30 mb-1">⚠️ CONSEQUÊNCIA INVISÍVEL</div>
                <p className="text-sm text-white/60">{guia.consequencia_invisivel || 'Não especificada'}</p>
              </div>
              <div>
                <div className="text-[10px] uppercase text-white/30 mb-1">🎯 PONTO CENTRAL</div>
                <p className="text-sm text-white/80 font-medium">{guia.ponto_central}</p>
              </div>
            </div>
          </Section>

          {/* COMPORTAMENTO HUMANO */}
          <Section
            title="🧍 COMO ISSO APARECE NA VIDA REAL"
            isOpen={expandedSections.comportamento}
            onToggle={() => toggleSection('comportamento')}
          >
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase text-white/30 mb-2">Comportamentos observáveis</div>
                <ul className="space-y-2">
                  {guia.como_isso_aparece_na_vida_real?.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-white/70">
                      <span className="text-amber-400">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] uppercase text-white/30 mb-2">🪞 O que essa pessoa ACREDITA</div>
                <ul className="space-y-2">
                  {guia.o_que_essa_pessoa_acredita?.map((crenca, i) => (
                    <li key={i} className="flex gap-2 text-sm text-white/70">
                      <span className="text-violet-400">💭</span>
                      "{crenca}"
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-500/10 border-l-2 border-red-500/30 p-3 rounded-r-lg">
                <div className="text-[10px] uppercase text-red-400/70 mb-1">💥 O QUE REALMENTE DÓI</div>
                <p className="text-sm text-white/80">{guia.o_que_realmente_doi}</p>
              </div>
            </div>
          </Section>

          {/* SUBTEXTO + ENERGIA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-emerald-500/10 border-l-2 border-emerald-500/30 p-3 rounded-r-lg">
              <div className="text-[10px] uppercase text-emerald-400/70 mb-1">🧩 SUBTEXTO ESCONDIDO</div>
              <p className="text-sm text-white/80 italic">{guia.subtexto_escondido}</p>
            </div>
            <div className="bg-blue-500/10 border-l-2 border-blue-500/30 p-3 rounded-r-lg">
              <div className="text-[10px] uppercase text-blue-400/70 mb-1">🎥 ENERGIA IDEAL</div>
              {guia.energia_inicio && <p className="text-sm text-white/80">🎬 Início: {guia.energia_inicio}</p>}
              {guia.energia_meio && <p className="text-sm text-white/80 mt-1">📈 Meio: {guia.energia_meio}</p>}
              {guia.energia_final && <p className="text-sm text-white/80 mt-1">⚡ Final: {guia.energia_final}</p>}
              {!guia.energia_inicio && !guia.energia_meio && !guia.energia_final && (
                <p className="text-sm text-white/40 italic">Não especificada</p>
              )}
            </div>
          </div>

          {/* TÓPICOS */}
          <Section
            title="📝 TÓPICOS PARA DESENVOLVER"
            isOpen={expandedSections.execucao}
            onToggle={() => toggleSection('execucao')}
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

          {/* FRASES FORTES */}
          <div>
            <div className="text-[10px] uppercase text-white/30 mb-2">🔥 FRASES FORTES</div>
            <div className="space-y-2">
              {guia.frases_impacto?.map((frase, i) => (
                <div key={i} className="bg-amber-500/10 border-l-2 border-amber-500/30 p-2">
                  <p className="text-amber-400 text-sm">"{frase}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* O QUE EVITAR */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
            <div className="text-[10px] uppercase text-red-400/70 mb-2">🚫 O QUE EVITAR</div>
            <div className="flex flex-wrap gap-2">
              {guia.o_que_evitar?.map((item, i) => (
                <span key={i} className="text-xs text-red-400/70">❌ {item}</span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-emerald-500/10 border-l-2 border-emerald-500/30 p-3 rounded-r-lg">
            <div className="text-[10px] uppercase text-emerald-400/70 mb-1">📢 CTA</div>
            <p className="text-emerald-400 font-medium">"{guia.cta}"</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/[0.06] flex justify-between">
          <button
            onClick={() => onRecriar?.(guia)}
            className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 rounded-lg text-sm text-violet-400 transition"
          >
            🔄 Recriar mapa
          </button>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-sm text-emerald-400 transition">
              🎬 Marcar gravado
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-white/10 rounded-lg text-sm">Fechar</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Section({ title, children, isOpen, onToggle }) {
  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] transition"
      >
        <span className="text-sm font-medium text-[#E8E6E1]">{title}</span>
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