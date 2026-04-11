// app/dashboard/motoqueiro/page.tsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Power, 
  Phone, 
  MapPin, 
  Navigation, 
  CheckCircle, 
  LogOut, 
  Bell, 
  History, 
  Clock, 
  CheckSquare, 
  XCircle,
  User,
  Wallet,
  Star,
  BellRing,
  BellOff
} from 'lucide-react'
import { 
  requestNotificationPermission, 
  getNotificationPermissionStatus,
  isNotificationSupported,
  registerServiceWorker
} from '@/lib/notifications'

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
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalRides: 0,
    rating: 4.8
  })
  const router = useRouter()
  const channelRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      audioRef.current = new Audio('/notification.mp3')
    }

    const riderId = localStorage.getItem('rider_id')
    if (!riderId) {
      router.push('/login/motoqueiro')
      return
    }
    
    // Verificar permissão de notificação
    if (isNotificationSupported()) {
      setPushPermission(Notification.permission)
      registerServiceWorker()
    }
    
    loadRider(riderId)
    loadPendingOrders(riderId)
    loadCompletedOrders(riderId)
    loadNotifications(riderId)
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }
    
    channelRef.current = subscribeToOrders(riderId)
    
    // Perguntar sobre notificações após 5 segundos
    const timer = setTimeout(() => {
      if (isNotificationSupported() && Notification.permission === 'default') {
        const ask = confirm('🔔 Quer receber notificações de novos pedidos mesmo com o app fechado?')
        if (ask) {
          requestNotificationPermission()
          setPushPermission('granted')
        }
      }
    }, 5000)
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      clearTimeout(timer)
    }
  }, [])

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => console.log('Áudio não suportado'))
    }
  }

  const sendPushNotification = (title: string, body: string) => {
    if (!isNotificationSupported()) return
    if (Notification.permission !== 'granted') return

    try {
      const notification = new Notification(title, {
        body: body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        
        requireInteraction: true,
      })
      
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      
      setTimeout(() => notification.close(), 15000)
    } catch (error) {
      console.error('Erro na notificação push:', error)
    }
  }

  const loadRider = async (riderId: string) => {
    const { data } = await supabase
      .from('riders')
      .select('*, plate:plates(plate_number)')
      .eq('id', riderId)
      .single()
    
    if (data) {
      setRider(data)
      setIsOnline(data.is_online || false)
    }
    setLoading(false)
  }

  const loadPendingOrders = async (riderId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('rider_id', riderId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (data) setPendingOrders(data)
  }

  const loadCompletedOrders = async (riderId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('rider_id', riderId)
      .in('status', ['accepted', 'completed', 'cancelled'])
      .order('created_at', { ascending: false })
    
    if (data) {
      setCompletedOrders(data)
      
      const completed = data.filter(o => o.status === 'completed')
      const totalEarnings = completed.reduce((sum, o) => sum + (o.price || 0), 0)
      setStats({
        totalEarnings,
        totalRides: completed.length,
        rating: 4.8
      })
    }
  }

  const loadNotifications = async (riderId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('rider_id', riderId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    
    for (const id of unreadIds) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
    }
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const addNotification = async (title: string, message: string, type: string) => {
    if (!rider?.id) return
    
    const { data } = await supabase
      .from('notifications')
      .insert({
        rider_id: rider.id,
        title,
        message,
        type,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (data) {
      setNotifications(prev => [data, ...prev])
      setUnreadCount(prev => prev + 1)
      playSound()
      sendPushNotification(title, message)
    }
  }

  const toggleOnline = async () => {
    if (!rider?.id) return
    
    const newStatus = !isOnline
    const { error } = await supabase
      .from('riders')
      .update({ is_online: newStatus })
      .eq('id', rider.id)

    if (!error) {
      setIsOnline(newStatus)
      if (newStatus) {
        await addNotification(
          'Status Online',
          'Você está online e disponível para receber pedidos',
          'info'
        )
        sendPushNotification('MeuPiloto! - Online', 'Você está online e disponível para receber pedidos')
      } else {
        await addNotification(
          'Status Offline',
          'Você está offline. Não receberá novos pedidos',
          'info'
        )
      }
    }
  }

  const subscribeToOrders = (riderId: string) => {
    const channel = supabase
      .channel(`orders-${riderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `rider_id=eq.${riderId}`
        },
        async (payload) => {
          const newOrder = payload.new as any
          setPendingOrders((prev) => [newOrder, ...prev])
          
          const message = `${newOrder.customer_name || 'Cliente'} solicitou uma corrida de ${newOrder.price?.toLocaleString()} Kz`
          
          await addNotification('Novo Pedido! 🚀', message, 'order')
          playSound()
          
          // Notificação push mesmo com app fechado
          if (Notification.permission === 'granted') {
            const notification = new Notification('🏍️ MeuPiloto! - Novo Pedido', {
              body: `${newOrder.customer_name || 'Cliente'} - ${newOrder.price?.toLocaleString()} Kz`,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              
              requireInteraction: true,
            })
            
            notification.onclick = () => {
              window.focus()
              notification.close()
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `rider_id=eq.${riderId}`
        },
        (payload) => {
          const updatedOrder = payload.new as any
          
          if (updatedOrder.status === 'accepted') {
            addNotification(
              'Pedido Aceito ✅',
              `Você aceitou a corrida de ${updatedOrder.customer_name}`,
              'success'
            )
          } else if (updatedOrder.status === 'completed') {
            addNotification(
              'Corrida Concluída 🎉',
              `Corrida de ${updatedOrder.customer_name} concluída! Ganhou ${updatedOrder.price?.toLocaleString()} Kz`,
              'success'
            )
          } else if (updatedOrder.status === 'cancelled') {
            addNotification(
              'Pedido Cancelado ❌',
              `Pedido de ${updatedOrder.customer_name} foi cancelado`,
              'alert'
            )
          }
          
          if (updatedOrder.status === 'accepted' || updatedOrder.status === 'completed') {
            setPendingOrders(prev => prev.filter(o => o.id !== updatedOrder.id))
          }
          
          setCompletedOrders(prev => {
            const exists = prev.find(o => o.id === updatedOrder.id)
            if (exists) {
              return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o)
            } else if (updatedOrder.status !== 'pending') {
              return [updatedOrder, ...prev]
            }
            return prev
          })
        }
      )
      .subscribe()
    
    return channel
  }

  const requestPushPermission = async () => {
    const granted = await requestNotificationPermission()
    setPushPermission(granted ? 'granted' : 'denied')
    if (granted) {
      await addNotification(
        'Notificações Ativadas ✅',
        'Você receberá notificações mesmo com o app fechado!',
        'success'
      )
    }
  }

  const acceptOrder = async (order: any) => {
    if (!isOnline) {
      alert('⚠️ Você precisa estar online para aceitar pedidos!')
      return
    }

    if (!rider?.id) {
      alert('❌ Sessão expirada. Faça login novamente.')
      router.push('/login/motoqueiro')
      return
    }

    console.log('📝 Aceitando pedido:', { orderId: order.id, riderId: rider.id })

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'accepted' })
        .eq('id', order.id)
        .eq('rider_id', rider.id)
        .select()

      if (error) {
        console.error('❌ Erro:', error)
        alert('Erro ao aceitar pedido: ' + error.message)
        return
      }

      if (!data || data.length === 0) {
        console.error('❌ Nenhum pedido atualizado')
        alert('Não foi possível aceitar o pedido. Tente novamente.')
        return
      }

      console.log('✅ Pedido aceito:', data)
      
      setPendingOrders(prev => prev.filter(o => o.id !== order.id))
      
      await addNotification(
        'Pedido Aceito ✅',
        `Você aceitou a corrida de ${order.customer_name}`,
        'success'
      )
      
      if (order.customer_phone) {
        const ligar = confirm(`📞 Pedido aceito! Deseja ligar para ${order.customer_name} (${order.customer_phone})?`)
        if (ligar) {
          window.location.href = `tel:${order.customer_phone}`
        }
      }
    } catch (err) {
      console.error('❌ Erro inesperado:', err)
      alert('Erro inesperado ao aceitar pedido')
    }
  }

  const completeOrder = async (order: any) => {
    if (!rider?.id) return
    
    if (confirm(`✅ Confirmar conclusão da entrega para ${order.customer_name}?`)) {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id)
        .eq('rider_id', rider.id)
      
      if (!error) {
        setCompletedOrders(prev => 
          prev.map(o => o.id === order.id ? { ...o, status: 'completed' } : o)
        )
        setStats(prev => ({
          ...prev,
          totalEarnings: prev.totalEarnings + (order.price || 0),
          totalRides: prev.totalRides + 1
        }))
        await addNotification(
          'Corrida Concluída 🎉',
          `Corrida de ${order.customer_name} concluída! Ganhou ${order.price?.toLocaleString()} Kz`,
          'success'
        )
      }
    }
  }

  const cancelOrder = async (order: any) => {
    if (!rider?.id) return
    
    if (confirm(`❌ Cancelar pedido de ${order.customer_name}?`)) {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)
        .eq('rider_id', rider.id)
      
      if (!error) {
        setPendingOrders(prev => prev.filter(o => o.id !== order.id))
        await addNotification(
          'Pedido Cancelado ❌',
          `Pedido de ${order.customer_name} foi cancelado`,
          'alert'
        )
      }
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/login/motoqueiro')
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pendente</span>
      case 'accepted':
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Em rota</span>
      case 'completed':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><CheckSquare className="w-3 h-3" /> Concluído</span>
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelado</span>
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">{status}</span>
    }
  }

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'order': return <BellRing className="w-4 h-4 text-amber-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'alert': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Bell className="w-4 h-4 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {rider?.photo_url ? (
                <img 
                  src={rider.photo_url} 
                  alt={rider.name} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-red-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{rider?.name}</h1>
                <p className="text-gray-600 text-sm">
                  {rider?.plate?.plate_number || 'Placa não definida'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
  {/* Botão de Notificações Push */}
  {isNotificationSupported() && pushPermission === 'default' && (
    <button
      onClick={requestPushPermission}
      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition"
    >
      <Bell className="w-4 h-4" />
      Ativar Notificações
    </button>
  )}
  {isNotificationSupported() && pushPermission === 'granted' && (
    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
      <BellRing className="w-4 h-4" />
      Notificações ativas
    </div>
  )}
  {isNotificationSupported() && pushPermission === 'denied' && (
    <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-full">
      <BellOff className="w-4 h-4" />
      Notificações bloqueadas
    </div>
  )}

  {/* Botão de Notificações do Sistema (sino) */}
  <div className="relative">
    <button
      onClick={() => setShowNotifications(!showNotifications)}
      className="relative p-2 hover:bg-gray-100 rounded-full transition"
    >
      <Bell className="w-5 h-5 text-gray-600" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
    
    {showNotifications && (
      <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border z-20">
        <div className="p-3 border-b flex justify-between items-center">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-gray-500">Sem notificações</p>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition ${!notif.is_read ? 'bg-blue-50' : ''}`}
                onClick={() => markNotificationAsRead(notif.id)}
              >
                <div className="flex items-start gap-2">
                  {getNotificationIcon(notif.type)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-gray-500">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )}
  </div>

  {/* Botão Online/Offline */}
  <button
    onClick={toggleOnline}
    className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition shadow-md ${
      isOnline 
        ? 'bg-green-500 text-white hover:bg-green-600' 
        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
    }`}
  >
    <Power className="w-4 h-4" />
    {isOnline ? 'Online' : 'Offline'}
  </button>
  
  {/* Botão Sair */}
  <button
    onClick={handleLogout}
    className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition bg-red-500 text-white hover:bg-red-600 shadow-md"
  >
    <LogOut className="w-4 h-4" />
    Sair
  </button>
</div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-3 text-white">
              <Wallet className="w-5 h-5 mb-1 opacity-80" />
              <p className="text-lg font-bold">{stats.totalEarnings.toLocaleString()} Kz</p>
              <p className="text-xs opacity-80">Total ganho</p>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3 text-white">
              <Navigation className="w-5 h-5 mb-1 opacity-80" />
              <p className="text-lg font-bold">{stats.totalRides}</p>
              <p className="text-xs opacity-80">Corridas</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3 text-white">
              <Star className="w-5 h-5 mb-1 opacity-80" />
              <p className="text-lg font-bold">{stats.rating}</p>
              <p className="text-xs opacity-80">Avaliação</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {!isOnline && activeTab === 'pending' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-4 rounded shadow-sm">
          <p className="text-yellow-700 flex items-center gap-2">
            <BellOff className="w-4 h-4" />
            Você está offline. Ative o modo online para receber pedidos.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-amber-600'
            }`}
          >
            <Phone className="w-4 h-4" />
            Pedidos
            {pendingOrders.length > 0 && (
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs ml-1">
                {pendingOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-amber-600'
            }`}
          >
            <History className="w-4 h-4" />
            Histórico
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto p-4">
        {activeTab === 'pending' ? (
          <>
            {pendingOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm">
                <Navigation className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Nenhum pedido no momento</p>
                <p className="text-sm">Aguardando clientes solicitarem corrida...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold text-lg">{order.customer_name || 'Cliente'}</p>
                        <p className="text-gray-500 text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.customer_phone || 'Sem telefone'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                          {order.price?.toLocaleString()} Kz
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4 text-gray-700">
                      <p className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5 text-green-600" />
                        <span><strong>Origem:</strong> {order.pickup_address || 'Não informado'}</span>
                      </p>
                      <p className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5 text-red-600" />
                        <span><strong>Destino:</strong> {order.dropoff_address || 'Não informado'}</span>
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => acceptOrder(order)}
                        className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2"
                        disabled={!isOnline}
                      >
                        <CheckCircle className="w-5 h-5" />
                        Aceitar
                      </button>
                      <button
                        onClick={() => cancelOrder(order)}
                        className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {completedOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm">
                <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Nenhum pedido no histórico</p>
                <p className="text-sm">Os pedidos aceitos aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl p-5 shadow-md">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold text-lg">{order.customer_name || 'Cliente'}</p>
                        <p className="text-gray-500 text-sm">{order.customer_phone || 'Sem telefone'}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(order.status)}
                        <p className="text-sm font-semibold text-gray-700 mt-1">
                          {order.price?.toLocaleString()} Kz
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4 text-gray-700">
                      <p className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5 text-green-600" />
                        <span><strong>Origem:</strong> {order.pickup_address || 'Não informado'}</span>
                      </p>
                      <p className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5 text-red-600" />
                        <span><strong>Destino:</strong> {order.dropoff_address || 'Não informado'}</span>
                      </p>
                    </div>

                    <div className="text-xs text-gray-400 border-t pt-3 flex justify-between">
                      <span>Solicitado: {new Date(order.created_at).toLocaleString()}</span>
                    </div>

                    {order.status === 'accepted' && (
                      <button
                        onClick={() => completeOrder(order)}
                        className="w-full mt-4 bg-green-500 text-white py-2.5 rounded-xl font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Confirmar Conclusão
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}