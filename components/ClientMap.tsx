'use client'

import dynamic from 'next/dynamic'

// Importar componentes do mapa dinamicamente
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

// Configurar ícones do Leaflet
if (typeof window !== 'undefined') {
  const L = require('leaflet')
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

interface ClientMapProps {
  center: { lat: number; lng: number }
  zoom?: number
  customerLocation?: { lat: number; lng: number } | null
  riderLocation?: { lat: number; lng: number } | null
  riderName?: string
}

export default function ClientMap({ 
  center, 
  zoom = 13, 
  customerLocation, 
  riderLocation, 
  riderName 
}: ClientMapProps) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {customerLocation && (
        <Marker position={[customerLocation.lat, customerLocation.lng]}>
          <Popup>📍 Sua Localização</Popup>
        </Marker>
      )}
      {riderLocation && (
        <Marker position={[riderLocation.lat, riderLocation.lng]}>
          <Popup>🏍️ {riderName || 'Motoqueiro'}</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}