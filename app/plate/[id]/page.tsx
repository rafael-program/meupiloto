// app/plate/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  Phone, 
  User, 
  CheckCircle, 
  XCircle, 
  Navigation,
  Star,
  Wifi,
  WifiOff,
  Clock,
  MapPin,
  CreditCard,
  Shield,
  Award
} from 'lucide-react'
import type { Plate, Boss, Rider } from '@/types'

export default function PlateRiders() {
  const { id } = useParams()
  const router = useRouter()
  const [plate, setPlate] = useState<Plate | null>(null)
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  useEffect(() => {
    loadPlateAndRiders()
    
    const subscription = supabase
      .channel('public:riders')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'riders', filter: `plate_id=eq.${id}` },
        () => loadPlateAndRiders()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [id])

  const loadPlateAndRiders = async () => {
    const { data: plateData } = await supabase
      .from('plates')
      .select('*, boss:bosses(*)')
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

  const openOrderModal = (rider: Rider) => {
    setSelectedRider(rider)
    setShowOrderModal(true)
  }

  const createOrder = async (orderData: {
    customerName: string
    customerPhone: string
    pickupAddress: string
    dropoffAddress: string
    price: number
  }) => {
    if (!selectedRider) return

    const { error } = await supabase
      .from('orders')
      .insert({
        rider_id: selectedRider.id,
        plate_id: id as string,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        pickup_address: orderData.pickupAddress,
        dropoff_address: orderData.dropoffAddress,
        price: orderData.price,
        status: 'pending',
        client_name: orderData.customerName,
        client_phone: orderData.customerPhone,
        pickup_location: orderData.pickupAddress,
        destination: orderData.dropoffAddress
      })

    if (error) {
      alert('Erro ao criar pedido: ' + error.message)
    } else {
      setShowOrderModal(false)
      alert(`✅ Pedido enviado para ${selectedRider.name}! Ele irá te ligar em breve.`)
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando motoqueiros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{plate?.plate_number}</h1>
              <p className="text-xs text-gray-500">Escolha seu motoqueiro</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas da Placa */}
      <div className="bg-gradient-to-r from-amber-500 to-red-500 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-around">
            <div className="text-center">
              <div className="text-2xl font-bold">{riders.length}</div>
              <div className="text-xs opacity-90">Motoqueiros</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{riders.filter(r => r.is_online).length}</div>
              <div className="text-xs opacity-90">Online agora</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-xs opacity-90">Disponível</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Motoqueiros */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {riders.map((rider) => (
            <div 
              key={rider.id} 
              className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
                !rider.is_online ? 'opacity-75' : ''
              }`}
            >
              {/* Status Bar */}
              <div className={`h-1 ${rider.is_online ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    {rider.photo_url ? (
                      <img 
                        src={rider.photo_url} 
                        alt={rider.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-amber-300"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-red-500 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    {rider.is_online && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{rider.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {rider.is_online ? (
                            <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              <Wifi className="w-3 h-3" />
                              Online
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              <WifiOff className="w-3 h-3" />
                              Offline
                            </span>
                          )}
                          <span className="text-xs text-gray-400">BI: {rider.bi}</span>
                        </div>
                      </div>
                      
                      {/* Botão Pedir */}
                      <button
                        onClick={() => openOrderModal(rider)}
                        disabled={!rider.is_online}
                        className={`px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                          rider.is_online
                            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Navigation className="w-4 h-4" />
                        Pedir
                      </button>
                    </div>

                    {/* Detalhes adicionais */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {rider.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        4.8 ★
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(Math.random() * 10) + 1} min
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {riders.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum motoqueiro cadastrado nesta placa</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pedido */}
      {showOrderModal && selectedRider && (
        <OrderModal 
          rider={selectedRider}
          onClose={() => setShowOrderModal(false)}
          onSubmit={createOrder}
        />
      )}
    </div>
  )
}

// Componente do Modal de Pedido
function OrderModal({ 
  rider, 
  onClose, 
  onSubmit 
}: { 
  rider: Rider
  onClose: () => void
  onSubmit: (data: any) => void
}) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    pickupAddress: '',
    dropoffAddress: '',
    price: 1000
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header do Modal */}
        <div className="bg-gradient-to-r from-amber-500 to-red-500 p-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            {rider.photo_url ? (
              <img src={rider.photo_url} alt={rider.name} className="w-12 h-12 rounded-full border-2 border-white" />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1 text-white">
              <h3 className="font-bold">Solicitar Corrida</h3>
              <p className="text-sm opacity-90">Motoqueiro: {rider.name}</p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              ✕
            </button>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seu nome
            </label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Digite seu nome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seu telefone
            </label>
            <input
              type="tel"
              required
              value={formData.customerPhone}
              onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="923456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-3 h-3 inline mr-1 text-green-600" />
              Endereço de origem
            </label>
            <input
              type="text"
              required
              value={formData.pickupAddress}
              onChange={(e) => setFormData({...formData, pickupAddress: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Onde você está?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-3 h-3 inline mr-1 text-red-600" />
              Endereço de destino
            </label>
            <input
              type="text"
              required
              value={formData.dropoffAddress}
              onChange={(e) => setFormData({...formData, dropoffAddress: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Para onde você vai?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CreditCard className="w-3 h-3 inline mr-1" />
              Valor da corrida (Kz)
            </label>
            <input
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="1000"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Confirmar Pedido
          </button>
        </form>
      </div>
    </div>
  )
}