'use client'

import { useState } from 'react'

interface MapPickerProps {
  onLocationSelect: (lat: number | null, lng: number | null, address: string) => void
  initialLat?: number
  initialLng?: number
}

export default function MapPicker({ onLocationSelect }: MapPickerProps) {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>('')

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Geolocation is not supported by your browser.')
      return
    }
    setLoading(true)
    setStatus('Getting your location...')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          )
          const data = await res.json()
          const addr = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          setAddress(addr)
          onLocationSelect(lat, lng, addr)
          setStatus('Location set successfully.')
        } catch {
          onLocationSelect(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
          setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
          setStatus('Location set (coordinates only).')
        }
        setLoading(false)
      },
      (err) => {
        setStatus('Could not get location. Please enter it manually.')
        setLoading(false)
      }
    )
  }

  const handleSubmitAddress = () => {
    if (!address.trim()) {
      setStatus('Please enter a location or use "Use my location".')
      return
    }
    setLoading(true)
    setStatus('Looking up coordinates...')
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data[0]) {
          const lat = parseFloat(data[0].lat)
          const lng = parseFloat(data[0].lon)
          onLocationSelect(lat, lng, address.trim())
          setStatus('Location set.')
        } else {
          setStatus('Address not found. Saving as text only.')
          onLocationSelect(null, null, address.trim())
        }
        setLoading(false)
      })
      .catch(() => {
        setStatus('Lookup failed. Saving as text only.')
        onLocationSelect(null, null, address.trim())
        setLoading(false)
      })
  }

  return (
    <div className="w-full rounded-lg border-2 border-blue-200 bg-white p-4 shadow-lg">
      <p className="mb-3 text-sm text-blue-600">
        Use your current location or enter an address below.
      </p>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Please wait...' : 'Use my current location'}
        </button>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Or type address, e.g. City Mall, Windhoek"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSubmitAddress}
            disabled={loading}
            className="rounded-lg bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Set
          </button>
        </div>
        {status && (
          <p className="text-sm text-gray-600">{status}</p>
        )}
      </div>
    </div>
  )
}
