// lib/notifications.ts
import { supabase } from './supabase/client'

// Função para criar notificação
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