import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { mensagem, empresa, setor, historico, tipo, problemas } = await request.json()

    if (tipo === 'resumo') {
      // Gerar resumo executivo
      const prompt = `Gere um resumo executivo profissional para o diagnóstico da empresa ${empresa} do setor ${setor}, baseado nos seguintes problemas identificados:

${problemas.map((p: any, i: number) => 
  `${i + 1}. ${p.problema} (Área: ${p.area}, Impacto: ${p.impacto})\n   Solução: ${p.solucao}\n   Ferramenta: ${p.ferramenta}`
).join('\n\n')}

O resumo deve ter 2-3 parágrafos, ser profissional e focar no impacto de negócio e nos próximos passos recomendados.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      })

      const data = await response.json()
      return NextResponse.json({ resposta: data.content[0].text })
    }

    // Chat normal
    const systemPrompt = `Você é Ana, analista sênior de implementação de AI da Impulso.AI. Está conduzindo um diagnóstico empresarial com ${empresa} no setor ${setor}. Seu objetivo é identificar onde a inteligência artificial pode gerar resultado real neste negócio.

Conduza uma conversa natural e profissional em português brasileiro. Faça perguntas abertas e aprofunde nas respostas. Identifique:
1. Tarefas manuais e repetitivas que consomem tempo
2. Processos que travam o crescimento
3. Custos operacionais desnecessários
4. O que o dono mais quer que mude

Quando identificar um problema claro, inclua no final da sua resposta uma linha com este formato exato (invisível para o usuário):
[PROBLEMA: area=NOME_DA_AREA|problema=DESCRICAO_CLARA|solucao=SOLUCAO_AI_ESPECIFICA|ferramenta=FERRAMENTA_SUGERIDA|impacto=alto/medio/baixo|tempo=TEMPO_IMPLEMENTACAO]

Exemplos de soluções específicas:
- Atendimento lento: Agente WhatsApp 24h com Claude API + Twilio
- Orçamento manual: Gerador automático de orçamento com Claude API
- Sem CRM: CRM próprio com AI integrada no Next.js + Supabase
- Estoque sem controle: Agente de controle e alertas com n8n
- Marketing sem automação: Agente gerador de conteúdo com Claude API + Make

Histórico recente da conversa:
${historico || 'Nenhuma mensagem anterior'}

Responda à última mensagem do usuário de forma natural e profissional.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: mensagem
          }
        ]
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Erro na API Claude')
    }

    return NextResponse.json({ resposta: data.content[0].text })

  } catch (error) {
    console.error('Erro na API Claude:', error)
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 }
    )
  }
}
