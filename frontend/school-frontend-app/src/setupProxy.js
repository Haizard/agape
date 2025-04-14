const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to the backend server
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'https://agape-render.onrender.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // No rewrite needed
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
      }
    })
  );
};
