const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Determine the backend URL - use localhost:5000 for local development
  const isLocalDevelopment = process.env.NODE_ENV === 'development';
  const backendUrl = isLocalDevelopment
    ? 'http://localhost:5000'
    : (process.env.REACT_APP_API_URL || 'https://agape-render.onrender.com');

  console.log(`Setting up proxy to: ${backendUrl}`);
  console.log(`Local development mode: ${isLocalDevelopment ? 'Yes' : 'No'}`);

  // Proxy API requests to the backend server
  app.use(
    '/api',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // No rewrite needed if backend expects /api prefix
      },
      // Log proxy activity
      logLevel: 'debug',
      // Handle proxy errors
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({
          error: 'Proxy error',
          message: 'Could not connect to the backend server',
          details: err.message
        }));
      },
      // Add custom headers
      onProxyReq: (proxyReq, req, res) => {
        // Add a custom header to identify proxy requests
        proxyReq.setHeader('X-Proxied-By', 'setupProxy.js');

        // Forward the authorization header if present
        const authHeader = req.headers.authorization;
        if (authHeader) {
          console.log('Forwarding Authorization header to backend');
          proxyReq.setHeader('Authorization', authHeader);

          // Log the token format (without exposing the full token)
          const tokenPreview = authHeader.length > 20
            ? `${authHeader.substring(0, 10)}...${authHeader.substring(authHeader.length - 5)}`
            : '[INVALID TOKEN FORMAT]';
          console.log(`Token format: ${tokenPreview}`);
        } else {
          console.warn('No Authorization header found in request');

          // Add a default admin token for testing purposes
          // WARNING: This is for development only and should be removed in production
          if (isLocalDevelopment) {
            const defaultToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZTJiZjJlNzM5YzJjMDAyMjY4ZjEyMyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTYyNTQ5MjMzNCwiZXhwIjoxNjI1NTc4NzM0fQ.7B-qhNvHxwPzBlgYpF-lZ1wHZFZO7UiU2UQVIwfmD5A';
            console.log('Adding default admin token for development');
            proxyReq.setHeader('Authorization', defaultToken);
          }
        }

        // Add CORS headers
        proxyReq.setHeader('Access-Control-Allow-Origin', '*');
        proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        proxyReq.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      },

      // Handle proxy response
      onProxyRes: (proxyRes, req, res) => {
        // Log response status
        console.log(`Proxy response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);

        // Add CORS headers to response
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
      }
    })
  );
};
