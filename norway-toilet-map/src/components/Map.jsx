import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './map/Map.css'
import L from 'leaflet'
import MapContent from './map/MapContent'
import MapStats from './map/MapStats'
import LoadingOverlay from './map/LoadingOverlay'

// -----------------------------------------------------------------------------
// Leaflet icon fix (ensures default marker icons load correctly)
// -----------------------------------------------------------------------------
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// -----------------------------------------------------------------------------
// Create a custom user location icon (Google Maps style)
// -----------------------------------------------------------------------------
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: #4285f4;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        position: relative;
        z-index: 1000;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function Map({ sidebarOpen, filters }) {
  const [toilets, setToilets] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(0)
  const [userLocation, setUserLocation] = useState(null)
  const [locationAccuracy, setLocationAccuracy] = useState(null)

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

  // ---------------------------------------------------------------------------
  // Get user's current location
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setUserLocation([latitude, longitude])
        setLocationAccuracy(accuracy)
      },
      (error) => {
        console.warn('Error getting user location:', error)
        setUserLocation([62.0, 10.0]) // fallback to Norway
        setLocationAccuracy(null)
      },
      { enableHighAccuracy: true }
    )
  }, [])

  // ---------------------------------------------------------------------------
  // Filter toilets based on current filters
  // ---------------------------------------------------------------------------
  const filteredToilets = useMemo(() => {
    if (!filters.freeOnly && !filters.wheelchairOnly) {
      return toilets
    }

    return toilets.filter(toilet => {
      if (filters.wheelchairOnly && toilet.wheelchair !== 'yes') {
        return false
      }

      if (filters.freeOnly && toilet.fee === 'yes') {
        return false
      }

      return true
    })
  }, [toilets, filters])

  // ---------------------------------------------------------------------------
  // Load toilet GeoJSON (or Overpass) once on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const loadToilets = async () => {
      try {
        const response = await fetch('/toilets.json')
        const data = await response.json()

        const processed = data.elements
          .map((toilet) => {
            let lat, lon

            if (toilet.type === 'node') {
              lat = toilet.lat
              lon = toilet.lon
            } else if (toilet.type === 'way' && toilet.geometry?.length) {
              const lats = toilet.geometry.map((p) => p.lat)
              const lons = toilet.geometry.map((p) => p.lon)
              lat = lats.reduce((sum, x) => sum + x, 0) / lats.length
              lon = lons.reduce((sum, x) => sum + x, 0) / lons.length
            } else if (toilet.bounds) {
              lat = (toilet.bounds.minlat + toilet.bounds.maxlat) / 2
              lon = (toilet.bounds.minlon + toilet.bounds.maxlon) / 2
            } else {
              return null
            }

            const access = toilet.tags?.access || 'unknown'
            if (access === 'no' || access === 'private') {
              return null
            }

            const numberOfToilets =
              toilet.type === 'node' ? 1 :
              (toilet.geometry?.length || 1)

            return {
              ...toilet,
              lat,
              lon,
              numberOfToilets,
              access,
              fee: toilet.tags?.fee || 'unknown',
              wheelchair: toilet.tags?.wheelchair || 'unknown',
              unisex: toilet.tags?.unisex || 'unknown',
              disposal: toilet.tags?.['toilets:disposal'] || 'unknown',
              building: toilet.tags?.building || 'unknown',
            }
          })
          .filter(Boolean)

        setToilets(processed)
      } catch (err) {
        console.error('Error loading toilet data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadToilets()
  }, [])

  // ---------------------------------------------------------------------------
  // Loading overlay
  // ---------------------------------------------------------------------------
  if (loading || !userLocation) {
    return (
      <div className={`map-container ${sidebarOpen ? 'map-with-sidebar' : ''}`}>
        <LoadingOverlay />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render the actual map
  // ---------------------------------------------------------------------------
  return (
    <div className={`map-container ${sidebarOpen ? 'map-with-sidebar' : ''}`}>
      <MapContainer
        center={userLocation}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
          attribution="© Mapbox © OpenStreetMap"
          tileSize={512}
          zoomOffset={-1}
        />

        <MapContent toilets={filteredToilets} onStatsUpdate={setVisibleCount} />

        {userLocation && (
          <>
            {/* Accuracy circle (if available) */}
            {locationAccuracy && locationAccuracy < 1000 && (
              <Circle
                center={userLocation}
                radius={locationAccuracy}
                pathOptions={{
                  color: '#4285f4',
                  fillColor: '#4285f4',
                  fillOpacity: 0.1,
                  weight: 1,
                  opacity: 0.3,
                }}
              />
            )}
            
            {/* User location marker */}
            <Marker 
              position={userLocation} 
              icon={createUserLocationIcon()}
              zIndexOffset={1000}
            >
              <Popup>
                <div>
                  <strong>Your Location</strong>
                  {locationAccuracy && (
                    <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                      Accuracy: ±{Math.round(locationAccuracy)}m
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      <MapStats 
        visibleCount={visibleCount} 
        totalCount={toilets.length} 
        filteredCount={filteredToilets.length}
      />
    </div>
  )
}

export default Map