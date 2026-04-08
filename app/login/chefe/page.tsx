// app/login/chefe/page.tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Bike, Phone, Lock, AlertCircle, Shield } from 'lucide-react'

export default function BossLogin() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('Tentando login com:', { phone, password })

    // Buscar chefe pelo telefone
    const { data: boss, error } = await supabase
      .from('bosses')
      .select('*')
      .eq('phone', phone)
      .single()

    console.log('Resultado da busca:', { boss, error })

    if (error || !boss) {
      setError('Chefe não encontrado. Verifique o telefone.')
      setLoading(false)
      return
    }

    console.log('Senha digitada:', password)
    console.log('Senha no banco:', boss.password)

    if (boss.password === password) {
      // Buscar a placa do chefe
      const { data: plate } = await supabase
        .from('plates')
        .select('*')
        .eq('boss_id', boss.id)
        .single()

      localStorage.setItem('boss_id', boss.id)
      localStorage.setItem('boss_name', boss.name)
      localStorage.setItem('boss_phone', boss.phone)
      localStorage.setItem('boss_plate_id', plate?.id || '')
      localStorage.setItem('boss_plate_name', plate?.plate_number || '')
      
      router.push('/dashboard/chefe')
    } else {
      setError('Senha incorreta')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-amber-100 p-4 rounded-full mb-4">
            <Shield className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MeuPiloto!</h1>
          <p className="text-gray-600">Acesso Chefe de Placa</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="923456789"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="senha123"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        
      </div>
    </div>
  )
}