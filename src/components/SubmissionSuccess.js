import React from 'react';
import { Link } from 'react-router-dom';
import './SubmissionSuccess.css';

function SubmissionSuccess() {
  return (
    <div className="success-container">
      <div className="success-content">
        <div className="success-icon">✓</div>
        <h1>Submission Successful!</h1>
        <p>Your advertisement has been submitted for review and will be live on your selected screens soon.</p>
        
        <div className="next-steps">
          <h2>Next Steps:</h2>
          <ul>
            <li>Our team will review your submission within 24 hours</li>
            <li>You'll receive a confirmation email once your ad is approved</li>
            <li>Track the performance of your ad on your dashboard</li>
          </ul>
        </div>
        
        <div className="submission-actions">
          <Link to="/" className="return-dashboard">
            Return to Dashboard
          </Link>
          <Link to="/upload" className="create-another">
            Create Another Ad
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SubmissionSuccess;