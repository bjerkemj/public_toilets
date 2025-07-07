import { useState } from 'react'
import './Sidebar.css'

function Sidebar({ isOpen, onToggle, onFilterChange }) {
  const [activeSection, setActiveSection] = useState('filters')
  const [freeOnly, setFreeOnly] = useState(false)
  const [wheelchairOnly, setWheelchairOnly] = useState(false)

  const toggleFree = () => {
    const newFree = !freeOnly
    setFreeOnly(newFree)
    onFilterChange({ freeOnly: newFree, wheelchairOnly })
  }

  const toggleWheelchair = () => {
    const newWheelchair = !wheelchairOnly
    setWheelchairOnly(newWheelchair)
    onFilterChange({ freeOnly, wheelchairOnly: newWheelchair })
  }

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${activeSection === 'filters' ? 'active' : ''}`}
              onClick={() => setActiveSection('filters')}
            >
              🔍 Filters
            </button>
            <button 
              className={`nav-item ${activeSection === 'about' ? 'active' : ''}`}
              onClick={() => setActiveSection('about')}
            >
              ℹ️ About
            </button>
          </nav>

          <div className="sidebar-section">
            {activeSection === 'filters' && (
              <div className="section-content">
                <h3>Filter Toilets</h3>
                <div className="filter-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={freeOnly} onChange={toggleFree} />
                    <span style={{ color: '#333' }}>Free Access</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={wheelchairOnly} onChange={toggleWheelchair} />
                    <span style={{ color: '#333' }}>Wheelchair Accessible</span>
                  </label>
                </div>
              </div>
            )}

            {activeSection === 'about' && (
              <div className="section-content">
                <h3>About This Map</h3>
                <p>Norway's most comprehensive toilet finder with over 3,300 locations.</p>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">3.3K+</div>
                    <div className="stat-label">Locations</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">108</div>
                    <div className="stat-label">Cities</div>
                  </div>
                </div>
                
                <div className="data-source-section">
                  <h4>Data Source</h4>
                  <p>All toilet location data is sourced from OpenStreetMap, the collaborative mapping project.</p>
                  <div className="attribution">
                    <span>© OpenStreetMap contributors</span>
                  </div>
                  <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer" className="about-link">
                    Visit OpenStreetMap
                  </a>
                </div>

                <div className="disclaimer-section">
                  <h4>Data Disclaimer</h4>
                  <div className="disclaimer-content">
                    <p>Please note:</p>
                    <ul>
                      <li>Information may not be current or accurate</li>
                      <li>Toilet facilities may have changed hours or access</li>
                      <li>Some locations may no longer exist</li>
                      <li>Always verify before traveling long distances</li>
                    </ul>
                  </div>
                </div>

                <div className="contribute-section">
                  <h4>Help Improve This Map</h4>
                  <p>Know of missing toilets or outdated information? Help improve the data for everyone.</p>
                  <a href="https://www.openstreetmap.org/edit" target="_blank" rel="noopener noreferrer" className="contribute-button">
                    Contribute to OpenStreetMap
                  </a>
                </div>
                
                <div className="about-links">
                  <a href="mailto:bjerkem.j@gmail.com?subject=Norway Toilet Finder - Contact&body=Hello,%0D%0A%0D%0AI'm reaching out regarding the Norway Toilet Finder app.%0D%0A%0D%0A" className="about-link">Contact</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {isOpen && <div className="sidebar-overlay" onClick={onToggle}></div>}
    </>
  )
}

export default Sidebar