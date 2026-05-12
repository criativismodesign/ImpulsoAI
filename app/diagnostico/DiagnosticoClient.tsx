'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

// Componente de partículas animadas
const AnimatedBackground = () => {
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '0'
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{x: number, y: number, vx: number, vy: number, size: number}> = []
    
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(0, 180, 216, 0.3)'
      
      particles.forEach(particle => {
        particle.x += particle.vx
        particle.y += particle.vy
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1
        
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })
      
      requestAnimationFrame(animate)
    }
    
    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.body.removeChild(canvas)
    }
  }, [])

  return null
}

// Componente de números binários caindo
const BinaryRain = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-green-500/5 font-mono text-xs"
          style={{ left: `${Math.random() * 100}%` }}
          animate={{
            y: [-100, window.innerHeight + 100],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: 'linear'
          }}
        >
          {Math.random() > 0.5 ? '1' : '0'}
        </motion.div>
      ))}
    </div>
  )
}

interface FormData {
  nomeEmpresa: string
  nomeResponsavel: string
  setor: string
}

interface Mensagem {
  id: string
  texto: string
  remetente: 'ana' | 'usuario'
  timestamp: Date
}

interface ProblemaIdentificado {
  id: string
  area: string
  problema: string
  solucao: string
  ferramenta: string
  impacto: 'alto' | 'medio' | 'baixo'
  tempo_implementacao: string
  timestamp: Date
}

interface Sessao {
  id: string
  empresa: string
  responsavel: string
  setor: string
  status: string
  created_at: Date
  updated_at: Date
}

export default function DiagnosticoClient() {
  const [formData, setFormData] = useState<FormData>({
    nomeEmpresa: '',
    nomeResponsavel: '',
    setor: ''
  })
  
  const [isDiagnosticoAtivo, setIsDiagnosticoAtivo] = useState(false)
  const [isRelatorioGerado, setIsRelatorioGerado] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [problemas, setProblemas] = useState<ProblemaIdentificado[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [resumoExecutivo, setResumoExecutivo] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Debug das variáveis de ambiente
  console.log('=== DEBUG SUPABASE ===')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***PRESENT***' : '***MISSING***')
  console.log('=====================')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const setores = [
    'Varejo',
    'Serviços', 
    'Indústria',
    'Tecnologia',
    'Saúde',
    'Educação',
    'Outros'
  ]

  useEffect(() => {
    scrollToBottom()
  }, [mensagens])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const criarSessao = async () => {
    try {
      console.log('=== CRIANDO SESSÃO ===')
      console.log('Dados da sessão:', {
        empresa: formData.nomeEmpresa,
        responsavel: formData.nomeResponsavel,
        setor: formData.setor,
        status: 'em_andamento'
      })
      
      const { data, error } = await supabase
        .from('sessoes_diagnostico')
        .insert({
          empresa: formData.nomeEmpresa,
          responsavel: formData.nomeResponsavel,
          setor: formData.setor,
          status: 'em_andamento'
        })
        .select()
        .single()

      console.log('Resultado da inserção:', { data, error })
      
      if (error) {
        console.error('Erro detalhado:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Erro ao criar sessão:', error)
      return null
    }
  }

  const salvarProblema = async (problema: Omit<ProblemaIdentificado, 'id' | 'timestamp'>) => {
    if (!sessao) return

    try {
      const { data, error } = await supabase
        .from('problemas_identificados')
        .insert({
          sessao_id: sessao.id,
          ...problema
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao salvar problema:', error)
      return null
    }
  }

  const salvarRelatorio = async (conteudoJson: any) => {
    if (!sessao) return

    try {
      const { data, error } = await supabase
        .from('relatorios')
        .insert({
          sessao_id: sessao.id,
          conteudo_json: conteudoJson
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao salvar relatório:', error)
      return null
    }
  }

  const enviarMensagemClaude = async (mensagemUsuario: string) => {
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensagem: mensagemUsuario,
          empresa: formData.nomeEmpresa,
          setor: formData.setor,
          historico: mensagens.slice(-5).map(m => `${m.remetente}: ${m.texto}`).join('\n')
        })
      })

      if (!response.ok) throw new Error('Erro na API')

      const data = await response.json()
      return data.resposta
    } catch (error) {
      console.error('Erro ao enviar para Claude:', error)
      return 'Desculpe, tive um problema. Podemos tentar novamente?'
    }
  }

  const parseProblema = (texto: string): ProblemaIdentificado | null => {
    const match = texto.match(/\[PROBLEMA: area=([^|]+)\|problema=([^|]+)\|solucao=([^|]+)\|ferramenta=([^|]+)\|impacto=([^|]+)\|tempo=([^\]]+)\]/)
    
    if (!match) return null

    const [, area, problema, solucao, ferramenta, impacto, tempo] = match
    
    return {
      id: `problema_${Date.now()}`,
      area: area.trim(),
      problema: problema.trim(),
      solucao: solucao.trim(),
      ferramenta: ferramenta.trim(),
      impacto: impacto.trim().toLowerCase() as 'alto' | 'medio' | 'baixo',
      tempo_implementacao: tempo.trim(),
      timestamp: new Date()
    }
  }

  const enviarMensagem = async () => {
    if (!inputText.trim() || isLoading) return

    const mensagemUsuario: Mensagem = {
      id: `msg_${Date.now()}`,
      texto: inputText,
      remetente: 'usuario',
      timestamp: new Date()
    }

    setMensagens(prev => [...prev, mensagemUsuario])
    setInputText('')
    setIsLoading(true)

    // Enviar para Claude
    const respostaClaude = await enviarMensagemClaude(inputText)
    
    // Parse de problema se existir
    const problema = parseProblema(respostaClaude)
    if (problema) {
      await salvarProblema(problema)
      setProblemas(prev => [...prev, problema])
    }

    // Remover metadata da resposta
    const respostaLimpa = respostaClaude.replace(/\[PROBLEMA:[^\]]+\]/g, '').trim()

    const mensagemAna: Mensagem = {
      id: `msg_${Date.now() + 1}`,
      texto: respostaLimpa,
      remetente: 'ana',
      timestamp: new Date()
    }

    setMensagens(prev => [...prev, mensagemAna])
    setIsLoading(false)
  }

  const iniciarDiagnostico = async () => {
    if (!formData.nomeEmpresa || !formData.nomeResponsavel || !formData.setor) {
      alert('Por favor, preencha todos os campos para iniciar o diagnóstico.')
      return
    }

    // Criar sessão no Supabase
    const novaSessao = await criarSessao()
    if (!novaSessao) {
      alert('Erro ao iniciar sessão. Tente novamente.')
      return
    }

    setSessao(novaSessao)
    setIsDiagnosticoAtivo(true)

    // Primeira mensagem da Ana
    const primeiraMensagem: Mensagem = {
      id: `msg_${Date.now()}`,
      texto: `Olá! Sou Ana, analista da Impulso.AI. Vou conduzir o diagnóstico da ${formData.nomeEmpresa} hoje. Para começarmos, me conta um pouco sobre o negócio de vocês — como funciona o dia a dia da operação?`,
      remetente: 'ana',
      timestamp: new Date()
    }

    setMensagens([primeiraMensagem])
  }

  const encerrarDiagnostico = async () => {
    if (!sessao) return

    // Gerar resumo executivo com Claude
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'resumo',
          empresa: formData.nomeEmpresa,
          setor: formData.setor,
          problemas: problemas
        })
      })

      if (response.ok) {
        const data = await response.json()
        setResumoExecutivo(data.resumo)
      }
    } catch (error) {
      console.error('Erro ao gerar resumo:', error)
    }

    // Salvar relatório
    await salvarRelatorio({
      empresa: formData.nomeEmpresa,
      responsavel: formData.nomeResponsavel,
      setor: formData.setor,
      problemas,
      resumoExecutivo,
      data: new Date().toISOString()
    })

    // Atualizar status da sessão
    await supabase
      .from('sessoes_diagnostico')
      .update({ status: 'concluido' })
      .eq('id', sessao.id)

    setIsRelatorioGerado(true)
  }

  const resetarDiagnostico = () => {
    setFormData({
      nomeEmpresa: '',
      nomeResponsavel: '',
      setor: ''
    })
    setIsDiagnosticoAtivo(false)
    setIsRelatorioGerado(false)
    setMensagens([])
    setProblemas([])
    setSessao(null)
    setResumoExecutivo('')
    setInputText('')
  }

  const exportarPDF = () => {
    window.print()
  }

  // TELA INICIAL
  if (!isDiagnosticoAtivo && !isRelatorioGerado) {
    return (
      <>
        <AnimatedBackground />
        <BinaryRain />
        <div className="min-h-screen relative z-10 overflow-hidden">
          {/* Grid lines de fundo */}
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-grid-pattern"></div>
          </div>
          
          {/* Gradiente radial sutil */}
          <div className="absolute inset-0 bg-radial-gradient opacity-3"></div>
          
          {/* Círculo decorativo superior direito */}
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#00B4D8]/20 to-transparent rounded-full blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          
          {/* Linhas diagonais sutis */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00B4D8]/10 to-transparent transform rotate-12"></div>
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00B4D8]/10 to-transparent transform -rotate-6"></div>
            <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00B4D8]/10 to-transparent transform rotate-3"></div>
          </div>
          
          <div className="container mx-auto px-4 py-8 relative z-20">
            {/* Header Premium */}
            <div className="text-center mb-16">
              <Link href="/" className="inline-flex items-center text-[#00B4D8]/80 hover:text-[#00B4D8] mb-8 transition-all duration-300 font-mono text-sm tracking-wider">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                ← VOLTAR PARA HOME
              </Link>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* Logo com ponto pulsando */}
                <div className="flex items-center justify-center mb-6">
                  <h1 className="text-6xl font-bold text-white tracking-tight">
                    IMPULSO
                    <motion.span
                      className="text-[#00B4D8]"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.8, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    >
                      .
                    </motion.span>
                    AI
                  </h1>
                </div>
                
                {/* Badge sistema ativo */}
                <motion.div
                  className="inline-flex items-center px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-8"
                  animate={{
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                >
                  <motion.div
                    className="w-2 h-2 bg-green-500 rounded-full mr-2"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.6, 1]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity
                    }}
                  />
                  <span className="text-green-400 font-mono text-xs tracking-widest">SYSTEM ACTIVE</span>
                </motion.div>
                
                {/* Subtítulo tech */}
                <h2 className="text-2xl font-light text-gray-300 tracking-[0.3em] mb-6">
                  MOTOR DE DIAGNÓSTICO
                </h2>
                
                <p className="text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                  Motor avançado de diagnóstico com IA para transformação de negócios
                </p>
              </motion.div>
            </div>

            {/* Formulário Premium */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                {/* Borda gradiente animada */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#00B4D8] via-cyan-500 to-[#00B4D8] rounded-2xl opacity-20 blur-sm"
                  animate={{
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
                
                {/* Container principal */}
                <div className="relative bg-[#080C1A]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-10">
                  <div className="space-y-8">
                    <div>
                      <label className="block text-xs font-mono text-[#00B4D8] uppercase tracking-widest mb-3">
                        Nome da Empresa
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.nomeEmpresa}
                          onChange={(e) => handleInputChange('nomeEmpresa', e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#00B4D8] transition-all duration-300 font-mono text-sm py-3"
                          placeholder="Nome da sua empresa..."
                        />
                        <motion.div
                          className="absolute bottom-0 left-0 h-px bg-[#00B4D8]"
                          initial={{ scaleX: 0 }}
                          whileFocus={{ scaleX: 1 }}
                          transition={{ duration: 0.3 }}
                          style={{ originX: 0 }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-mono text-[#00B4D8] uppercase tracking-widest mb-3">
                        Nome do Responsável
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.nomeResponsavel}
                          onChange={(e) => handleInputChange('nomeResponsavel', e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#00B4D8] transition-all duration-300 font-mono text-sm py-3"
                          placeholder="Seu nome completo..."
                        />
                        <motion.div
                          className="absolute bottom-0 left-0 h-px bg-[#00B4D8]"
                          initial={{ scaleX: 0 }}
                          whileFocus={{ scaleX: 1 }}
                          transition={{ duration: 0.3 }}
                          style={{ originX: 0 }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-mono text-[#00B4D8] uppercase tracking-widest mb-3">
                        Setor de Atuação
                      </label>
                      <div className="relative">
                        <select
                          value={formData.setor}
                          onChange={(e) => handleInputChange('setor', e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-white/20 text-white focus:outline-none focus:border-[#00B4D8] transition-all duration-300 font-mono text-sm py-3 appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-[#080C1A] text-gray-500">Selecione o setor...</option>
                          {setores.map(setor => (
                            <option key={setor} value={setor} className="bg-[#080C1A] text-white">
                              {setor}
                            </option>
                          ))}
                        </select>
                        <motion.div
                          className="absolute bottom-0 left-0 h-px bg-[#00B4D8]"
                          initial={{ scaleX: 0 }}
                          whileFocus={{ scaleX: 1 }}
                          transition={{ duration: 0.3 }}
                          style={{ originX: 0 }}
                        />
                        {/* Seta customizada */}
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4 text-[#00B4D8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={iniciarDiagnostico}
                      className="relative w-full group"
                    >
                      {/* Efeito glow */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-[#00B4D8] to-cyan-500 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"
                        animate={{
                          scale: [1, 1.05, 1],
                          opacity: [0.5, 0.75, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity
                        }}
                      />
                      
                      {/* Botão principal */}
                      <div className="relative bg-gradient-to-r from-[#00B4D8] to-cyan-500 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3">
                        {/* Ícone microfone animado */}
                        <motion.svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          animate={{
                            scale: [1, 1.1, 1]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity
                          }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </motion.svg>
                        
                        <span className="font-mono tracking-widest uppercase text-sm">
                          INICIAR DIAGNÓSTICO
                        </span>
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </>
    )
  }

  // TELA DE DIAGNÓSTICO
  if (isDiagnosticoAtivo && !isRelatorioGerado) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#080C1A] via-[#0A1428] to-[#080C1A] overflow-hidden">
        <div className="container mx-auto px-4 py-8 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-full">
            
            {/* Coluna Esquerda - Chat (40%) */}
            <div className="lg:col-span-2 flex flex-col h-full">
              {/* Header */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 mb-4 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <h2 className="text-xl font-bold text-white">ANA — ANALISTA IMPULSO.AI</h2>
                </div>
              </div>

              {/* Área de mensagens */}
              <div className="flex-1 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 mb-4 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                  <AnimatePresence>
                    {mensagens.map((mensagem) => (
                      <motion.div
                        key={mensagem.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${mensagem.remetente === 'usuario' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                            mensagem.remetente === 'usuario'
                              ? 'bg-[#00B4D8] text-white'
                              : 'bg-white/10 text-gray-200 border border-white/20'
                          }`}
                        >
                          <p className="text-sm">{mensagem.texto}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {mensagem.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-2xl">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-[#00B4D8] rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-[#00B4D8] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-[#00B4D8] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 flex-shrink-0">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-transparent border-0 text-white placeholder-gray-400 focus:outline-none"
                    disabled={isLoading}
                  />
                  
                  <button
                    onClick={enviarMensagem}
                    disabled={isLoading || !inputText.trim()}
                    className="bg-[#00B4D8] text-white p-2 rounded-lg hover:bg-[#0096C7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                  
                  <button
                    className="bg-white/10 text-white p-2 rounded-lg hover:bg-white/20 transition-colors cursor-not-allowed"
                    title="Voz disponível em breve"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Dashboard (60%) */}
            <div className="lg:col-span-3 flex flex-col h-full">
              {/* Header */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 mb-4 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">DIAGNÓSTICO EM TEMPO REAL</h2>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#00B4D8]">{problemas.length}</div>
                    <div className="text-xs text-gray-300">Problemas Identificados</div>
                  </div>
                </div>
                
                {/* Barra de Progresso */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-300 mb-1">
                    <span>Progresso do Diagnóstico</span>
                    <span>{Math.min(problemas.length * 20, 100)}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-[#00B4D8] to-[#0096C7] h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(problemas.length * 20, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* Cards de Problemas */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4">
                <AnimatePresence>
                  {problemas
                    .sort((a, b) => {
                      const impactoOrder = { alto: 3, medio: 2, baixo: 1 }
                      return impactoOrder[b.impacto] - impactoOrder[a.impacto]
                    })
                    .map((problema, index) => (
                    <motion.div
                      key={problema.id}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <span className="inline-block px-3 py-1 bg-[#00B4D8]/20 text-[#00B4D8] text-sm rounded-full mb-2">
                            {problema.area}
                          </span>
                          <h3 className="text-lg font-semibold text-white mb-2">{problema.problema}</h3>
                          <p className="text-gray-300 text-sm mb-3">{problema.solucao}</p>
                          <div className="flex items-center text-xs text-gray-400">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {problema.ferramenta}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full ml-4 ${
                          problema.impacto === 'alto' ? 'bg-red-500/20 text-red-400' :
                          problema.impacto === 'medio' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {problema.impacto.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {problema.tempo_implementacao}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {problemas.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <p>Analisando conversa para identificar problemas...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botão Encerrar */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={encerrarDiagnostico}
                className="w-full bg-red-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-red-700 transition-all duration-300 flex-shrink-0"
              >
                ENCERRAR E GERAR RELATÓRIO
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // TELA DE RELATÓRIO FINAL
  if (isRelatorioGerado && sessao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#080C1A] via-[#0A1428] to-[#080C1A] print:bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12 print:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl font-bold text-white print:text-black mb-4">Relatório de Diagnóstico</h1>
                <p className="text-xl text-[#00B4D8] print:text-blue-600 mb-2">{sessao.empresa}</p>
                <p className="text-gray-300 print:text-gray-600">
                  {sessao.setor} • {new Date().toLocaleDateString('pt-BR')}
                </p>
              </motion.div>
            </div>

            {/* Resumo Executivo */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8 print:bg-white print:border print:border-gray-300"
            >
              <h2 className="text-2xl font-bold text-white print:text-black mb-4">Resumo Executivo</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#00B4D8] print:text-blue-600">{problemas.length}</div>
                  <div className="text-sm text-gray-300 print:text-gray-600">Problemas Identificados</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 print:text-green-600">
                    {problemas.filter(p => p.impacto === 'alto').length}
                  </div>
                  <div className="text-sm text-gray-300 print:text-gray-600">Alto Impacto</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 print:text-yellow-600">
                    {Math.ceil(problemas.length * 15)} dias
                  </div>
                  <div className="text-sm text-gray-300 print:text-gray-600">Tempo Estimado</div>
                </div>
              </div>
              
              {resumoExecutivo && (
                <div className="text-gray-300 print:text-gray-700 leading-relaxed">
                  <p>{resumoExecutivo}</p>
                </div>
              )}
            </motion.div>

            {/* Problemas Detalhados */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8 print:bg-white print:border print:border-gray-300"
            >
              <h2 className="text-2xl font-bold text-white print:text-black mb-6">Problemas Identificados</h2>
              <div className="space-y-6">
                {problemas
                  .sort((a, b) => {
                    const impactoOrder = { alto: 3, medio: 2, baixo: 1 }
                    return impactoOrder[b.impacto] - impactoOrder[a.impacto]
                  })
                  .map((problema, index) => (
                  <motion.div
                    key={problema.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="border-l-4 border-[#00B4D8] print:border-blue-600 pl-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <span className="inline-block px-3 py-1 bg-[#00B4D8]/20 text-[#00B4D8] print:bg-blue-100 print:text-blue-700 text-sm rounded-full mb-2">
                          {problema.area}
                        </span>
                        <h3 className="text-lg font-semibold text-white print:text-black mb-2">{problema.problema}</h3>
                        <p className="text-gray-300 print:text-gray-700 mb-2">{problema.solucao}</p>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-400 print:text-gray-600">
                            <strong>Ferramenta:</strong> {problema.ferramenta}
                          </div>
                          <div className="text-sm text-gray-400 print:text-gray-600">
                            <strong>Tempo de Implementação:</strong> {problema.tempo_implementacao}
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ml-4 ${
                        problema.impacto === 'alto' ? 'bg-red-500/20 text-red-400 print:bg-red-100 print:text-red-700' :
                        problema.impacto === 'medio' ? 'bg-yellow-500/20 text-yellow-400 print:bg-yellow-100 print:text-yellow-700' :
                        'bg-green-500/20 text-green-400 print:bg-green-100 print:text-green-700'
                      }`}>
                        {problema.impacto.toUpperCase()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Linha do Tempo */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8 print:bg-white print:border print:border-gray-300"
            >
              <h2 className="text-2xl font-bold text-white print:text-black mb-6">Linha do Tempo de Implementação</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-white print:text-black">Mês 1-2</div>
                    <div className="text-gray-300 print:text-gray-600">Implementar soluções de alto impacto</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-white print:text-black">Mês 3-4</div>
                    <div className="text-gray-300 print:text-gray-600">Implementar soluções de médio impacto</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-white print:text-black">Mês 5-6</div>
                    <div className="text-gray-300 print:text-gray-600">Implementar soluções de baixo impacto</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Ações */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 print:hidden"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportarPDF}
                className="flex-1 bg-gradient-to-r from-[#00B4D8] to-[#0096C7] text-white font-bold py-4 px-8 rounded-lg hover:from-[#0096C7] hover:to-[#0077B6] transition-all duration-300"
              >
                Exportar PDF
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetarDiagnostico}
                className="flex-1 bg-white/10 text-white font-bold py-4 px-8 rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
              >
                Novo Diagnóstico
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
