const axios = require('axios');

// The API base URL
const API_BASE_URL = 'https://agape-seminary-school-backend.koyeb.app/api';

exports.handler = async function(event, context) {
  // Log the request details
  console.log('Request Path:', event.path);
  console.log('HTTP Method:', event.httpMethod);
  console.log('Query Parameters:', event.queryStringParameters);

  // Get the path without the function prefix
  const path = event.path.replace('/.netlify/functions/api', '');

  // Construct the full URL to the backend API
  const url = `${API_BASE_URL}${path}`;
  console.log('Proxying request to:', url);

  try {
    // Forward the request to the backend API
    const response = await axios({
      method: event.httpMethod,
      url: url,
      data: event.body ? JSON.parse(event.body) : {},
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(event.headers.authorization && { 'Authorization': event.headers.authorization }),
      },
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
    // Log the error
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
