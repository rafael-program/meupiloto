// app/dashboard/chefe/page.tsx - VERSÃO COMPLETA CORRIGIDA
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Bike, Users, Plus, Edit, Trash2, LogOut, DollarSign,
  CheckCircle, XCircle, Search, UserPlus, CreditCard,
  Smartphone, Building, Copy, Check, TrendingUp, Settings, AlertCircle,
  X, Camera, Loader2
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

  const filteredRiders = riders.filter(rider =>
    rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.phone.includes(searchTerm) ||
    rider.bi.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (!plate) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
        <div style={{ textAlign: 'center', backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', maxWidth: '28rem' }}>
          <AlertCircle size={64} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Nenhuma placa encontrada</h2>
          <p style={{ marginBottom: '1rem' }}>Você não está associado a nenhuma placa.</p>
          <button onClick={handleLogout} style={{ backgroundColor: '#f59e0b', color: 'white', padding: '0.5rem 1.5rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Sair</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                <Bike size={24} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Dashboard Chefe</h1>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{plate?.plate_number}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => setShowConfigModal(true)} style={{ padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '9999px' }}>
                <Settings size={20} color="#4b5563" />
              </button>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{boss?.name}</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{boss?.phone}</p>
              </div>
              <button onClick={handleLogout} style={{ padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '9999px' }}>
                <LogOut size={20} color="#4b5563" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Motoqueiros</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalRiders} / {stats.maxRiders}</p>
            <p style={{ fontSize: '0.75rem', color: '#059669' }}>{stats.availableSlots} vagas</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Online</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>{stats.onlineNow}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Ativos</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{stats.activeRiders}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Taxa/Motoqueiro</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>{stats.feePerRider} Kz</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', borderRadius: '0.75rem', padding: '1rem', color: 'white' }}>
            <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Total Semanal</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.weeklyPayment.toLocaleString()} Kz</p>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem 1.5rem', display: 'flex', gap: '0.75rem' }}>
        <button onClick={() => setShowAddRider(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
          <UserPlus size={16} /> Novo Motoqueiro
        </button>
        <button onClick={() => setShowPaymentModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
          <CreditCard size={16} /> Pagar Taxa ({stats.weeklyPayment.toLocaleString()} Kz)
        </button>
      </div>

      {/* Lista de Motoqueiros */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem 2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '0.75rem' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontWeight: '600' }}>Motoqueiros ({stats.totalRiders})</h2>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '0.5rem 0.5rem 0.5rem 2rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', width: '16rem' }} />
            </div>
          </div>
          <div>
            {filteredRiders.map((rider) => (
              <div key={rider.id} style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {rider.photo_url ? (
                    <img src={rider.photo_url} alt={rider.name} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '9999px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#fef3c7', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bike size={20} color="#d97706" />
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: '500' }}>{rider.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{rider.phone} • BI: {rider.bi}</p>
                    {rider.is_online && <span style={{ fontSize: '0.75rem', color: '#059669' }}>● Online</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', backgroundColor: rider.status === 'active' ? '#d1fae5' : '#fee2e2', color: rider.status === 'active' ? '#065f46' : '#991b1b' }}>
                    {rider.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                  <button onClick={() => { setSelectedRider(rider); setShowEditRider(true) }} style={{ padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', borderRadius: '0.5rem' }}>
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deleteRider(rider.id)} style={{ padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', borderRadius: '0.5rem' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {riders.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                <Users size={48} style={{ margin: '0 auto 0.75rem', color: '#d1d5db' }} />
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
// No app/dashboard/chefe/page.tsx, atualize o AddRiderModal:

// Modal de Adicionar Motoqueiro (com CSS inline)
function AddRiderModal({ plateId, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bi: '',
    password: 'senha123'
  })
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida')
      setUploadingPhoto(false)
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB')
      setUploadingPhoto(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `riders/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('rider-photos')
      .upload(filePath, file)

    if (uploadError) {
      alert('Erro ao fazer upload da foto')
      setUploadingPhoto(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('rider-photos')
      .getPublicUrl(filePath)

    setPhotoUrl(publicUrl)
    setUploadingPhoto(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const insertData: any = {
      name: formData.name,
      phone: formData.phone,
      bi: formData.bi,
      plate_id: plateId,
      password_hash: formData.password,
      status: 'active',
      is_online: false
    }

    if (photoUrl) {
      insertData.photo_url = photoUrl
    }

    const { error } = await supabase
      .from('riders')
      .insert(insertData)

    if (!error) {
      onSuccess()
    } else {
      alert('Erro ao cadastrar: ' + error.message)
    }
    setLoading(false)
  }

  return (
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
      zIndex: 50,
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        maxWidth: '28rem',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          padding: '1rem',
          borderRadius: '1rem 1rem 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          color: 'white'
        }}>
          <h3 style={{ fontWeight: 'bold' }}>Novo Motoqueiro</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Upload de Foto */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              {photoUrl ? (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={photoUrl} 
                    alt="Preview" 
                    style={{ width: '6rem', height: '6rem', borderRadius: '9999px', objectFit: 'cover', border: '4px solid #fcd34d' }}
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    style={{ position: 'absolute', top: '-0.5rem', right: '-0.5rem', backgroundColor: '#ef4444', color: 'white', borderRadius: '9999px', padding: '0.25rem', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label style={{ cursor: 'pointer' }}>
                  <div style={{
                    width: '6rem',
                    height: '6rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '9999px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #d1d5db',
                    transition: 'all 0.2s'
                  }}>
                    {uploadingPhoto ? (
                      <Loader2 size={32} style={{ color: '#f59e0b', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <Camera size={32} style={{ color: '#9ca3af' }} />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Foto</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handlePhotoUpload(file)
                    }}
                    style={{ display: 'none' }}
                    disabled={uploadingPhoto}
                  />
                </label>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>Clique para adicionar foto (max 2MB)</p>
          </div>

          <input
            type="text"
            required
            placeholder="Nome completo"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
          />
          <input
            type="tel"
            required
            placeholder="Telefone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
          />
          <input
            type="text"
            required
            placeholder="BI"
            value={formData.bi}
            onChange={(e) => setFormData({...formData, bi: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
          />
          <input
            type="text"
            placeholder="Senha"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}
          />
          <button
            type="submit"
            disabled={loading || uploadingPhoto}
            style={{
              width: '100%',
              backgroundColor: '#f59e0b',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              opacity: (loading || uploadingPhoto) ? 0.5 : 1
            }}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Motoqueiro'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Modal de Editar Motoqueiro
// Modal de Editar Motoqueiro (com upload de foto)
function EditRiderModal({ rider, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: rider.name,
    phone: rider.phone,
    bi: rider.bi,
    password: ''
  })
  const [photoUrl, setPhotoUrl] = useState<string>(rider.photo_url || '')
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida')
      setUploadingPhoto(false)
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB')
      setUploadingPhoto(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `riders/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('rider-photos')
      .upload(filePath, file)

    if (uploadError) {
      alert('Erro ao fazer upload da foto')
      setUploadingPhoto(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('rider-photos')
      .getPublicUrl(filePath)

    setPhotoUrl(publicUrl)
    setUploadingPhoto(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const updateData: any = {
      name: formData.name,
      phone: formData.phone,
      bi: formData.bi
    }

    if (formData.password) {
      updateData.password_hash = formData.password
    }

    if (photoUrl && photoUrl !== rider.photo_url) {
      updateData.photo_url = photoUrl
    }

    const { error } = await supabase
      .from('riders')
      .update(updateData)
      .eq('id', rider.id)

    if (!error) {
      onSuccess()
    } else {
      alert('Erro ao atualizar: ' + error.message)
    }
    setLoading(false)
  }

  return (
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
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        maxWidth: '28rem',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          padding: '1rem',
          borderRadius: '1rem 1rem 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          color: 'white'
        }}>
          <h3 style={{ fontWeight: 'bold' }}>Editar Motoqueiro</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Upload de Foto */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              {photoUrl ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={photoUrl}
                    alt="Preview"
                    style={{ width: '6rem', height: '6rem', borderRadius: '9999px', objectFit: 'cover', border: '4px solid #93c5fd' }}
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    style={{
                      position: 'absolute',
                      top: '-0.5rem',
                      right: '-0.5rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '9999px',
                      padding: '0.25rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label style={{ cursor: 'pointer' }}>
                  <div style={{
                    width: '6rem',
                    height: '6rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '9999px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #d1d5db',
                    transition: 'all 0.2s'
                  }}>
                    {uploadingPhoto ? (
                      <Loader2 size={32} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <Camera size={32} style={{ color: '#9ca3af' }} />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Foto</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handlePhotoUpload(file)
                    }}
                    style={{ display: 'none' }}
                    disabled={uploadingPhoto}
                  />
                </label>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              Clique na foto para trocar (max 2MB)
            </p>
          </div>

          <input
            type="text"
            required
            placeholder="Nome"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
          />
          <input
            type="tel"
            required
            placeholder="Telefone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
          />
          <input
            type="text"
            required
            placeholder="BI"
            value={formData.bi}
            onChange={(e) => setFormData({...formData, bi: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
          />
          <input
            type="text"
            placeholder="Nova Senha (opcional)"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
          />
          <button
            type="submit"
            disabled={loading || uploadingPhoto}
            style={{
              width: '100%',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              opacity: (loading || uploadingPhoto) ? 0.5 : 1
            }}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
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
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '28rem', width: '90%' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '1rem', borderRadius: '1rem 1rem 0 0', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
            <h3 style={{ fontWeight: 'bold' }}>✅ Comprovante</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '4rem', height: '4rem', backgroundColor: '#d1fae5', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle size={32} color="#059669" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Pagamento Confirmado!</h2>
            </div>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '0.5rem', padding: '1rem', margin: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Placa:</span><span style={{ fontWeight: 'bold' }}>{paymentData.plateName}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Motoqueiros:</span><span>{paymentData.totalRiders}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Taxa/Motoqueiro:</span><span>{paymentData.feePerRider.toLocaleString()} Kz</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem', marginTop: '0.5rem' }}><span>Total:</span><span style={{ fontWeight: 'bold', color: '#059669' }}>{paymentData.amount.toLocaleString()} Kz</span></div>
            </div>
            <button onClick={sendToWhatsApp} style={{ width: '100%', backgroundColor: '#10b981', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>📱 Enviar via WhatsApp</button>
            <button onClick={onSuccess} style={{ width: '100%', backgroundColor: '#f3f4f6', color: '#374151', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Fechar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, overflow: 'auto' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '32rem', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '1rem', borderRadius: '1rem 1rem 0 0', display: 'flex', justifyContent: 'space-between', color: 'white', position: 'sticky', top: 0 }}>
          <h3 style={{ fontWeight: 'bold' }}>Pagar Taxa Semanal</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#f9fafb', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total a Pagar</p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#059669' }}>{amount.toLocaleString()} Kz</p>
          </div>
          <div style={{ backgroundColor: '#fffbeb', borderRadius: '0.5rem', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>📊 Detalhamento:</p>
            <div style={{ fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Motoqueiros:</span><span>{totalRiders} / {maxRiders}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}><span>Taxa por motoqueiro:</span><span>{feePerRider} Kz</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #fde68a', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: 'bold' }}><span>Total:</span><span>{amount.toLocaleString()} Kz</span></div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button type="button" onClick={() => setPaymentMethod('unitel')} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: `2px solid ${paymentMethod === 'unitel' ? '#10b981' : '#e5e7eb'}`, backgroundColor: paymentMethod === 'unitel' ? '#f0fdf4' : 'white', cursor: 'pointer' }}>
              <Smartphone size={20} style={{ margin: '0 auto 0.25rem', color: '#059669' }} />
              <span style={{ fontSize: '0.75rem' }}>Unitel Money</span>
            </button>
            <button type="button" onClick={() => setPaymentMethod('iban')} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: `2px solid ${paymentMethod === 'iban' ? '#3b82f6' : '#e5e7eb'}`, backgroundColor: paymentMethod === 'iban' ? '#eff6ff' : 'white', cursor: 'pointer' }}>
              <Building size={20} style={{ margin: '0 auto 0.25rem', color: '#2563eb' }} />
              <span style={{ fontSize: '0.75rem' }}>IBAN</span>
            </button>
          </div>
          {paymentMethod === 'unitel' && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Número:</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace' }}>{paymentInfo.unitelMoney.number}</span>
                  <button type="button" onClick={() => copyToClipboard(paymentInfo.unitelMoney.number)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    {copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}><span>Nome:</span><span>{paymentInfo.unitelMoney.name}</span></div>
            </div>
          )}
          {paymentMethod === 'iban' && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Banco:</span><span>{paymentInfo.iban.bank}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span>IBAN:</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{paymentInfo.iban.account}</span>
                  <button type="button" onClick={() => copyToClipboard(paymentInfo.iban.account)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Copy size={16} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}><span>Beneficiário:</span><span>{paymentInfo.iban.beneficiary}</span></div>
            </div>
          )}
          <button type="submit" disabled={loading} style={{ backgroundColor: '#10b981', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '28rem', width: '90%' }}>
        <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', padding: '1rem', borderRadius: '1rem 1rem 0 0', display: 'flex', justifyContent: 'space-between', color: 'white' }}>
          <h3 style={{ fontWeight: 'bold' }}>Configurar Placa</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Número máximo de motoqueiros</label>
            <input type="number" required value={formData.max_riders} onChange={(e) => setFormData({...formData, max_riders: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Taxa por motoqueiro (Kz)</label>
            <input type="number" required value={formData.fee_per_rider} onChange={(e) => setFormData({...formData, fee_per_rider: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
          </div>
          <div style={{ backgroundColor: '#fffbeb', borderRadius: '0.5rem', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>💰 Resumo:</p>
            <p style={{ fontSize: '0.875rem' }}>{formData.max_riders} motoqueiros × {formData.fee_per_rider} Kz = <strong>{(formData.max_riders * formData.fee_per_rider).toLocaleString()} Kz/semana</strong></p>
          </div>
          <button type="submit" disabled={loading} style={{ backgroundColor: '#f59e0b', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>{loading ? 'Salvando...' : 'Salvar Configuração'}</button>
        </form>
      </div>
    </div>
  )
}