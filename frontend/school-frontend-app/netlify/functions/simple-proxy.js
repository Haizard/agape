exports.handler = async function(event, context) {
  // Return a mock response for all API requests
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'This is a mock API response',
      data: []
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }
  };
};
