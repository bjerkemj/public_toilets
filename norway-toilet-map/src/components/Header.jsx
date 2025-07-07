// src/components/Header.jsx
import './Header.css'

function Header({ onMenuToggle, isMenuOpen }) {
  return (
    <header className="header">
      <div className="header-content">
        {/* Burger Menu Button */}
        <button className="header-menu-toggle" onClick={onMenuToggle}>
          {isMenuOpen ? '✕' : '☰'}
        </button>
        
        <h1 className="header-title">
          🚽 WC Finder
        </h1>
      </div>
    </header>
  )
}

export default Header