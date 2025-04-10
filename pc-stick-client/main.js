const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const AWS = require('aws-sdk');
const awsIot = require('aws-iot-device-sdk');
const Store = require('electron-store');
const schedule = require('node-schedule');

// App constants
const CONFIG_DIR = path.join(app.getPath('userData'), 'config');
const CONTENT_DIR = path.join(app.getPath('userData'), 'content');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const CERTS_DIR = path.join(CONFIG_DIR, 'certs');

// Create necessary directories
if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true });
if (!fs.existsSync(CERTS_DIR)) fs.mkdirSync(CERTS_DIR, { recursive: true });

// Initialize config store
const store = new Store();

// Global variables
let mainWindow;
let deviceClient;
let contentScheduler = {};

// Function to create the main browser window
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: !app.isPackaged ? false : true,
    kiosk: !app.isPackaged ? false : true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

// Initialize the application
app.whenReady().then(() => {
  createWindow();
  
  // Check if device is configured
  const isConfigured = store.has('screenId') && store.has('certificateId');
  
  if (isConfigured) {
    connectToIoT();
    loadScheduledContent();
  } else {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('show-configuration');
    });
  }
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle device configuration
ipcMain.on('configure-device', (event, config) => {
  const { screenId, certificatePem, privateKey, endpoint } = config;
  
  // Save certificates to files
  fs.writeFileSync(path.join(CERTS_DIR, 'certificate.pem'), certificatePem);
  fs.writeFileSync(path.join(CERTS_DIR, 'private.key'), privateKey);
  
  // Save configuration to store
  store.set('screenId', screenId);
  store.set('certificateId', path.basename(certificatePem, '.pem'));
  store.set('endpoint', endpoint);
  
  // Connect to IoT and start the display
  connectToIoT();
  
  // Notify renderer
  mainWindow.webContents.send('configuration-complete');
});

// Connect to AWS IoT
function connectToIoT() {
  const screenId = store.get('screenId');
  const endpoint = store.get('endpoint');
  
  console.log(`Connecting to IoT endpoint: ${endpoint}`);
  
  // Initialize the device
  deviceClient = awsIot.device({
    keyPath: path.join(CERTS_DIR, 'private.key'),
    certPath: path.join(CERTS_DIR, 'certificate.pem'),
    host: endpoint,
    clientId: `screen_${screenId}`
  });
  
  // Connect to AWS IoT
  deviceClient.on('connect', () => {
    console.log('Connected to AWS IoT');
    
    // Subscribe to content topic
    const contentTopic = `screen/${screenId}/content`;
    deviceClient.subscribe(contentTopic);
    console.log(`Subscribed to ${contentTopic}`);
    
    // Subscribe to command topic
    const commandTopic = `screen/${screenId}/command`;
    deviceClient.subscribe(commandTopic);
    console.log(`Subscribed to ${commandTopic}`);
    
    // Send online status
    publishStatus('online');
  });
  
  // Handle incoming messages
  deviceClient.on('message', (topic, payload) => {
    console.log(`Received message on ${topic}`);
    
    try {
      const message = JSON.parse(payload.toString());
      
      if (topic.endsWith('/content')) {
        handleContentMessage(message);
      } else if (topic.endsWith('/command')) {
        handleCommandMessage(message);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle errors
  deviceClient.on('error', (error) => {
    console.error('IoT connection error:', error);
    
    // Attempt to reconnect after a delay
    setTimeout(() => {
      connectToIoT();
    }, 5000);
  });
  
  // Handle offline events
  deviceClient.on('offline', () => {
    console.log('Device is offline');
    mainWindow.webContents.send('connection-status', { status: 'offline' });
    
    // Continue showing scheduled content even when offline
    loadScheduledContent();
  });
}

// Publish status updates to IoT
function publishStatus(status, additionalData = {}) {
  if (!deviceClient) return;
  
  const screenId = store.get('screenId');
  const topic = `screen/${screenId}/status`;
  const message = {
    screenId,
    status,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  deviceClient.publish(topic, JSON.stringify(message));
}

// Handle content messages from IoT
function handleContentMessage(message) {
  console.log('Content message:', message);
  
  if (message.action === 'NEW_AD') {
    // Download new content
    downloadContent(message.adId, message.fileUrl)
      .then(localFilePath => {
        // Store content metadata
        const contentMeta = {
          adId: message.adId,
          title: message.title,
          localFilePath,
          duration: message.duration,
          startDate: message.startDate,
          endDate: message.endDate,
          scheduleId: message.scheduleId
        };
        
        // Save content metadata
        const contents = store.get('contents') || {};
        contents[message.adId] = contentMeta;
        store.set('contents', contents);
        
        // Schedule content
        scheduleContent(contentMeta);
        
        // Notify renderer
        mainWindow.webContents.send('content-updated', { contents: Object.values(contents) });
        
        // Acknowledge receipt
        publishStatus('content-received', { adId: message.adId });
      })
      .catch(error => {
        console.error('Error downloading content:', error);
        publishStatus('content-error', { adId: message.adId, error: error.message });
      });
  } else if (message.action === 'REMOVE_AD') {
    // Remove content
    removeContent(message.adId);
  }
}

// Handle command messages from IoT
function handleCommandMessage(message) {
  console.log('Command message:', message);
  
  switch (message.action) {
    case 'RESTART':
      app.relaunch();
      app.exit();
      break;
      
    case 'REFRESH':
      mainWindow.reload();
      break;
      
    case 'SCREENSHOT':
      takeScreenshot()
        .then(screenshotPath => {
          // Upload screenshot to S3 (would implement in production)
          publishStatus('screenshot-taken', { path: screenshotPath });
        })
        .catch(error => {
          console.error('Error taking screenshot:', error);
          publishStatus('screenshot-error', { error: error.message });
        });
      break;
      
    case 'UPDATE_CONFIG':
      // Update store with new config values
      if (message.config) {
        Object.entries(message.config).forEach(([key, value]) => {
          store.set(key, value);
        });
      }
      publishStatus('config-updated');
      break;
  }
}

// Download content from URL
async function downloadContent(adId, fileUrl) {
  return new Promise((resolve, reject) => {
    const fileName = `ad_${adId}${path.extname(fileUrl)}`;
    const filePath = path.join(CONTENT_DIR, fileName);
    const file = fs.createWriteStream(filePath);
    
    https.get(fileUrl, response => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filePath);
      });
    }).on('error', err => {
      fs.unlink(filePath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Remove content
function removeContent(adId) {
  const contents = store.get('contents') || {};
  const content = contents[adId];
  
  if (content) {
    // Delete the local file
    if (content.localFilePath && fs.existsSync(content.localFilePath)) {
      fs.unlinkSync(content.localFilePath);
    }
    
    // Remove from schedule
    if (contentScheduler[adId]) {
      contentScheduler[adId].forEach(job => job.cancel());
      delete contentScheduler[adId];
    }
    
    // Remove from store
    delete contents[adId];
    store.set('contents', contents);
    
    // Notify renderer
    mainWindow.webContents.send('content-updated', { contents: Object.values(contents) });
    
    // Acknowledge removal
    publishStatus('content-removed', { adId });
  }
}

// Schedule content to display
function scheduleContent(content) {
  const { adId, startDate, endDate, duration } = content;
  
  // Cancel any existing schedule for this content
  if (contentScheduler[adId]) {
    contentScheduler[adId].forEach(job => job.cancel());
  }
  
  contentScheduler[adId] = [];
  
  // Schedule content to start showing
  const startJob = schedule.scheduleJob(new Date(startDate), () => {
    // Add content to active playlist
    const activePlaylists = store.get('activePlaylists') || [];
    if (!activePlaylists.includes(adId)) {
      activePlaylists.push(adId);
      store.set('activePlaylists', activePlaylists);
      
      // Notify renderer
      mainWindow.webContents.send('playlist-updated', { activePlaylists });
    }
  });
  
  // Schedule content to stop showing
  const endJob = schedule.scheduleJob(new Date(endDate), () => {
    // Remove content from active playlist
    const activePlaylists = store.get('activePlaylists') || [];
    const index = activePlaylists.indexOf(adId);
    if (index !== -1) {
      activePlaylists.splice(index, 1);
      store.set('activePlaylists', activePlaylists);
      
      // Notify renderer
      mainWindow.webContents.send('playlist-updated', { activePlaylists });
    }
  });
  
  contentScheduler[adId].push(startJob, endJob);
}

// Load scheduled content on startup
function loadScheduledContent() {
  const contents = store.get('contents') || {};
  const now = new Date();
  const activePlaylists = [];
  
  // Check which content should be active now
  Object.values(contents).forEach(content => {
    const startDate = new Date(content.startDate);
    const endDate = new Date(content.endDate);
    
    if (now >= startDate && now <= endDate) {
      activePlaylists.push(content.adId);
    }
    
    // Reschedule content
    scheduleContent(content);
  });
  
  // Update active playlists
  store.set('activePlaylists', activePlaylists);
  
  // Notify renderer
  mainWindow.webContents.send('content-updated', { contents: Object.values(contents) });
  mainWindow.webContents.send('playlist-updated', { activePlaylists });
}

// Take screenshot (would enhance in production)
async function takeScreenshot() {
  return new Promise((resolve, reject) => {
    mainWindow.webContents.capturePage().then(image => {
      const screenshotPath = path.join(app.getPath('temp'), `screenshot_${Date.now()}.png`);
      fs.writeFile(screenshotPath, image.toPNG(), err => {
        if (err) reject(err);
        else resolve(screenshotPath);
      });
    }).catch(reject);
  });
}