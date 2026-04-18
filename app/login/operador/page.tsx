// app/login/operador/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Shield, Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function OperadorLogin() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Limpar o telefone (remover espaços e caracteres especiais)
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
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #f9fafb 0%, #fff5ed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
    card: { backgroundColor: 'white', borderRadius: '32px', padding: '40px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: 'all 0.3s ease' },
    button: { width: '100%', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: 'all 0.3s ease' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(135deg, #d97706, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MeuPiloto!</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Área do Operador</p>
          <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>Acesse com seu telefone e senha</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>Telefone</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="923456789"
                required
                maxLength={9}
                style={styles.input}
                onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Digite apenas os 9 dígitos (ex: 923456789)</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={styles.input}
                onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '12px', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer' }}>
            ← Voltar para página inicial
          </button>
        </div>
      </div>
    </div>
  )
}