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
    const isCrisis = status === 'lost' || status === 'stolen'
    const color = isCrisis ? '#ff4d4d' : '#1a72f0'
    const ringColor = isCrisis ? 'rgba(255, 77, 77, 0.4)' : 'rgba(26, 114, 240, 0.4)'
    
    const iconMarkup = renderToStaticMarkup(
        <div className="relative flex items-center justify-center">
            {/* Pulsing Ring */}
            <div className={`absolute w-10 h-10 rounded-full animate-ping`} style={{ backgroundColor: ringColor }} />
            <div className="relative z-10 w-8 h-8 rounded-full bg-[#020b1a] border-2 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{ borderColor: color }}>
                <div style={{ color: color, fontSize: '14px' }}>
                    {isCrisis ? <FaExclamationTriangle /> : <FaMobileAlt />}
                </div>
            </div>
        </div>
    )

    return L.divIcon({
        html: iconMarkup,
        className: 'custom-signal-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    })
}

function MapUpdater({ devices }: { devices: Device[] }) {
    const map = useMap()
    const boundsRef = useRef<L.LatLngBounds | null>(null)

    useEffect(() => {
        if (devices.length > 0) {
            const validPoints = devices.filter(d => d.incident_latitude && d.incident_longitude)
            if (validPoints.length > 0) {
                const bounds = L.latLngBounds(
                    validPoints.map(d => [d.incident_latitude!, d.incident_longitude!])
                )

                if (!boundsRef.current || !boundsRef.current.equals(bounds)) {
                    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 })
                    boundsRef.current = bounds
                }
            }
        }
    }, [devices, map])

    return null
}

export default function TrackingMap({ devices }: TrackingMapProps) {
    const defaultCenter: [number, number] = [-22.5609, 17.0658]

    const activeDevices = devices.filter(
        d => d.incident_latitude !== null && d.incident_longitude !== null
    )

    return (
        <div className="h-full w-full relative z-0 bg-[#020b1a]">
            <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ height: '100%', width: '100%', background: '#020b1a' }}
                scrollWheelZoom={true}
                className="z-0"
            >
                {/* Dark Matter Tiles for Technological Look */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <MapUpdater devices={activeDevices} />

                {activeDevices.map((device) => (
                    <Marker
                        key={device.id}
                        position={[device.incident_latitude!, device.incident_longitude!]}
                        icon={createCustomIcon(device.status)}
                    >
                        <Popup className="tech-popup">
                            <div className="p-3 min-w-[220px] bg-[#020b1a] text-white">
                                <div className="flex items-center gap-2 mb-3">
                                   <div className={`w-2 h-2 rounded-full animate-pulse ${device.status === 'lost' || device.status === 'stolen' ? 'bg-red-500' : 'bg-[#1a72f0]'}`} />
                                   <h3 className="font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{device.device_name}</h3>
                                </div>
                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between border-b border-[rgba(0,85,204,0.1)] pb-1.5">
                                        <span className="text-[#4a6a90] uppercase tracking-widest font-bold">Signal Status</span>
                                        <span className={`font-extrabold uppercase ${device.status === 'lost' || device.status === 'stolen'
                                                ? 'text-red-400'
                                                : 'text-[#5a9ef5]'
                                            }`}>
                                            {device.status}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[#4a6a90] uppercase tracking-widest font-bold block">Current Telemetry</span>
                                        <p className="text-[#8baed4] leading-relaxed italic">{device.incident_location || 'Receiving location data...'}</p>
                                    </div>
                                    <div className="pt-2">
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${device.incident_latitude},${device.incident_longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-primary !py-2 !text-[10px] w-full justify-center !rounded-md"
                                        >
                                            Export to Nav Engine
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}
