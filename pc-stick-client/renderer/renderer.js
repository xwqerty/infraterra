// Import electron
const { ipcRenderer } = require('electron');

// DOM Elements
const adContainer = document.getElementById('adContainer');
const configScreen = document.getElementById('configScreen');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const statusIndicator = document.getElementById('statusIndicator');
const configureButton = document.getElementById('configureButton');

// Current ad being displayed
let currentAdElement = null;
let currentAdId = null;
let playlist = [];
let playlistIndex = 0;
let contents = [];

// Initialize the renderer
init();

function init() {
  // Show loading initially
  showElement(loadingMessage);
  hideElement(adContainer);
  hideElement(configScreen);
  hideElement(errorMessage);
  
  // Listen for IPC messages from main process
  setupListeners();
  
  // Setup configuration button
  configureButton.addEventListener('click', submitConfiguration);
}

// Setup all IPC listeners
function setupListeners() {
  // Show configuration screen
  ipcRenderer.on('show-configuration', () => {
    hideElement(loadingMessage);
    showElement(configScreen);
  });
  
  // Configuration complete
  ipcRenderer.on('configuration-complete', () => {
    hideElement(configScreen);
    showElement(adContainer);
  });
  
  // Content updated event
  ipcRenderer.on('content-updated', (event, data) => {
    contents = data.contents || [];
    console.log('Contents updated:', contents);
  });
  
  // Playlist updated event
  ipcRenderer.on('playlist-updated', (event, data) => {
    playlist = data.activePlaylists || [];
    console.log('Playlist updated:', playlist);
    
    // Start playback if not already playing
    if (playlist.length > 0 && !currentAdElement) {
      playlistIndex = 0;
      playNextAd();
    }
  });
  
  // Connection status event
  ipcRenderer.on('connection-status', (event, data) => {
    statusIndicator.className = `status-indicator ${data.status}`;
  });
  
  // Error event
  ipcRenderer.on('error', (event, data) => {
    showError(data.message);
  });
}

// Submit device configuration
function submitConfiguration() {
  const screenId = document.getElementById('screenId').value;
  const certificatePem = document.getElementById('certificatePem').value;
  const privateKey = document.getElementById('privateKey').value;
  const endpoint = document.getElementById('endpoint').value;
  
  if (!screenId || !certificatePem || !privateKey || !endpoint) {
    showError('All fields are required');
    return;
  }
  
  // Send configuration to main process
  ipcRenderer.send('configure-device', {
    screenId,
    certificatePem,
    privateKey,
    endpoint
  });
  
  // Show loading while configuration is processed
  hideElement(configScreen);
  showElement(loadingMessage);
}

// Play the next advertisement in the playlist
function playNextAd() {
  // Clear current ad
  if (currentAdElement) {
    adContainer.removeChild(currentAdElement);
    currentAdElement = null;
    currentAdId = null;
  }
  
  // If playlist is empty, show no content message
  if (playlist.length === 0) {
    showNoContent();
    return;
  }
  
  // Get the next ad in the playlist
  const adId = playlist[playlistIndex];
  const content = contents.find(c => c.adId === adId);
  
  if (!content) {
    // Move to next in playlist
    playlistIndex = (playlistIndex + 1) % playlist.length;
    playNextAd();
    return;
  }
  
  // Create element based on content type
  const fileExt = content.localFilePath.split('.').pop().toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
    // Create image element
    const imgElement = document.createElement('img');
    imgElement.className = 'ad-image';
    imgElement.src = content.localFilePath;
    
    // Set current ad element
    currentAdElement = imgElement;
    currentAdId = content.adId;
    
    // Add to container
    adContainer.appendChild(imgElement);
    
    // Schedule next ad
    setTimeout(() => {
      playlistIndex = (playlistIndex + 1) % playlist.length;
      playNextAd();
    }, content.duration * 1000);
    
  } else if (['mp4', 'webm', 'ogg'].includes(fileExt)) {
    // Create video element
    const videoElement = document.createElement('video');
    videoElement.className = 'ad-video';
    videoElement.src = content.localFilePath;
    videoElement.autoplay = true;
    videoElement.muted = true; // Auto-play requires muted
    
    // Set current ad element
    currentAdElement = videoElement;
    currentAdId = content.adId;
    
    // Add to container
    adContainer.appendChild(videoElement);
    
    // When video ends, play next
    videoElement.onended = () => {
      playlistIndex = (playlistIndex + 1) % playlist.length;
      playNextAd();
    };
  } else {
    // Unsupported format, move to next
    playlistIndex = (playlistIndex + 1) % playlist.length;
    playNextAd();
  }
}

// Show no content message
function showNoContent() {
  const messageElement = document.createElement('div');
  messageElement.className = 'no-content-message';
  messageElement.innerHTML = '<h2>No content available for display</h2>';
  
  currentAdElement = messageElement;
  adContainer.appendChild(messageElement);
}

// Show error message
function showError(message) {
  errorText.textContent = message;
  showElement(errorMessage);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideElement(errorMessage);
  }, 5000);
}

// Utility to show element
function showElement(element) {
  if (element) element.style.display = '';
}

// Utility to hide element
function hideElement(element) {
  if (element) element.style.display = 'none';
}