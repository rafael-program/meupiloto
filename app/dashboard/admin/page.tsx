'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Shield, LogOut, Users, Bike, CreditCard, TrendingUp, 
  Plus, Edit, Trash2, Search, AlertCircle, Menu, X, 
  UserCog, Store, ClipboardList, RefreshCw, Phone,
  DollarSign, Calendar, CheckCircle, XCircle, Building2,
  UserPlus, UserCheck, UserX, Link2, Link2Off, 
  Eye, EyeOff, Download, Filter, Snowflake, Sun
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

type Association = {
  id: string
  name: string
  email: string
  phone: string
  password: string
  address: string
  logo_url: string
  is_active: boolean
  created_at: string
}

type Boss = {
  id: string
  name: string
  email: string
  phone: string
  password: string
  created_at: string
}

type Plate = {
  id: string
  plate_number: string
  boss_id: string | null
  weekly_fee: number
  is_active: boolean
  max_riders: number
  fee_per_rider: number
  total_weekly_fee: number
  created_at: string
  boss?: Boss
  operador_id?: string
  assigned_at?: string
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

type RiderPayment = {
  id: string
  rider_id: string
  amount: number
  payment_method: string
  status: string
  proof_url: string
  transaction_id: string
  payment_date: string
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

type Order = {
  id: string
  customer_name: string
  customer_phone: string
  price: number
  status: string
  created_at: string
  rider_id: string
  rider?: {
    id: string
    name: string
    phone: string
    is_online: boolean
  }
}

type Operador = {
  id: string
  name: string
  email: string
  phone: string
  password: string
  is_active: boolean
  created_at: string
  created_by: string | null
}

type Admin = {
  id: string
  name: string
  email: string
  password: string
  created_at: string
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [associations, setAssociations] = useState<Association[]>([])
  const [bosses, setBosses] = useState<Boss[]>([])
  const [plates, setPlates] = useState<Plate[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [riderPayments, setRiderPayments] = useState<RiderPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [riderFilter, setRiderFilter] = useState<string>('all')
  const [showAddAssociation, setShowAddAssociation] = useState(false)
  const [showAddBoss, setShowAddBoss] = useState(false)
  const [showAddPlate, setShowAddPlate] = useState(false)
  const [showAddOperador, setShowAddOperador] = useState(false)
  const [showAddRider, setShowAddRider] = useState(false)
  const [showEditBoss, setShowEditBoss] = useState<Boss | null>(null)
  const [showEditPlate, setShowEditPlate] = useState<Plate | null>(null)
  const [showEditRider, setShowEditRider] = useState<Rider | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<RiderPayment | null>(null)
  const [newRiderPlateId, setNewRiderPlateId] = useState<string>('')
  const [selectedOperador, setSelectedOperador] = useState<string>('')
  const [selectedPlates, setSelectedPlates] = useState<Set<string>>(new Set())
  const [assignSearchTerm, setAssignSearchTerm] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<string>('pending')
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null)
  const [showEditBossModal, setShowEditBossModal] = useState(false)
  const [selectedPlate, setSelectedPlate] = useState<Plate | null>(null)
  const [showEditPlateModal, setShowEditPlateModal] = useState(false)
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null)
  const [showEditRiderModal, setShowEditRiderModal] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignMessage, setAssignMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stats, setStats] = useState({
    totalAssociations: 0,
    totalBosses: 0,
    totalPlates: 0,
    totalRiders: 0,
    totalOrders: 0,
    totalRevenue: 0,
    onlineRiders: 0,
    activePlates: 0,
    totalOperadores: 0,
    activeOperadores: 0,
    assignedPlates: 0,
    pendingPayments: 0
  })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const adminId = localStorage.getItem('admin_id')
    if (!adminId) {
      router.push('/login/admin')
      return
    }
    loadAdmin(adminId)
    loadAllData()
  }, [router])

  const loadAdmin = async (adminId: string) => {
    const { data } = await supabase.from('admins').select('*').eq('id', adminId).single()
    setAdmin(data)
  }

  const loadAllData = async () => {
    setLoading(true)

    const { data: associationsData } = await supabase.from('associations').select('*').order('created_at', { ascending: false })
    setAssociations(associationsData || [])

    const { data: bossesData } = await supabase.from('bosses').select('*').order('created_at', { ascending: false })
    setBosses(bossesData || [])

    const { data: platesData } = await supabase.from('plates').select('*, boss:bosses(*)').order('created_at', { ascending: false })
    setPlates(platesData || [])

    const { data: ridersData } = await supabase.from('riders').select('*, plate:plates(plate_number)').order('created_at', { ascending: false })
    setRiders(ridersData || [])

    const { data: ordersData } = await supabase
      .from('orders')
      .select(`
        *,
        rider:riders (
          id,
          name,
          phone,
          is_online
        )
      `)
      .order('created_at', { ascending: false })
    
    setOrders(ordersData || [])

    const { data: operadoresData } = await supabase.from('operadores').select('*').order('created_at', { ascending: false })
    setOperadores(operadoresData || [])

    const { data: paymentsData } = await supabase
      .from('rider_payments')
      .select('*')
      .order('payment_date', { ascending: false })
    setRiderPayments(paymentsData || [])

    const completedOrders = ordersData?.filter(o => o.status === 'completed') || []
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0)
    const onlineRiders = ridersData?.filter(r => r.is_online === true) || []
    const activePlates = platesData?.filter(p => p.is_active === true) || []
    const activeOperadores = operadoresData?.filter(o => o.is_active === true) || []
    const assignedPlates = platesData?.filter(p => p.operador_id) || []
    const pendingPayments = paymentsData?.filter(p => p.status === 'pending') || []

    setStats({
      totalAssociations: associationsData?.length || 0,
      totalBosses: bossesData?.length || 0,
      totalPlates: platesData?.length || 0,
      totalRiders: ridersData?.length || 0,
      totalOrders: ordersData?.length || 0,
      totalRevenue,
      onlineRiders: onlineRiders.length,
      activePlates: activePlates.length,
      totalOperadores: operadoresData?.length || 0,
      activeOperadores: activeOperadores.length,
      assignedPlates: assignedPlates.length,
      pendingPayments: pendingPayments.length
    })

    setLoading(false)
  }

  // Funções de Edição
  const handleEditBoss = async (bossId: string, formData: { name: string; email: string; phone: string; password: string }) => {
    const updateData: any = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone
    }
    if (formData.password) {
      updateData.password = formData.password
    }
    
    const { error } = await supabase
      .from('bosses')
      .update(updateData)
      .eq('id', bossId)
    
    if (!error) {
      alert('✅ Chefe atualizado com sucesso!')
      loadAllData()
      setShowEditBossModal(false)
      setSelectedBoss(null)
      return true
    } else {
      alert('Erro ao atualizar chefe: ' + error.message)
      return false
    }
  }

  const handleEditPlate = async (plateId: string, formData: { plate_number: string; boss_id: string; weekly_fee: number; max_riders: number }) => {
    const { error } = await supabase
      .from('plates')
      .update({
        plate_number: formData.plate_number,
        boss_id: formData.boss_id || null,
        weekly_fee: formData.weekly_fee,
        max_riders: formData.max_riders,
        total_weekly_fee: formData.max_riders * 300
      })
      .eq('id', plateId)
    
    if (!error) {
      alert('✅ Placa atualizada com sucesso!')
      loadAllData()
      setShowEditPlateModal(false)
      setSelectedPlate(null)
      return true
    } else {
      alert('Erro ao atualizar placa: ' + error.message)
      return false
    }
  }

  const handleEditRider = async (riderId: string, formData: { name: string; phone: string; bi: string; password: string; plate_id: string }) => {
    const updateData: any = {
      name: formData.name,
      phone: formData.phone,
      bi: formData.bi,
      plate_id: formData.plate_id || null
    }
    if (formData.password) {
      updateData.password_hash = formData.password
    }
    
    const { error } = await supabase
      .from('riders')
      .update(updateData)
      .eq('id', riderId)
    
    if (!error) {
      alert('✅ Motoqueiro atualizado com sucesso!')
      loadAllData()
      setShowEditRiderModal(false)
      setSelectedRider(null)
      return true
    } else {
      alert('Erro ao atualizar motoqueiro: ' + error.message)
      return false
    }
  }

  // Funções de Pagamento
  const approvePayment = async (paymentId: string) => {
    if (!confirm('Aprovar este pagamento?')) return
    
    const adminId = localStorage.getItem('admin_id')
    
    const { data: payment } = await supabase
      .from('rider_payments')
      .select('rider_id')
      .eq('id', paymentId)
      .single()
    
    const { error } = await supabase
      .from('rider_payments')
      .update({
        status: 'approved',
        approved_by: adminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', paymentId)
    
    if (!error) {
      if (payment) {
        await supabase
          .from('riders')
          .update({ 
            is_frozen: false, 
            frozen_reason: null, 
            frozen_at: null 
          })
          .eq('id', payment.rider_id)
      }
      
      alert('✅ Pagamento aprovado e conta descongelada com sucesso!')
      loadAllData()
      setSelectedPayment(null)
      setShowPaymentModal(false)
    } else {
      alert('Erro ao aprovar pagamento: ' + error.message)
    }
  }

  const rejectPayment = async (paymentId: string) => {
    if (!confirm('Rejeitar este pagamento? O motoqueiro será notificado.')) return
    
    const { error } = await supabase
      .from('rider_payments')
      .update({ status: 'rejected' })
      .eq('id', paymentId)
    
    if (!error) {
      alert('❌ Pagamento rejeitado!')
      loadAllData()
      setSelectedPayment(null)
      setShowPaymentModal(false)
    } else {
      alert('Erro ao rejeitar pagamento: ' + error.message)
    }
  }

  // Funções de Congelamento de Motoqueiro
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
        alert('✅ Motoqueiro congelado e forçado a ficar OFFLINE!')
        loadAllData()
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
        alert('✅ Motoqueiro descongelado com sucesso!')
        loadAllData()
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
      loadAllData()
    } else {
      alert('Erro: ' + error.message)
    }
  }

  // Funções de Atribuição de Placas
  const handleAssignPlates = async () => {
    if (!selectedOperador || selectedPlates.size === 0) return
    
    setAssignLoading(true)
    setAssignMessage(null)
    
    const results = []
    for (const plateId of selectedPlates) {
      const { error } = await supabase
        .from('plates')
        .update({ operador_id: selectedOperador, assigned_at: new Date().toISOString() })
        .eq('id', plateId)
      results.push(!error)
    }
    
    const successCount = results.filter(r => r).length
    if (successCount > 0) {
      setAssignMessage({ type: 'success', text: `${successCount} placa(s) atribuída(s) com sucesso!` })
      setSelectedPlates(new Set())
      loadAllData()
      setTimeout(() => setAssignMessage(null), 3000)
    } else {
      setAssignMessage({ type: 'error', text: 'Erro ao atribuir placas' })
    }
    setAssignLoading(false)
  }

  const handleUnassignPlate = async (plateId: string, plateNumber: string) => {
    if (!confirm(`Remover atribuição da placa ${plateNumber}?`)) return
    
    const { error } = await supabase
      .from('plates')
      .update({ operador_id: null, assigned_at: null })
      .eq('id', plateId)
    
    if (!error) {
      loadAllData()
      setAssignMessage({ type: 'success', text: `Placa ${plateNumber} removida com sucesso!` })
      setTimeout(() => setAssignMessage(null), 3000)
    }
  }

  const togglePlateSelection = (plateId: string) => {
    const newSet = new Set(selectedPlates)
    if (newSet.has(plateId)) {
      newSet.delete(plateId)
    } else {
      newSet.add(plateId)
    }
    setSelectedPlates(newSet)
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/login/admin')
  }

  const deleteItem = async (table: string, id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir ${name}?`)) {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (!error) loadAllData()
      else alert('Erro ao excluir: ' + error.message)
    }
  }

  const togglePlateStatus = async (plateId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('plates').update({ is_active: !currentStatus }).eq('id', plateId)
    if (!error) loadAllData()
  }

  const toggleOperadorStatus = async (operadorId: string, currentStatus: boolean) => {
    if (confirm(`Deseja ${currentStatus ? 'desativar' : 'ativar'} este operador?`)) {
      const { error } = await supabase.from('operadores').update({ is_active: !currentStatus }).eq('id', operadorId)
      if (!error) loadAllData()
      else alert('Erro ao alterar status: ' + error.message)
    }
  }

  const callRider = (phone: string, riderName: string) => {
    if (confirm(`📞 Deseja ligar para o motoqueiro ${riderName} (${phone})?`)) {
      window.location.href = `tel:${phone}`
    }
  }

  // Filtros
  const filteredAssociations = associations.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.phone.includes(searchTerm)
  )

  const filteredBosses = bosses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.phone.includes(searchTerm)
  )

  const filteredPlates = plates.filter(p => 
    p.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.boss?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  const filteredRiders = riders.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm) || r.bi.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false
    
    switch (riderFilter) {
      case 'active': return r.status === 'active' && !r.is_frozen
      case 'frozen': return r.is_frozen === true
      default: return true
    }
  })

  const filteredOrders = orders.filter(o => 
    (o.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    o.customer_phone.includes(searchTerm) ||
    (o.rider?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (o.rider?.phone || '').includes(searchTerm)
  )

  const filteredOperadores = operadores.filter(op => 
    op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.phone.includes(searchTerm)
  )

  const selectedOperadorInfo = operadores.find(o => o.id === selectedOperador)
  const operadorPlates = plates.filter(p => p.operador_id === selectedOperador)
  const availablePlates = plates.filter(p => !p.operador_id && p.is_active)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ animation: 'spin 1s linear infinite', width: '3rem', height: '3rem', border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '9999px', margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#6b7280' }}>Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const styles: Record<string, React.CSSProperties> = {
    container: { minHeight: '100vh', backgroundColor: '#f3f4f6' },
    sidebar: { 
      position: 'fixed', top: 0, left: 0, bottom: 0, 
      background: 'linear-gradient(135deg, #1f2937, #111827)', 
      transition: 'all 0.3s', zIndex: 20,
      width: sidebarOpen ? (isMobile ? '100%' : '16rem') : (isMobile ? '0' : '5rem'),
      overflow: 'hidden',
      transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
    },
    sidebarOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 19,
      display: isMobile && sidebarOpen ? 'block' : 'none'
    },
    mainContent: { 
      transition: 'all 0.3s', 
      marginLeft: sidebarOpen && !isMobile ? '16rem' : (!sidebarOpen && !isMobile ? '5rem' : 0)
    },
    card: { 
      backgroundColor: 'white', 
      borderRadius: '0.75rem', 
      padding: '1rem', 
      boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
      border: '1px solid #f3f4f6'
    },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, borderBottom: '1px solid #e5e7eb' },
    td: { padding: '1rem 1.5rem', fontSize: '0.875rem', borderBottom: '1px solid #e5e7eb' },
    buttonPrimary: { backgroundColor: '#4f46e5', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    buttonDanger: { color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' },
    buttonCall: { backgroundColor: '#10b981', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' },
    badgeActive: { backgroundColor: '#d1fae5', color: '#065f46', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' },
    badgeInactive: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' },
    badgeWarning: { backgroundColor: '#fef3c7', color: '#d97706', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' },
    input: { padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Overlay para mobile */}
      <div style={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #374151' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={32} color="#818cf8" />
              {sidebarOpen && <div><h1 style={{ color: 'white', fontWeight: 'bold' }}>MeuPiloto!</h1><p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Admin</p></div>}
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav style={{ flex: 1, padding: '1rem 0' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'associations', label: 'Associações', icon: Building2 },
              { id: 'operadores', label: 'Operadores', icon: Users },
              { id: 'payments', label: 'Pagamentos', icon: CreditCard, badge: stats.pendingPayments },
              { id: 'assign', label: 'Atribuir Placas', icon: Link2 },
              { id: 'orders', label: 'Pedidos', icon: ClipboardList },
              { id: 'plates', label: 'Placas', icon: Store },
              { id: 'bosses', label: 'Chefes', icon: UserCog },
              { id: 'riders', label: 'Motoqueiros', icon: Bike }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  if (isMobile) setSidebarOpen(false)
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem', background: activeTab === item.id ? '#4f46e5' : 'transparent',
                  color: activeTab === item.id ? 'white' : '#9ca3af', border: 'none', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <item.icon size={20} />
                  {sidebarOpen && <span style={{ fontSize: '0.875rem' }}>{item.label}</span>}
                </div>
                {sidebarOpen && item.badge && item.badge > 0 && (
                  <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div style={{ padding: '1rem', borderTop: '1px solid #374151', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2rem', height: '2rem', backgroundColor: '#4f46e5', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 'bold' }}>{admin?.name?.charAt(0) || 'A'}</span>
            </div>
            {sidebarOpen && (
              <div style={{ flex: 1 }}>
                <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500' }}>{admin?.name}</p>
                <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{admin?.email}</p>
              </div>
            )}
            <button onClick={handleLogout} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

         {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={{ backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ padding: '1rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {isMobile && (
                  <button onClick={() => setSidebarOpen(true)} style={{ padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Menu size={24} color="#374151" />
                  </button>
                )}
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'associations' && 'Associações'}
                  {activeTab === 'operadores' && 'Operadores'}
                  {activeTab === 'payments' && 'Pagamentos'}
                  {activeTab === 'assign' && 'Atribuir Placas a Operadores'}
                  {activeTab === 'orders' && 'Pedidos'}
                  {activeTab === 'plates' && 'Placas'}
                  {activeTab === 'bosses' && 'Chefes'}
                  {activeTab === 'riders' && 'Motoqueiros'}
                </h1>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={loadAllData} style={{ padding: '0.5rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <RefreshCw size={20} />
                </button>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '0.5rem 0.5rem 0.5rem 2rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', width: isMobile ? '100%' : '16rem' }}
                  />
                </div>
                {(activeTab === 'associations' || activeTab === 'bosses' || activeTab === 'plates' || activeTab === 'operadores' || activeTab === 'riders') && (
                  <button 
                    onClick={() => {
                      if (activeTab === 'associations') setShowAddAssociation(true)
                      else if (activeTab === 'bosses') setShowAddBoss(true)
                      else if (activeTab === 'plates') setShowAddPlate(true)
                      else if (activeTab === 'operadores') setShowAddOperador(true)
                      else if (activeTab === 'riders') setShowAddRider(true)
                    }} 
                    style={styles.buttonPrimary}
                  >
                    <Plus size={16} /> Novo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={styles.card}><p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Associações</p><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalAssociations}</p></div>
              <div style={styles.card}><p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Operadores</p><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalOperadores}</p><p style={{ fontSize: '0.75rem', color: '#059669' }}>{stats.activeOperadores} ativos</p></div>
              <div style={styles.card}><p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Placas</p><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalPlates}</p><p style={{ fontSize: '0.75rem', color: '#059669' }}>{stats.activePlates} ativas</p><p style={{ fontSize: '0.75rem', color: '#4f46e5' }}>{stats.assignedPlates} atribuídas</p></div>
              <div style={styles.card}><p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Chefes</p><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalBosses}</p></div>
              <div style={styles.card}><p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Motoqueiros</p><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalRiders}</p><p style={{ fontSize: '0.75rem', color: '#059669' }}>{stats.onlineRiders} online</p><p style={{ fontSize: '0.75rem', color: '#d97706' }}>{riders.filter(r => r.is_frozen).length} congelados</p></div>
              <div style={styles.card}><p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pedidos</p><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalOrders}</p></div>
              <div style={{ ...styles.card, background: 'linear-gradient(135deg, #4f46e5, #4338ca)', color: 'white' }}>
                <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Receita Total</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalRevenue.toLocaleString()} Kz</p>
              </div>
              <div style={{ ...styles.card, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white' }}>
                <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Pagamentos Pendentes</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.pendingPayments}</p>
              </div>
            </div>
          </div>
        )}

        {/* Associações */}
        {activeTab === 'associations' && (
          <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nome</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Telefone</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssociations.map((assoc) => (
                    <tr key={assoc.id}>
                      <td style={styles.td}>{assoc.name}</td>
                      <td style={styles.td}>{assoc.email}</td>
                      <td style={styles.td}>{assoc.phone}</td>
                      <td style={styles.td}>
                        <span style={assoc.is_active ? styles.badgeActive : styles.badgeInactive}>
                          {assoc.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => deleteItem('associations', assoc.id, assoc.name)} style={styles.buttonDanger}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAssociations.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        Nenhuma associação encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Operadores */}
        {activeTab === 'operadores' && (
          <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nome</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Telefone</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Placas</th>
                    <th style={styles.th}>Criado em</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOperadores.map((op) => {
                    const opPlates = plates.filter(p => p.operador_id === op.id)
                    return (
                      <tr key={op.id}>
                        <td style={styles.td}>{op.name}</td>
                        <td style={styles.td}>{op.email || '-'}</td>
                        <td style={styles.td}>{op.phone}</td>
                        <td style={styles.td}>
                          <button onClick={() => toggleOperadorStatus(op.id, op.is_active)} style={op.is_active ? styles.badgeActive : styles.badgeInactive}>
                            {op.is_active ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {opPlates.length > 0 ? opPlates.map(p => (
                              <span key={p.id} style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '12px', fontSize: '11px' }}>{p.plate_number}</span>
                            )) : <span style={{ color: '#9ca3af', fontSize: '12px' }}>Nenhuma</span>}
                          </div>
                        </td>
                        <td style={styles.td}>{new Date(op.created_at).toLocaleDateString('pt-AO')}</td>
                        <td style={styles.td}>
                          <button onClick={() => deleteItem('operadores', op.id, op.name)} style={styles.buttonDanger}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredOperadores.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        Nenhum operador encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagamentos */}
        {activeTab === 'payments' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <button 
                onClick={() => setPaymentFilter('pending')}
                style={{ 
                  padding: '10px 20px', 
                  border: 'none', 
                  background: paymentFilter === 'pending' ? '#4f46e5' : 'transparent',
                  color: paymentFilter === 'pending' ? 'white' : '#6b7280',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                Pendentes ({riderPayments.filter(p => p.status === 'pending').length})
              </button>
              <button 
                onClick={() => setPaymentFilter('approved')}
                style={{ 
                  padding: '10px 20px', 
                  border: 'none', 
                  background: paymentFilter === 'approved' ? '#10b981' : 'transparent',
                  color: paymentFilter === 'approved' ? 'white' : '#6b7280',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                Aprovados ({riderPayments.filter(p => p.status === 'approved').length})
              </button>
              <button 
                onClick={() => setPaymentFilter('rejected')}
                style={{ 
                  padding: '10px 20px', 
                  border: 'none', 
                  background: paymentFilter === 'rejected' ? '#ef4444' : 'transparent',
                  color: paymentFilter === 'rejected' ? 'white' : '#6b7280',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                Rejeitados ({riderPayments.filter(p => p.status === 'rejected').length})
              </button>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Motoqueiro</th>
                    <th style={styles.th}>Telefone</th>
                    <th style={styles.th}>Valor</th>
                    <th style={styles.th}>Método</th>
                    <th style={styles.th}>Data</th>
                    <th style={styles.th}>Transação</th>
                    <th style={styles.th}>Comprovante</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let filteredPaymentsList = []
                    if (paymentFilter === 'pending') filteredPaymentsList = riderPayments.filter(p => p.status === 'pending')
                    else if (paymentFilter === 'approved') filteredPaymentsList = riderPayments.filter(p => p.status === 'approved')
                    else filteredPaymentsList = riderPayments.filter(p => p.status === 'rejected')
                    
                    if (filteredPaymentsList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                            {paymentFilter === 'pending' ? '💰 Nenhum pagamento pendente' : 
                             paymentFilter === 'approved' ? '✅ Nenhum pagamento aprovado' : 
                             '❌ Nenhum pagamento rejeitado'}
                          </td>
                        </tr>
                      )
                    }
                    
                    return filteredPaymentsList.map((payment) => {
                      const rider = riders.find(r => r.id === payment.rider_id)
                      return (
                        <tr key={payment.id} style={{ 
                          backgroundColor: payment.status === 'approved' ? '#f0fdf4' : payment.status === 'rejected' ? '#fef2f2' : 'white'
                        }}>
                          <td style={styles.td}>
                            {rider?.name || 'Desconhecido'}
                            {payment.approved_by && payment.status === 'approved' && (
                              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                                Aprovado por: Admin
                              </div>
                            )}
                          </td>
                          <td style={styles.td}>{rider?.phone || '-'}</td>
                          <td style={styles.td}><strong>{payment.amount.toLocaleString()} Kz</strong></td>
                          <td style={styles.td}>
                            <span style={payment.payment_method === 'unitel' ? styles.badgeWarning : styles.badgeActive}>
                              {payment.payment_method === 'unitel' ? 'Unitel Money' : 'Transferência'}
                            </span>
                          </td>
                          <td style={styles.td}>{new Date(payment.payment_date).toLocaleDateString('pt-AO')}</td>
                          <td style={styles.td}>
                            <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{payment.transaction_id}</span>
                          </td>
                          <td style={styles.td}>
                            {payment.proof_url && (
                              <a href={payment.proof_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                Ver Comprovante
                              </a>
                            )}
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 500,
                              backgroundColor: payment.status === 'approved' ? '#d1fae5' : payment.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                              color: payment.status === 'approved' ? '#065f46' : payment.status === 'rejected' ? '#991b1b' : '#92400e'
                            }}>
                              {payment.status === 'approved' ? '✓ Aprovado' : payment.status === 'rejected' ? '✗ Rejeitado' : '⏳ Pendente'}
                            </span>
                            {payment.approved_at && (
                              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                                {new Date(payment.approved_at).toLocaleDateString('pt-AO')}
                              </div>
                            )}
                          </td>
                          <td style={styles.td}>
                            {payment.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  onClick={() => approvePayment(payment.id)} 
                                  style={{ backgroundColor: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                                >
                                  Aprovar
                                </button>
                                <button 
                                  onClick={() => rejectPayment(payment.id)} 
                                  style={{ backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                                >
                                  Rejeitar
                                </button>
                              </div>
                            ) : payment.status === 'approved' ? (
                              <span style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={14} /> Concluído
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <XCircle size={14} /> Recusado
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Atribuir Placas */}
        {activeTab === 'assign' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              {assignMessage && (
                <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', backgroundColor: assignMessage.type === 'success' ? '#d1fae5' : '#fee2e2', color: assignMessage.type === 'success' ? '#065f46' : '#dc2626' }}>
                  {assignMessage.text}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>1. Selecione o Operador</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                    {operadores.filter(o => o.is_active).map((op) => {
                      const opPlatesCount = plates.filter(p => p.operador_id === op.id).length
                      return (
                        <button 
                          key={op.id} 
                          onClick={() => { setSelectedOperador(op.id); setSelectedPlates(new Set()); setAssignSearchTerm('') }} 
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: selectedOperador === op.id ? '#fef3c7' : 'white', border: `1px solid ${selectedOperador === op.id ? '#f59e0b' : '#e5e7eb'}`, borderRadius: '12px', cursor: 'pointer', width: '100%' }}
                        >
                          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontWeight: 'bold' }}>{op.name.charAt(0)}</span>
                          </div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <p style={{ fontWeight: 'bold' }}>{op.name}</p>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>{op.phone}</p>
                          </div>
                          <div><span style={{ backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '20px', fontSize: '12px' }}>{opPlatesCount} placas</span></div>
                        </button>
                      )
                    })}
                    {operadores.filter(o => o.is_active).length === 0 && <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>Nenhum operador ativo</p>}
                  </div>
                </div>
                {selectedOperador && (
                  <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Gerenciar Placas - {selectedOperadorInfo?.name}</h3>
                      {selectedPlates.size > 0 && (
                        <button 
                          onClick={handleAssignPlates} 
                          disabled={assignLoading} 
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                        >
                          <UserCheck size={16} /> Atribuir ({selectedPlates.size})
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                      <button 
                        onClick={() => setAssignSearchTerm('todas')} 
                        style={{ padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', color: assignSearchTerm === 'todas' ? '#f59e0b' : '#6b7280', borderBottom: assignSearchTerm === 'todas' ? '2px solid #f59e0b' : 'none', fontWeight: assignSearchTerm === 'todas' ? 'bold' : 'normal' }}
                      >
                        Todas as Placas
                      </button>
                      <button 
                        onClick={() => setAssignSearchTerm('disponiveis')} 
                        style={{ padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', color: assignSearchTerm === 'disponiveis' ? '#f59e0b' : '#6b7280', borderBottom: assignSearchTerm === 'disponiveis' ? '2px solid #f59e0b' : 'none', fontWeight: assignSearchTerm === 'disponiveis' ? 'bold' : 'normal' }}
                      >
                        Disponíveis ({availablePlates.length})
                      </button>
                      <button 
                        onClick={() => setAssignSearchTerm('atribuidas')} 
                        style={{ padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', color: assignSearchTerm === 'atribuidas' ? '#f59e0b' : '#6b7280', borderBottom: assignSearchTerm === 'atribuidas' ? '2px solid #f59e0b' : 'none', fontWeight: assignSearchTerm === 'atribuidas' ? 'bold' : 'normal' }}
                      >
                        Atribuídas ({operadorPlates.length})
                      </button>
                    </div>
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input 
                        type="text" 
                        placeholder="Buscar placa..." 
                        value={assignSearchTerm === 'todas' || assignSearchTerm === 'disponiveis' || assignSearchTerm === 'atribuidas' ? '' : assignSearchTerm} 
                        onChange={(e) => setAssignSearchTerm(e.target.value)} 
                        style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px' }} 
                      />
                    </div>
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      {(() => {
                        let platesToShow: Plate[] = []
                        if (assignSearchTerm === 'disponiveis') platesToShow = availablePlates
                        else if (assignSearchTerm === 'atribuidas') platesToShow = operadorPlates
                        else { 
                          platesToShow = [...availablePlates, ...operadorPlates]
                          if (assignSearchTerm && assignSearchTerm !== 'todas' && assignSearchTerm !== 'disponiveis' && assignSearchTerm !== 'atribuidas') {
                            platesToShow = platesToShow.filter(p => p.plate_number.toLowerCase().includes(assignSearchTerm.toLowerCase()))
                          }
                        }
                        if (platesToShow.length === 0) return (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            <Store size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <p>Nenhuma placa encontrada</p>
                          </div>
                        )
                        return platesToShow.map((plate) => (
                          <div 
                            key={plate.id} 
                            onClick={() => { 
                              if (!plate.operador_id && assignSearchTerm !== 'atribuidas') togglePlateSelection(plate.id) 
                            }} 
                            style={{ 
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', marginBottom: '8px', 
                              borderRadius: '12px', border: '1px solid', 
                              borderColor: selectedPlates.has(plate.id) ? '#f59e0b' : '#e5e7eb', 
                              backgroundColor: selectedPlates.has(plate.id) ? '#fef3c7' : 'white', 
                              cursor: (!plate.operador_id && assignSearchTerm !== 'atribuidas') ? 'pointer' : 'default', 
                              opacity: plate.operador_id && plate.operador_id !== selectedOperador ? 0.5 : 1 
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <Store size={24} color={plate.operador_id ? '#f59e0b' : '#6b7280'} />
                              <div>
                                <p style={{ fontWeight: 600, fontSize: '16px' }}>{plate.plate_number}</p>
                                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                                  Chefe: {plate.boss?.name || 'Não definido'} | Taxa: {plate.weekly_fee?.toLocaleString()} Kz
                                </p>
                                {plate.operador_id && plate.operador_id !== selectedOperador && (
                                  <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px' }}>⚠️ Atribuída a outro operador</p>
                                )}
                                {plate.operador_id === selectedOperador && (
                                  <p style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>✓ Atribuída a este operador</p>
                                )}
                              </div>
                            </div>
                            <div>
                              {plate.operador_id === selectedOperador ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleUnassignPlate(plate.id, plate.plate_number) }} 
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                                >
                                  <Link2Off size={14} /> Remover
                                </button>
                              ) : plate.operador_id ? (
                                <span style={{ fontSize: '12px', color: '#9ca3af', backgroundColor: '#f3f4f6', padding: '6px 12px', borderRadius: '8px' }}>Indisponível</span>
                              ) : selectedPlates.has(plate.id) ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', backgroundColor: '#d1fae5', padding: '6px 12px', borderRadius: '8px' }}>
                                  <CheckCircle size={16} /><span>Selecionada</span>
                                </div>
                              ) : (
                                <div style={{ width: '24px', height: '24px', border: '2px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white' }} />
                              )}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                    <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', fontSize: '13px', color: '#92400e' }}>
                      <strong>💡 Como funciona:</strong>
                      <ul style={{ marginTop: '8px', marginLeft: '20px', marginBottom: 0 }}>
                        <li>Selecione as placas disponíveis (sem dono)</li>
                        <li>Clique em "Atribuir" para vincular as placas selecionadas ao operador</li>
                        <li>Na aba "Atribuídas" você pode remover placas do operador</li>
                        <li>Use a busca para encontrar placas específicas</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

 {/* Placas - COM BOTÃO EDITAR */}
{activeTab === 'plates' && (
  <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
    <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Placa</th>
            <th style={styles.th}>Chefe</th>
            <th style={styles.th}>Taxa</th>
            <th style={styles.th}>Motoqueiros</th>
            <th style={styles.th}>Operador</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredPlates.map((plate) => {
            const assignedOperador = operadores.find(o => o.id === plate.operador_id)
            return (
              <tr key={plate.id}>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Store size={16} color="#3b82f6" />
                    {plate.plate_number}
                  </div>
                </td>
                <td style={styles.td}>{plate.boss?.name || '-'}</td>
                <td style={styles.td}>{plate.weekly_fee?.toLocaleString()} Kz </td>
                <td style={styles.td}>{riders.filter(r => r.plate_id === plate.id).length} / {plate.max_riders || 20}</td>
                <td style={styles.td}>
                  {assignedOperador ? 
                    <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '20px', fontSize: '12px' }}>{assignedOperador.name}</span> : 
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>Não atribuído</span>
                  }
                </td>
                <td style={styles.td}>
                  <button onClick={() => togglePlateStatus(plate.id, plate.is_active)} style={plate.is_active ? styles.badgeActive : styles.badgeInactive}>
                    {plate.is_active ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => {
                        setSelectedPlate(plate)
                        setShowEditPlateModal(true)
                      }} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }} 
                      title="Editar Placa"
                    >
                      <Edit size={16} />
                    </button>
                    <button onClick={() => deleteItem('plates', plate.id, plate.plate_number)} style={styles.buttonDanger}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
          {filteredPlates.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                Nenhuma placa encontrada
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

{/* Pedidos */}
{activeTab === 'orders' && (
  <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
    <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Cliente</th>
            <th style={styles.th}>Telefone</th>
            <th style={styles.th}>Motoqueiro</th>
            <th style={styles.th}>Tel. Motoqueiro</th>
            <th style={styles.th}>Valor</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Data</th>
            <th style={styles.th}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order) => (
            <tr key={order.id}>
              <td style={styles.td}>{order.customer_name || '-'}</td>
              <td style={styles.td}>{order.customer_phone || '-'}</td>
              <td style={styles.td}>
                {order.rider ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{order.rider.name}</span>
                    {order.rider.is_online ? 
                      <span style={{ fontSize: '0.7rem', color: '#10b981' }}>● Online</span> : 
                      <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>● Offline</span>
                    }
                  </div>
                ) : <span style={{ color: '#9ca3af' }}>Não atribuído</span>}
              </td>
              <td style={styles.td}>
                {order.rider?.phone ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{order.rider.phone}</span>
                    <button onClick={() => callRider(order.rider!.phone, order.rider!.name)} style={styles.buttonCall}>
                      <Phone size={12} /> Ligar
                    </button>
                  </div>
                ) : <span>-</span>}
              </td>
              <td style={styles.td}>{order.price?.toLocaleString()} Kz</td>
              <td style={styles.td}>
                <span style={{ 
                  padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', 
                  backgroundColor: order.status === 'completed' ? '#d1fae5' : order.status === 'pending' ? '#fef3c7' : order.status === 'accepted' ? '#dbeafe' : '#fee2e2', 
                  color: order.status === 'completed' ? '#065f46' : order.status === 'pending' ? '#92400e' : order.status === 'accepted' ? '#1e40af' : '#991b1b' 
                }}>
                  {order.status === 'completed' ? 'Concluído' : order.status === 'pending' ? 'Pendente' : order.status === 'accepted' ? 'Aceito' : 'Cancelado'}
                </span>
              </td>
              <td style={styles.td}>{new Date(order.created_at).toLocaleDateString('pt-AO')}</td>
              <td style={styles.td}>
                <button onClick={() => deleteItem('orders', order.id, `pedido de ${order.customer_name}`)} style={styles.buttonDanger}>
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          {filteredOrders.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                Nenhum pedido encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

        {/* Chefes - COM BOTÃO EDITAR */}
        {activeTab === 'bosses' && (
          <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nome</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Telefone</th>
                    <th style={styles.th}>Placa</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBosses.map((boss) => (
                    <tr key={boss.id}>
                      <td style={styles.td}>{boss.name}</td>
                      <td style={styles.td}>{boss.email}</td>
                      <td style={styles.td}>{boss.phone}</td>
                      <td style={styles.td}>{plates.find(p => p.boss_id === boss.id)?.plate_number || '-'}</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => {
                              setSelectedBoss(boss)
                              setShowEditBossModal(true)
                            }} 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }} 
                            title="Editar Chefe"
                          >
                            <Edit size={16} />
                          </button>
                          <button onClick={() => deleteItem('bosses', boss.id, boss.name)} style={styles.buttonDanger}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBosses.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Nenhum chefe encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Motoqueiros - COM BOTÃO EDITAR */}
        {activeTab === 'riders' && (
          <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
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
            
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nome</th>
                    <th style={styles.th}>Telefone</th>
                    <th style={styles.th}>BI</th>
                    <th style={styles.th}>Placa</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Online</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRiders.map((rider) => (
                    <tr key={rider.id} style={{ backgroundColor: rider.is_frozen ? '#fef3c7' : 'white' }}>
                      <td style={styles.td}>
                        {rider.name} {rider.is_frozen && <span style={{ color: '#d97706', fontSize: '11px', marginLeft: '4px' }}>(Congelado)</span>}
                        {rider.frozen_reason && rider.is_frozen && (
                          <div style={{ fontSize: '10px', color: '#d97706', marginTop: '2px' }}>
                            Motivo: {rider.frozen_reason}
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>{rider.phone}</td>
                      <td style={styles.td}>{rider.bi}</td>
                      <td style={styles.td}>{rider.plate?.plate_number || '-'}</td>
                      <td style={styles.td}>
                        <span style={rider.is_frozen ? styles.badgeWarning : (rider.status === 'active' ? styles.badgeActive : styles.badgeInactive)}>
                          {rider.is_frozen ? '❄️ Congelado' : (rider.status === 'active' ? '✅ Ativo' : '⭕ Inativo')}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={rider.is_online ? { ...styles.badgeActive, backgroundColor: '#dbeafe', color: '#1e40af' } : styles.badgeInactive}>
                          {rider.is_online ? '🟢 Online' : '⚫ Offline'}
                        </span>
                        {rider.is_frozen && rider.is_online && (
                          <button 
                            onClick={() => forceOffline(rider.id, rider.name)} 
                            style={{ marginLeft: '8px', backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '10px' }}
                          >
                            Forçar Offline
                          </button>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                              setShowEditRiderModal(true)
                            }} 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }} 
                            title="Editar Motoqueiro"
                          >
                            <Edit size={16} />
                          </button>
                          <button onClick={() => callRider(rider.phone, rider.name)} style={{ ...styles.buttonCall, padding: '4px 8px' }} title="Ligar">
                            <Phone size={14} />
                          </button>
                          <button onClick={() => deleteItem('riders', rider.id, rider.name)} style={styles.buttonDanger}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRiders.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Nenhum motoqueiro encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Editar Chefe */}
      {showEditBossModal && selectedBoss && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '28rem', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', padding: '1rem', borderRadius: '1rem 1rem 0 0', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
              <h3 style={{ fontWeight: 'bold' }}>Editar Chefe</h3>
              <button onClick={() => setShowEditBossModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const name = (form.elements.namedItem('name') as HTMLInputElement).value
              const email = (form.elements.namedItem('email') as HTMLInputElement).value
              const phone = (form.elements.namedItem('phone') as HTMLInputElement).value
              const password = (form.elements.namedItem('password') as HTMLInputElement).value
              
              const success = await handleEditBoss(selectedBoss.id, { name, email, phone, password })
              if (success) setShowEditBossModal(false)
            }} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" name="name" defaultValue={selectedBoss.name} required placeholder="Nome" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              <input type="email" name="email" defaultValue={selectedBoss.email} required placeholder="Email" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              <input type="tel" name="phone" defaultValue={selectedBoss.phone} required placeholder="Telefone" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              <input type="text" name="password" placeholder="Nova Senha (deixe em branco para manter)" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }} />
              <button type="submit" style={{ backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Placa */}
      {showEditPlateModal && selectedPlate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '28rem', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', padding: '1rem', borderRadius: '1rem 1rem 0 0', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
              <h3 style={{ fontWeight: 'bold' }}>Editar Placa</h3>
              <button onClick={() => setShowEditPlateModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const plate_number = (form.elements.namedItem('plate_number') as HTMLInputElement).value
              const boss_id = (form.elements.namedItem('boss_id') as HTMLSelectElement).value
              const weekly_fee = parseInt((form.elements.namedItem('weekly_fee') as HTMLInputElement).value)
              const max_riders = parseInt((form.elements.namedItem('max_riders') as HTMLInputElement).value)
              
              const success = await handleEditPlate(selectedPlate.id, { plate_number, boss_id, weekly_fee, max_riders })
              if (success) setShowEditPlateModal(false)
            }} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" name="plate_number" defaultValue={selectedPlate.plate_number} required placeholder="Número da Placa" maxLength={20} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              <select name="boss_id" defaultValue={selectedPlate.boss_id || ''} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}>
                <option value="">Nenhum chefe</option>
                {bosses.map((boss: Boss) => <option key={boss.id} value={boss.id}>{boss.name}</option>)}
              </select>
              <input type="number" name="weekly_fee" defaultValue={selectedPlate.weekly_fee} required placeholder="Taxa Semanal" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              <input type="number" name="max_riders" defaultValue={selectedPlate.max_riders} required placeholder="Máximo de Motoqueiros" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              <button type="submit" style={{ backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Motoqueiro */}
      {showEditRiderModal && selectedRider && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '28rem', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', padding: '1rem', borderRadius: '1rem 1rem 0 0', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
              <h3 style={{ fontWeight: 'bold' }}>Editar Motoqueiro</h3>
              <button onClick={() => setShowEditRiderModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const name = (form.elements.namedItem('name') as HTMLInputElement).value
              const phone = (form.elements.namedItem('phone') as HTMLInputElement).value
              const bi = (form.elements.namedItem('bi') as HTMLInputElement).value
              const password = (form.elements.namedItem('password') as HTMLInputElement).value
              const plate_id = (form.elements.namedItem('plate_id') as HTMLSelectElement).value
              
              const success = await handleEditRider(selectedRider.id, { name, phone, bi, password, plate_id })
              if (success) setShowEditRiderModal(false)
            }} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" name="name" defaultValue={selectedRider.name} required placeholder="Nome" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              <input type="tel" name="phone" defaultValue={selectedRider.phone} required placeholder="Telefone" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              <input type="text" name="bi" defaultValue={selectedRider.bi} required placeholder="BI" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              <input type="text" name="password" placeholder="Nova Senha (deixe em branco para manter)" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }} />
              <select name="plate_id" defaultValue={selectedRider.plate_id || ''} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}>
                <option value="">Nenhuma placa</option>
                {plates.map((plate: Plate) => <option key={plate.id} value={plate.id}>{plate.plate_number}</option>)}
              </select>
              <button type="submit" style={{ backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {/* Modais de Criação */}
      {showAddAssociation && <AddAssociationModal onClose={() => setShowAddAssociation(false)} onSuccess={() => { setShowAddAssociation(false); loadAllData() }} />}
      {showAddBoss && <AddBossModal onClose={() => setShowAddBoss(false)} onSuccess={() => { setShowAddBoss(false); loadAllData() }} />}
      {showAddPlate && <AddPlateModal bosses={bosses} onClose={() => setShowAddPlate(false)} onSuccess={() => { setShowAddPlate(false); loadAllData() }} />}
      {showAddOperador && <AddOperadorModal onClose={() => setShowAddOperador(false)} onSuccess={() => { setShowAddOperador(false); loadAllData() }} adminId={admin?.id} />}
      {showAddRider && <AddRiderModal plates={plates} onClose={() => setShowAddRider(false)} onSuccess={() => { setShowAddRider(false); loadAllData() }} />}
    </div>
  )
}

// ============================================
// MODAIS DE CRIAÇÃO
// ============================================

function AddAssociationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: 'associacao123', address: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('associations').insert({ ...formData, is_active: true, created_at: new Date().toISOString() })
    if (!error) onSuccess(); else alert('Erro: ' + error.message)
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '28rem', width: '90%' }}>
        <div style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', padding: '1rem', borderRadius: '1rem 1rem 0 0', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
          <h3 style={{ fontWeight: 'bold' }}>Nova Associação</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" required placeholder="Nome" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="email" required placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="tel" required placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="text" placeholder="Endereço" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="text" placeholder="Senha" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }} />
          <button type="submit" disabled={loading} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AddBossModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: 'senha123' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('bosses').insert({ ...formData, created_at: new Date().toISOString() })
    if (!error) onSuccess(); else alert('Erro: ' + error.message)
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '28rem', width: '90%' }}>
        <div style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', padding: '1rem', borderRadius: '1rem 1rem 0 0', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
          <h3 style={{ fontWeight: 'bold' }}>Novo Chefe</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" required placeholder="Nome" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="email" required placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="tel" required placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="text" placeholder="Senha" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }} />
          <button type="submit" disabled={loading} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AddPlateModal({ bosses, onClose, onSuccess }: { bosses: Boss[]; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ plate_number: '', boss_id: '', weekly_fee: 75000, max_riders: 20, fee_per_rider: 300 })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const totalFee = formData.max_riders * formData.fee_per_rider
    const { error } = await supabase.from('plates').insert({
      plate_number: formData.plate_number, boss_id: formData.boss_id || null,
      weekly_fee: formData.weekly_fee, max_riders: formData.max_riders,
      fee_per_rider: formData.fee_per_rider, total_weekly_fee: totalFee,
      is_active: true, created_at: new Date().toISOString()
    })
    if (!error) onSuccess(); else alert('Erro: ' + error.message)
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '28rem', width: '90%' }}>
        <div style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', padding: '1rem', borderRadius: '1rem 1rem 0 0', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
          <h3 style={{ fontWeight: 'bold' }}>Nova Placa</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" required placeholder="Número da Placa" value={formData.plate_number} onChange={(e) => setFormData({...formData, plate_number: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <select value={formData.boss_id} onChange={(e) => setFormData({...formData, boss_id: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}>
            <option value="">Nenhum chefe</option>
            {bosses.map((boss: Boss) => <option key={boss.id} value={boss.id}>{boss.name}</option>)}
          </select>
          <input type="number" placeholder="Taxa Semanal" value={formData.weekly_fee} onChange={(e) => setFormData({...formData, weekly_fee: parseInt(e.target.value)})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="number" placeholder="Máximo de Motoqueiros" value={formData.max_riders} onChange={(e) => setFormData({...formData, max_riders: parseInt(e.target.value)})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <button type="submit" disabled={loading} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AddOperadorModal({ onClose, onSuccess, adminId }: { onClose: () => void; onSuccess: () => void; adminId?: string }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: 'operador123' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('operadores').insert({ ...formData, is_active: true, created_by: adminId, created_at: new Date().toISOString() })
    if (!error) onSuccess(); else alert('Erro: ' + error.message)
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '28rem', width: '90%' }}>
        <div style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', padding: '1rem', borderRadius: '1rem 1rem 0 0', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
          <h3 style={{ fontWeight: 'bold' }}>Novo Operador</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" required placeholder="Nome" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="email" placeholder="Email (opcional)" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="tel" required placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="text" placeholder="Senha" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }} />
          <button type="submit" disabled={loading} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AddRiderModal({ plates, onClose, onSuccess }: { plates: Plate[]; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: '', phone: '', bi: '', password: 'senha123', plate_id: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('riders').insert({
      name: formData.name,
      phone: formData.phone,
      bi: formData.bi,
      password_hash: formData.password,
      plate_id: formData.plate_id || null,
      status: 'active',
      is_online: false,
      is_frozen: false,
      created_at: new Date().toISOString()
    })
    if (!error) { onSuccess(); onClose() } else { alert('Erro: ' + error.message) }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '28rem', width: '90%' }}>
        <div style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', padding: '1rem', borderRadius: '1rem 1rem 0 0', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
          <h3 style={{ fontWeight: 'bold' }}>Novo Motoqueiro</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" required placeholder="Nome" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="tel" required placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="text" required placeholder="BI" value={formData.bi} onChange={(e) => setFormData({...formData, bi: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="text" placeholder="Senha" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }} />
          <select value={formData.plate_id} onChange={(e) => setFormData({...formData, plate_id: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}>
            <option value="">Selecione uma placa (opcional)</option>
            {plates.map((plate: Plate) => <option key={plate.id} value={plate.id}>{plate.plate_number}</option>)}
          </select>
          <button type="submit" disabled={loading} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  )
}