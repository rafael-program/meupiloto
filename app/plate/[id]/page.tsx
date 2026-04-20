'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase/client'
import { 
  ArrowLeft, Phone, User, XCircle, Navigation, Bike, Shield, 
  Wifi, Clock, CheckCircle, Star, Heart, Menu, MapPin, 
  DollarSign, Calendar, Send, CreditCard, AlertCircle, Sun, Moon, 
  ClipboardList
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Importar componentes do mapa dinamicamente
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { 
    ssr: false,
    loading: () => (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <p style={{ color: '#6b7280' }}>Carregando mapa...</p>
      </div>
    )
  }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

export default function PlateRiders() {
  const { id } = useParams()
  const router = useRouter()
  const [plate, setPlate] = useState<any>(null)
  const [riders, setRiders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedRider, setSelectedRider] = useState<any>(null)
  const [animationStep, setAnimationStep] = useState(0)
  const [showCallButtons, setShowCallButtons] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [formData, setFormData] = useState(() => {
    const hour = new Date().getHours()
    const isNight = hour >= 22 || hour < 6
    const defaultPrice = isNight ? 500 : 300
    return {
      customerName: '',
      customerPhone: '',
      pickupAddress: '',
      dropoffAddress: '',
      price: defaultPrice
    }
  })
  const [showWaitingModal, setShowWaitingModal] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(900)
  const [orderStatus, setOrderStatus] = useState<string>('pending')
  const [showMap, setShowMap] = useState(false)
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showThankYouModal, setShowThankYouModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    loadPlateAndRiders()
  }, [id])

  // Carregar pedido ativo do localStorage ao iniciar
  useEffect(() => {
    const savedOrderId = localStorage.getItem('active_order_id')
    const savedOrderStatus = localStorage.getItem('active_order_status')
    const savedRiderName = localStorage.getItem('active_order_rider')
    const savedCustomerLocation = localStorage.getItem('customer_location')
    const savedPickupAddress = localStorage.getItem('pickup_address')
    const savedDropoffAddress = localStorage.getItem('dropoff_address')
    const savedPrice = localStorage.getItem('order_price')
    const savedCustomerName = localStorage.getItem('customer_name')
    const savedCustomerPhone = localStorage.getItem('customer_phone')
    const savedExpiresAt = localStorage.getItem('order_expires_at')
    const savedTimeLeft = localStorage.getItem('order_time_left')
    
    if (savedOrderId && savedOrderStatus === 'accepted') {
      setOrderId(savedOrderId)
      setOrderStatus('accepted')
      setShowMap(true)
      if (savedRiderName) setSelectedRider({ name: savedRiderName })
      if (savedCustomerLocation) setCustomerLocation(JSON.parse(savedCustomerLocation))
      if (savedPickupAddress) setFormData(prev => ({ ...prev, pickupAddress: savedPickupAddress }))
      if (savedDropoffAddress) setFormData(prev => ({ ...prev, dropoffAddress: savedDropoffAddress }))
      if (savedPrice) setFormData(prev => ({ ...prev, price: parseInt(savedPrice) }))
      if (savedCustomerName) setFormData(prev => ({ ...prev, customerName: savedCustomerName }))
      if (savedCustomerPhone) setFormData(prev => ({ ...prev, customerPhone: savedCustomerPhone }))
    } else if (savedOrderId && savedOrderStatus === 'pending') {
      setOrderId(savedOrderId)
      setOrderStatus('pending')
      setShowWaitingModal(true)
      if (savedRiderName) setSelectedRider({ name: savedRiderName })
      
      if (savedExpiresAt) {
        const expires = new Date(savedExpiresAt)
        const now = new Date()
        const diffSeconds = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000))
        setTimeLeft(diffSeconds)
        setExpiresAt(expires)
      } else if (savedTimeLeft) {
        setTimeLeft(parseInt(savedTimeLeft))
      }
    } else if (savedOrderId && savedOrderStatus === 'completed') {
      setShowThankYouModal(true)
    }
  }, [])

  // Salvar estado no localStorage quando mudar
  useEffect(() => {
    if (orderId) {
      localStorage.setItem('active_order_id', orderId)
      localStorage.setItem('active_order_status', orderStatus)
      if (selectedRider?.name) localStorage.setItem('active_order_rider', selectedRider.name)
      if (customerLocation) localStorage.setItem('customer_location', JSON.stringify(customerLocation))
      if (formData.pickupAddress) localStorage.setItem('pickup_address', formData.pickupAddress)
      if (formData.dropoffAddress) localStorage.setItem('dropoff_address', formData.dropoffAddress)
      if (formData.price) localStorage.setItem('order_price', formData.price.toString())
      if (formData.customerName) localStorage.setItem('customer_name', formData.customerName)
      if (formData.customerPhone) localStorage.setItem('customer_phone', formData.customerPhone)
      if (expiresAt) localStorage.setItem('order_expires_at', expiresAt.toISOString())
      localStorage.setItem('order_time_left', timeLeft.toString())
    } else {
      localStorage.removeItem('active_order_id')
      localStorage.removeItem('active_order_status')
      localStorage.removeItem('active_order_rider')
      localStorage.removeItem('order_expires_at')
      localStorage.removeItem('order_time_left')
    }
  }, [orderId, orderStatus, selectedRider, customerLocation, formData, expiresAt, timeLeft])

  // Timer com persistência
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    
    if (showWaitingModal && timeLeft > 0 && orderStatus === 'pending') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1
          if (newTime <= 0) {
            if (timer) clearInterval(timer)
            if (orderStatus === 'pending') {
              alert('⏰ Tempo esgotado! O motoqueiro não respondeu a tempo.')
              setShowWaitingModal(false)
              setOrderId(null)
              localStorage.removeItem('active_order_id')
              localStorage.removeItem('active_order_status')
            }
            return 0
          }
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [showWaitingModal, timeLeft, orderStatus])

  // SUBSCRIÇÃO EM TEMPO REAL
  useEffect(() => {
    if (!orderId) return

    console.log('📡 Iniciando subscription para pedido:', orderId)

    const fetchCurrentOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('status, rider_location, expires_at')
        .eq('id', orderId)
        .single()
      
      if (data) {
        console.log('📦 Status atual do pedido:', data.status)
        if (data.expires_at && !expiresAt) {
          const expires = new Date(data.expires_at)
          const now = new Date()
          const diffSeconds = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000))
          setTimeLeft(diffSeconds)
          setExpiresAt(expires)
        }
        if (data.status === 'accepted' && orderStatus !== 'accepted') {
          setOrderStatus('accepted')
          setShowWaitingModal(false)
          setShowMap(true)
          if (data.rider_location) {
            try {
              const location = JSON.parse(data.rider_location)
              setRiderLocation(location)
            } catch (e) {}
          }
        } else if (data.status === 'completed' && orderStatus !== 'completed') {
          setOrderStatus('completed')
          setShowMap(false)
          setShowThankYouModal(true)
        }
      }
    }
    
    fetchCurrentOrder()

    const subscription = supabase
      .channel(`order_updates_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          const newStatus = payload.new.status
          const newRiderLocation = payload.new.rider_location
          
          console.log('🔄 Pedido atualizado:', { 
            id: orderId, 
            novoStatus: newStatus, 
            statusAnterior: orderStatus 
          })
          
          setOrderStatus(newStatus)
          localStorage.setItem('active_order_status', newStatus)
          
          if (newStatus === 'accepted') {
            console.log('✅ Pedido ACEITO! Fechando modal e abrindo mapa...')
            setShowWaitingModal(false)
            setShowMap(true)
            
            if (newRiderLocation) {
              try {
                const location = JSON.parse(newRiderLocation)
                setRiderLocation(location)
              } catch (e) {
                console.error('Erro ao parsear localização:', e)
              }
            }
          } else if (newStatus === 'cancelled') {
            console.log('❌ Pedido CANCELADO!')
            setShowWaitingModal(false)
            alert('❌ O pedido foi cancelado pelo motoqueiro.')
            setOrderId(null)
            localStorage.removeItem('active_order_id')
            localStorage.removeItem('active_order_status')
          } else if (newStatus === 'completed') {
            console.log('🎉 Pedido CONCLUÍDO! Mostrando modal de agradecimento...')
            setShowMap(false)
            setShowThankYouModal(true)
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Status da subscription:', status)
      })

    return () => {
      console.log('📡 Removendo subscription para pedido:', orderId)
      subscription.unsubscribe()
    }
  }, [orderId, orderStatus, expiresAt])

  // Subscription para localização do motoqueiro
  useEffect(() => {
    if (!orderId || !showMap) return

    console.log('🗺️ Iniciando subscription de localização para pedido:', orderId)

    const subscription = supabase
      .channel(`rider_location_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          if (payload.new.rider_location) {
            try {
              const location = JSON.parse(payload.new.rider_location)
              console.log('📍 Localização do motoqueiro atualizada:', location)
              setRiderLocation(location)
            } catch (e) {
              console.error('Erro ao parsear localização:', e)
            }
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [orderId, showMap])

  // ✅ ANIMAÇÃO DO MAPA - MOVIDA PARA FORA DO CONDICIONAL
 // ✅ ANIMAÇÃO DO MAPA - 5 MINUTOS (300 SEGUNDOS)
useEffect(() => {
  if (showMap && selectedRider) {
    // Total: 300 segundos (5 minutos)
    // 100 passos de 1% cada, com intervalo de 3 segundos
    const interval = setInterval(() => {
      setAnimationStep(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 1
      })
    }, 3000) // 3 segundos entre cada incremento
    
    // Mostrar botão de ligar após 10 segundos
    const timer = setTimeout(() => setShowCallButtons(true), 10000)
    
    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }
}, [showMap, selectedRider])

  const handleSubmitRating = async () => {
    if (rating > 0 && orderId) {
      await supabase
        .from('orders')
        .update({ customer_rating: rating })
        .eq('id', orderId)
      
      localStorage.removeItem('active_order_id')
      localStorage.removeItem('active_order_status')
      localStorage.removeItem('active_order_rider')
      localStorage.removeItem('order_expires_at')
      localStorage.removeItem('order_time_left')
      
      setShowThankYouModal(false)
      router.push('/')
    }
  }

  const loadPlateAndRiders = async () => {
    const { data: plateData } = await supabase
      .from('plates')
      .select('*')
      .eq('id', id)
      .single()

    const { data: ridersData } = await supabase
      .from('riders')
      .select('*')
      .eq('plate_id', id)
      .eq('status', 'active')
      .order('is_online', { ascending: false })

    setPlate(plateData)
    setRiders(ridersData || [])
    setLoading(false)
  }

  const handleOpenForm = (rider: any) => {
    setSelectedRider(rider)
    setShowForm(true)
  }

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'))
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRider) return

    let customerLat = null
    let customerLng = null
    try {
      const position = await getCurrentLocation()
      customerLat = position.coords.latitude
      customerLng = position.coords.longitude
      setCustomerLocation({ lat: customerLat, lng: customerLng })
    } catch (error) {
      console.log('Não foi possível obter localização:', error)
    }

    const expiresAtDate = new Date()
    expiresAtDate.setMinutes(expiresAtDate.getMinutes() + 15)
    setExpiresAt(expiresAtDate)

    const { data: newOrder, error } = await supabase
      .from('orders')
      .insert({
        rider_id: selectedRider.id,
        plate_id: id as string,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        pickup_address: formData.pickupAddress,
        dropoff_address: formData.dropoffAddress,
        price: formData.price,
        status: 'pending',
        expires_at: expiresAtDate.toISOString(),
        notification_sent: false,
        created_at: new Date().toISOString(),
        customer_lat: customerLat,
        customer_lng: customerLng
      })
      .select()
      .single()

    if (error) {
      console.error('Erro detalhado:', error)
      alert('Erro ao criar pedido: ' + error.message)
    } else {
      console.log('✅ Pedido criado com ID:', newOrder.id)
      setOrderId(newOrder.id)
      setOrderStatus('pending')
      setTimeLeft(900)
      setShowForm(false)
      setShowWaitingModal(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const styles: Record<string, React.CSSProperties> = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #f9fafb 0%, #fff5ed 100%)' },
    header: { backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f0f0f0', position: 'sticky' as const, top: 0, zIndex: 10 },
    card: { backgroundColor: 'white', borderRadius: isMobile ? '16px' : '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', overflow: 'hidden', transition: 'all 0.3s ease', marginBottom: '16px' },
    buttonPrimary: { background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', padding: isMobile ? '10px 16px' : '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease', fontSize: isMobile ? '13px' : '14px' },
    buttonDisabled: { background: '#d1d5db', color: '#6b7280', padding: isMobile ? '10px 16px' : '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', fontSize: isMobile ? '13px' : '14px' },
    modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' },
    modalContent: { backgroundColor: 'white', borderRadius: '24px', maxWidth: '480px', width: '90%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
    waitingModalContent: { 
      backgroundColor: 'white', 
      borderRadius: '24px', 
      maxWidth: '400px', 
      width: '90%', 
      textAlign: 'center' as const, 
      padding: isMobile ? '24px' : '32px', 
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)' 
    },
    thankYouModalContent: {
      backgroundColor: 'white',
      borderRadius: '24px',
      maxWidth: '450px',
      width: '90%',
      textAlign: 'center' as const,
      padding: isMobile ? '24px' : '40px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
    },
    input: { width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: isMobile ? '16px' : '14px', transition: 'all 0.3s ease', WebkitAppearance: 'none' as const },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#374151' }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ animation: 'spin 1s linear infinite', width: '48px', height: '48px', border: '3px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }}></div>
            <p style={{ color: '#6b7280' }}>Carregando motoqueiros...</p>
          </div>
        </div>
      </div>
    )
  }

  // Modal de Agradecimento
  if (showThankYouModal) {
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.thankYouModalContent}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ width: isMobile ? '60px' : '80px', height: isMobile ? '60px' : '80px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={isMobile ? 36 : 48} color="white" />
            </div>
            <h2 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>Obrigado! 🎉</h2>
            <p style={{ color: '#6b7280', marginBottom: '8px', fontSize: isMobile ? '14px' : '16px' }}>
              Sua corrida foi concluída com sucesso!
            </p>
            <p style={{ color: '#6b7280', fontSize: isMobile ? '12px' : '14px' }}>
              Esperamos que tenha tido uma ótima experiência com {selectedRider?.name}
            </p>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '8px' }}>
            <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#374151' }}>
              Avalie sua experiência:
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '4px' : '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    transition: 'transform 0.2s'
                  }}
                >
                  <Star
                    size={isMobile ? 28 : 32}
                    fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'}
                    color="#f59e0b"
                    style={{
                      transform: (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)',
                      transition: 'transform 0.2s'
                    }}
                  />
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmitRating}
              disabled={rating === 0}
              style={{
                width: '100%',
                background: rating > 0 ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : '#e5e7eb',
                color: rating > 0 ? 'white' : '#9ca3af',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold',
                cursor: rating > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                marginBottom: '12px',
                fontSize: isMobile ? '14px' : '16px'
              }}
            >
              {rating > 0 ? `Avaliar (${rating} estrela${rating > 1 ? 's' : ''})` : 'Selecione uma avaliação'}
            </button>

            <button
              onClick={() => router.push('/')}
              style={{
                width: '100%',
                background: 'none',
                color: '#6b7280',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: isMobile ? '14px' : '16px'
              }}
            >
              Ir para página inicial
            </button>
          </div>
        </div>
      </div>
    )
  }

// Mapa / Acompanhamento Animado
if (showMap && selectedRider) {
  const isAlmostThere = animationStep >= 80
  
  // Tempo estimado baseado na animação (5 minutos = 300 segundos)
  // 100% = 300 segundos, então 1% = 3 segundos
  const estimatedSeconds = (100 - animationStep) * 3
  const estimatedMinutes = Math.floor(estimatedSeconds / 60)
  const estimatedRemainingSeconds = estimatedSeconds % 60
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '12px 16px' : '16px 24px' }}>
          <button onClick={() => {
            setShowMap(false)
            setOrderId(null)
            setAnimationStep(0)
            setShowCallButtons(false)
            localStorage.removeItem('active_order_id')
            localStorage.removeItem('active_order_status')
            router.push('/')
          }} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: isMobile ? '12px' : '16px', fontSize: isMobile ? '13px' : '14px' }}>
            <ArrowLeft size={18} />
            Voltar ao Início
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '12px', flexWrap: 'wrap' }}>
            <div style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bike size={isMobile ? 20 : 24} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold', color: '#111827' }}>Acompanhamento da Corrida</h1>
              <p style={{ fontSize: isMobile ? '12px' : '14px', color: '#6b7280', marginTop: '4px' }}>{selectedRider?.name} está vindo até você</p>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: '600px', margin: '0 auto' }}>
        {/* Card de Acompanhamento Animado */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '32px', 
          overflow: 'hidden', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, #fff, #fef3c7)'
        }}>
          
          {/* Cabeçalho com informações do motoqueiro */}
          <div style={{ 
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)', 
            padding: isMobile ? '20px' : '24px', 
            textAlign: 'center', 
            color: 'white' 
          }}>
            <div style={{ 
              width: isMobile ? '80px' : '100px', 
              height: isMobile ? '80px' : '100px', 
              margin: '0 auto 12px',
              position: 'relative'
            }}>
              {selectedRider?.photo_url ? (
                <img src={selectedRider.photo_url} alt={selectedRider.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid white' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={isMobile ? 40 : 50} color="white" />
                </div>
              )}
              <div style={{ 
                position: 'absolute', 
                bottom: 0, 
                right: 0, 
                background: '#10b981', 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                border: '2px solid white' 
              }} />
            </div>
            <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold' }}>{selectedRider.name}</h2>
            <p style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Placa: {plate?.plate_number}</p>
          </div>
          
          {/* Área de Animação */}
          <div style={{ padding: isMobile ? '24px' : '32px', textAlign: 'center' }}>
            
            {/* Avatar Animado do Motoqueiro */}
            <div style={{ 
              position: 'relative', 
              height: isMobile ? '200px' : '250px',
              marginBottom: '20px'
            }}>
              {/* Fundo da estrada */}
              <div style={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                height: '4px', 
                background: '#e5e7eb',
                borderRadius: '2px'
              }}>
                <div style={{ 
                  width: `${animationStep}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                  borderRadius: '2px',
                  transition: 'width 3s linear'
                }} />
              </div>
              
              {/* Motoqueiro Animado */}
              <div style={{ 
                position: 'absolute',
                bottom: -20,
                left: `${animationStep}%`,
                transform: 'translateX(-50%)',
                transition: 'left 3s linear'
              }}>
                <div style={{ 
                  animation: animationStep < 100 ? 'bounce 0.5s ease infinite' : 'none',
                  transform: animationStep >= 80 ? 'scaleX(-1)' : 'scaleX(1)'
                }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)', 
                    width: isMobile ? '60px' : '70px', 
                    height: isMobile ? '60px' : '70px', 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}>
                    <Bike size={isMobile ? 32 : 38} color="white" />
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '8px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#f59e0b',
                    background: 'white',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    display: 'inline-block',
                    whiteSpace: 'nowrap'
                  }}>
                    {isAlmostThere ? 'Quase lá! 🏍️' : `${Math.floor(animationStep)}% do caminho`}
                  </div>
                </div>
              </div>
              
              {/* Marcador do Cliente */}
              <div style={{ 
                position: 'absolute',
                bottom: -20,
                right: 0,
                transform: 'translateX(50%)'
              }}>
                <div style={{ 
                  background: '#3b82f6', 
                  width: isMobile ? '40px' : '48px', 
                  height: isMobile ? '40px' : '48px', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  <MapPin size={isMobile ? 20 : 24} color="white" />
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '8px',
                  fontSize: '10px',
                  fontWeight: 500,
                  color: '#3b82f6'
                }}>
                  Você está aqui
                </div>
              </div>
            </div>
            
            {/* Timer de chegada estimada */}
            <div style={{ 
              marginBottom: '16px',
              padding: '8px 12px',
              background: '#f0fdf4',
              borderRadius: '20px',
              display: 'inline-block'
            }}>
              <p style={{ fontSize: '12px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} />
                {animationStep >= 100 ? (
                  'Chegada iminente!'
                ) : isAlmostThere ? (
                  'Chegando em menos de 1 minuto...'
                ) : (
                  `Tempo estimado: ${estimatedMinutes} minuto${estimatedMinutes !== 1 ? 's' : ''}${estimatedRemainingSeconds > 0 ? ` e ${estimatedRemainingSeconds} segundo${estimatedRemainingSeconds !== 1 ? 's' : ''}` : ''}`
                )}
              </p>
            </div>
            
            {/* Mensagem de Status */}
            <div style={{ 
              marginTop: '10px',
              padding: '16px',
              background: isAlmostThere ? '#d1fae5' : '#fef3c7',
              borderRadius: '16px',
              border: `1px solid ${isAlmostThere ? '#10b981' : '#fde68a'}`
            }}>
              <p style={{ 
                fontSize: isMobile ? '14px' : '16px', 
                fontWeight: 500, 
                color: isAlmostThere ? '#065f46' : '#92400e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                {isAlmostThere ? (
                  <>
                    <CheckCircle size={20} />
                    O motoqueiro está chegando! Prepare-se para o encontro 🎉
                  </>
                ) : (
                  <>
                    <Clock size={20} />
                    Motoqueiro a caminho...
                  </>
                )}
              </p>
              {!isAlmostThere && animationStep < 100 && (
                <p style={{ fontSize: '12px', color: '#92400e', marginTop: '8px' }}>
                  O motoqueiro chegará em aproximadamente {estimatedMinutes} minuto{estimatedMinutes !== 1 ? 's' : ''}{estimatedRemainingSeconds > 0 ? ` e ${estimatedRemainingSeconds} segundo${estimatedRemainingSeconds !== 1 ? 's' : ''}` : ''}
                </p>
              )}
            </div>
            
            {/* Informações da Corrida */}
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: '#f9fafb', 
              borderRadius: '16px',
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>📍 Destino</p>
                <p style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 500 }}>{formData.dropoffAddress || 'Não informado'}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>💰 Valor</p>
                  <p style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: '#f59e0b' }}>{formData.price?.toLocaleString()} Kz</p>
                </div>
                {showCallButtons && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => window.location.href = `tel:${selectedRider?.phone}`}
                      style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                    >
                      <Phone size={14} /> Ligar
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Barra de progresso extra */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ 
                height: '6px', 
                background: '#e5e7eb', 
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${animationStep}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                  borderRadius: '3px',
                  transition: 'width 3s linear'
                }} />
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '6px',
                fontSize: '10px',
                color: '#9ca3af'
              }}>
                <span>Início</span>
                <span>{animationStep}%</span>
                <span>Destino</span>
              </div>
            </div>
            
            {/* Botão de Concluir (aparece quando chega) */}
            {isAlmostThere && (
              <button
                onClick={async () => {
                  if (orderId) {
                    await supabase
                      .from('orders')
                      .update({ status: 'completed' })
                      .eq('id', orderId)
                  }
                  setShowMap(false)
                  setShowThankYouModal(true)
                }}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  animation: 'pulse 1s infinite'
                }}
              >
                <CheckCircle size={20} />
                CHEGUEI AO MEU DESTINO
              </button>
            )}
          </div>
        </div>
        
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button onClick={() => {
            setShowMap(false)
            setOrderId(null)
            setAnimationStep(0)
            setShowCallButtons(false)
            localStorage.removeItem('active_order_id')
            localStorage.removeItem('active_order_status')
            router.push('/')
          }} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: isMobile ? '13px' : '14px', padding: '12px' }}>
            ← Ir para página inicial
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
      `}</style>
    </div>
  )
}

  if (showWaitingModal) {
    const progressPercent = (timeLeft / 900) * 100
    
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.waitingModalContent}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ width: isMobile ? '60px' : '80px', height: isMobile ? '60px' : '80px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'pulse 1.5s infinite' }}>
              <Clock size={isMobile ? 32 : 40} color="white" />
            </div>
            <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>Aguardando Motoqueiro</h2>
            <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: isMobile ? '13px' : '14px' }}>
              {selectedRider?.name} foi notificado sobre seu pedido
            </p>
          </div>

          <div style={{ position: 'relative', width: isMobile ? '120px' : '140px', height: isMobile ? '120px' : '140px', margin: '0 auto 20px' }}>
            <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}px`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercent / 100)}px`}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <p style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 'bold', color: '#f59e0b', fontFamily: 'monospace' }}>
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: '#fef3c7', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <AlertCircle size={14} /> Aguardando resposta do motoqueiro
            </p>
            <div style={{ height: '4px', backgroundColor: '#fde68a', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#f59e0b', transition: 'width 1s linear' }} />
            </div>
          </div>

          <button 
            onClick={() => {
              setShowWaitingModal(false)
              setOrderId(null)
              localStorage.removeItem('active_order_id')
              localStorage.removeItem('active_order_status')
              localStorage.removeItem('order_expires_at')
              localStorage.removeItem('order_time_left')
            }}
            style={{ width: '100%', backgroundColor: '#ef4444', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: isMobile ? '14px' : '16px' }}
          >
            Cancelar Pedido
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '12px 16px' : '16px 24px' }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: isMobile ? '12px' : '16px', fontSize: isMobile ? '13px' : '14px' }}>
            <ArrowLeft size={18} />
            Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '12px', flexWrap: 'wrap' }}>
            <div style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bike size={isMobile ? 20 : 24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold', color: '#111827' }}>{plate?.plate_number}</h1>
              <p style={{ fontSize: isMobile ? '12px' : '14px', color: '#6b7280', marginTop: '4px' }}>
                {riders.filter(r => r.is_online).length} motoqueiro(s) online • {riders.length} total
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '12px' : '24px' }}>
        {riders.map((rider) => (
          <div key={rider.id} style={{ ...styles.card, transform: rider.is_online ? 'scale(1)' : 'scale(0.98)', opacity: rider.is_online ? 1 : 0.7 }}>
            <div style={{ padding: isMobile ? '16px' : '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px', flexWrap: 'wrap' }}>
                <div style={{ flexShrink: 0 }}>
                  {rider.photo_url ? (
                    <img src={rider.photo_url} alt={rider.name} style={{ width: isMobile ? '56px' : '72px', height: isMobile ? '56px' : '72px', borderRadius: '50%', objectFit: 'cover', border: rider.is_online ? '3px solid #f59e0b' : '3px solid #d1d5db' }} />
                  ) : (
                    <div style={{ width: isMobile ? '56px' : '72px', height: isMobile ? '56px' : '72px', background: rider.is_online ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : '#d1d5db', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={isMobile ? 24 : 32} color="white" />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold', color: '#111827', wordBreak: 'break-word' }}>{rider.name}</h3>
                    {rider.is_online ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        <Wifi size={10} />
                        Online
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        <XCircle size={10} />
                        Offline
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '6px' : '12px', marginTop: '6px' }}>
                    <p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={12} /> BI: {rider.bi}
                    </p>
                    <p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all' }}>
                      <Phone size={12} /> {rider.phone}
                    </p>
                  </div>
                </div>
                <div style={{ width: isMobile ? '100%' : 'auto' }}>
                  <button 
                    onClick={() => handleOpenForm(rider)} 
                    disabled={!rider.is_online} 
                    style={{ 
                      ...(rider.is_online ? styles.buttonPrimary : styles.buttonDisabled), 
                      width: isMobile ? '100%' : 'auto',
                      justifyContent: 'center'
                    }}
                  >
                    <Navigation size={isMobile ? 14 : 18} />
                    Pedir Moto
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {riders.length === 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '40px 20px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
            <Bike size={56} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#6b7280', fontSize: isMobile ? '14px' : '16px', marginBottom: '8px' }}>Nenhum motoqueiro cadastrado</p>
            <p style={{ color: '#9ca3af', fontSize: isMobile ? '12px' : '13px' }}>Esta placa ainda não possui motoqueiros disponíveis</p>
          </div>
        )}
      </div>

      {/* Formulário de Pedido Melhorado */}
      {showForm && selectedRider && (
        <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', padding: isMobile ? '20px' : '24px', borderRadius: '24px 24px 0 0', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: isMobile ? '20px' : '22px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bike size={24} />
                    Solicitar Corrida
                  </h3>
                  <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '6px' }}>Preencha os dados abaixo para solicitar o serviço</p>
                </div>
                <button 
                  onClick={() => setShowForm(false)} 
                  style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    border: 'none', 
                    color: 'white', 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    cursor: 'pointer', 
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: isMobile ? '20px' : '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <User size={16} color="#f59e0b" />
                  Seu nome <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="Digite seu nome completo" 
                  value={formData.customerName} 
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})} 
                  style={{ ...styles.input, padding: '14px', fontSize: isMobile ? '16px' : '14px' }} 
                />
              </div>

              <div>
                <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Phone size={16} color="#f59e0b" />
                  Seu telefone <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="tel" 
                  required 
                  placeholder="Digite seu telefone (ex: 923456789)" 
                  value={formData.customerPhone} 
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} 
                  style={{ ...styles.input, padding: '14px', fontSize: isMobile ? '16px' : '14px' }} 
                />
              </div>

              <div>
                <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <MapPin size={16} color="#10b981" />
                  Endereço de origem <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>📍</span>
                  <input 
                    type="text" 
                    required 
                    placeholder="Onde você está?" 
                    value={formData.pickupAddress} 
                    onChange={(e) => setFormData({...formData, pickupAddress: e.target.value})} 
                    style={{ ...styles.input, padding: '14px 14px 14px 48px', fontSize: isMobile ? '16px' : '14px' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <MapPin size={16} color="#ef4444" />
                  Endereço de destino <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>🎯</span>
                  <input 
                    type="text" 
                    required 
                    placeholder="Para onde você vai?" 
                    value={formData.dropoffAddress} 
                    onChange={(e) => setFormData({...formData, dropoffAddress: e.target.value})} 
                    style={{ ...styles.input, padding: '14px 14px 14px 48px', fontSize: isMobile ? '16px' : '14px' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <DollarSign size={16} color="#f59e0b" />
                  Valor da corrida (Kz) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontWeight: 600, fontSize: '14px' }}>Kz</span>
                  <input 
                    type="number" 
                    required 
                    placeholder="Valor" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})} 
                    style={{ ...styles.input, padding: '14px 14px 14px 48px', fontSize: isMobile ? '16px' : '14px' }} 
                    min="100" 
                    step="100" 
                  />
                </div>
                
                <div style={{ 
                  marginTop: '12px', 
                  padding: '14px', 
                  borderRadius: '14px', 
                  background: (() => {
                    const hour = new Date().getHours()
                    return hour >= 22 || hour < 6 ? 'linear-gradient(135deg, #1e1b4b, #312e81)' : 'linear-gradient(135deg, #fffbeb, #fef3c7)'
                  })(),
                  border: `1px solid ${(() => {
                    const hour = new Date().getHours()
                    return hour >= 22 || hour < 6 ? '#4338ca' : '#fde68a'
                  })()}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '12px', 
                      background: (() => {
                        const hour = new Date().getHours()
                        return hour >= 22 || hour < 6 ? '#4338ca' : '#f59e0b'
                      })(),
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      {(() => {
                        const hour = new Date().getHours()
                        return hour >= 22 || hour < 6 ? <Moon size={20} color="white" /> : <Sun size={20} color="white" />
                      })()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: (() => {
                          const hour = new Date().getHours()
                          return hour >= 22 || hour < 6 ? '#a5b4fc' : '#92400e'
                        })(),
                        marginBottom: '4px'
                      }}>
                        {(() => {
                          const hour = new Date().getHours()
                          return hour >= 22 || hour < 6 ? '🌙 Tarifa Noturna' : '☀️ Tarifa Diurna'
                        })()}
                      </p>
                      <p style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        color: (() => {
                          const hour = new Date().getHours()
                          return hour >= 22 || hour < 6 ? 'white' : '#d97706'
                        })(),
                        marginBottom: '2px'
                      }}>
                        {(() => {
                          const hour = new Date().getHours()
                          const isNight = hour >= 22 || hour < 6
                          const basePrice = isNight ? 500 : 300
                          return `${basePrice.toLocaleString()} Kz`
                        })()}
                      </p>
                      <p style={{ 
                        fontSize: '10px', 
                        color: (() => {
                          const hour = new Date().getHours()
                          return hour >= 22 || hour < 6 ? '#c7d2fe' : '#b45309'
                        })()
                      }}>
                        {(() => {
                          const hour = new Date().getHours()
                          if (hour >= 22 || hour < 6) {
                            return '⏰ Válido das 22h às 6h (adicional noturno)'
                          }
                          return '⏰ Válido das 6h às 22h'
                        })()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const hour = new Date().getHours()
                        const isNight = hour >= 22 || hour < 6
                        const suggestedPrice = isNight ? 500 : 300
                        setFormData({...formData, price: suggestedPrice})
                      }}
                      style={{
                        padding: '8px 16px',
                        background: (() => {
                          const hour = new Date().getHours()
                          return hour >= 22 || hour < 6 ? '#4338ca' : '#f59e0b'
                        })(),
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle size={14} />
                      Usar este valor
                    </button>
                  </div>
                </div>
                
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={12} />
                  💡 Você também pode digitar um valor personalizado acima
                </p>
              </div>

              <div style={{ 
                backgroundColor: '#fef3c7', 
                padding: '14px', 
                borderRadius: '14px', 
                marginTop: '4px',
                border: '1px solid #fde68a'
              }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClipboardList size={14} />
                  📋 Resumo do pedido
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#78350f', marginBottom: '6px' }}>
                  <span>🏍️ Motoqueiro:</span>
                  <span style={{ fontWeight: 600 }}>{selectedRider.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#78350f' }}>
                  <span>🚲 Placa:</span>
                  <span style={{ fontWeight: 600 }}>{plate?.plate_number}</span>
                </div>
              </div>

              <button 
                type="submit" 
                style={{ 
                  ...styles.buttonPrimary, 
                  width: '100%', 
                  justifyContent: 'center', 
                  padding: '16px', 
                  fontSize: isMobile ? '16px' : '16px', 
                  marginTop: '8px',
                  background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                  borderRadius: '14px',
                  gap: '10px'
                }}
              >
                <Send size={isMobile ? 18 : 18} />
                Confirmar Pedido
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 768px) {
          input, button {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}