exports.handler = async function(event, context) {
  // Log the request for debugging
  console.log('Simple proxy request:', event.path, event.httpMethod);
  
  // Return a simple response for testing
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'This is a simple proxy response',
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }
  };
};
