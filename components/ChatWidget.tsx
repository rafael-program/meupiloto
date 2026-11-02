'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  MessageSquare, X, Send, Mic, MapPin, Phone, Shield, 
  Sparkles, Bot, Bike, Volume2, Plus, Share2, Check, AlertTriangle, Crown
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type Message = {
  id: string
  sender: 'user' | 'bot' | 'driver'
  text?: string
  audioUrl?: string
  isLocation?: boolean
  locationData?: { lat: number; lng: number; address: string }
  timestamp: string
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'ai' | 'driver' | 'support'>('ai')
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Olá! Sou o **PilotoIA** 🤖, o assistente oficial do **MeuPiloto!**. Como posso te ajudar na tua viagem ou entrega em Angola hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Handle Text Send
  const handleSendText = async () => {
    if (!inputText.trim()) return

    const userMsgText = inputText.trim()
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newMsg])
    setInputText('')

    // Generate AI response
    setTimeout(() => {
      generateResponse(userMsgText)
    }, 900)
  }

  // Automatic AI Response Logic
  const generateResponse = (prompt: string) => {
    const clean = prompt.toLowerCase()
    let responseText = ''

    if (clean.includes('preço') || clean.includes('quanto') || clean.includes('valor') || clean.includes('cotação') || clean.includes('mutamba') || clean.includes('talatona') || clean.includes('kilamba') || clean.includes('viana')) {
      responseText = `🛵 **Cotação Estimada em Kwanzas (AOA):**\n\n- Trajeto médio em Luanda: **1.200 Kz a 2.000 Kz**\n- Pagamento: Multicaixa Express (MCX) ou Cash.\n\nDesejas que procuremos um piloto próximo com capacete higienizado agora?`
    } else if (clean.includes('entrega') || clean.includes('encomenda') || clean.includes('pacote')) {
      responseText = `📦 **MeuPiloto Express - Entregas Rápidas**\n\nEntregamos volumes até 15kg em qualquer município de Luanda! Envia a tua localização ou endereço de recolha.`
    } else if (clean.includes('vip') || clean.includes('plano') || clean.includes('desconto')) {
      responseText = `👑 **MeuPiloto VIP Club**\n\nSabias que por apenas **2.000 Kz/mês** tens 10% de desconto em TODAS as tuas corridas e prioridade nas horas de ponta? [Clica aqui para assinar](/planos)`
    } else {
      responseText = `Entendido! Procuras uma moto para viagem rápida ou para enviar uma encomenda em Luanda? Podes partilhar a tua localização ou escrever o destino! 🇦🇴`
    }

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: activeTab === 'driver' ? 'driver' : 'bot',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, botMsg])
  }

  // Audio Recording (Browser MediaRecorder)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        const audioMsg: Message = {
          id: Date.now().toString(),
          sender: 'user',
          audioUrl: audioUrl,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, audioMsg])

        // Simulated reply
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: 'bot',
              text: '🎙️ *Áudio de voz recebido com sucesso!* A processar o pedido de corrida...',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ])
        }, 1200)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordTime(0)

      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      alert('Por favor autoriza o uso do microfone para enviar mensagens de voz no MeuPiloto!')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
      
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  // Send Current Location
  const handleSendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            isLocation: true,
            locationData: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Minha Posição Atual (Luanda, Angola)'
            },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
          setMessages(prev => [...prev, locMsg])
          
          setTimeout(() => {
            generateResponse('Localização recebida. Cotar corrida')
          }, 800)
        },
        () => {
          alert('Não foi possível obter a localização. Por favor ativa o GPS no teu dispositivo.')
        }
      )
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 transition-all transform hover:scale-105 border-2 border-amber-300/40"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
          </div>
          <span className="font-bold text-sm hidden md:inline">MeuPiloto Chat 🇦🇴</span>
        </button>
      )}

      {/* Main Chat Modal Box */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[380px] h-[580px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-slate-800/90 p-3.5 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  MeuPiloto<span className="text-amber-500">!</span> Chat
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                    Ao Vivo
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Atendimento & Mobilidade em Luanda</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => alert('🚨 ALERTA SOS ATIVADO! Localização enviada para a Central.')}
                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-semibold flex items-center gap-1 border border-red-500/20"
                title="Emergência SOS"
              >
                <Shield className="w-4 h-4" /> SOS
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex bg-slate-950/60 p-1 border-b border-slate-800 gap-1 text-xs">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-1.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'ai' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> PilotoIA
            </button>

            <button
              onClick={() => setActiveTab('driver')}
              className={`flex-1 py-1.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'driver' 
                  ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bike className="w-3.5 h-3.5" /> Motorista
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`flex-1 py-1.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'support' 
                  ? 'bg-purple-500 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" /> Planos VIP
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-amber-500/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-br-none shadow-md'
                      : 'bg-slate-800/90 text-slate-100 border border-slate-700/50 rounded-bl-none'
                  }`}
                >
                  {msg.audioUrl ? (
                    <div className="flex items-center gap-2 pr-2">
                      <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                      <audio controls src={msg.audioUrl} className="h-7 w-44" />
                    </div>
                  ) : msg.isLocation ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <MapPin className="w-4 h-4" /> Localização Partilhada
                      </div>
                      <p className="text-[11px] opacity-90">{msg.locationData?.address}</p>
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ 
                      __html: msg.text?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') || '' 
                    }} />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Recording Status Bar */}
          {isRecording && (
            <div className="bg-red-500/20 border-t border-red-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-red-400 animate-pulse">
              <span className="flex items-center gap-2">
                <Mic className="w-4 h-4" /> Gravando áudio... 0:0{recordTime}
              </span>
              <button 
                onClick={stopRecording} 
                className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-md font-bold"
              >
                Enviar Áudio
              </button>
            </div>
          )}

          {/* Input Controls */}
          <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={handleSendLocation}
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition"
              title="Partilhar GPS"
            >
              <MapPin className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
              placeholder="Escreve uma mensagem ou pede corrida..."
              className="flex-1 bg-slate-800/90 text-xs text-slate-100 placeholder-slate-500 px-3 py-2.5 rounded-xl border border-slate-700/60 focus:outline-none focus:border-amber-500 transition"
            />

            {!isRecording ? (
              <button
                onClick={startRecording}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
                title="Gravar áudio de voz"
              >
                <Mic className="w-4 h-4" />
              </button>
            ) : null}

            <button
              onClick={handleSendText}
              className="bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 p-2.5 rounded-xl font-bold shadow-md hover:opacity-90 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
