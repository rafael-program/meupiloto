// app/dashboard/admin/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Shield, LogOut, Users, Bike, CreditCard, TrendingUp, 
  Plus, Edit, Trash2, Search, AlertCircle, Menu, X, 
  UserCog, Store, ClipboardList, RefreshCw, Phone,
  DollarSign, Calendar, CheckCircle, XCircle, Building2,
  UserPlus, UserCheck, UserX
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
}

type Rider = {
  id: string
  name: string
  phone: string
  bi: string
  plate_id: string | null
  is_online: boolean
  status: string
  created_at: string
  plate?: { plate_number: string }
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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [associations, setAssociations] = useState<Association[]>([])
  const [bosses, setBosses] = useState<Boss[]>([])
  const [plates, setPlates] = useState<Plate[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddAssociation, setShowAddAssociation] = useState(false)
  const [showAddBoss, setShowAddBoss] = useState(false)
  const [showAddPlate, setShowAddPlate] = useState(false)
  const [showAddOperador, setShowAddOperador] = useState(false)
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
    activeOperadores: 0
  })

  useEffect(() => {
    const adminId = localStorage.getItem('admin_id')
    if (!adminId) {
      router.push('/login/admin')
      return
    }
    loadAdmin(adminId)
    loadAllData()
  }, [])

  const loadAdmin = async (adminId: string) => {
    const { data } = await supabase.from('admins').select('*').eq('id', adminId).single()
    setAdmin(data)
  }

  const loadAllData = async () => {
    setLoading(true)

    // Carregar associações
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

    // Carregar operadores
    const { data: operadoresData } = await supabase.from('operadores').select('*').order('created_at', { ascending: false })
    setOperadores(operadoresData || [])

    const completedOrders = ordersData?.filter(o => o.status === 'completed') || []
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0)
    const onlineRiders = ridersData?.filter(r => r.is_online === true) || []
    const activePlates = platesData?.filter(p => p.is_active === true) || []
    const activeOperadores = operadoresData?.filter(o => o.is_active === true) || []

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
      activeOperadores: activeOperadores.length
    })

    setLoading(false)
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
    p.boss?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredRiders = riders.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone.includes(searchTerm) || r.bi.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredOrders = orders.filter(o => 
    o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer_phone?.includes(searchTerm) ||
    o.rider?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.rider?.phone?.includes(searchTerm)
  )

  const filteredOperadores = operadores.filter(op => 
    op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.phone.includes(searchTerm)
  )

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
      width: sidebarOpen ? '16rem' : '5rem',
      overflow: 'hidden'
    },
    mainContent: { 
      transition: 'all 0.3s', 
      marginLeft: sidebarOpen ? '16rem' : '5rem'
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
    input: { padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }
  }

  return (
    <div style={styles.container}>
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
              { id: 'orders', label: 'Pedidos', icon: ClipboardList },
              { id: 'plates', label: 'Placas', icon: Store },
              { id: 'bosses', label: 'Chefes', icon: UserCog },
              { id: 'riders', label: 'Motoqueiros', icon: Bike }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', background: activeTab === item.id ? '#4f46e5' : 'transparent',
                  color: activeTab === item.id ? 'white' : '#9ca3af', border: 'none', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <item.icon size={20} />
                {sidebarOpen && <span style={{ fontSize: '0.875rem' }}>{item.label}</span>}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'associations' && 'Associações'}
                  {activeTab === 'operadores' && 'Operadores'}
                  {activeTab === 'orders' && 'Pedidos'}
                  {activeTab === 'plates' && 'Placas'}
                  {activeTab === 'bosses' && 'Chefes'}
                  {activeTab === 'riders' && 'Motoqueiros'}
                </h1>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
                    style={{ padding: '0.5rem 0.5rem 0.5rem 2rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', width: '16rem' }}
                  />
                </div>
                {(activeTab === 'associations' || activeTab === 'bosses' || activeTab === 'plates' || activeTab === 'operadores') && (
                  <button 
                    onClick={() => {
                      if (activeTab === 'associations') setShowAddAssociation(true)
                      else if (activeTab === 'bosses') setShowAddBoss(true)
                      else if (activeTab === 'plates') setShowAddPlate(true)
                      else if (activeTab === 'operadores') setShowAddOperador(true)
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={styles.card}><p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Associações</p><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalAssociations}</p></div>
              <div style={styles.card}><p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Operadores</p><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalOperadores}</p><p style={{ fontSize: '0.75rem', color: '#059669' }}>{stats.activeOperadores} ativos</p></div>
              <div style={styles.card}><p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Placas</p><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalPlates}</p><p style={{ fontSize: '0.75rem', color: '#059669' }}>{stats.activePlates} ativas</p></div>
              <div style={styles.card}><p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Chefes</p><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalBosses}</p></div>
              <div style={styles.card}><p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Motoqueiros</p><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalRiders}</p><p style={{ fontSize: '0.75rem', color: '#059669' }}>{stats.onlineRiders} online</p></div>
              <div style={styles.card}><p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pedidos</p><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalOrders}</p></div>
              <div style={{ ...styles.card, background: 'linear-gradient(135deg, #4f46e5, #4338ca)', color: 'white' }}>
                <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Receita Total</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalRevenue.toLocaleString()} Kz</p>
              </div>
            </div>
          </div>
        )}

        {/* Associações */}
        {activeTab === 'associations' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Nome</th><th style={styles.th}>Email</th><th style={styles.th}>Telefone</th><th style={styles.th}>Status</th><th style={styles.th}>Ações</th></tr></thead>
                <tbody>
                  {filteredAssociations.map((assoc) => (
                    <tr key={assoc.id}>
                      <td style={styles.td}>{assoc.name}</td>
                      <td style={styles.td}>{assoc.email}</td>
                      <td style={styles.td}>{assoc.phone}</td>
                      <td style={styles.td}><span style={assoc.is_active ? styles.badgeActive : styles.badgeInactive}>{assoc.is_active ? 'Ativo' : 'Inativo'}</span></td>
                      <td style={styles.td}><button onClick={() => deleteItem('associations', assoc.id, assoc.name)} style={styles.buttonDanger}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                  {filteredAssociations.length === 0 && (<tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Nenhuma associação encontrada</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Operadores */}
        {activeTab === 'operadores' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Nome</th><th style={styles.th}>Email</th><th style={styles.th}>Telefone</th><th style={styles.th}>Status</th><th style={styles.th}>Criado em</th><th style={styles.th}>Ações</th></tr></thead>
                <tbody>
                  {filteredOperadores.map((op) => (
                    <tr key={op.id}>
                      <td style={styles.td}>{op.name}</td>
                      <td style={styles.td}>{op.email || '-'}</td>
                      <td style={styles.td}>{op.phone}</td>
                      <td style={styles.td}>
                        <button onClick={() => toggleOperadorStatus(op.id, op.is_active)} style={op.is_active ? styles.badgeActive : styles.badgeInactive}>
                          {op.is_active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td style={styles.td}>{new Date(op.created_at).toLocaleDateString('pt-AO')}</td>
                      <td style={styles.td}>
                        <button onClick={() => deleteItem('operadores', op.id, op.name)} style={styles.buttonDanger}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOperadores.length === 0 && (<tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Nenhum operador encontrado</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pedidos */}
        {activeTab === 'orders' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Cliente</th><th style={styles.th}>Telefone</th><th style={styles.th}>Motoqueiro</th><th style={styles.th}>Tel. Motoqueiro</th><th style={styles.th}>Valor</th><th style={styles.th}>Status</th><th style={styles.th}>Data</th><th style={styles.th}>Ações</th></tr></thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td style={styles.td}>{order.customer_name || '-'}</td>
                      <td style={styles.td}>{order.customer_phone || '-'}</td>
                      <td style={styles.td}>
                        {order.rider ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{order.rider.name}</span>
                            {order.rider.is_online ? <span style={{ fontSize: '0.7rem', color: '#10b981' }}>● Online</span> : <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>● Offline</span>}
                          </div>
                        ) : <span style={{ color: '#9ca3af' }}>Não atribuído</span>}
                      </td>
                      <td style={styles.td}>
                        {order.rider?.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{order.rider.phone}</span>
                            <button onClick={() => callRider(order.rider!.phone, order.rider!.name)} style={styles.buttonCall}><Phone size={12} /> Ligar</button>
                          </div>
                        ) : (<span style={{ color: '#9ca3af' }}>-</span>)}
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
                      <td style={styles.td}><button onClick={() => deleteItem('orders', order.id, `pedido de ${order.customer_name}`)} style={styles.buttonDanger}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (<tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Nenhum pedido encontrado</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Placas */}
        {activeTab === 'plates' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
              <table style={styles.table}>
                <thead><tr>{['Placa', 'Chefe', 'Taxa', 'Motoqueiros', 'Status', 'Ações'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredPlates.map((plate) => (
                    <tr key={plate.id}>
                      <td style={styles.td}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Store size={16} color="#3b82f6" />{plate.plate_number}</div></td>
                      <td style={styles.td}>{plate.boss?.name || '-'}</td>
                      <td style={styles.td}>{plate.weekly_fee?.toLocaleString()} Kz</td>
                      <td style={styles.td}>{riders.filter(r => r.plate_id === plate.id).length} / {plate.max_riders || 20}</td>
                      <td style={styles.td}><button onClick={() => togglePlateStatus(plate.id, plate.is_active)} style={plate.is_active ? styles.badgeActive : styles.badgeInactive}>{plate.is_active ? 'Ativo' : 'Inativo'}</button></td>
                      <td style={styles.td}><button onClick={() => deleteItem('plates', plate.id, plate.plate_number)} style={styles.buttonDanger}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chefes */}
        {activeTab === 'bosses' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
              <table style={styles.table}>
                <thead><tr>{['Nome', 'Email', 'Telefone', 'Placa', 'Ações'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredBosses.map((boss) => (
                    <tr key={boss.id}>
                      <td style={styles.td}>{boss.name}</td>
                      <td style={styles.td}>{boss.email}</td>
                      <td style={styles.td}>{boss.phone}</td>
                      <td style={styles.td}>{plates.find(p => p.boss_id === boss.id)?.plate_number || '-'}</td>
                      <td style={styles.td}><button onClick={() => deleteItem('bosses', boss.id, boss.name)} style={styles.buttonDanger}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Motoqueiros */}
        {activeTab === 'riders' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
              <table style={styles.table}>
                <thead><tr>{['Nome', 'Telefone', 'BI', 'Placa', 'Status', 'Ações'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredRiders.map((rider) => (
                    <tr key={rider.id}>
                      <td style={styles.td}>{rider.name}</td>
                      <td style={styles.td}>{rider.phone}</td>
                      <td style={styles.td}>{rider.bi}</td>
                      <td style={styles.td}>{rider.plate?.plate_number || '-'}</td>
                      <td style={styles.td}><span style={rider.status === 'active' ? styles.badgeActive : styles.badgeInactive}>{rider.status === 'active' ? 'Ativo' : 'Inativo'}</span></td>
                      <td style={styles.td}><button onClick={() => deleteItem('riders', rider.id, rider.name)} style={styles.buttonDanger}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      {showAddAssociation && <AddAssociationModal onClose={() => setShowAddAssociation(false)} onSuccess={() => { setShowAddAssociation(false); loadAllData() }} />}
      {showAddBoss && <AddBossModal onClose={() => setShowAddBoss(false)} onSuccess={() => { setShowAddBoss(false); loadAllData() }} />}
      {showAddPlate && <AddPlateModal bosses={bosses} onClose={() => setShowAddPlate(false)} onSuccess={() => { setShowAddPlate(false); loadAllData() }} />}
      {showAddOperador && <AddOperadorModal onClose={() => setShowAddOperador(false)} onSuccess={() => { setShowAddOperador(false); loadAllData() }} adminId={admin?.id} />}
    </div>
  )
}

// Modal de Adicionar Associação
function AddAssociationModal({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: 'associacao123', address: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('associations').insert({ 
      ...formData, 
      is_active: true,
      created_at: new Date().toISOString() 
    })
    if (!error) onSuccess(); else alert('Erro: ' + error.message)
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '28rem', width: '90%' }}>
        <div style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', padding: '1rem', borderRadius: '1rem 1rem 0 0', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
          <h3 style={{ fontWeight: 'bold' }}>Nova Associação</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" required placeholder="Nome da Associação" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="email" required placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="tel" required placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="text" placeholder="Endereço" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="text" placeholder="Senha" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }} />
          <button type="submit" disabled={loading} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
        </form>
      </div>
    </div>
  )
}

// Modal de Adicionar Chefe
function AddBossModal({ onClose, onSuccess }: any) {
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" required placeholder="Nome completo" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="email" required placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="tel" required placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="text" placeholder="Senha" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }} />
          <button type="submit" disabled={loading} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
        </form>
      </div>
    </div>
  )
}

// Modal de Adicionar Placa
function AddPlateModal({ bosses, onClose, onSuccess }: any) {
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" required placeholder="Nome da Placa" value={formData.plate_number} onChange={(e) => setFormData({...formData, plate_number: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <select value={formData.boss_id} onChange={(e) => setFormData({...formData, boss_id: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}>
            <option value="">Nenhum chefe</option>
            {bosses.map((boss: any) => <option key={boss.id} value={boss.id}>{boss.name}</option>)}
          </select>
          <input type="number" placeholder="Taxa Semanal" value={formData.weekly_fee} onChange={(e) => setFormData({...formData, weekly_fee: parseInt(e.target.value)})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="number" placeholder="Máximo de Motoqueiros" value={formData.max_riders} onChange={(e) => setFormData({...formData, max_riders: parseInt(e.target.value)})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <button type="submit" disabled={loading} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
        </form>
      </div>
    </div>
  )
}

// Modal de Adicionar Operador
function AddOperadorModal({ onClose, onSuccess, adminId }: any) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: 'operador123' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('operadores').insert({ 
      ...formData, 
      is_active: true,
      created_by: adminId,
      created_at: new Date().toISOString() 
    })
    if (!error) onSuccess(); else alert('Erro: ' + error.message)
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '28rem', width: '90%' }}>
        <div style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', padding: '1rem', borderRadius: '1rem 1rem 0 0', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
          <h3 style={{ fontWeight: 'bold' }}>Novo Operador</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" required placeholder="Nome completo" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="email" placeholder="Email (opcional)" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="tel" required placeholder="Telefone (usado para login)" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          <input type="text" placeholder="Senha" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }} />
          <button type="submit" disabled={loading} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
        </form>
      </div>
    </div>
  )
}