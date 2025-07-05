// src/App.jsx
import { useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Map from './components/Map'
import './App.css'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="app">
      <Header />
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <Map sidebarOpen={sidebarOpen} />
      <Analytics /> {/* Add this line */}
    </div>
  )
}

export default App