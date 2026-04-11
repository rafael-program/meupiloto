// lib/notifications.ts
import { supabase } from './supabase/client'

// Função para criar notificação no banco
export async function createNotification(
  riderId: string,
  title: string,
  message: string,
  type: 'order' | 'payment' | 'alert' | 'info'
) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      rider_id: riderId,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar notificação:', error)
  }
  return data
}

// Função para buscar notificações não lidas
export async function getUnreadNotifications(riderId: string) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('rider_id', riderId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  return data || []
}

// Função para marcar como lida
export async function markAsRead(notificationId: string) {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
}

// ============================================
// FUNÇÕES DE NOTIFICAÇÃO PUSH
// ============================================

// Verificar se o navegador suporta notificações
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator
}

// Solicitar permissão para notificações push
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.log('Notificações não suportadas neste navegador')
    return false
  }

  // Se já está concedido
  if (Notification.permission === 'granted') {
    console.log('Permissão já concedida')
    return true
  }

  // Se está negado, não pedir novamente
  if (Notification.permission === 'denied') {
    console.log('Permissão negada pelo usuário')
    return false
  }

  // Solicitar permissão
  try {
    const permission = await Notification.requestPermission()
    const granted = permission === 'granted'
    
    if (granted) {
      console.log('Permissão concedida para notificações')
      // Registrar service worker após permissão
      await registerServiceWorker()
    } else {
      console.log('Permissão negada para notificações')
    }
    
    return granted
  } catch (error) {
    console.error('Erro ao solicitar permissão:', error)
    return false
  }
}

// Registrar Service Worker
export const registerServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker não suportado')
    return false
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registrado com sucesso:', registration)
    
    // Aguardar ativação
    await navigator.serviceWorker.ready
    console.log('Service Worker pronto')
    
    return true
  } catch (error) {
    console.error('Erro ao registrar Service Worker:', error)
    return false
  }
}

// Enviar notificação push imediata
export const sendPushNotification = (
  title: string,
  body: string,
  icon?: string,
  url?: string
): void => {
  if (!isNotificationSupported()) {
    console.log('Notificações não suportadas')
    return
  }

  if (Notification.permission !== 'granted') {
    console.log('Permissão não concedida')
    return
  }

  try {
    const notification = new Notification(title, {
      body: body,
      icon: icon || '/icon-192.png',
      badge: '/icon-192.png',
      silent: false,
      requireInteraction: true,
    })

    // Fechar automaticamente após 15 segundos
    setTimeout(() => notification.close(), 15000)

    // Abrir o app quando clicar na notificação
    notification.onclick = () => {
      window.focus()
      if (url) {
        window.location.href = url
      }
      notification.close()
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
  }
}

// Enviar notificação para novo pedido
export const notifyNewOrder = (
  customerName: string,
  price: number,
  orderId: string
): void => {
  sendPushNotification(
    '🏍️ Novo Pedido!',
    `${customerName || 'Cliente'} solicitou uma corrida de ${price.toLocaleString()} Kz`,
    '/icon-192.png',
    `/dashboard/motoqueiro?order=${orderId}`
  )
}

// Enviar notificação para pedido aceito
export const notifyOrderAccepted = (customerName: string): void => {
  sendPushNotification(
    '✅ Pedido Aceito!',
    `Você aceitou a corrida de ${customerName}`,
    '/icon-192.png',
    '/dashboard/motoqueiro'
  )
}

// Enviar notificação para status online/offline
export const notifyStatusChange = (isOnline: boolean): void => {
  sendPushNotification(
    isOnline ? '🟢 Online' : '🔴 Offline',
    isOnline 
      ? 'Você está online e disponível para receber pedidos'
      : 'Você está offline. Não receberá novos pedidos',
    '/icon-192.png',
    '/dashboard/motoqueiro'
  )
}

// Verificar status da permissão
export const getNotificationPermissionStatus = (): string => {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}