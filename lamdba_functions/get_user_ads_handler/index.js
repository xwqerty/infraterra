const AWS = require('aws-sdk');

// Initialize AWS services
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Lambda function to get advertisements for a specific user
 */
exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    // Get userId from path parameters
    const userId = event.pathParameters?.userId;
    
    if (!userId) {
      return formatResponse(400, { message: 'Missing userId parameter' });
    }
    
    // Query advertisements by userId
    const adsResult = await dynamoDB.query({
      TableName: process.env.ADVERTISEMENTS_TABLE,
      IndexName: 'UserAdsIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise();
    
    // For each ad, get the scheduled screens
    const adsWithSchedules = await Promise.all(adsResult.Items.map(async (ad) => {
      // Query scheduled screens for this ad
      const schedulesResult = await dynamoDB.scan({
        TableName: process.env.SCHEDULED_ADS_TABLE,
        FilterExpression: 'adId = :adId',
        ExpressionAttributeValues: {
          ':adId': ad.adId
        }
      }).promise();
      
      // Get screen details for each schedule
      const schedulesWithScreens = await Promise.all(schedulesResult.Items.map(async (schedule) => {
        const screenResult = await dynamoDB.get({
          TableName: process.env.SCREENS_TABLE,
          Key: {
            screenId: schedule.screenId
          }
        }).promise();
        
        return {
          ...schedule,
          screen: screenResult.Item ? {
            screenId: screenResult.Item.screenId,
            name: screenResult.Item.name,
            location: screenResult.Item.location,
            type: screenResult.Item.type
          } : null
        };
      }));
      
      return {
        ...ad,
        schedules: schedulesWithScreens
      };
    }));
    
    return formatResponse(200, {
      ads: adsWithSchedules,
      count: adsWithSchedules.length
    });
    
  } catch (error) {
    console.error('Error getting user advertisements:', error);
    return formatResponse(500, { message: 'Error getting user advertisements' });
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