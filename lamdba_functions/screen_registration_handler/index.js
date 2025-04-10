const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Initialize AWS services
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const iot = new AWS.Iot();

/**
 * Lambda function to handle screen registration
 */
exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    // Parse the request body
    const body = JSON.parse(event.body);
    const { name, location, type, size, resolution } = body;
    
    // Validate required fields
    if (!name || !location) {
      return formatResponse(400, { message: 'Name and location are required' });
    }
    
    // Generate unique ID for the screen
    const screenId = uuidv4();
    
    // Create screen record in DynamoDB
    const screenItem = {
      screenId,
      name,
      location,
      type: type || 'Digital Screen',
      size: size || 'Medium',
      resolution: resolution || '1920x1080',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastConnected: null
    };
    
    await dynamoDB.put({
      TableName: process.env.SCREENS_TABLE,
      Item: screenItem
    }).promise();
    
    // Create IoT thing for the screen
    const thingName = `screen_${screenId}`;
    await iot.createThing({
      thingName,
      thingTypeName: 'AdScreen',
      attributePayload: {
        attributes: {
          screenId,
          location,
          type: screenItem.type
        }
      }
    }).promise();
    
    // Create keys and certificate for the IoT thing
    const keysAndCert = await iot.createKeysAndCertificate({
      setAsActive: true
    }).promise();
    
    // Attach policy to certificate
    await iot.attachPolicy({
      policyName: process.env.IOT_POLICY_NAME,
      target: keysAndCert.certificateArn
    }).promise();
    
    // Attach certificate to thing
    await iot.attachThingPrincipal({
      thingName,
      principal: keysAndCert.certificateArn
    }).promise();
    
    return formatResponse(200, {
      message: 'Screen registered successfully',
      screenId,
      thingName,
      certificate: {
        certificateId: keysAndCert.certificateId,
        certificatePem: keysAndCert.certificatePem,
        privateKey: keysAndCert.keyPair.PrivateKey
      },
      endpoint: process.env.IOT_ENDPOINT
    });
    
  } catch (error) {
    console.error('Error registering screen:', error);
    return formatResponse(500, { message: 'Error registering screen' });
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