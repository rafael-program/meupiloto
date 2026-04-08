// app/plate/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Phone, User, CheckCircle, XCircle, Navigation } from 'lucide-react'

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

    // Inserir com todos os campos necessários
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
        // Campos adicionais para evitar erro de null
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{plate?.plate_number}</h1>
          <p className="text-gray-600 text-sm">Escolha seu motoqueiro</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="space-y-4">
          {riders.map((rider) => (
            <div key={rider.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0">
                  {rider.photo_url ? (
                    <img src={rider.photo_url} alt={rider.name} className="w-16 h-16 rounded-full object-cover border-2 border-amber-300" />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-red-500 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{rider.name}</h3>
                    {rider.is_online ? (
                      <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                        <XCircle className="w-3 h-3" />
                        Offline
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">BI: {rider.bi}</p>
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {rider.phone}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenForm(rider)}
                  disabled={!rider.is_online}
                  className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition ${
                    rider.is_online
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  Pedir Moto
                </button>
              </div>
            </div>
          ))}

          {riders.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Nenhum motoqueiro cadastrado nesta placa</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && selectedRider && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', maxWidth: '28rem', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', padding: '1rem', borderRadius: '1rem 1rem 0 0', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 'bold' }}>Solicitar Corrida</h3>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
              </div>
              <p style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: '0.25rem' }}>Motoqueiro: {selectedRider.name}</p>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Seu nome</label>
                <input type="text" required value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="Digite seu nome" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Seu telefone</label>
                <input type="tel" required value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="923456789" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Endereço de origem</label>
                <input type="text" required value={formData.pickupAddress} onChange={(e) => setFormData({...formData, pickupAddress: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="Onde você está?" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Endereço de destino</label>
                <input type="text" required value={formData.dropoffAddress} onChange={(e) => setFormData({...formData, dropoffAddress: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="Para onde você vai?" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Valor da corrida (Kz)</label>
                <input type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="1000" />
              </div>

              <button type="submit" style={{ width: '100%', background: '#f59e0b', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Navigation size={16} /> Confirmar Pedido
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}