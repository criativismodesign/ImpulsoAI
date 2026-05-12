'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

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

interface ProblemaIdentificado {
  id: string
  area: string
  problema: string
  solucao: string
  impacto: 'alto' | 'medio' | 'baixo'
  timestamp: Date
}

interface SessaoDiagnostico {
  id: string
  empresa: string
  responsavel: string
  setor: string
  problemas: ProblemaIdentificado[]
  transcricao: string[]
  dataInicio: Date
  dataFim?: Date
}

export default function Diagnostico() {
  const [formData, setFormData] = useState<FormData>({
    nomeEmpresa: '',
    nomeResponsavel: '',
    setor: ''
  })
  
  const [isDiagnosticoAtivo, setIsDiagnosticoAtivo] = useState(false)
  const [statusAgente, setStatusAgente] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
  const [transcricaoAtual, setTranscricaoAtual] = useState('')
  const [problemas, setProblemas] = useState<ProblemaIdentificado[]>([])
  const [sessao, setSessao] = useState<SessaoDiagnostico | null>(null)
  const [isRelatorioGerado, setIsRelatorioGerado] = useState(false)
  
  const vapiRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

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
    // Inicializar VAPI apenas no client-side
    if (typeof window !== 'undefined') {
      import('@vapi-ai/web').then((VapiModule) => {
        const VapiClass = VapiModule.default || VapiModule
        vapiRef.current = new VapiClass(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!)
      })
    }

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
    }
  }, [])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const iniciarDiagnostico = async () => {
    if (!formData.nomeEmpresa || !formData.nomeResponsavel || !formData.setor) {
      alert('Por favor, preencha todos os campos para iniciar o diagnóstico.')
      return
    }

    const novaSessao: SessaoDiagnostico = {
      id: `sessao_${Date.now()}`,
      empresa: formData.nomeEmpresa,
      responsavel: formData.nomeResponsavel,
      setor: formData.setor,
      problemas: [],
      transcricao: [],
      dataInicio: new Date()
    }

    setSessao(novaSessao)
    setIsDiagnosticoAtivo(true)
    setStatusAgente('listening')

    // Inicializar VAPI com o system prompt
    if (vapiRef.current) {
      try {
        await vapiRef.current.start({
          model: {
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            messages: [
              {
                role: 'system',
                content: `Você é Ana, analista sênior de implementação de AI da Impulso.AI. Sua missão é fazer o diagnóstico completo de uma empresa para identificar onde a inteligência artificial pode gerar resultado real.

Conduza uma conversa natural e profissional em português brasileiro. Faça perguntas abertas e aprofunde nas respostas. Seu objetivo é identificar:
1. Onde a empresa mais perde tempo com tarefas manuais e repetitivas
2. Quais processos travam o crescimento
3. Onde estão os maiores custos operacionais desnecessários
4. O que o dono mais quer que mude no negócio

Perguntas que você deve fazer (adapte ao contexto da conversa):
- Me conta um pouco sobre o negócio de vocês, como funciona o dia a dia?
- Qual é a maior dor operacional de vocês hoje, o que trava mais o crescimento?
- Se você pudesse eliminar uma tarefa que sua equipe faz todo dia, qual seria?
- Quanto tempo sua equipe gasta por semana em tarefas que poderiam ser automáticas?
- Vocês já tentaram resolver isso antes? O que funcionou ou não funcionou?
- Em qual área você sente que deixa mais dinheiro na mesa hoje?

Quando identificar um problema claro, confirme com o cliente e sinalize internamente com o formato:
[PROBLEMA_IDENTIFICADO: área=X, problema=Y, impacto=alto/médio/baixo]

Seja empática, curiosa e profissional. Não fale sobre preços ou contratos, isso é função do consultor humano.

Informações da empresa:
- Empresa: ${formData.nomeEmpresa}
- Responsável: ${formData.nomeResponsavel}
- Setor: ${formData.setor}`
              }
            ]
          },
          voice: {
            provider: 'deepgram',
            voiceId: 'asteria'
          },
          firstMessage: `Olá ${formData.nomeResponsavel}! Sou Ana, analista da Impulso.AI. Vou fazer um diagnóstico completo da ${formData.nomeEmpresa} para identificar onde a inteligência artificial pode gerar resultados reais para vocês. Me conta um pouco sobre o negócio de vocês, como funciona o dia a dia?`
        })

        // Configurar listeners
        vapiRef.current.on('speech-start', () => {
          setStatusAgente('speaking')
        })

        vapiRef.current.on('speech-end', () => {
          setStatusAgente('listening')
        })

        vapiRef.current.on('message', (message: any) => {
          if (message.type === 'transcript') {
            setTranscricaoAtual(message.transcript)
            
            // Adicionar à transcrição da sessão
            setSessao(prev => prev ? {
              ...prev,
              transcricao: [...prev.transcricao, message.transcript]
            } : null)

            // Verificar se há problema identificado
            const problemaMatch = message.transcript.match(/\[PROBLEMA_IDENTIFICADO: área=([^,]+), problema=([^,]+), impacto=([^\]]+)\]/)
            if (problemaMatch) {
              const [, area, problema, impacto] = problemaMatch
              const novoProblema: ProblemaIdentificado = {
                id: `problema_${Date.now()}`,
                area: area.trim(),
                problema: problema.trim(),
                solucao: gerarSolucao(area.trim(), problema.trim()),
                impacto: impacto.trim().toLowerCase() as 'alto' | 'medio' | 'baixo',
                timestamp: new Date()
              }

              setProblemas(prev => [...prev, novoProblema])
              setSessao(prev => prev ? {
                ...prev,
                problemas: [...prev.problemas, novoProblema]
              } : null)
            }
          }
        })

      } catch (error) {
        console.error('Erro ao iniciar VAPI:', error)
        alert('Erro ao iniciar o diagnóstico. Tente novamente.')
        setIsDiagnosticoAtivo(false)
      }
    }
  }

  const gerarSolucao = (area: string, problema: string): string => {
    // Lógica básica para gerar soluções baseada na área e problema
    const solucoesBase: Record<string, string[]> = {
      'Varejo': [
        'Implementação de sistema de gestão de estoque automatizado com IA',
        'Chatbot para atendimento ao cliente 24/7',
        'Sistema de recomendação de produtos personalizado'
      ],
      'Serviços': [
        'Automação de agendamentos e confirmações',
        'Sistema de CRM inteligente para gestão de clientes',
        'Ferramentas de análise de satisfação em tempo real'
      ],
      'Indústria': [
        'Sistema de manutenção preditiva com sensores IoT',
        'Otimização de cadeia de suprimentos com IA',
        'Controle de qualidade automatizado com visão computacional'
      ],
      'Tecnologia': [
        'Automação de deployments e CI/CD',
        'Monitoramento de performance com IA',
        'Sistema de detecção de anomalias em tempo real'
      ],
      'Saúde': [
        'Sistema de agendamento inteligente',
        'Assistente virtual para triagem inicial',
        'Análise de prontuários com IA para diagnósticos'
      ],
      'Educação': [
        'Plataforma de aprendizado adaptativo',
        'Sistema de correção automática de atividades',
        'Análise de engajamento dos alunos'
      ]
    }

    const solucoesArea = solucoesBase[area] || solucoesBase['Serviços']
    return solucoesArea[Math.floor(Math.random() * solucoesArea.length)]
  }

  const encerrarDiagnostico = () => {
    if (vapiRef.current) {
      vapiRef.current.stop()
    }
    
    setStatusAgente('idle')
    setSessao(prev => prev ? {
      ...prev,
      dataFim: new Date()
    } : null)
    
    setTimeout(() => {
      setIsRelatorioGerado(true)
    }, 1000)
  }

  const resetarDiagnostico = () => {
    setFormData({
      nomeEmpresa: '',
      nomeResponsavel: '',
      setor: ''
    })
    setIsDiagnosticoAtivo(false)
    setStatusAgente('idle')
    setTranscricaoAtual('')
    setProblemas([])
    setSessao(null)
    setIsRelatorioGerado(false)
  }

  const exportarPDF = () => {
    if (!sessao) return

    const relatorio = `
RELATÓRIO DE DIAGNÓSTICO - IMPULSO.AI
=====================================

EMPRESA: ${sessao.empresa}
RESPONSÁVEL: ${sessao.responsavel}
SETOR: ${sessao.setor}
DATA: ${sessao.dataInicio.toLocaleString('pt-BR')}

RESUMO EXECUTIVO
===============
Foram identificados ${sessao.problemas.length} pontos críticos onde a IA pode gerar impacto significativo.

PROBLEMAS IDENTIFICADOS
======================
${sessao.problemas.map((prob, index) => `
${index + 1}. Área: ${prob.area}
   Problema: ${prob.problema}
   Solução AI: ${prob.solucao}
   Impacto: ${prob.impacto.toUpperCase()}
`).join('\n')}

TRANSCRIÇÃO COMPLETA
===================
${sessao.transcricao.join('\n\n')}

PRÓXIMOS PASSOS
===============
1. Priorizar implementação por impacto
2. Definir cronograma de 90 dias
3. Alocar recursos internos
4. Iniciar piloto na área de maior impacto

Contato Impulso.AI para próxima etapa.
    `.trim()

    const blob = new Blob([relatorio], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-diagnostico-${sessao.empresa.replace(/\s+/g, '-').toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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
                ← RETURN TO HOME
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
                  Advanced AI-powered diagnostic engine for business transformation analysis
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
                          placeholder="Enter company name..."
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
                          placeholder="Enter your name..."
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
                          <option value="" className="bg-[#080C1A] text-gray-500">Select sector...</option>
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
      <div className="min-h-screen bg-gradient-to-br from-[#080C1A] via-[#0A1428] to-[#080C1A]">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-screen">
            
            {/* Coluna Esquerda - Interface de Conversa (40%) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-2">Diagnóstico em Andamento</h2>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    statusAgente === 'speaking' ? 'bg-green-500 animate-pulse' :
                    statusAgente === 'processing' ? 'bg-yellow-500 animate-pulse' :
                    statusAgente === 'listening' ? 'bg-blue-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-gray-300">
                    {statusAgente === 'speaking' ? 'Ana está falando...' :
                     statusAgente === 'processing' ? 'Processando...' :
                     statusAgente === 'listening' ? 'Ouvindo...' : 'Aguardando...'}
                  </span>
                </div>
              </div>

              {/* Visualizador de Áudio */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <div className="flex justify-center items-center h-32">
                  {statusAgente === 'speaking' && (
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-3 h-16 bg-[#00B4D8] rounded-full"
                          animate={{
                            height: ['16px', '64px', '16px'],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {statusAgente === 'listening' && (
                    <div className="flex space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-3 h-8 bg-blue-500 rounded-full"
                          animate={{
                            opacity: [0.3, 1, 0.3],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Transcrição em Tempo Real */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 flex-1">
                <h3 className="text-lg font-semibold text-white mb-4">Transcrição</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {sessao?.transcricao.map((transcricao, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-gray-300 text-sm"
                    >
                      {transcricao}
                    </motion.div>
                  ))}
                  {transcricaoAtual && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[#00B4D8] text-sm"
                    >
                      {transcricaoAtual}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Botão Encerrar */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={encerrarDiagnostico}
                className="w-full bg-red-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-red-700 transition-all duration-300"
              >
                Encerrar e Gerar Relatório
              </motion.button>
            </div>

            {/* Coluna Direita - Dashboard (60%) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Header Dashboard */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">Dashboard de Diagnóstico</h2>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#00B4D8]">{problemas.length}</div>
                    <div className="text-sm text-gray-300">Problemas Identificados</div>
                  </div>
                </div>
                
                {/* Barra de Progresso */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
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
              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                <AnimatePresence>
                  {problemas.map((problema, index) => (
                    <motion.div
                      key={problema.id}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="inline-block px-3 py-1 bg-[#00B4D8]/20 text-[#00B4D8] text-sm rounded-full mb-2">
                            {problema.area}
                          </span>
                          <h3 className="text-lg font-semibold text-white">{problema.problema}</h3>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          problema.impacto === 'alto' ? 'bg-red-500/20 text-red-400' :
                          problema.impacto === 'medio' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {problema.impacto.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-1">Solução AI Recomendada:</h4>
                          <p className="text-gray-300 text-sm">{problema.solucao}</p>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-400">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {problema.timestamp.toLocaleTimeString('pt-BR')}
                        </div>
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
                      <p>Aguardando identificação de problemas...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // TELA DE RELATÓRIO FINAL
  if (isRelatorioGerado && sessao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#080C1A] via-[#0A1428] to-[#080C1A]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl font-bold text-white mb-4">Relatório de Diagnóstico</h1>
                <p className="text-xl text-[#00B4D8] mb-2">{sessao.empresa}</p>
                <p className="text-gray-300">
                  {sessao.setor} • {sessao.dataInicio.toLocaleDateString('pt-BR')}
                </p>
              </motion.div>
            </div>

            {/* Resumo Executivo */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Resumo Executivo</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#00B4D8]">{sessao.problemas.length}</div>
                  <div className="text-sm text-gray-300">Problemas Identificados</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {sessao.problemas.filter(p => p.impacto === 'alto').length}
                  </div>
                  <div className="text-sm text-gray-300">Alto Impacto</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {Math.round((sessao.dataFim?.getTime()! - sessao.dataInicio.getTime()) / 60000)} min
                  </div>
                  <div className="text-sm text-gray-300">Duração</div>
                </div>
              </div>
            </motion.div>

            {/* Problemas Detalhados */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Problemas Identificados</h2>
              <div className="space-y-6">
                {sessao.problemas
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
                    className="border-l-4 border-[#00B4D8] pl-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="inline-block px-3 py-1 bg-[#00B4D8]/20 text-[#00B4D8] text-sm rounded-full mb-2">
                          {problema.area}
                        </span>
                        <h3 className="text-lg font-semibold text-white">{problema.problema}</h3>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        problema.impacto === 'alto' ? 'bg-red-500/20 text-red-400' :
                        problema.impacto === 'medio' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {problema.impacto.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-400">Solução AI Recomendada:</h4>
                        <p className="text-gray-300">{problema.solucao}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-400">Tempo de Implementação:</h4>
                        <p className="text-gray-300">
                          {problema.impacto === 'alto' ? '60-90 dias' :
                           problema.impacto === 'medio' ? '30-60 dias' : '15-30 dias'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-400">Impacto Esperado:</h4>
                        <p className="text-gray-300">
                          {problema.impacto === 'alto' ? 'Redução de 40-60% em custos operacionais' :
                           problema.impacto === 'medio' ? 'Redução de 20-40% em custos operacionais' : 
                           'Redução de 10-20% em custos operacionais'}
                        </p>
                      </div>
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
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Linha do Tempo Sugerida</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-white">Mês 1-2</div>
                    <div className="text-gray-300">Implementar soluções de alto impacto</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-white">Mês 3-4</div>
                    <div className="text-gray-300">Implementar soluções de médio impacto</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-white">Mês 5-6</div>
                    <div className="text-gray-300">Implementar soluções de baixo impacto</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Ações */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
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
