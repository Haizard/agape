const axios = require('axios');

exports.handler = async function(event, context) {
  // Log request details for debugging
  console.log('Request Path:', event.path);
  console.log('HTTP Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers));
  console.log('Query Parameters:', JSON.stringify(event.queryStringParameters));
  console.log('Body:', event.body);

  // Get the path without the function prefix
  const path = event.path.replace('/.netlify/functions/proxy', '');
  
  // Construct the full URL to the backend API
  const url = `https://agape-seminary-school.onrender.com/api${path}`;
  console.log('Proxying request to:', url);
  
  try {
    // Set up headers for the request to the backend
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Forward authorization header if present
    if (event.headers.authorization) {
      headers['Authorization'] = event.headers.authorization;
    }
    
    // Parse the request body if it exists
    const body = event.body ? JSON.parse(event.body) : null;
    
    // Forward the request to the backend API
    const response = await axios({
      method: event.httpMethod,
      url: url,
      headers: headers,
      data: body,
      params: event.queryStringParameters
    });
    
    // Return the response from the backend API
    return {
      statusCode: response.status,
      body: JSON.stringify(response.data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  } catch (error) {
    console.error('Error proxying request:', error);
    
    // Return the error response
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        message: error.response?.data?.message || 'Internal Server Error',
        error: error.message
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }
};
