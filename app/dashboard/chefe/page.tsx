// app/dashboard/chefe/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Bike, Users, Plus, Edit, Trash2, LogOut, DollarSign,
  CheckCircle, XCircle, Search, UserPlus, CreditCard,
  Smartphone, Building, Copy, Check, TrendingUp, Settings, AlertCircle,
  X
} from 'lucide-react'

export default function BossDashboard() {
  const router = useRouter()
  const [boss, setBoss] = useState<any>(null)
  const [plate, setPlate] = useState<any>(null)
  const [riders, setRiders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRider, setShowAddRider] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEditRider, setShowEditRider] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedRider, setSelectedRider] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    totalRiders: 0,
    activeRiders: 0,
    onlineNow: 0,
    weeklyPayment: 0,
    maxRiders: 20,
    feePerRider: 300,
    availableSlots: 20
  })

  useEffect(() => {
    const bossId = localStorage.getItem('boss_id')
    if (!bossId) {
      router.push('/login/chefe')
      return
    }
    loadData(bossId)
  }, [])

  const loadData = async (bossId: string) => {
    setLoading(true)
    
    const { data: bossData } = await supabase
      .from('bosses')
      .select('*')
      .eq('id', bossId)
      .single()
    setBoss(bossData)

    const { data: plateData } = await supabase
      .from('plates')
      .select('*')
      .eq('plate_number', 'Placa Francesa')
      .single()
    
    setPlate(plateData)

    if (plateData) {
      const { data: ridersData } = await supabase
        .from('riders')
        .select('*')
        .eq('plate_id', plateData.id)
        .order('created_at', { ascending: false })
      
      setRiders(ridersData || [])

      const maxRidersValue = plateData.max_riders || 20
      const feePerRiderValue = plateData.fee_per_rider || 300
      const totalFee = (ridersData?.length || 0) * feePerRiderValue
      
      setStats({
        totalRiders: ridersData?.length || 0,
        activeRiders: ridersData?.filter(r => r.status === 'active').length || 0,
        onlineNow: ridersData?.filter(r => r.is_online === true).length || 0,
        weeklyPayment: totalFee,
        maxRiders: maxRidersValue,
        feePerRider: feePerRiderValue,
        availableSlots: maxRidersValue - (ridersData?.length || 0)
      })
    }

    setLoading(false)
  }

  const deleteRider = async (riderId: string) => {
    if (confirm('Tem certeza que deseja remover este motoqueiro?')) {
      const { error } = await supabase
        .from('riders')
        .delete()
        .eq('id', riderId)

      if (!error) {
        const bossId = localStorage.getItem('boss_id')
        if (bossId) loadData(bossId)
      } else {
        alert('Erro ao remover: ' + error.message)
      }
    }
  }

  const updatePlateConfig = async (maxRiders: number, feePerRider: number) => {
    const totalFee = maxRiders * feePerRider
    const { error } = await supabase
      .from('plates')
      .update({
        max_riders: maxRiders,
        fee_per_rider: feePerRider,
        total_weekly_fee: totalFee
      })
      .eq('id', plate?.id)

    if (!error) {
      const bossId = localStorage.getItem('boss_id')
      if (bossId) loadData(bossId)
      return true
    }
    return false
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/login/chefe')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!plate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhuma placa encontrada</h2>
          <p className="text-gray-600 mb-4">Execute o SQL para associar sua placa.</p>
          <button onClick={handleLogout} className="bg-amber-500 text-white px-6 py-2 rounded-lg">Sair</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-amber-500 to-red-500 p-2 rounded-lg">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard Chefe</h1>
                <p className="text-xs text-gray-500">{plate?.plate_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowConfigModal(true)} className="p-2 hover:bg-gray-100 rounded-full">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{boss?.name}</p>
                <p className="text-xs text-gray-500">{boss?.phone}</p>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full">
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Motoqueiros</p>
            <p className="text-2xl font-bold">{stats.totalRiders} / {stats.maxRiders}</p>
            <p className="text-xs text-green-600">{stats.availableSlots} vagas</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Online</p>
            <p className="text-2xl font-bold text-green-600">{stats.onlineNow}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Ativos</p>
            <p className="text-2xl font-bold text-blue-600">{stats.activeRiders}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Taxa/Motoqueiro</p>
            <p className="text-2xl font-bold text-amber-600">{stats.feePerRider} Kz</p>
          </div>
          <div className="bg-gradient-to-r from-amber-500 to-red-500 rounded-xl p-4 text-white">
            <p className="text-xs opacity-80">Total Semanal</p>
            <p className="text-2xl font-bold">{stats.weeklyPayment.toLocaleString()} Kz</p>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="max-w-7xl mx-auto px-4 mb-6 flex gap-3">
        <button onClick={() => setShowAddRider(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
          <UserPlus className="w-4 h-4" /> Novo Motoqueiro
        </button>
        <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          <CreditCard className="w-4 h-4" /> Pagar Taxa ({stats.weeklyPayment.toLocaleString()} Kz)
        </button>
      </div>

      {/* Lista de Motoqueiros */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Motoqueiros ({stats.totalRiders})</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64" />
            </div>
          </div>
          <div className="divide-y">
            {riders.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map((rider) => (
              <div key={rider.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {rider.photo_url ? (
                    <img src={rider.photo_url} alt={rider.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Bike className="w-5 h-5 text-amber-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{rider.name}</p>
                    <p className="text-xs text-gray-500">{rider.phone} • BI: {rider.bi}</p>
                    {rider.is_online && <span className="text-xs text-green-600">● Online</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${rider.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {rider.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                  <button onClick={() => { setSelectedRider(rider); setShowEditRider(true) }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteRider(rider.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {riders.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum motoqueiro cadastrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modais */}
      {showAddRider && (
        <AddRiderModal
          plateId={plate?.id}
          onClose={() => setShowAddRider(false)}
          onSuccess={() => {
            setShowAddRider(false)
            const bossId = localStorage.getItem('boss_id')
            if (bossId) loadData(bossId)
          }}
        />
      )}

      {showEditRider && selectedRider && (
        <EditRiderModal
          rider={selectedRider}
          onClose={() => {
            setShowEditRider(false)
            setSelectedRider(null)
          }}
          onSuccess={() => {
            setShowEditRider(false)
            setSelectedRider(null)
            const bossId = localStorage.getItem('boss_id')
            if (bossId) loadData(bossId)
          }}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          plateId={plate?.id}
          plateName={plate?.plate_number}
          amount={stats.weeklyPayment}
          totalRiders={stats.totalRiders}
          feePerRider={stats.feePerRider}
          maxRiders={stats.maxRiders}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false)
            alert('Pagamento registrado com sucesso!')
          }}
        />
      )}

      {showConfigModal && plate && (
        <PlateConfigModal
          plate={plate}
          onClose={() => setShowConfigModal(false)}
          onSuccess={async (maxRiders: number, feePerRider: number) => {
            const success = await updatePlateConfig(maxRiders, feePerRider)
            if (success) setShowConfigModal(false)
          }}
        />
      )}
    </div>
  )
}

// Modal de Adicionar Motoqueiro
function AddRiderModal({ plateId, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({ name: '', phone: '', bi: '', password: 'senha123' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('riders')
      .insert({
        name: formData.name,
        phone: formData.phone,
        bi: formData.bi,
        plate_id: plateId,
        password_hash: formData.password,
        status: 'active',
        is_online: false
      })

    if (!error) {
      onSuccess()
    } else {
      alert('Erro ao cadastrar: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-amber-500 to-red-500 p-4 rounded-t-2xl flex justify-between text-white">
          <h3 className="font-bold">Novo Motoqueiro</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input type="text" required placeholder="Nome completo" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="tel" required placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="text" required placeholder="BI" value={formData.bi} onChange={(e) => setFormData({...formData, bi: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="text" placeholder="Senha" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50" />
          <button type="submit" disabled={loading} className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold">{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
        </form>
      </div>
    </div>
  )
}

// Modal de Editar Motoqueiro
function EditRiderModal({ rider, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({ name: rider.name, phone: rider.phone, bi: rider.bi, password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const updateData: any = { name: formData.name, phone: formData.phone, bi: formData.bi }
    if (formData.password) updateData.password_hash = formData.password

    const { error } = await supabase.from('riders').update(updateData).eq('id', rider.id)

    if (!error) {
      onSuccess()
    } else {
      alert('Erro ao atualizar: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-t-2xl flex justify-between text-white">
          <h3 className="font-bold">Editar Motoqueiro</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input type="text" required placeholder="Nome" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="tel" required placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="text" required placeholder="BI" value={formData.bi} onChange={(e) => setFormData({...formData, bi: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="text" placeholder="Nova Senha (opcional)" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-3 border rounded-lg" />
          <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold">{loading ? 'Salvando...' : 'Salvar'}</button>
        </form>
      </div>
    </div>
  )
}

// Modal de Pagamento
function PaymentModal({ plateId, plateName, amount, totalRiders, feePerRider, maxRiders, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('unitel')
  const [showReceipt, setShowReceipt] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)

  const paymentInfo = {
    unitelMoney: { number: '926572603', name: 'Rafael Domingos Nzambi' },
    iban: { bank: 'Banco Atlantico', account: 'AO06 0055 0000 2883 6759 1015 5', swift: 'Shoow', beneficiary: 'Rafael Domingos Nzambi' }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const transactionId = 'TRX_' + Date.now()
    const paymentDate = new Date().toLocaleString('pt-AO')
    
    const { error } = await supabase.from('plate_payments').insert({
      plate_id: plateId,
      amount: amount,
      week_start: new Date().toISOString(),
      week_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: paymentMethod,
      is_paid: true,
      paid_at: new Date().toISOString(),
      status: 'completed',
      transaction_id: transactionId
    })

    if (error) { 
      alert('Erro: ' + error.message)
      setLoading(false)
    } else {
      setPaymentData({ 
        plateName, amount, totalRiders, feePerRider, 
        paymentMethod: paymentMethod === 'unitel' ? 'Unitel Money' : 'Transferência IBAN', 
        transactionId, paymentDate, status: 'PAGO' 
      })
      setShowReceipt(true)
      setLoading(false)
    }
  }

  const sendToWhatsApp = () => {
    const message = `🏍️ *MEUPILOTO! - COMPROVANTE DE PAGAMENTO*
    
📋 *DETALHES DO PAGAMENTO*
─────────────────────
🏢 *Placa:* ${paymentData.plateName}
👥 *Motoqueiros:* ${paymentData.totalRiders}
💰 *Taxa por Motoqueiro:* ${paymentData.feePerRider.toLocaleString()} Kz
💵 *Valor Total:* ${paymentData.amount.toLocaleString()} Kz
📅 *Data:* ${paymentData.paymentDate}
🆔 *Transação:* ${paymentData.transactionId}
💳 *Método:* ${paymentData.paymentMethod}
✅ *Status:* ${paymentData.status}
─────────────────────

Obrigado por utilizar o MeuPiloto! 🚀`
    window.open(`https://wa.me/244926572603?text=${encodeURIComponent(message)}`, '_blank')
  }

  if (showReceipt && paymentData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-t-2xl flex justify-between text-white">
            <h3 className="font-bold">✅ Comprovante</h3>
            <button onClick={onClose}>✕</button>
          </div>
          <div className="p-5 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mt-2">Pagamento Confirmado!</h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between"><span>Placa:</span><span className="font-semibold">{paymentData.plateName}</span></div>
              <div className="flex justify-between"><span>Motoqueiros:</span><span>{paymentData.totalRiders}</span></div>
              <div className="flex justify-between"><span>Taxa por Motoqueiro:</span><span>{paymentData.feePerRider.toLocaleString()} Kz</span></div>
              <div className="flex justify-between border-t pt-2"><span>Total:</span><span className="font-bold text-green-600">{paymentData.amount.toLocaleString()} Kz</span></div>
            </div>
            <button onClick={sendToWhatsApp} className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2">📱 Enviar via WhatsApp</button>
            <button onClick={onSuccess} className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold">Fechar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-t-2xl flex justify-between text-white">
          <h3 className="font-bold">Pagar Taxa Semanal</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Total a Pagar</p>
            <p className="text-3xl font-bold text-green-600">{amount.toLocaleString()} Kz</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">📊 Detalhamento:</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Motoqueiros:</span><span>{totalRiders} / {maxRiders}</span></div>
              <div className="flex justify-between"><span>Taxa por motoqueiro:</span><span>{feePerRider} Kz</span></div>
              <div className="flex justify-between border-t pt-2 font-bold"><span>Total:</span><span>{amount.toLocaleString()} Kz</span></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setPaymentMethod('unitel')} className={`p-3 rounded-lg border-2 ${paymentMethod === 'unitel' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <Smartphone className="w-5 h-5 mx-auto text-green-600" />
              <span className="text-xs">Unitel Money</span>
            </button>
            <button type="button" onClick={() => setPaymentMethod('iban')} className={`p-3 rounded-lg border-2 ${paymentMethod === 'iban' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <Building className="w-5 h-5 mx-auto text-blue-600" />
              <span className="text-xs">IBAN</span>
            </button>
          </div>
          {paymentMethod === 'unitel' && (
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span>Número:</span>
                <div className="flex gap-2">
                  <span className="font-mono">{paymentInfo.unitelMoney.number}</span>
                  <button type="button" onClick={() => copyToClipboard(paymentInfo.unitelMoney.number)}>
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between mt-2"><span>Nome:</span><span>{paymentInfo.unitelMoney.name}</span></div>
            </div>
          )}
          {paymentMethod === 'iban' && (
            <div className="border rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between"><span>Banco:</span><span>{paymentInfo.iban.bank}</span></div>
                <div className="flex justify-between items-center">
                  <span>IBAN:</span>
                  <div className="flex gap-2">
                    <span className="font-mono text-xs">{paymentInfo.iban.account}</span>
                    <button type="button" onClick={() => copyToClipboard(paymentInfo.iban.account)}><Copy className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex justify-between"><span>Beneficiário:</span><span>{paymentInfo.iban.beneficiary}</span></div>
              </div>
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold">
            {loading ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Modal de Configuração da Placa
function PlateConfigModal({ plate, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({ max_riders: plate.max_riders || 20, fee_per_rider: plate.fee_per_rider || 300 })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSuccess(formData.max_riders, formData.fee_per_rider)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-amber-500 to-red-500 p-4 rounded-t-2xl flex justify-between text-white">
          <h3 className="font-bold">Configurar Placa</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número máximo de motoqueiros</label>
            <input type="number" required value={formData.max_riders} onChange={(e) => setFormData({...formData, max_riders: parseInt(e.target.value)})} className="w-full p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taxa por motoqueiro (Kz)</label>
            <input type="number" required value={formData.fee_per_rider} onChange={(e) => setFormData({...formData, fee_per_rider: parseInt(e.target.value)})} className="w-full p-3 border rounded-lg" />
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">💰 Resumo:</p>
            <p className="text-sm">{formData.max_riders} motoqueiros × {formData.fee_per_rider} Kz = <strong>{(formData.max_riders * formData.fee_per_rider).toLocaleString()} Kz/semana</strong></p>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold">
            {loading ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        </form>
      </div>
    </div>
  )
}