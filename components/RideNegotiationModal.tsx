'use client'

import React, { useState, useEffect } from 'react'
import { 
  Bike, CheckCircle2, XCircle, AlertTriangle, Clock, MapPin, 
  MessageSquare, Phone, Send, DollarSign, ChevronRight, ShieldCheck, User
} from 'lucide-react'

type Step = 'pending' | 'price_changed' | 'negotiation_chat' | 'en_route' | 'rejected'

type Props = {
  isOpen: boolean
  onClose: () => void
  riderName?: string
  plateNumber?: string
  origin?: string
  destination?: string
  initialPrice?: number
}

export default function RideNegotiationModal({
  isOpen,
  onClose,
  riderName = 'Mateus Sebastião',
  plateNumber = 'LD-48-92-AO',
  origin = 'Mutamba (Baixa de Luanda)',
  destination = 'Talatona (Jardim de Rosas)',
  initialPrice = 1500
}: Props) {
  const [step, setStep] = useState<Step>('pending')
  const [proposedPrice, setProposedPrice] = useState<number>(initialPrice + 300)
  const [changeReason, setChangeReason] = useState<string>('Trânsito intenso na avenida principal + Chuva fraca')
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'rider' | 'user'; text: string; time: string }>>([
    { sender: 'rider', text: 'Olá! Veja o novo preço proposto devido ao trânsito na via.', time: 'Agora' }
  ])
  const [inputChat, setInputChat] = useState('')

  // Countdown Timer (10 minutes = 600s)
  const [timeLeft, setTimeLeft] = useState<number>(600)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (step === 'en_route' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [step, timeLeft])

  if (!isOpen) return null

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Simulation Trigger: Rider Accept Original Price
  const handleRiderAcceptOriginal = () => {
    setStep('en_route')
    setTimeLeft(600)
  }

  // Simulation Trigger: Rider Change Price
  const handleRiderChangePrice = () => {
    setStep('price_changed')
  }

  // Simulation Trigger: Rider Reject
  const handleRiderReject = () => {
    setStep('rejected')
  }

  // User Accepts New Price
  const handleUserAcceptNewPrice = () => {
    setStep('en_route')
    setTimeLeft(600)
  }

  // User Sends Chat Msg
  const handleSendChatMsg = () => {
    if (!inputChat.trim()) return
    const newMsg = { sender: 'user' as const, text: inputChat, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setChatMessages(prev => [...prev, newMsg])
    setInputChat('')

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: 'rider', text: 'Entendido! Confirma se podemos fechar em ' + proposedPrice + ' Kz?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ])
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="bg-slate-800/90 p-4 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{riderName}</h3>
              <p className="text-[11px] text-slate-400">Moto: {plateNumber} • Verificado 🇦🇴</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        {/* STEP 1: PENDING RIDER CONFIRMATION */}
        {step === 'pending' && (
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 animate-bounce">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-lg">A aguardar confirmação do motoqueiro...</h4>
              <p className="text-xs text-slate-400">
                O motoqueiro <strong>{riderName}</strong> está a analisar o teu pedido de <strong>{initialPrice.toLocaleString()} Kz</strong>.
              </p>
            </div>

            {/* Ride Details Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Origem:</strong> {origin}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>Destino:</strong> {destination}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                <span>Valor Solicitado:</span>
                <span className="text-emerald-400">{initialPrice.toLocaleString()} Kz</span>
              </div>
            </div>

            {/* SIMULATION ACTION BUTTONS FOR TESTING DEMO */}
            <div className="pt-2 space-y-2 text-left">
              <p className="text-[10px] text-slate-500 uppercase font-bold text-center tracking-wider">
                ⚡ Simulação de Ação do Motoqueiro (Testes):
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleRiderAcceptOriginal}
                  className="py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-[11px] font-bold hover:bg-emerald-500/30 transition"
                >
                  ✓ Aceitar Preço
                </button>

                <button
                  onClick={handleRiderChangePrice}
                  className="py-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl text-[11px] font-bold hover:bg-amber-500/30 transition"
                >
                  ✏️ Alterar Preço
                </button>

                <button
                  onClick={handleRiderReject}
                  className="py-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl text-[11px] font-bold hover:bg-red-500/30 transition"
                >
                  ✕ Negar Pedido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PRICE CHANGED BY RIDER ALERT */}
        {step === 'price_changed' && (
          <div className="p-6 space-y-5">
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Motoqueiro alterou o preço da corrida!</span>
              </div>
              
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Preço Anterior:</span>
                  <span className="line-through text-slate-500">{initialPrice.toLocaleString()} Kz</span>
                </div>
                <div className="flex justify-between items-center font-bold text-sm">
                  <span className="text-slate-200">Novo Preço Proposto:</span>
                  <span className="text-amber-400">{proposedPrice.toLocaleString()} Kz</span>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-bold">Motivo Informado pelo Motoqueiro:</span>
                  <p className="text-slate-300 italic mt-0.5">"{changeReason}"</p>
                </div>
              </div>
            </div>

            <div className="text-center font-semibold text-xs text-slate-300">
              Queres continuar com o pedido por <strong className="text-amber-400">{proposedPrice.toLocaleString()} Kz</strong>?
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition"
              >
                ✕ Não, Cancelar
              </button>

              <button
                onClick={handleUserAcceptNewPrice}
                className="py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Sim, Aceitar Novo Preço
              </button>
            </div>

            <button
              onClick={() => setStep('negotiation_chat')}
              className="w-full py-2.5 bg-slate-950 border border-slate-800 text-amber-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition"
            >
              <MessageSquare className="w-4 h-4" /> Negociar no Chat Temporário
            </button>
          </div>
        )}

        {/* STEP 3: TEMPORARY NEGOTIATION CHAT */}
        {step === 'negotiation_chat' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="font-bold text-amber-400">Chat Temporário de Negociação</span>
              <button onClick={() => setStep('price_changed')} className="text-slate-400 hover:text-white">Voltar ao Alerta</button>
            </div>

            {/* Chat Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 h-52 overflow-y-auto space-y-2 text-xs">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-2.5 rounded-xl max-w-[80%] ${msg.sender === 'user' ? 'bg-amber-500 text-slate-950 font-medium' : 'bg-slate-800 text-slate-200'}`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-0.5">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMsg()}
                placeholder="Escreve uma contra-proposta..."
                className="flex-1 bg-slate-800 text-xs text-white px-3 py-2 rounded-xl border border-slate-700 outline-none"
              />
              <button
                onClick={handleSendChatMsg}
                className="bg-amber-500 text-slate-950 p-2 rounded-xl font-bold"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleUserAcceptNewPrice}
                className="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition"
              >
                Confirmar em {proposedPrice.toLocaleString()} Kz
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EN ROUTE COUNTDOWN TIMER */}
        {step === 'en_route' && (
          <div className="p-6 text-center space-y-6 animate-in fade-in duration-300">
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping"></div>
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex flex-col items-center justify-center text-slate-950 shadow-xl font-black">
                <span className="text-2xl">{formatTimer(timeLeft)}</span>
                <span className="text-[9px] uppercase tracking-widest opacity-80">minutos</span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-xl text-emerald-400">Motoqueiro a caminho!</h4>
              <p className="text-xs text-slate-400">
                O motoqueiro <strong>{riderName}</strong> aceitou a corrida e chega ao teu ponto em breve.
              </p>
            </div>

            {/* Rider Info Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm">{riderName}</h5>
                  <p className="text-slate-400 text-[11px]">Matrícula: {plateNumber}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => alert(`A ligar para ${riderName}...`)}
                  className="p-2.5 bg-slate-800 text-emerald-400 rounded-xl hover:bg-slate-700 transition"
                  title="Ligar"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => alert('Chat direto aberto!')}
                  className="p-2.5 bg-slate-800 text-amber-400 rounded-xl hover:bg-slate-700 transition"
                  title="Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition"
            >
              Concluir / Fechar Janela
            </button>
          </div>
        )}

        {/* STEP 5: REJECTED */}
        {step === 'rejected' && (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <XCircle className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg">Pedido não aceite</h4>
            <p className="text-xs text-slate-400">
              O motoqueiro não pôde aceitar a corrida neste momento. Desejas procurar outro motoqueiro?
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-amber-500 text-slate-950 font-bold text-xs rounded-2xl"
            >
              Procurar Outro Motoqueiro
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
