// app/page.tsx - Footer corrigido
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Bike, Users, MapPin, Search, Star, Wifi, WifiOff, Shield, UserCog, User, Building2, Sparkles } from 'lucide-react'
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

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #f9fafb 0%, #fff5ed 100%)' },
    header: { backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f0f0f0', position: 'sticky' as const, top: 0, zIndex: 10 },
    card: { backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', overflow: 'hidden', transition: 'all 0.3s ease' },
    button: { 
      width: '100%', 
      padding: '12px', 
      background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
      color: 'white',
      border: 'none',
      fontWeight: 600,
      fontSize: '14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s ease'
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fffbeb, #fff0f0)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ animation: 'spin 1s linear infinite', width: '48px', height: '48px', border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280' }}>Carregando MeuPiloto!...</p>
        </div>
      </div>
    )
  }

  return (
    <main style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bike size={32} color="#f59e0b" />
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(135deg, #d97706, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MeuPiloto!</h1>
                <p style={{ fontSize: '10px', color: '#9ca3af' }}>Sua corrida com segurança</p>
              </div>
            </div>
            
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Pesquisar placa ou chefe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '9999px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            {/* Links de Acesso */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Link href="/login/motoqueiro">
                <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  <User size={16} /> Motoqueiro
                </button>
              </Link>
              <Link href="/login/chefe">
                <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  <UserCog size={16} /> Chefe
                </button>
              </Link>
              <Link href="/login/associacao">
                <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  <Building2 size={16} /> Associação
                </button>
              </Link>
              <Link href="/login/operador">
  <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-amber-600 transition rounded-lg hover:bg-gray-100">
    <Shield className="w-4 h-4" />
    Operador
  </button>
</Link>
              <Link href="/login/admin">
                <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  <Shield size={16} /> Admin
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero mini */}
      <div style={{ textAlign: 'center', padding: '24px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#fef3c7', padding: '4px 12px', borderRadius: '9999px', marginBottom: '8px' }}>
          <Sparkles size={12} color="#d97706" />
          <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 500 }}>Plataforma de Transporte</span>
        </div>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          {plates.length} placas ativas • {plates.reduce((acc, p) => acc + p.total_riders, 0)} motoqueiros
        </p>
      </div>

      {/* Conteúdo */}
      <div style={{ maxWidth: '672px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Seção de Favoritos */}
        {favoritePlates.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '4px', height: '20px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '4px' }}></div>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                PLACAS FAVORITAS
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '4px', height: '20px', background: 'linear-gradient(135deg, #9ca3af, #6b7280)', borderRadius: '4px' }}></div>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
              TODAS AS PLACAS
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Bike size={64} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#6b7280' }}>Nenhuma placa encontrada</p>
          </div>
        )}
      </div>

      {/* Footer - CORRIGIDO */}
      <footer style={{ borderTop: '1px solid #f0f0f0', marginTop: '32px', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#9ca3af' }}>
          © 2026 MeuPiloto! - Sua corrida com segurança - Rafael dev
        </p>
      </footer>
    </main>
  )
}

// Componente Card da Placa
function PlateCard({ plate, isFavorite, onToggleFavorite }: any) {
  const [isHovered, setIsHovered] = useState(false)

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #f0f0f0',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    background: isHovered ? 'linear-gradient(135deg, #d97706, #c2410c)' : 'linear-gradient(135deg, #f59e0b, #ea580c)',
    color: 'white',
    border: 'none',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease'
  }

  return (
    <div style={cardStyle}>
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bike size={20} color="white" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontWeight: 'bold', color: '#111827' }}>{plate.plate_number}</h3>
              {plate.online_count > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '9999px' }}>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                  {plate.online_count} online
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Chefe: {plate.boss?.name || 'Não definido'}</p>
          </div>
        </div>
        <button 
          onClick={onToggleFavorite} 
          style={{ padding: '4px', background: 'none', border: 'none', borderRadius: '50%', cursor: 'pointer' }}
        >
          <Star size={20} fill={isFavorite ? '#f59e0b' : 'none'} color={isFavorite ? '#f59e0b' : '#9ca3af'} />
        </button>
      </div>

      <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', color: '#6b7280' }}>
              <Users size={16} />
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{plate.total_riders}</span>
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Motoqueiros</p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              {plate.online_count > 0 ? (
                <Wifi size={16} color="#10b981" />
              ) : (
                <WifiOff size={16} color="#9ca3af" />
              )}
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{plate.online_count}</span>
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Online</p>
          </div>
        </div>
      </div>

      <Link href={`/plate/${plate.id}`}>
        <button 
          style={buttonStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <MapPin size={16} />
          Ver Motoqueiros
        </button>
      </Link>
    </div>
  )
}