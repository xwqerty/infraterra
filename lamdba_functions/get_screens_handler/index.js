const AWS = require('aws-sdk');

// Initialize AWS services
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Lambda function to get all available screens
 */
exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const { location, status } = queryParams;
    
    let params = {
      TableName: process.env.SCREENS_TABLE
    };
    
    // Apply filters if specified
    if (location) {
      // Use the location GSI
      params = {
        TableName: process.env.SCREENS_TABLE,
        IndexName: 'LocationIndex',
        KeyConditionExpression: '#location = :location',
        ExpressionAttributeNames: {
          '#location': 'location'
        },
        ExpressionAttributeValues: {
          ':location': location
        }
      };
    } else {
      // Scan for all screens
      params = {
        TableName: process.env.SCREENS_TABLE
      };
      
      // Filter by status if specified
      if (status) {
        params.FilterExpression = '#status = :status';
        params.ExpressionAttributeNames = {
          '#status': 'status'
        };
        params.ExpressionAttributeValues = {
          ':status': status
        };
      }
    }
    
    // Execute query or scan
    let result;
    if (params.IndexName) {
      result = await dynamoDB.query(params).promise();
    } else {
      result = await dynamoDB.scan(params).promise();
    }
    
    // Return screens with public information only (no credentials)
    const screens = result.Items.map(screen => ({
      screenId: screen.screenId,
      name: screen.name,
      location: screen.location,
      type: screen.type,
      size: screen.size,
      resolution: screen.resolution,
      status: screen.status,
      lastConnected: screen.lastConnected
    }));
    
    return formatResponse(200, {
      screens,
      count: screens.length
    });
    
  } catch (error) {
    console.error('Error getting screens:', error);
    return formatResponse(500, { message: 'Error getting screens' });
  }
};

/**
 * Format API Gateway response
 */
function formatResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(body)
  };
}