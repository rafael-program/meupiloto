// app/dashboard/motoqueiro/page.tsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Power, Phone, MapPin, Navigation, CheckCircle, LogOut, Bell, History, Clock, CheckSquare, XCircle,
  User, Wallet, Star, BellRing, BellOff, Edit, Camera, Loader2, X, Menu, Home, TrendingUp, Award
} from 'lucide-react'
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

// Configurar ícones do Leaflet
if (typeof window !== 'undefined') {
  const L = require('leaflet')
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

export default function RiderDashboard() {
  const [isOnline, setIsOnline] = useState(false)
  const [rider, setRider] = useState<any>(null)
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [completedOrders, setCompletedOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pushPermission, setPushPermission] = useState<string>('default')
  const [stats, setStats] = useState({ totalEarnings: 0, totalRides: 0, rating: 4.8 })
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showMap, setShowMap] = useState(false)
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationInterval, setLocationInterval] = useState<NodeJS.Timeout | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const channelRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (typeof Audio !== 'undefined') audioRef.current = new Audio('/notification.mp3')
    const riderId = localStorage.getItem('rider_id')
    if (!riderId) { router.push('/login/motoqueiro'); return }
    if (isNotificationSupported()) { setPushPermission(Notification.permission); registerServiceWorker() }
    loadRider(riderId)
    loadPendingOrders(riderId)
    loadCompletedOrders(riderId)
    loadNotifications(riderId)
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = subscribeToOrders(riderId)
    const timer = setTimeout(() => {
      if (isNotificationSupported() && Notification.permission === 'default') {
        if (confirm('🔔 Quer receber notificações de novos pedidos mesmo com o app fechado?')) {
          requestNotificationPermission()
          setPushPermission('granted')
        }
      }
    }, 5000)
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (locationInterval) clearInterval(locationInterval)
      clearTimeout(timer)
    }
  }, [])

  // Enviar localização do motoqueiro periodicamente
  const startLocationTracking = () => {
    if (locationInterval) clearInterval(locationInterval)
    
    const interval = setInterval(() => {
      if (navigator.geolocation && selectedOrder?.id) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setRiderLocation(location)
          await supabase
            .from('orders')
            .update({ rider_location: JSON.stringify(location) })
            .eq('id', selectedOrder.id)
        }, (error) => {
          console.error('Erro ao obter localização:', error)
        })
      }
    }, 5000)
    
    setLocationInterval(interval)
  }

  const stopLocationTracking = () => {
    if (locationInterval) {
      clearInterval(locationInterval)
      setLocationInterval(null)
    }
  }

  const playSound = () => audioRef.current?.play().catch(() => {})
  const sendPushNotification = (title: string, body: string) => {
    if (!isNotificationSupported() || Notification.permission !== 'granted') return
    try {
      const notification = new Notification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png', requireInteraction: true })
      notification.onclick = () => { window.focus(); notification.close() }
      setTimeout(() => notification.close(), 15000)
    } catch (error) { console.error('Erro na notificação push:', error) }
  }

  const loadRider = async (riderId: string) => {
    const { data } = await supabase.from('riders').select('*, plate:plates(plate_number)').eq('id', riderId).single()
    if (data) { setRider(data); setIsOnline(data.is_online || false) }
    setLoading(false)
  }

  const loadPendingOrders = async (riderId: string) => {
    const { data } = await supabase.from('orders').select('*').eq('rider_id', riderId).eq('status', 'pending').order('created_at', { ascending: false })
    if (data) setPendingOrders(data)
  }

  const loadCompletedOrders = async (riderId: string) => {
    const { data } = await supabase.from('orders').select('*').eq('rider_id', riderId).in('status', ['accepted', 'completed', 'cancelled']).order('created_at', { ascending: false })
    if (data) {
      setCompletedOrders(data)
      const completed = data.filter(o => o.status === 'completed')
      setStats({ totalEarnings: completed.reduce((sum, o) => sum + (o.price || 0), 0), totalRides: completed.length, rating: 4.8 })
    }
  }

  const loadNotifications = async (riderId: string) => {
    const { data } = await supabase.from('notifications').select('*').eq('rider_id', riderId).order('created_at', { ascending: false }).limit(20)
    if (data) { setNotifications(data); setUnreadCount(data.filter(n => !n.is_read).length) }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    for (const id of unreadIds) await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const addNotification = async (title: string, message: string, type: string) => {
    if (!rider?.id) return
    const { data } = await supabase.from('notifications').insert({ rider_id: rider.id, title, message, type, is_read: false, created_at: new Date().toISOString() }).select().single()
    if (data) { setNotifications(prev => [data, ...prev]); setUnreadCount(prev => prev + 1); playSound(); sendPushNotification(title, message) }
  }

  const toggleOnline = async () => {
    if (!rider?.id) return
    const newStatus = !isOnline
    const { error } = await supabase.from('riders').update({ is_online: newStatus }).eq('id', rider.id)
    if (!error) {
      setIsOnline(newStatus)
      await addNotification(newStatus ? 'Status Online' : 'Status Offline', newStatus ? 'Você está online e disponível para receber pedidos' : 'Você está offline. Não receberá novos pedidos', 'info')
      if (newStatus) sendPushNotification('MeuPiloto! - Online', 'Você está online e disponível para receber pedidos')
    }
  }

  const subscribeToOrders = (riderId: string) => {
    return supabase.channel(`orders-${riderId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `rider_id=eq.${riderId}` }, async (payload) => {
        const newOrder = payload.new as any
        setPendingOrders((prev) => [newOrder, ...prev])
        await addNotification('Novo Pedido! 🚀', `${newOrder.customer_name || 'Cliente'} solicitou uma corrida de ${newOrder.price?.toLocaleString()} Kz`, 'order')
        playSound()
        if (Notification.permission === 'granted') {
          const notification = new Notification('🏍️ MeuPiloto! - Novo Pedido', { body: `${newOrder.customer_name || 'Cliente'} - ${newOrder.price?.toLocaleString()} Kz`, icon: '/icon-192.png', badge: '/icon-192.png', requireInteraction: true })
          notification.onclick = () => { window.focus(); notification.close() }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `rider_id=eq.${riderId}` }, (payload) => {
        const updatedOrder = payload.new as any
        if (updatedOrder.status === 'accepted') addNotification('Pedido Aceito ✅', `Você aceitou a corrida de ${updatedOrder.customer_name}`, 'success')
        else if (updatedOrder.status === 'completed') addNotification('Corrida Concluída 🎉', `Corrida de ${updatedOrder.customer_name} concluída! Ganhou ${updatedOrder.price?.toLocaleString()} Kz`, 'success')
        else if (updatedOrder.status === 'cancelled') addNotification('Pedido Cancelado ❌', `Pedido de ${updatedOrder.customer_name} foi cancelado`, 'alert')
        if (updatedOrder.status === 'accepted' || updatedOrder.status === 'completed') setPendingOrders(prev => prev.filter(o => o.id !== updatedOrder.id))
        setCompletedOrders(prev => {
          const exists = prev.find(o => o.id === updatedOrder.id)
          if (exists) return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o)
          else if (updatedOrder.status !== 'pending') return [updatedOrder, ...prev]
          return prev
        })
      })
      .subscribe()
  }

  const requestPushPermission = async () => {
    const granted = await requestNotificationPermission()
    setPushPermission(granted ? 'granted' : 'denied')
    if (granted) await addNotification('Notificações Ativadas ✅', 'Você receberá notificações mesmo com o app fechado!', 'success')
  }

  const acceptOrder = async (order: any) => {
    if (!isOnline) { alert('⚠️ Você precisa estar online para aceitar pedidos!'); return }
    if (!rider?.id) { alert('❌ Sessão expirada. Faça login novamente.'); router.push('/login/motoqueiro'); return }
    
    setSelectedOrder(order)
    
    if (order.customer_lat && order.customer_lng) {
      setCustomerLocation({ lat: order.customer_lat, lng: order.customer_lng })
    }
    
    setShowMap(true)
    startLocationTracking()
    
    try {
      const { data, error } = await supabase.from('orders').update({ status: 'accepted' }).eq('id', order.id).eq('rider_id', rider.id).select()
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Nenhum pedido atualizado')
      setPendingOrders(prev => prev.filter(o => o.id !== order.id))
      await addNotification('Pedido Aceito ✅', `Você aceitou a corrida de ${order.customer_name}`, 'success')
    } catch (err) {
      alert('Erro ao aceitar pedido')
    }
  }

  const completeOrder = async (order: any) => {
    if (!rider?.id) return
    if (confirm(`✅ Confirmar conclusão da entrega para ${order.customer_name}?`)) {
      const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id).eq('rider_id', rider.id)
      if (!error) {
        setCompletedOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'completed' } : o))
        setStats(prev => ({ ...prev, totalEarnings: prev.totalEarnings + (order.price || 0), totalRides: prev.totalRides + 1 }))
        await addNotification('Corrida Concluída 🎉', `Corrida de ${order.customer_name} concluída! Ganhou ${order.price?.toLocaleString()} Kz`, 'success')
        setShowMap(false)
        stopLocationTracking()
        setSelectedOrder(null)
        setCustomerLocation(null)
        setRiderLocation(null)
      }
    }
  }

  const cancelOrder = async (order: any) => {
    if (!rider?.id) return
    if (confirm(`❌ Cancelar pedido de ${order.customer_name}?`)) {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id).eq('rider_id', rider.id)
      setPendingOrders(prev => prev.filter(o => o.id !== order.id))
      await addNotification('Pedido Cancelado ❌', `Pedido de ${order.customer_name} foi cancelado`, 'alert')
      if (selectedOrder?.id === order.id) {
        setShowMap(false)
        stopLocationTracking()
        setSelectedOrder(null)
      }
    }
  }

  const handleLogout = () => { localStorage.clear(); router.push('/login/motoqueiro') }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Pendente</span>
      case 'accepted': return <span style={{ backgroundColor: '#dbeafe', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Em rota</span>
      case 'completed': return <span style={{ backgroundColor: '#d1fae5', color: '#059669', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckSquare size={12} /> Concluído</span>
      default: return <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> Cancelado</span>
    }
  }

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'order': return <BellRing size={16} color="#f59e0b" />
      case 'success': return <CheckCircle size={16} color="#10b981" />
      default: return <Bell size={16} color="#3b82f6" />
    }
  }

  const calculateDistance = () => {
    if (!riderLocation || !customerLocation) return null
    const R = 6371
    const dLat = (customerLocation.lat - riderLocation.lat) * Math.PI / 180
    const dLon = (customerLocation.lng - riderLocation.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(riderLocation.lat * Math.PI / 180) * Math.cos(customerLocation.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return (R * c).toFixed(1)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fffbeb, #fff0f0)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ animation: 'spin 1s linear infinite', width: '48px', height: '48px', border: '3px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280' }}>Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  // Tela do mapa com navegação
  if (showMap && selectedOrder) {
    const center = riderLocation || customerLocation || { lat: -8.8383, lng: 13.2344 }
    const distance = calculateDistance()
    
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
        <div style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: isMobile ? '12px 16px' : '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => { setShowMap(false); stopLocationTracking(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  <XCircle size={18} /> Fechar
                </button>
                <div>
                  <h1 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: '#111827' }}>Em Rota</h1>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>{selectedOrder.customer_name}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => window.location.href = `tel:${selectedOrder.customer_phone}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isMobile ? '8px 14px' : '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 600, fontSize: isMobile ? '12px' : '14px', cursor: 'pointer' }}>
                  <Phone size={14} /> Ligar
                </button>
                <button onClick={() => completeOrder(selectedOrder)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isMobile ? '8px 14px' : '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 600, fontSize: isMobile ? '12px' : '14px', cursor: 'pointer' }}>
                  <CheckCircle size={14} /> Concluir
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? '12px' : '24px' }}>
          <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ height: isMobile ? '350px' : '450px', width: '100%' }}>
              <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                {customerLocation && (
                  <Marker position={[customerLocation.lat, customerLocation.lng]}>
                    <Popup>📍 Cliente: {selectedOrder.customer_name}</Popup>
                  </Marker>
                )}
                {riderLocation && (
                  <Marker position={[riderLocation.lat, riderLocation.lng]}>
                    <Popup>🏍️ Você está aqui</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>

          <div style={{ marginTop: '16px', background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Cliente</p>
                <p style={{ fontWeight: 600, fontSize: '16px' }}>{selectedOrder.customer_name}</p>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>{selectedOrder.customer_phone}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Destino</p>
                <p style={{ fontWeight: 600, fontSize: '14px' }}>{selectedOrder.dropoff_address || 'Não informado'}</p>
              </div>
            </div>
            
            {distance && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', borderRadius: '12px' }}>
                <p style={{ fontSize: '13px', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Navigation size={16} />
                  Distância até o cliente: <strong>{distance} km</strong>
                </p>
              </div>
            )}
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button onClick={() => window.open(`https://www.google.com/maps/dir/${riderLocation?.lat || -8.8383},${riderLocation?.lng || 13.2344}/${customerLocation?.lat || -8.8383},${customerLocation?.lng || 13.2344}`, '_blank')} style={{ flex: 1, background: '#f59e0b', color: 'white', padding: '14px', border: 'none', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                <Navigation size={18} /> Google Maps
              </button>
              <button onClick={() => window.location.href = `tel:${selectedOrder.customer_phone}`} style={{ flex: 1, background: '#10b981', color: 'white', padding: '14px', border: 'none', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                <Phone size={18} /> Ligar
              </button>
            </div>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <button onClick={() => { if (confirm(`✅ Confirma que chegou ao destino de ${selectedOrder.customer_name}?`)) completeOrder(selectedOrder) }} style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '16px', border: 'none', borderRadius: '14px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
              <CheckCircle size={22} /> CHEGUEI AO DESTINO - CONCLUIR CORRIDA
            </button>
          </div>
        </div>
      </div>
    )
  }

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #f9fafb 0%, #fffbeb 100%)' },
    card: { background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' },
    buttonPrimary: { background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', padding: '10px 20px', borderRadius: '30px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    mobileMenu: {
      position: 'fixed' as const,
      top: 0,
      right: 0,
      bottom: 0,
      width: '280px',
      backgroundColor: 'white',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      zIndex: 20,
      transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
      overflowY: 'auto' as const,
    },
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 19,
      display: mobileMenuOpen ? 'block' : 'none',
    }
  }

  return (
    <div style={styles.container}>
      {/* Overlay do menu mobile */}
      <div style={styles.overlay} onClick={() => setMobileMenuOpen(false)} />

      {/* Menu Mobile */}
      <div style={styles.mobileMenu}>
        <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={24} color="#f59e0b" />
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Menu</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} color="#6b7280" />
          </button>
        </div>
        <div style={{ padding: '16px' }}>
          <button onClick={() => { setActiveTab('pending'); setMobileMenuOpen(false) }} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px' }}>
            <Phone size={20} color="#6b7280" /> Pedidos
          </button>
          <button onClick={() => { setActiveTab('history'); setMobileMenuOpen(false) }} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px' }}>
            <History size={20} color="#6b7280" /> Histórico
          </button>
          <button onClick={() => { setShowEditProfile(true); setMobileMenuOpen(false) }} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px' }}>
            <Edit size={20} color="#6b7280" /> Editar Perfil
          </button>
          <button onClick={toggleOnline} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px', color: isOnline ? '#10b981' : '#6b7280' }}>
            <Power size={20} /> {isOnline ? 'Online' : 'Offline'}
          </button>
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '16px', paddingTop: '16px' }}>
            <button onClick={handleLogout} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', color: '#ef4444' }}>
              <LogOut size={20} /> Sair
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '12px 16px' : '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {rider?.photo_url ? (
                <img src={rider.photo_url} alt={rider.name} style={{ width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f59e0b' }} />
              ) : (
                <div style={{ width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={isMobile ? 24 : 28} color="white" />
                </div>
              )}
              <div>
                <h1 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: '#111827' }}>{rider?.name}</h1>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>{rider?.plate?.plate_number || 'Placa não definida'}</p>
              </div>
            </div>

            {/* Desktop Actions */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => setShowEditProfile(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '30px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                  <Edit size={14} /> Editar
                </button>
                {isNotificationSupported() && pushPermission === 'default' && (
                  <button onClick={requestPushPermission} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '30px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                    <Bell size={14} /> Ativar Notif.
                  </button>
                )}
                {isNotificationSupported() && pushPermission === 'granted' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#d1fae5', color: '#059669', borderRadius: '30px', fontSize: '12px' }}>
                    <BellRing size={14} /> Notif. ativas
                  </div>
                )}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowNotifications(!showNotifications)} style={{ position: 'relative', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '50%' }}>
                    <Bell size={20} color="#6b7280" />
                    {unreadCount > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', fontSize: '10px', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
                  </button>
                  {showNotifications && (
                    <div style={{ position: 'absolute', right: 0, top: '40px', width: '320px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 20 }}>
                      <div style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontWeight: 'bold', fontSize: '14px' }}>Notificações</h3>
                        {unreadCount > 0 && <button onClick={markAllAsRead} style={{ fontSize: '11px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>Marcar todas</button>}
                      </div>
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <p style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Sem notificações</p>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} onClick={() => markNotificationAsRead(notif.id)} style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: notif.is_read ? 'white' : '#eff6ff' }}>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                {getNotificationIcon(notif.type)}
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontWeight: 500, fontSize: '13px' }}>{notif.title}</p>
                                  <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{notif.message}</p>
                                  <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>{new Date(notif.created_at).toLocaleTimeString()}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={toggleOnline} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '30px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', background: isOnline ? '#10b981' : '#9ca3af', color: 'white', border: 'none' }}>
                  <Power size={14} /> {isOnline ? 'Online' : 'Offline'}
                </button>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '30px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                  <LogOut size={14} /> Sair
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <button onClick={() => setMobileMenuOpen(true)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Menu size={24} color="#374151" />
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? '8px' : '12px', marginTop: '16px' }}>
            <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '12px', padding: isMobile ? '10px' : '12px', color: 'white' }}>
              <Wallet size={isMobile ? 16 : 20} style={{ marginBottom: '4px', opacity: 0.8 }} />
              <p style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold' }}>{stats.totalEarnings.toLocaleString()} Kz</p>
              <p style={{ fontSize: '10px', opacity: 0.8 }}>Total ganho</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', borderRadius: '12px', padding: isMobile ? '10px' : '12px', color: 'white' }}>
              <Navigation size={isMobile ? 16 : 20} style={{ marginBottom: '4px', opacity: 0.8 }} />
              <p style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold' }}>{stats.totalRides}</p>
              <p style={{ fontSize: '10px', opacity: 0.8 }}>Corridas</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: '12px', padding: isMobile ? '10px' : '12px', color: 'white' }}>
              <Star size={isMobile ? 16 : 20} style={{ marginBottom: '4px', opacity: 0.8 }} />
              <p style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold' }}>{stats.rating}</p>
              <p style={{ fontSize: '10px', opacity: 0.8 }}>Avaliação</p>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Alert */}
      {!isOnline && activeTab === 'pending' && (
        <div style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '12px 16px', margin: '16px', borderRadius: '12px' }}>
          <p style={{ color: '#92400e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BellOff size={16} /> Você está offline. Ative o modo online para receber pedidos.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '0 12px' : '0 24px', marginTop: '16px' }}>
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb' }}>
          <button onClick={() => setActiveTab('pending')} style={{ padding: isMobile ? '10px 16px' : '12px 24px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? '14px' : '15px', color: activeTab === 'pending' ? '#f59e0b' : '#6b7280', borderBottom: activeTab === 'pending' ? '2px solid #f59e0b' : 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={isMobile ? 14 : 16} /> Pedidos {pendingOrders.length > 0 && <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', marginLeft: '4px' }}>{pendingOrders.length}</span>}
          </button>
          <button onClick={() => setActiveTab('history')} style={{ padding: isMobile ? '10px 16px' : '12px 24px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? '14px' : '15px', color: activeTab === 'history' ? '#f59e0b' : '#6b7280', borderBottom: activeTab === 'history' ? '2px solid #f59e0b' : 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <History size={isMobile ? 14 : 16} /> Histórico
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
        {activeTab === 'pending' ? (
          pendingOrders.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '20px', padding: isMobile ? '40px 20px' : '60px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
              <Navigation size={isMobile ? 48 : 64} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
              <p style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 500, color: '#6b7280' }}>Nenhum pedido no momento</p>
              <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>Aguardando clientes solicitarem corrida...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingOrders.map((order) => (
                <div key={order.id} style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{order.customer_name || 'Cliente'}</p>
                      <p style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <Phone size={12} /> {order.customer_phone || 'Sem telefone'}
                      </p>
                    </div>
                    <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px 14px', borderRadius: '30px', fontWeight: 'bold', fontSize: '16px' }}>
                      {order.price?.toLocaleString()} Kz
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '20px', background: '#f9fafb', padding: '12px', borderRadius: '12px' }}>
                    <p style={{ display: 'flex', gap: '8px', fontSize: '13px', marginBottom: '8px' }}>
                      <MapPin size={14} color="#10b981" style={{ flexShrink: 0 }} />
                      <span><strong>Origem:</strong> {order.pickup_address || 'Não informado'}</span>
                    </p>
                    <p style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                      <MapPin size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                      <span><strong>Destino:</strong> {order.dropoff_address || 'Não informado'}</span>
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => acceptOrder(order)} disabled={!isOnline} style={{ flex: 1, background: isOnline ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : '#d1d5db', color: 'white', padding: '14px', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: isOnline ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <CheckCircle size={18} /> Aceitar
                    </button>
                    <button onClick={() => cancelOrder(order)} style={{ flex: 1, background: '#ef4444', color: 'white', padding: '14px', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <XCircle size={18} /> Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          completedOrders.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '20px', padding: isMobile ? '40px 20px' : '60px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
              <History size={isMobile ? 48 : 64} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
              <p style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 500, color: '#6b7280' }}>Nenhum pedido no histórico</p>
              <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>Os pedidos aceitos aparecerão aqui</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {completedOrders.map((order) => (
                <div key={order.id} style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>{order.customer_name || 'Cliente'}</p>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{order.customer_phone || 'Sem telefone'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {getStatusBadge(order.status)}
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginTop: '8px' }}>{order.price?.toLocaleString()} Kz</p>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '16px', background: '#f9fafb', padding: '12px', borderRadius: '12px' }}>
                    <p style={{ display: 'flex', gap: '8px', fontSize: '12px', marginBottom: '6px' }}>
                      <MapPin size={12} color="#10b981" style={{ flexShrink: 0 }} />
                      <span><strong>Origem:</strong> {order.pickup_address || 'Não informado'}</span>
                    </p>
                    <p style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                      <MapPin size={12} color="#ef4444" style={{ flexShrink: 0 }} />
                      <span><strong>Destino:</strong> {order.dropoff_address || 'Não informado'}</span>
                    </p>
                  </div>
                  
                  <div style={{ fontSize: '11px', color: '#9ca3af', borderTop: '1px solid #f0f0f0', paddingTop: '12px', marginBottom: order.status === 'accepted' ? '0' : '0' }}>
                    📅 {new Date(order.created_at).toLocaleString()}
                  </div>
                  
                  {order.status === 'accepted' && (
                    <button onClick={() => completeOrder(order)} style={{ width: '100%', marginTop: '16px', background: '#10b981', color: 'white', padding: '12px', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <CheckSquare size={16} /> Confirmar Conclusão
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modal de Editar Perfil */}
      {showEditProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
              padding: '20px',
              borderRadius: '24px 24px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white'
            }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '18px' }}>Editar Perfil</h3>
              <button onClick={() => setShowEditProfile(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const name = (form.elements.namedItem('name') as HTMLInputElement).value
              const phone = (form.elements.namedItem('phone') as HTMLInputElement).value
              const bi = (form.elements.namedItem('bi') as HTMLInputElement).value
              const password = (form.elements.namedItem('password') as HTMLInputElement).value
              
              const photoFile = (form.elements.namedItem('photo') as HTMLInputElement).files?.[0]
              let photoUrl = rider.photo_url
              
              if (photoFile) {
                const fileExt = photoFile.name.split('.').pop()
                const fileName = `${rider.id}-${Date.now()}.${fileExt}`
                const filePath = `riders/${fileName}`
                
                const { error: uploadError } = await supabase.storage
                  .from('rider-photos')
                  .upload(filePath, photoFile)
                
                if (!uploadError) {
                  const { data: { publicUrl } } = supabase.storage
                    .from('rider-photos')
                    .getPublicUrl(filePath)
                  photoUrl = publicUrl
                }
              }
              
              const updateData: any = { name, phone, bi }
              if (password) updateData.password_hash = password
              if (photoUrl !== rider.photo_url) updateData.photo_url = photoUrl
              
              const { error } = await supabase.from('riders').update(updateData).eq('id', rider.id)
              if (!error) {
                alert('✅ Perfil atualizado com sucesso!')
                setShowEditProfile(false)
                const riderId = localStorage.getItem('rider_id')
                if (riderId) loadRider(riderId)
              } else {
                alert('Erro ao atualizar: ' + error.message)
              }
            }} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <img src={rider?.photo_url || 'https://via.placeholder.com/96'} alt="Foto" style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fcd34d' }} />
                  <label style={{ position: 'absolute', bottom: 0, right: 0, background: '#f59e0b', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}>
                    <Camera size={16} color="white" />
                    <input type="file" name="photo" accept="image/*" style={{ display: 'none' }} />
                  </label>
                </div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>Clique na câmera para trocar a foto</p>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Nome</label>
                <input type="text" name="name" defaultValue={rider.name} required style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Telefone</label>
                <input type="tel" name="phone" defaultValue={rider.phone} required style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>BI</label>
                <input type="text" name="bi" defaultValue={rider.bi} required style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Nova Senha (opcional)</label>
                <input type="password" name="password" placeholder="Deixe em branco para manter" style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowEditProfile(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: 'white', fontWeight: 500 }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          input, button, select {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}

// Funções auxiliares
function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

async function requestNotificationPermission() {
  if (!isNotificationSupported()) return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js')
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
}