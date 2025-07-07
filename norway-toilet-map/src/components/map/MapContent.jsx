import { useState, useEffect, useCallback } from 'react'
import { Marker, Popup, useMapEvents } from 'react-leaflet'
import Supercluster from 'supercluster'
import { createClusterIcon, createToiletIcon } from './MapIcons'
import ToiletPopup from './ToiletPopup'

function MapContent({ toilets, onStatsUpdate }) {
  const [clusters, setClusters] = useState([])
  const [supercluster, setSupercluster] = useState(null)

  const map = useMapEvents({
    moveend: () => updateClusters(),
    zoomend: () => updateClusters(),
  })

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

    if (onStatsUpdate) {
      const visibleCount = newClusters.reduce((total, cluster) => {
        return total + (cluster.properties.cluster ? cluster.properties.point_count : 1)
      }, 0)
      onStatsUpdate(visibleCount)
    }
  }, [supercluster, map, onStatsUpdate])

  useEffect(() => {
    if (toilets.length === 0) {
      setSupercluster(null)
      setClusters([])
      return
    }

    const cluster = new Supercluster({ radius: 80, maxZoom: 16, minZoom: 0 })

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

  useEffect(() => {
    updateClusters()
  }, [supercluster, map, updateClusters])

  return (
    <>
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates
        const { cluster: isCluster, point_count: pointCount } = cluster.properties

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
            />
          )
        }

        return (
          <Marker 
            key={cluster.properties.toiletId} 
            position={[latitude, longitude]} 
            icon={createToiletIcon(cluster.properties.toilet)}
          >
            <Popup>
              <ToiletPopup toilet={cluster.properties.toilet} />
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

export default MapContent
