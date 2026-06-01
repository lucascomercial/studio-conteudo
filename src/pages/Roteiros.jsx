// src/pages/Roteiros.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const FORMATO_ICONES = {
  selfie_andando: '🚶 Selfie andando',
  mesa: '📋 Mesa',
  tom_calmo: '🧘 Tom calmo',
  resposta_agressiva: '⚡ Resposta agressiva',
}

const EMOCAO_CORES = {
  medo: 'bg-red-500/20 text-red-400',
  ambicao: 'bg-emerald-500/20 text-emerald-400',
  vergonha: 'bg-pink-500/20 text-pink-400',
  ego: 'bg-violet-500/20 text-violet-400',
  frustracao: 'bg-amber-500/20 text-amber-400',
  prejuizo: 'bg-orange-500/20 text-orange-400',
  urgencia: 'bg-blue-500/20 text-blue-400',
}

const NARRATIVA_CORES = {
  ego: 'bg-violet-500/20 text-violet-400',
  perda: 'bg-orange-500/20 text-orange-400',
  status: 'bg-emerald-500/20 text-emerald-400',
  urgencia: 'bg-blue-500/20 text-blue-400',
  fracasso_silencioso: 'bg-amber-500/20 text-amber-400',
  bastidor: 'bg-purple-500/20 text-purple-400',
  confronto: 'bg-red-500/20 text-red-400',
}

function SpinIcon({ size = 4 }) {
  return (
    <svg className={`animate-spin w-${size} h-${size} shrink-0`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function Badge({ label, className }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${className}`}>{label}</span>
}

function GuiaModal({ guia, onClose, onDelete, onRecriar }) {
  const [deletando, setDeletando] = useState(false)
  const [roteiro, setRoteiro] = useState(guia.roteiro_video || '')
  const [gerandoRoteiro, setGerandoRoteiro] = useState(false)
  const [estiloRoteiro, setEstiloRoteiro] = useState('corrido')
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { setRoteiro(estiloRoteiro === 'cortes' ? (guia.roteiro_cortes || '') : (guia.roteiro_video || '')) }, [estiloRoteiro])
  const isProfundo = !!guia.o_que_isso_realmente_quer_dizer || !!guia.subtexto_escondido

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir o guia "${guia.titulo || guia.tensao_texto}"?`)) return
    setDeletando(true)
    try {
      const tabela = guia.tipo === 'profundo' ? 'guias_profundas' : 'guias_conteudo'
      const { error } = await supabase.from(tabela).delete().eq('id', guia.id)
      if (error) throw error
      onDelete(guia.id)
      onClose()
    } catch (err) {
      console.error('Erro ao deletar:', err)
      alert('Erro ao deletar: ' + err.message)
    } finally {
      setDeletando(false)
    }
  }

  const gerarRoteiro = async () => {
    if (gerandoRoteiro) return
    setGerandoRoteiro(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-roteiro`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ guia_id: guia.id, estilo: estiloRoteiro })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro na Edge Function')
      setRoteiro(result.roteiro)
      guia.roteiro_video = result.roteiro
      setCopiado(false)
    } catch (err) {
      console.error(err)
      alert('Erro ao gerar roteiro: ' + err.message)
    } finally {
      setGerandoRoteiro(false)
    }
  }

  const copiarRoteiro = async () => {
    if (!roteiro) return
    try {
      await navigator.clipboard.writeText(roteiro)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
      alert('Não foi possível copiar. Selecione o texto manualmente.')
    }
  }

  if (!guia) return null

  const getContrasteComum = () => {
    if (guia.contraste?.fraco) return guia.contraste.fraco.join(', ')
    if (guia.contraste?.comum) return guia.contraste.comum
    return 'Não especificado'
  }
  const getContrasteForte = () => {
    if (guia.contraste?.forte) return guia.contraste.forte.join(', ')
    if (guia.contraste?.especialista) return guia.contraste.especialista
    return 'Não especificado'
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
        className="bg-[#141416] border border-white/[0.08] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="p-5 border-b border-white/[0.06] flex items-start justify-between">
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                guia.publico_alvo === 'corretor' ? 'bg-blue-500/20 text-blue-400' :
                guia.publico_alvo === 'proprietario' ? 'bg-emerald-500/20 text-emerald-400' :
                guia.publico_alvo === 'comprador' ? 'bg-amber-500/20 text-amber-400' :
                'bg-violet-500/20 text-violet-400'
              }`}>
                🎯 {guia.publico_alvo === 'corretor' ? 'Corretor' : 
                    guia.publico_alvo === 'proprietario' ? 'Proprietário' :
                    guia.publico_alvo === 'comprador' ? 'Comprador' : 'Investidor'}
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full">{guia.status}</span>
              {guia.formato_sugerido && (
                <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full">
                  {FORMATO_ICONES[guia.formato_sugerido] || guia.formato_sugerido}
                </span>
              )}
              {guia.potencial_viral && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${guia.potencial_viral >= 8 ? 'bg-red-500/20 text-red-400' : guia.potencial_viral >= 6 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white/40'}`}>
                  🔥 Viral: {guia.potencial_viral}/10
                </span>
              )}
            </div>
            <h2 className="text-base font-medium text-[#E8E6E1]">{guia.titulo || guia.tensao_texto}</h2>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {guia.gancho && (
            <div>
              <div className="text-[10px] uppercase text-white/30 mb-1">🎬 GANCHO</div>
              <p className="text-amber-400">"{guia.gancho}"</p>
            </div>
          )}

          {guia.linha_de_raciocinio && (
            <div>
              <div className="text-[10px] uppercase text-white/30 mb-1">🧠 LINHA DE RACIOCÍNIO</div>
              <p className="text-[#E8E6E1]">{guia.linha_de_raciocinio}</p>
            </div>
          )}

          {guia.como_isso_vira_conteudo_de_camera && (
            <div className="bg-amber-500/10 border-l-2 border-amber-500/30 p-3 rounded-r-lg">
              <div className="text-[10px] uppercase text-amber-400/70 mb-1">🎯 FRASE PARA CÂMERA</div>
              <p className="text-amber-400 font-medium">"{guia.como_isso_vira_conteudo_de_camera}"</p>
            </div>
          )}

          {guia.ferida_original && (
            <div className="bg-red-500/10 border-l-2 border-red-500/30 p-3 rounded-r-lg">
              <div className="text-[10px] uppercase text-red-400/70 mb-1">🩸 FERIDA ORIGINAL</div>
              <p className="text-sm text-white/80">{guia.ferida_original}</p>
            </div>
          )}

          {guia.mecanismo_de_defesa && (
            <div className="bg-violet-500/10 border-l-2 border-violet-500/30 p-3 rounded-r-lg">
              <div className="text-[10px] uppercase text-violet-400/70 mb-1">🛡️ MECANISMO DE DEFESA</div>
              <p className="text-sm text-white/80">{guia.mecanismo_de_defesa}</p>
            </div>
          )}

          {guia.verdade_dificil && (
            <div className="bg-emerald-500/10 border-l-2 border-emerald-500/30 p-3 rounded-r-lg">
              <div className="text-[10px] uppercase text-emerald-400/70 mb-1">💎 VERDADE DIFÍCIL</div>
              <p className="text-sm text-white/80 italic">{guia.verdade_dificil}</p>
            </div>
          )}

          {isProfundo && (
            <>
              {guia.o_que_isso_realmente_quer_dizer && (
                <div>
                  <div className="text-[10px] uppercase text-white/30 mb-1">🎯 O QUE ISSO REALMENTE QUER DIZER</div>
                  <p className="text-white/80 italic">{guia.o_que_isso_realmente_quer_dizer}</p>
                </div>
              )}

              {guia.consequencia_invisivel && (
                <div>
                  <div className="text-[10px] uppercase text-white/30 mb-1">⚠️ CONSEQUÊNCIA INVISÍVEL</div>
                  <p className="text-white/70">{guia.consequencia_invisivel}</p>
                </div>
              )}

              {guia.comportamento_social_visivel?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase text-white/30 mb-1">👥 COMPORTAMENTO SOCIAL VISÍVEL</div>
                  <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
                    {guia.comportamento_social_visivel.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}

              {guia.sinais_reais_de_desconfianca?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase text-white/30 mb-1">🔍 SINAIS REAIS DE DESCONFIANÇA</div>
                  <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
                    {guia.sinais_reais_de_desconfianca.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}

              {guia.o_que_essa_pessoa_acredita?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase text-white/30 mb-1">💭 O QUE ESSA PESSOA ACREDITA</div>
                  <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
                    {guia.o_que_essa_pessoa_acredita.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}

              {guia.subtexto_escondido && (
                <div className="bg-violet-500/10 border-l-2 border-violet-500/30 p-3 rounded-r-lg">
                  <div className="text-[10px] uppercase text-violet-400/70 mb-1">🧩 SUBTEXTO ESCONDIDO</div>
                  <p className="text-sm text-white/80 italic">{guia.subtexto_escondido}</p>
                </div>
              )}

              {guia.visao_profunda && (
                <div className="bg-emerald-500/10 border-l-2 border-emerald-500/30 p-3 rounded-r-lg">
                  <div className="text-[10px] uppercase text-emerald-400/70 mb-1">🧠 VISÃO PROFUNDA</div>
                  <p className="text-sm text-white/80">{guia.visao_profunda}</p>
                </div>
              )}

              {guia.alma_do_conteudo && (
                <div className="text-center p-3 border border-white/20 rounded-lg bg-white/5">
                  <div className="text-[10px] uppercase text-white/30 mb-1">⚡ ALMA DO CONTEÚDO</div>
                  <p className="text-lg font-bold text-amber-400">{guia.alma_do_conteudo}</p>
                </div>
              )}

              {guia.energia_ideal && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><div className="text-[10px] uppercase text-white/30">INÍCIO</div><p className="text-xs text-white/80">{guia.energia_ideal.inicio}</p></div>
                  <div><div className="text-[10px] uppercase text-white/30">MEIO</div><p className="text-xs text-white/80">{guia.energia_ideal.meio}</p></div>
                  <div><div className="text-[10px] uppercase text-white/30">FINAL</div><p className="text-xs text-white/80">{guia.energia_ideal.final}</p></div>
                </div>
              )}

              {guia.tom_ideal && (
                <div>
                  <div className="text-[10px] uppercase text-white/30 mb-1">🎭 TOM IDEAL</div>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded-full">{guia.tom_ideal}</span>
                </div>
              )}

              {guia.risco_interpretacao_errada && (
                <div className="bg-red-500/10 border-l-2 border-red-500/30 p-3 rounded-r-lg">
                  <div className="text-[10px] uppercase text-red-400/70 mb-1">⚠️ RISCO DE INTERPRETAÇÃO ERRADA</div>
                  <p className="text-sm text-white/70">{guia.risco_interpretacao_errada}</p>
                </div>
              )}

              {guia.como_aparece_na_vida_real?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase text-white/30 mb-1">🎬 COMO ISSO APARECE NA VIDA REAL</div>
                  <ul className="space-y-1">
                    {guia.como_aparece_na_vida_real.map((cena, i) => <li key={i} className="text-sm text-white/70">→ {cena}</li>)}
                  </ul>
                </div>
              )}

              {guia.micro_cenas?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase text-white/30 mb-1">🎥 MICRO CENAS</div>
                  <ul className="space-y-1">
                    {guia.micro_cenas.map((cena, i) => <li key={i} className="text-sm text-white/60">• {cena}</li>)}
                  </ul>
                </div>
              )}

              {guia.o_que_cliente_pensa && (
                <div className="bg-blue-500/10 border-l-2 border-blue-500/30 p-3 rounded-r-lg">
                  <div className="text-[10px] uppercase text-blue-400/70 mb-1">👁️ O QUE O CLIENTE REALMENTE PENSA</div>
                  <p className="text-sm text-white/80 italic">"{guia.o_que_cliente_pensa}"</p>
                </div>
              )}

              {guia.contraste && (
                <div>
                  <div className="text-[10px] uppercase text-white/30 mb-1">⚔️ CONTRASTE</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 p-2 rounded">
                      <div className="text-xs text-white/40">CORRETOR COMUM</div>
                      <p className="text-sm text-white/70">{getContrasteComum()}</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded">
                      <div className="text-xs text-white/40">ESPECIALISTA</div>
                      <p className="text-sm text-white/70">{getContrasteForte()}</p>
                    </div>
                  </div>
                </div>
              )}

              {guia.o_que_mercado_nao_perdoa && (
                <div className="bg-red-500/10 border-l-2 border-red-500/30 p-3 rounded-r-lg">
                  <div className="text-[10px] uppercase text-red-400/70 mb-1">🏛️ O QUE O MERCADO NÃO PERDOA</div>
                  <p className="text-sm text-white/80">{guia.o_que_mercado_nao_perdoa}</p>
                </div>
              )}
            </>
          )}

          {guia.topicos?.length > 0 && (
            <div>
              <div className="text-[10px] uppercase text-white/30 mb-1">📝 TÓPICOS</div>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                {guia.topicos.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          {guia.frases_impacto?.length > 0 && (
            <div>
              <div className="text-[10px] uppercase text-white/30 mb-1">💬 FRASES IMPACTO</div>
              {guia.frases_impacto.map((f, i) => <p key={i} className="text-white/50 italic">"{f}"</p>)}
            </div>
          )}

          {guia.cta && (
            <div>
              <div className="text-[10px] uppercase text-white/30 mb-1">📢 CTA</div>
              <p className="text-emerald-400">"{guia.cta}"</p>
            </div>
          )}

          {/* SEÇÃO DE ROTEIRO PARA VÍDEO */}
          <div className="border-t border-white/[0.06] pt-4 mt-2">
            <div className="flex justify-between items-center mb-3">
              <div className="text-[10px] uppercase text-white/30">🎙️ ROTEIRO PARA VÍDEO</div>
              <div className="flex gap-2 items-center">
                <div className="flex gap-1">
                  {[{id:'corrido',label:'🎙️ Corrido'},{id:'cortes',label:'✂️ Cortes'}].map(({id,label}) => (
                    <button key={id} onClick={() => setEstiloRoteiro(id)} disabled={gerandoRoteiro}
                      className={`text-xs px-2.5 py-1 rounded transition border ${estiloRoteiro===id?'bg-white/15 border-white/25 text-white/70':'bg-white/[0.04] border-white/[0.07] text-white/30 hover:bg-white/[0.08]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={gerarRoteiro}
                  disabled={gerandoRoteiro}
                  className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-1 rounded disabled:opacity-40"
                >
                  {gerandoRoteiro ? <SpinIcon size={3} /> : (roteiro ? 'Regenerar' : 'Gerar')}
                </button>
                {roteiro && (
                  <button
                    onClick={copiarRoteiro}
                    className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded transition"
                  >
                    {copiado ? '✓ Copiado!' : '📋 Copiar'}
                  </button>
                )}
              </div>
            </div>
            {roteiro ? (
              <div className="bg-white/5 p-4 rounded-lg whitespace-pre-wrap text-sm text-white/80 leading-relaxed">
                {roteiro}
              </div>
            ) : (
              <p className="text-xs text-white/30 text-center py-4">
                Clique em "Gerar" para criar o roteiro (90-120s de fala contínua).
              </p>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-white/[0.06] flex justify-between gap-3">
          <button
            onClick={handleDelete}
            disabled={deletando}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm text-red-400 transition disabled:opacity-40"
          >
            {deletando ? 'Excluindo...' : '🗑️ Excluir guia'}
          </button>
          <div className="flex gap-2">
            {onRecriar && (
              <button
                onClick={() => onRecriar(guia)}
                className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 rounded-lg text-sm text-violet-400 transition"
              >
                🔄 Recriar guia
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 bg-white/10 rounded-lg text-sm">Fechar</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Roteiros() {
  const [guias, setGuias] = useState([])
  const [roteirosLegado, setRoteirosLegado] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalGuia, setModalGuia] = useState(null)
  const [activeTab, setActiveTab] = useState('guias')
  const [filtroPublico, setFiltroPublico] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  const recriarGuia = async (guia) => {
    if (!confirm('Recriar esta guia com o novo prompt? A guia atual será substituída.')) return

    let tensaoId = guia.tensao_id

    if (!tensaoId) {
      const tensaoTexto = guia.tensao_texto || guia.titulo
      if (!tensaoTexto) {
        alert('❌ Não foi possível identificar a tensão original.')
        return
      }
      const { data: tensaoEncontrada, error: buscaError } = await supabase
        .from('tensoes')
        .select('id')
        .eq('tensao', tensaoTexto)
        .maybeSingle()
      if (buscaError || !tensaoEncontrada) {
        alert('❌ Não foi encontrar a tensão original no banco.')
        return
      }
      tensaoId = tensaoEncontrada.id
      await supabase.from('guias_profundas').update({ tensao_id: tensaoId }).eq('id', guia.id)
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-guia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          tensao_id: tensaoId,
          tensao_texto: guia.tensao_texto || guia.titulo
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro na Edge Function')

      const novaGuia = result.guia

      await supabase
        .from('guias_profundas')
        .update({
          tensao_id: tensaoId,
          publico_alvo: novaGuia.publico || guia.publico_alvo,
          narrativa: novaGuia.narrativa,
          emocao: novaGuia.emocao,
          potencial_viral: typeof novaGuia.potencial_viral === 'number' ? novaGuia.potencial_viral : 5,
          nivel_confronto: novaGuia.nivel_confronto,
          tensao_principal: novaGuia.tensao_principal,
          gancho: novaGuia.sugestoes_de_gancho?.[0] || '',
          sugestoes_de_gancho: novaGuia.sugestoes_de_gancho || [],
          direcao: novaGuia.direcao,
          linha_de_raciocinio: novaGuia.linha_de_raciocinio,
          o_que_isso_realmente_quer_dizer: novaGuia.o_que_isso_realmente_quer_dizer,
          consequencia_invisivel: novaGuia.consequencia_invisivel,
          ponto_central: novaGuia.ponto_central,
          como_aparece_na_vida_real: novaGuia.como_aparece_na_vida_real || [],
          o_que_essa_pessoa_acredita: novaGuia.o_que_essa_pessoa_acredita || [],
          o_que_realmente_doi: novaGuia.o_que_realmente_doi,
          o_que_esta_tentando_alertar: novaGuia.o_que_esta_tentando_alertar,
          o_que_enxergou_que_outros_nao: novaGuia.o_que_enxergou_que_outros_nao,
          verdadeiro_problema_escondido: novaGuia.verdadeiro_problema_escondido,
          por_que_doi_tanto: novaGuia.por_que_doi_tanto,
          comportamento_corrigido: novaGuia.comportamento_corrigido,
          o_que_ja_viu_na_vida_real: novaGuia.o_que_ja_viu_na_vida_real || [],
          o_que_cliente_pensa: novaGuia.o_que_cliente_pensa,
          o_que_mercado_nao_perdoa: novaGuia.o_que_mercado_nao_perdoa,
          contraste: novaGuia.contraste,
          subtexto_escondido: novaGuia.subtexto_escondido,
          visao_profunda: novaGuia.visao_profunda,
          alma_do_conteudo: novaGuia.alma_do_conteudo,
          sensacao_final: novaGuia.sensacao_final,
          micro_cenas: novaGuia.micro_cenas || [],
          o_que_nao_pode_faltar: novaGuia.o_que_nao_pode_faltar || [],
          topicos: novaGuia.topicos || [],
          frases_fortes: novaGuia.frases_impacto || [],
          o_que_evitar: novaGuia.o_que_evitar || [],
          energia_ideal: novaGuia.energia_ideal,
          tom_ideal: novaGuia.tom_ideal,
          risco_interpretacao_errada: novaGuia.risco_interpretacao_errada,
          cta: novaGuia.cta,
          ferida_original: novaGuia.ferida_original,
          mecanismo_de_defesa: novaGuia.mecanismo_de_defesa,
          comportamento_social_visivel: novaGuia.comportamento_social_visivel || [],
          verdade_dificil: novaGuia.verdade_dificil,
          sinais_reais_de_desconfianca: novaGuia.sinais_reais_de_desconfianca || [],
          como_isso_vira_conteudo_de_camera: novaGuia.como_isso_vira_conteudo_de_camera,
          updated_at: new Date().toISOString()
        })
        .eq('id', guia.id)

      alert('✅ Guia recriada com sucesso!')
      setModalGuia(null)
      carregarDados()
    } catch (err) {
      console.error('Erro ao recriar:', err)
      alert('Erro ao recriar: ' + err.message)
    }
  }

  async function carregarDados() {
    setLoading(true)

    const { data: guiasAntigos } = await supabase
      .from('guias_conteudo')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: guiasProfundos } = await supabase
      .from('guias_profundas')
      .select('*')
      .order('created_at', { ascending: false })

    const unificados = [
      ...(guiasAntigos || []).map(g => ({
        ...g,
        tipo: 'simples',
        frases_impacto: g.frases_impacto,
        potencial_viral: g.potencial_viral || 5,
        emocao: g.emocao,
        narrativa: g.narrativa,
        created_at: g.created_at || new Date(0).toISOString(),
      })),
      ...(guiasProfundos || []).map(p => ({
        id: p.id,
        tensao_id: p.tensao_id,
        tensao_texto: p.tensao_texto,
        titulo: p.titulo || p.tensao_texto,
        gancho: p.gancho,
        linha_de_raciocinio: p.linha_de_raciocinio,
        topicos: p.topicos,
        frases_impacto: p.frases_fortes || [],
        cta: p.cta,
        publico_alvo: p.publico_alvo,
        status: p.status || 'pendente',
        formato_sugerido: p.formato_sugerido,
        potencial_viral: p.potencial_viral || 5,
        emocao: p.emocao,
        narrativa: p.narrativa,
        o_que_isso_realmente_quer_dizer: p.o_que_isso_realmente_quer_dizer,
        consequencia_invisivel: p.consequencia_invisivel,
        comportamento_corrigido: p.comportamento_corrigido,
        o_que_ele_provavelmente_ja_viu: p.o_que_ele_provavelmente_ja_viu,
        municao_argumentativa: p.municao_argumentativa,
        como_aparece_na_vida_real: p.como_aparece_na_vida_real,
        o_que_essa_pessoa_acredita: p.o_que_essa_pessoa_acredita,
        o_que_realmente_doi: p.o_que_realmente_doi,
        subtexto_escondido: p.subtexto_escondido,
        micro_cenas: p.micro_cenas,
        erro_invisivel: p.erro_invisivel,
        o_que_entrega_amador: p.o_que_entrega_amador,
        o_que_cliente_pensa: p.o_que_cliente_pensa,
        contraste: p.contraste,
        o_que_mercado_nao_perdoa: p.o_que_mercado_nao_perdoa,
        momento_virada: p.momento_virada,
        sensacao_que_video_precisa_passar: p.sensacao_que_video_precisa_passar,
        o_que_pessoa_entendeu_mercado: p.o_que_pessoa_entendeu_mercado,
        frase_alma_conteudo: p.frase_alma_conteudo,
        visao_profunda: p.visao_profunda,
        alma_do_conteudo: p.alma_do_conteudo,
        energia_ideal: p.energia_ideal,
        tom_ideal: p.tom_ideal,
        risco_interpretacao_errada: p.risco_interpretacao_errada,
        ferida_original: p.ferida_original,
        mecanismo_de_defesa: p.mecanismo_de_defesa,
        comportamento_social_visivel: p.comportamento_social_visivel || [],
        verdade_dificil: p.verdade_dificil,
        sinais_reais_de_desconfianca: p.sinais_reais_de_desconfianca || [],
        como_isso_vira_conteudo_de_camera: p.como_isso_vira_conteudo_de_camera,
        roteiro_video: p.roteiro_video || '',
        tipo: 'profundo',
        created_at: p.created_at || new Date(0).toISOString(),
      })),
    ]

    unificados.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const { data: roteirosData } = await supabase
      .from('roteiros')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    setGuias(unificados)
    setRoteirosLegado(roteirosData || [])
    setLoading(false)
  }

  const guiasFiltradas = guias
    .filter(guia => {
      // Filtro de público
      if (filtroPublico && guia.publico_alvo !== filtroPublico) return false
      // Filtro de status
      if (filtroStatus && guia.status !== filtroStatus) return false
      // Filtro de busca — aplica em cima dos filtros anteriores
      if (busca) {
        const termo = busca.toLowerCase()
        const campos = [
          guia.titulo,
          guia.tensao_texto,
          guia.linha_de_raciocinio,
          guia.alma_do_conteudo,
          guia.gancho,
        ]
        return campos.some(c => c?.toLowerCase().includes(termo))
      }
      return true
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const handleDeleteGuide = (id) => {
    setGuias(prev => prev.filter(g => g.id !== id))
    if (modalGuia?.id === id) setModalGuia(null)
  }

  const limparFiltros = () => {
    setFiltroPublico('')
    setFiltroStatus('')
    setBusca('')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-white/30">Carregando...</div>
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-white/[0.06] px-6 py-4 bg-[#0C0C0E]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-medium text-[#E8E6E1]">🎯 Central de Conteúdo Estratégico</h1>
            <p className="text-xs text-white/30 mt-0.5">
              {activeTab === 'guias' ? `${guiasFiltradas.length} de ${guias.length} guias disponíveis` : `${roteirosLegado.length} roteiros (legado)`}
            </p>
          </div>
          <button onClick={carregarDados} className="text-xs bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded transition">
            ↻ Recarregar
          </button>
        </div>
      </div>

      <div className="border-b border-white/[0.06] px-6 flex gap-6">
        <button onClick={() => setActiveTab('guias')} className={`pb-3 text-sm transition-colors border-b-2 ${activeTab === 'guias' ? 'text-[#E8E6E1] border-white/40' : 'text-white/30 border-transparent hover:text-white/50'}`}>
          🎯 Guias de Criação (unificado)
        </button>
        <button onClick={() => setActiveTab('legado')} className={`pb-3 text-sm transition-colors border-b-2 ${activeTab === 'legado' ? 'text-[#E8E6E1] border-white/40' : 'text-white/30 border-transparent hover:text-white/50'}`}>
          📜 Roteiros (legado)
        </button>
      </div>

      {activeTab === 'guias' && (
        <div className="border-b border-white/[0.06] px-6 py-3 overflow-x-auto bg-[#0E0E10]">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative shrink-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25 text-xs">⌕</span>
              <input type="text" placeholder="Buscar guia..." value={busca} onChange={e => setBusca(e.target.value)} className="bg-white/[0.04] border border-white/[0.06] rounded-lg pl-7 pr-3 py-1.5 text-xs w-48" />
            </div>
            <select value={filtroPublico} onChange={e => setFiltroPublico(e.target.value)} className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white/50">
              <option value="">Todos os públicos</option>
              <option value="corretor">🎯 Corretor</option>
              <option value="proprietario">🏠 Proprietário</option>
              <option value="comprador">💰 Comprador</option>
              <option value="investidor">📈 Investidor</option>
            </select>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white/50">
              <option value="">📝 Todos status</option>
              <option value="pendente">📝 Pendente</option>
              <option value="gravado">🎬 Gravado</option>
              <option value="publicado">📱 Publicado</option>
            </select>
            {(busca || filtroPublico || filtroStatus) && (
              <button onClick={limparFiltros} className="text-xs text-white/30 hover:text-white/60">Limpar filtros</button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'guias' && (
          <>
            {guiasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <p className="text-white/25 text-sm">Nenhum guia encontrado</p>
                {(busca || filtroPublico || filtroStatus) ? (
                  <button onClick={limparFiltros} className="text-xs text-white/40 hover:text-white/60">Limpar filtros</button>
                ) : (
                  <p className="text-xs text-white/30">Processe um vídeo no Diretor de Criação ou gere mapas nas aulas</p>
                )}
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {guiasFiltradas.map(guia => (
                  <div key={guia.id} onClick={() => setModalGuia(guia)} className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 cursor-pointer hover:bg-[#161618] transition">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${guia.publico_alvo === 'corretor' ? 'bg-blue-500/20 text-blue-400' : guia.publico_alvo === 'proprietario' ? 'bg-emerald-500/20 text-emerald-400' : guia.publico_alvo === 'comprador' ? 'bg-amber-500/20 text-amber-400' : 'bg-violet-500/20 text-violet-400'}`}>
                        {guia.publico_alvo === 'corretor' ? '🎯 Corretor' : guia.publico_alvo === 'proprietario' ? '🏠 Proprietário' : guia.publico_alvo === 'comprador' ? '💰 Comprador' : '📈 Investidor'}
                      </span>
                      {guia.emocao && <span className={`text-[10px] px-2 py-0.5 rounded-full ${EMOCAO_CORES[guia.emocao] || 'bg-white/10'}`}>{guia.emocao}</span>}
                      {guia.potencial_viral >= 7 && <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">🔥 {guia.potencial_viral}</span>}
                      {guia.tipo === 'profundo' && <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full">🧠 Profundo</span>}
                    </div>
                    <h3 className="text-sm font-medium text-[#E8E6E1] line-clamp-2">{guia.titulo || guia.tensao_texto}</h3>
                    {guia.gancho && <p className="text-xs text-white/40 mt-1 line-clamp-2">"{guia.gancho}"</p>}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.06]">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${guia.status === 'gravado' ? 'bg-amber-500/20 text-amber-400' : guia.status === 'publicado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/30'}`}>
                        {guia.status === 'gravado' ? '🎬 Gravado' : guia.status === 'publicado' ? '📱 Publicado' : '📝 Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'legado' && (
          <>
            {roteirosLegado.length === 0 ? (
              <div className="text-center py-12 text-white/30">Nenhum roteiro legado encontrado.</div>
            ) : (
              <div className="space-y-3">
                {roteirosLegado.map(roteiro => (
                  <div key={roteiro.id} className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge label={roteiro.pilar || 'sem pilar'} className="bg-white/10 text-white/50" />
                          <Badge label={roteiro.status || 'backlog'} className="bg-white/10 text-white/50" />
                          <Badge label={roteiro.publico === 'corretor' ? '🎯 Corretor' : '🏠 Proprietário'} className="bg-white/10 text-white/50" />
                        </div>
                        <h3 className="text-sm font-medium text-[#E8E6E1]">{roteiro.titulo}</h3>
                        {roteiro.gancho && <p className="text-xs text-white/50 mt-1 line-clamp-2">{roteiro.gancho}</p>}
                        <div className="text-[10px] text-white/30 mt-2">{new Date(roteiro.created_at).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {modalGuia && (
          <GuiaModal
            guia={modalGuia}
            onClose={() => setModalGuia(null)}
            onDelete={handleDeleteGuide}
            onRecriar={recriarGuia}
          />
        )}
      </AnimatePresence>
    </div>
  )
}