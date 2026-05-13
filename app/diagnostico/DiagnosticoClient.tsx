'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Message {
  role: 'assistant' | 'user'
  content: string
  time: string
}

interface Problem {
  area: string
  problema: string
  solucao: string
  ferramenta: string
  impacto: 'alto' | 'medio' | 'baixo'
  tempo: string
}

interface FormData {
  empresa: string
  responsavel: string
  setor: string
}

function parseProblem(text: string): Problem | null {
  const match = text.match(/\[PROBLEMA:\s*area=([^|]+)\|problema=([^|]+)\|solucao=([^|]+)\|ferramenta=([^|]+)\|impacto=([^|]+)\|tempo=([^\]]+)\]/)
  if (!match) return null
  return {
    area: match[1].trim(),
    problema: match[2].trim(),
    solucao: match[3].trim(),
    ferramenta: match[4].trim(),
    impacto: match[5].trim() as 'alto' | 'medio' | 'baixo',
    tempo: match[6].trim()
  }
}

function cleanMessage(text: string): string {
  return text.replace(/\[PROBLEMA:[^\]]+\]/g, '').trim()
}

export default function DiagnosticoClient() {
  const bgRef = useRef<HTMLCanvasElement>(null)
  const cursorRef = useRef<HTMLCanvasElement>(null)
  const orbRef = useRef<HTMLCanvasElement>(null)
  const waveRef = useRef<HTMLCanvasElement>(null)
  const msgsRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)

  const [phase, setPhase] = useState<'form' | 'chat' | 'report'>('form')
  const [formData, setFormData] = useState<FormData>({ empresa: '', responsavel: '', setor: '' })
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [problems, setProblems] = useState<Problem[]>([])
  const [sessaoId, setSessaoId] = useState<string | null>(null)
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState('00:00:00')
  const [tokenCount, setTokenCount] = useState(0)
  const [clock, setClock] = useState('00:00:00')

  const mouseRef = useRef({ x: 400, y: 300 })
  const trailRef = useRef<{ x: number; y: number; t: number }[]>([])
  const pingsRef = useRef<{ x: number; y: number; t: number }[]>([])
  const cursorAngleRef = useRef(0)

  // ── Clock & elapsed ──────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date()
      setClock(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`)
      const s = Math.floor((Date.now() - startTime) / 1000)
      setElapsed(`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`)
    }, 1000)
    return () => clearInterval(id)
  }, [startTime])

  // ── Mouse tracking ────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = cursorRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
      trailRef.current.push({ x: mouseRef.current.x, y: mouseRef.current.y, t: Date.now() })
      if (trailRef.current.length > 35) trailRef.current.shift()
    }
    const onClick = (e: MouseEvent) => {
      const el = cursorRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      pingsRef.current.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: Date.now() })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('click', onClick)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('click', onClick) }
  }, [])

  // ── Orb data ──────────────────────────────────────────────────────
  const orbDataRef = useRef<{ pts: any[]; conns: [number,number][] } | null>(null)
  const orbAngleRef = useRef({ y: 0, x: 0.2 })

  useEffect(() => {
    const R = 62
    const pts: any[] = []
    const conns: [number,number][] = []

    for (let i = 0; i < 140; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = R * (0.88 + Math.random() * 0.18)
      pts.push({ ox: r*Math.sin(phi)*Math.cos(theta), oy: r*Math.cos(phi), oz: r*Math.sin(phi)*Math.sin(theta), bright: Math.random() < 0.09, sz: 0.5 + Math.random() * 2.2 })
    }
    const arcs = [
      {tX:0.3,tZ:0.1,s:0.2,l:2.4,n:28},{tX:-0.5,tZ:0.8,s:1.0,l:1.8,n:22},
      {tX:0.8,tZ:-0.3,s:0.5,l:2.8,n:30},{tX:-0.2,tZ:1.2,s:2.0,l:1.5,n:20},{tX:0.6,tZ:0.5,s:3.5,l:2.0,n:25}
    ]
    arcs.forEach(arc => {
      const cr = R * (0.94 + Math.random() * 0.08)
      for (let i = 0; i < arc.n; i++) {
        const a = arc.s + (i/(arc.n-1)) * arc.l
        let x = cr*Math.cos(a), y = 0, z = cr*Math.sin(a)
        const cx2=Math.cos(arc.tX),sx=Math.sin(arc.tX),y2=y*cx2-z*sx,z2=y*sx+z*cx2
        const cz=Math.cos(arc.tZ),sz2=Math.sin(arc.tZ),x3=x*cz-y2*sz2,y3=x*sz2+y2*cz
        pts.push({ ox:x3, oy:y3, oz:z2, arcPt:true, sz:0.7 })
        if (i > 0) conns.push([pts.length-2, pts.length-1])
      }
    })
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].arcPt) continue
      const dists = pts.map((p,j) => {
        if (i===j) return {j,d:Infinity}
        const dx=pts[i].ox-p.ox,dy=pts[i].oy-p.oy,dz=pts[i].oz-p.oz
        return {j,d:Math.sqrt(dx*dx+dy*dy+dz*dz)}
      }).sort((a,b)=>a.d-b.d)
      for (let k=0;k<3;k++) {
        const mn=Math.min(i,dists[k].j),mx=Math.max(i,dists[k].j)
        if (!conns.some(c=>c[0]===mn&&c[1]===mx)) conns.push([mn,mx])
      }
      if (Math.random()<0.22) {
        const ri=Math.floor(Math.random()*pts.length)
        if (ri!==i){const mn=Math.min(i,ri),mx=Math.max(i,ri);if(!conns.some(c=>c[0]===mn&&c[1]===mx))conns.push([mn,mx])}
      }
    }
    orbDataRef.current = { pts, conns }
  }, [])

  // ── Main animation loop ───────────────────────────────────────────
  useEffect(() => {
    let waveT = 0

    function drawBg() {
      const c = bgRef.current; if (!c) return
      const ctx = c.getContext('2d')!
      c.width = c.offsetWidth; c.height = c.offsetHeight
      ctx.clearRect(0,0,c.width,c.height)
      ctx.strokeStyle='rgba(0,180,216,0.03)';ctx.lineWidth=0.5
      const vx=c.width/2,vy=c.height/2
      for(let i=0;i<=14;i++){const x=(i/14)*c.width;ctx.beginPath();ctx.moveTo(vx,vy);ctx.lineTo(x,0);ctx.stroke();ctx.beginPath();ctx.moveTo(vx,vy);ctx.lineTo(x,c.height);ctx.stroke()}
      for(let j=0;j<=8;j++){const y=(j/8)*c.height;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(c.width,y);ctx.stroke()}
    }

    const bgPts = Array.from({length:60},()=>({x:Math.random()*1400,y:Math.random()*900,z:Math.random(),vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.3}))

    function animBg(ctx: CanvasRenderingContext2D, W: number, H: number) {
      bgPts.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy
        if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1
        ctx.beginPath();ctx.arc(p.x,p.y,0.5+p.z*1.2,0,Math.PI*2)
        ctx.fillStyle=`rgba(0,180,216,${0.08+p.z*0.28})`;ctx.fill()
      })
      for(let i=0;i<bgPts.length;i++)for(let j=i+1;j<bgPts.length;j++){
        const dx=bgPts[i].x-bgPts[j].x,dy=bgPts[i].y-bgPts[j].y,d=Math.sqrt(dx*dx+dy*dy)
        if(d<80){ctx.beginPath();ctx.moveTo(bgPts[i].x,bgPts[i].y);ctx.lineTo(bgPts[j].x,bgPts[j].y);ctx.strokeStyle=`rgba(0,180,216,${0.04*(1-d/80)})`;ctx.lineWidth=0.5;ctx.stroke()}
      }
    }

    function drawOrb() {
      const c = orbRef.current; if (!c || !orbDataRef.current) return
      const ctx = c.getContext('2d')!
      const OW=c.width,OH=c.height,R=62
      ctx.clearRect(0,0,OW,OH)
      orbAngleRef.current.y += 0.006
      orbAngleRef.current.x = 0.2 + Math.sin(orbAngleRef.current.y*0.35)*0.08
      const {pts,conns} = orbDataRef.current

      function proj(x:number,y:number,z:number){
        const fov=270,ax=orbAngleRef.current.x,ay=orbAngleRef.current.y
        const cx2=Math.cos(ax),sx=Math.sin(ax),y1=y*cx2-z*sx,z1=y*sx+z*cx2
        const cy=Math.cos(ay),sy=Math.sin(ay),x2=x*cy+z1*sy,z2=-x*sy+z1*cy
        const sc=fov/(fov+z2+50)
        return{sx:OW/2+x2*sc,sy:OH/2-y1*sc,sc,rz:z2}
      }

      const projected = pts.map((p,i)=>({...proj(p.ox,p.oy,p.oz),i,bright:p.bright,sz:p.sz||1,arcPt:p.arcPt}))
      conns.forEach(([i,j])=>{
        const a=projected[i],b=projected[j];if(!a||!b)return
        const avgZ=(a.rz+b.rz)/2,d=Math.min(1,Math.max(0,(avgZ+R*1.3)/(R*2.6)))
        const isArc=pts[i].arcPt||pts[j].arcPt
        ctx.beginPath();ctx.moveTo(a.sx,a.sy);ctx.lineTo(b.sx,b.sy)
        ctx.strokeStyle=isArc?`rgba(255,${Math.floor(160+d*80)},0,${0.25+d*0.55})`:`rgba(255,${Math.floor(100+d*80)},0,${0.08+d*0.25})`
        ctx.lineWidth=isArc?0.6+d*0.8:0.3+d*0.5;ctx.stroke()
      })
      projected.sort((a,b)=>a.rz-b.rz).forEach(p=>{
        if(p.sx<-5||p.sx>OW+5||p.sy<-5||p.sy>OH+5)return
        const d=Math.min(1,Math.max(0,(p.rz+R*1.3)/(R*2.6)))
        const sz=Math.max(0.4,(p.sz||1)*p.sc*2.5),al=0.2+d*0.8
        if(p.bright){ctx.beginPath();ctx.arc(p.sx,p.sy,sz*3,0,Math.PI*2);ctx.fillStyle=`rgba(255,220,100,${al*0.15})`;ctx.fill();ctx.beginPath();ctx.arc(p.sx,p.sy,sz*1.5,0,Math.PI*2);ctx.fillStyle=`rgba(255,220,50,${al})`;ctx.fill()}
        else{ctx.beginPath();ctx.arc(p.sx,p.sy,sz*1.8,0,Math.PI*2);ctx.fillStyle=`rgba(255,140,0,${al*0.07})`;ctx.fill();ctx.beginPath();ctx.arc(p.sx,p.sy,Math.max(0.4,sz),0,Math.PI*2);ctx.fillStyle=`rgba(255,${Math.floor(130+d*90)},0,${al})`;ctx.fill()}
      })
    }

    function drawWave() {
      const c = waveRef.current; if (!c) return
      const ctx = c.getContext('2d')!
      const W=c.offsetWidth||600,H=26
      if(c.width!==W)c.width=W
      ctx.clearRect(0,0,W,H)
      ctx.beginPath()
      for(let x=0;x<W;x++){const y=H/2+Math.sin(x*0.05+waveT)*4+Math.sin(x*0.12+waveT*1.3)*2+Math.sin(x*0.02+waveT*0.7)*2.5;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}
      ctx.strokeStyle='rgba(0,180,216,0.55)';ctx.lineWidth=1;ctx.stroke()
      ctx.beginPath()
      for(let x=0;x<W;x++){const y=H/2+Math.sin(x*0.07+waveT*1.2+1)*3+Math.sin(x*0.03+waveT*0.8)*1.5;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}
      ctx.strokeStyle='rgba(255,180,0,0.3)';ctx.lineWidth=0.7;ctx.stroke()
      waveT+=0.05
    }

    function drawCursor() {
      const c = cursorRef.current; if (!c) return
      const ctx = c.getContext('2d')!
      c.width=c.offsetWidth;c.height=c.offsetHeight
      ctx.clearRect(0,0,c.width,c.height)
      cursorAngleRef.current += 0.04
      const now=Date.now(),{x:mx,y:my}=mouseRef.current

      trailRef.current.forEach((p,i)=>{
        const age=(now-p.t)/500;if(age>1)return
        const alpha=(1-age)*0.7,size=2.5*(1-age*0.6)
        const amber=Math.random()<0.3
        ctx.beginPath();ctx.arc(p.x,p.y,Math.max(0.3,size),0,Math.PI*2)
        ctx.fillStyle=amber?`rgba(255,180,0,${alpha})`:`rgba(0,180,216,${alpha*0.7})`;ctx.fill()
        if(i>0&&age<0.3){ctx.beginPath();ctx.moveTo(trailRef.current[i-1].x,trailRef.current[i-1].y);ctx.lineTo(p.x,p.y);ctx.strokeStyle=`rgba(255,160,0,${alpha*0.3})`;ctx.lineWidth=1;ctx.stroke()}
      })

      pingsRef.current.forEach((ping,i)=>{
        const age=(now-ping.t)/800;if(age>1){pingsRef.current.splice(i,1);return}
        const r=age*56,alpha=(1-age)*0.8
        ctx.beginPath();ctx.arc(ping.x,ping.y,r,0,Math.PI*2);ctx.strokeStyle=`rgba(255,180,0,${alpha*0.6})`;ctx.lineWidth=1.5;ctx.stroke()
        ctx.beginPath();ctx.arc(ping.x,ping.y,r*0.5,0,Math.PI*2);ctx.strokeStyle=`rgba(0,180,216,${alpha*0.4})`;ctx.lineWidth=0.8;ctx.stroke()
        for(let t=0;t<4;t++){const a=(t/4)*Math.PI*2+cursorAngleRef.current;const x1=ping.x+r*0.85*Math.cos(a),y1=ping.y+r*0.85*Math.sin(a),x2=ping.x+r*1.1*Math.cos(a),y2=ping.y+r*1.1*Math.sin(a);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=`rgba(255,180,0,${alpha})`;ctx.lineWidth=1.5;ctx.stroke()}
      })

      const oR=11
      ctx.beginPath();ctx.arc(mx,my,oR,0,Math.PI*2);ctx.strokeStyle='rgba(255,180,0,0.5)';ctx.lineWidth=1;ctx.stroke()
      for(let i=0;i<4;i++){const a=cursorAngleRef.current+(i/4)*Math.PI*2,gs=a+0.3,ge=a+Math.PI/2-0.3;ctx.beginPath();ctx.arc(mx,my,oR,gs,ge);ctx.strokeStyle='rgba(255,200,0,0.9)';ctx.lineWidth=1.5;ctx.stroke()}
      const iR=4,pulsate=0.7+0.3*Math.sin(Date.now()*0.008)
      ctx.beginPath();ctx.arc(mx,my,iR,0,Math.PI*2);ctx.strokeStyle='rgba(255,180,0,0.3)';ctx.lineWidth=0.8;ctx.stroke()
      ctx.beginPath();ctx.arc(mx,my,iR*0.4,0,Math.PI*2);ctx.fillStyle=`rgba(255,200,0,${pulsate})`;ctx.fill()
      const ll=4
      ctx.strokeStyle='rgba(255,180,0,0.7)';ctx.lineWidth=1
      ctx.beginPath();ctx.moveTo(mx-oR-ll,my);ctx.lineTo(mx-oR-2,my);ctx.stroke()
      ctx.beginPath();ctx.moveTo(mx+oR+2,my);ctx.lineTo(mx+oR+ll,my);ctx.stroke()
      ctx.beginPath();ctx.moveTo(mx,my-oR-ll);ctx.lineTo(mx,my-oR-2);ctx.stroke()
      ctx.beginPath();ctx.moveTo(mx,my+oR+2);ctx.lineTo(mx,my+oR+ll);ctx.stroke()
      ctx.font='7px Courier New';ctx.fillStyle='rgba(0,180,216,0.5)'
      ctx.fillText(`${Math.floor(mx)},${Math.floor(my)}`,mx+oR+8,my-4)
    }

    drawBg()

    function loop() {
      const bgCanvas = bgRef.current
      if (bgCanvas) {
        const ctx = bgCanvas.getContext('2d')!
        ctx.clearRect(0,0,bgCanvas.width,bgCanvas.height)
        ctx.strokeStyle='rgba(0,180,216,0.03)';ctx.lineWidth=0.5
        const vx=bgCanvas.width/2,vy=bgCanvas.height/2
        for(let i=0;i<=14;i++){const x=(i/14)*bgCanvas.width;ctx.beginPath();ctx.moveTo(vx,vy);ctx.lineTo(x,0);ctx.stroke();ctx.beginPath();ctx.moveTo(vx,vy);ctx.lineTo(x,bgCanvas.height);ctx.stroke()}
        for(let j=0;j<=8;j++){const y=(j/8)*bgCanvas.height;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(bgCanvas.width,y);ctx.stroke()}
        animBg(ctx, bgCanvas.width, bgCanvas.height)
      }
      drawOrb()
      drawWave()
      drawCursor()
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  // ── Session persistence ─────────────────────────────────────────────
  useEffect(() => {
    // Load session from sessionStorage on mount
    const savedSession = sessionStorage.getItem('impetus_session')
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession)
        setFormData(session.formData || { empresa: '', responsavel: '', setor: '' })
        setMessages(session.messages || [])
        setProblems(session.problems || [])
        setSessaoId(session.sessaoId || null)
        setPhase(session.phase || 'form')
        setTokenCount(session.tokenCount || 0)
      } catch (e) {
        console.error('Failed to load session:', e)
        sessionStorage.removeItem('impetus_session')
      }
    }
  }, [])

  // Save session to sessionStorage
  useEffect(() => {
    if (phase !== 'form') {
      const sessionData = {
        formData,
        messages,
        problems,
        sessaoId,
        phase,
        tokenCount
      }
      sessionStorage.setItem('impetus_session', JSON.stringify(sessionData))
    }
  }, [formData, messages, problems, sessaoId, phase, tokenCount])

  // Clear session
  const clearSession = useCallback(() => {
    sessionStorage.removeItem('impetus_session')
  }, [])

  // ── Start session ─────────────────────────────────────────────────
  const handleStart = async () => {
    if (!formData.empresa || !formData.responsavel || !formData.setor) return
    try {
      const { data } = await supabase.from('sessoes_diagnostico').insert({
        empresa: formData.empresa, responsavel: formData.responsavel, setor: formData.setor, status: 'em_andamento'
      }).select().single()
      if (data) setSessaoId(data.id)
    } catch(e) { console.error(e) }

    const firstMsg: Message = {
      role: 'assistant',
      content: `Olá ${formData.responsavel}! Sou Impetus, analista sênior de implementação de AI da Impulso.AI. Estou aqui para conduzir um diagnóstico profundo da ${formData.empresa} no setor ${formData.setor}.\n\nPara começar, me conta: qual é o principal objetivo que você quer alcançar nos próximos 12 meses com a empresa?`,
      time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    }
    setMessages([firstMsg])
    setPhase('chat')
  }

  // ── Send message with retry and timeout ──────────────────────────────
  const handleSend = useCallback(async (retryCount = 0) => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim(), time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setTokenCount(t => t + input.length)

    try {
      // Add timeout controller
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 seconds

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          mensagem: input.trim(),
          empresa: formData.empresa,
          setor: formData.setor,
          historico: newMessages.map(m=>`${m.role==='assistant'?'Impetus':'Operador'}: ${m.content}`).join('\n')
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      const raw = data.resposta || 'Desculpe, tive um problema. Podemos tentar novamente?'
      const problem = parseProblem(raw)
      const clean = cleanMessage(raw)

      if (problem) {
        setProblems(prev => [...prev, problem])
        if (sessaoId) {
          await supabase.from('problemas_identificados').insert({
            sessao_id: sessaoId, ...problem
          })
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant', content: clean,
        time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
      }])
      setTokenCount(t => t + clean.length)
    } catch(e: any) {
      console.error('API Error:', e)
      
      // Handle timeout specifically
      if (e.name === 'AbortError') {
        setMessages(prev => [...prev, { 
          role:'assistant', 
          content:'Análise em processamento. Aguarde...',
          time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) 
        }])
        return
      }
      
      // Retry logic
      if (retryCount < 2) {
        console.log(`Retrying... Attempt ${retryCount + 1}/2`)
        setTimeout(() => handleSend(retryCount + 1), 2000)
        return
      }
      
      // Show error after retries exhausted
      setMessages(prev => [...prev, { 
        role:'assistant', 
        content:'Erro de conexão. Verifique sua internet e tente novamente.',
        time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) 
      }])
    }
    setLoading(false)
  }, [input, loading, messages, formData, sessaoId])

  // ── End session ───────────────────────────────────────────────────
  const handleEnd = async () => {
    if (sessaoId) {
      await supabase.from('sessoes_diagnostico').update({ status: 'concluido' }).eq('id', sessaoId)
      await supabase.from('relatorios').insert({
        sessao_id: sessaoId,
        conteudo_json: { empresa: formData, problemas: problems, mensagens: messages.length, duracao: elapsed }
      })
    }
    clearSession() // Clear session storage
    setPhase('report')
  }

  // ── Auto scroll ───────────────────────────────────────────────────
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [messages])

  // ── RENDER ────────────────────────────────────────────────────────
  return (
    <div style={{ width:'100vw', height:'100vh', background:'#010912', fontFamily:'Courier New, monospace', cursor:'none', overflow:'hidden', display:'flex', flexDirection:'column', position:'relative' }}>

      {/* Background canvas */}
      <canvas ref={bgRef} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:0 }} />

      {/* Cursor canvas */}
      <canvas ref={cursorRef} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:100, pointerEvents:'none' }} />

      {/* TOPBAR */}
      <div style={{ height:36, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', borderBottom:'0.5px solid rgba(0,180,216,0.15)', background:'rgba(1,9,18,0.9)', flexShrink:0, zIndex:10, position:'relative' }}>
        <span style={{ fontSize:11, letterSpacing:4, color:'#00B4D8', textShadow:'0 0 8px rgba(0,180,216,0.4)' }}>IMPULSO.AI // IMPETUS DIAGNOSTIC SYSTEM</span>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:'#00ff88', display:'inline-block', boxShadow:'0 0 5px rgba(0,255,136,0.6)', animation:'pulse 1.5s infinite' }} />
          <span style={{ fontSize:9, letterSpacing:3, color:'#00B4D8', textShadow:'0 0 6px rgba(0,180,216,0.3)' }}>SISTEMA ATIVO</span>
          <span style={{ width:1, height:10, background:'rgba(0,180,216,0.2)', display:'inline-block' }} />
          <span style={{ fontSize:9, letterSpacing:2, color:'rgba(0,180,216,0.35)' }}>SESSION #0041 // {formData.empresa || 'AGUARDANDO'}</span>
        </div>
      </div>

      {/* MAIN */}
      {phase === 'form' ? (
        // ── FORM ──────────────────────────────────────────────────────
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', zIndex:10, position:'relative' }}>
          <div style={{ background:'rgba(0,20,42,0.9)', border:'0.5px solid rgba(0,180,216,0.3)', padding:'40px 48px', width:480, position:'relative' }}>
            <div style={{ fontSize:7, letterSpacing:4, color:'#FFB400', textShadow:'0 0 10px rgba(255,180,0,0.5)', marginBottom:24 }}>INICIAR SESSÃO DE DIAGNÓSTICO</div>
            {(['empresa','responsavel','setor'] as const).map(field => (
              <div key={field} style={{ marginBottom:20 }}>
                <div style={{ fontSize:7, letterSpacing:3, color:'rgba(0,180,216,0.6)', marginBottom:6, textShadow:'0 0 4px rgba(0,180,216,0.3)' }}>
                  {field === 'empresa' ? 'NOME DA EMPRESA' : field === 'responsavel' ? 'NOME DO RESPONSÁVEL' : 'SETOR DE ATUAÇÃO'}
                </div>
                {field === 'setor' ? (
                  <select value={formData.setor} onChange={e=>setFormData(p=>({...p,setor:e.target.value}))}
                    style={{ width:'100%', background:'rgba(0,10,25,0.8)', border:'0 0 0.5px solid rgba(0,180,216,0.4)', borderBottom:'0.5px solid rgba(0,180,216,0.4)', color:'#00ffcc', fontSize:11, padding:'8px 0', outline:'none', fontFamily:'Courier New', cursor:'none' }}>
                    <option value=''>Selecione...</option>
                    {['Varejo','Serviços','Indústria','Tecnologia','Saúde','Educação','Outros'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={formData[field]} onChange={e=>setFormData(p=>({...p,[field]:e.target.value}))}
                    onKeyDown={e=>e.key==='Enter'&&handleStart()}
                    style={{ width:'100%', background:'transparent', border:'none', borderBottom:'0.5px solid rgba(0,180,216,0.4)', color:'#00ffcc', fontSize:11, padding:'8px 0', outline:'none', fontFamily:'Courier New', cursor:'none' }} />
                )}
              </div>
            ))}
            <button onClick={handleStart} style={{ width:'100%', background:'linear-gradient(90deg,rgba(0,120,160,0.3),rgba(0,180,216,0.2))', border:'0.5px solid rgba(0,180,216,0.5)', color:'#00ffcc', fontSize:9, letterSpacing:4, padding:'12px 0', cursor:'none', fontFamily:'Courier New', marginTop:8, textShadow:'0 0 6px rgba(0,255,200,0.4)' }}>
              ◈ INICIAR DIAGNÓSTICO
            </button>
          </div>
        </div>

      ) : phase === 'chat' ? (
        // ── CHAT ──────────────────────────────────────────────────────
        <div style={{ flex:1, display:'flex', gap:8, padding:6, zIndex:10, position:'relative', perspective:'900px', perspectiveOrigin:'50% 45%', overflow:'hidden' }}>

          {/* LEFT */}
          <div style={{ width:240, flexShrink:0, display:'flex', flexDirection:'column', gap:7, transform:'translateZ(18px) rotateY(-1.5deg)', transformStyle:'preserve-3d' }}>

            <div style={{ background:'rgba(0,25,52,0.85)', border:'0.5px solid rgba(0,180,216,0.3)', padding:'10px 8px 8px', flexShrink:0, position:'relative' }}>
              <div style={{ fontSize:10, letterSpacing:3, color:'#FFB400', textShadow:'0 0 10px rgba(255,180,0,0.5)', marginBottom:6 }}>NÚCLEO IMPETUS</div>
              <div style={{ width:154, height:154, margin:'0 auto', position:'relative' }}>
                <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:110, height:110, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,150,0,0.07),transparent 70%)', animation:'breathe 4s ease-in-out infinite' }} />
                <canvas ref={orbRef} width={154} height={154} style={{ display:'block' }} />
              </div>
              <div style={{ textAlign:'center', marginTop:10 }}>
                <div style={{ fontSize:18, letterSpacing:6, color:'#FFB400', textShadow:'0 0 20px rgba(255,180,0,0.5)', animation:'impGlitch 5s infinite' }}>
                  IMPETUS<span style={{ display:'inline-block', width:4, height:4, borderRadius:'50%', background:'#FFB400', verticalAlign:'middle', marginLeft:4, boxShadow:'0 0 6px rgba(255,180,0,0.8)', animation:'pulse 2s infinite' }} />
                </div>
                <div style={{ fontSize:8, letterSpacing:3, color:'rgba(255,160,0,0.5)', marginTop:3, textShadow:'0 0 6px rgba(255,150,0,0.3)' }}>ANALISTA SR. IMPULSO.AI // GEN.4</div>
              </div>
            </div>

            <div style={{ background:'rgba(0,25,52,0.85)', border:'0.5px solid rgba(0,180,216,0.3)', padding:10, flexShrink:0, position:'relative' }}>
              <div style={{ fontSize:10, letterSpacing:3, color:'#00B4D8', opacity:0.75, marginBottom:6, textShadow:'0 0 8px rgba(0,180,216,0.5)' }}>LOCALIZAÇÃO</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                <span style={{ width:4, height:4, borderRadius:'50%', background:'#00ff88', display:'inline-block', boxShadow:'0 0 5px rgba(0,255,136,0.6)', animation:'pulse 2s infinite' }} />
                <span style={{ fontSize:9, letterSpacing:1, color:'#00ffcc', textShadow:'0 0 5px rgba(0,255,200,0.3)' }}>GOIÂNIA · GO · BR</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                <span style={{ fontSize:19, color:'#00B4D8', textShadow:'0 0 12px rgba(0,180,216,0.4)' }}>28°C</span>
                <span style={{ fontSize:7, color:'rgba(0,180,216,0.5)', textAlign:'right' }}>PARCIALMENTE<br/>NUBLADO</span>
              </div>
            </div>

            <div style={{ background:'rgba(0,25,52,0.85)', border:'0.5px solid rgba(0,180,216,0.3)', padding:10, flex:1, position:'relative' }}>
              <div style={{ fontSize:10, letterSpacing:3, color:'#00B4D8', opacity:0.75, marginBottom:6, textShadow:'0 0 8px rgba(0,180,216,0.5)' }}>DIAGNÓSTICO</div>
              {[
                {label:'PROFUNDIDADE', val:`${Math.min(100,Math.floor(messages.length*12))}%`, pct:Math.min(100,messages.length*12), color:'#00ffcc'},
                {label:'CONFIANÇA', val:'94%', pct:94, color:'#00ff88'},
                {label:'API LATÊNCIA', val:'231ms', pct:15, color:'#00ff88'},
              ].map(b=>(
                <div key={b.label} style={{ marginBottom:5 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontSize:10, letterSpacing:2, color:'rgba(0,180,216,0.45)', textShadow:'0 0 4px rgba(0,180,216,0.2)' }}>{b.label}</span>
                    <span style={{ fontSize:11, color:b.color, textShadow:`0 0 6px ${b.color}55` }}>{b.val}</span>
                  </div>
                  <div style={{ height:2, background:'rgba(0,180,216,0.08)', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${b.pct}%`, background:'linear-gradient(90deg,#00B4D8,#00ffcc)' }} />
                  </div>
                </div>
              ))}
              <div style={{ height:4 }} />
              {[
                {k:'MENSAGENS', v:messages.length},
                {k:'PROBLEMAS', v:problems.length, c:'#ff5555'},
                {k:'DURAÇÃO', v:elapsed},
              ].map(r=>(
                <div key={r.k} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:'0.5px solid rgba(0,180,216,0.07)' }}>
                  <span style={{ fontSize:10, letterSpacing:2, color:'rgba(0,180,216,0.4)' }}>{r.k}</span>
                  <span style={{ fontSize:11, color:(r as any).c||'#00ffcc', textShadow:'0 0 5px rgba(0,255,200,0.3)' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER */}
          <div style={{ flex:1, maxWidth:'55%', display:'flex', flexDirection:'column', gap:7 }}>
            <div style={{ background:'rgba(0,20,42,0.75)', border:'0.5px solid rgba(0,180,216,0.2)', padding:10, flex:1, display:'flex', flexDirection:'column', position:'relative' }}>
              <div style={{ fontSize:10, letterSpacing:3, color:'#00B4D8', opacity:0.75, marginBottom:6, textShadow:'0 0 8px rgba(0,180,216,0.5)' }}>INTERFACE DE DIAGNÓSTICO — SESSION #0041</div>

              <div ref={msgsRef} style={{ height:'calc(100vh - 36px - 36px - 34px - 26px - 20px)', overflowY:'auto', display:'flex', flexDirection:'column', gap:14, padding:4 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ paddingTop:13, position:'relative', alignSelf: msg.role==='user' ? 'flex-end' : 'flex-start', maxWidth:'90%' }}>
                    <span style={{ position:'absolute', top:0, fontSize:9, letterSpacing:2, opacity:0.6, color: msg.role==='assistant' ? '#FFB400' : '#00ff88', textShadow: msg.role==='assistant' ? '0 0 6px rgba(255,180,0,0.5)' : '0 0 6px rgba(0,255,136,0.4)', [msg.role==='user'?'right':'left']:0 }}>
                      {msg.role==='assistant' ? 'IMPETUS' : 'OPERADOR'}
                    </span>
                    <div style={{ padding:'7px 10px', fontSize:12, lineHeight:1.6, background: msg.role==='assistant' ? 'rgba(0,40,70,0.8)' : 'rgba(0,50,25,0.7)', borderLeft: msg.role==='assistant' ? '1.5px solid rgba(0,180,216,0.6)' : 'none', borderRight: msg.role==='user' ? '1.5px solid rgba(0,255,136,0.6)' : 'none', color: msg.role==='assistant' ? '#b0e8ff' : '#b0ffcc', textAlign: msg.role==='user' ? 'right' : 'left' }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ paddingTop:13, position:'relative', alignSelf:'flex-start' }}>
                    <span style={{ position:'absolute', top:0, left:0, fontSize:9, letterSpacing:2, color:'#FFB400', opacity:0.6 }}>IMPETUS</span>
                    <div style={{ padding:'7px 10px', fontSize:12, color:'rgba(0,180,216,0.5)', background:'rgba(0,40,70,0.5)', borderLeft:'1.5px solid rgba(0,180,216,0.3)' }}>IMPETUS processando análise...</div>
                  </div>
                )}
              </div>

              <canvas ref={waveRef} height={26} style={{ width:'100%', height:26, flexShrink:0, margin:'3px 0', display:'block' }} />

              <div style={{ height:34, display:'flex', alignItems:'center', gap:8, background:'rgba(0,18,36,0.9)', border:'0.5px solid rgba(0,180,216,0.22)', padding:'0 10px', flexShrink:0 }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:'#00ff88', display:'inline-block', boxShadow:'0 0 5px rgba(0,255,136,0.6)', animation:'pulse 1.5s infinite', flexShrink:0 }} />
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSend()}
                  placeholder='CANAL DE ENTRADA ATIVO — Digite sua mensagem...'
                  style={{ flex:1, background:'transparent', border:'none', color:'#00ffcc', fontSize:12, letterSpacing:1, outline:'none', fontFamily:'Courier New', cursor:'none' }} />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ width:200, flexShrink:0, display:'flex', flexDirection:'column', gap:7, transform:'translateZ(-16px) rotateY(1.5deg)', transformStyle:'preserve-3d' }}>

            <div style={{ background:'rgba(0,14,30,0.65)', border:'0.5px solid rgba(0,180,216,0.12)', padding:10, flexShrink:0, opacity:0.92, position:'relative' }}>
              <div style={{ fontSize:10, letterSpacing:3, color:'#00B4D8', opacity:0.75, marginBottom:6 }}>TIMESTAMP</div>
              <div style={{ fontSize:24, letterSpacing:3, color:'#00B4D8', textAlign:'center', fontWeight:'bold', textShadow:'0 0 18px rgba(0,180,216,0.5)' }}>{clock}</div>
              <div style={{ fontSize:7, letterSpacing:2, color:'rgba(0,180,216,0.45)', textAlign:'center', marginTop:2 }}>TER · 12.05.2026</div>
            </div>

            <div style={{ background:'rgba(0,14,30,0.65)', border:'0.5px solid rgba(0,180,216,0.12)', padding:10, flexShrink:0, opacity:0.92 }}>
              <div style={{ fontSize:10, letterSpacing:3, color:'#00B4D8', opacity:0.75, marginBottom:6 }}>EMPRESA ALVO</div>
              {[
                {k:'NOME', v:formData.empresa},
                {k:'SETOR', v:formData.setor},
                {k:'PORTE', v:'MICRO'},
                {k:'STATUS', v:'● ATIVO', c:'#00ff88'},
              ].map(r=>(
                <div key={r.k} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:'0.5px solid rgba(0,180,216,0.07)' }}>
                  <span style={{ fontSize:10, letterSpacing:2, color:'rgba(0,180,216,0.4)' }}>{r.k}</span>
                  <span style={{ fontSize:11, color:(r as any).c||'#00ffcc' }}>{r.v}</span>
                </div>
              ))}
            </div>

            <div style={{ background:'rgba(0,14,30,0.65)', border:'0.5px solid rgba(0,180,216,0.12)', padding:10, flex:1, opacity:0.92 }}>
              <div style={{ fontSize:10, letterSpacing:3, color:'#00B4D8', opacity:0.75, marginBottom:6 }}>
                PROBLEMAS <span style={{ color:'#ff5555', textShadow:'0 0 5px rgba(255,85,85,0.5)' }}>{problems.length}</span> ID
              </div>
              {problems.length === 0 ? (
                <div style={{ fontSize:8, color:'rgba(0,180,216,0.3)', letterSpacing:1 }}>Analisando conversa...</div>
              ) : problems.map((p,i)=>(
                <div key={i} style={{ padding:6, border:'0.5px solid rgba(0,180,216,0.12)', marginBottom:4, position:'relative', background:'rgba(0,12,26,0.8)' }}>
                  <span style={{ position:'absolute', top:4, right:4, fontSize:8, letterSpacing:1, padding:'1px 4px', border:'0.5px solid', color: p.impacto==='alto'?'#ff5555':'#ffaa00', borderColor: p.impacto==='alto'?'rgba(255,85,85,0.4)':'rgba(255,170,0,0.4)', background: p.impacto==='alto'?'rgba(255,85,85,0.1)':'rgba(255,170,0,0.08)' }}>
                    {p.impacto.toUpperCase()}
                  </span>
                  <div style={{ fontSize:10, letterSpacing:2, color:'#00B4D8', marginBottom:2, textShadow:'0 0 6px rgba(0,180,216,0.4)' }}>{p.area.toUpperCase()}</div>
                  <div style={{ fontSize:11, color:'#9fd8f0', lineHeight:1.4 }}>{p.problema.slice(0,50)}...</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      ) : (
        // ── REPORT ────────────────────────────────────────────────────
        <div style={{ flex:1, overflowY:'auto', padding:24, zIndex:10, position:'relative' }}>
          <div style={{ fontSize:7, letterSpacing:4, color:'#FFB400', textShadow:'0 0 10px rgba(255,180,0,0.5)', marginBottom:8 }}>RELATÓRIO DE DIAGNÓSTICO // {formData.empresa}</div>
          <div style={{ fontSize:7, letterSpacing:2, color:'rgba(0,180,216,0.5)', marginBottom:24 }}>{new Date().toLocaleDateString('pt-BR')} · {messages.length} mensagens · {problems.length} problemas identificados</div>
          {problems.map((p,i)=>(
            <div key={i} style={{ background:'rgba(0,20,42,0.8)', border:'0.5px solid rgba(0,180,216,0.2)', padding:16, marginBottom:12, position:'relative' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:9, letterSpacing:3, color:'#00B4D8', textShadow:'0 0 6px rgba(0,180,216,0.4)' }}>{p.area.toUpperCase()}</span>
                <span style={{ fontSize:6, padding:'2px 6px', border:'0.5px solid', color: p.impacto==='alto'?'#ff5555':'#ffaa00', borderColor: p.impacto==='alto'?'rgba(255,85,85,0.4)':'rgba(255,170,0,0.4)' }}>{p.impacto.toUpperCase()}</span>
              </div>
              <div style={{ fontSize:9, color:'#b0e8ff', marginBottom:6 }}>{p.problema}</div>
              <div style={{ fontSize:8, color:'rgba(0,180,216,0.6)', marginBottom:4 }}>◈ {p.solucao}</div>
              <div style={{ fontSize:7, color:'rgba(0,255,200,0.4)' }}>{p.ferramenta} · {p.tempo}</div>
            </div>
          ))}
          <button onClick={()=>{clearSession(); setPhase('form')}} style={{ background:'rgba(0,40,70,0.8)', border:'0.5px solid rgba(0,180,216,0.4)', color:'#00ffcc', fontSize:8, letterSpacing:3, padding:'10px 24px', cursor:'none', fontFamily:'Courier New', marginTop:16 }}>
            ◈ NOVO DIAGNÓSTICO
          </button>
        </div>
      )}

      {/* BOTBAR */}
      <div style={{ height:36, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', borderTop:'0.5px solid rgba(0,180,216,0.15)', background:'rgba(1,9,18,0.9)', flexShrink:0, zIndex:10, position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:7, letterSpacing:2, color:'rgba(0,180,216,0.3)' }}>IMPETUS</span>
          <span style={{ fontSize:11, color:'#00B4D8', textShadow:'0 0 6px rgba(0,180,216,0.4)' }}>v4.3</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:7, letterSpacing:2, color:'rgba(0,180,216,0.3)' }}>SESSÃO</span>
          <span style={{ fontSize:11, color:'#00B4D8' }}>#0041</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:7, letterSpacing:2, color:'rgba(0,180,216,0.3)' }}>TOKENS</span>
          <span style={{ fontSize:11, color:'#00B4D8' }}>{tokenCount.toLocaleString()}</span>
        </div>
        {phase === 'chat' && (
          <button onClick={handleEnd} style={{ fontSize:8, letterSpacing:2, color:'rgba(220,60,60,0.65)', border:'0.5px solid rgba(220,60,60,0.3)', padding:'3px 10px', background:'transparent', cursor:'none', fontFamily:'Courier New' }}>
            ■ ENCERRAR SESSÃO
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes breathe { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes impGlitch {
          0%,88%,100%{text-shadow:0 0 20px rgba(255,180,0,0.5);transform:none;color:#FFB400}
          89%{text-shadow:-2px 0 rgba(255,80,0,0.9),2px 0 rgba(255,220,0,0.9);transform:translate(-1px,0);color:#FFD000}
          91%{text-shadow:2px 0 rgba(255,80,0,0.9),-2px 0 rgba(255,220,0,0.9);transform:translate(1px,0);color:#FF8800}
          93%{text-shadow:none;transform:translate(0,1px);color:#FFB400}
          95%{text-shadow:-1px 0 rgba(0,200,255,0.6),1px 0 rgba(255,80,0,0.6),0 0 25px rgba(255,180,0,0.8);transform:none;color:#FFE040}
          97%{text-shadow:0 0 20px rgba(255,180,0,0.5);color:#FFB400;transform:none}
        }
        ::-webkit-scrollbar{width:2px}
        ::-webkit-scrollbar-thumb{background:rgba(0,180,216,0.3)}
        input::placeholder{color:rgba(0,180,216,0.35)}
      `}</style>
    </div>
  )
}
