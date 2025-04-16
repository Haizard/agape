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
        } else {
          console.warn('No Authorization header found in request');
        }
      }
    })
  );
};
