// src/components/Map.jsx
import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import Supercluster from 'supercluster'
import 'leaflet/dist/leaflet.css'
import './Map.css'
import L from 'leaflet'

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
// Helper: build a custom cluster icon that changes colour & size with count
// -----------------------------------------------------------------------------
const createClusterIcon = (count) => {
  let size = 'small'
  let color = '#60a5fa' // Light blue

  if (count >= 100) {
    size = 'large'
    color = '#1d4ed8' // Dark blue
  } else if (count >= 10) {
    size = 'medium'
    color = '#3b82f6' // Medium blue
  }

  return L.divIcon({
    html: `<div class="cluster-icon cluster-${size}" style="background-color: ${color}"><span>${count}</span></div>`,
    className: 'custom-cluster',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

// -----------------------------------------------------------------------------
// Helper: Create toilet icon based on hierarchy (handicap > pay > regular)
// -----------------------------------------------------------------------------
const createToiletIcon = (toilet) => {
  const baseStyle = 'background:#3b82f6;border:2px solid white;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.3);font-size:12px;'
  
  let icon = '🚽' // Default toilet icon
  let backgroundColor = '#3b82f6' // Default blue
  
  // Hierarchy: handicap accessibility trumps everything
  if (toilet.wheelchair === 'yes') {
    icon = '♿'
    backgroundColor = '#059669' // Green for accessibility
  } 
  // If not handicap accessible, check if it's a pay toilet
  else if (toilet.fee === 'yes') {
    icon = '💰'
    backgroundColor = '#dc2626' // Red for paid toilets
  }
  
  return L.divIcon({
    html: `<div style="${baseStyle}background:${backgroundColor};">${icon}</div>`,
    className: 'toilet-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// -----------------------------------------------------------------------------
// Component: MapContent – Handles clustering & map events
// -----------------------------------------------------------------------------
function MapContent({ toilets, onStatsUpdate }) {
  const [clusters, setClusters] = useState([])
  const [supercluster, setSupercluster] = useState(null)

  // Map events – we register handlers, but the real work happens in updateClusters
  const map = useMapEvents({
    moveend: () => updateClusters(),
    zoomend: () => updateClusters(),
  })

  // ---------------------------------------------------------------------------
  // Memoised callback: calculates visible clusters & updates stats overlay
  // ---------------------------------------------------------------------------
  const updateClusters = useCallback(() => {
    if (!supercluster || !map) return

    const bounds = map.getBounds()
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]

    const zoom = Math.floor(map.getZoom())
    const newClusters = supercluster.getClusters(bbox, zoom)
    setClusters(newClusters)

    // Notify parent of visible toilet count
    if (onStatsUpdate) {
      const visibleCount = newClusters.reduce((total, cluster) => {
        return total + (cluster.properties.cluster ? cluster.properties.point_count : 1)
      }, 0)
      onStatsUpdate(visibleCount)
    }
  }, [supercluster, map, onStatsUpdate])

  // ---------------------------------------------------------------------------
  // Effect: rebuild supercluster index whenever toilet data changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (toilets.length === 0) {
      setSupercluster(null)
      setClusters([])
      return
    }

    const cluster = new Supercluster({ radius: 80, maxZoom: 16, minZoom: 0 })

    // Convert each toilet into a GeoJSON point feature
    const points = toilets.map((toilet) => ({
      type: 'Feature',
      properties: {
        cluster: false,
        toiletId: `${toilet.type}-${toilet.id}`,
        toilet,
      },
      geometry: {
        type: 'Point',
        coordinates: [toilet.lon, toilet.lat],
      },
    }))

    cluster.load(points)
    setSupercluster(cluster)
  }, [toilets])

  // ---------------------------------------------------------------------------
  // Effect: recalculate clusters whenever supercluster or map changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    updateClusters()
  }, [supercluster, map, updateClusters])

  // ---------------------------------------------------------------------------
  // Helper: builds React popup content for a single toilet
  // ---------------------------------------------------------------------------
  const createPopupContent = (toilet) => {
    const tags = toilet.tags || {}

    const openDirections = () => {
      const destination = `${toilet.lat},${toilet.lon}`
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`
      window.open(googleMapsUrl, '_blank')
    }

    return (
      <div className="custom-popup">
        <h3>🚽 Public Toilet</h3>
        <div className="popup-info">
          <p>
            <strong>Type:</strong> {toilet.type}
          </p>
          {toilet.access !== 'unknown' && (
            <p>
              <strong>Access:</strong>{' '}
              <span className={`access-${toilet.access}`}>{toilet.access}</span>
            </p>
          )}
          {toilet.fee !== 'unknown' && (
            <p>
              <strong>Fee:</strong>{' '}
              <span className={toilet.fee === 'no' ? 'fee-free' : 'fee-paid'}>{toilet.fee}</span>
            </p>
          )}
          {toilet.wheelchair !== 'unknown' && (
            <p>
              <strong>Wheelchair:</strong>{' '}
              <span className={toilet.wheelchair === 'yes' ? 'accessible-yes' : 'accessible-no'}>
                {toilet.wheelchair}
              </span>
            </p>
          )}
          {toilet.unisex !== 'unknown' && (
            <p>
              <strong>Unisex:</strong> {toilet.unisex}
            </p>
          )}
          {toilet.disposal !== 'unknown' && (
            <p>
              <strong>Type:</strong> {toilet.disposal}
            </p>
          )}
          {tags.image && (
            <p>
              <a href={tags.image} target="_blank" rel="noopener noreferrer">
                📸 View Image
              </a>
            </p>
          )}
          <p className="coordinates">
            <strong>Location:</strong> {toilet.lat.toFixed(4)}, {toilet.lon.toFixed(4)}
          </p>

          <div className="popup-actions">
            <button className="directions-button" onClick={openDirections} title="Get directions to this toilet">
              🧭 Get Directions
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render clusters & individual toilet markers
  // ---------------------------------------------------------------------------
  return (
    <>
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates
        const { cluster: isCluster, point_count: pointCount } = cluster.properties

        // --- Cluster marker ---------------------------------------------------
        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[latitude, longitude]}
              icon={createClusterIcon(pointCount)}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 16)
                  map.setView([latitude, longitude], expansionZoom)
                },
              }}
            >
              <Popup>
                <div className="cluster-popup">
                  <h3>🚽 Toilet Cluster</h3>
                  <p>
                    <strong>{pointCount}</strong> toilets in this area
                  </p>
                  <p>Click to zoom in and see individual toilets</p>
                </div>
              </Popup>
            </Marker>
          )
        }

        // --- Single toilet marker -------------------------------------------
        return (
          <Marker 
            key={cluster.properties.toiletId} 
            position={[latitude, longitude]} 
            icon={createToiletIcon(cluster.properties.toilet)}
          >
            <Popup>{createPopupContent(cluster.properties.toilet)}</Popup>
          </Marker>
        )
      })}
    </>
  )
}

// -----------------------------------------------------------------------------
// Top-level Map component – fetches data & renders MapContainer
// -----------------------------------------------------------------------------
function Map({ sidebarOpen }) {
  const [toilets, setToilets] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(0)

  // Mapbox tiles (token should ideally come from env var)
  const MAPBOX_TOKEN =
    'pk.eyJ1IjoiYmplcmtlbWoiLCJhIjoiY21jb3l0dTM2MDBzYTJqczNuaGo4MnZtZiJ9.5oTDUr--6G1X5uaiXyfdSg'

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
              return null // skip if no coords
            }

            const access = toilet.tags?.access || 'unknown'
            
            // Skip toilets that are not publicly accessible
            if (access === 'no' || access === 'private') {
              return null
            }

            return {
              ...toilet,
              lat,
              lon,
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
        <div className="loading-overlay">
          <div className="loading-spinner">
            <h3>🚽 Loading toilets...</h3>
            <p>Please wait while we load toilet locations</p>
            <div className="spinner" />
          </div>
        </div>
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

        {/* Toilets & clusters */}
        <MapContent toilets={toilets} onStatsUpdate={setVisibleCount} />
      </MapContainer>

      {/* Floating stats bar */}
      <div className="map-stats">
        <div className="stat-item">
          <span className="stat-label">Visible:</span>
          <span className="stat-value">{visibleCount.toLocaleString()}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{toilets.length.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export default Map