exports.handler = async function(event, context) {
  // Log the request for debugging
  console.log('Mock login request:', event.path, event.httpMethod);

  // Always return a successful login response regardless of the input
  return {
    statusCode: 200,
    body: JSON.stringify({
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIwLCJleHAiOjE2MTYyNDg2MjB9.7M8V3XFjTRRrKDYLT5a9xIb0jLDTGMBIGGSLIL9pMTo',
      user: {
        id: '123',
        username: 'admin',
        email: 'admin@example.com',
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
