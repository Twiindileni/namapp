'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Device {
  id: string
  device_name: string
  incident_latitude: number | null
  incident_longitude: number | null
  incident_location: string | null
  status: string
}

interface DeviceMapProps {
  devices: Device[]
}

export default function DeviceMap({ devices }: DeviceMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const devicesWithLocation = devices.filter(d => d.incident_latitude && d.incident_longitude)

  if (!mounted) {
    return (
      <div className="w-full h-[500px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  // Center on Namibia by default, or first device location
  const center: [number, number] = devicesWithLocation.length > 0
    ? [devicesWithLocation[0].incident_latitude!, devicesWithLocation[0].incident_longitude!]
    : [-22.5609, 17.0658] // Windhoek, Namibia

  // Custom marker icons
  const lostIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  const stolenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  const getIcon = (status: string) => {
    if (status === 'stolen') return stolenIcon
    return lostIcon
  }

  if (devicesWithLocation.length === 0) {
    return (
      <div className="w-full h-[500px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center border-4 border-blue-200">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-gray-600 text-lg">No devices with location data yet</p>
          <p className="text-gray-500 text-sm mt-2">Devices will appear here when reported with location</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-2xl border-4 border-blue-300">
      <MapContainer
        center={center}
        zoom={devicesWithLocation.length > 0 ? 13 : 6}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {devicesWithLocation.map((device) => (
          <Marker
            key={device.id}
            position={[device.incident_latitude!, device.incident_longitude!]}
            icon={getIcon(device.status)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{device.device_name}</h3>
                <p className="text-sm text-gray-600">
                  Status: <span className="font-semibold text-red-600">{device.status.toUpperCase()}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{device.incident_location}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
