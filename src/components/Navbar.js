// File: components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar({ isLoggedIn, onLogout, currentUser }) {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Infraterra</Link>
      </div>
      
      {isLoggedIn ? (
        <div className="navbar-links">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/upload" className="nav-link">Upload Ad</Link>
          <div className="user-menu">
            <span>Welcome, {currentUser?.name}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      ) : (
        <div className="navbar-links">
          <Link to="/login" className="nav-link">Login</Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;