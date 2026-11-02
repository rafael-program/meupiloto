'use client'

import React, { useState } from 'react'
import { 
  Crown, Bike, ShieldCheck, Zap, CheckCircle2, ArrowRight, 
  Building2, CreditCard, Copy, Check, Sparkles, Star, ChevronLeft
} from 'lucide-react'
import Link from 'next/link'

export default function PlanosPage() {
  const [copiedIBAN, setCopiedIBAN] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Simulation Sliders
  const [drivers, setDrivers] = useState(500)
  const [passengers, setPassengers] = useState(2000)
  const [businesses, setBusinesses] = useState(50)

  const driverRevenue = drivers * 5000
  const passengerRevenue = passengers * 2000
  const businessRevenue = businesses * 30000
  const totalRevenue = driverRevenue + passengerRevenue + businessRevenue

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIBAN(true)
    setTimeout(() => setCopiedIBAN(false), 2000)
  }

  const handleSubscribe = (planName: string) => {
    setSelectedPlan(planName)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      
      {/* Header Banner */}
      <header className="bg-slate-900 border-b border-slate-800 py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-amber-500 transition text-sm font-semibold">
            <ChevronLeft className="w-5 h-5" /> Voltar ao MeuPiloto!
          </Link>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Subscrições em Kwanzas (AOA)
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-10">
        
        {/* Title Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Planos de Subscrição <span className="text-amber-500">MeuPiloto!</span> 🇦🇴
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Economiza em corridas diárias ou fatura com comissão ZERO como motorista parceiro em Angola.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* Card 1: Motorista Pro */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/40 transition shadow-xl">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                Para Moto-Taxistas
              </span>
              <h3 className="text-xl font-bold mt-4">Motorista Pro</h3>
              <div className="my-4">
                <span className="text-3xl font-black text-white">5.000 Kz</span>
                <span className="text-xs text-slate-400"> / mês</span>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Taxa ZERO por corrida! Mantém 100% dos teus ganhos diários sem pagar comissões adicionais.
              </p>
              
              <ul className="space-y-3 mb-8 text-xs">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Corridas ilimitadas no Chat</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Selo de Motorista Verificado</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Notificação prioritária no mapa GPS</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => handleSubscribe('Motorista Pro (5.000 Kz/mês)')}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm hover:from-amber-600 hover:to-amber-700 transition shadow-lg shadow-amber-500/20"
            >
              Adquirir Plano Motorista
            </button>
          </div>

          {/* Card 2: VIP Passageiro (Featured) */}
          <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 flex flex-col justify-between relative shadow-2xl transform md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-extrabold text-[11px] px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
              Mais Popular em Luanda
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Para Passageiros
              </span>
              <h3 className="text-xl font-bold mt-4 flex items-center gap-2">
                MeuPiloto VIP <Crown className="w-5 h-5 text-amber-400" />
              </h3>
              <div className="my-4">
                <span className="text-3xl font-black text-white">2.000 Kz</span>
                <span className="text-xs text-slate-400"> / mês</span>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Ideal para quem se desloca diariamente. Poupa dinheiro em cada corrida com atendimento VIP.
              </p>

              <ul className="space-y-3 mb-8 text-xs">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-emerald-300">10% de desconto em todas as corridas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Prioridade de atendimento no horário de pico</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Suporte exclusivo no PilotoIA Chat 24/7</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => handleSubscribe('MeuPiloto VIP (2.000 Kz/mês)')}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-bold text-sm hover:from-emerald-600 hover:to-emerald-700 transition shadow-lg shadow-emerald-500/20"
            >
              Assinar VIP Passageiro
            </button>
          </div>

          {/* Card 3: Business / Empresas */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-purple-500/40 transition shadow-xl">
            <div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                Para Lojas & Restaurantes
              </span>
              <h3 className="text-xl font-bold mt-4">MeuPiloto Business</h3>
              <div className="my-4">
                <span className="text-3xl font-black text-white">30.000 Kz</span>
                <span className="text-xs text-slate-400"> / mês</span>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Gerencia frotas dedicadas de estafetas para entregar encomendas aos teus clientes em Luanda.
              </p>

              <ul className="space-y-3 mb-8 text-xs">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Painel de Entregas Multi-Chat</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Estafetas dedicados com caixa térmica</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Faturação mensal com NIF fiscal</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => handleSubscribe('MeuPiloto Business (30.000 Kz/mês)')}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-sm hover:from-purple-600 hover:to-purple-700 transition shadow-lg shadow-purple-500/20"
            >
              Assinar Plano Empresa
            </button>
          </div>

        </div>

        {/* Revenue Projection Tool */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-16 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Simulador de Receita Recorrente <Sparkles className="w-5 h-5 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Estimativa de faturação mensal do ecossistema MeuPiloto! em Angola.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-6">
              
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span>Motoristas Pro (5.000 Kz/mês):</span>
                  <span className="text-amber-400 font-bold">{drivers} motoristas</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="5000" 
                  step="50"
                  value={drivers}
                  onChange={(e) => setDrivers(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span>Passageiros VIP (2.000 Kz/mês):</span>
                  <span className="text-emerald-400 font-bold">{passengers} passageiros</span>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="20000" 
                  step="100"
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span>Empresas / Restaurantes (30.000 Kz/mês):</span>
                  <span className="text-purple-400 font-bold">{businesses} empresas</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="500" 
                  step="5"
                  value={businesses}
                  onChange={(e) => setBusinesses(Number(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-amber-500/30 text-center space-y-3">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                Receita Mensal Estimada
              </span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                {totalRevenue.toLocaleString()} Kz
              </div>
              <p className="text-[11px] text-slate-400">
                Faturação mensal limpa e previsível em Angola 🇦🇴
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Payment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-slate-100 space-y-5 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base">Ativar Subscrição em Kwanzas</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-xs text-amber-300">
              Plano Selecionado: <strong>{selectedPlan}</strong>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-300">Formas de Pagamento em Angola:</h4>
              
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-semibold">1. Multicaixa Express (MCX) / Referência</span>
                <p className="text-[11px] text-slate-300">Envia o teu número para receberes o pedido no telemóvel.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold">2. Transferência IBAN Direta:</span>
                <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg font-mono text-[11px]">
                  <span>AO06.0040.0000.1234.5678.1018.9</span>
                  <button 
                    onClick={() => copyToClipboard('AO06004000001234567810189')} 
                    className="text-amber-400 hover:underline flex items-center gap-1 font-sans"
                  >
                    {copiedIBAN ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedIBAN ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                alert('Obrigado! O teu comprovativo de pagamento foi submetido. A equipa do Rafael Domingos vai ativar o teu plano em instantes!')
                setModalOpen(false)
              }}
              className="w-full py-3 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition"
            >
              Confirmar Pagamento & Enviar Comprovativo
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
