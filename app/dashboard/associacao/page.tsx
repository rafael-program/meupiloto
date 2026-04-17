// app/dashboard/associacao/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Building2, LogOut, Users, Bike, Plus, Edit, Trash2, Search, 
  Menu, X, UserCog, Store, ClipboardList, RefreshCw, 
  DollarSign, Calendar, Shield, Phone, Mail, MapPin, TrendingUp,
  CreditCard
} from 'lucide-react'

type Association = {
  id: string
  name: string
  email: string
  phone: string
  logo_url: string
  address: string
  created_at: string
  is_active: boolean
}

type Plate = {
  id: string
  plate_number: string
  boss_id: string | null
  weekly_fee: number
  is_active: boolean
  max_riders: number
  fee_per_rider: number
  created_at: string
  association_id: string
  boss?: Boss
}

type Boss = {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
  association_id: string
  plate?: Plate
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
  photo_url?: string
  association_id: string
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
  plate_id: string
}

export default function AssociationDashboard() {
  const router = useRouter()
  const [association, setAssociation] = useState<Association | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [plates, setPlates] = useState<Plate[]>([])
  const [bosses, setBosses] = useState<Boss[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddPlate, setShowAddPlate] = useState(false)
  const [showAddBoss, setShowAddBoss] = useState(false)
  const [showAddRider, setShowAddRider] = useState(false)
  const [stats, setStats] = useState({
    totalPlates: 0,
    activePlates: 0,
    totalBosses: 0,
    totalRiders: 0,
    onlineRiders: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  })

  useEffect(() => {
    const associationId = localStorage.getItem('association_id')
    if (!associationId) {
      router.push('/login/associacao')
      return
    }
    loadAssociation(associationId)
    loadAllData(associationId)
  }, [])

  const loadAssociation = async (associationId: string) => {
    const { data } = await supabase
      .from('associations')
      .select('*')
      .eq('id', associationId)
      .single()
    setAssociation(data)
  }

  const loadAllData = async (associationId: string) => {
    setLoading(true)

    const { data: platesData } = await supabase
      .from('plates')
      .select('*, boss:bosses(*)')
      .eq('association_id', associationId)
      .order('created_at', { ascending: false })
    setPlates(platesData || [])

    const { data: bossesData } = await supabase
      .from('bosses')
      .select('*, plate:plates(plate_number)')
      .eq('association_id', associationId)
      .order('created_at', { ascending: false })
    setBosses(bossesData || [])

    const { data: ridersData } = await supabase
      .from('riders')
      .select('*, plate:plates(plate_number)')
      .eq('association_id', associationId)
      .order('created_at', { ascending: false })
    setRiders(ridersData || [])

    const plateIds = platesData?.map(p => p.id) || []
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .in('plate_id', plateIds)
      .order('created_at', { ascending: false })
    setOrders(ordersData || [])

    const activePlates = platesData?.filter(p => p.is_active === true) || []
    const onlineRiders = ridersData?.filter(r => r.is_online === true) || []
    const completedOrders = ordersData?.filter(o => o.status === 'completed') || []
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0)
    const pendingOrders = ordersData?.filter(o => o.status === 'pending') || []

    setStats({
      totalPlates: platesData?.length || 0,
      activePlates: activePlates.length,
      totalBosses: bossesData?.length || 0,
      totalRiders: ridersData?.length || 0,
      onlineRiders: onlineRiders.length,
      totalOrders: ordersData?.length || 0,
      totalRevenue,
      pendingOrders: pendingOrders.length
    })

    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/login/associacao')
  }

  const deleteItem = async (table: string, id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir ${name}?`)) {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (!error) {
        const associationId = localStorage.getItem('association_id')
        if (associationId) loadAllData(associationId)
      } else {
        alert('Erro ao excluir: ' + error.message)
      }
    }
  }

  const togglePlateStatus = async (plateId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('plates').update({ is_active: !currentStatus }).eq('id', plateId)
    if (!error) {
      const associationId = localStorage.getItem('association_id')
      if (associationId) loadAllData(associationId)
    }
  }

  const filteredPlates = plates.filter(p => 
    p.plate_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredBosses = bosses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.phone.includes(searchTerm)
  )

  const filteredRiders = riders.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone.includes(searchTerm) || r.bi.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredOrders = orders.filter(o => 
    o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer_phone?.includes(searchTerm)
  )

  const styles: Record<string, React.CSSProperties> = {
    container: { minHeight: '100vh', backgroundColor: '#f3f4f6' },
    card: { backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, borderBottom: '1px solid #e5e7eb' },
    td: { padding: '1rem 1.5rem', fontSize: '0.875rem', borderBottom: '1px solid #e5e7eb' },
    buttonPrimary: { backgroundColor: '#2563eb', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    buttonDanger: { color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' },
    badgeActive: { backgroundColor: '#d1fae5', color: '#065f46', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' },
    badgeInactive: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '1rem',
      maxWidth: '28rem',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ animation: 'spin 1s linear infinite', width: '3rem', height: '3rem', border: '2px solid #2563eb', borderTopColor: 'transparent', borderRadius: '9999px', margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#6b7280' }}>Carregando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={32} color="#2563eb" />
                <div>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{association?.name}</h1>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Associação</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                  { id: 'plates', label: 'Placas', icon: Store },
                  { id: 'bosses', label: 'Chefes', icon: UserCog },
                  { id: 'riders', label: 'Motoqueiros', icon: Bike },
                  { id: 'orders', label: 'Pedidos', icon: ClipboardList }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
                      borderRadius: '0.75rem', transition: 'all 0.2s',
                      backgroundColor: activeTab === item.id ? '#2563eb' : 'transparent',
                      color: activeTab === item.id ? 'white' : '#4b5563',
                      border: 'none', cursor: 'pointer'
                    }}
                  >
                    <item.icon size={18} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={() => {
                const associationId = localStorage.getItem('association_id')
                if (associationId) loadAllData(associationId)
              }} style={{ padding: '0.5rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
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

              {(activeTab === 'bosses' || activeTab === 'plates' || activeTab === 'riders') && (
                <button 
                  onClick={() => {
                    if (activeTab === 'bosses') setShowAddBoss(true)
                    else if (activeTab === 'plates') setShowAddPlate(true)
                    else setShowAddRider(true)
                  }} 
                  style={styles.buttonPrimary}
                >
                  <Plus size={16} /> Novo
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.75rem', borderLeft: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '2rem', height: '2rem', backgroundColor: '#2563eb', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 'bold' }}>{association?.name?.charAt(0) || 'A'}</span>
                  </div>
                  <div style={{ display: 'none', '@media (min-width: 1024px)': { display: 'block' } } as any}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{association?.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{association?.email}</p>
                  </div>
                </div>
                <button onClick={handleLogout} style={{ padding: '0.5rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <LogOut size={20} />
                </button>
              </div>

              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                style={{ display: 'none', '@media (max-width: 768px)': { display: 'block' } } as any}
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={styles.card}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Placas</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalPlates}</p>
                <p style={{ fontSize: '0.75rem', color: '#059669' }}>{stats.activePlates} ativas</p>
              </div>
              <div style={styles.card}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Chefes</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalBosses}</p>
              </div>
              <div style={styles.card}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Motoqueiros</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalRiders}</p>
                <p style={{ fontSize: '0.75rem', color: '#059669' }}>{stats.onlineRiders} online</p>
              </div>
              <div style={styles.card}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pedidos</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalOrders}</p>
                <p style={{ fontSize: '0.75rem', color: '#d97706' }}>{stats.pendingOrders} pendentes</p>
              </div>
              <div style={{ ...styles.card, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white' }}>
                <DollarSign size={24} style={{ marginBottom: '0.5rem', opacity: 0.8 }} />
                <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Receita Total</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalRevenue.toLocaleString()} Kz</p>
              </div>
            </div>
          </div>
        )}

        {/* Placas */}
        {activeTab === 'plates' && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Placa</th>
                  <th style={styles.th}>Chefe</th>
                  <th style={styles.th}>Taxa</th>
                  <th style={styles.th}>Motoqueiros</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlates.map((plate) => (
                  <tr key={plate.id}>
                    <td style={styles.td}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Store size={16} color="#3b82f6" />{plate.plate_number}</div></td>
                    <td style={styles.td}>{plate.boss?.name || '-'}</td>
                    <td style={styles.td}>{plate.weekly_fee?.toLocaleString()} Kz</td>
                    <td style={styles.td}>{riders.filter(r => r.plate_id === plate.id).length} / {plate.max_riders || 20}</td>
                    <td style={styles.td}>
                      <button onClick={() => togglePlateStatus(plate.id, plate.is_active)} style={plate.is_active ? styles.badgeActive : styles.badgeInactive}>
                        {plate.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td style={styles.td}>
                      <button onClick={() => deleteItem('plates', plate.id, plate.plate_number)} style={styles.buttonDanger}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPlates.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Nenhuma placa encontrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Chefes */}
        {activeTab === 'bosses' && (
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
                    <td style={styles.td}>{boss.plate?.plate_number || '-'}</td>
                    <td style={styles.td}>
                      <button onClick={() => deleteItem('bosses', boss.id, boss.name)} style={styles.buttonDanger}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredBosses.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Nenhum chefe encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Motoqueiros */}
        {activeTab === 'riders' && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nome</th>
                  <th style={styles.th}>Telefone</th>
                  <th style={styles.th}>BI</th>
                  <th style={styles.th}>Placa</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRiders.map((rider) => (
                  <tr key={rider.id}>
                    <td style={styles.td}>{rider.name}</td>
                    <td style={styles.td}>{rider.phone}</td>
                    <td style={styles.td}>{rider.bi}</td>
                    <td style={styles.td}>{rider.plate?.plate_number || '-'}</td>
                    <td style={styles.td}>
                      <span style={rider.status === 'active' ? styles.badgeActive : styles.badgeInactive}>
                        {rider.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button onClick={() => deleteItem('riders', rider.id, rider.name)} style={styles.buttonDanger}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRiders.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Nenhum motoqueiro encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pedidos */}
        {activeTab === 'orders' && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Telefone</th>
                  <th style={styles.th}>Valor</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={styles.td}>{order.customer_name || '-'}</td>
                    <td style={styles.td}>{order.customer_phone || '-'}</td>
                    <td style={styles.td}>{order.price?.toLocaleString()} Kz</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem',
                        backgroundColor: order.status === 'completed' ? '#d1fae5' : order.status === 'pending' ? '#fef3c7' : '#dbeafe',
                        color: order.status === 'completed' ? '#065f46' : order.status === 'pending' ? '#92400e' : '#1e40af'
                      }}>
                        {order.status === 'completed' ? 'Concluído' : order.status === 'pending' ? 'Pendente' : 'Aceito'}
                      </span>
                    </td>
                    <td style={styles.td}>{new Date(order.created_at).toLocaleDateString('pt-AO')}</td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Nenhum pedido encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Adicionar Placa - CENTRALIZADO */}
      {showAddPlate && (
        <div style={styles.modalOverlay} onClick={() => setShowAddPlate(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Nova Placa</h3>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const plate_number = formData.get('plate_number') as string
                const weekly_fee = parseInt(formData.get('weekly_fee') as string)
                const max_riders = parseInt(formData.get('max_riders') as string)
                const associationId = localStorage.getItem('association_id')
                
                const { error } = await supabase.from('plates').insert({
                  plate_number,
                  weekly_fee,
                  max_riders,
                  fee_per_rider: 300,
                  total_weekly_fee: max_riders * 300,
                  association_id: associationId,
                  is_active: true,
                  created_at: new Date().toISOString()
                })
                if (!error) {
                  setShowAddPlate(false)
                  const associationId = localStorage.getItem('association_id')
                  if (associationId) loadAllData(associationId)
                } else {
                  alert('Erro: ' + error.message)
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" name="plate_number" placeholder="Nome da Placa" required style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                <input type="number" name="weekly_fee" placeholder="Taxa Semanal" defaultValue="75000" required style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                <input type="number" name="max_riders" placeholder="Máximo de Motoqueiros" defaultValue="20" required style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowAddPlate(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cadastrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Chefe - CENTRALIZADO */}
      {showAddBoss && (
        <div style={styles.modalOverlay} onClick={() => setShowAddBoss(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Novo Chefe</h3>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const name = formData.get('name') as string
                const email = formData.get('email') as string
                const phone = formData.get('phone') as string
                const password = (formData.get('password') as string) || 'senha123'
                const plate_id = formData.get('plate_id') as string
                const associationId = localStorage.getItem('association_id')
                
                const { data: newBoss, error: bossError } = await supabase.from('bosses').insert({
                  name,
                  email,
                  phone,
                  password,
                  association_id: associationId,
                  created_at: new Date().toISOString()
                }).select().single()
                
                if (bossError) {
                  alert('Erro ao criar chefe: ' + bossError.message)
                  return
                }
                
                if (plate_id && newBoss) {
                  await supabase.from('plates').update({ boss_id: newBoss.id }).eq('id', plate_id)
                }
                
                setShowAddBoss(false)
                const associationIdReload = localStorage.getItem('association_id')
                if (associationIdReload) loadAllData(associationIdReload)
              }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" name="name" placeholder="Nome completo" required style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                <input type="email" name="email" placeholder="Email" required style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                <input type="tel" name="phone" placeholder="Telefone" required style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                <input type="text" name="password" placeholder="Senha (opcional)" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                <select name="plate_id" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}>
                  <option value="">Nenhuma placa</option>
                  {plates.map(plate => <option key={plate.id} value={plate.id}>{plate.plate_number}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowAddBoss(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cadastrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Motoqueiro - CENTRALIZADO */}
      {showAddRider && (
        <div style={styles.modalOverlay} onClick={() => setShowAddRider(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Novo Motoqueiro</h3>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const name = formData.get('name') as string
                const phone = formData.get('phone') as string
                const bi = formData.get('bi') as string
                const password = (formData.get('password') as string) || 'senha123'
                const plate_id = formData.get('plate_id') as string
                const associationId = localStorage.getItem('association_id')
                
                const { error } = await supabase.from('riders').insert({
                  name,
                  phone,
                  bi,
                  password_hash: password,
                  plate_id: plate_id || null,
                  association_id: associationId,
                  status: 'active',
                  is_online: false,
                  created_at: new Date().toISOString()
                })
                
                if (!error) {
                  setShowAddRider(false)
                  const associationIdReload = localStorage.getItem('association_id')
                  if (associationIdReload) loadAllData(associationIdReload)
                } else {
                  alert('Erro ao cadastrar motoqueiro: ' + error.message)
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" name="name" placeholder="Nome completo" required style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                <input type="tel" name="phone" placeholder="Telefone" required style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                <input type="text" name="bi" placeholder="BI" required style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                <input type="text" name="password" placeholder="Senha (opcional)" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                <select name="plate_id" style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}>
                  <option value="">Nenhuma placa</option>
                  {plates.map(plate => <option key={plate.id} value={plate.id}>{plate.plate_number}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowAddRider(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cadastrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}