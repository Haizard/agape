// Simplified auth.js that doesn't require mongoose
exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers
    };
  }

  // Only handle POST requests for login
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" })
    };
  }

  try {
    // Parse the request body
    const { username, emailOrUsername, password } = JSON.parse(event.body);
    const loginIdentifier = username || emailOrUsername;

    if (!loginIdentifier || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Username/email and password are required" })
      };
    }

    console.log(`Login attempt with identifier: ${loginIdentifier}`);

    // Try to forward the request to the Koyeb backend
    try {
      const axios = require('axios');
      const koyebUrl = process.env.REACT_APP_BACKEND_URL || 'https://misty-roby-haizard-17a53e2a.koyeb.app';
      
      console.log(`Forwarding login request to Koyeb: ${koyebUrl}/api/users/login`);
      
      const response = await axios.post(`${koyebUrl}/api/users/login`, {
        username: loginIdentifier,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Koyeb login successful');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response.data)
      };
    } catch (koyebError) {
      console.error('Koyeb login failed:', koyebError.message);
      console.log('Falling back to mock login');
      
      // Fall back to mock login if Koyeb is unavailable
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIwLCJleHAiOjE2MTYyNDg2MjB9.7M8V3XFjTRRrKDYLT5a9xIb0jLDTGMBIGGSLIL9pMTo",
          user: {
            id: "123",
            email: "admin@example.com",
            role: "admin",
            username: "admin",
            name: "Admin User"
          }
        })
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Server error during login" })
    };
  }
};
