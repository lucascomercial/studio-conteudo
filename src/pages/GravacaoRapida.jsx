// src/pages/GravacaoRapida.jsx
// Modo foco — aparece só o essencial para gravar
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const PILAR_COLORS = {
  precificacao: 'text-amber-400',
  captacao:     'text-teal-400',
  atendimento:  'text-blue-400',
  marketing:    'text-pink-400',
  posvenda:     'text-orange-400',
  mentalidade:  'text-violet-400',
}

export default function GravacaoRapida() {
  const [roteiros, setRoteiros] = useState([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [gravado, setGravado] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  useEffect(() => {
    loadBacklog()
  }, [])

  async function loadBacklog() {
    const { data } = await supabase
      .from('roteiros')
      .select('id, titulo, gancho, corpo, cta, pilar, publico, tom, duracao')
      .eq('status', 'backlog')
      .order('potencial_viral', { ascending: false })
    setRoteiros(data || [])
    setLoading(false)
  }

  const roteiro = roteiros[index]

  const handleGravado = async () => {
    if (!roteiro) return
    setGravado(true)
    await supabase.from('roteiros').update({ status: 'gravado' }).eq('id', roteiro.id)

    // Registrar na produtividade
    const hoje = new Date().toISOString().split('T')[0]
    await supabase.rpc('increment_gravados', { data_param: hoje }).catch(() =>
      supabase.from('produtividade').upsert({ data: hoje, gravados: 1 }, { onConflict: 'data' })
    )

    setTimeout(() => {
      setConfirmado(true)
      setTimeout(() => {
        setGravado(false)
        setConfirmado(false)
        setIndex(i => i + 1)
      }, 1200)
    }, 300)
  }

  const handlePular = () => setIndex(i => i + 1)
  const handleAnterior = () => setIndex(i => Math.max(0, i - 1))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white/30 text-sm">
        Carregando...
      </div>
    )
  }

  if (!roteiro || index >= roteiros.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-4xl opacity-20">✓</div>
        <p className="text-white/30 text-sm">
          {roteiros.length === 0 ? 'Nenhum roteiro no backlog' : 'Todos os roteiros revisados!'}
        </p>
        <button
          onClick={() => setIndex(0)}
          className="text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          Reiniciar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      {/* Progresso */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/25">{index + 1} de {roteiros.length} no backlog</span>
          <span className={`text-xs font-medium ${PILAR_COLORS[roteiro.pilar] || 'text-white/30'}`}>
            {roteiro.pilar}
          </span>
        </div>
        <div className="h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white/20 rounded-full"
            animate={{ width: `${((index + 1) / roteiros.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card principal */}
      <AnimatePresence mode="wait">
        <motion.div
          key={roteiro.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg"
        >
          {/* Duração + tom */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs text-white/30">{roteiro.duracao}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-xs text-white/30">{roteiro.tom}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-xs text-white/30">{roteiro.publico}</span>
          </div>

          {/* Título */}
          <h1 className="text-xl font-medium text-[#E8E6E1] leading-snug mb-8 tracking-tight">
            {roteiro.titulo}
          </h1>

          {/* Gancho */}
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-widest text-white/20 mb-2">Gancho</div>
            <div className="border-l-2 border-white/20 pl-4">
              <p className="text-base text-[#E8E6E1] font-medium leading-relaxed">
                {roteiro.gancho}
              </p>
            </div>
          </div>

          {/* Corpo */}
          {roteiro.corpo && (
            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-widest text-white/20 mb-2">Desenvolvimento</div>
              <p className="text-sm text-white/60 leading-relaxed">
                {roteiro.corpo}
              </p>
            </div>
          )}

          {/* CTA */}
          {roteiro.cta && (
            <div className="mb-8">
              <div className="text-[10px] uppercase tracking-widest text-white/20 mb-2">CTA</div>
              <p className="text-sm text-white/50 italic">
                {roteiro.cta}
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnterior}
              disabled={index === 0}
              className="p-2.5 rounded-lg border border-white/[0.06] text-white/30 hover:text-white/60 transition-all disabled:opacity-20"
            >
              ←
            </button>

            <button
              onClick={handlePular}
              className="flex-1 py-2.5 rounded-lg border border-white/[0.06] text-white/30 hover:text-white/50 text-sm transition-all"
            >
              Pular
            </button>

            <motion.button
              onClick={handleGravado}
              disabled={gravado}
              animate={confirmado ? { scale: [1, 1.05, 1] } : {}}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                confirmado
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-[#E8E6E1]'
              }`}
            >
              {confirmado ? '✓ Gravado!' : '⊙ Marcar como gravado'}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Contador do dia */}
      <DiaCounter />
    </div>
  )
}

function DiaCounter() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0]
    supabase.from('produtividade')
      .select('gravados')
      .eq('data', hoje)
      .single()
      .then(({ data }) => setCount(data?.gravados || 0))
  }, [])

  if (count === null) return null

  return (
    <div className="mt-12 text-center">
      <p className="text-2xl font-medium text-white/20">{count}</p>
      <p className="text-xs text-white/15 mt-0.5">gravados hoje</p>
    </div>
  )
}
