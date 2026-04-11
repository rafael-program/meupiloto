// components/NotificationButton.tsx
'use client'
import { useState, useEffect } from 'react'
import { Bell, BellRing, BellOff } from 'lucide-react'
import { requestNotificationPermission, isNotificationSupported, getNotificationPermissionStatus } from '@/lib/notifications'

export function NotificationButton() {
  const [permission, setPermission] = useState<string>('default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(getNotificationPermissionStatus())
    }
  }, [])

  const handleRequest = async () => {
    setLoading(true)
    const granted = await requestNotificationPermission()
    setPermission(granted ? 'granted' : 'denied')
    setLoading(false)
  }

  if (!isNotificationSupported()) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <BellOff className="w-4 h-4" />
        <span>Não suportado</span>
      </div>
    )
  }

  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
        <BellRing className="w-4 h-4" />
        <span>Notificações ativas</span>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-full">
        <BellOff className="w-4 h-4" />
        <span>Notificações bloqueadas</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleRequest}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition disabled:opacity-50"
    >
      <Bell className="w-4 h-4" />
      {loading ? 'Solicitando...' : 'Ativar Notificações'}
    </button>
  )
}