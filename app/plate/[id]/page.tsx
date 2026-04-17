// app/plate/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Phone, User, CheckCircle, XCircle, Navigation, Bike, MapPin, DollarSign, Clock, Star, Shield, Wifi } from 'lucide-react'

export default function PlateRiders() {
  const { id } = useParams()
  const router = useRouter()
  const [plate, setPlate] = useState<any>(null)
  const [riders, setRiders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedRider, setSelectedRider] = useState<any>(null)
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    pickupAddress: '',
    dropoffAddress: '',
    price: 1000
  })

  useEffect(() => {
    loadPlateAndRiders()
  }, [id])

  const loadPlateAndRiders = async () => {
    const { data: plateData } = await supabase
      .from('plates')
      .select('*')
      .eq('id', id)
      .single()

    const { data: ridersData } = await supabase
      .from('riders')
      .select('*')
      .eq('plate_id', id)
      .eq('status', 'active')
      .order('is_online', { ascending: false })

    setPlate(plateData)
    setRiders(ridersData || [])
    setLoading(false)
  }

  const handleOpenForm = (rider: any) => {
    setSelectedRider(rider)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRider) return

    const { error } = await supabase
      .from('orders')
      .insert({
        rider_id: selectedRider.id,
        plate_id: id as string,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        pickup_address: formData.pickupAddress,
        dropoff_address: formData.dropoffAddress,
        price: formData.price,
        status: 'pending',
        client_name: formData.customerName,
        client_phone: formData.customerPhone,
        pickup_location: formData.pickupAddress,
        destination: formData.dropoffAddress
      })

    if (error) {
      console.error('Erro detalhado:', error)
      alert('Erro ao criar pedido: ' + error.message)
    } else {
      alert(`✅ Pedido enviado para ${selectedRider.name}! Ele irá te ligar em breve.`)
      setShowForm(false)
      setFormData({
        customerName: '',
        customerPhone: '',
        pickupAddress: '',
        dropoffAddress: '',
        price: 1000
      })
      router.push('/')
    }
  }

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #f9fafb 0%, #fff5ed 100%)' },
    header: { backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f0f0f0', position: 'sticky' as const, top: 0, zIndex: 10 },
    card: { backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', overflow: 'hidden', transition: 'all 0.3s ease' },
    buttonPrimary: { background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    buttonDisabled: { background: '#d1d5db', color: '#6b7280', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' },
    modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' },
    modalContent: { backgroundColor: 'white', borderRadius: '24px', maxWidth: '480px', width: '90%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
    input: { width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', transition: 'all 0.3s ease' },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#374151' }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ animation: 'spin 1s linear infinite', width: '48px', height: '48px', border: '3px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }}></div>
            <p style={{ color: '#6b7280' }}>Carregando motoqueiros...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px' }}>
          <button 
            onClick={() => router.back()} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', fontSize: '14px' }}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bike size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(135deg, #d97706, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {plate?.plate_number}
              </h1>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                {riders.filter(r => r.is_online).length} motoqueiros online • {riders.length} total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {riders.map((rider, index) => (
            <div 
              key={rider.id} 
              style={{ 
                ...styles.card, 
                transform: 'translateY(0)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{ flexShrink: 0 }}>
                  {rider.photo_url ? (
                    <img src={rider.photo_url} alt={rider.name} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f59e0b' }} />
                  ) : (
                    <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={32} color="white" />
                    </div>
                  )}
                </div>

                {/* Informações */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{rider.name}</h3>
                    {rider.is_online ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
                        <Wifi size={12} />
                        Online
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
                        <XCircle size={12} />
                        Offline
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <p style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={14} /> BI: {rider.bi}
                    </p>
                    <p style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={14} /> {rider.phone}
                    </p>
                  </div>
                </div>

                {/* Botão */}
                <button
                  onClick={() => handleOpenForm(rider)}
                  disabled={!rider.is_online}
                  style={rider.is_online ? styles.buttonPrimary : styles.buttonDisabled}
                >
                  <Navigation size={18} />
                  Pedir Moto
                </button>
              </div>
            </div>
          ))}

          {riders.length === 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '48px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
              <Bike size={64} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: '#6b7280', fontSize: '16px' }}>Nenhum motoqueiro cadastrado nesta placa</p>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>Volte mais tarde ou tente outra placa</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && selectedRider && (
        <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', padding: '20px', borderRadius: '24px 24px 0 0', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Solicitar Corrida</h3>
                  <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>Motoqueiro: {selectedRider.name}</p>
                </div>
                <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={styles.label}>Seu nome</label>
                <input 
                  type="text" 
                  required 
                  value={formData.customerName} 
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})} 
                  style={styles.input} 
                  placeholder="Digite seu nome completo"
                  onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={styles.label}>Seu telefone</label>
                <input 
                  type="tel" 
                  required 
                  value={formData.customerPhone} 
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} 
                  style={styles.input} 
                  placeholder="923 456 789"
                  onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={styles.label}>📍 Endereço de origem</label>
                <input 
                  type="text" 
                  required 
                  value={formData.pickupAddress} 
                  onChange={(e) => setFormData({...formData, pickupAddress: e.target.value})} 
                  style={styles.input} 
                  placeholder="Onde você está?"
                  onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={styles.label}>🎯 Endereço de destino</label>
                <input 
                  type="text" 
                  required 
                  value={formData.dropoffAddress} 
                  onChange={(e) => setFormData({...formData, dropoffAddress: e.target.value})} 
                  style={styles.input} 
                  placeholder="Para onde você vai?"
                  onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={styles.label}>💰 Valor da corrida (Kz)</label>
                <input 
                  type="number" 
                  required 
                  value={formData.price} 
                  onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})} 
                  style={styles.input} 
                  placeholder="1000"
                  min="100"
                  step="100"
                  onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              <button 
                type="submit" 
                style={{ 
                  ...styles.buttonPrimary, 
                  width: '100%', 
                  justifyContent: 'center', 
                  padding: '14px',
                  fontSize: '16px',
                  marginTop: '8px'
                }}
              >
                <Navigation size={18} />
                Confirmar Pedido
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}