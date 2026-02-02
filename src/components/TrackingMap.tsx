'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FaMobileAlt, FaExclamationTriangle } from 'react-icons/fa'
import { renderToStaticMarkup } from 'react-dom/server'

// Fix for default Leaflet icons in Next.js
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
    last_updated?: string
}

interface TrackingMapProps {
    devices: Device[]
}

const createCustomIcon = (status: string) => {
    const color = status === 'lost' || status === 'stolen' ? '#ef4444' : '#3b82f6'
    const iconMarkup = renderToStaticMarkup(
        <div style={{ color: color, fontSize: '24px', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' }}>
            {status === 'lost' || status === 'stolen' ? <FaExclamationTriangle /> : <FaMobileAlt />}
        </div>
    )

    return L.divIcon({
        html: iconMarkup,
        className: 'custom-marker-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    })
}

function MapUpdater({ devices }: { devices: Device[] }) {
    const map = useMap()
    const boundsRef = useRef<L.LatLngBounds | null>(null)

    useEffect(() => {
        if (devices.length > 0) {
            const bounds = L.latLngBounds(
                devices.map(d => [d.incident_latitude!, d.incident_longitude!])
            )

            // Only fit bounds if they differ significantly or on first load
            if (!boundsRef.current || !boundsRef.current.equals(bounds)) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
                boundsRef.current = bounds
            }
        }
    }, [devices, map])

    return null
}

export default function TrackingMap({ devices }: TrackingMapProps) {
    // Default center (Windhoek, Namibia)
    const defaultCenter: [number, number] = [-22.5609, 17.0658]

    const activeDevices = devices.filter(
        d => d.incident_latitude !== null && d.incident_longitude !== null
    )

    return (
        <div className="h-full w-full relative z-0">
            <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapUpdater devices={activeDevices} />

                {activeDevices.map((device) => (
                    <Marker
                        key={device.id}
                        position={[device.incident_latitude!, device.incident_longitude!]}
                        icon={createCustomIcon(device.status)}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <h3 className="font-bold text-lg mb-1">{device.device_name}</h3>
                                <div className="space-y-1 text-sm">
                                    <p>
                                        <span className="font-semibold text-gray-600">Status:</span>{' '}
                                        <span className={`font-bold ${device.status === 'lost' || device.status === 'stolen'
                                                ? 'text-red-600'
                                                : 'text-blue-600'
                                            }`}>
                                            {device.status.toUpperCase()}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="font-semibold text-gray-600">Location:</span><br />
                                        {device.incident_location}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Lat: {device.incident_latitude?.toFixed(6)}<br />
                                        Lng: {device.incident_longitude?.toFixed(6)}
                                    </p>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${device.incident_latitude},${device.incident_longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block mt-2 text-center bg-blue-600 text-white py-1.5 rounded hover:bg-blue-700 transition font-semibold text-xs"
                                    >
                                        Open in Google Maps
                                    </a>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}
