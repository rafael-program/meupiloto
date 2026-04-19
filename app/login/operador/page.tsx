// app/login/operador/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Shield, Phone, Lock, Eye, EyeOff, AlertCircle, ArrowRight, UserCheck, Headset } from 'lucide-react'

export default function OperadorLogin() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cleanPhone = phone.replace(/\D/g, '')

    const { data, error: loginError } = await supabase
      .from('operadores')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('password', password)
      .eq('is_active', true)
      .single()

    if (loginError || !data) {
      setError('Telefone ou senha inválidos, ou operador inativo')
      setLoading(false)
    } else {
      localStorage.setItem('operador_id', data.id)
      localStorage.setItem('operador_name', data.name)
      localStorage.setItem('operador_phone', data.phone)
      localStorage.setItem('operador_email', data.email || '')
      router.push('/dashboard/operador')
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 9) return numbers
    return numbers.slice(0, 9)
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
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
      backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)',
      pointerEvents: 'none' as const
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '32px',
      padding: isMobile ? '32px 24px' : '40px',
      maxWidth: '450px',
      width: '100%',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      position: 'relative' as const,
      zIndex: 1,
      transition: 'transform 0.3s ease'
    },
    logoContainer: {
      textAlign: 'center' as const,
      marginBottom: '32px'
    },
    logoIcon: {
      width: isMobile ? '64px' : '80px',
      height: isMobile ? '64px' : '80px',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      borderRadius: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
      boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
    },
    title: {
      fontSize: isMobile ? '24px' : '28px',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '4px'
    },
    subtitle: {
      color: '#6b7280',
      marginTop: '8px',
      fontSize: '14px'
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: '#f3e8ff',
      color: '#8b5cf6',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      marginTop: '8px'
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
      display: 'block',
      fontSize: '13px',
      fontWeight: 600,
      color: '#374151',
      marginBottom: '0'
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
    hint: {
      fontSize: '11px',
      color: '#9ca3af',
      marginTop: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
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
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
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
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
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
      paddingTop: '24px',
      borderTop: '1px solid #f0f0f0'
    },
    backButton: {
      background: 'none',
      border: 'none',
      color: '#6b7280',
      fontSize: '13px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      margin: '0 auto',
      transition: 'all 0.3s ease'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.backgroundPattern} />
      
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>
            <Headset size={isMobile ? 32 : 40} color="white" />
          </div>
          <h1 style={styles.title}>MeuPiloto!</h1>
          <p style={styles.subtitle}>Área do Operador</p>
          <div style={styles.badge}>
            <UserCheck size={12} />
            Controle de Pedidos
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Telefone</label>
            <div style={styles.inputWrapper}>
              <Phone size={18} style={styles.inputIcon} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="923456789"
                required
                maxLength={9}
                style={{
                  ...styles.input,
                  borderColor: error ? '#fecaca' : '#e5e7eb'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.currentTarget.style.borderColor = error ? '#fecaca' : '#e5e7eb'}
              />
            </div>
            <div style={styles.hint}>
              <Shield size={10} />
              Digite apenas os 9 dígitos (ex: 923456789)
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  ...styles.input,
                  paddingRight: '44px',
                  borderColor: error ? '#fecaca' : '#e5e7eb'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
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
                Acessar Sistema
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <button onClick={() => router.push('/')} style={styles.backButton}>
            ← Voltar para página inicial
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus {
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
        }
        .back-button:hover {
          transform: translateX(-4px);
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