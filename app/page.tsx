// app/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Bike, Users, MapPin, Search, Star, Wifi, WifiOff, Shield, UserCog, User, Building2 } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [plates, setPlates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    loadPlates()
    const savedFavorites = localStorage.getItem('favoritePlates')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  const loadPlates = async () => {
    const { data } = await supabase
      .from('plates')
      .select('*, boss:bosses(*), riders:riders(*)')
      .eq('is_active', true)
    
    const platesWithStats = (data || []).map(plate => ({
      ...plate,
      total_riders: plate.riders?.length || 0,
      online_count: plate.riders?.filter((r: any) => r.is_online).length || 0
    }))
    
    setPlates(platesWithStats)
    setLoading(false)
  }

  const toggleFavorite = (plateId: string) => {
    let newFavorites: string[]
    if (favorites.includes(plateId)) {
      newFavorites = favorites.filter(id => id !== plateId)
    } else {
      newFavorites = [...favorites, plateId]
    }
    setFavorites(newFavorites)
    localStorage.setItem('favoritePlates', JSON.stringify(newFavorites))
  }

  const filteredPlates = plates.filter(plate =>
    plate.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plate.boss?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const favoritePlates = filteredPlates.filter(plate => favorites.includes(plate.id))
  const normalPlates = filteredPlates.filter(plate => !favorites.includes(plate.id))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando MeuPiloto!...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bike className="w-8 h-8 text-amber-500" />
              <h1 className="text-xl font-bold text-gray-900">MeuPiloto!</h1>
            </div>
            
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar placa ou chefe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Links de Acesso */}
            <div className="flex items-center gap-2">
              <Link href="/login/motoqueiro">
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-amber-600 transition rounded-lg hover:bg-gray-100">
                  <User className="w-4 h-4" />
                  Motoqueiro
                </button>
              </Link>
              <Link href="/login/chefe">
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-amber-600 transition rounded-lg hover:bg-gray-100">
                  <UserCog className="w-4 h-4" />
                  Chefe
                </button>
              </Link>
              <Link href="/login/associacao">
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-amber-600 transition rounded-lg hover:bg-gray-100">
                  <Building2 className="w-4 h-4" />
                  Associação
                </button>
              </Link>
              <Link href="/login/admin">
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-amber-600 transition rounded-lg hover:bg-gray-100">
                  <Shield className="w-4 h-4" />
                  Admin
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Seção de Favoritos */}
        {favoritePlates.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              PLACAS FAVORITAS
            </h2>
            <div className="space-y-4">
              {favoritePlates.map((plate) => (
                <PlateCard 
                  key={plate.id} 
                  plate={plate} 
                  isFavorite={true}
                  onToggleFavorite={() => toggleFavorite(plate.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Seção de Todas as Placas */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            TODAS AS PLACAS
          </h2>
          <div className="space-y-4">
            {normalPlates.map((plate) => (
              <PlateCard 
                key={plate.id} 
                plate={plate} 
                isFavorite={false}
                onToggleFavorite={() => toggleFavorite(plate.id)}
              />
            ))}
          </div>
        </div>

        {filteredPlates.length === 0 && (
          <div className="text-center py-12">
            <Bike className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma placa encontrada</p>
          </div>
        )}
      </div>
    </main>
  )
}

// Componente Card da Placa
function PlateCard({ plate, isFavorite, onToggleFavorite }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-red-500 rounded-full flex items-center justify-center">
            <Bike className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">{plate.plate_number}</h3>
              {plate.online_count > 0 && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {plate.online_count} online
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">Chefe: {plate.boss?.name || 'Não definido'}</p>
          </div>
        </div>
        <button onClick={onToggleFavorite} className="p-1">
          <Star className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-amber-500 text-amber-500' : 'text-gray-400 hover:text-amber-500'}`} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex justify-around">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center text-gray-600">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{plate.total_riders}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Motoqueiros</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              {plate.online_count > 0 ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">{plate.online_count}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Online</p>
          </div>
        </div>
      </div>

      <Link href={`/plate/${plate.id}`}>
        <button className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold transition flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4" />
          Ver Motoqueiros
        </button>
      </Link>
    </div>
  )
}