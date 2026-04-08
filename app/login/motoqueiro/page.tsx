// app/login/motoqueiro/page.tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Bike, Phone, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function RiderLogin() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!phone || !password) {
      setError('Preencha todos os campos')
      setLoading(false)
      return
    }

    console.log('Tentando login com:', phone)

    const { data: rider, error } = await supabase
      .from('riders')
      .select('*, plate:plates(plate_number)')
      .eq('phone', phone)
      .single()

    if (error || !rider) {
      console.error('Erro:', error)
      setError('Motoqueiro não encontrado. Verifique o telefone.')
      setLoading(false)
      return
    }

    console.log('Motoqueiro encontrado:', rider.name)

    if (rider.password_hash === password) {
      localStorage.setItem('rider_id', rider.id)
      localStorage.setItem('rider_name', rider.name)
      localStorage.setItem('rider_phone', rider.phone)
      localStorage.setItem('rider_plate_id', rider.plate_id || '')
      localStorage.setItem('rider_plate_name', rider.plate?.plate_number || '')
      
      console.log('Login bem sucedido, redirecionando...')
      router.push('/dashboard/motoqueiro')
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
            <Bike className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MeuPiloto!</h1>
          <p className="text-gray-600">Acesso Motoqueiro</p>
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
                placeholder="923456001"
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="senha123"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
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
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

       
      </div>
    </div>
  )
}