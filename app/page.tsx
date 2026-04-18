// app/page.tsx - Versão totalmente responsiva
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Bike, Users, MapPin, Search, Star, Wifi, WifiOff, Shield, UserCog, User, Building2, Sparkles, Menu, X } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [plates, setPlates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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
    header: { backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f0f0f0', position: 'sticky' as const, top: 0, zIndex: 10 },
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
    },
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fffbeb, #fff0f0)' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ animation: 'spin 1s linear infinite', width: '48px', height: '48px', border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280' }}>Carregando MeuPiloto!...</p>
        </div>
      </div>
    )
  }

  return (
    <main style={styles.container}>
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
          <Link href="/login/motoqueiro">
            <button style={{ width: '100%', padding: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px', marginBottom: '8px' }}>
              <User size={20} color="#6b7280" />
              <span>Motoqueiro</span>
            </button>
          </Link>
          <Link href="/login/chefe">
            <button style={{ width: '100%', padding: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px', marginBottom: '8px' }}>
              <UserCog size={20} color="#6b7280" />
              <span>Chefe</span>
            </button>
          </Link>
          <Link href="/login/associacao">
            <button style={{ width: '100%', padding: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px', marginBottom: '8px' }}>
              <Building2 size={20} color="#6b7280" />
              <span>Associação</span>
            </button>
          </Link>
          <Link href="/login/operador">
            <button style={{ width: '100%', padding: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px', marginBottom: '8px' }}>
              <Shield size={20} color="#6b7280" />
              <span>Operador</span>
            </button>
          </Link>
          <Link href="/login/admin">
            <button style={{ width: '100%', padding: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px' }}>
              <Shield size={20} color="#6b7280" />
              <span>Admin</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bike size={isMobile ? 28 : 32} color="#f59e0b" />
              <div>
                <h1 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', background: 'linear-gradient(135deg, #d97706, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MeuPiloto!</h1>
                <p style={{ fontSize: '10px', color: '#9ca3af' }}>Sua corrida com segurança</p>
              </div>
            </div>
            
            <div style={{ position: 'relative', flex: isMobile ? 1 : 'auto', maxWidth: isMobile ? '100%' : '400px', order: isMobile ? 3 : 0, width: isMobile ? '100%' : 'auto' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Pesquisar placa ou chefe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '9999px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            {/* Links de Acesso - Desktop */}
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Link href="/login/motoqueiro">
                  <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <User size={16} /> Motoqueiro
                  </button>
                </Link>
                <Link href="/login/chefe">
                  <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <UserCog size={16} /> Chefe
                  </button>
                </Link>
                <Link href="/login/associacao">
                  <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <Building2 size={16} /> Associação
                  </button>
                </Link>
                <Link href="/login/operador">
                  <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <Shield size={16} /> Operador
                  </button>
                </Link>
                <Link href="/login/admin">
                  <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <Shield size={16} /> Admin
                  </button>
                </Link>
              </div>
            )}

            {/* Botão Menu Mobile */}
            {isMobile && (
              <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                <Menu size={24} color="#374151" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero mini */}
      <div style={{ textAlign: 'center', padding: '20px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#fef3c7', padding: '4px 12px', borderRadius: '9999px', marginBottom: '8px' }}>
          <Sparkles size={12} color="#d97706" />
          <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 500 }}>Plataforma de Transporte</span>
        </div>
        <p style={{ fontSize: isMobile ? '12px' : '14px', color: '#6b7280' }}>
          {plates.length} placas ativas • {plates.reduce((acc, p) => acc + p.total_riders, 0)} motoqueiros
        </p>
      </div>

      {/* Conteúdo */}
      <div style={{ maxWidth: '672px', margin: '0 auto', padding: '20px 16px' }}>
        {/* Seção de Favoritos */}
        {favoritePlates.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '4px', height: '20px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '4px' }}></div>
              <h2 style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        )}

        {/* Seção de Todas as Placas */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '4px', height: '20px', background: 'linear-gradient(135deg, #9ca3af, #6b7280)', borderRadius: '4px' }}></div>
            <h2 style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>

        {filteredPlates.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <Bike size={64} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#6b7280' }}>Nenhuma placa encontrada</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #f0f0f0', marginTop: '32px', padding: '20px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: isMobile ? '11px' : '12px', color: '#9ca3af' }}>
          © 2026 MeuPiloto! - Sua corrida com segurança - Rafael dev
        </p>
      </footer>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          button:hover {
            transform: none;
          }
        }
      `}</style>
    </main>
  )
}

// Componente Card da Placa - Versão Responsiva
function PlateCard({ plate, isFavorite, onToggleFavorite, isMobile }: any) {
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
    padding: isMobile ? '14px' : '12px',
    background: isHovered ? 'linear-gradient(135deg, #d97706, #c2410c)' : 'linear-gradient(135deg, #f59e0b, #ea580c)',
    color: 'white',
    border: 'none',
    fontWeight: 600,
    fontSize: isMobile ? '13px' : '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease'
  }

  return (
    <div style={cardStyle}>
      <div style={{ padding: isMobile ? '14px' : '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '12px', flex: 1, minWidth: 0 }}>
          <div style={{ 
            width: isMobile ? '36px' : '40px', 
            height: isMobile ? '36px' : '40px', 
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Bike size={isMobile ? 18 : 20} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <h3 style={{ fontWeight: 'bold', color: '#111827', fontSize: isMobile ? '15px' : '16px', wordBreak: 'break-word' }}>{plate.plate_number}</h3>
              {plate.online_count > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: isMobile ? '10px' : '12px', backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '9999px', whiteSpace: 'nowrap' }}>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                  {plate.online_count}
                </span>
              )}
            </div>
            <p style={{ fontSize: isMobile ? '11px' : '12px', color: '#6b7280', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Chefe: {plate.boss?.name || 'Não definido'}
            </p>
          </div>
        </div>
        <button 
          onClick={onToggleFavorite} 
          style={{ padding: '4px', background: 'none', border: 'none', borderRadius: '50%', cursor: 'pointer', flexShrink: 0 }}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Star size={isMobile ? 18 : 20} fill={isFavorite ? '#f59e0b' : 'none'} color={isFavorite ? '#f59e0b' : '#9ca3af'} />
        </button>
      </div>

      <div style={{ padding: isMobile ? '12px' : '16px', backgroundColor: '#fafafa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', color: '#6b7280' }}>
              <Users size={isMobile ? 14 : 16} />
              <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 500, color: '#111827' }}>{plate.total_riders}</span>
            </div>
            <p style={{ fontSize: isMobile ? '10px' : '12px', color: '#9ca3af', marginTop: '4px' }}>Motoqueiros</p>
          </div>
          
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              {plate.online_count > 0 ? (
                <Wifi size={isMobile ? 14 : 16} color="#10b981" />
              ) : (
                <WifiOff size={isMobile ? 14 : 16} color="#9ca3af" />
              )}
              <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 500, color: '#111827' }}>{plate.online_count}</span>
            </div>
            <p style={{ fontSize: isMobile ? '10px' : '12px', color: '#9ca3af', marginTop: '4px' }}>Online</p>
          </div>
        </div>
      </div>

      <Link href={`/plate/${plate.id}`} style={{ display: 'block' }}>
        <button 
          style={buttonStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
        >
          <MapPin size={isMobile ? 14 : 16} />
          Ver Motoqueiros
        </button>
      </Link>
    </div>
  )
}