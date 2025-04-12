const https = require('https');

exports.handler = async function(event, context) {
  // Get the path without the function prefix
  const path = event.path.replace('/.netlify/functions/proxy', '');

  // Construct the full URL to the backend API
  const url = `https://agape-seminary-school.onrender.com/api${path}`;

  return new Promise((resolve, reject) => {
    const options = {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Forward authorization header if present
    if (event.headers.authorization) {
      options.headers['Authorization'] = event.headers.authorization;
    }

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: body,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          }
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        }
      });
    });

    // Send the request body if it exists
    if (event.body) {
      req.write(event.body);
    }

    req.end();
  });
};
