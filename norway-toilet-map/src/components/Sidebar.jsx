// src/components/Sidebar.jsx
import { useState } from 'react'
import './Sidebar.css'

function Sidebar({ isOpen, onToggle }) {
  const [activeSection, setActiveSection] = useState('filters')

  return (
    <>
      {/* Toggle button for mobile */}
      <button className="sidebar-toggle" onClick={onToggle}>
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-content">
          {/* Navigation */}
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${activeSection === 'filters' ? 'active' : ''}`}
              onClick={() => setActiveSection('filters')}
            >
              🔍 Filters
            </button>
            <button 
              className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              ⚙️ Settings
            </button>
            <button 
              className={`nav-item ${activeSection === 'about' ? 'active' : ''}`}
              onClick={() => setActiveSection('about')}
            >
              ℹ️ About
            </button>
          </nav>

          {/* Content sections */}
          <div className="sidebar-section">
            {activeSection === 'filters' && (
              <div className="section-content">
                <h3>Filter Toilets</h3>
                <div className="filter-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Free Access</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Wheelchair Accessible</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Paid Toilets</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Public Access</span>
                  </label>
                </div>
                
                <div className="search-group">
                  <h4>Search Location</h4>
                  <input 
                    type="text" 
                    placeholder="Enter city or address..."
                    className="search-input"
                  />
                  <button className="search-button">Search</button>
                </div>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="section-content">
                <h3>Map Settings</h3>
                <div className="setting-group">
                  <h4>Map Style</h4>
                  <select className="style-select">
                    <option value="streets">Streets</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="satellite">Satellite</option>
                  </select>
                </div>
                
                <div className="setting-group">
                  <h4>Marker Size</h4>
                  <input type="range" min="1" max="3" defaultValue="2" className="range-input" />
                </div>

                <div className="setting-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Show Clusters</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Auto-locate Me</span>
                  </label>
                </div>
              </div>
            )}

            {activeSection === 'about' && (
              <div className="section-content">
                <h3>About This Map</h3>
                <p>Norway's most comprehensive toilet finder with over 63,000 locations.</p>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">63K+</div>
                    <div className="stat-label">Locations</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">428</div>
                    <div className="stat-label">Cities</div>
                  </div>
                </div>
                
                <div className="about-links">
                  <a href="#" className="about-link">Data Source</a>
                  <a href="#" className="about-link">GitHub</a>
                  <a href="#" className="about-link">Contact</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onToggle}></div>}
    </>
  )
}

export default Sidebar