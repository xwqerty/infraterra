#!/usr/bin/env node

/**
 * Screen Setup Utility
 * 
 * This script helps register a new screen with the AdScreen platform
 * and configure the PC Stick client with the necessary credentials.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');
const { exec } = require('child_process');

// Command line interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
let config = {
  apiEndpoint: '',
  screenName: '',
  location: '',
  type: 'Digital Screen',
  size: 'Medium',
  resolution: '1920x1080'
};

// Start the setup process
console.log('AdScreen - Screen Setup Utility');
console.log('--------------------------------');

// Get API endpoint
rl.question('Enter API endpoint (from Terraform output): ', (apiEndpoint) => {
  config.apiEndpoint = apiEndpoint.trim();
  
  // Get screen details
  rl.question('Enter screen name: ', (screenName) => {
    config.screenName = screenName.trim();
    
    rl.question('Enter screen location: ', (location) => {
      config.location = location.trim();
      
      rl.question('Enter screen type [Digital Screen]: ', (type) => {
        if (type.trim()) config.type = type.trim();
        
        rl.question('Enter screen size [Medium]: ', (size) => {
          if (size.trim()) config.size = size.trim();
          
          rl.question('Enter screen resolution [1920x1080]: ', (resolution) => {
            if (resolution.trim()) config.resolution = resolution.trim();
            
            // Register the screen
            registerScreen();
          });
        });
      });
    });
  });
});

// Register the screen with the API
function registerScreen() {
  console.log('\nRegistering screen...');
  
  const requestData = JSON.stringify({
    name: config.screenName,
    location: config.location,
    type: config.type,
    size: config.size,
    resolution: config.resolution
  });
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': requestData.length
    }
  };
  
  const url = `${config.apiEndpoint}/screens`;
  
  const req = https.request(url, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          console.log('\nScreen registered successfully!');
          console.log(`Screen ID: ${response.screenId}`);
          
          // Save the credentials
          saveCredentials(response);
        } catch (error) {
          console.error('Error parsing response:', error);
          rl.close();
        }
      } else {
        console.error(`Error: ${res.statusCode}`);
        console.error(data);
        rl.close();
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Error registering screen:', error);
    rl.close();
  });
  
  req.write(requestData);
  req.end();
}

// Save the credentials to files
function saveCredentials(response) {
  const configDir = path.join(process.cwd(), 'screen_config');
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const certDir = path.join(configDir, 'certs');
  
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }
  
  // Save certificate and private key
  fs.writeFileSync(path.join(certDir, 'certificate.pem'), response.certificate.certificatePem);
  fs.writeFileSync(path.join(certDir, 'private.key'), response.certificate.privateKey);
  
  // Save config file
  const configData = {
    screenId: response.screenId,
    thingName: response.thingName,
    endpoint: response.endpoint
  };
  
  fs.writeFileSync(
    path.join(configDir, 'config.json'),
    JSON.stringify(configData, null, 2)
  );
  
  console.log('\nCredentials saved to:', configDir);
  console.log('\nConfiguration for PC Stick:');
  console.log('----------------------------');
  console.log(`Screen ID: ${response.screenId}`);
  console.log(`IoT Endpoint: ${response.endpoint}`);
  console.log('\nPlease copy the certificate and private key from the "certs" directory');
  console.log('to the PC Stick when setting up the client application.');
  
  rl.question('\nWould you like to create a configuration QR code? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      createQRCode(configData, response.certificate);
    } else {
      rl.close();
    }
  });
}

// Create a QR code for easy configuration
function createQRCode(configData, certificate) {
  try {
    // Install qrcode if not already installed
    exec('npm list -g qrcode || npm install -g qrcode', (error) => {
      if (error) {
        console.error('Error installing qrcode:', error);
        rl.close();
        return;
      }
      
      // Prepare configuration data
      const qrData = JSON.stringify({
        screenId: configData.screenId,
        endpoint: configData.endpoint,
        certificatePem: certificate.certificatePem,
        privateKey: certificate.privateKey
      });
      
      // Generate QR code
      const qrPath = path.join(process.cwd(), 'screen_config', 'config_qr.png');
      
      exec(`qrcode -o "${qrPath}" "${qrData}"`, (error) => {
        if (error) {
          console.error('Error generating QR code:', error);
        } else {
          console.log(`\nQR code saved to: ${qrPath}`);
          console.log('Scan this QR code with the PC Stick client to configure automatically.');
        }
        
        rl.close();
      });
    });
  } catch (error) {
    console.error('Error creating QR code:', error);
    rl.close();
  }
}