// types/index.ts
export type Boss = {
  id: string
  name: string
  email: string
  phone: string
  password: string
  created_at: string
}

export type Plate = {
  id: string
  plate_number: string
  boss_id: string | null
  weekly_fee: number
  created_at: string
  is_active: boolean
  boss?: Boss
  riders?: Rider[]
}

export type Rider = {
  id: string
  name: string
  phone: string
  bi: string
  plate_id: string | null
  is_online: boolean
  status: string
  password_hash: string
  photo_url: string | null
  created_at: string
  current_location?: any
}

export type Order = {
  id: string
  rider_id: string | null
  plate_id: string | null
  customer_name: string
  customer_phone: string
  pickup_address: string
  dropoff_address: string
  status: 'pending' | 'accepted' | 'completed' | 'cancelled'
  price: number
  created_at: string
}