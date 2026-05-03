'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Clock, Phone, CheckCircle, XCircle, AlertCircle, 
  Search, RefreshCw, LogOut, Menu, X, 
  TrendingUp, DollarSign, UserCheck, Shield, Eye,
  Timer, Bell, AlertTriangle, Zap, Store, Headphones,
  Plus, Edit, Trash2, UserPlus, UserX, Snowflake, Sun, Bike, MapPin
} from 'lucide-react'

type Order = {
  id: string
  customer_name: string
  customer_phone: string
  price: number
  status: 'pending' | 'pending_call' | 'accepted' | 'completed' | 'cancelled'
  created_at: string
  accepted_at: string | null
  expires_at: string | null
  notification_sent: boolean
  response_time: number | null
  rider_id: string
  plate_id: string
  pickup_address?: string
  dropoff_address?: string
  is_call_order?: boolean
  rider?: {
    id: string
    name: string
    phone: string
    is_online: boolean
    photo_url?: string
    has_smartphone?: boolean
    accepts_calls?: boolean
  }
  plate?: {
    plate_number: string
  }
}

type Rider = {
  id: string
  name: string
  phone: string
  bi: string
  plate_id: string | null
  is_online: boolean
  status: string
  is_frozen: boolean
  frozen_reason: string | null
  frozen_at: string | null
  created_at: string
  plate?: { plate_number: string }
}

type AssignedPlate = {
  id: string
  plate_number: string
}

export default function OperadorDashboard() {
  const router = useRouter()
  const [operador, setOperador] = useState<any>(null)
  const [assignedPlates, setAssignedPlates] = useState<AssignedPlate[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [timeLeft, setTimeLeft] = useState<Record<string, number>>({})
  const [expiredOrders, setExpiredOrders] = useState<Set<string>>(new Set())
  const [timeLimit, setTimeLimit] = useState<number>(5)
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedOrderForConfirm, setSelectedOrderForConfirm] = useState<Order | null>(null)
  
  // Estados para gestão de motoqueiros
  const [showAddRiderModal, setShowAddRiderModal] = useState(false)
  const [showEditRiderModal, setShowEditRiderModal] = useState(false)
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null)
  const [riderFormData, setRiderFormData] = useState({ name: '', phone: '', bi: '', password: '', plate_id: '' })
  const [riderFilter, setRiderFilter] = useState<string>('all')
  const [riderLoading, setRiderLoading] = useState(false)

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    pendingCall: 0,
    accepted: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    expiredOrders: 0
  })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const operadorId = localStorage.getItem('operador_id')
    if (!operadorId) {
      router.push('/login/operador')
      return
    }
    loadOperador(operadorId)
    loadAssignedPlates(operadorId)
    loadRiders(operadorId)
    
    const savedTimeLimit = localStorage.getItem('timeLimit')
    if (savedTimeLimit) {
      setTimeLimit(parseInt(savedTimeLimit))
    }
    
    const subscription = supabase
      .channel('orders_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        const operadorId = localStorage.getItem('operador_id')
        if (operadorId) loadAssignedPlates(operadorId)
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      updateTimers()
    }, 1000)
    return () => clearInterval(interval)
  }, [orders])

  const updateTimers = () => {
    const newTimeLeft: Record<string, number> = {}
    const newExpiredOrders = new Set<string>()
    const now = new Date().getTime()
    
    orders.forEach(order => {
      if ((order.status === 'pending' || order.status === 'pending_call') && order.expires_at) {
        const expiresAt = new Date(order.expires_at).getTime()
        const diff = Math.max(0, Math.floor((expiresAt - now) / 1000))
        
        newTimeLeft[order.id] = diff
        
        if (diff === 0) {
          newExpiredOrders.add(order.id)
          if (!order.notification_sent) {
            markNotificationSent(order.id)
          }
        }
      }
    })
    
    setTimeLeft(newTimeLeft)
    setExpiredOrders(newExpiredOrders)
  }

  const markNotificationSent = async (orderId: string) => {
    await supabase
      .from('orders')
      .update({ notification_sent: true })
      .eq('id', orderId)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = (seconds: number) => {
    if (seconds <= 60) return '#dc2626'
    if (seconds <= 120) return '#f59e0b'
    return '#10b981'
  }

  const loadOperador = async (operadorId: string) => {
    const { data } = await supabase
      .from('operadores')
      .select('*')
      .eq('id', operadorId)
      .single()
    setOperador(data)
  }

  const loadRiders = async (operadorId: string) => {
    // Buscar placas do operador
    const { data: platesData } = await supabase
      .from('plates')
      .select('id')
      .eq('operador_id', operadorId)
    
    const plateIds = platesData?.map(p => p.id) || []
    
    if (plateIds.length === 0) {
      setRiders([])
      return
    }
    
    const { data: ridersData } = await supabase
      .from('riders')
      .select('*, plate:plates(plate_number)')
      .in('plate_id', plateIds)
      .order('created_at', { ascending: false })
    
    setRiders(ridersData || [])
  }

  const loadAssignedPlates = async (operadorId: string) => {
    setLoading(true)
    
    const { data: platesData } = await supabase
      .from('plates')
      .select('id, plate_number')
      .eq('operador_id', operadorId)
    
    setAssignedPlates(platesData || [])
    
    const plateIds = platesData?.map(p => p.id) || []
    
    if (plateIds.length === 0) {
      setOrders([])
      setStats({
        total: 0,
        pending: 0,
        pendingCall: 0,
        accepted: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0,
        expiredOrders: 0
      })
      setLoading(false)
      return
    }
    
    const { data: ordersData } = await supabase
      .from('orders')
      .select(`
        *,
        rider:riders (
          id,
          name,
          phone,
          is_online,
          photo_url,
          has_smartphone,
          accepts_calls
        ),
        plate:plates (
          plate_number
        )
      `)
      .in('plate_id', plateIds)
      .order('created_at', { ascending: false })
    
    const ordersList = ordersData || []
    setOrders(ordersList)
    
    const pendingOrdersOnly = ordersList.filter((o: Order) => o.status === 'pending')
    const pendingCallOrders = ordersList.filter((o: Order) => o.status === 'pending_call')
    const accepted = ordersList.filter((o: Order) => o.status === 'accepted')
    const completed = ordersList.filter((o: Order) => o.status === 'completed')
    const cancelled = ordersList.filter((o: Order) => o.status === 'cancelled')
    const totalRevenue = completed.reduce((sum: number, o: Order) => sum + (o.price || 0), 0)
    
    const now = new Date()
    let expiredCount = 0

    ;[...pendingOrdersOnly, ...pendingCallOrders].forEach((order: Order) => {
      if (order.expires_at) {
        const expiresAt = new Date(order.expires_at)
        if (expiresAt.getTime() < now.getTime()) {
          expiredCount++
        }
      }
    })
    
    setStats({
      total: ordersList.length,
      pending: pendingOrdersOnly.length,
      pendingCall: pendingCallOrders.length,
      accepted: accepted.length,
      completed: completed.length,
      cancelled: cancelled.length,
      totalRevenue: totalRevenue,
      expiredOrders: expiredCount
    })
    
    setLoading(false)
  }

  // Funções de gestão de motoqueiros
  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!riderFormData.name || !riderFormData.phone || !riderFormData.bi) {
      alert('Preencha todos os campos obrigatórios')
      return
    }
    
    setRiderLoading(true)
    
    const { error } = await supabase.from('riders').insert({
      name: riderFormData.name,
      phone: riderFormData.phone,
      bi: riderFormData.bi,
      password_hash: riderFormData.password || 'senha123',
      plate_id: riderFormData.plate_id || null,
      status: 'active',
      is_online: false,
      is_frozen: false,
      created_at: new Date().toISOString()
    })
    
    if (!error) {
      alert('✅ Motoqueiro cadastrado com sucesso!')
      setShowAddRiderModal(false)
      setRiderFormData({ name: '', phone: '', bi: '', password: '', plate_id: '' })
      const operadorId = localStorage.getItem('operador_id')
      if (operadorId) loadRiders(operadorId)
    } else {
      alert('Erro ao cadastrar: ' + error.message)
    }
    setRiderLoading(false)
  }

  const handleEditRider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRider) return
    
    setRiderLoading(true)
    
    const updateData: any = {
      name: riderFormData.name,
      phone: riderFormData.phone,
      bi: riderFormData.bi,
      plate_id: riderFormData.plate_id || null
    }
    if (riderFormData.password) {
      updateData.password_hash = riderFormData.password
    }
    
    const { error } = await supabase
      .from('riders')
      .update(updateData)
      .eq('id', selectedRider.id)
    
    if (!error) {
      alert('✅ Motoqueiro atualizado com sucesso!')
      setShowEditRiderModal(false)
      setSelectedRider(null)
      const operadorId = localStorage.getItem('operador_id')
      if (operadorId) loadRiders(operadorId)
    } else {
      alert('Erro ao atualizar: ' + error.message)
    }
    setRiderLoading(false)
  }

  const deleteRider = async (riderId: string, riderName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o motoqueiro ${riderName}?`)) return
    
    const { error } = await supabase.from('riders').delete().eq('id', riderId)
    if (!error) {
      alert('✅ Motoqueiro excluído com sucesso!')
      const operadorId = localStorage.getItem('operador_id')
      if (operadorId) loadRiders(operadorId)
    } else {
      alert('Erro ao excluir: ' + error.message)
    }
  }

  const toggleFreezeRider = async (riderId: string, currentStatus: boolean) => {
    if (!currentStatus) {
      const reason = prompt('Motivo do congelamento:', 'Pagamento pendente')
      if (reason === null) return
      
      if (!confirm(`Deseja congelar este motoqueiro?\nMotivo: ${reason}\n\n⚠️ Ao congelar, ele será forçado a ficar OFFLINE.`)) return
      
      const { error } = await supabase
        .from('riders')
        .update({ 
          is_frozen: true, 
          frozen_at: new Date().toISOString(), 
          frozen_reason: reason,
          is_online: false 
        })
        .eq('id', riderId)
      
      if (!error) {
        alert('✅ Motoqueiro congelado!')
        const operadorId = localStorage.getItem('operador_id')
        if (operadorId) loadRiders(operadorId)
      } else {
        alert('Erro ao congelar: ' + error.message)
      }
    } else {
      if (!confirm(`Deseja descongelar este motoqueiro?\n\nO motoqueiro precisará ativar o online manualmente.`)) return
      
      const { error } = await supabase
        .from('riders')
        .update({ 
          is_frozen: false, 
          frozen_reason: null, 
          frozen_at: null,
          is_online: false 
        })
        .eq('id', riderId)
      
      if (!error) {
        alert('✅ Motoqueiro descongelado!')
        const operadorId = localStorage.getItem('operador_id')
        if (operadorId) loadRiders(operadorId)
      } else {
        alert('Erro ao descongelar: ' + error.message)
      }
    }
  }

  const forceOffline = async (riderId: string, riderName: string) => {
    if (!confirm(`⚠️ Tem certeza que deseja FORÇAR OFFLINE o motoqueiro ${riderName}?\n\nEle será desconectado imediatamente.`)) return
    
    const { error } = await supabase
      .from('riders')
      .update({ is_online: false })
      .eq('id', riderId)
    
    if (!error) {
      alert(`✅ ${riderName} foi forçado a ficar OFFLINE!`)
      const operadorId = localStorage.getItem('operador_id')
      if (operadorId) loadRiders(operadorId)
    } else {
      alert('Erro: ' + error.message)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string, negotiatedPrice?: number) => {
    const operadorId = localStorage.getItem('operador_id')
    const updateData: any = { 
      status: newStatus,
      last_updated_by: operadorId,
      updated_at: new Date().toISOString()
    }
    
    if (newStatus === 'accepted') {
      updateData.accepted_at = new Date().toISOString()
      if (timeLeft[orderId]) {
        const responseTime = (timeLimit * 60) - timeLeft[orderId]
        updateData.response_time = responseTime
      }
    }
    
    if (negotiatedPrice) {
      updateData.negotiated_price = negotiatedPrice
    }
    
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
    
    if (error) {
      alert('Erro ao atualizar pedido: ' + error.message)
    } else {
      const operadorId = localStorage.getItem('operador_id')
      if (operadorId) loadAssignedPlates(operadorId)
    }
    setConfirmingOrder(null)
    setShowConfirmModal(false)
    setSelectedOrderForConfirm(null)
  }

  const confirmPhoneOrder = (order: Order) => {
    setSelectedOrderForConfirm(order)
    setShowConfirmModal(true)
  }

  const extendTime = async (orderId: string) => {
    const newExpiresAt = new Date()
    newExpiresAt.setMinutes(newExpiresAt.getMinutes() + timeLimit)
    
    const { error } = await supabase
      .from('orders')
      .update({ 
        expires_at: newExpiresAt.toISOString(),
        notification_sent: false
      })
      .eq('id', orderId)
    
    if (!error) {
      const operadorId = localStorage.getItem('operador_id')
      if (operadorId) loadAssignedPlates(operadorId)
    } else {
      alert('Erro ao estender tempo: ' + error.message)
    }
  }

  const callRider = (phone: string, riderName: string) => {
    if (confirm(`📞 Deseja ligar para o motoqueiro ${riderName} (${phone})?`)) {
      window.location.href = `tel:${phone}`
    }
  }

  const callCustomer = (phone: string, customerName: string) => {
    if (confirm(`📞 Deseja ligar para o cliente ${customerName} (${phone})?`)) {
      window.location.href = `tel:${phone}`
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/login/operador')
  }

  useEffect(() => {
    let filtered = [...orders]
    
    if (activeTab !== 'all' && activeTab !== 'riders') {
      filtered = filtered.filter(o => o.status === activeTab)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(o => 
        o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer_phone?.includes(searchTerm) ||
        o.rider?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredOrders(filtered)
  }, [orders, activeTab, searchTerm])

  const filteredRiders = riders.filter(rider => {
    const matchesSearch = rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.phone.includes(searchTerm) || rider.bi.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (riderFilter === 'active') return !rider.is_frozen && rider.status === 'active'
    if (riderFilter === 'frozen') return rider.is_frozen === true
    return true
  })

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #f9fafb 0%, #fff5ed 100%)' },
    sidebar: { 
      position: 'fixed' as const, 
      top: 0, 
      left: 0, 
      bottom: 0, 
      background: 'linear-gradient(135deg, #1f2937, #111827)', 
      transition: 'all 0.3s ease-in-out', 
      zIndex: 20, 
      width: sidebarOpen ? (isMobile ? '100%' : '280px') : '0px', 
      overflow: 'hidden',
      transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
    },
    sidebarOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 19,
      display: sidebarOpen && isMobile ? 'block' : 'none'
    },
    mainContent: { 
      transition: 'all 0.3s', 
      marginLeft: 0,
      width: '100%'
    },
    card: { 
      backgroundColor: 'white', 
      borderRadius: '16px', 
      padding: isMobile ? '12px' : '20px', 
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
      border: '1px solid #f0f0f0' 
    },
    buttonPrimary: { 
      background: 'linear-gradient(135deg, #f59e0b, #ea580c)', 
      color: 'white', 
      padding: '10px 20px', 
      borderRadius: '10px', 
      border: 'none', 
      fontWeight: 600, 
      cursor: 'pointer', 
      transition: 'all 0.3s ease' 
    },
    badge: { 
      padding: '4px 12px', 
      borderRadius: '20px', 
      fontSize: '12px', 
      fontWeight: 500, 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px' 
    },
    timerBadge: { 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '6px', 
      padding: '4px 10px', 
      borderRadius: '20px', 
      fontSize: '12px', 
      fontWeight: 600 
    }
  }

  const getStatusBadge = (status: string, isCallOrder?: boolean) => {
    switch(status) {
      case 'pending':
        return <span style={{ ...styles.badge, backgroundColor: '#fef3c7', color: '#d97706' }}><Clock size={12} /> Pendente</span>
      case 'pending_call':
        return <span style={{ ...styles.badge, backgroundColor: '#fef3c7', color: '#f59e0b' }}><Phone size={12} /> Aguardando Ligação</span>
      case 'accepted':
        return <span style={{ ...styles.badge, backgroundColor: '#dbeafe', color: '#2563eb' }}><UserCheck size={12} /> Aceito</span>
      case 'completed':
        return <span style={{ ...styles.badge, backgroundColor: '#d1fae5', color: '#059669' }}><CheckCircle size={12} /> Concluído</span>
      case 'cancelled':
        return <span style={{ ...styles.badge, backgroundColor: '#fee2e2', color: '#dc2626' }}><XCircle size={12} /> Cancelado</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ animation: 'spin 1s linear infinite', width: '48px', height: '48px', border: '3px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }}></div>
            <p style={{ color: '#6b7280' }}>Carregando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Overlay para mobile */}
      <div style={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: isMobile ? '100%' : '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #374151' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Headphones size={32} color="#f59e0b" />
              {sidebarOpen && (
                <div>
                  <h1 style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>MeuPiloto!</h1>
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>Operador</p>
                </div>
              )}
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Placas atribuídas */}
          {assignedPlates.length > 0 && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #374151' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Store size={14} /> Minhas Placas
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {assignedPlates.map(plate => (
                  <span key={plate.id} style={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 500
                  }}>
                    {plate.plate_number}
                  </span>
                ))}
              </div>
            </div>
          )}

          <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
            {[
              { id: 'pending', label: 'Pendentes', icon: Clock, count: stats.pending + stats.pendingCall, alert: stats.expiredOrders > 0 },
              { id: 'pending_call', label: '📞 Telefone', icon: Phone, count: stats.pendingCall, alert: stats.pendingCall > 0 },
              { id: 'accepted', label: 'Aceitos', icon: UserCheck, count: stats.accepted },
              { id: 'completed', label: 'Concluídos', icon: CheckCircle, count: stats.completed },
              { id: 'cancelled', label: 'Cancelados', icon: XCircle, count: stats.cancelled },
              { id: 'riders', label: 'Motoqueiros', icon: Bike, count: riders.length },
              { id: 'all', label: 'Todos', icon: Eye, count: stats.total }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  if (isMobile) setSidebarOpen(false)
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 20px', background: activeTab === item.id ? '#f59e0b' : 'transparent',
                  color: activeTab === item.id ? 'white' : '#9ca3af', border: 'none', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <item.icon size={18} />
                  <span style={{ fontSize: '14px' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '12px', background: activeTab === item.id ? 'rgba(255,255,255,0.2)' : '#374151', padding: '2px 8px', borderRadius: '20px' }}>
                  {item.count}
                </span>
              </button>
            ))}
          </nav>

          <div style={{ padding: '20px', borderTop: '1px solid #374151' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>{operador?.name?.charAt(0) || 'O'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{operador?.name}</p>
                <p style={{ color: '#9ca3af', fontSize: '11px' }}>{operador?.phone}</p>
              </div>
              <button onClick={handleLogout} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
                <LogOut size={18} />
              </button>
            </div>
            
            <button 
              onClick={() => setShowTimeModal(true)}
              style={{ marginTop: '16px', width: '100%', padding: '8px', background: '#374151', border: 'none', borderRadius: '8px', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Timer size={14} />
              Limite: {timeLimit} min
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ padding: isMobile ? '12px 16px' : '16px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isMobile && (
                  <button onClick={() => setSidebarOpen(true)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Menu size={24} color="#374151" />
                  </button>
                )}
                <div>
                  <h1 style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 'bold', background: 'linear-gradient(135deg, #d97706, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Controle de Pedidos
                  </h1>
                  <p style={{ fontSize: isMobile ? '11px' : '14px', color: '#6b7280', marginTop: '4px' }}>
                    {assignedPlates.length} placa(s) atribuída(s) • {stats.total} pedido(s) • {riders.length} motoqueiro(s)
                    {stats.pendingCall > 0 && (
                      <span style={{ marginLeft: '12px', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={14} />
                        {stats.pendingCall} por telefone
                      </span>
                    )}
                    {stats.expiredOrders > 0 && (
                      <span style={{ marginLeft: '12px', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={14} />
                        {stats.expiredOrders} expirado(s)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                <div style={{ position: 'relative', flex: isMobile ? 1 : 'auto' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '12px', width: isMobile ? '100%' : '280px', fontSize: '14px' }}
                  />
                </div>
                <button onClick={() => {
                  const operadorId = localStorage.getItem('operador_id')
                  if (operadorId) {
                    loadAssignedPlates(operadorId)
                    loadRiders(operadorId)
                  }
                }} style={{ padding: '10px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px' }}>
                  <RefreshCw size={18} />
                </button>
                {activeTab === 'riders' && (
                  <button onClick={() => setShowAddRiderModal(true)} style={styles.buttonPrimary}>
                    <Plus size={16} /> Novo Motoqueiro
                  </button>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: isMobile ? '12px' : '16px', marginTop: '20px' }}>
              <div style={{ ...styles.card, borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Phone size={isMobile ? 20 : 24} color="#f59e0b" />
                  <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold' }}>{stats.pendingCall}</span>
                </div>
                <p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6b7280', marginTop: '8px' }}>Por Telefone</p>
              </div>
              <div style={styles.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Clock size={isMobile ? 20 : 24} color="#d97706" />
                  <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold' }}>{stats.pending}</span>
                </div>
                <p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6b7280', marginTop: '8px' }}>Pendentes App</p>
                {stats.expiredOrders > 0 && (
                  <p style={{ fontSize: '10px', color: '#dc2626', marginTop: '4px' }}>{stats.expiredOrders} expirados</p>
                )}
              </div>
              <div style={styles.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <UserCheck size={isMobile ? 20 : 24} color="#2563eb" />
                  <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold' }}>{stats.accepted}</span>
                </div>
                <p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6b7280', marginTop: '8px' }}>Aceitos</p>
              </div>
              <div style={styles.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <CheckCircle size={isMobile ? 20 : 24} color="#059669" />
                  <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold' }}>{stats.completed}</span>
                </div>
                <p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6b7280', marginTop: '8px' }}>Concluídos</p>
              </div>
              <div style={styles.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <DollarSign size={isMobile ? 20 : 24} color="#f59e0b" />
                  <span style={{ fontSize: isMobile ? '16px' : '24px', fontWeight: 'bold' }}>{stats.totalRevenue.toLocaleString()} Kz</span>
                </div>
                <p style={{ fontSize: isMobile ? '11px' : '13px', color: '#6b7280', marginTop: '8px' }}>Receita Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders/Content */}
        <div style={{ padding: isMobile ? '12px' : '24px' }}>
          {/* Seção de Motoqueiros */}
          {activeTab === 'riders' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setRiderFilter('all')} 
                  style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', backgroundColor: riderFilter === 'all' ? '#4f46e5' : '#e5e7eb', color: riderFilter === 'all' ? 'white' : '#374151', cursor: 'pointer' }}
                >
                  Todos ({riders.length})
                </button>
                <button 
                  onClick={() => setRiderFilter('active')} 
                  style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', backgroundColor: riderFilter === 'active' ? '#10b981' : '#e5e7eb', color: riderFilter === 'active' ? 'white' : '#374151', cursor: 'pointer' }}
                >
                  Ativos ({riders.filter(r => !r.is_frozen && r.status === 'active').length})
                </button>
                <button 
                  onClick={() => setRiderFilter('frozen')} 
                  style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', backgroundColor: riderFilter === 'frozen' ? '#f59e0b' : '#e5e7eb', color: riderFilter === 'frozen' ? 'white' : '#374151', cursor: 'pointer' }}
                >
                  Congelados ({riders.filter(r => r.is_frozen).length})
                </button>
              </div>
              
              <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'auto', border: '1px solid #f0f0f0' }}>
                {filteredRiders.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center' }}>
                    <Bike size={48} color="#d1d5db" />
                    <p style={{ color: '#6b7280', marginTop: '16px' }}>Nenhum motoqueiro cadastrado</p>
                    <button onClick={() => setShowAddRiderModal(true)} style={{ marginTop: '16px', padding: '10px 20px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      <Plus size={16} /> Cadastrar Motoqueiro
                    </button>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #f0f0f0' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Nome</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Telefone</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>BI</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Placa</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRiders.map((rider) => (
                        <tr key={rider.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: rider.is_frozen ? '#fef3c7' : 'white' }}>
                          <td style={{ padding: '12px 16px' }}>{rider.name} {rider.is_frozen && <span style={{ color: '#d97706', fontSize: '11px', marginLeft: '4px' }}>(Congelado)</span>}</td>
                          <td style={{ padding: '12px 16px' }}>{rider.phone}</td>
                          <td style={{ padding: '12px 16px' }}>{rider.bi}</td>
                          <td style={{ padding: '12px 16px' }}>{rider.plate?.plate_number || '-'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 500,
                              backgroundColor: rider.is_frozen ? '#fef3c7' : (rider.status === 'active' ? '#d1fae5' : '#fee2e2'),
                              color: rider.is_frozen ? '#d97706' : (rider.status === 'active' ? '#065f46' : '#991b1b')
                            }}>
                              {rider.is_frozen ? '❄️ Congelado' : (rider.status === 'active' ? '✅ Ativo' : '⭕ Inativo')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button 
                                onClick={() => toggleFreezeRider(rider.id, rider.is_frozen)} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: rider.is_frozen ? '#10b981' : '#f59e0b' }}
                                title={rider.is_frozen ? 'Descongelar' : 'Congelar'}
                              >
                                {rider.is_frozen ? <Sun size={16} /> : <Snowflake size={16} />}
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedRider(rider)
                                  setRiderFormData({
                                    name: rider.name,
                                    phone: rider.phone,
                                    bi: rider.bi,
                                    password: '',
                                    plate_id: rider.plate_id || ''
                                  })
                                  setShowEditRiderModal(true)
                                }} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                              >
                                <Edit size={16} />
                              </button>
                              <button onClick={() => callRider(rider.phone, rider.name)} style={{ background: '#10b981', border: 'none', borderRadius: '20px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={12} color="white" />
                                <span style={{ fontSize: '11px', color: 'white' }}>Ligar</span>
                              </button>
                              <button onClick={() => deleteRider(rider.id, rider.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Orders (existing) */}
          {activeTab !== 'riders' && (
            <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'auto', border: '1px solid #f0f0f0' }}>
              {filteredOrders.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <AlertCircle size={48} color="#d1d5db" />
                  <p style={{ color: '#6b7280', marginTop: '16px' }}>Nenhum pedido encontrado</p>
                  {assignedPlates.length === 0 && (
                    <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
                      Nenhuma placa atribuída a você. Contacte o administrador.
                    </p>
                  )}
                </div>
              ) : isMobile ? (
                <div style={{ padding: '16px' }}>
                  {filteredOrders.map((order) => {
                    const isExpired = expiredOrders.has(order.id)
                    const timeRemaining = timeLeft[order.id] || 0
                    const isUrgent = timeRemaining <= 60 && timeRemaining > 0
                    const isCallOrder = order.status === 'pending_call'
                    
                    return (
                      <div key={order.id} style={{ 
                        marginBottom: '16px', 
                        padding: '16px', 
                        backgroundColor: isExpired ? '#fef2f2' : isCallOrder ? '#fffbeb' : isUrgent ? '#fffbeb' : 'white',
                        borderRadius: '12px',
                        border: isCallOrder ? '2px solid #f59e0b' : '1px solid #f0f0f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            {isCallOrder && (
                              <span style={{ backgroundColor: '#fef3c7', color: '#d97706', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginBottom: '6px' }}>
                                📞 Pedido por Telefone
                              </span>
                            )}
                            <p style={{ fontWeight: 600, fontSize: '16px' }}>{order.customer_name || '-'}</p>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(order.created_at).toLocaleTimeString('pt-AO')}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        
                        <div style={{ marginBottom: '8px' }}>
                          <p style={{ fontSize: '13px', color: '#6b7280' }}>📞 {order.customer_phone || '-'}</p>
                          <button onClick={() => callCustomer(order.customer_phone, order.customer_name)} style={{ fontSize: '12px', color: '#f59e0b', background: 'none', border: 'none', padding: 0, marginTop: '4px', cursor: 'pointer' }}>
                            Ligar Cliente
                          </button>
                        </div>
                        
                        {order.rider && (
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 500 }}>🏍️ {order.rider.name}</span>
                              <span style={{ fontSize: '10px', color: order.rider.is_online ? '#10b981' : '#ef4444' }}>
                                {order.rider.is_online ? 'Online' : 'Offline'}
                              </span>
                              {order.rider.accepts_calls && !order.rider.has_smartphone && (
                                <span style={{ fontSize: '10px', color: '#f59e0b', backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '10px' }}>
                                  Telefone
                                </span>
                              )}
                            </div>
                            <button onClick={() => callRider(order.rider!.phone, order.rider!.name)} style={{ fontSize: '12px', color: '#f59e0b', background: 'none', border: 'none', padding: 0, marginTop: '4px', cursor: 'pointer' }}>
                              Ligar Motoqueiro
                            </button>
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontWeight: 600 }}>{order.price?.toLocaleString()} Kz</span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Placa: {order.plate?.plate_number || '-'}</span>
                        </div>
                        
                        {(order.status === 'pending' || order.status === 'pending_call') && (
                          <div style={{ marginBottom: '12px' }}>
                            {!order.expires_at ? (
                              <span style={{ ...styles.timerBadge, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                <AlertTriangle size={14} /> Sem prazo
                              </span>
                            ) : isExpired ? (
                              <span style={{ ...styles.timerBadge, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                <AlertTriangle size={14} /> Expirado!
                              </span>
                            ) : (
                              <span style={{ ...styles.timerBadge, backgroundColor: isUrgent ? '#fef3c7' : '#ecfdf5', color: getTimeColor(timeRemaining) }}>
                                <Timer size={14} /> {formatTime(timeRemaining)}
                              </span>
                            )}
                            {isUrgent && !isExpired && order.expires_at && (
                              <button onClick={() => extendTime(order.id)} style={{ marginTop: '8px', background: '#f59e0b', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', cursor: 'pointer', width: '100%' }}>
                                +{timeLimit} min
                              </button>
                            )}
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {order.status === 'pending_call' && (
                            <button onClick={() => confirmPhoneOrder(order)} style={{ flex: 1, background: '#f59e0b', color: 'white', padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <Phone size={14} /> Confirmar Pedido
                            </button>
                          )}
                          {order.status === 'pending' && (
                            <button onClick={() => updateOrderStatus(order.id, 'accepted')} style={{ flex: 1, background: '#2563eb', color: 'white', padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer' }}>
                              Aceitar
                            </button>
                          )}
                          {order.status === 'accepted' && (
                            <button onClick={() => updateOrderStatus(order.id, 'completed')} style={{ flex: 1, background: '#059669', color: 'white', padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer' }}>
                              Concluir
                            </button>
                          )}
                          {(order.status === 'pending' || order.status === 'pending_call' || order.status === 'accepted') && (
                            <button onClick={() => updateOrderStatus(order.id, 'cancelled')} style={{ flex: 1, background: '#dc2626', color: 'white', padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer' }}>
                              Cancelar
                            </button>
                          )}
                          {isExpired && (order.status === 'pending' || order.status === 'pending_call') && order.rider && (
                            <button onClick={() => callRider(order.rider!.phone, order.rider!.name)} style={{ flex: 1, background: '#ea580c', color: 'white', padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <Phone size={14} /> Ligar Agora
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #f0f0f0' }}>
                    <tr>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Tipo</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Cliente</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Contato</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Motoqueiro</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Placa</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Valor</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Status</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Tempo</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const isExpired = expiredOrders.has(order.id)
                      const timeRemaining = timeLeft[order.id] || 0
                      const isUrgent = timeRemaining <= 60 && timeRemaining > 0
                      const isCallOrder = order.status === 'pending_call'
                      
                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: isExpired ? '#fef2f2' : isCallOrder ? '#fffbeb' : isUrgent ? '#fffbeb' : 'white' }}>
                          <td style={{ padding: '16px 20px' }}>
                            {isCallOrder ? (
                              <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>
                                📞 Telefone
                              </span>
                            ) : (
                              <span style={{ backgroundColor: '#d1fae5', color: '#059669', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>
                                📱 App
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div>
                              <p style={{ fontWeight: 500, color: '#111827' }}>{order.customer_name || '-'}</p>
                              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{new Date(order.created_at).toLocaleTimeString('pt-AO')}</p>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <p style={{ fontSize: '14px', color: '#374151' }}>{order.customer_phone || '-'}</p>
                            <button onClick={() => callCustomer(order.customer_phone, order.customer_name)} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} /> Ligar Cliente
                            </button>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            {order.rider ? (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {order.rider.photo_url ? (
                                    <img src={order.rider.photo_url} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ fontSize: '12px', color: 'white' }}>{order.rider.name?.charAt(0)}</span>
                                    </div>
                                  )}
                                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{order.rider.name}</span>
                                  {order.rider.is_online ? (
                                    <span style={{ fontSize: '10px', color: '#10b981' }}>● Online</span>
                                  ) : (
                                    <span style={{ fontSize: '10px', color: '#ef4444' }}>● Offline</span>
                                  )}
                                </div>
                                <button onClick={() => callRider(order.rider!.phone, order.rider!.name)} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Phone size={12} /> Ligar Motoqueiro
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: '#9ca3af' }}>Não atribuído</span>
                            )}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{ fontSize: '13px', color: '#6b7280' }}>{order.plate?.plate_number || '-'}</span>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{ fontWeight: 600, color: '#111827' }}>{order.price?.toLocaleString()} Kz</span>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            {getStatusBadge(order.status)}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            {(order.status === 'pending' || order.status === 'pending_call') && (
                              <div>
                                {!order.expires_at ? (
                                  <span style={{ ...styles.timerBadge, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                    <AlertTriangle size={14} /> Sem prazo
                                  </span>
                                ) : isExpired ? (
                                  <span style={{ ...styles.timerBadge, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                    <AlertTriangle size={14} /> Expirado!
                                  </span>
                                ) : (
                                  <span style={{ ...styles.timerBadge, backgroundColor: isUrgent ? '#fef3c7' : '#ecfdf5', color: getTimeColor(timeRemaining) }}>
                                    <Timer size={14} /> {formatTime(timeRemaining)}
                                  </span>
                                )}
                                {isUrgent && !isExpired && order.expires_at && (
                                  <button onClick={() => extendTime(order.id)} style={{ marginTop: '8px', background: '#f59e0b', color: 'white', padding: '4px 8px', borderRadius: '6px', border: 'none', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Zap size={12} /> +{timeLimit} min
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {order.status === 'pending_call' && (
                                <button onClick={() => confirmPhoneOrder(order)} style={{ background: '#f59e0b', color: 'white', padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Phone size={12} /> Confirmar
                                </button>
                              )}
                              {order.status === 'pending' && (
                                <button onClick={() => updateOrderStatus(order.id, 'accepted')} style={{ background: '#2563eb', color: 'white', padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', cursor: 'pointer' }}>
                                  Aceitar
                                </button>
                              )}
                              {order.status === 'accepted' && (
                                <button onClick={() => updateOrderStatus(order.id, 'completed')} style={{ background: '#059669', color: 'white', padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', cursor: 'pointer' }}>
                                  Concluir
                                </button>
                              )}
                              {(order.status === 'pending' || order.status === 'pending_call' || order.status === 'accepted') && (
                                <button onClick={() => updateOrderStatus(order.id, 'cancelled')} style={{ background: '#dc2626', color: 'white', padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', cursor: 'pointer' }}>
                                  Cancelar
                                </button>
                              )}
                              {isExpired && (order.status === 'pending' || order.status === 'pending_call') && order.rider && (
                                <button onClick={() => callRider(order.rider!.phone, order.rider!.name)} style={{ background: '#ea580c', color: 'white', padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Phone size={12} /> Ligar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de configuração de tempo */}
      {showTimeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Configurar Tempo de Resposta</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>Tempo máximo para o motoqueiro aceitar o pedido</p>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Minutos para expirar</label>
              <select 
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }}
              >
                <option value={3}>3 minutos</option>
                <option value={5}>5 minutos</option>
                <option value={7}>7 minutos</option>
                <option value={10}>10 minutos</option>
                <option value={15}>15 minutos</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowTimeModal(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', cursor: 'pointer' }}>
                Fechar
              </button>
              <button 
                onClick={() => {
                  setShowTimeModal(false)
                  localStorage.setItem('timeLimit', timeLimit.toString())
                }} 
                style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de pedido por telefone */}
      {showConfirmModal && selectedOrderForConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={24} color="#f59e0b" /> Confirmar Pedido por Telefone
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              O cliente solicitou contato via telefone. Confirme após combinar os detalhes da corrida.
            </p>
            
            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '12px' }}>
              <p><strong>Cliente:</strong> {selectedOrderForConfirm.customer_name}</p>
              <p><strong>Telefone:</strong> {selectedOrderForConfirm.customer_phone}</p>
              <p><strong>Motoqueiro:</strong> {selectedOrderForConfirm.rider?.name}</p>
              <p><strong>Placa:</strong> {selectedOrderForConfirm.plate?.plate_number}</p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Valor combinado (opcional)</label>
              <input 
                type="number"
                placeholder="Deixe em branco para manter o valor original"
                onChange={(e) => setSelectedOrderForConfirm({ ...selectedOrderForConfirm, price: parseInt(e.target.value) || selectedOrderForConfirm.price })}
                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  setShowConfirmModal(false)
                  setSelectedOrderForConfirm(null)
                }} 
                style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={() => updateOrderStatus(selectedOrderForConfirm.id, 'accepted', selectedOrderForConfirm.price)}
                style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <CheckCircle size={18} />
                Confirmar Pedido
              </button>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <button 
                onClick={() => callCustomer(selectedOrderForConfirm.customer_phone, selectedOrderForConfirm.customer_name)}
                style={{ width: '100%', padding: '10px', background: '#f59e0b', color: 'white', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}
              >
                <Phone size={16} /> Ligar para Cliente Agora
              </button>
              {selectedOrderForConfirm.rider && (
                <button 
                  onClick={() => callRider(selectedOrderForConfirm.rider!.phone, selectedOrderForConfirm.rider!.name)}
                  style={{ width: '100%', padding: '10px', background: '#ea580c', color: 'white', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Phone size={16} /> Ligar para Motoqueiro
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Motoqueiro */}
      {showAddRiderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', maxWidth: '450px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Novo Motoqueiro</h3>
              <button onClick={() => setShowAddRiderModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#6b7280" />
              </button>
            </div>
            
            <form onSubmit={handleAddRider}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Nome *</label>
                <input
                  type="text"
                  required
                  value={riderFormData.name}
                  onChange={(e) => setRiderFormData({...riderFormData, name: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Telefone *</label>
                <input
                  type="tel"
                  required
                  value={riderFormData.phone}
                  onChange={(e) => setRiderFormData({...riderFormData, phone: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>BI *</label>
                <input
                  type="text"
                  required
                  value={riderFormData.bi}
                  onChange={(e) => setRiderFormData({...riderFormData, bi: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Senha</label>
                <input
                  type="text"
                  placeholder="Deixe em branco para usar 'senha123'"
                  value={riderFormData.password}
                  onChange={(e) => setRiderFormData({...riderFormData, password: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', backgroundColor: '#f9fafb' }}
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Placa</label>
                <select
                  value={riderFormData.plate_id}
                  onChange={(e) => setRiderFormData({...riderFormData, plate_id: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }}
                >
                  <option value="">Selecione uma placa</option>
                  {assignedPlates.map(plate => (
                    <option key={plate.id} value={plate.id}>{plate.plate_number}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddRiderModal(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', cursor: 'pointer', fontWeight: 500 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={riderLoading} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  {riderLoading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Motoqueiro */}
      {showEditRiderModal && selectedRider && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', maxWidth: '450px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Editar Motoqueiro</h3>
              <button onClick={() => setShowEditRiderModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#6b7280" />
              </button>
            </div>
            
            <form onSubmit={handleEditRider}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Nome *</label>
                <input
                  type="text"
                  required
                  value={riderFormData.name}
                  onChange={(e) => setRiderFormData({...riderFormData, name: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Telefone *</label>
                <input
                  type="tel"
                  required
                  value={riderFormData.phone}
                  onChange={(e) => setRiderFormData({...riderFormData, phone: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>BI *</label>
                <input
                  type="text"
                  required
                  value={riderFormData.bi}
                  onChange={(e) => setRiderFormData({...riderFormData, bi: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Nova Senha</label>
                <input
                  type="text"
                  placeholder="Deixe em branco para manter a atual"
                  value={riderFormData.password}
                  onChange={(e) => setRiderFormData({...riderFormData, password: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', backgroundColor: '#f9fafb' }}
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Placa</label>
                <select
                  value={riderFormData.plate_id}
                  onChange={(e) => setRiderFormData({...riderFormData, plate_id: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }}
                >
                  <option value="">Selecione uma placa</option>
                  {assignedPlates.map(plate => (
                    <option key={plate.id} value={plate.id}>{plate.plate_number}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowEditRiderModal(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', cursor: 'pointer', fontWeight: 500 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={riderLoading} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  {riderLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}