import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function Dashboard({ currentUser }) {
  const [adSubmissions, setAdSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate fetching ad submissions
  useEffect(() => {
    // This would be an API call in a real application
    setTimeout(() => {
      const mockSubmissions = [
        {
          id: '1',
          title: 'Summer Sale Promotion',
          screenLocation: 'New York - Times Square',
          status: 'Active',
          startDate: '2025-05-01',
          endDate: '2025-05-15',
        },
        {
          id: '2',
          title: 'Product Launch',
          screenLocation: 'Tokyo - Shibuya Crossing',
          status: 'Pending',
          startDate: '2025-06-10',
          endDate: '2025-06-20',
        },
      ];
      setAdSubmissions(mockSubmissions);
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Your Ad Dashboard</h1>
        <Link to="/upload" className="create-ad-button">Create New Ad</Link>
      </div>

      {isLoading ? (
        <div className="loading-indicator">Loading your advertisements...</div>
      ) : (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Active Ads</h3>
              <p className="stat-number">1</p>
            </div>
            <div className="stat-card">
              <h3>Pending Ads</h3>
              <p className="stat-number">1</p>
            </div>
            <div className="stat-card">
              <h3>Total Screens</h3>
              <p className="stat-number">2</p>
            </div>
          </div>

          <div className="recent-submissions">
            <h2>Your Advertisements</h2>
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Screen Location</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adSubmissions.map((ad) => (
                  <tr key={ad.id}>
                    <td>{ad.title}</td>
                    <td>{ad.screenLocation}</td>
                    <td>
                      <span className={`status-badge ${ad.status.toLowerCase()}`}>
                        {ad.status}
                      </span>
                    </td>
                    <td>{ad.startDate} to {ad.endDate}</td>
                    <td>
                      <button className="action-button view">View</button>
                      <button className="action-button edit">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;