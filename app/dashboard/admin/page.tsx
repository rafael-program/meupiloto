// app/dashboard/admin/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Shield, LogOut, Users, Bike, CreditCard, TrendingUp, 
  Plus, Edit, Trash2, Search, AlertCircle, Menu, X, 
  UserCog, Store, ClipboardList, RefreshCw, Phone,
  DollarSign, Calendar
} from 'lucide-react'

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
  photo_url?: string
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
    photo_url?: string
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [bosses, setBosses] = useState<Boss[]>([])
  const [plates, setPlates] = useState<Plate[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('orders')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddBoss, setShowAddBoss] = useState(false)
  const [showAddPlate, setShowAddPlate] = useState(false)
  const [stats, setStats] = useState({
    totalBosses: 0,
    totalPlates: 0,
    totalRiders: 0,
    totalOrders: 0,
    totalRevenue: 0,
    onlineRiders: 0,
    activePlates: 0,
    pendingOrders: 0
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
          is_online,
          photo_url
        )
      `)
      .order('created_at', { ascending: false })
    
    setOrders(ordersData || [])

    const completedOrders = ordersData?.filter(o => o.status === 'completed') || []
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0)
    const onlineRiders = ridersData?.filter(r => r.is_online === true) || []
    const activePlates = platesData?.filter(p => p.is_active === true) || []
    const pendingOrders = ordersData?.filter(o => o.status === 'pending') || []

    setStats({
      totalBosses: bossesData?.length || 0,
      totalPlates: platesData?.length || 0,
      totalRiders: ridersData?.length || 0,
      totalOrders: ordersData?.length || 0,
      totalRevenue,
      onlineRiders: onlineRiders.length,
      activePlates: activePlates.length,
      pendingOrders: pendingOrders.length
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

  const callRider = (phone: string, riderName: string) => {
    if (confirm(`📞 Deseja ligar para o motoqueiro ${riderName} (${phone})?`)) {
      window.location.href = `tel:${phone}`
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-20 bg-gradient-to-b from-gray-900 to-gray-800 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-indigo-400" />
              {sidebarOpen && <div><h1 className="text-white font-bold">MeuPiloto!</h1><p className="text-xs text-gray-400">Admin</p></div>}
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <nav className="flex-1 py-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'orders', label: 'Pedidos', icon: ClipboardList },
              { id: 'plates', label: 'Placas', icon: Store },
              { id: 'bosses', label: 'Chefes', icon: UserCog },
              { id: 'riders', label: 'Motoqueiros', icon: Bike }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition ${
                  activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{admin?.name?.charAt(0) || 'A'}</span>
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{admin?.name}</p>
                  <p className="text-gray-400 text-xs">{admin?.email}</p>
                </div>
              )}
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-400">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'orders' && 'Pedidos'}
                  {activeTab === 'plates' && 'Placas'}
                  {activeTab === 'bosses' && 'Chefes'}
                  {activeTab === 'riders' && 'Motoqueiros'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {activeTab === 'orders' && 'Monitore todos os pedidos e motoqueiros'}
                  {activeTab === 'dashboard' && 'Visão geral do sistema'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={loadAllData} className="p-2 text-gray-500 hover:text-indigo-600 transition rounded-lg">
                  <RefreshCw className="w-5 h-5" />
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64" />
                </div>
                {(activeTab === 'bosses' || activeTab === 'plates') && (
                  <button onClick={() => activeTab === 'bosses' ? setShowAddBoss(true) : setShowAddPlate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <Plus className="w-4 h-4" /> Novo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold">{stats.totalPlates}</p>
                <p className="text-xs text-gray-500">Placas</p>
                <p className="text-xs text-green-600">{stats.activePlates} ativas</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold">{stats.totalBosses}</p>
                <p className="text-xs text-gray-500">Chefes</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold">{stats.totalRiders}</p>
                <p className="text-xs text-gray-500">Motoqueiros</p>
                <p className="text-xs text-green-600">{stats.onlineRiders} online</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-xs text-gray-500">Pedidos</p>
                <p className="text-xs text-yellow-600">{stats.pendingOrders} pendentes</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-6 text-white">
              <DollarSign className="w-8 h-8 mb-2 opacity-75" />
              <p className="text-sm opacity-80">Receita Total</p>
              <p className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()} Kz</p>
            </div>
          </div>
        )}

        {/* Tabela de Pedidos */}
        {activeTab === 'orders' && (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Telefone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Motoqueiro</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tel. Motoqueiro</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                 <tbody className="divide-y">
  {filteredOrders.map((order) => (
    <tr key={order.id} className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-medium">{order.customer_name || '-'}</td>
      <td className="px-4 py-3 text-sm">{order.customer_phone || '-'}</td>
      <td className="px-4 py-3">
        {order.rider ? (
          <div className="flex items-center gap-2">
            {order.rider.photo_url ? (
              <img src={order.rider.photo_url} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">{order.rider.name?.charAt(0)}</span>
              </div>
            )}
            <span className="text-sm">{order.rider.name}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Não atribuído</span>
        )}
      </td>
      <td className="px-4 py-3">
        {order.rider ? (
          <div>
            <span className="text-sm">{order.rider.phone}</span>
            {order.rider.is_online ? (
              <span className="ml-2 text-xs text-green-600">● Online</span>
            ) : (
              <span className="ml-2 text-xs text-red-600">● Offline</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm font-semibold">{order.price?.toLocaleString()} Kz</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          order.status === 'completed' ? 'bg-green-100 text-green-700' :
          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          order.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
          'bg-red-100 text-red-700'
        }`}>
          {order.status === 'completed' ? 'Concluído' :
           order.status === 'pending' ? 'Pendente' :
           order.status === 'accepted' ? 'Aceito' : 'Cancelado'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">{new Date(order.created_at).toLocaleDateString('pt-AO')}</td>
      <td className="px-4 py-3">
        {order.rider?.phone && (
          <button
            onClick={() => order.rider && callRider(order.rider.phone, order.rider.name)}
            className={`flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition ${
              order.rider?.is_online 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            <Phone className="w-4 h-4" />
            Ligar
          </button>
        )}
      </td>
    </tr>
  ))}
  {filteredOrders.length === 0 && (
    <tr>
      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
        Nenhum pedido encontrado
      </td>
    </tr>
  )}
</tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Placas */}
        {activeTab === 'plates' && (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Placa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Chefe</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Taxa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Motoqueiros</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPlates.map((plate) => (
                    <tr key={plate.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{plate.plate_number}</td>
                      <td className="px-4 py-3 text-sm">{plate.boss?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm">{plate.weekly_fee?.toLocaleString()} Kz</td>
                      <td className="px-4 py-3 text-sm">{riders.filter(r => r.plate_id === plate.id).length} / {plate.max_riders || 20}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => togglePlateStatus(plate.id, plate.is_active)} className={`px-2 py-1 rounded-full text-xs ${plate.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {plate.is_active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteItem('plates', plate.id, plate.plate_number)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chefes */}
        {activeTab === 'bosses' && (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Telefone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Placa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredBosses.map((boss) => (
                    <tr key={boss.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{boss.name}</td>
                      <td className="px-4 py-3 text-sm">{boss.email}</td>
                      <td className="px-4 py-3 text-sm">{boss.phone}</td>
                      <td className="px-4 py-3 text-sm">{plates.find(p => p.boss_id === boss.id)?.plate_number || '-'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteItem('bosses', boss.id, boss.name)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Motoqueiros */}
        {activeTab === 'riders' && (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Telefone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">BI</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Placa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRiders.map((rider) => (
                    <tr key={rider.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{rider.name}</td>
                      <td className="px-4 py-3 text-sm">{rider.phone}</td>
                      <td className="px-4 py-3 text-sm">{rider.bi}</td>
                      <td className="px-4 py-3 text-sm">{rider.plate?.plate_number || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${rider.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {rider.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteItem('riders', rider.id, rider.name)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      {showAddBoss && <AddBossModal onClose={() => setShowAddBoss(false)} onSuccess={() => { setShowAddBoss(false); loadAllData() }} />}
      {showAddPlate && <AddPlateModal bosses={bosses} onClose={() => setShowAddPlate(false)} onSuccess={() => { setShowAddPlate(false); loadAllData() }} />}
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="bg-indigo-600 p-4 rounded-t-2xl flex justify-between text-white">
          <h3 className="font-bold">Novo Chefe</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input type="text" required placeholder="Nome" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="email" required placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="tel" required placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="text" placeholder="Senha" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50" />
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold">{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="bg-indigo-600 p-4 rounded-t-2xl flex justify-between text-white">
          <h3 className="font-bold">Nova Placa</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input type="text" required placeholder="Nome da Placa" value={formData.plate_number} onChange={(e) => setFormData({...formData, plate_number: e.target.value})} className="w-full p-3 border rounded-lg" />
          <select value={formData.boss_id} onChange={(e) => setFormData({...formData, boss_id: e.target.value})} className="w-full p-3 border rounded-lg">
            <option value="">Nenhum chefe</option>
            {bosses.map((boss: any) => <option key={boss.id} value={boss.id}>{boss.name}</option>)}
          </select>
          <input type="number" placeholder="Taxa Semanal" value={formData.weekly_fee} onChange={(e) => setFormData({...formData, weekly_fee: parseInt(e.target.value)})} className="w-full p-3 border rounded-lg" />
          <input type="number" placeholder="Máximo de Motoqueiros" value={formData.max_riders} onChange={(e) => setFormData({...formData, max_riders: parseInt(e.target.value)})} className="w-full p-3 border rounded-lg" />
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold">{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
        </form>
      </div>
    </div>
  )
}