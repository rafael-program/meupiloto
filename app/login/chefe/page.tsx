// app/login/chefe/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Phone, Lock, AlertCircle, Shield, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function BossLogin() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cleanPhone = phone.replace(/\D/g, '')
    
    console.log('📱 Telefone digitado:', phone)
    console.log('📱 Telefone limpo:', cleanPhone)

    // Buscar TODOS os chefes para debug
    const { data: allBosses, error: allError } = await supabase
      .from('bosses')
      .select('id, name, phone, password')

    console.log('📋 Todos os chefes no banco:', allBosses)
    console.log('Erro ao buscar todos:', allError)

    // Buscar o chefe específico
    const { data: boss, error: bossError } = await supabase
      .from('bosses')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle()

    console.log('🎯 Chefe encontrado:', boss)
    console.log('Erro na busca:', bossError)

    if (bossError) {
      setError('Erro ao buscar chefe: ' + bossError.message)
      setLoading(false)
      return
    }

    if (!boss) {
      // Tentar buscar sem limpar o telefone
      const { data: bossRaw } = await supabase
        .from('bosses')
        .select('*')
        .eq('phone', phone)
        .maybeSingle()
      
      if (bossRaw) {
        console.log('✅ Encontrado com telefone original:', bossRaw)
        if (bossRaw.password === password) {
          localStorage.setItem('boss_id', bossRaw.id)
          localStorage.setItem('boss_name', bossRaw.name)
          localStorage.setItem('boss_phone', bossRaw.phone)
          router.push('/dashboard/chefe')
          setLoading(false)
          return
        } else {
          setError('Senha incorreta')
          setLoading(false)
          return
        }
      }
      
      setError(`Chefe não encontrado. Telefone "${cleanPhone}" não cadastrado. Chefes disponíveis: ${allBosses?.map(b => b.phone).join(', ')}`)
      setLoading(false)
      return
    }

    if (boss.password !== password) {
      setError('Senha incorreta')
      setLoading(false)
      return
    }

    // Buscar placa
    const { data: plate } = await supabase
      .from('plates')
      .select('*')
      .eq('boss_id', boss.id)
      .maybeSingle()

    localStorage.setItem('boss_id', boss.id)
    localStorage.setItem('boss_name', boss.name)
    localStorage.setItem('boss_phone', boss.phone)
    localStorage.setItem('boss_plate_id', plate?.id || '')
    localStorage.setItem('boss_plate_name', plate?.plate_number || '')

    router.push('/dashboard/chefe')
    setLoading(false)
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    backgroundPattern: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
      pointerEvents: 'none' as const
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '32px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      maxWidth: '450px',
      width: '100%',
      padding: isMobile ? '32px 24px' : '48px 40px',
      position: 'relative' as const,
      zIndex: 1
    },
    logoContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      marginBottom: '32px'
    },
    logoIcon: {
      width: isMobile ? '64px' : '80px',
      height: isMobile ? '64px' : '80px',
      background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
      borderRadius: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
      boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)'
    },
    title: {
      fontSize: isMobile ? '24px' : '28px',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '4px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      textAlign: 'center' as const
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px'
    },
    label: {
      fontSize: '13px',
      fontWeight: 600,
      color: '#374151',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    inputWrapper: {
      position: 'relative' as const
    },
    inputIcon: {
      position: 'absolute' as const,
      left: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af'
    },
    input: {
      width: '100%',
      padding: '14px 14px 14px 44px',
      border: '2px solid #e5e7eb',
      borderRadius: '16px',
      fontSize: isMobile ? '16px' : '15px',
      outline: 'none',
      transition: 'all 0.3s ease',
      backgroundColor: '#f9fafb'
    },
    passwordToggle: {
      position: 'absolute' as const,
      right: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      color: '#9ca3af',
      background: 'none',
      border: 'none',
      padding: '4px'
    },
    errorBox: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '14px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: '#dc2626',
      fontSize: '13px'
    },
    button: {
      width: '100%',
      background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
      color: 'white',
      padding: '14px',
      borderRadius: '16px',
      border: 'none',
      fontWeight: 'bold',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      transition: 'all 0.3s ease',
      marginTop: '8px'
    },
    footer: {
      marginTop: '24px',
      textAlign: 'center' as const,
      fontSize: '12px',
      color: '#9ca3af'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.backgroundPattern} />
      
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>
            <Shield size={isMobile ? 32 : 40} color="white" />
          </div>
          <h1 style={styles.title}>MeuPiloto!</h1>
          <p style={styles.subtitle}>Acesso para Chefes de Placa</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Phone size={14} /> Telefone
            </label>
            <div style={styles.inputWrapper}>
              <Phone size={18} style={styles.inputIcon} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  ...styles.input,
                  borderColor: error ? '#fecaca' : '#e5e7eb'
                }}
                placeholder="923456789"
                required
                onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                onBlur={(e) => e.currentTarget.style.borderColor = error ? '#fecaca' : '#e5e7eb'}
              />
            </div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              Digite o telefone exatamente como cadastrado
            </p>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Lock size={14} /> Senha
            </label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  ...styles.input,
                  borderColor: error ? '#fecaca' : '#e5e7eb'
                }}
                placeholder="••••••"
                required
                onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                onBlur={(e) => e.currentTarget.style.borderColor = error ? '#fecaca' : '#e5e7eb'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <>
                <div style={{ animation: 'spin 1s linear infinite', width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <p>Gerencie seus motoqueiros e corridas</p>
          <p style={{ marginTop: '8px' }}>
            <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Plataforma Segura
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus {
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4);
        }
        @media (max-width: 768px) {
          input, button {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}