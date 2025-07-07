import React from 'react'

const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const formatCurrency = (value) => {
  if (!value) return ''
  return value.toLowerCase().includes('nok')
    ? value.replace(/nok/gi, 'NOK')
    : capitalize(value)
}

const ToiletPopup = ({ toilet }) => {
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

        {toilet.access !== 'unknown' && (
          <p>
            <strong>Access:</strong> {capitalize(toilet.access)}
          </p>
        )}

        {toilet.fee !== 'unknown' && (
          <p>
            <strong>Fee:</strong> {formatCurrency(toilet.fee)}
          </p>
        )}

        {toilet.wheelchair !== 'unknown' && (
          <p>
            <strong>Wheelchair:</strong> {capitalize(toilet.wheelchair)}
          </p>
        )}

        {toilet.changing_table && (
          <p>
            <strong>Changing Table:</strong> {capitalize(toilet.changing_table)}
          </p>
        )}

        {toilet.numberOfToilets > 1 && (
          <p>
            <strong>Cubicles:</strong> {toilet.numberOfToilets}
          </p>
        )}

        {toilet.unisex !== 'unknown' && (
          <p>
            <strong>Unisex:</strong> {capitalize(toilet.unisex)}
          </p>
        )}

        {tags.opening_hours && (
          <p>
            <strong>Opening Hours:</strong> {tags.opening_hours}
          </p>
        )}

        {tags.operator && (
          <p>
            <strong>Operator:</strong> {capitalize(tags.operator)}
          </p>
        )}

        {tags.charge && (
          <p>
            <strong>Charge:</strong> {formatCurrency(tags.charge)}
          </p>
        )}

        {tags.description && (
          <p>
            <strong>Description:</strong> {tags.description}
          </p>
        )}

        {tags.note && (
          <p>
            <strong>Note:</strong> {capitalize(tags.note)}
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
          <button
            className="directions-button"
            onClick={openDirections}
            title="Get directions to this toilet"
          >
            🧭 Get Directions
          </button>
        </div>
      </div>
    </div>
  )
}

export default ToiletPopup
