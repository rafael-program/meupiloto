// app/dashboard/motoqueiro/page.tsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Power, Phone, MapPin, Navigation, CheckCircle, LogOut, Bell, History, Clock, CheckSquare, XCircle,
  User, Wallet, Star, BellRing, BellOff, Edit, Camera, Loader2, X
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
  const router = useRouter()
  const channelRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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
    }, 5000) // Atualiza a cada 5 segundos
    
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
    
    // Carregar localização do cliente
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
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium"><Clock className="w-3 h-3 inline mr-1" /> Pendente</span>
      case 'accepted': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"><CheckCircle className="w-3 h-3 inline mr-1" /> Em rota</span>
      case 'completed': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"><CheckSquare className="w-3 h-3 inline mr-1" /> Concluído</span>
      default: return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">Cancelado</span>
    }
  }

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'order': return <BellRing className="w-4 h-4 text-amber-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Bell className="w-4 h-4 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-red-50">
        <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div><p className="text-gray-600">Carregando dashboard...</p></div>
      </div>
    )
  }

  // Tela do mapa com navegação
  // app/dashboard/motoqueiro/page.tsx - Adicione estas melhorias

// Na tela do mapa, adicione mais informações e botões
if (showMap && selectedOrder) {
  const center = riderLocation || customerLocation || { lat: -8.8383, lng: 13.2344 }
  
  // Calcular distância aproximada (fórmula de Haversine simplificada)
  const calculateDistance = () => {
    if (!riderLocation || !customerLocation) return null
    const R = 6371 // Raio da Terra em km
    const dLat = (customerLocation.lat - riderLocation.lat) * Math.PI / 180
    const dLon = (customerLocation.lng - riderLocation.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(riderLocation.lat * Math.PI / 180) * Math.cos(customerLocation.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return (R * c).toFixed(1)
  }
  
  const distance = calculateDistance()
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => { setShowMap(false); stopLocationTracking(); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <XCircle className="w-5 h-5" /> Fechar
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Em Rota</h1>
                <p className="text-gray-600 text-sm">{selectedOrder.customer_name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => window.location.href = `tel:${selectedOrder.customer_phone}`} 
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition"
              >
                <Phone className="w-4 h-4" /> Ligar Cliente
              </button>
              <button 
                onClick={() => completeOrder(selectedOrder)} 
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition"
              >
                <CheckCircle className="w-4 h-4" /> Concluir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl overflow-hidden shadow-lg">
          <div style={{ height: '500px', width: '100%' }}>
            <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              {customerLocation && (
                <Marker position={[customerLocation.lat, customerLocation.lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong>📍 Cliente</strong>
                      <p>{selectedOrder.customer_name}</p>
                      <p>{selectedOrder.pickup_address || 'Ponto de partida'}</p>
                      <button 
                        onClick={() => window.location.href = `tel:${selectedOrder.customer_phone}`}
                        className="mt-2 bg-green-500 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        <Phone className="w-3 h-3 inline mr-1" /> Ligar
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )}
              {riderLocation && (
                <Marker position={[riderLocation.lat, riderLocation.lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong>🏍️ Você está aqui</strong>
                      <p>Rumo ao cliente</p>
                      {distance && <p className="text-sm text-blue-600">Distância: {distance} km</p>}
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-xl p-4 shadow">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-medium">{selectedOrder.customer_name}</p>
              <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Destino</p>
              <p className="font-medium">{selectedOrder.dropoff_address || 'Não informado'}</p>
            </div>
          </div>
          
          {distance && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Distância até o cliente: <strong>{distance} km</strong>
              </p>
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t flex gap-2">
            <button 
              onClick={() => window.open(`https://www.google.com/maps/dir/${riderLocation?.lat || -8.8383},${riderLocation?.lng || 13.2344}/${customerLocation?.lat || -8.8383},${customerLocation?.lng || 13.2344}`, '_blank')}
              className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-amber-600 transition"
            >
              <Navigation className="w-5 h-5" /> Abrir no Google Maps
            </button>
            <button 
              onClick={() => window.location.href = `tel:${selectedOrder.customer_phone}`}
              className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition"
            >
              <Phone className="w-5 h-5" /> Ligar Cliente
            </button>
          </div>
        </div>
        
        {/* Botão para quando chegar ao destino */}
        <div className="mt-4">
          <button 
            onClick={() => {
              if (confirm(`✅ Confirma que chegou ao destino de ${selectedOrder.customer_name}?`)) {
                completeOrder(selectedOrder)
              }
            }}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:from-green-600 hover:to-emerald-700 transition shadow-lg"
          >
            <CheckCircle className="w-6 h-6" />
            CHEGUEI AO DESTINO - CONCLUIR CORRIDA
          </button>
        </div>
      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {rider?.photo_url ? <img src={rider.photo_url} alt={rider.name} className="w-12 h-12 rounded-full object-cover border-2 border-amber-500" /> : <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-red-500 rounded-full flex items-center justify-center"><User className="w-6 h-6 text-white" /></div>}
              <div><h1 className="text-xl font-bold text-gray-900">{rider?.name}</h1><p className="text-gray-600 text-sm">{rider?.plate?.plate_number || 'Placa não definida'}</p></div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowEditProfile(true)} className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition bg-blue-500 text-white hover:bg-blue-600 shadow-md"><Edit className="w-4 h-4" /> Editar Perfil</button>
              {isNotificationSupported() && pushPermission === 'default' && <button onClick={requestPushPermission} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-full"><Bell className="w-4 h-4" /> Ativar Notificações</button>}
              {isNotificationSupported() && pushPermission === 'granted' && <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full"><BellRing className="w-4 h-4" /> Notificações ativas</div>}
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 rounded-full"><Bell className="w-5 h-5 text-gray-600" />{unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>}</button>
                {showNotifications && <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border z-20"><div className="p-3 border-b flex justify-between items-center"><h3 className="font-semibold">Notificações</h3>{unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs text-blue-500">Marcar todas como lidas</button>}</div><div className="max-h-96 overflow-y-auto">{notifications.length === 0 ? <p className="p-4 text-center text-gray-500">Sem notificações</p> : notifications.map((notif) => (<div key={notif.id} className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notif.is_read ? 'bg-blue-50' : ''}`} onClick={() => markNotificationAsRead(notif.id)}><div className="flex items-start gap-2">{getNotificationIcon(notif.type)}<div className="flex-1"><p className="font-medium text-sm">{notif.title}</p><p className="text-xs text-gray-500">{notif.message}</p><p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleTimeString()}</p></div>{!notif.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}</div></div>))}</div></div>}
              </div>
              <button onClick={toggleOnline} className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-md ${isOnline ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}><Power className="w-4 h-4" /> {isOnline ? 'Online' : 'Offline'}</button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold bg-red-500 text-white hover:bg-red-600 shadow-md"><LogOut className="w-4 h-4" /> Sair</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-3 text-white"><Wallet className="w-5 h-5 mb-1 opacity-80" /><p className="text-lg font-bold">{stats.totalEarnings.toLocaleString()} Kz</p><p className="text-xs opacity-80">Total ganho</p></div>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3 text-white"><Navigation className="w-5 h-5 mb-1 opacity-80" /><p className="text-lg font-bold">{stats.totalRides}</p><p className="text-xs opacity-80">Corridas</p></div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3 text-white"><Star className="w-5 h-5 mb-1 opacity-80" /><p className="text-lg font-bold">{stats.rating}</p><p className="text-xs opacity-80">Avaliação</p></div>
          </div>
        </div>
      </div>

      {!isOnline && activeTab === 'pending' && <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-4 rounded"><p className="text-yellow-700"><BellOff className="w-4 h-4 inline mr-2" /> Você está offline. Ative o modo online para receber pedidos.</p></div>}

      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex gap-2 border-b border-gray-200">
          <button onClick={() => setActiveTab('pending')} className={`px-6 py-3 font-semibold flex items-center gap-2 ${activeTab === 'pending' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-600'}`}><Phone className="w-4 h-4" /> Pedidos {pendingOrders.length > 0 && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs ml-1">{pendingOrders.length}</span>}</button>
          <button onClick={() => setActiveTab('history')} className={`px-6 py-3 font-semibold flex items-center gap-2 ${activeTab === 'history' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-600'}`}><History className="w-4 h-4" /> Histórico</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {activeTab === 'pending' ? (
          pendingOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500"><Navigation className="w-16 h-16 mx-auto mb-4 text-gray-400" /><p className="text-lg font-medium">Nenhum pedido no momento</p><p className="text-sm">Aguardando clientes solicitarem corrida...</p></div>
          ) : (
            <div className="space-y-4">{pendingOrders.map((order) => (<div key={order.id} className="bg-white rounded-xl p-5 shadow-md"><div className="flex justify-between items-start mb-4"><div><p className="font-semibold text-lg">{order.customer_name || 'Cliente'}</p><p className="text-gray-500 text-sm"><Phone className="w-3 h-3 inline mr-1" />{order.customer_phone || 'Sem telefone'}</p></div><div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">{order.price?.toLocaleString()} Kz</div></div><div className="space-y-2 mb-4"><p className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 mt-0.5 text-green-600" /><span><strong>Origem:</strong> {order.pickup_address || 'Não informado'}</span></p><p className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 mt-0.5 text-red-600" /><span><strong>Destino:</strong> {order.dropoff_address || 'Não informado'}</span></p></div><div className="flex gap-3"><button onClick={() => acceptOrder(order)} disabled={!isOnline} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> Aceitar</button><button onClick={() => cancelOrder(order)} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 flex items-center justify-center gap-2"><XCircle className="w-5 h-5" /> Recusar</button></div></div>))}</div>
          )
        ) : (
          completedOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500"><History className="w-16 h-16 mx-auto mb-4 text-gray-400" /><p className="text-lg font-medium">Nenhum pedido no histórico</p><p className="text-sm">Os pedidos aceitos aparecerão aqui</p></div>
          ) : (
            <div className="space-y-4">{completedOrders.map((order) => (<div key={order.id} className="bg-white rounded-xl p-5 shadow-md"><div className="flex justify-between items-start mb-4"><div><p className="font-semibold text-lg">{order.customer_name || 'Cliente'}</p><p className="text-gray-500 text-sm">{order.customer_phone || 'Sem telefone'}</p></div><div className="text-right">{getStatusBadge(order.status)}<p className="text-sm font-semibold mt-1">{order.price?.toLocaleString()} Kz</p></div></div><div className="space-y-2 mb-4"><p className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 mt-0.5 text-green-600" /><span><strong>Origem:</strong> {order.pickup_address || 'Não informado'}</span></p><p className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 mt-0.5 text-red-600" /><span><strong>Destino:</strong> {order.dropoff_address || 'Não informado'}</span></p></div><div className="text-xs text-gray-400 border-t pt-3"><span>Solicitado: {new Date(order.created_at).toLocaleString()}</span></div>{order.status === 'accepted' && <button onClick={() => completeOrder(order)} className="w-full mt-4 bg-green-500 text-white py-2.5 rounded-xl font-semibold hover:bg-green-600 flex items-center justify-center gap-2"><CheckSquare className="w-4 h-4" /> Confirmar Conclusão</button>}</div>))}</div>
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
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            maxWidth: '28rem',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              padding: '1rem',
              borderRadius: '1rem 1rem 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white',
              position: 'sticky',
              top: 0
            }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Editar Perfil</h3>
              <button onClick={() => setShowEditProfile(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
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
            }} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <img src={rider?.photo_url || 'https://via.placeholder.com/96'} alt="Foto do perfil" style={{ width: '6rem', height: '6rem', borderRadius: '9999px', objectFit: 'cover', border: '4px solid #fcd34d' }} />
                  <label style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#f59e0b', borderRadius: '9999px', padding: '0.375rem', cursor: 'pointer' }}>
                    <Camera size={16} color="white" />
                    <input type="file" name="photo" accept="image/*" style={{ display: 'none' }} />
                  </label>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>Clique na câmera para trocar a foto</p>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Nome</label>
                <input type="text" name="name" defaultValue={rider.name} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Telefone</label>
                <input type="tel" name="phone" defaultValue={rider.phone} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>BI</label>
                <input type="text" name="bi" defaultValue={rider.bi} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Nova Senha (opcional)</label>
                <input type="password" name="password" style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="Deixe em branco para manter a atual" />
              </div>
              
              <button type="submit" style={{ width: '100%', backgroundColor: '#f59e0b', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}
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