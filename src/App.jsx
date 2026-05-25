// src/App.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Roteiros from './pages/Roteiros'
import Transcricoes from './pages/Transcricoes'
import GravacaoRapida from './pages/GravacaoRapida'
import VideoIA from './pages/VideoIA'
import RadarEstrategico from './components/RadarEstrategico'
import PainelIdentidade from './components/PainelIdentidade'
import GerenciadorAulas from './components/GerenciadorAulas'   // ← NOVO

const NAV = [
  { id: 'roteiros',     label: 'Roteiros',        icon: '▤' },
  { id: 'video',        label: 'Diretor de Criação', icon: '🎬' },
  { id: 'aulas',        label: 'Aulas',           icon: '📚' },   // ← NOVO
  { id: 'radar',        label: 'Radar',           icon: '📡' },
  { id: 'identidade',   label: 'Identidade',      icon: '🎯' },
  { id: 'transcricoes', label: 'Transcrições',    icon: '◈' },
  { id: 'gravacao',     label: 'Gravação',        icon: '⊙' },
]

export default function App() {
  const [page, setPage] = useState('video')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#1A1A1E] text-[#E8E6E1] font-sans flex">

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#1A1A1E]/95 backdrop-blur border-b border-white/[0.08] flex items-center justify-between px-4 h-12">
        <span className="text-sm font-medium tracking-tight text-[#E8E6E1]">Studio</span>
        <button onClick={() => setMenuOpen(o => !o)} className="w-8 h-8 flex flex-col items-center justify-center gap-1.5">
          <span className={`block w-5 h-px bg-white/60 transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
          <span className={`block w-5 h-px bg-white/60 transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-[3px]' : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden fixed top-12 left-0 right-0 z-20 bg-[#1A1A1E] border-b border-white/[0.08] py-1"
          >
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setMenuOpen(false) }}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  page === item.id ? 'text-[#E8E6E1] bg-white/[0.08]' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 border-r border-white/[0.08] flex-col py-6 px-4 fixed h-full z-10 bg-[#1A1A1E]">
        <div className="mb-8 px-2">
          <div className="text-xs font-medium tracking-[0.2em] uppercase text-[#6B6966] mb-1">Studio</div>
          <div className="text-base font-medium text-[#E8E6E1] tracking-tight">Conteúdo</div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                page === item.id ? 'bg-white/[0.08] text-[#E8E6E1]' : 'text-[#6B6966] hover:text-[#A8A5A0] hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="w-full md:ml-52 min-h-screen pt-12 md:pt-0 bg-[#1A1A1E]">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {page === 'roteiros'     && <Roteiros />}
            {page === 'video'        && <VideoIA />}
            {page === 'aulas'        && <GerenciadorAulas />}
            {page === 'radar'        && <RadarEstrategico />}
            {page === 'identidade'   && <PainelIdentidade />}
            {page === 'transcricoes' && <Transcricoes />}
            {page === 'gravacao'     && <GravacaoRapida />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}