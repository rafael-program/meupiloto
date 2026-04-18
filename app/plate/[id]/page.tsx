'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Phone, User, XCircle, Navigation, Bike, Shield, Wifi, Clock, CheckCircle, Star, Heart } from 'lucide-react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

// Importar componentes do mapa dinamicamente
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
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
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    pickupAddress: '',
    dropoffAddress: '',
    price: 1000
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
    } else {
      localStorage.removeItem('active_order_id')
      localStorage.removeItem('active_order_status')
      localStorage.removeItem('active_order_rider')
    }
  }, [orderId, orderStatus, selectedRider, customerLocation, formData])

  // Timer com verificação de status
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    
    if (showWaitingModal && timeLeft > 0 && orderStatus === 'pending') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
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
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [showWaitingModal, timeLeft, orderStatus])

  // SUBSCRIÇÃO EM TEMPO REAL - CORAÇÃO DO SISTEMA
  useEffect(() => {
    if (!orderId) return

    console.log('📡 Iniciando subscription para pedido:', orderId)

    const fetchCurrentOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('status, rider_location')
        .eq('id', orderId)
        .single()
      
      if (data) {
        console.log('📦 Status atual do pedido:', data.status)
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
  }, [orderId])

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

  const handleSubmitRating = async () => {
    if (rating > 0 && orderId) {
      await supabase
        .from('orders')
        .update({ customer_rating: rating })
        .eq('id', orderId)
      
      // Limpar localStorage
      localStorage.removeItem('active_order_id')
      localStorage.removeItem('active_order_status')
      localStorage.removeItem('active_order_rider')
      
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

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

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
        expires_at: expiresAt.toISOString(),
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
    card: { backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', overflow: 'hidden', transition: 'all 0.3s ease' },
    buttonPrimary: { background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    buttonDisabled: { background: '#d1d5db', color: '#6b7280', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' },
    modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' },
    modalContent: { backgroundColor: 'white', borderRadius: '24px', maxWidth: '480px', width: '90%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
    waitingModalContent: { 
      backgroundColor: 'white', 
      borderRadius: '24px', 
      maxWidth: '400px', 
      width: '90%', 
      textAlign: 'center' as const, 
      padding: '32px', 
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)' 
    },
    thankYouModalContent: {
      backgroundColor: 'white',
      borderRadius: '24px',
      maxWidth: '450px',
      width: '90%',
      textAlign: 'center' as const,
      padding: '40px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
    },
    input: { width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', transition: 'all 0.3s ease' },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#374151' }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
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
          <div style={{ marginBottom: '24px' }}>
            <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={48} color="white" />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>Obrigado! 🎉</h2>
            <p style={{ color: '#6b7280', marginBottom: '8px' }}>
              Sua corrida foi concluída com sucesso!
            </p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Esperamos que tenha tido uma ótima experiência com {selectedRider?.name}
            </p>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px', marginTop: '8px' }}>
            <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#374151' }}>
              Avalie sua experiência:
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
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
                    size={32}
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
                marginBottom: '12px'
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
                transition: 'all 0.3s ease'
              }}
            >
              Ir para página inicial
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showMap && selectedRider) {
    const center = riderLocation || customerLocation || { lat: -8.8383, lng: 13.2344 }
    
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px' }}>
            <button onClick={() => {
              setShowMap(false)
              setOrderId(null)
              localStorage.removeItem('active_order_id')
              localStorage.removeItem('active_order_status')
              router.push('/')
            }} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', fontSize: '14px' }}>
              <ArrowLeft size={18} />
              Voltar ao Início
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bike size={24} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>Motoqueiro a Caminho</h1>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{selectedRider?.name} está vindo até você</p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ height: '500px', width: '100%' }}>
              <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                {customerLocation && (
                  <Marker position={[customerLocation.lat, customerLocation.lng]}>
                    <Popup>Sua Localização</Popup>
                  </Marker>
                )}
                {riderLocation && (
                  <Marker position={[riderLocation.lat, riderLocation.lng]}>
                    <Popup>🏍️ {selectedRider?.name}</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>
          <div style={{ marginTop: '24px', backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>Status do Pedido</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <div style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                  <span style={{ fontWeight: 500, color: '#10b981' }}>Motoqueiro aceitou! Está a caminho</span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>Destino: {formData.dropoffAddress || 'Não informado'}</p>
                <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#059669' }}>Valor: {formData.price?.toLocaleString()} Kz</p>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button onClick={() => {
              setShowMap(false)
              setOrderId(null)
              localStorage.removeItem('active_order_id')
              localStorage.removeItem('active_order_status')
              router.push('/')
            }} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px' }}>
              ← Ir para página inicial
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showWaitingModal) {
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.waitingModalContent}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Clock size={40} color="white" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Aguardando Motoqueiro</h2>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              {selectedRider?.name} foi notificado sobre seu pedido
            </p>
          </div>

          <div style={{ backgroundColor: '#fef3c7', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', color: '#92400e', marginBottom: '8px' }}>Tempo restante para resposta:</p>
            <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#d97706', fontFamily: 'monospace', margin: 0 }}>
              {formatTime(timeLeft)}
            </p>
            <p style={{ fontSize: '12px', color: '#92400e', marginTop: '8px', marginBottom: 0 }}>
              Se o motoqueiro não responder em 15 minutos, o pedido será cancelado automaticamente
            </p>
          </div>

          <button 
            onClick={() => {
              setShowWaitingModal(false)
              setOrderId(null)
              localStorage.removeItem('active_order_id')
              localStorage.removeItem('active_order_status')
            }}
            style={{ width: '100%', backgroundColor: '#ef4444', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
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
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px' }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', fontSize: '14px' }}>
            <ArrowLeft size={18} />
            Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bike size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>{plate?.plate_number}</h1>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{riders.filter(r => r.is_online).length} motoqueiros online • {riders.length} total</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
        {riders.map((rider) => (
          <div key={rider.id} style={styles.card}>
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0 }}>
                {rider.photo_url ? (
                  <img src={rider.photo_url} alt={rider.name} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f59e0b' }} />
                ) : (
                  <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={32} color="white" />
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{rider.name}</h3>
                  {rider.is_online ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
                      <Wifi size={12} />
                      Online
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
                      <XCircle size={12} />
                      Offline
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <p style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={14} /> BI: {rider.bi}
                  </p>
                  <p style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={14} /> {rider.phone}
                  </p>
                </div>
              </div>
              <button onClick={() => handleOpenForm(rider)} disabled={!rider.is_online} style={rider.is_online ? styles.buttonPrimary : styles.buttonDisabled}>
                <Navigation size={18} />
                Pedir Moto
              </button>
            </div>
          </div>
        ))}
        {riders.length === 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '48px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
            <Bike size={64} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#6b7280', fontSize: '16px' }}>Nenhum motoqueiro cadastrado nesta placa</p>
          </div>
        )}
      </div>

      {showForm && selectedRider && (
        <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', padding: '20px', borderRadius: '24px 24px 0 0', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Solicitar Corrida</h3>
                <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
              <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>Motoqueiro: {selectedRider.name}</p>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" required placeholder="Seu nome" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} style={styles.input} />
              <input type="tel" required placeholder="Seu telefone" value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} style={styles.input} />
              <input type="text" required placeholder="Endereço de origem" value={formData.pickupAddress} onChange={(e) => setFormData({...formData, pickupAddress: e.target.value})} style={styles.input} />
              <input type="text" required placeholder="Endereço de destino" value={formData.dropoffAddress} onChange={(e) => setFormData({...formData, dropoffAddress: e.target.value})} style={styles.input} />
              <input type="number" required placeholder="Valor da corrida (Kz)" value={formData.price} onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})} style={styles.input} min="100" step="100" />
              <button type="submit" style={{ ...styles.buttonPrimary, width: '100%', justifyContent: 'center', padding: '14px', fontSize: '16px' }}>
                <Navigation size={18} />
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
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}