'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

// Background com grid perspectiva e partículas
const BackgroundCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const particles: Array<{x: number, y: number, vx: number, vy: number, connections: number[]}> = []
    
    // Criar partículas
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        connections: []
      })
    }
    
    const animate = () => {
      ctx.fillStyle = '#010912'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Desenhar grid perspectiva
      ctx.strokeStyle = 'rgba(0, 180, 216, 0.1)'
      ctx.lineWidth = 1
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const gridSize = 40
      const perspective = 900
      
      // Linhas horizontais
      for (let y = -20; y <= 20; y++) {
        ctx.beginPath()
        const y1 = centerY + y * gridSize
        const x1 = centerX - Math.abs(y) * gridSize * 0.5
        const x2 = centerX + Math.abs(y) * gridSize * 0.5
        
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y1)
        ctx.stroke()
      }
      
      // Linhas verticais
      for (let x = -20; x <= 20; x++) {
        ctx.beginPath()
        const x1 = centerX + x * gridSize
        const y1 = centerY - Math.abs(x) * gridSize * 0.3
        const y2 = centerY + Math.abs(x) * gridSize * 0.3
        
        ctx.moveTo(x1, y1)
        ctx.lineTo(x1, y2)
        ctx.stroke()
      }
      
      // Atualizar partículas
      particles.forEach((particle, i) => {
        particle.x += particle.vx
        particle.y += particle.vy
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1
        
        // Conectar partículas próximas
        particle.connections = []
        particles.forEach((other, j) => {
          if (i !== j) {
            const dist = Math.hypot(particle.x - other.x, particle.y - other.y)
            if (dist < 120) {
              particle.connections.push(j)
              ctx.strokeStyle = `rgba(0, 180, 216, ${0.2 * (1 - dist / 120)})`
              ctx.beginPath()
              ctx.moveTo(particle.x, particle.y)
              ctx.lineTo(other.x, other.y)
              ctx.stroke()
            }
          }
        })
        
        // Desenhar partícula
        ctx.fillStyle = 'rgba(0, 180, 216, 0.8)'
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2)
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
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: '#010912' }}
    />
  )
}

// Cursor HUD customizado
const CustomCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isClicking, setIsClicking] = useState(false)
  const cursorAngle = useRef(0)
  const trail = useRef<Array<{x: number, y: number, life: number}>>([])
  const clickPings = useRef<Array<{x: number, y: number, radius: number, maxRadius: number}>>([])
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      cursorAngle.current += 0.04
      
      // Trail
      trail.current = trail.current.filter(p => {
        p.life -= 0.02
        if (p.life <= 0) return false
        
        ctx.fillStyle = `rgba(255, 180, 0, ${p.life * 0.3})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2)
        ctx.fill()
        return true
      })
      
      // Click pings
      clickPings.current = clickPings.current.filter(ping => {
        ping.radius += 2
        if (ping.radius >= ping.maxRadius) return false
        
        const alpha = 1 - ping.radius / ping.maxRadius
        ctx.strokeStyle = `rgba(255, 180, 0, ${alpha * 0.5})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(ping.x, ping.y, ping.radius, 0, Math.PI * 2)
        ctx.stroke()
        
        // Targeting lines
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI / 2) * i + cursorAngle.current
          ctx.strokeStyle = `rgba(255, 180, 0, ${alpha * 0.3})`
          ctx.beginPath()
          ctx.moveTo(ping.x + Math.cos(angle) * ping.radius * 0.8, ping.y + Math.sin(angle) * ping.radius * 0.8)
          ctx.lineTo(ping.x + Math.cos(angle) * ping.radius, ping.y + Math.sin(angle) * ping.radius)
          ctx.stroke()
        }
        
        return true
      })
      
      // Cursor principal
      const outerR = 11
      const innerR = 4
      
      // Anéis externos girando
      ctx.strokeStyle = 'rgba(255, 180, 0, 0.8)'
      ctx.lineWidth = 2
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i + cursorAngle.current
        ctx.beginPath()
        ctx.arc(mousePos.x, mousePos.y, outerR, angle, angle + Math.PI / 4)
        ctx.stroke()
      }
      
      // Anel interno
      ctx.strokeStyle = 'rgba(255, 180, 0, 0.6)'
      ctx.beginPath()
      ctx.arc(mousePos.x, mousePos.y, innerR, 0, Math.PI * 2)
      ctx.stroke()
      
      // Centro pulsante
      const pulse = Math.sin(cursorAngle.current * 2) * 0.5 + 0.5
      ctx.fillStyle = `rgba(255, 200, 0, ${0.8 * pulse})`
      ctx.beginPath()
      ctx.arc(mousePos.x, mousePos.y, innerR * 0.4, 0, Math.PI * 2)
      ctx.fill()
      
      // Crosshair
      ctx.strokeStyle = 'rgba(255, 180, 0, 0.4)'
      ctx.lineWidth = 1
      const crossSize = 4
      ctx.beginPath()
      ctx.moveTo(mousePos.x - crossSize, mousePos.y)
      ctx.lineTo(mousePos.x + crossSize, mousePos.y)
      ctx.moveTo(mousePos.x, mousePos.y - crossSize)
      ctx.lineTo(mousePos.x, mousePos.y + crossSize)
      ctx.stroke()
      
      // Coordenadas
      ctx.fillStyle = 'rgba(255, 180, 0, 0.6)'
      ctx.font = '7px Courier New'
      ctx.fillText(`${Math.round(mousePos.x)},${Math.round(mousePos.y)}`, mousePos.x + 15, mousePos.y - 5)
      
      requestAnimationFrame(animate)
    }
    
    animate()
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      
      // Adicionar ao trail
      trail.current.push({ x: e.clientX, y: e.clientY, life: 1 })
      if (trail.current.length > 35) {
        trail.current.shift()
      }
    }
    
    const handleClick = () => {
      setIsClicking(true)
      clickPings.current.push({ x: mousePos.x, y: mousePos.y, radius: 0, maxRadius: 56 })
      setTimeout(() => setIsClicking(false), 100)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
    }
  }, [mousePos])
  
  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  )
}

// Esfera 3D do Núcleo Impetus
const ImpetusCore = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = 160
    canvas.height = 160
    
    const points: Array<{x: number, y: number, z: number, phi: number, theta: number}> = []
    
    // Criar pontos em distribuição fibonacci não-uniforme
    const numPoints = 150
    const goldenRatio = (1 + Math.sqrt(5)) / 2
    
    for (let i = 0; i < numPoints; i++) {
      const theta = 2 * Math.PI * i / goldenRatio
      const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints) + (Math.random() - 0.5) * 0.2
      
      points.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
        phi,
        theta
      })
    }
    
    let rotationY = 0
    let rotationX = 0
    
    const animate = () => {
      ctx.fillStyle = '#010912'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      rotationY += 0.003
      rotationX = Math.sin(rotationY * 0.5) * 0.1
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = 50
      
      // Conexões
      ctx.strokeStyle = 'rgba(255, 180, 0, 0.2)'
      ctx.lineWidth = 1
      
      points.forEach((point, i) => {
        // Rotação
        const cosY = Math.cos(rotationY)
        const sinY = Math.sin(rotationY)
        const cosX = Math.cos(rotationX)
        const sinX = Math.sin(rotationX)
        
        const x1 = point.x * cosY - point.z * sinY
        const z1 = point.x * sinY + point.z * cosY
        const y1 = point.y * cosX - z1 * sinX
        const z2 = point.y * sinX + z1 * cosX
        
        // Conectar com pontos próximos
        points.forEach((other, j) => {
          if (i < j) {
            const dist = Math.hypot(point.x - other.x, point.y - other.y, point.z - other.z)
            if (dist < 0.3) {
              const x2 = other.x * cosY - other.z * sinY
              const z3 = other.x * sinY + other.z * cosY
              const y2 = other.y * cosX - z3 * sinX
              
              ctx.beginPath()
              ctx.moveTo(centerX + x1 * radius, centerY + y1 * radius)
              ctx.lineTo(centerX + x2 * radius, centerY + y2 * radius)
              ctx.stroke()
            }
          }
        })
      })
      
      // Pontos
      points.forEach(point => {
        const cosY = Math.cos(rotationY)
        const sinY = Math.sin(rotationY)
        const cosX = Math.cos(rotationX)
        const sinX = Math.sin(rotationX)
        
        const x = point.x * cosY - point.z * sinY
        const z = point.x * sinY + point.z * cosY
        const y = point.y * cosX - z * sinX
        
        if (z > 0) {
          const size = (1 + z) * 2
          const alpha = 0.3 + z * 0.5
          
          ctx.fillStyle = `rgba(255, 180, 0, ${alpha})`
          ctx.beginPath()
          ctx.arc(centerX + x * radius, centerY + y * radius, size, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      
      // Arcos orbitais
      ctx.strokeStyle = 'rgba(255, 180, 0, 0.4)'
      ctx.lineWidth = 2
      
      for (let i = 0; i < 5; i++) {
        const orbitAngle = rotationY + (i * Math.PI * 2 / 5)
        const sweepRadius = 30 + i * 5
        
        ctx.beginPath()
        ctx.arc(centerX, centerY, sweepRadius, orbitAngle, orbitAngle + Math.PI / 3)
        ctx.stroke()
      }
      
      requestAnimationFrame(animate)
    }
    
    animate()
  }, [])
  
  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full"
    />
  )
}

// Componente de waveform
const Waveform = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = canvas.offsetWidth
    canvas.height = 26
    
    let time = 0
    
    const animate = () => {
      ctx.fillStyle = '#010912'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Onda 1 - azul
      ctx.strokeStyle = 'rgba(0, 180, 216, 0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + Math.sin((x * 0.02) + time) * 8
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
      
      // Onda 2 - âmbar
      ctx.strokeStyle = 'rgba(255, 180, 0, 0.6)'
      ctx.beginPath()
      
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + Math.sin((x * 0.03) + time * 1.5) * 6
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
      
      time += 0.05
      requestAnimationFrame(animate)
    }
    
    animate()
  }, [])
  
  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-6"
    />
  )
}

export default function DiagnosticoClient() {
  const [formData, setFormData] = useState({
    empresa: '',
    responsavel: '',
    setor: ''
  })
  
  const [isDiagnosticoAtivo, setIsDiagnosticoAtivo] = useState(false)
  const [mensagens, setMensagens] = useState<Array<{
    id: number
    remetente: 'usuario' | 'impetus'
    texto: string
    timestamp: Date
  }>>([])
  
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [problemas, setProblemas] = useState<Array<{
    id: number
    problema: string
    area: string
    solucao: string
    ferramenta: string
    impacto: string
    tempo: string
    custo_estimado?: string
  }>>([])
  
  const [isRelatorioGerado, setIsRelatorioGerado] = useState(false)
  const [resumoExecutivo, setResumoExecutivo] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Debug environment variables
  useEffect(() => {
    console.log('=== DEBUG SUPABASE ===')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***PRESENT***' : '***MISSING***')
    console.log('=====================')
  }, [])
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])
  
  const iniciarDiagnostico = async () => {
    try {
      console.log('=== CRIANDO SESSÃO ===')
      console.log('Dados da sessão:', { empresa: formData.empresa, responsavel: formData.responsavel, setor: formData.setor, status: 'em_andamento' })
      
      const { data, error } = await supabase.from('sessoes_diagnostico').insert({
        empresa: formData.empresa,
        responsavel: formData.responsavel,
        setor: formData.setor,
        status: 'em_andamento'
      }).select().single()
      
      console.log('Resultado da inserção:', { data, error })
      if (error) {
        console.error('Erro detalhado:', error)
        throw error
      }
      
      setIsDiagnosticoAtivo(true)
      
      // Mensagem inicial do Impetus
      const mensagemInicial = {
        id: Date.now(),
        remetente: 'impetus' as const,
        texto: `Olá ${formData.responsavel}, sou Impetus, sua analista sênior de implementação de AI da Impulso.AI. Estou aqui para conduzir um diagnóstico profundo da ${formData.empresa} no setor ${formData.setor}.\n\nPara começar, me diga: qual é o principal objetivo que você quer alcançar nos próximos 12 meses com a empresa?`,
        timestamp: new Date()
      }
      
      setMensagens([mensagemInicial])
    } catch (error) {
      console.error('Erro ao iniciar diagnóstico:', error)
      alert('Erro ao iniciar diagnóstico. Tente novamente.')
    }
  }
  
  const enviarMensagem = async () => {
    if (!inputText.trim() || isLoading) return
    
    const userMessage = {
      id: Date.now(),
      remetente: 'usuario' as const,
      texto: inputText,
      timestamp: new Date()
    }
    
    setMensagens(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensagem: inputText,
          empresa: formData.empresa,
          setor: formData.setor,
          historico: mensagens.map(m => `${m.remetente}: ${m.texto}`).join('\n'),
          tipo: 'chat'
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Extrair problemas do formato [PROBLEMA:...]
      const problemaMatch = data.resposta.match(/\[PROBLEMA:([^\]]+)\]/g)
      if (problemaMatch) {
        const novosProblemas = problemaMatch.map((match: string) => {
          const content = match.slice(9, -1)
          const parts = content.split('|').reduce((acc: any, part: string) => {
            const [key, value] = part.split('=')
            acc[key] = value
            return acc
          }, {} as any)
          
          return {
            id: Date.now() + Math.random(),
            problema: parts.problema,
            area: parts.area,
            solucao: parts.solucao,
            ferramenta: parts.ferramenta,
            impacto: parts.impacto,
            tempo: parts.tempo,
            custo_estimado: parts.custo_estimado
          }
        })
        
        setProblemas(prev => [...prev, ...novosProblemas])
      }
      
      // Remover tags [PROBLEMA:...] da resposta
      const respostaLimpa = data.resposta.replace(/\[PROBLEMA:[^\]]+\]/g, '')
      
      const impetusMessage = {
        id: Date.now() + 1,
        remetente: 'impetus' as const,
        texto: respostaLimpa,
        timestamp: new Date()
      }
      
      setMensagens(prev => [...prev, impetusMessage])
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage = {
        id: Date.now() + 1,
        remetente: 'impetus' as const,
        texto: 'Desculpe, ocorreu um erro ao processar sua mensagem. Poderia tentar novamente?',
        timestamp: new Date()
      }
      setMensagens(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }
  
  const encerrarDiagnostico = async () => {
    setIsLoading(true)
    
    try {
      // Gerar resumo executivo
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa: formData.empresa,
          setor: formData.setor,
          problemas: problemas,
          tipo: 'resumo'
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setResumoExecutivo(data.resposta)
      
      // Salvar no Supabase
      await supabase.from('sessoes_diagnostico').update({
        status: 'concluido',
        problemas_identificados: problemas,
        resumo_executivo: data.resposta
      }).eq('status', 'em_andamento')
      
      setIsRelatorioGerado(true)
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      alert('Erro ao gerar relatório. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    })
  }
  
  // TELA INICIAL
  if (!isDiagnosticoAtivo) {
    return (
      <>
        <BackgroundCanvas />
        <CustomCursor />
        <div className="min-h-screen flex items-center justify-center relative z-10">
          <div className="fixed top-0 left-0 right-0 h-12 border-b border-blue-500/15 bg-[#010912]/85 backdrop-blur-sm z-20"></div>
          <div className="fixed bottom-0 left-0 right-0 h-12 border-t border-blue-500/15 bg-[#010912]/85 backdrop-blur-sm z-20"></div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#010912]/90 backdrop-blur-lg border border-blue-500/30 rounded-lg p-8 max-w-md w-full mx-4"
            style={{
              boxShadow: '0 0 40px rgba(0, 180, 216, 0.2)',
              fontFamily: 'Courier New, monospace'
            }}
          >
            <h1 
              className="text-2xl font-bold text-center mb-8"
              style={{
                color: '#FFB400',
                textShadow: '0 0 20px rgba(255, 180, 0, 0.5)',
                animation: 'glitch 5s infinite'
              }}
            >
              IMPETUS
            </h1>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#b0e8ff' }}>
                  EMPRESA
                </label>
                <input
                  type="text"
                  value={formData.empresa}
                  onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                  className="w-full px-4 py-2 bg-[#010912]/50 border border-blue-500/30 rounded focus:outline-none focus:border-blue-500 text-sm"
                  style={{ color: '#b0e8ff', fontFamily: 'Courier New, monospace' }}
                  placeholder="NOME DA EMPRESA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#b0e8ff' }}>
                  RESPONSÁVEL
                </label>
                <input
                  type="text"
                  value={formData.responsavel}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                  className="w-full px-4 py-2 bg-[#010912]/50 border border-blue-500/30 rounded focus:outline-none focus:border-blue-500 text-sm"
                  style={{ color: '#b0e8ff', fontFamily: 'Courier New, monospace' }}
                  placeholder="SEU NOME"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#b0e8ff' }}>
                  SETOR
                </label>
                <select
                  value={formData.setor}
                  onChange={(e) => setFormData(prev => ({ ...prev, setor: e.target.value }))}
                  className="w-full px-4 py-2 bg-[#010912]/50 border border-blue-500/30 rounded focus:outline-none focus:border-blue-500 text-sm"
                  style={{ color: '#b0e8ff', fontFamily: 'Courier New, monospace' }}
                >
                  <option value="">SELECIONE</option>
                  <option value="varejo">VAREJO</option>
                  <option value="servicos">SERVIÇOS</option>
                  <option value="industria">INDÚSTRIA</option>
                  <option value="tecnologia">TECNOLOGIA</option>
                  <option value="saude">SAÚDE</option>
                  <option value="educacao">EDUCAÇÃO</option>
                  <option value="outros">OUTROS</option>
                </select>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={iniciarDiagnostico}
                disabled={!formData.empresa || !formData.responsavel || !formData.setor}
                className="w-full py-3 rounded font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #00B4D8, #0096C7)',
                  color: '#ffffff',
                  textShadow: '0 0 10px rgba(0, 180, 216, 0.5)',
                  fontFamily: 'Courier New, monospace'
                }}
              >
                INICIAR DIAGNÓSTICO
              </motion.button>
            </div>
            
            <div className="mt-6 text-center">
              <Link 
                href="/" 
                className="text-sm hover:text-blue-400 transition-colors"
                style={{ color: '#b0e8ff' }}
              >
                ← VOLTAR
              </Link>
            </div>
          </motion.div>
        </div>
        
        <style jsx>{`
          @keyframes glitch {
            0%, 100% { 
              text-shadow: 0 0 20px rgba(255, 180, 0, 0.5);
              transform: translate(0);
            }
            20% { 
              text-shadow: -2px 0 #ff5555, 2px 0 #00ff88;
              transform: translate(-1px);
            }
            40% { 
              text-shadow: 2px 0 #00B4D8, -2px 0 #FFB400;
              transform: translate(1px);
            }
            60% { 
              text-shadow: 0 0 20px rgba(255, 180, 0, 0.5);
              transform: translate(0);
            }
            80% { 
              text-shadow: 1px 0 #00ff88, -1px 0 #ff5555;
              transform: translate(-0.5px);
            }
          }
        `}</style>
      </>
    )
  }
  
  // TELA DE DIAGNÓSTICO
  if (isDiagnosticoAtivo && !isRelatorioGerado) {
    return (
      <>
        <BackgroundCanvas />
        <CustomCursor />
        <div className="h-screen flex flex-col relative z-10">
          <div className="fixed top-0 left-0 right-0 h-12 border-b border-blue-500/15 bg-[#010912]/85 backdrop-blur-sm z-20 flex items-center px-4">
            <div className="flex items-center space-x-4">
              <span 
                className="text-xl font-bold"
                style={{
                  color: '#FFB400',
                  textShadow: '0 0 20px rgba(255, 180, 0, 0.5)',
                  animation: 'glitch 5s infinite',
                  fontFamily: 'Courier New, monospace'
                }}
              >
                IMPETUS
              </span>
              <span 
                className="text-sm"
                style={{ 
                  color: '#00ff88',
                  textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
                  fontFamily: 'Courier New, monospace'
                }}
              >
                OPERADOR
              </span>
            </div>
          </div>
          
          <div className="fixed bottom-0 left-0 right-0 h-12 border-t border-blue-500/15 bg-[#010912]/85 backdrop-blur-sm z-20"></div>
          
          <div 
            className="flex-1 flex"
            style={{
              perspective: '900px',
              perspectiveOrigin: '50% 45%'
            }}
          >
            {/* COLUNA ESQUERDA */}
            <div 
              className="w-48 bg-[#010912]/90 backdrop-blur-lg border-l border-blue-500/15 flex flex-col"
              style={{
                transform: 'translateZ(18px) rotateY(-1.5deg)',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* NÚCLEO IMPETUS */}
              <div className="p-4 border-b border-blue-500/15">
                <div className="text-xs font-bold mb-2" style={{ color: '#FFB400', fontFamily: 'Courier New, monospace' }}>
                  NÚCLEO IMPETUS
                </div>
                <div className="w-32 h-32 mx-auto">
                  <ImpetusCore />
                </div>
              </div>
              
              {/* LOCALIZAÇÃO */}
              <div className="p-4 border-b border-blue-500/15">
                <div className="text-xs font-bold mb-2" style={{ color: '#00B4D8', fontFamily: 'Courier New, monospace' }}>
                  LOCALIZAÇÃO
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs" style={{ color: '#00ff88', fontFamily: 'Courier New, monospace' }}>
                      ONLINE
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: '#b0e8ff', fontFamily: 'Courier New, monospace' }}>
                    BRASIL | UTC-3
                  </div>
                  <div className="text-xs" style={{ color: '#b0e8ff', fontFamily: 'Courier New, monospace' }}>
                    23°C | 65% UMIDADE
                  </div>
                </div>
              </div>
              
              {/* DIAGNÓSTICO */}
              <div className="p-4 flex-1">
                <div className="text-xs font-bold mb-2" style={{ color: '#00B4D8', fontFamily: 'Courier New, monospace' }}>
                  DIAGNÓSTICO
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs" style={{ color: '#b0e8ff', fontFamily: 'Courier New, monospace' }}>
                      PROGRESSO
                    </div>
                    <div className="w-full bg-blue-500/20 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(problemas.length * 20, 100)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#b0e8ff', fontFamily: 'Courier New, monospace' }}>
                      {Math.min(problemas.length * 20, 100)}%
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs" style={{ color: '#b0e8ff', fontFamily: 'Courier New, monospace' }}>
                      PROBLEMAS IDENTIFICADOS
                    </div>
                    <div className="text-2xl font-bold" style={{ color: '#FFB400', fontFamily: 'Courier New, monospace' }}>
                      {problemas.length}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs" style={{ color: '#b0e8ff', fontFamily: 'Courier New, monospace' }}>
                      MENSAGENS TROCADAS
                    </div>
                    <div className="text-lg font-bold" style={{ color: '#00B4D8', fontFamily: 'Courier New, monospace' }}>
                      {mensagens.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* COLUNA CENTRO */}
            <div className="flex-1 flex flex-col bg-[#010912]/50">
              {/* ÁREA DE MENSAGENS */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {mensagens.map((mensagem) => (
                    <motion.div
                      key={mensagem.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${mensagem.remetente === 'usuario' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-2xl px-4 py-3 rounded-lg ${
                          mensagem.remetente === 'usuario' 
                            ? 'bg-blue-500/20 border border-blue-500/30' 
                            : 'bg-amber-500/10 border border-amber-500/20'
                        }`}
                      >
                        <div 
                          className="text-xs font-bold mb-1"
                          style={{ 
                            color: mensagem.remetente === 'usuario' ? '#00ff88' : '#FFB400',
                            fontFamily: 'Courier New, monospace'
                          }}
                        >
                          {mensagem.remetente === 'usuario' ? 'OPERADOR' : 'IMPETUS'}
                        </div>
                        <div 
                          className="text-sm whitespace-pre-wrap"
                          style={{ 
                            color: mensagem.remetente === 'usuario' ? '#b0ffcc' : '#b0e8ff',
                            fontFamily: 'Courier New, monospace'
                          }}
                        >
                          {mensagem.texto}
                        </div>
                        <div 
                          className="text-xs mt-1"
                          style={{ 
                            color: 'rgba(176, 232, 255, 0.5)',
                            fontFamily: 'Courier New, monospace'
                          }}
                        >
                          {mensagem.timestamp.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
                        <div 
                          className="text-xs font-bold mb-1"
                          style={{ 
                            color: '#FFB400',
                            fontFamily: 'Courier New, monospace'
                          }}
                        >
                          IMPETUS
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </AnimatePresence>
              </div>
              
              {/* WAVEFORM */}
              <div className="h-6 border-t border-blue-500/15">
                <Waveform />
              </div>
              
              {/* INPUT */}
              <div className="border-t border-blue-500/15 p-4">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse absolute left-2 top-1/2 transform -translate-y-1/2"></div>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
                      placeholder="TRANSMITIR MENSAGEM..."
                      className="w-full pl-8 pr-4 py-2 bg-[#010912]/50 border border-blue-500/30 rounded focus:outline-none focus:border-blue-500 text-sm"
                      style={{ 
                        color: '#b0e8ff',
                        fontFamily: 'Courier New, monospace'
                      }}
                      disabled={isLoading}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/1/2">
                      <div className="w-1 h-4 bg-green-500 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <button
                    onClick={enviarMensagem}
                    disabled={isLoading || !inputText.trim()}
                    className="px-4 py-2 rounded font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #00B4D8, #0096C7)',
                      color: '#ffffff',
                      fontFamily: 'Courier New, monospace'
                    }}
                  >
                    ENVIAR
                  </button>
                </div>
              </div>
            </div>
            
            {/* COLUNA DIREITA */}
            <div 
              className="w-36 bg-[#010912]/90 backdrop-blur-lg border-r border-blue-500/15 flex flex-col"
              style={{
                transform: 'translateZ(-16px) rotateY(1.5deg)',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* RELÓGIO */}
              <div className="p-4 border-b border-blue-500/15">
                <div 
                  className="text-lg font-bold text-center"
                  style={{ 
                    color: '#00B4D8',
                    textShadow: '0 0 10px rgba(0, 180, 216, 0.4)',
                    letterSpacing: '3px',
                    fontFamily: 'Courier New, monospace'
                  }}
                >
                  {formatTime(currentTime)}
                </div>
              </div>
              
              {/* EMPRESA ALVO */}
              <div className="p-4 border-b border-blue-500/15">
                <div className="text-xs font-bold mb-2" style={{ color: '#00B4D8', fontFamily: 'Courier New, monospace' }}>
                  EMPRESA ALVO
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold" style={{ color: '#FFB400', fontFamily: 'Courier New, monospace' }}>
                    {formData.empresa.toUpperCase()}
                  </div>
                  <div className="text-xs" style={{ color: '#b0e8ff', fontFamily: 'Courier New, monospace' }}>
                    {formData.setor.toUpperCase()}
                  </div>
                  <div className="text-xs" style={{ color: '#00ff88', fontFamily: 'Courier New, monospace' }}>
                    {formData.responsavel.toUpperCase()}
                  </div>
                </div>
              </div>
              
              {/* PROBLEMAS */}
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="text-xs font-bold mb-2" style={{ color: '#00B4D8', fontFamily: 'Courier New, monospace' }}>
                  AMEAÇAS IDENTIFICADAS
                </div>
                <div className="space-y-2">
                  {problemas.map((problema) => (
                    <div key={problema.id} className="p-2 bg-[#010912]/50 border border-blue-500/20 rounded">
                      <div className="text-xs font-bold mb-1" style={{ color: '#FFB400', fontFamily: 'Courier New, monospace' }}>
                        {problema.area.toUpperCase()}
                      </div>
                      <div className="text-xs" style={{ color: '#b0e8ff', fontFamily: 'Courier New, monospace' }}>
                        {problema.problema.length > 50 ? problema.problema.substring(0, 50) + '...' : problema.problema}
                      </div>
                      <div className="mt-1">
                        <span 
                          className={`text-xs px-1 py-0.5 rounded font-bold ${
                            problema.impacto === 'alto' 
                              ? 'bg-red-500/20 text-red-400' 
                              : problema.impacto === 'medio'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                          style={{ fontFamily: 'Courier New, monospace' }}
                        >
                          {problema.impacto.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* BOTÃO ENCERRAR */}
              <div className="p-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={encerrarDiagnostico}
                  className="w-full py-2 rounded font-bold transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #ff5555, #cc0000)',
                    color: '#ffffff',
                    fontFamily: 'Courier New, monospace'
                  }}
                >
                  ENCERRAR
                </motion.button>
              </div>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes glitch {
            0%, 100% { 
              text-shadow: 0 0 20px rgba(255, 180, 0, 0.5);
              transform: translate(0);
            }
            20% { 
              text-shadow: -2px 0 #ff5555, 2px 0 #00ff88;
              transform: translate(-1px);
            }
            40% { 
              text-shadow: 2px 0 #00B4D8, -2px 0 #FFB400;
              transform: translate(1px);
            }
            60% { 
              text-shadow: 0 0 20px rgba(255, 180, 0, 0.5);
              transform: translate(0);
            }
            80% { 
              text-shadow: 1px 0 #00ff88, -1px 0 #ff5555;
              transform: translate(-0.5px);
            }
          }
        `}</style>
      </>
    )
  }
  
  // TELA DE RELATÓRIO
  if (isRelatorioGerado) {
    return (
      <>
        <BackgroundCanvas />
        <CustomCursor />
        <div className="min-h-screen flex items-center justify-center relative z-10">
          <div className="fixed top-0 left-0 right-0 h-12 border-b border-blue-500/15 bg-[#010912]/85 backdrop-blur-sm z-20"></div>
          <div className="fixed bottom-0 left-0 right-0 h-12 border-t border-blue-500/15 bg-[#010912]/85 backdrop-blur-sm z-20"></div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#010912]/90 backdrop-blur-lg border border-blue-500/30 rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            style={{
              boxShadow: '0 0 40px rgba(0, 180, 216, 0.2)',
              fontFamily: 'Courier New, monospace'
            }}
          >
            <h1 
              className="text-3xl font-bold text-center mb-8"
              style={{
                color: '#FFB400',
                textShadow: '0 0 20px rgba(255, 180, 0, 0.5)',
                animation: 'glitch 5s infinite'
              }}
            >
              RELATÓRIO IMPETUS
            </h1>
            
            <div className="mb-8">
              <h2 
                className="text-xl font-bold mb-4"
                style={{ color: '#00B4D8', fontFamily: 'Courier New, monospace' }}
              >
                EMPRESA: {formData.empresa.toUpperCase()}
              </h2>
              <div 
                className="text-sm whitespace-pre-wrap"
                style={{ 
                  color: '#b0e8ff',
                  lineHeight: '1.6',
                  fontFamily: 'Courier New, monospace'
                }}
              >
                {resumoExecutivo}
              </div>
            </div>
            
            <div className="mb-8">
              <h3 
                className="text-lg font-bold mb-4"
                style={{ color: '#00B4D8', fontFamily: 'Courier New, monospace' }}
              >
                PROBLEMAS IDENTIFICADOS ({problemas.length})
              </h3>
              <div className="space-y-4">
                {problemas.map((problema, index) => (
                  <motion.div
                    key={problema.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-[#010912]/50 border border-blue-500/20 rounded"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div 
                        className="font-bold"
                        style={{ color: '#FFB400', fontFamily: 'Courier New, monospace' }}
                      >
                        {problema.area.toUpperCase()}
                      </div>
                      <div className="flex space-x-2">
                        <span 
                          className={`text-xs px-2 py-1 rounded font-bold ${
                            problema.impacto === 'alto' 
                              ? 'bg-red-500/20 text-red-400' 
                              : problema.impacto === 'medio'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                          style={{ fontFamily: 'Courier New, monospace' }}
                        >
                          {problema.impacto.toUpperCase()}
                        </span>
                        <span 
                          className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded font-bold"
                          style={{ fontFamily: 'Courier New, monospace' }}
                        >
                          {problema.tempo}
                        </span>
                      </div>
                    </div>
                    
                    <div 
                      className="text-sm mb-2"
                      style={{ color: '#b0e8ff', fontFamily: 'Courier New, monospace' }}
                    >
                      {problema.problema}
                    </div>
                    
                    <div 
                      className="text-sm mb-2"
                      style={{ color: '#00ff88', fontFamily: 'Courier New, monospace' }}
                    >
                      SOLUÇÃO: {problema.solucao}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div 
                        className="text-xs"
                        style={{ color: '#00B4D8', fontFamily: 'Courier New, monospace' }}
                      >
                        FERRAMENTA: {problema.ferramenta}
                      </div>
                      {problema.custo_estimado && (
                        <div 
                          className="text-xs font-bold"
                          style={{ color: '#FFB400', fontFamily: 'Courier New, monospace' }}
                        >
                          {problema.custo_estimado}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/'}
                className="flex-1 py-3 rounded font-bold transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #00B4D8, #0096C7)',
                  color: '#ffffff',
                  fontFamily: 'Courier New, monospace'
                }}
              >
                NOVO DIAGNÓSTICO
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.print()}
                className="flex-1 py-3 rounded font-bold transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #FFB400, #cc9900)',
                  color: '#ffffff',
                  fontFamily: 'Courier New, monospace'
                }}
              >
                IMPRIMIR RELATÓRIO
              </motion.button>
            </div>
          </motion.div>
        </div>
        
        <style jsx>{`
          @keyframes glitch {
            0%, 100% { 
              text-shadow: 0 0 20px rgba(255, 180, 0, 0.5);
              transform: translate(0);
            }
            20% { 
              text-shadow: -2px 0 #ff5555, 2px 0 #00ff88;
              transform: translate(-1px);
            }
            40% { 
              text-shadow: 2px 0 #00B4D8, -2px 0 #FFB400;
              transform: translate(1px);
            }
            60% { 
              text-shadow: 0 0 20px rgba(255, 180, 0, 0.5);
              transform: translate(0);
            }
            80% { 
              text-shadow: 1px 0 #00ff88, -1px 0 #ff5555;
              transform: translate(-0.5px);
            }
          }
        `}</style>
      </>
    )
  }
  
  return null
}
