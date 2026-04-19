// app/login/admin/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, AlertCircle, Users, Bike, ArrowRight, Eye, EyeOff, Crown, Settings } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
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

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !admin) {
      setError('Admin não encontrado')
      setLoading(false)
      return
    }

    if (admin.password === password) {
      localStorage.setItem('admin_id', admin.id)
      localStorage.setItem('admin_name', admin.name)
      localStorage.setItem('admin_email', admin.email)
      router.push('/dashboard/admin')
    } else {
      setError('Senha incorreta')
    }
    setLoading(false)
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)',
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
      backgroundImage: `
        radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)
      `,
      pointerEvents: 'none' as const
    },
    glowEffect: {
      position: 'absolute' as const,
      top: '20%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '300px',
      height: '300px',
      background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
      borderRadius: '50%',
      pointerEvents: 'none' as const
    },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(10px)',
      borderRadius: '32px',
      padding: isMobile ? '32px 24px' : '40px',
      maxWidth: '450px',
      width: '100%',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      position: 'relative' as const,
      zIndex: 1,
      transition: 'transform 0.3s ease',
      border: '1px solid rgba(255,255,255,0.1)'
    },
    logoContainer: {
      textAlign: 'center' as const,
      marginBottom: '32px'
    },
    logoIcon: {
      width: isMobile ? '70px' : '85px',
      height: isMobile ? '70px' : '85px',
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      borderRadius: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255,255,255,0.1)'
    },
    crownIcon: {
      position: 'absolute' as const,
      top: '-8px',
      right: '-8px',
      backgroundColor: '#f59e0b',
      borderRadius: '50%',
      padding: '6px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    },
    title: {
      fontSize: isMobile ? '26px' : '32px',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #1e293b, #334155)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '4px'
    },
    subtitle: {
      color: '#64748b',
      marginTop: '8px',
      fontSize: '14px'
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: '#f1f5f9',
      color: '#475569',
      padding: '4px 14px',
      borderRadius: '20px',
      fontSize: '12px',
      marginTop: '10px'
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
      color: '#334155',
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
      color: '#94a3b8'
    },
    input: {
      width: '100%',
      padding: '14px 14px 14px 44px',
      border: '2px solid #e2e8f0',
      borderRadius: '16px',
      fontSize: isMobile ? '16px' : '15px',
      outline: 'none',
      transition: 'all 0.3s ease',
      backgroundColor: '#f8fafc'
    },
    passwordToggle: {
      position: 'absolute' as const,
      right: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      color: '#94a3b8',
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
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
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
      marginTop: '28px',
      textAlign: 'center' as const,
      paddingTop: '20px',
      borderTop: '1px solid #e2e8f0'
    },
    backButton: {
      background: 'none',
      border: 'none',
      color: '#64748b',
      fontSize: '13px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      margin: '0 auto',
      transition: 'all 0.3s ease'
    },
    infoText: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '12px',
      fontSize: '11px',
      color: '#94a3b8'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.backgroundPattern} />
      <div style={styles.glowEffect} />
      
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={styles.logoIcon}>
              <Shield size={isMobile ? 34 : 42} color="#f59e0b" />
            </div>
            <div style={styles.crownIcon}>
              <Crown size={16} color="white" />
            </div>
          </div>
          <h1 style={styles.title}>MeuPiloto!</h1>
          <p style={styles.subtitle}>Painel Administrativo</p>
          <div style={styles.badge}>
            <Settings size={12} />
            Controle Total
          </div>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@meupiloto.com"
                required
                style={{
                  ...styles.input,
                  borderColor: error ? '#fecaca' : '#e2e8f0'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                onBlur={(e) => e.currentTarget.style.borderColor = error ? '#fecaca' : '#e2e8f0'}
              />
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
                  borderColor: error ? '#fecaca' : '#e2e8f0'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                onBlur={(e) => e.currentTarget.style.borderColor = error ? '#fecaca' : '#e2e8f0'}
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
                Acessar Dashboard
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <button onClick={() => router.push('/')} style={styles.backButton}>
            ← Voltar para página inicial
          </button>
          <div style={styles.infoText}>
            <Users size={12} />
            <span>Gestão completa da plataforma</span>
            <Bike size={12} />
          </div>
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
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
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