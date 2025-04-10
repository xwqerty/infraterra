const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Initialize AWS services
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const iot = new AWS.IotData({ endpoint: process.env.IOT_ENDPOINT });

/**
 * Lambda function to handle advertisement submissions
 */
exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    // Parse the request body
    const body = JSON.parse(event.body);
    const { userId, adTitle, adDescription, adDuration, adStartDate, adEndDate, fileContent, fileType, screenIds } = body;
    
    // Validate required fields
    if (!userId || !adTitle || !adDuration || !adStartDate || !adEndDate || !fileContent || !screenIds || screenIds.length === 0) {
      return formatResponse(400, { message: 'Missing required fields' });
    }
    
    // Generate unique ID for the advertisement
    const adId = uuidv4();
    
    // Remove the data:image/jpeg;base64, part if present
    const base64Data = fileContent.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Upload file to S3
    const s3Key = `ads/${userId}/${adId}`;
    await s3.putObject({
      Bucket: process.env.AD_CONTENT_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: fileType || 'application/octet-stream',
      ContentEncoding: 'base64'
    }).promise();
    
    // Get S3 URL for the uploaded file
    const s3Url = `https://${process.env.AD_CONTENT_BUCKET}.s3.amazonaws.com/${s3Key}`;
    
    // Store advertisement metadata in DynamoDB
    const adItem = {
      adId,
      userId,
      title: adTitle,
      description: adDescription || '',
      duration: parseInt(adDuration, 10),
      startDate: adStartDate,
      endDate: adEndDate,
      fileUrl: s3Url,
      createdAt: new Date().toISOString(),
      status: 'pending' // Initial status is pending
    };
    
    await dynamoDB.put({
      TableName: process.env.ADVERTISEMENTS_TABLE,
      Item: adItem
    }).promise();
    
    // Create schedule entries for each selected screen
    const schedulePromises = screenIds.map(async (screenId) => {
      const scheduleId = uuidv4();
      const scheduleItem = {
        scheduleId,
        adId,
        screenId,
        startDate: adStartDate,
        endDate: adEndDate,
        status: 'pending'
      };
      
      await dynamoDB.put({
        TableName: process.env.SCHEDULED_ADS_TABLE,
        Item: scheduleItem
      }).promise();
      
      return scheduleItem;
    });
    
    const scheduleResults = await Promise.all(schedulePromises);
    
    // For MVP, we'll simulate payment being completed and immediately distribute ads
    // In production, you would integrate with a payment system and only proceed after confirmation
    
    // Notify the screens about the new content
    await notifyScreens(screenIds, adItem, scheduleResults);
    
    // Update ad status to active
    await dynamoDB.update({
      TableName: process.env.ADVERTISEMENTS_TABLE,
      Key: { adId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'active'
      }
    }).promise();
    
    // Update schedule status to active
    const updateSchedulePromises = scheduleResults.map(schedule => 
      dynamoDB.update({
        TableName: process.env.SCHEDULED_ADS_TABLE,
        Key: { scheduleId: schedule.scheduleId },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'active'
        }
      }).promise()
    );
    
    await Promise.all(updateSchedulePromises);
    
    return formatResponse(200, {
      message: 'Advertisement submitted successfully',
      adId,
      schedules: scheduleResults
    });
    
  } catch (error) {
    console.error('Error processing advertisement submission:', error);
    return formatResponse(500, { message: 'Error processing advertisement submission' });
  }
};

/**
 * Notify screens about new content via IoT Core
 */
async function notifyScreens(screenIds, adData, schedules) {
  const notifications = screenIds.map(screenId => {
    const schedule = schedules.find(s => s.screenId === screenId);
    const message = {
      action: 'NEW_AD',
      screenId,
      adId: adData.adId,
      title: adData.title,
      fileUrl: adData.fileUrl,
      duration: adData.duration,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      scheduleId: schedule.scheduleId
    };
    
    return iot.publish({
      topic: `screen/${screenId}/content`,
      payload: JSON.stringify(message),
      qos: 1
    }).promise();
  });
  
  return Promise.all(notifications);
}

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