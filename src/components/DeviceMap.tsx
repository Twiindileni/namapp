'use client'

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
  const devicesWithLocation = devices.filter(
    (d) => d.incident_latitude != null && d.incident_longitude != null
  )

  if (devicesWithLocation.length === 0) {
    return (
      <div className="flex h-[280px] w-full items-center justify-center rounded-lg border-4 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <p className="text-lg text-gray-600">No devices with location data yet.</p>
          <p className="mt-2 text-sm text-gray-500">
            Devices will appear here when reported with a location.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 rounded-lg border-4 border-blue-300 bg-white p-4 shadow-lg">
      <h3 className="text-lg font-bold text-gray-900">Reported device locations</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {devicesWithLocation.map((device) => {
          const { incident_latitude: lat, incident_longitude: lng } = device
          const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`
          return (
            <div
              key={device.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <p className="font-semibold text-gray-900">{device.device_name}</p>
              <p className="text-sm text-gray-600">
                Status: <span className="font-medium text-red-600">{device.status.toUpperCase()}</span>
              </p>
              {device.incident_location && (
                <p className="mt-1 truncate text-sm text-gray-500">{device.incident_location}</p>
              )}
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                View on map →
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
