// Preload script
window.addEventListener('DOMContentLoaded', () => {
    // Expose ipcRenderer to the renderer process
    window.ipcRenderer = require('electron').ipcRenderer;
  });