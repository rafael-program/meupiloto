// app/dashboard/associacao/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Building2, LogOut, Users, Bike, Plus, Edit, Trash2, Search, 
  Menu, X, UserCog, Store, ClipboardList, RefreshCw, 
  DollarSign, Calendar, Shield, Phone, Mail, MapPin, TrendingUp,
  CreditCard, Star, Wifi, WifiOff, AlertCircle, CheckCircle
} from 'lucide-react'
import Link from 'next/link'

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
  const [isMobile, setIsMobile] = useState(false)
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
      try {
        if (table === 'plates') {
          const { data: riders, error: ridersError } = await supabase
            .from('riders')
            .select('id')
            .eq('plate_id', id)
          
          if (ridersError) throw ridersError
          
          if (riders && riders.length > 0) {
            if (!confirm(`Esta placa tem ${riders.length} motoqueiro(s) associado(s). Excluir também os motoqueiros?`)) {
              return
            }
            await supabase.from('riders').delete().eq('plate_id', id)
          }
        }
        
        if (table === 'bosses') {
          await supabase.from('plates').update({ boss_id: null }).eq('boss_id', id)
        }
        
        const { error } = await supabase.from(table).delete().eq('id', id)
        if (error) throw error
        
        const associationId = localStorage.getItem('association_id')
        if (associationId) loadAllData(associationId)
      } catch (err: any) {
        alert('Erro ao excluir: ' + err.message)
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return { bg: '#d1fae5', color: '#065f46', text: 'Concluído', icon: CheckCircle }
      case 'pending': return { bg: '#fef3c7', color: '#92400e', text: 'Pendente', icon: AlertCircle }
      case 'accepted': return { bg: '#dbeafe', color: '#1e40af', text: 'Aceito', icon: Wifi }
      default: return { bg: '#fee2e2', color: '#991b1b', text: 'Cancelado', icon: X }
    }
  }

  const styles: Record<string, React.CSSProperties> = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #f9fafb 0%, #eff6ff 100%)' },
    header: { backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f0f0f0', position: 'sticky' as const, top: 0, zIndex: 10 },
    card: { backgroundColor: 'white', borderRadius: isMobile ? '16px' : '20px', padding: isMobile ? '16px' : '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', transition: 'all 0.3s ease' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { padding: isMobile ? '12px 16px' : '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, borderBottom: '1px solid #e5e7eb' },
    td: { padding: isMobile ? '12px 16px' : '16px 24px', fontSize: isMobile ? '13px' : '14px', borderBottom: '1px solid #e5e7eb' },
    buttonPrimary: { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', padding: isMobile ? '10px 16px' : '12px 20px', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: isMobile ? '13px' : '14px', transition: 'all 0.3s ease' },
    buttonDanger: { color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s' },
    badgeActive: { backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' },
    badgeInactive: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' },
    modalOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '24px',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
    },
    input: { width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: isMobile ? '16px' : '14px', transition: 'all 0.3s ease' },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#374151' },
    select: { width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: 'white', fontSize: isMobile ? '16px' : '14px' },
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

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ animation: 'spin 1s linear infinite', width: '48px', height: '48px', border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }}></div>
            <p style={{ color: '#6b7280' }}>Carregando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Overlay do menu mobile */}
      <div style={styles.overlay} onClick={() => setMobileMenuOpen(false)} />

      {/* Menu Mobile */}
      <div style={styles.mobileMenu}>
        <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={24} color="#2563eb" />
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Menu</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} color="#6b7280" />
          </button>
        </div>
        <div style={{ padding: '16px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'plates', label: 'Placas', icon: Store },
            { id: 'bosses', label: 'Chefes', icon: UserCog },
            { id: 'riders', label: 'Motoqueiros', icon: Bike },
            { id: 'orders', label: 'Pedidos', icon: ClipboardList }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                setMobileMenuOpen(false)
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '4px',
                backgroundColor: activeTab === item.id ? '#eff6ff' : 'transparent',
                color: activeTab === item.id ? '#2563eb' : '#4b5563',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <item.icon size={20} />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
            </button>
          ))}
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '16px', paddingTop: '16px' }}>
            <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}>
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '12px 16px' : '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={isMobile ? 20 : 24} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: '#111827' }}>{association?.name}</h1>
                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Associação • {association?.email}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
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
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                      borderRadius: '10px', transition: 'all 0.2s',
                      backgroundColor: activeTab === item.id ? '#2563eb' : 'transparent',
                      color: activeTab === item.id ? 'white' : '#4b5563',
                      border: 'none', cursor: 'pointer'
                    }}
                  >
                    <item.icon size={16} />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => {
                const associationId = localStorage.getItem('association_id')
                if (associationId) loadAllData(associationId)
              }} style={{ padding: '8px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px' }}>
                <RefreshCw size={18} />
              </button>
              
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '8px 12px 8px 36px', border: '1px solid #e5e7eb', borderRadius: '10px', width: isMobile ? '150px' : '200px', fontSize: '13px', outline: 'none' }}
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
                  <Plus size={16} /> {!isMobile && 'Novo'}
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid #e5e7eb' }}>
                <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>{association?.name?.charAt(0) || 'A'}</span>
                </div>
                <button onClick={handleLogout} style={{ padding: '6px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
                  <LogOut size={18} />
                </button>
              </div>

              {isMobile && (
                <button onClick={() => setMobileMenuOpen(true)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Menu size={24} color="#374151" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? '12px' : '16px', marginBottom: '24px' }}>
              <div style={styles.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <Store size={isMobile ? 20 : 24} color="#3b82f6" />
                  <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold' }}>{stats.totalPlates}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Placas</p>
                <p style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>{stats.activePlates} ativas</p>
              </div>
              
              <div style={styles.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <UserCog size={isMobile ? 20 : 24} color="#8b5cf6" />
                  <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold' }}>{stats.totalBosses}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Chefes</p>
              </div>
              
              <div style={styles.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <Bike size={isMobile ? 20 : 24} color="#10b981" />
                  <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold' }}>{stats.totalRiders}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Motoqueiros</p>
                <p style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>{stats.onlineRiders} online</p>
              </div>
              
              <div style={styles.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <ClipboardList size={isMobile ? 20 : 24} color="#f59e0b" />
                  <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold' }}>{stats.totalOrders}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Pedidos</p>
                <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>{stats.pendingOrders} pendentes</p>
              </div>
              
              <div style={{ ...styles.card, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <DollarSign size={isMobile ? 20 : 24} style={{ opacity: 0.8 }} />
                  <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold' }}>{stats.totalRevenue.toLocaleString()} Kz</span>
                </div>
                <p style={{ fontSize: '12px', opacity: 0.8 }}>Receita Total</p>
              </div>
            </div>
          </div>
        )}

        {/* Placas - Versão responsiva com cards no mobile */}
        {activeTab === 'plates' && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            {isMobile ? (
              <div style={{ padding: '16px' }}>
                {filteredPlates.map((plate) => (
                  <div key={plate.id} style={{ marginBottom: '12px', padding: '16px', border: '1px solid #f0f0f0', borderRadius: '16px', backgroundColor: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Store size={20} color="#3b82f6" />
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{plate.plate_number}</span>
                      </div>
                      <button onClick={() => togglePlateStatus(plate.id, plate.is_active)}>
                        <span style={plate.is_active ? styles.badgeActive : styles.badgeInactive}>
                          {plate.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </button>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                      <div>Chefe: {plate.boss?.name || '-'}</div>
                      <div>Taxa: {plate.weekly_fee?.toLocaleString()} Kz</div>
                      <div>Motoqueiros: {riders.filter(r => r.plate_id === plate.id).length} / {plate.max_riders || 20}</div>
                    </div>
                    <button onClick={() => deleteItem('plates', plate.id, plate.plate_number)} style={{ width: '100%', padding: '10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', marginTop: '8px' }}>
                      Excluir
                    </button>
                  </div>
                ))}
                {filteredPlates.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <Store size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p>Nenhuma placa encontrada</p>
                  </div>
                )}
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr><th style={styles.th}>Placa</th><th style={styles.th}>Chefe</th><th style={styles.th}>Taxa</th><th style={styles.th}>Motoqueiros</th><th style={styles.th}>Status</th><th style={styles.th}>Ações</th></tr>
                </thead>
                <tbody>
                  {filteredPlates.map((plate) => (
                    <tr key={plate.id}>
                      <td style={styles.td}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Store size={16} color="#3b82f6" />{plate.plate_number}</div></td>
                      <td style={styles.td}>{plate.boss?.name || '-'}</td>
                      <td style={styles.td}>{plate.weekly_fee?.toLocaleString()} Kz</td>
                      <td style={styles.td}>{riders.filter(r => r.plate_id === plate.id).length} / {plate.max_riders || 20}</td>
                      <td style={styles.td}><button onClick={() => togglePlateStatus(plate.id, plate.is_active)}><span style={plate.is_active ? styles.badgeActive : styles.badgeInactive}>{plate.is_active ? 'Ativo' : 'Inativo'}</span></button></td>
                      <td style={styles.td}><button onClick={() => deleteItem('plates', plate.id, plate.plate_number)} style={styles.buttonDanger}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Chefes - Versão responsiva */}
        {activeTab === 'bosses' && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            {isMobile ? (
              <div style={{ padding: '16px' }}>
                {filteredBosses.map((boss) => (
                  <div key={boss.id} style={{ marginBottom: '12px', padding: '16px', border: '1px solid #f0f0f0', borderRadius: '16px', backgroundColor: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserCog size={20} color="white" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 'bold', fontSize: '16px' }}>{boss.name}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>{boss.email}</p>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                      <div>📞 {boss.phone}</div>
                      <div>🔢 Placa: {boss.plate?.plate_number || '-'}</div>
                    </div>
                    <button onClick={() => deleteItem('bosses', boss.id, boss.name)} style={{ width: '100%', padding: '10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}>
                      Excluir
                    </button>
                  </div>
                ))}
                {filteredBosses.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <UserCog size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p>Nenhum chefe encontrado</p>
                  </div>
                )}
              </div>
            ) : (
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Nome</th><th style={styles.th}>Email</th><th style={styles.th}>Telefone</th><th style={styles.th}>Placa</th><th style={styles.th}>Ações</th></tr></thead>
                <tbody>
                  {filteredBosses.map((boss) => (
                    <tr key={boss.id}>
                      <td style={styles.td}>{boss.name}</td>
                      <td style={styles.td}>{boss.email}</td>
                      <td style={styles.td}>{boss.phone}</td>
                      <td style={styles.td}>{boss.plate?.plate_number || '-'}</td>
                      <td style={styles.td}><button onClick={() => deleteItem('bosses', boss.id, boss.name)} style={styles.buttonDanger}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Motoqueiros - Versão responsiva */}
        {activeTab === 'riders' && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            {isMobile ? (
              <div style={{ padding: '16px' }}>
                {filteredRiders.map((rider) => (
                  <div key={rider.id} style={{ marginBottom: '12px', padding: '16px', border: '1px solid #f0f0f0', borderRadius: '16px', backgroundColor: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bike size={20} color="white" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 'bold', fontSize: '16px' }}>{rider.name}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>BI: {rider.bi}</p>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                      <div>📞 {rider.phone}</div>
                      <div>🔢 Placa: {rider.plate?.plate_number || '-'}</div>
                      <div>🟢 Status: {rider.status === 'active' ? 'Ativo' : 'Inativo'}</div>
                    </div>
                    <button onClick={() => deleteItem('riders', rider.id, rider.name)} style={{ width: '100%', padding: '10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}>
                      Excluir
                    </button>
                  </div>
                ))}
                {filteredRiders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <Bike size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p>Nenhum motoqueiro encontrado</p>
                  </div>
                )}
              </div>
            ) : (
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Nome</th><th style={styles.th}>Telefone</th><th style={styles.th}>BI</th><th style={styles.th}>Placa</th><th style={styles.th}>Status</th><th style={styles.th}>Ações</th></tr></thead>
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
            )}
          </div>
        )}

        {/* Pedidos - Versão responsiva */}
        {activeTab === 'orders' && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            {isMobile ? (
              <div style={{ padding: '16px' }}>
                {filteredOrders.map((order) => {
                  const statusStyle = getStatusColor(order.status)
                  const StatusIcon = statusStyle.icon
                  return (
                    <div key={order.id} style={{ marginBottom: '12px', padding: '16px', border: '1px solid #f0f0f0', borderRadius: '16px', backgroundColor: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '16px' }}>{order.customer_name || 'Cliente'}</p>
                        <span style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <StatusIcon size={12} /> {statusStyle.text}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                        <div>📞 {order.customer_phone || '-'}</div>
                        <div>💰 {order.price?.toLocaleString()} Kz</div>
                        <div>📅 {new Date(order.created_at).toLocaleDateString('pt-AO')}</div>
                      </div>
                    </div>
                  )
                })}
                {filteredOrders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <ClipboardList size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p>Nenhum pedido encontrado</p>
                  </div>
                )}
              </div>
            ) : (
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Cliente</th><th style={styles.th}>Telefone</th><th style={styles.th}>Valor</th><th style={styles.th}>Status</th><th style={styles.th}>Data</th></tr></thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const statusStyle = getStatusColor(order.status)
                    const StatusIcon = statusStyle.icon
                    return (
                      <tr key={order.id}>
                        <td style={styles.td}>{order.customer_name || '-'}</td>
                        <td style={styles.td}>{order.customer_phone || '-'}</td>
                        <td style={styles.td}>{order.price?.toLocaleString()} Kz</td>
                        <td style={styles.td}>
                          <span style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <StatusIcon size={12} /> {statusStyle.text}
                          </span>
                        </td>
                        <td style={styles.td}>{new Date(order.created_at).toLocaleDateString('pt-AO')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modais - Mantidos os mesmos modais com pequenas melhorias de responsividade */}
      {showAddPlate && (
        <div style={styles.modalOverlay} onClick={() => setShowAddPlate(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', padding: isMobile ? '16px' : '20px', borderRadius: '24px 24px 0 0', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Nova Placa</h3>
                <button onClick={() => setShowAddPlate(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const plate_number = formData.get('plate_number') as string
              const weekly_fee = parseInt(formData.get('weekly_fee') as string)
              const boss_id = formData.get('boss_id') as string
              const max_riders = parseInt(formData.get('max_riders') as string)
              const associationId = localStorage.getItem('association_id')
              
              const { error } = await supabase.from('plates').insert({
                plate_number,
                weekly_fee,
                max_riders,
                boss_id: boss_id || null,
                fee_per_rider: 300,
                total_weekly_fee: max_riders * 300,
                association_id: associationId,
                is_active: true,
                created_at: new Date().toISOString()
              })
              
              if (!error) {
                setShowAddPlate(false)
                const associationIdReload = localStorage.getItem('association_id')
                if (associationIdReload) loadAllData(associationIdReload)
              } else {
                alert('Erro: ' + error.message)
              }
            }} style={{ padding: isMobile ? '20px' : '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" name="plate_number" placeholder="Número da Placa *" required style={styles.input} />
              <input type="number" name="weekly_fee" placeholder="Taxa Semanal (Kz)" defaultValue="75000" required style={styles.input} />
              <select name="boss_id" style={styles.select}>
                <option value="">Selecione um chefe (opcional)</option>
                {bosses.map(boss => <option key={boss.id} value={boss.id}>{boss.name}</option>)}
              </select>
              <input type="number" name="max_riders" placeholder="Máximo de Motoqueiros" defaultValue="20" required min="1" style={styles.input} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddPlate(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: 'white', fontWeight: 500 }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddBoss && (
        <div style={styles.modalOverlay} onClick={() => setShowAddBoss(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', padding: isMobile ? '16px' : '20px', borderRadius: '24px 24px 0 0', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Novo Chefe</h3>
                <button onClick={() => setShowAddBoss(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
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
                name, email, phone, password, association_id: associationId, created_at: new Date().toISOString()
              }).select().single()
              
              if (bossError) { alert('Erro ao criar chefe: ' + bossError.message); return }
              if (plate_id && newBoss) await supabase.from('plates').update({ boss_id: newBoss.id }).eq('id', plate_id)
              setShowAddBoss(false)
              const associationIdReload = localStorage.getItem('association_id')
              if (associationIdReload) loadAllData(associationIdReload)
            }} style={{ padding: isMobile ? '20px' : '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" name="name" placeholder="Nome completo *" required style={styles.input} />
              <input type="email" name="email" placeholder="Email *" required style={styles.input} />
              <input type="tel" name="phone" placeholder="Telefone *" required style={styles.input} />
              <input type="text" name="password" placeholder="Senha (opcional)" style={styles.input} />
              <select name="plate_id" style={styles.select}>
                <option value="">Nenhuma placa</option>
                {plates.map(plate => <option key={plate.id} value={plate.id}>{plate.plate_number}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddBoss(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: 'white', fontWeight: 500 }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddRider && (
        <div style={styles.modalOverlay} onClick={() => setShowAddRider(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', padding: isMobile ? '16px' : '20px', borderRadius: '24px 24px 0 0', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Novo Motoqueiro</h3>
                <button onClick={() => setShowAddRider(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
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
                name, phone, bi, password_hash: password, plate_id: plate_id || null,
                association_id: associationId, status: 'active', is_online: false, created_at: new Date().toISOString()
              })
              
              if (!error) {
                setShowAddRider(false)
                const associationIdReload = localStorage.getItem('association_id')
                if (associationIdReload) loadAllData(associationIdReload)
              } else alert('Erro ao cadastrar motoqueiro: ' + error.message)
            }} style={{ padding: isMobile ? '20px' : '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" name="name" placeholder="Nome completo *" required style={styles.input} />
              <input type="tel" name="phone" placeholder="Telefone *" required style={styles.input} />
              <input type="text" name="bi" placeholder="BI *" required style={styles.input} />
              <input type="text" name="password" placeholder="Senha (opcional)" style={styles.input} />
              <select name="plate_id" style={styles.select}>
                <option value="">Nenhuma placa</option>
                {plates.map(plate => <option key={plate.id} value={plate.id}>{plate.plate_number}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddRider(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: 'white', fontWeight: 500 }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Cadastrar</button>
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