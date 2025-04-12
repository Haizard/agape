exports.handler = async function(event, context) {
  // Log the request for debugging
  console.log('Mock login request:', event.path, event.httpMethod);
  console.log('Request headers:', JSON.stringify(event.headers));

  // For OPTIONS requests, return CORS headers
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  // Parse the request body
  let requestBody = {};
  try {
    if (event.body) {
      console.log('Request body:', event.body);
      requestBody = JSON.parse(event.body);
      console.log('Parsed request body:', JSON.stringify(requestBody));
    }
  } catch (error) {
    console.error('Error parsing request body:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }

  // Handle login request
  console.log('Processing login request for:', requestBody.username || requestBody.email || 'unknown user');

  // Return a successful login response
  return {
    statusCode: 200,
    body: JSON.stringify({
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIwLCJleHAiOjE2MTYyNDg2MjB9.7M8V3XFjTRRrKDYLT5a9xIb0jLDTGMBIGGSLIL9pMTo',
      user: {
        id: '123',
        username: requestBody.username || requestBody.email || 'admin',
        email: requestBody.email || 'admin@example.com',
        role: 'admin',
        name: 'Admin User'
      },
      message: 'Login successful'
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }
  };
};
