#!/usr/bin/env node

/**
 * Seed Data Script
 * 
 * This script populates initial data in DynamoDB tables
 * to make the MVP usable immediately.
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');

// Command line interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
let config = {
  region: 'us-east-1',
  projectName: 'adscreen',
  environment: 'dev'
};

// Start the seeding process
console.log('AdScreen - Data Seeding Utility');
console.log('-------------------------------');

// Get configuration
rl.question('Enter AWS region [us-east-1]: ', (region) => {
  if (region.trim()) config.region = region.trim();
  
  rl.question('Enter project name [adscreen]: ', (projectName) => {
    if (projectName.trim()) config.projectName = projectName.trim();
    
    rl.question('Enter environment [dev]: ', (environment) => {
      if (environment.trim()) config.environment = environment.trim();
      
      // Configure AWS
      AWS.config.update({ region: config.region });
      
      // Start seeding
      seedData();
    });
  });
});

// Seed data
async function seedData() {
  try {
    // Initialize AWS services
    const dynamoDB = new AWS.DynamoDB.DocumentClient();
    const s3 = new AWS.S3();
    
    // Table names
    const usersTable = `${config.projectName}-users`;
    const screensTable = `${config.projectName}-screens`;
    const adBucket = `${config.projectName}-ad-content`;
    
    console.log('\nSeeding sample data...');
    
    // Create sample user
    const userId = uuidv4();
    const user = {
      userId,
      email: 'demo@adscreen.example',
      name: 'Demo User',
      company: 'Demo Company',
      createdAt: new Date().toISOString()
    };
    
    await dynamoDB.put({
      TableName: usersTable,
      Item: user
    }).promise();
    
    console.log('Created sample user with ID:', userId);
    
    // Create sample screens
    const screens = [
      {
        screenId: uuidv4(),
        name: 'Times Square Billboard',
        location: 'New York, USA',
        type: 'Billboard',
        size: 'Large (20m x 10m)',
        resolution: '3840x2160',
        status: 'active',
        dailyImpressions: 150000,
        costPerDay: 2500,
        createdAt: new Date().toISOString()
      },
      {
        screenId: uuidv4(),
        name: 'Shibuya Crossing Display',
        location: 'Tokyo, Japan',
        type: 'Digital Screen',
        size: 'Medium (10m x 5m)',
        resolution: '1920x1080',
        status: 'active',
        dailyImpressions: 120000,
        costPerDay: 2000,
        createdAt: new Date().toISOString()
      },
      {
        screenId: uuidv4(),
        name: 'Piccadilly Circus Screen',
        location: 'London, UK',
        type: 'Digital Billboard',
        size: 'Large (15m x 8m)',
        resolution: '2560x1440',
        status: 'active',
        dailyImpressions: 110000,
        costPerDay: 1800,
        createdAt: new Date().toISOString()
      },
      {
        screenId: uuidv4(),
        name: 'La Rambla Display',
        location: 'Barcelona, Spain',
        type: 'Interactive Screen',
        size: 'Small (5m x 3m)',
        resolution: '1920x1080',
        status: 'active',
        dailyImpressions: 75000,
        costPerDay: 1200,
        createdAt: new Date().toISOString()
      },
      {
        screenId: uuidv4(),
        name: 'Orchard Road LED',
        location: 'Singapore',
        type: 'LED Wall',
        size: 'Medium (8m x 4m)',
        resolution: '1920x1080',
        status: 'active',
        dailyImpressions: 90000,
        costPerDay: 1500,
        createdAt: new Date().toISOString()
      }
    ];
    
    // Insert screens one by one
    for (const screen of screens) {
      await dynamoDB.put({
        TableName: screensTable,
        Item: screen
      }).promise();
      console.log(`Created sample screen: ${screen.name}`);
    }
    
    // Upload sample advertisement image
    const sampleImagePath = path.join(__dirname, 'sample-ad.jpg');
    
    // Check if the sample image exists
    if (!fs.existsSync(sampleImagePath)) {
      console.log('Sample image not found. Skipping sample ad creation.');
      console.log('To add a sample ad, place a "sample-ad.jpg" file in the scripts directory.');
      finishSeeding();
      return;
    }
    
    // Read the sample image file
    const imageContent = fs.readFileSync(sampleImagePath);
    
    // Upload to S3
    const adId = uuidv4();
    const s3Key = `ads/${userId}/${adId}.jpg`;
    
    await s3.putObject({
      Bucket: adBucket,
      Key: s3Key,
      Body: imageContent,
      ContentType: 'image/jpeg'
    }).promise();
    
    console.log('Uploaded sample advertisement to S3');
    
    // Create ad metadata
    const adUrl = `https://${adBucket}.s3.amazonaws.com/${s3Key}`;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days from now
    
    const adItem = {
      adId,
      userId,
      title: 'Sample Advertisement',
      description: 'This is a sample advertisement for demonstration purposes.',
      duration: 10, // 10 seconds
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      fileUrl: adUrl,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    // Add to advertisements table
    const advertisementsTable = `${config.projectName}-advertisements`;
    
    await dynamoDB.put({
      TableName: advertisementsTable,
      Item: adItem
    }).promise();
    
    console.log('Created sample advertisement with ID:', adId);
    
    // Schedule the ad on a few screens
    const scheduledAdsTable = `${config.projectName}-scheduled-ads`;
    const screenIds = screens.slice(0, 3).map(screen => screen.screenId); // First 3 screens
    
    for (const screenId of screenIds) {
      const scheduleId = uuidv4();
      const scheduleItem = {
        scheduleId,
        adId,
        screenId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'active'
      };
      
      await dynamoDB.put({
        TableName: scheduledAdsTable,
        Item: scheduleItem
      }).promise();
      
      console.log(`Scheduled ad on screen ${screenId}`);
    }
    
    // Finish seeding
    finishSeeding();
    
  } catch (error) {
    console.error('Error seeding data:', error);
    rl.close();
  }
}

// Finish seeding and provide summary
function finishSeeding() {
  console.log('\nSeeding completed successfully!');
  console.log('\nSample data summary:');
  console.log('- 1 demo user (demo@adscreen.example)');
  console.log('- 5 screen locations with varying types and sizes');
  console.log('- 1 sample advertisement (if sample-ad.jpg was provided)');
  console.log('- Scheduled the sample ad on 3 screens');
  
  console.log('\nYou can now use the web interface to browse and manage this data.');
  console.log('Login with the email: demo@adscreen.example (no password required for MVP)');
  
  rl.close();
}