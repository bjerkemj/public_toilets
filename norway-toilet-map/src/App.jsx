// src/App.jsx
import { useState } from 'react'
import { Analytics, track } from '@vercel/analytics/react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Map from './components/Map'
import './App.css'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filters, setFilters] = useState({
    freeOnly: false,
    wheelchairOnly: false
  })

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)

    // Track the filter change event
    track('filter_applied', {
      freeOnly: newFilters.freeOnly,
      wheelchairOnly: newFilters.wheelchairOnly
    })
  }

  return (
    <div className="app">
      <Header onMenuToggle={toggleSidebar} isMenuOpen={sidebarOpen} />
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        onFilterChange={handleFilterChange}
      />
      <Map 
        sidebarOpen={sidebarOpen} 
        filters={filters}
      />
      <Analytics />
    </div>
  )
}

export default App
