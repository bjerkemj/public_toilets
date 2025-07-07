import React from 'react'

const MapStats = ({ visibleCount, totalCount }) => {
  return (
    <div className="map-stats">
      <div className="stat-item">
        <span className="stat-label">Visible:</span>
        <span className="stat-value">{visibleCount.toLocaleString()}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Total:</span>
        <span className="stat-value">{totalCount.toLocaleString()}</span>
      </div>
    </div>
  )
}

export default MapStats