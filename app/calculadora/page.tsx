'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FormData {
  nomeEmpresa: string
  funcionarios: {
    vendas: number
    atendimento: number
    administrativo: number
    operacao: number
    financeiro: number
  }
  salarios: {
    vendas: number
    atendimento: number
    administrativo: number
    operacao: number
    financeiro: number
  }
  tarefasManuais: {
    whatsapp: boolean
    orcamento: boolean
    pedido: boolean
    estoque: boolean
    notaFiscal: boolean
    relatorios: boolean
    outros: boolean
  }
  ferramentasPagas: {
    crm: boolean
    erp: boolean
    planilhas: boolean
    outros: boolean
  }
  valoresFerramentas: {
    crm: number
    erp: number
    planilhas: number
    outros: number
  }
  faturamentoMensal: number
  atendimentosMes: number
  tempoOrcamento: number
}

interface ResultadoCalculo {
  custoFuncionarios: number
  custoAnualFuncionarios: number
  riscoTrabalhista: number
  economiaFerramentas: number
  ganhoAtendimento: number
  ganhoVendas: number
  economiaTotalAnual: number
  investimentoSugerido: number
  economiaLiquida: number
  roiMeses: number
}

export default function Calculadora() {
  const [formData, setFormData] = useState<FormData>({
    nomeEmpresa: '',
    funcionarios: {
      vendas: 0,
      atendimento: 0,
      administrativo: 0,
      operacao: 0,
      financeiro: 0
    },
    salarios: {
      vendas: 0,
      atendimento: 0,
      administrativo: 0,
      operacao: 0,
      financeiro: 0
    },
    tarefasManuais: {
      whatsapp: false,
      orcamento: false,
      pedido: false,
      estoque: false,
      notaFiscal: false,
      relatorios: false,
      outros: false
    },
    ferramentasPagas: {
      crm: false,
      erp: false,
      planilhas: false,
      outros: false
    },
    valoresFerramentas: {
      crm: 0,
      erp: 0,
      planilhas: 0,
      outros: 0
    },
    faturamentoMensal: 0,
    atendimentosMes: 0,
    tempoOrcamento: 0
  })

  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null)
  const [calculando, setCalculando] = useState(false)

  const handleInputChange = (category: string, field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev }
      if (category === 'funcionarios') {
        newData.funcionarios = { ...newData.funcionarios, [field]: value }
      } else if (category === 'salarios') {
        newData.salarios = { ...newData.salarios, [field]: value }
      } else if (category === 'tarefasManuais') {
        newData.tarefasManuais = { ...newData.tarefasManuais, [field]: value }
      } else if (category === 'ferramentasPagas') {
        newData.ferramentasPagas = { ...newData.ferramentasPagas, [field]: value }
      } else if (category === 'valoresFerramentas') {
        newData.valoresFerramentas = { ...newData.valoresFerramentas, [field]: value }
      }
      return newData
    })
  }

  const handleSimpleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calcularEconomia = () => {
    setCalculando(true)
    
    setTimeout(() => {
      // Cálculo do custo real CLT (151% do salário bruto)
      const totalFuncionarios = Object.values(formData.funcionarios).reduce((a, b) => a + b, 0)
      const custoMensalFuncionarios = Object.entries(formData.funcionarios).reduce((total, [area, qtd]) => {
        return total + (qtd * formData.salarios[area as keyof typeof formData.salarios] * 1.51)
      }, 0)
      
      const custoAnualFuncionarios = custoMensalFuncionarios * 12
      const riscoTrabalhista = custoAnualFuncionarios * 0.15
      
      // Economia em ferramentas
      const economiaFerramentas = Object.entries(formData.valoresFerramentas).reduce((total, [ferramenta, valor]) => {
        return total + (formData.ferramentasPagas[ferramenta as keyof typeof formData.ferramentasPagas] ? valor : 0)
      }, 0) * 12
      
      // Ganho em atendimento (valor hora ~R$50)
      const tarefasSelecionadas = Object.values(formData.tarefasManuais).filter(Boolean).length
      const tempoEconomizadoPorFuncionario = tarefasSelecionadas * 2 // 2 horas por tarefa
      const totalHorasEconomizadas = totalFuncionarios * tempoEconomizadoPorFuncionario * 12 // anual
      const ganhoAtendimento = totalHorasEconomizadas * 50 // R$50 por hora
      
      // Ganho em vendas (15-20% de aumento)
      const ganhoVendas = formData.faturamentoMensal * 0.175 * 12 // média 17.5%
      
      const economiaTotalAnual = riscoTrabalhista + economiaFerramentas + ganhoAtendimento + ganhoVendas
      const investimentoSugerido = economiaTotalAnual * 0.4
      const economiaLiquida = economiaTotalAnual - investimentoSugerido
      const roiMeses = Math.ceil(investimentoSugerido / (economiaTotalAnual / 12))
      
      setResultado({
        custoFuncionarios: custoMensalFuncionarios,
        custoAnualFuncionarios,
        riscoTrabalhista,
        economiaFerramentas,
        ganhoAtendimento,
        ganhoVendas,
        economiaTotalAnual,
        investimentoSugerido,
        economiaLiquida,
        roiMeses
      })
      
      setCalculando(false)
    }, 1500)
  }

  const gerarRelatorioPDF = () => {
    if (!resultado) return
    
    const relatorio = `
Relatório de Economia Impulso.AI
Empresa: ${formData.nomeEmpresa}

=== CUSTOS ATUAIS ===
Custo mensal com funcionários: R$ ${resultado.custoFuncionarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Custo anual com funcionários: R$ ${resultado.custoAnualFuncionarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Risco trabalhista anual: R$ ${resultado.riscoTrabalhista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

=== ECONOMIA COM IMPLANTAÇÃO DE IA ===
Economia em ferramentas: R$ ${resultado.economiaFerramentas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Ganho em atendimento: R$ ${resultado.ganhoAtendimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Ganho em vendas: R$ ${resultado.ganhoVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

=== RESULTADOS ===
Economia total anual: R$ ${resultado.economiaTotalAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Investimento sugerido Impulso.AI: R$ ${resultado.investimentoSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Economia líquida primeiro ano: R$ ${resultado.economiaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
ROI em meses: ${resultado.roiMeses}
    `
    
    const blob = new Blob([relatorio], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-economia-${formData.nomeEmpresa.replace(/\s+/g, '-').toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Home
          </Link>
          <h1 className="text-4xl font-bold gradient-text mb-4">Calculador de Economia Impulso.AI</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Descubra quanto sua empresa pode economizar com automação inteligente
          </p>
        </div>

        {/* Formulário */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Informações Básicas */}
          <div className="glass-effect rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Informações da Empresa</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={formData.nomeEmpresa}
                  onChange={(e) => handleSimpleChange('nomeEmpresa', e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  placeholder="Nome da sua empresa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Faturamento Mensal (R$)
                </label>
                <input
                  type="number"
                  value={formData.faturamentoMensal}
                  onChange={(e) => handleSimpleChange('faturamentoMensal', Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          {/* Funcionários por Área */}
          <div className="glass-effect rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Funcionários por Área</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(formData.funcionarios).map(([area, quantidade]) => (
                <div key={area} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300 capitalize">
                    {area === 'vendas' ? 'Vendas' : area === 'atendimento' ? 'Atendimento' : area === 'administrativo' ? 'Administrativo' : area === 'operacao' ? 'Operação' : 'Financeiro'}
                  </label>
                  <input
                    type="number"
                    value={quantidade}
                    onChange={(e) => handleInputChange('funcionarios', area, Number(e.target.value))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="0"
                  />
                  <input
                    type="number"
                    value={formData.salarios[area as keyof typeof formData.salarios]}
                    onChange={(e) => handleInputChange('salarios', area, Number(e.target.value))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="Salário médio (R$)"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tarefas Manuais */}
          <div className="glass-effect rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Tarefas Manuais e Repetitivas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(formData.tarefasManuais).map(([tarefa, selecionado]) => (
                <label key={tarefa} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selecionado}
                    onChange={(e) => handleInputChange('tarefasManuais', tarefa, e.target.checked)}
                    className="w-5 h-5 text-cyan-500 bg-white/10 border-white/20 rounded focus:ring-cyan-400 focus:ring-2"
                  />
                  <span className="text-gray-300">
                    {tarefa === 'whatsapp' ? 'Responder WhatsApp' : 
                     tarefa === 'orcamento' ? 'Gerar Orçamento' :
                     tarefa === 'pedido' ? 'Lançar Pedido' :
                     tarefa === 'estoque' ? 'Controlar Estoque' :
                     tarefa === 'notaFiscal' ? 'Emitir Nota Fiscal' :
                     tarefa === 'relatorios' ? 'Relatórios' : 'Outros'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Ferramentas Pagas */}
          <div className="glass-effect rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Ferramentas Pagas Atualmente</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData.ferramentasPagas).map(([ferramenta, utilizada]) => (
                <div key={ferramenta} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={utilizada}
                    onChange={(e) => handleInputChange('ferramentasPagas', ferramenta, e.target.checked)}
                    className="w-5 h-5 text-cyan-500 bg-white/10 border-white/20 rounded focus:ring-cyan-400 focus:ring-2"
                  />
                  <span className="text-gray-300 capitalize">
                    {ferramenta === 'crm' ? 'CRM' : ferramenta === 'erp' ? 'ERP' : ferramenta === 'planilhas' ? 'Planilhas' : 'Outros'}
                  </span>
                  {utilizada && (
                    <input
                      type="number"
                      value={formData.valoresFerramentas[ferramenta as keyof typeof formData.valoresFerramentas]}
                      onChange={(e) => handleInputChange('valoresFerramentas', ferramenta, Number(e.target.value))}
                      className="w-32 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                      placeholder="R$/mês"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Métricas de Vendas */}
          <div className="glass-effect rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Métricas de Vendas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Atendimentos/Orçamentos por Mês
                </label>
                <input
                  type="number"
                  value={formData.atendimentosMes}
                  onChange={(e) => handleSimpleChange('atendimentosMes', Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tempo Médio para Fechar Orçamento (horas)
                </label>
                <input
                  type="number"
                  value={formData.tempoOrcamento}
                  onChange={(e) => handleSimpleChange('tempoOrcamento', Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Botão de Cálculo */}
          <div className="text-center">
            <button
              onClick={calcularEconomia}
              disabled={calculando}
              className="button-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calculando ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculando...
                </span>
              ) : 'Calcular Economia'}
            </button>
          </div>

          {/* Resultados */}
          {resultado && (
            <div className="glass-effect rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">Resultados da Análise</h2>
                <button
                  onClick={gerarRelatorioPDF}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Gerar Relatório PDF
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Situação Atual vs Com IA */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-cyan-400">Situação Atual</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Custo mensal funcionários:</span>
                      <span className="text-white font-medium">R$ {resultado.custoFuncionarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Custo anual funcionários:</span>
                      <span className="text-white font-medium">R$ {resultado.custoAnualFuncionarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Risco trabalhista:</span>
                      <span className="text-white font-medium">R$ {resultado.riscoTrabalhista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-cyan-400">Com Impulso.AI</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Economia ferramentas:</span>
                      <span className="text-green-400 font-medium">R$ {resultado.economiaFerramentas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Ganho atendimento:</span>
                      <span className="text-green-400 font-medium">R$ {resultado.ganhoAtendimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Ganho vendas:</span>
                      <span className="text-green-400 font-medium">R$ {resultado.ganhoVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Resumo Final */}
              <div className="mt-8 p-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-400/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-gray-300 text-sm">Economia Total Anual</p>
                    <p className="text-2xl font-bold text-green-400">R$ {resultado.economiaTotalAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm">Investimento Sugerido</p>
                    <p className="text-2xl font-bold text-cyan-400">R$ {resultado.investimentoSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm">Economia Líquida (1º ano)</p>
                    <p className="text-2xl font-bold text-green-400">R$ {resultado.economiaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm">ROI em Meses</p>
                    <p className="text-2xl font-bold text-cyan-400">{resultado.roiMeses}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
