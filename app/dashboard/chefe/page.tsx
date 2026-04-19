// app/dashboard/chefe/page.tsx - VERSÃO MODERNIZADA E RESPONSIVA
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Bike, Users, Plus, Edit, Trash2, LogOut, DollarSign,
  CheckCircle, XCircle, Search, UserPlus, CreditCard,
  Smartphone, Building, Copy, Check, TrendingUp, Settings, AlertCircle,
  X, Camera, Loader2, Menu, Wifi, WifiOff, Star, Phone, MapPin
} from 'lucide-react'

// ============================================
// MODAIS (DEFINIDOS ANTES DO COMPONENTE PRINCIPAL)
// ============================================

// Modal de Adicionar Motoqueiro - Versão Responsiva
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

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
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 50, overflow: 'auto', backdropFilter: 'blur(4px)'
    }}>
      <div style={{ backgroundColor: 'white', borderRadius: '24px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', padding: isMobile ? '16px' : '20px', borderRadius: '24px 24px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', position: 'sticky', top: 0 }}>
          <h3 style={{ fontWeight: 'bold', fontSize: isMobile ? '18px' : '20px' }}>Novo Motoqueiro</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '20px' : '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              {photoUrl ? (
                <div style={{ position: 'relative' }}>
                  <img src={photoUrl} alt="Preview" style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fcd34d' }} />
                  <button type="button" onClick={() => setPhotoUrl('')} style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', padding: '4px', border: 'none', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label style={{ cursor: 'pointer' }}>
                  <div style={{ width: '96px', height: '96px', backgroundColor: '#f3f4f6', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #d1d5db' }}>
                    {uploadingPhoto ? (
                      <Loader2 size={32} style={{ color: '#f59e0b', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <Camera size={32} style={{ color: '#9ca3af' }} />
                        <span style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>Foto</span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePhotoUpload(file) }} style={{ display: 'none' }} disabled={uploadingPhoto} />
                </label>
              )}
            </div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>Clique para adicionar foto (max 2MB)</p>
          </div>

          <input type="text" required placeholder="Nome completo" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: isMobile ? '16px' : '14px' }} />
          <input type="tel" required placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: isMobile ? '16px' : '14px' }} />
          <input type="text" required placeholder="BI" value={formData.bi} onChange={(e) => setFormData({...formData, bi: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: isMobile ? '16px' : '14px' }} />
          <input type="text" placeholder="Senha" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: isMobile ? '16px' : '14px', backgroundColor: '#f9fafb' }} />
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: 'white', fontWeight: 500 }}>Cancelar</button>
            <button type="submit" disabled={loading || uploadingPhoto} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', opacity: (loading || uploadingPhoto) ? 0.5 : 1 }}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal de Editar Motoqueiro - Versão Responsiva
function EditRiderModal({ rider, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({ name: rider.name, phone: rider.phone, bi: rider.bi, password: '' })
  const [photoUrl, setPhotoUrl] = useState<string>(rider.photo_url || '')
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)
    if (!file.type.startsWith('image/')) { alert('Por favor, selecione uma imagem válida'); setUploadingPhoto(false); return }
    if (file.size > 2 * 1024 * 1024) { alert('A imagem deve ter no máximo 2MB'); setUploadingPhoto(false); return }
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `riders/${fileName}`
    const { error: uploadError } = await supabase.storage.from('rider-photos').upload(filePath, file)
    if (uploadError) { alert('Erro ao fazer upload da foto'); setUploadingPhoto(false); return }
    const { data: { publicUrl } } = supabase.storage.from('rider-photos').getPublicUrl(filePath)
    setPhotoUrl(publicUrl)
    setUploadingPhoto(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const updateData: any = { name: formData.name, phone: formData.phone, bi: formData.bi }
    if (formData.password) updateData.password_hash = formData.password
    if (photoUrl && photoUrl !== rider.photo_url) updateData.photo_url = photoUrl
    const { error } = await supabase.from('riders').update(updateData).eq('id', rider.id)
    if (!error) onSuccess(); else alert('Erro ao atualizar: ' + error.message)
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '24px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: isMobile ? '16px' : '20px', borderRadius: '24px 24px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: isMobile ? '18px' : '20px' }}>Editar Motoqueiro</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '20px' : '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              {photoUrl ? (
                <div style={{ position: 'relative' }}>
                  <img src={photoUrl} alt="Preview" style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #93c5fd' }} />
                  <button type="button" onClick={() => setPhotoUrl('')} style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', padding: '4px', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
                </div>
              ) : (
                <label style={{ cursor: 'pointer' }}>
                  <div style={{ width: '96px', height: '96px', backgroundColor: '#f3f4f6', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #d1d5db' }}>
                    {uploadingPhoto ? <Loader2 size={32} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} /> : <><Camera size={32} style={{ color: '#9ca3af' }} /><span style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>Foto</span></>}
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePhotoUpload(file) }} style={{ display: 'none' }} disabled={uploadingPhoto} />
                </label>
              )}
            </div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>Clique na foto para trocar (max 2MB)</p>
          </div>
          <input type="text" required placeholder="Nome" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: isMobile ? '16px' : '14px' }} />
          <input type="tel" required placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: isMobile ? '16px' : '14px' }} />
          <input type="text" required placeholder="BI" value={formData.bi} onChange={(e) => setFormData({...formData, bi: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: isMobile ? '16px' : '14px' }} />
          <input type="text" placeholder="Nova Senha (opcional)" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: isMobile ? '16px' : '14px' }} />
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: 'white', fontWeight: 500 }}>Cancelar</button>
            <button type="submit" disabled={loading || uploadingPhoto} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', opacity: (loading || uploadingPhoto) ? 0.5 : 1 }}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal de Pagamento - Versão Responsiva
function PaymentModal({ plateId, plateName, amount, totalRiders, feePerRider, maxRiders, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('unitel')
  const [showReceipt, setShowReceipt] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  const paymentInfo = { unitelMoney: { number: '926572603', name: 'Rafael Domingos Nzambi' }, iban: { bank: 'Banco Atlantico', account: 'AO06 0055 0000 2883 6759 1015 5', swift: 'Shoow', beneficiary: 'Rafael Domingos Nzambi' } }

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const transactionId = 'TRX_' + Date.now()
    const paymentDate = new Date().toLocaleString('pt-AO')
    const { error } = await supabase.from('plate_payments').insert({ plate_id: plateId, amount, week_start: new Date().toISOString(), week_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), payment_method: paymentMethod, is_paid: true, paid_at: new Date().toISOString(), status: 'completed', transaction_id: transactionId })
    if (error) { alert('Erro: ' + error.message); setLoading(false) }
    else { setPaymentData({ plateName, amount, totalRiders, feePerRider, paymentMethod: paymentMethod === 'unitel' ? 'Unitel Money' : 'Transferência IBAN', transactionId, paymentDate, status: 'PAGO' }); setShowReceipt(true); setLoading(false) }
  }

  const sendToWhatsApp = () => { const message = `🏍️ *MEUPILOTO! - COMPROVANTE DE PAGAMENTO*\n\n📋 *DETALHES DO PAGAMENTO*\n─────────────────────\n🏢 *Placa:* ${paymentData.plateName}\n👥 *Motoqueiros:* ${paymentData.totalRiders}\n💰 *Taxa por Motoqueiro:* ${paymentData.feePerRider.toLocaleString()} Kz\n💵 *Valor Total:* ${paymentData.amount.toLocaleString()} Kz\n📅 *Data:* ${paymentData.paymentDate}\n🆔 *Transação:* ${paymentData.transactionId}\n💳 *Método:* ${paymentData.paymentMethod}\n✅ *Status:* ${paymentData.status}\n─────────────────────\n\nObrigado por utilizar o MeuPiloto! 🚀`; window.open(`https://wa.me/244926572603?text=${encodeURIComponent(message)}`, '_blank') }

  if (showReceipt && paymentData) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', maxWidth: '450px', width: '90%' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: isMobile ? '16px' : '20px', borderRadius: '24px 24px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
            <h3 style={{ fontWeight: 'bold', fontSize: isMobile ? '18px' : '20px' }}>✅ Comprovante</h3>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px' }}>✕</button>
          </div>
          <div style={{ padding: isMobile ? '20px' : '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} color="#059669" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Pagamento Confirmado!</h2>
            </div>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', margin: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '13px' }}>Placa:</span><span style={{ fontWeight: 'bold' }}>{paymentData.plateName}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '13px' }}>Motoqueiros:</span><span>{paymentData.totalRiders}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '13px' }}>Taxa/Motoqueiro:</span><span>{paymentData.feePerRider.toLocaleString()} Kz</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '8px' }}><span style={{ fontWeight: 'bold' }}>Total:</span><span style={{ fontWeight: 'bold', color: '#059669' }}>{paymentData.amount.toLocaleString()} Kz</span></div>
            </div>
            <button onClick={sendToWhatsApp} style={{ width: '100%', backgroundColor: '#10b981', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>📱 Enviar via WhatsApp</button>
            <button onClick={onSuccess} style={{ width: '100%', backgroundColor: '#f3f4f6', color: '#374151', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Fechar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, overflow: 'auto', backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '24px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: isMobile ? '16px' : '20px', borderRadius: '24px 24px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', position: 'sticky', top: 0 }}>
          <h3 style={{ fontWeight: 'bold', fontSize: isMobile ? '18px' : '20px' }}>Pagar Taxa Semanal</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '20px' : '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#f0fdf4', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>Total a Pagar</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>{amount.toLocaleString()} Kz</p>
          </div>
          
          <div style={{ backgroundColor: '#fffbeb', borderRadius: '12px', padding: '12px' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>📊 Detalhamento:</p>
            <div style={{ fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Motoqueiros:</span><span>{totalRiders} / {maxRiders}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}><span>Taxa por motoqueiro:</span><span>{feePerRider} Kz</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #fde68a', paddingTop: '8px', marginTop: '8px', fontWeight: 'bold' }}><span>Total:</span><span>{amount.toLocaleString()} Kz</span></div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button type="button" onClick={() => setPaymentMethod('unitel')} style={{ padding: '12px', borderRadius: '12px', border: `2px solid ${paymentMethod === 'unitel' ? '#10b981' : '#e5e7eb'}`, backgroundColor: paymentMethod === 'unitel' ? '#f0fdf4' : 'white', cursor: 'pointer' }}>
              <Smartphone size={20} style={{ margin: '0 auto 4px', color: '#059669' }} />
              <span style={{ fontSize: '12px' }}>Unitel Money</span>
            </button>
            <button type="button" onClick={() => setPaymentMethod('iban')} style={{ padding: '12px', borderRadius: '12px', border: `2px solid ${paymentMethod === 'iban' ? '#3b82f6' : '#e5e7eb'}`, backgroundColor: paymentMethod === 'iban' ? '#eff6ff' : 'white', cursor: 'pointer' }}>
              <Building size={20} style={{ margin: '0 auto 4px', color: '#2563eb' }} />
              <span style={{ fontSize: '12px' }}>IBAN</span>
            </button>
          </div>
          
          {paymentMethod === 'unitel' && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px' }}>Número:</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{paymentInfo.unitelMoney.number}</span>
                  <button type="button" onClick={() => copyToClipboard(paymentInfo.unitelMoney.number)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px' }}>Nome:</span><span style={{ fontSize: '13px' }}>{paymentInfo.unitelMoney.name}</span></div>
            </div>
          )}
          
          {paymentMethod === 'iban' && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '13px' }}>Banco:</span><span style={{ fontSize: '13px' }}>{paymentInfo.iban.bank}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px' }}>IBAN:</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{paymentInfo.iban.account.substring(0, 20)}...</span>
                  <button type="button" onClick={() => copyToClipboard(paymentInfo.iban.account)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Copy size={16} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px' }}>Beneficiário:</span><span style={{ fontSize: '13px' }}>{paymentInfo.iban.beneficiary}</span></div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: 'white', fontWeight: 500 }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>{loading ? 'Processando...' : 'Confirmar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal de Configuração da Placa - Versão Responsiva
function PlateConfigModal({ plate, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({ max_riders: plate.max_riders || 20, fee_per_rider: plate.fee_per_rider || 500 })
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); await onSuccess(formData.max_riders, formData.fee_per_rider); setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '24px', maxWidth: '450px', width: '90%' }}>
        <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', padding: isMobile ? '16px' : '20px', borderRadius: '24px 24px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: isMobile ? '18px' : '20px' }}>Configurar Placa</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '20px' : '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Número máximo de motoqueiros</label>
            <input type="number" required value={formData.max_riders} onChange={(e) => setFormData({...formData, max_riders: parseInt(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: isMobile ? '16px' : '14px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Taxa por motoqueiro (Kz)</label>
            <input type="number" required value={formData.fee_per_rider} onChange={(e) => setFormData({...formData, fee_per_rider: parseInt(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: isMobile ? '16px' : '14px' }} />
          </div>
          <div style={{ backgroundColor: '#fffbeb', borderRadius: '12px', padding: '12px' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>💰 Resumo:</p>
            <p style={{ fontSize: '13px' }}>{formData.max_riders} motoqueiros × {formData.fee_per_rider} Kz = <strong>{(formData.max_riders * formData.fee_per_rider).toLocaleString()} Kz/semana</strong></p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: 'white', fontWeight: 500 }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [stats, setStats] = useState({
    totalRiders: 0,
    activeRiders: 0,
    onlineNow: 0,
    weeklyPayment: 0,
    maxRiders: 20,
    feePerRider: 500,
    availableSlots: 20
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
      .eq('boss_id', bossId)
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
      const feePerRiderValue = plateData.fee_per_rider || 500
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

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #f9fafb 0%, #fffbeb 100%)' },
    card: { background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' },
    buttonPrimary: { background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f9fafb 0%, #fffbeb 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ animation: 'spin 1s linear infinite', width: '48px', height: '48px', border: '3px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280' }}>Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!plate) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f9fafb 0%, #fffbeb 100%)' }}>
        <div style={{ textAlign: 'center', backgroundColor: 'white', padding: '32px', borderRadius: '24px', maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <AlertCircle size={64} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Nenhuma placa encontrada</h2>
          <p style={{ marginBottom: '20px', color: '#6b7280' }}>Você não está associado a nenhuma placa.</p>
          <button onClick={handleLogout} style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Sair</button>
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
            <Bike size={24} color="#f59e0b" />
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Menu</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} color="#6b7280" />
          </button>
        </div>
        <div style={{ padding: '16px' }}>
          <button onClick={() => { setShowAddRider(true); setMobileMenuOpen(false) }} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px' }}>
            <UserPlus size={20} color="#f59e0b" /> Novo Motoqueiro
          </button>
          <button onClick={() => { setShowPaymentModal(true); setMobileMenuOpen(false) }} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px' }}>
            <CreditCard size={20} color="#10b981" /> Pagar Taxa
          </button>
          <button onClick={() => { setShowConfigModal(true); setMobileMenuOpen(false) }} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px' }}>
            <Settings size={20} color="#6b7280" /> Configurar Placa
          </button>
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '16px', paddingTop: '16px' }}>
            <button onClick={handleLogout} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', borderRadius: '12px', cursor: 'pointer', color: '#ef4444' }}>
              <LogOut size={20} /> Sair
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '12px 16px' : '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bike size={isMobile ? 20 : 24} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: '#111827' }}>Dashboard Chefe</h1>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>{plate?.plate_number}</p>
              </div>
            </div>

            {/* Desktop Actions */}
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setShowConfigModal(true)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px' }}>
                  <Settings size={20} color="#6b7280" />
                </button>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500 }}>{boss?.name}</p>
                  <p style={{ fontSize: '11px', color: '#6b7280' }}>{boss?.phone}</p>
                </div>
                <button onClick={handleLogout} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px' }}>
                  <LogOut size={20} color="#6b7280" />
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <button onClick={() => setMobileMenuOpen(true)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Menu size={24} color="#374151" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: isMobile ? '12px' : '16px', marginBottom: '24px' }}>
          <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Users size={isMobile ? 18 : 20} color="#6b7280" />
              <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold' }}>{stats.totalRiders} / {stats.maxRiders}</span>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Motoqueiros</p>
            <p style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>{stats.availableSlots} vagas</p>
          </div>
          
          <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Wifi size={isMobile ? 18 : 20} color="#10b981" />
              <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold', color: '#10b981' }}>{stats.onlineNow}</span>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Online</p>
          </div>
          
          <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Star size={isMobile ? 18 : 20} color="#3b82f6" />
              <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.activeRiders}</span>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Ativos</p>
          </div>
          
          <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <DollarSign size={isMobile ? 18 : 20} color="#d97706" />
              <span style={{ fontSize: isMobile ? '16px' : '24px', fontWeight: 'bold', color: '#d97706' }}>{stats.feePerRider} Kz</span>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Taxa/Motoqueiro</p>
          </div>
          
          <div style={{ ...styles.card, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <TrendingUp size={isMobile ? 18 : 20} style={{ opacity: 0.8 }} />
              <span style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 'bold' }}>{stats.weeklyPayment.toLocaleString()} Kz</span>
            </div>
            <p style={{ fontSize: '12px', opacity: 0.8 }}>Total Semanal</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowAddRider(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: isMobile ? '10px 20px' : '12px 24px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? '13px' : '14px' }}>
            <UserPlus size={isMobile ? 16 : 18} /> Novo Motoqueiro
          </button>
          <button onClick={() => setShowPaymentModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: isMobile ? '10px 20px' : '12px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? '13px' : '14px' }}>
            <CreditCard size={isMobile ? 16 : 18} /> Pagar Taxa ({stats.weeklyPayment.toLocaleString()} Kz)
          </button>
        </div>

        {/* Riders List */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
          <div style={{ padding: isMobile ? '16px' : '20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontWeight: 'bold', fontSize: '16px' }}>Motoqueiros ({stats.totalRiders})</h2>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '10px', width: isMobile ? '200px' : '250px', fontSize: isMobile ? '14px' : '13px', outline: 'none' }} />
            </div>
          </div>
          
          <div>
            {filteredRiders.map((rider) => (
              <div key={rider.id} style={{ padding: isMobile ? '16px' : '20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  {rider.photo_url ? (
                    <img src={rider.photo_url} alt={rider.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fcd34d' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #fef3c7, #fffbeb)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bike size={24} color="#d97706" />
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '16px', color: '#111827' }}>{rider.name}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={10} /> {rider.phone}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={10} /> BI: {rider.bi}
                      </p>
                      {rider.is_online && (
                        <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Wifi size={10} /> Online
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, backgroundColor: rider.status === 'active' ? '#d1fae5' : '#fee2e2', color: rider.status === 'active' ? '#065f46' : '#991b1b' }}>
                    {rider.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                  <button onClick={() => { setSelectedRider(rider); setShowEditRider(true) }} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', borderRadius: '8px' }}>
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deleteRider(rider.id)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', borderRadius: '8px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {filteredRiders.length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <Users size={48} style={{ margin: '0 auto 12px', color: '#d1d5db' }} />
                <p style={{ color: '#6b7280' }}>Nenhum motoqueiro cadastrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modais */}
      {showAddRider && <AddRiderModal plateId={plate?.id} onClose={() => setShowAddRider(false)} onSuccess={() => { setShowAddRider(false); const bossId = localStorage.getItem('boss_id'); if (bossId) loadData(bossId) }} />}
      {showEditRider && selectedRider && <EditRiderModal rider={selectedRider} onClose={() => { setShowEditRider(false); setSelectedRider(null) }} onSuccess={() => { setShowEditRider(false); setSelectedRider(null); const bossId = localStorage.getItem('boss_id'); if (bossId) loadData(bossId) }} />}
      {showPaymentModal && <PaymentModal plateId={plate?.id} plateName={plate?.plate_number} amount={stats.weeklyPayment} totalRiders={stats.totalRiders} feePerRider={stats.feePerRider} maxRiders={stats.maxRiders} onClose={() => setShowPaymentModal(false)} onSuccess={() => { setShowPaymentModal(false); alert('Pagamento registrado com sucesso!') }} />}
      {showConfigModal && plate && <PlateConfigModal plate={plate} onClose={() => setShowConfigModal(false)} onSuccess={async (maxRiders: number, feePerRider: number) => { const success = await updatePlateConfig(maxRiders, feePerRider); if (success) setShowConfigModal(false) }} />}

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