// File: App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Component imports
import Dashboard from './components/Dashboard';
import AdUpload from './components/AdUpload';
import ScreenSelection from './components/ScreenSelection';
import SubmissionSuccess from './components/SubmissionSuccess';
import Login from './components/Login';
import Navbar from './components/Navbar';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} currentUser={currentUser} />
        
        <Routes>
          <Route path="/" element={isLoggedIn ? <Dashboard currentUser={currentUser} /> : <Login onLogin={handleLogin} />} />
          <Route path="/upload" element={isLoggedIn ? <AdUpload currentUser={currentUser} /> : <Login onLogin={handleLogin} />} />
          <Route path="/select-screen" element={isLoggedIn ? <ScreenSelection /> : <Login onLogin={handleLogin} />} />
          <Route path="/success" element={isLoggedIn ? <SubmissionSuccess /> : <Login onLogin={handleLogin} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;