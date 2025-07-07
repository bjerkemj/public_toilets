import L from 'leaflet'

// -----------------------------------------------------------------------------
// Helper: build a custom cluster icon that changes colour & size with count
// -----------------------------------------------------------------------------
export const createClusterIcon = (count) => {
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
export const createToiletIcon = (toilet) => {
  const baseStyle = 'background:#3b82f6;border:2px solid white;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.3);font-size:12px;'
  
  let icon = '🚽' // Default toilet icon
  let backgroundColor = '#3b82f6' // Default blue
  
  // Hierarchy: handicap accessibility trumps everything
  if (toilet.wheelchair === 'yes') {
    icon = '♿'
    backgroundColor = '#bfdbfe' // Light blue for accessibility
  } 
  // If not handicap accessible, check if it's a pay toilet
  else if (toilet.fee === 'yes') {
    icon = '💰'
    backgroundColor = '#fde68a' // Light yellow for paid toilets
  }
  
  return L.divIcon({
    html: `<div style="${baseStyle}background:${backgroundColor};">${icon}</div>`,
    className: 'toilet-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}