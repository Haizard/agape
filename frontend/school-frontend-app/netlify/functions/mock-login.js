exports.handler = async function(event, context) {
  // Log the request for debugging
  console.log('Mock login request:', event.path, event.httpMethod);
  
  // Parse the request body
  let requestBody = {};
  try {
    if (event.body) {
      requestBody = JSON.parse(event.body);
    }
  } catch (error) {
    console.error('Error parsing request body:', error);
  }
  
  // Check if this is a login request
  if (event.path.includes('/users/login')) {
    // Return a mock login response
    return {
      statusCode: 200,
      body: JSON.stringify({
        token: 'mock-jwt-token',
        user: {
          id: '123',
          username: requestBody.username || 'admin',
          email: 'admin@example.com',
          role: 'admin'
        },
        message: 'Mock login successful'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }
  
  // Return a generic response for other requests
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'This is a mock API response',
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
