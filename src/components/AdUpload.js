import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdUpload.css';

function AdUpload({ currentUser }) {
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adFile, setAdFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [adDuration, setAdDuration] = useState('');
  const [adStartDate, setAdStartDate] = useState('');
  const [adEndDate, setAdEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAdFile(file);
      
      // Create a preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        // For video or other files
        setFilePreview(`File selected: ${file.name}`);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!adTitle.trim()) newErrors.adTitle = 'Title is required';
    if (!adDescription.trim()) newErrors.adDescription = 'Description is required';
    if (!adFile) newErrors.adFile = 'Please upload an advertisement file';
    if (!adDuration) newErrors.adDuration = 'Please specify the duration';
    if (!adStartDate) newErrors.adStartDate = 'Start date is required';
    if (!adEndDate) newErrors.adEndDate = 'End date is required';
    
    // Check if end date is after start date
    if (adStartDate && adEndDate && new Date(adEndDate) <= new Date(adStartDate)) {
      newErrors.adEndDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // In a real application, you would upload the file to your server here
      // For the prototype, we'll simulate a successful upload after a delay
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/select-screen');
      }, 1500);
    }
  };

  return (
    <div className="ad-upload-container">
      <h1>Create New Advertisement</h1>
      <p className="upload-description">
        Upload your advertisement content and set when you want it to run.
      </p>
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-section">
          <h2>Advertisement Details</h2>
          
          <div className="form-group">
            <label htmlFor="adTitle">Advertisement Title</label>
            <input
              type="text"
              id="adTitle"
              value={adTitle}
              onChange={(e) => setAdTitle(e.target.value)}
              placeholder="Enter a descriptive title"
            />
            {errors.adTitle && <span className="error-message">{errors.adTitle}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="adDescription">Description</label>
            <textarea
              id="adDescription"
              value={adDescription}
              onChange={(e) => setAdDescription(e.target.value)}
              placeholder="Describe your advertisement"
              rows="4"
            />
            {errors.adDescription && <span className="error-message">{errors.adDescription}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="adFile">Upload Advertisement</label>
            <div className="file-upload-container">
              <input
                type="file"
                id="adFile"
                onChange={handleFileChange}
                accept="image/*, video/*"
                className="file-input"
              />
              <label htmlFor="adFile" className="file-upload-label">
                {adFile ? 'Change File' : 'Select File'}
              </label>
              <span className="file-name">{adFile ? adFile.name : 'No file selected'}</span>
            </div>
            {errors.adFile && <span className="error-message">{errors.adFile}</span>}
          </div>
          
          {filePreview && (
            <div className="file-preview">
              {adFile?.type.startsWith('image/') ? (
                <img src={filePreview} alt="Advertisement preview" />
              ) : (
                <div className="non-image-preview">{filePreview}</div>
              )}
            </div>
          )}
        </div>
        
        <div className="form-section">
          <h2>Schedule</h2>
          
          <div className="form-group">
            <label htmlFor="adDuration">Duration (in seconds)</label>
            <input
              type="number"
              id="adDuration"
              min="5"
              max="60"
              value={adDuration}
              onChange={(e) => setAdDuration(e.target.value)}
              placeholder="How long should your ad play?"
            />
            {errors.adDuration && <span className="error-message">{errors.adDuration}</span>}
          </div>
          
          <div className="date-range-container">
            <div className="form-group">
              <label htmlFor="adStartDate">Start Date</label>
              <input
                type="date"
                id="adStartDate"
                value={adStartDate}
                onChange={(e) => setAdStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.adStartDate && <span className="error-message">{errors.adStartDate}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="adEndDate">End Date</label>
              <input
                type="date"
                id="adEndDate"
                value={adEndDate}
                onChange={(e) => setAdEndDate(e.target.value)}
                min={adStartDate || new Date().toISOString().split('T')[0]}
              />
              {errors.adEndDate && <span className="error-message">{errors.adEndDate}</span>}
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Uploading...' : 'Continue to Screen Selection'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdUpload;