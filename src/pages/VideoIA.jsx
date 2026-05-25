// src/pages/VideoIA.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { callOpenAI, callOpenAIJSON, callOpenAIJSONPremium } from '../lib/openai'
import { prompts, chunkTranscript } from '../lib/prompts'

const PLATAFORMA_INFO = {
  youtube:   { label: 'YouTube',   icon: '▶', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  instagram: { label: 'Instagram', icon: '◉', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  tiktok:    { label: 'TikTok',    icon: '♪', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
}

const GATILHO_COLORS = {
  ego: 'bg-violet-500/10 text-violet-400',
  dinheiro: 'bg-amber-500/10 text-amber-400',
  medo: 'bg-red-500/10 text-red-400',
  tempo: 'bg-blue-500/10 text-blue-400',
  prejuizo: 'bg-orange-500/10 text-orange-400',
  vergonha: 'bg-pink-500/10 text-pink-400',
  ambicao: 'bg-emerald-500/10 text-emerald-400',
  fracasso: 'bg-red-500/10 text-red-400',
}

const POTENCIAL_COLORS = {
  alto: 'bg-emerald-500/10 text-emerald-400',
  medio: 'bg-amber-500/10 text-amber-400',
  baixo: 'bg-white/5 text-white/30',
}

const FORMATO_ICONES = {
  selfie_andando: '🚶 Selfie andando',
  mesa: '📋 Mesa',
  tom_calmo: '🧘 Tom calmo',
  resposta_agressiva: '⚡ Resposta agressiva',
}

function detectPlatform(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/instagram\.com/.test(url)) return 'instagram'
  if (/tiktok\.com/.test(url)) return 'tiktok'
  return null
}

function SpinIcon({ size = 4 }) {
  return (
    <svg className={`animate-spin w-${size} h-${size} shrink-0`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function VideoIA() {
  const [url, setUrl] = useState('')
  const [plataforma, setPlataforma] = useState(null)
  const [fase, setFase] = useState('idle')
  const [statusLabel, setStatusLabel] = useState('')
  const [erro, setErro] = useState('')
  const [tituloVideo, setTituloVideo] = useState('')
  const [resumo, setResumo] = useState('')
  const [tensoes, setTensoes] = useState([])
  const [guias, setGuias] = useState({})
  const [desdobramentos, setDesdobramentos] = useState({})
  const [gerandoGuia, setGerandoGuia] = useState(null)
  const [gerandoDesdob, setGerandoDesdob] = useState(null)
  const [gravandoId, setGravandoId] = useState(null)
  const [publicandoId, setPublicandoId] = useState(null)

  const handleUrlChange = (val) => {
    setUrl(val)
    setPlataforma(detectPlatform(val))
    setErro('')
  }

  const verificarUrlDuplicada = async (url) => {
    const { data, error } = await supabase
      .from('transcricoes')
      .select('id, titulo, temas_brutos, resumo, created_at, video_titulo, video_url')
      .eq('video_url', url)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) return null
    return data?.[0] || null
  }

  const handleProcessar = async () => {
    if (!url.trim() || !plataforma) return

    const existe = await verificarUrlDuplicada(url)
    if (existe) {
      const confirmar = confirm(
        `⚠️ Este vídeo já foi processado em ${new Date(existe.created_at).toLocaleDateString('pt-BR')}.\n\n` +
        `Título: "${existe.video_titulo || existe.titulo}"\n` +
        `Tensões extraídas: ${existe.temas_brutos?.length || 0}\n\n` +
        `Deseja REAPROVEITAR as tensões existentes?`
      )
      if (confirmar) {
        setResumo(existe.resumo || '')
        const tensoesExistentes = (existe.temas_brutos || []).map((t, idx) => ({
          ...t,
          id: null, // será substituído ao salvar
          status: 'pendente',
          criado_em: new Date().toISOString()
        }))
        setTensoes(tensoesExistentes)
        setTituloVideo(existe.video_titulo || existe.titulo)
        setFase('pronto')
        return
      }
    }

    setErro('')
    setFase('transcrevendo')
    setStatusLabel('Extraindo transcrição...')
    setTensoes([])
    setGuias({})

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const transcText = data.text
      const videoTitle = data.title
      setTituloVideo(videoTitle)

      setFase('extraindo')
      setStatusLabel('Extraindo tensões narrativas...')
      
      const dados = await callOpenAIJSON(prompts.extrairTensoes(transcText, videoTitle))
      setResumo(dados.resumo || '')
      
      const tensoesExtraidas = (dados.tensoes || []).map((t, idx) => ({ 
        ...t, 
        id: null, // ainda não salvo
        status: 'pendente',
        criado_em: new Date().toISOString()
      }))
      
      if (tensoesExtraidas.length) {
        const { data: transcInsert } = await supabase
          .from('transcricoes')
          .insert({
            titulo: videoTitle,
            video_titulo: videoTitle,
            video_url: url,
            tipo: plataforma,
            conteudo_original: transcText.substring(0, 10000),
            resumo: dados.resumo,
            temas_brutos: tensoesExtraidas,
            status: 'processado',
            modelo_extracao: 'gpt-4o-mini'
          })
          .select()
        
        const novasTensoes = []
        for (const tensao of tensoesExtraidas) {
          const { data: inserted, error } = await supabase
            .from('tensoes')
            .insert({
              transcricao_id: transcInsert?.[0]?.id,
              tensao: tensao.tensao,
              emocao: tensao.emocao,
              antagonista: tensao.antagonista,
              gatilhos: tensao.gatilhos,
              cenas: tensao.cenas_reais || [],
              frases_do_video: tensao.frases_do_video || [],
              angulo_principal: tensao.angulo_principal,
              angulos_secundarios: tensao.angulos_secundarios,
              formato_ideal: tensao.formato_ideal,
              potencial_viral: tensao.potencial_viral,
              status: 'pendente'
            })
            .select()
          if (error) {
            console.error('Erro ao salvar tensão:', error)
          } else if (inserted && inserted[0]) {
            novasTensoes.push({ ...tensao, id: inserted[0].id })
          }
        }
        setTensoes(novasTensoes)
      }

      setFase('pronto')
    } catch (e) {
      console.error(e)
      setErro(e.message)
      setFase('erro')
    }
  }

  // ============================================================
  // GERAR GUIA (DIRETO, SEM EDGE FUNCTION)
  // ============================================================
  const gerarGuia = async (tensao) => {
    if (!tensao.id || typeof tensao.id !== 'number') {
      console.error('ID da tensão inválido:', tensao.id)
      alert('Erro: ID da tensão inválido. Recarregue a página.')
      return
    }
    const key = tensao.id
    setGerandoGuia(key)
    try {
      const { data: guiaExistente } = await supabase
        .from('guias_profundas')
        .select('*')
        .eq('tensao_id', tensao.id)
        .maybeSingle()

      if (guiaExistente) {
        setGuias(prev => ({ ...prev, [key]: guiaExistente }))
        setGerandoGuia(null)
        return
      }

      const guia = await callOpenAIJSONPremium(prompts.extrairGuiaEstrategica(tensao))

      const { data: inserted, error } = await supabase
        .from('guias_profundas')
        .insert({
          tensao_id: tensao.id,
          tensao_texto: tensao.tensao,
          titulo: tensao.tensao.substring(0, 80),
          publico_alvo: ['corretor','proprietario','comprador','investidor'].includes(guia.publico) ? guia.publico : 'corretor',
          gancho: guia.sugestoes_de_gancho?.[0] || '',
          sugestoes_de_gancho: guia.sugestoes_de_gancho,
          direcao: guia.direcao,
          comportamentos_reais: guia.comportamentos_reais,
          o_que_essa_pessoa_acredita: guia.o_que_essa_pessoa_acredita,
          erro_invisivel: guia.erro_invisivel,
          o_que_realmente_doi: guia.o_que_realmente_doi,
          o_que_mercado_pensa: guia.o_que_mercado_pensa,
          contraste: guia.contraste,
          alma_do_conteudo: guia.alma_do_conteudo,
          sensacao_final: guia.sensacao_final,
          topicos: guia.topicos,
          frases_fortes: guia.frases_impacto,
          energia_ideal: guia.energia_ideal,
          cta: guia.cta,
          status: 'pendente',
        })
        .select()

      if (error) throw error
      setGuias(prev => ({ ...prev, [key]: inserted[0] }))
    } catch (err) {
      console.error(err)
      alert('Erro ao gerar guia: ' + err.message)
    } finally {
      setGerandoGuia(null)
    }
  }

  const gerarDesdobramentos = async (tensao) => {
    const key = tensao.id
    setGerandoDesdob(key)
    try {
      const desdob = await callOpenAIJSON(prompts.gerarDesdobramentos(tensao))
      setDesdobramentos(prev => ({ ...prev, [key]: desdob.desdobramentos || [] }))
    } catch (err) {
      console.error(err)
      alert('Erro ao gerar desdobramentos: ' + err.message)
    } finally {
      setGerandoDesdob(null)
    }
  }

  const marcarGravado = async (tensao, guia) => {
    setGravandoId(tensao.id)
    try {
      await supabase.from('historico_conteudo').insert({
        tensao_id: tensao.id,
        titulo: guia?.gancho?.substring(0, 100) || tensao.tensao,
        data_gravacao: new Date().toISOString().split('T')[0],
        gatilho_principal: tensao.gatilhos?.[0],
        publico_alvo: 'corretor',
        formato_usado: tensao.formato_ideal,
        tom_usado: 'provocativo'
      })
      await supabase.from('tensoes').update({ status: 'gravado', gravado_em: new Date().toISOString() }).eq('id', tensao.id)
      await supabase.from('guias_profundas').update({ status: 'gravado', updated_at: new Date().toISOString() }).eq('tensao_id', tensao.id)
      setTensoes(prev => prev.map(t => t.id === tensao.id ? { ...t, status: 'gravado' } : t))
      alert('✅ Vídeo marcado como gravado!')
    } catch (err) {
      console.error(err)
      alert('Erro: ' + err.message)
    } finally {
      setGravandoId(null)
    }
  }

  const marcarPublicado = async (tensao) => {
    setPublicandoId(tensao.id)
    try {
      const link = prompt('Cole o link do vídeo publicado no Instagram:')
      if (!link) return
      await supabase.from('historico_conteudo').insert({
        tensao_id: tensao.id,
        titulo: tensao.tensao,
        data_gravacao: new Date().toISOString().split('T')[0],
        publicado_em: new Date().toISOString().split('T')[0],
        link_publicacao: link,
        gatilho_principal: tensao.gatilhos?.[0],
        publico_alvo: 'corretor',
        formato_usado: tensao.formato_ideal,
        tom_usado: 'provocativo'
      })
      await supabase.from('tensoes').update({ status: 'publicado', publicado_em: new Date().toISOString() }).eq('id', tensao.id)
      await supabase.from('guias_profundas').update({ status: 'publicado', updated_at: new Date().toISOString() }).eq('tensao_id', tensao.id)
      setTensoes(prev => prev.map(t => t.id === tensao.id ? { ...t, status: 'publicado' } : t))
      alert('✅ Vídeo publicado!')
    } catch (err) {
      console.error(err)
      alert('Erro: ' + err.message)
    } finally {
      setPublicandoId(null)
    }
  }

  const handleLimpar = () => {
    setUrl('')
    setPlataforma(null)
    setFase('idle')
    setErro('')
    setTituloVideo('')
    setResumo('')
    setTensoes([])
    setGuias({})
    setDesdobramentos({})
  }

  const info = plataforma ? PLATAFORMA_INFO[plataforma] : null
  const sugestaoTemas = [
    "Corretor que confunde movimento com resultado",
    "Proprietário que recusa oferta justa",
    "Corretor sem posicionamento",
    "Agenda cheia e conta vazia",
    "Exclusividade mal negociada"
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b border-white/[0.06] px-6 py-4 sticky top-0 bg-[#0C0C0E]/90 backdrop-blur z-10">
        <h1 className="text-sm font-medium text-[#E8E6E1]">🎬 Diretor de Criação</h1>
        <p className="text-xs text-white/30">Extraio tensões do vídeo e gero mapas mentais profundos</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="w-full lg:w-96 shrink-0 border-r border-white/[0.06] p-5 space-y-4">
          <div>
            <label className="text-[10px] uppercase text-white/25">Link do vídeo</label>
            <input
              value={url}
              onChange={e => handleUrlChange(e.target.value)}
              placeholder="YouTube, Instagram ou TikTok..."
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm mt-1"
            />
            {info && <div className="text-xs text-white/30 mt-1">{info.label}</div>}
          </div>
          <div className="text-[10px] text-white/20 text-center">🔄 URLs já processadas são detectadas automaticamente</div>
          {(fase === 'transcrevendo' || fase === 'extraindo') && <div className="flex gap-2 text-white/40"><SpinIcon /> {statusLabel}</div>}
          {erro && <div className="text-red-400 text-sm">{erro}</div>}
          {(fase === 'idle' || fase === 'erro') && (
            <button onClick={handleProcessar} disabled={!plataforma || !url.trim()} className="w-full py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-sm transition">
              Extrair tensões e gerar mapas
            </button>
          )}
          {fase === 'pronto' && <button onClick={handleLimpar} className="text-xs text-white/30 hover:text-white/60">← Novo vídeo</button>}
          {tituloVideo && (
            <div className="bg-white/[0.02] rounded-xl p-3">
              <p className="text-[10px] text-white/25">🎬 Vídeo</p>
              <p className="text-xs text-white/50 line-clamp-2">{tituloVideo}</p>
            </div>
          )}
          {resumo && <div className="text-xs text-white/40 p-2 bg-white/5 rounded-lg">{resumo}</div>}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {fase === 'idle' && (
            <div className="text-center text-white/20 mt-20">
              <p>Cole um link de vídeo para extrair tensões</p>
              <p className="text-xs mt-2 text-white/15">O sistema vai extrair e gerar mapas mentais profundos</p>
            </div>
          )}
          {(fase === 'transcrevendo' || fase === 'extraindo') && <div className="flex justify-center mt-20"><SpinIcon size={6} /></div>}
          {fase === 'pronto' && (
            <div className="space-y-6">
              <h2 className="text-sm font-medium text-white/30 uppercase tracking-wider">{tensoes.length} tensões extraídas</h2>
              {tensoes.map(tensao => {
                const guia = guias[tensao.id]
                const desdob = desdobramentos[tensao.id]
                const gerando = gerandoGuia === tensao.id
                const gerandoD = gerandoDesdob === tensao.id
                const gravando = gravandoId === tensao.id
                const publicando = publicandoId === tensao.id
                return (
                  <div key={tensao.id} className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-white/[0.06]">
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {tensao.gatilhos?.slice(0,2).map(g => <span key={g} className={`text-[10px] px-2 py-0.5 rounded-full ${GATILHO_COLORS[g] || 'bg-white/10'}`}>{g}</span>)}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${tensao.potencial_viral >= 8 ? 'bg-emerald-500/20 text-emerald-400' : tensao.potencial_viral >= 5 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/40'}`}>
                            potencial: {tensao.potencial_viral || 'médio'}
                          </span>
                          {tensao.formato_ideal && <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full">{FORMATO_ICONES[tensao.formato_ideal]}</span>}
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-full ${tensao.status === 'gravado' ? 'bg-amber-500/20 text-amber-400' : tensao.status === 'publicado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/30'}`}>
                          {tensao.status === 'gravado' ? '🎬 Gravado' : tensao.status === 'publicado' ? '📱 Publicado' : '📝 Pendente'}
                        </span>
                      </div>
                      <p className="text-base font-medium text-[#E8E6E1] leading-snug">{tensao.tensao}</p>
                      {tensao.antagonista && <p className="text-xs text-white/40 mt-1">🎭 Antagonista: {tensao.antagonista}</p>}
                      <div className="flex gap-2 mt-3">
                        {!guia && <button onClick={() => gerarGuia(tensao)} disabled={gerando} className="text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 px-3 py-1.5 rounded disabled:opacity-40">
                          {gerando ? <><SpinIcon size={3} /> Gerando...</> : '🎬 Gerar mapa mental profundo'}
                        </button>}
                        {!desdob && guia && <button onClick={() => gerarDesdobramentos(tensao)} disabled={gerandoD} className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded disabled:opacity-40">
                          {gerandoD ? <><SpinIcon size={3} /> Gerando...</> : '🔄 Desdobramentos'}
                        </button>}
                      </div>
                    </div>
                    {guia && (
                      <div className="p-4 space-y-4 text-sm border-t border-white/[0.05]">
                        <div><div className="text-[10px] uppercase text-white/30">🧠 LINHA DE RACIOCÍNIO</div><p className="text-[#E8E6E1]">{guia.linha_de_raciocinio}</p></div>
                        <div><div className="text-[10px] uppercase text-white/30">🎬 GANCHO</div><p className="text-amber-400 font-medium">"{guia.gancho}"</p></div>
                        <div><div className="text-[10px] uppercase text-white/30">📝 TÓPICOS</div><ul className="space-y-1">{guia.topicos?.map((t,i) => <li key={i} className="flex gap-2 text-white/70"><span className="text-violet-400">→</span> {t}</li>)}</ul></div>
                        <div><div className="text-[10px] uppercase text-white/30">💬 FRASES IMPACTO</div>{guia.frases_impacto?.map((f,i) => <p key={i} className="text-white/50 italic">"{f}"</p>)}</div>
                        <div><div className="text-[10px] uppercase text-white/30">📢 CTA</div><p className="text-emerald-400 font-medium">"{guia.cta}"</p></div>
                        <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                          <button onClick={() => marcarGravado(tensao, guia)} disabled={gravando || tensao.status === 'gravado' || tensao.status === 'publicado'} className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-2 py-1 rounded disabled:opacity-40">
                            {gravando ? 'Salvando...' : '🎬 Marcar gravado'}
                          </button>
                          <button onClick={() => marcarPublicado(tensao)} disabled={publicando || tensao.status === 'publicado'} className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-2 py-1 rounded disabled:opacity-40">
                            {publicando ? 'Salvando...' : '📱 Marcar publicado'}
                          </button>
                        </div>
                      </div>
                    )}
                    {desdob && desdob.length > 0 && (
                      <div className="p-4 border-t border-white/[0.05] bg-white/[0.02]">
                        <div className="text-[10px] uppercase text-white/30 mb-2">🔄 DESDOBRAMENTOS</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {desdob.map((d,i) => <div key={i} className="text-xs p-2 bg-white/5 rounded-lg"><span className="text-violet-400">{d.formato}</span><p className="text-white/70 mt-1">{d.titulo}</p></div>)}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}