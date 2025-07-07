import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
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

function Map({ sidebarOpen, filters }) {
  const [toilets, setToilets] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(0)
  

  // Mapbox tiles (token should ideally come from env var)
  const MAPBOX_TOKEN =
    'pk.eyJ1IjoiYmplcmtlbWoiLCJhIjoiY21jb3l0dTM2MDBzYTJqczNuaGo4MnZtZiJ9.5oTDUr--6G1X5uaiXyfdSg'

  // ---------------------------------------------------------------------------
  // Filter toilets based on current filters
  // ---------------------------------------------------------------------------
  const filteredToilets = useMemo(() => {
    if (!filters.freeOnly && !filters.wheelchairOnly) {
      return toilets
    }

    return toilets.filter(toilet => {
      // If wheelchairOnly is enabled, only show wheelchair accessible toilets
      if (filters.wheelchairOnly && toilet.wheelchair !== 'yes') {
        return false
      }

      // If freeOnly is enabled, only show free toilets
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

            // Final count logic:
            const numberOfToilets =
              toilet.type === 'node' ? 1 :
              (toilet.geometry?.length || 1)

            return {
              ...toilet,
              lat,
              lon,
              numberOfToilets, // new field based on geometry count
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
  if (loading) {
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
        center={[62.0, 10.0]} // Centre on Norway
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
          attribution="© Mapbox © OpenStreetMap"
          tileSize={512}
          zoomOffset={-1}
        />

        {/* Toilets & clusters - now using filtered toilets */}
        <MapContent toilets={filteredToilets} onStatsUpdate={setVisibleCount} />
      </MapContainer>

      {/* Floating stats bar */}
      <MapStats 
        visibleCount={visibleCount} 
        totalCount={toilets.length} 
        filteredCount={filteredToilets.length}
      />
    </div>
  )
}

export default Map