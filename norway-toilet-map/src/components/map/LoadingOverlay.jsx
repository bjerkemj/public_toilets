import React from 'react'

const LoadingOverlay = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <h3>🚽 Loading toilets...</h3>
        <p>Please wait while we load toilet locations</p>
        <div className="spinner" />
      </div>
    </div>
  )
}

export default LoadingOverlay