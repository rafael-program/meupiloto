'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Building2, LogOut, Users, Bike, Plus, Edit, Trash2, Search, 
  Menu, X, UserCog, Store, ClipboardList, RefreshCw, 
  DollarSign, Calendar, Shield, Phone, Mail, MapPin,
  TrendingUp  // ← Import adicionado
} from 'lucide-react'

type Association = {
  id: string
  name: string
  email: string
  phone: string
  password: string
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

export default function AssociationDashboard() {
  const router = useRouter()
  const [association, setAssociation] = useState<Association | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [plates, setPlates] = useState<Plate[]>([])
  const [bosses, setBosses] = useState<Boss[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddPlate, setShowAddPlate] = useState(false)
  const [showAddBoss, setShowAddBoss] = useState(false)
  const [showAddRider, setShowAddRider] = useState(false)
  const [stats, setStats] = useState({
    totalPlates: 0,
    totalBosses: 0,
    totalRiders: 0,
    activePlates: 0,
    onlineRiders: 0
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

    // Carregar placas da associação
    const { data: platesData } = await supabase
      .from('plates')
      .select('*, boss:bosses(*)')
      .eq('association_id', associationId)
      .order('created_at', { ascending: false })
    setPlates(platesData || [])

    // Carregar chefes da associação
    const { data: bossesData } = await supabase
      .from('bosses')
      .select('*, plate:plates(plate_number)')
      .eq('association_id', associationId)
      .order('created_at', { ascending: false })
    setBosses(bossesData || [])

    // Carregar motoqueiros da associação
    const { data: ridersData } = await supabase
      .from('riders')
      .select('*, plate:plates(plate_number)')
      .eq('association_id', associationId)
      .order('created_at', { ascending: false })
    setRiders(ridersData || [])

    const activePlates = platesData?.filter(p => p.is_active === true) || []
    const onlineRiders = ridersData?.filter(r => r.is_online === true) || []

    setStats({
      totalPlates: platesData?.length || 0,
      totalBosses: bossesData?.length || 0,
      totalRiders: ridersData?.length || 0,
      activePlates: activePlates.length,
      onlineRiders: onlineRiders.length
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Superior */}
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{association?.name}</h1>
                  <p className="text-xs text-gray-500">Associação</p>
                </div>
              </div>
              
              {/* Menu Desktop */}
              <div className="hidden md:flex items-center gap-1 ml-6">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                  { id: 'plates', label: 'Placas', icon: Store },
                  { id: 'bosses', label: 'Chefes', icon: UserCog },
                  { id: 'riders', label: 'Motoqueiros', icon: Bike }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      activeTab === item.id 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => loadAllData(association?.id || '')} className="p-2 text-gray-500 hover:text-blue-600 transition-all rounded-lg hover:bg-gray-100">
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-64 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-bold">{association?.name?.charAt(0) || 'A'}</span>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">{association?.name}</p>
                    <p className="text-xs text-gray-500">{association?.email}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 transition rounded-lg hover:bg-red-50">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              {/* Botão Menu Mobile */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-16 left-0 right-0 bg-white rounded-b-2xl shadow-xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-2 space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                { id: 'plates', label: 'Placas', icon: Store },
                { id: 'bosses', label: 'Chefes', icon: UserCog },
                { id: 'riders', label: 'Motoqueiros', icon: Bike }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-2xl font-bold text-gray-900">{stats.totalPlates}</p>
                <p className="text-xs text-gray-500 mt-1">Placas</p>
                <p className="text-xs text-green-600 mt-1">{stats.activePlates} ativas</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-2xl font-bold text-gray-900">{stats.totalBosses}</p>
                <p className="text-xs text-gray-500 mt-1">Chefes</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-2xl font-bold text-gray-900">{stats.totalRiders}</p>
                <p className="text-xs text-gray-500 mt-1">Motoqueiros</p>
                <p className="text-xs text-green-600 mt-1">{stats.onlineRiders} online</p>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white">
                <Building2 className="w-8 h-8 mb-2 opacity-75" />
                <p className="text-sm opacity-80">Associação</p>
                <p className="text-lg font-bold">{association?.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Placas */}
        {activeTab === 'plates' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">Placas da Associação</h2>
              <button onClick={() => setShowAddPlate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Nova Placa
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Placa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Chefe</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Taxa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Motoqueiros</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPlates.map((plate) => (
                    <tr key={plate.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{plate.plate_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{plate.boss?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{plate.weekly_fee?.toLocaleString()} Kz</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{riders.filter(r => r.plate_id === plate.id).length} / {plate.max_riders || 20}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${plate.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {plate.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                       </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteItem('plates', plate.id, plate.plate_number)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">Chefes de Placa</h2>
              <button onClick={() => setShowAddBoss(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Novo Chefe
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Telefone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Placa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBosses.map((boss) => (
                    <tr key={boss.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{boss.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{boss.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{boss.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{boss.plate?.plate_number || '-'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteItem('bosses', boss.id, boss.name)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">Motoqueiros</h2>
              <button onClick={() => setShowAddRider(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Novo Motoqueiro
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Telefone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">BI</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Placa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRiders.map((rider) => (
                    <tr key={rider.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{rider.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{rider.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{rider.bi}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{rider.plate?.plate_number || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${rider.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {rider.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                       </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteItem('riders', rider.id, rider.name)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
      {showAddPlate && (
        <AddPlateModal 
          associationId={association?.id} 
          onClose={() => setShowAddPlate(false)} 
          onSuccess={() => { setShowAddPlate(false); loadAllData(association?.id || '') }} 
        />
      )}
      {showAddBoss && (
        <AddBossModal 
          associationId={association?.id}
          plates={plates}
          onClose={() => setShowAddBoss(false)} 
          onSuccess={() => { setShowAddBoss(false); loadAllData(association?.id || '') }} 
        />
      )}
      {showAddRider && (
        <AddRiderModal 
          associationId={association?.id}
          plates={plates}
          onClose={() => setShowAddRider(false)} 
          onSuccess={() => { setShowAddRider(false); loadAllData(association?.id || '') }} 
        />
      )}
    </div>
  )
}

// Modais de Adição (simplificados)
function AddPlateModal({ associationId, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({ plate_number: '', weekly_fee: 75000, max_riders: 20, fee_per_rider: 300 })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('plates').insert({
      plate_number: formData.plate_number,
      weekly_fee: formData.weekly_fee,
      max_riders: formData.max_riders,
      fee_per_rider: formData.fee_per_rider,
      total_weekly_fee: formData.max_riders * formData.fee_per_rider,
      association_id: associationId,
      is_active: true,
      created_at: new Date().toISOString()
    })
    if (!error) onSuccess(); else alert('Erro: ' + error.message)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-t-2xl flex justify-between text-white">
          <h3 className="font-bold">Nova Placa</h3>
          <button onClick={onClose} className="hover:opacity-80">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input type="text" required placeholder="Nome da Placa" value={formData.plate_number} onChange={(e) => setFormData({...formData, plate_number: e.target.value})} className="w-full p-3 border rounded-xl" />
          <input type="number" placeholder="Taxa Semanal" value={formData.weekly_fee} onChange={(e) => setFormData({...formData, weekly_fee: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl" />
          <input type="number" placeholder="Máximo de Motoqueiros" value={formData.max_riders} onChange={(e) => setFormData({...formData, max_riders: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl" />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold">{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
        </form>
      </div>
    </div>
  )
}

function AddBossModal({ associationId, plates, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: 'senha123', plate_id: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('bosses').insert({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      association_id: associationId,
      created_at: new Date().toISOString()
    })
    if (!error) {
      if (formData.plate_id) {
        await supabase.from('plates').update({ boss_id: (await supabase.from('bosses').select('id').eq('email', formData.email).single()).data?.id }).eq('id', formData.plate_id)
      }
      onSuccess()
    } else { alert('Erro: ' + error.message) }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-t-2xl flex justify-between text-white">
          <h3 className="font-bold">Novo Chefe</h3>
          <button onClick={onClose} className="hover:opacity-80">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input type="text" required placeholder="Nome" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-xl" />
          <input type="email" required placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-xl" />
          <input type="tel" required placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-xl" />
          <input type="text" placeholder="Senha" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50" />
          <select value={formData.plate_id} onChange={(e) => setFormData({...formData, plate_id: e.target.value})} className="w-full p-3 border rounded-xl">
            <option value="">Nenhuma placa</option>
            {plates.map((plate: any) => <option key={plate.id} value={plate.id}>{plate.plate_number}</option>)}
          </select>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold">{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
        </form>
      </div>
    </div>
  )
}

function AddRiderModal({ associationId, plates, onClose, onSuccess }: any) {
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
      association_id: associationId,
      status: 'active',
      is_online: false,
      created_at: new Date().toISOString()
    })
    if (!error) onSuccess(); else alert('Erro: ' + error.message)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-t-2xl flex justify-between text-white">
          <h3 className="font-bold">Novo Motoqueiro</h3>
          <button onClick={onClose} className="hover:opacity-80">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input type="text" required placeholder="Nome" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-xl" />
          <input type="tel" required placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-xl" />
          <input type="text" required placeholder="BI" value={formData.bi} onChange={(e) => setFormData({...formData, bi: e.target.value})} className="w-full p-3 border rounded-xl" />
          <input type="text" placeholder="Senha" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50" />
          <select value={formData.plate_id} onChange={(e) => setFormData({...formData, plate_id: e.target.value})} className="w-full p-3 border rounded-xl">
            <option value="">Nenhuma placa</option>
            {plates.map((plate: any) => <option key={plate.id} value={plate.id}>{plate.plate_number}</option>)}
          </select>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold">{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
        </form>
      </div>
    </div>
  )
}