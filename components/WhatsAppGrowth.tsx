'use client'

import React, { useState } from 'react'
import { Share2, QrCode, Copy, Check, Sparkles, PhoneCall, Gift, Zap } from 'lucide-react'

export default function WhatsAppGrowth() {
  const [copied, setCopied] = useState(false)
  const referralLink = 'https://meupiloto.vercel.app/?ref=rafael_domingos'

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent('Olá MeuPiloto! 🛵 Quero pedir uma moto para uma corrida rápida em Luanda. Como funciona?')
    window.open(`https://wa.me/244900000000?text=${message}`, '_blank')
  }

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 my-10 text-slate-100 shadow-2xl">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Crescimento & Viralização em Angola
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Pedir pelo WhatsApp & Indicar Amigos 🇦🇴
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Ganha bónus em Kwanzas e chama corridas diretamente no WhatsApp sem gastar pacotes adicionais.
          </p>
        </div>

        {/* 2 Column Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: WhatsApp Bot Direct */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-500/30 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <PhoneCall className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">MeuPiloto no WhatsApp Zap</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                90% dos angolanos têm pacotes sociais de WhatsApp. Clica para simular um pedido direto no WhatsApp Business API do MeuPiloto!
              </p>
            </div>

            <button
              onClick={handleOpenWhatsApp}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
            >
              <PhoneCall className="w-4 h-4" /> Simular Pedido via WhatsApp Zap
            </button>
          </div>

          {/* Card 2: Referral Link */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-amber-500/30 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Indique e Ganhe 500 Kz</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Partilha o teu link de indicação exclusivo com amigos. Quando eles fizerem a 1ª corrida, ambos ganham 500 Kz na carteira!
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 text-xs">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="bg-transparent text-slate-300 text-xs flex-1 outline-none font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
