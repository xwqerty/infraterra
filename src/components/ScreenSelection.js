import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ScreenSelection.css';

function ScreenSelection() {
  const [screens, setScreens] = useState([]);
  const [selectedScreens, setSelectedScreens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();

  // Simulate fetching screens data
  useEffect(() => {
    // This would be an API call in a real application
    setTimeout(() => {
      const mockScreens = [
        {
          id: '1',
          name: 'Times Square Billboard',
          location: 'New York, USA',
          type: 'Billboard',
          size: 'Large (20m x 10m)',
          dailyImpressions: 150000,
          costPerDay: 2500,
          availability: 'available',
          image: '/api/placeholder/400/200'
        },
        {
          id: '2',
          name: 'Shibuya Crossing Display',
          location: 'Tokyo, Japan',
          type: 'Digital Screen',
          size: 'Medium (10m x 5m)',
          dailyImpressions: 120000,
          costPerDay: 2000,
          availability: 'available',
          image: '/api/placeholder/400/200'
        },
        {
          id: '3',
          name: 'Piccadilly Circus Screen',
          location: 'London, UK',
          type: 'Digital Billboard',
          size: 'Large (15m x 8m)',
          dailyImpressions: 110000,
          costPerDay: 1800,
          availability: 'available',
          image: '/api/placeholder/400/200'
        },
        {
          id: '4',
          name: 'La Rambla Display',
          location: 'Barcelona, Spain',
          type: 'Interactive Screen',
          size: 'Small (5m x 3m)',
          dailyImpressions: 75000,
          costPerDay: 1200,
          availability: 'booked',
          image: '/api/placeholder/400/200'
        },
        {
          id: '5',
          name: 'Orchard Road LED',
          location: 'Singapore',
          type: 'LED Wall',
          size: 'Medium (8m x 4m)',
          dailyImpressions: 90000,
          costPerDay: 1500,
          availability: 'maintenance',
          image: '/api/placeholder/400/200'
        },
      ];
      setScreens(mockScreens);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleScreenSelect = (screenId) => {
    setSelectedScreens((prevSelected) => {
      if (prevSelected.includes(screenId)) {
        return prevSelected.filter(id => id !== screenId);
      } else {
        return [...prevSelected, screenId];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedScreens.length === 0) {
      alert('Please select at least one screen');
      return;
    }
    
    // In a real app, you would save the selection to your backend
    navigate('/success');
  };

  // Filter screens based on availability filter and search query
  const filteredScreens = screens.filter(screen => {
    const matchesFilter = filter === 'all' || screen.availability === filter;
    const matchesSearch = screen.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         screen.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="screen-selection-container">
      <h1>Select Display Screens</h1>
      <p className="selection-description">
        Choose where you want your advertisement to appear around the world.
      </p>
      
      {isLoading ? (
        <div className="loading-indicator">Loading available screens...</div>
      ) : (
        <>
          <div className="filter-controls">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by name or location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-options">
              <button 
                className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-button ${filter === 'available' ? 'active' : ''}`}
                onClick={() => setFilter('available')}
              >
                Available
              </button>
              <button 
                className={`filter-button ${filter === 'booked' ? 'active' : ''}`}
                onClick={() => setFilter('booked')}
              >
                Booked
              </button>
              <button 
                className={`filter-button ${filter === 'maintenance' ? 'active' : ''}`}
                onClick={() => setFilter('maintenance')}
              >
                Maintenance
              </button>
            </div>
          </div>

          <div className="screens-grid">
            {filteredScreens.map((screen) => (
              <div 
                key={screen.id} 
                className={`screen-card ${screen.availability} ${selectedScreens.includes(screen.id) ? 'selected' : ''}`}
                onClick={() => screen.availability === 'available' && handleScreenSelect(screen.id)}
              >
                <div className="screen-image">
                  <img src={screen.image} alt={screen.name} />
                  <div className="screen-availability">
                    {screen.availability === 'available' ? 'Available' : 
                     screen.availability === 'booked' ? 'Booked' : 'Maintenance'}
                  </div>
                </div>
                
                <div className="screen-info">
                  <h3>{screen.name}</h3>
                  <p className="screen-location">{screen.location}</p>
                  <div className="screen-details">
                    <div className="detail">
                      <span className="detail-label">Type:</span>
                      <span>{screen.type}</span>
                    </div>
                    <div className="detail">
                      <span className="detail-label">Size:</span>
                      <span>{screen.size}</span>
                    </div>
                    <div className="detail">
                      <span className="detail-label">Daily Views:</span>
                      <span>{screen.dailyImpressions.toLocaleString()}</span>
                    </div>
                    <div className="detail">
                      <span className="detail-label">Cost/Day:</span>
                      <span>${screen.costPerDay}</span>
                    </div>
                  </div>
                </div>
                
                {screen.availability === 'available' && (
                  <div className="selection-indicator">
                    {selectedScreens.includes(screen.id) ? '✓ Selected' : 'Click to select'}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="selection-summary">
            <div className="selected-count">
              Selected: {selectedScreens.length} screens
            </div>
            <div className="total-cost">
              Estimated cost: $
              {selectedScreens.reduce((total, screenId) => {
                const screen = screens.find(s => s.id === screenId);
                return total + (screen ? screen.costPerDay : 0);
              }, 0).toLocaleString()}
              /day
            </div>
            <button 
              className="submit-selection"
              onClick={handleSubmit}
              disabled={selectedScreens.length === 0}
            >
              Complete Submission
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ScreenSelection;