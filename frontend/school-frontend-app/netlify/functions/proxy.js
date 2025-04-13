const https = require('https');
const url = require('url');

exports.handler = async function(event, context) {
  // Log the request for debugging
  console.log('Request path:', event.path);
  console.log('Request method:', event.httpMethod);
  console.log('Request headers:', JSON.stringify(event.headers));

  // Get the path without the function prefix
  const path = event.path.replace('/.netlify/functions/proxy', '');

  // Construct the full URL to the backend API
  const apiUrl = `https://agape-seminary-school.onrender.com/api${path}`;
  console.log('Proxying to:', apiUrl);

  try {
    // Parse the URL
    const parsedUrl = new url.URL(apiUrl);

    // Set up the request options
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Forward authorization header if present
    if (event.headers.authorization) {
      options.headers['Authorization'] = event.headers.authorization;
    }

    // Make the request to the backend API
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: body,
            headers: res.headers
          });
        });
      });

      req.on('error', (error) => {
        console.error('Error making request:', error);
        reject(error);
      });

      // Send the request body if it exists
      if (event.body) {
        req.write(event.body);
      }

      req.end();
    });

    // Return the response with CORS headers
    return {
      statusCode: response.statusCode,
      body: response.body,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  } catch (error) {
    console.error('Error in proxy function:', error);

    // Return an error response
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }
};
