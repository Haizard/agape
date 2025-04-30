const { createProxyMiddleware } = require('http-proxy-middleware');

// Single source of truth for API configuration
const getApiConfig = () => {
  const isLocalDevelopment = process.env.NODE_ENV === 'development';
  const apiUrl = isLocalDevelopment
    ? 'http://localhost:5000'
    : (process.env.REACT_APP_API_URL || 'https://agape-render.onrender.com');

  return {
    baseUrl: apiUrl,
    prefix: '/api',
    isLocalDevelopment
  };
};

module.exports = function(app) {
  const apiConfig = getApiConfig();
  console.log(`API Configuration:`);
  console.log(`- Base URL: ${apiConfig.baseUrl}`);
  console.log(`- API Prefix: ${apiConfig.prefix}`);
  console.log(`- Environment: ${apiConfig.isLocalDevelopment ? 'Development' : 'Production'}`);

  // Proxy middleware configuration
  const proxyConfig = {
    target: apiConfig.baseUrl,
    changeOrigin: true,
    secure: !apiConfig.isLocalDevelopment,
    pathRewrite: {
      [`^${apiConfig.prefix}`]: apiConfig.prefix
    },
    logLevel: apiConfig.isLocalDevelopment ? 'debug' : 'error',
    onError: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.writeHead(500, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify({
        error: 'Proxy Error',
        message: 'Unable to connect to the backend server',
        details: apiConfig.isLocalDevelopment ? err.message : 'Internal Server Error'
      }));
    },
    onProxyReq: (proxyReq, req, res) => {
      // Forward authorization header
      const authHeader = req.headers.authorization;
      if (authHeader) {
        proxyReq.setHeader('Authorization', authHeader);
      }

      // Add request ID for tracking
      const requestId = Math.random().toString(36).substring(7);
      proxyReq.setHeader('X-Request-ID', requestId);
      console.log(`[${requestId}] Proxying ${req.method} ${req.path} to ${apiConfig.baseUrl}`);

      // Handle request body if present
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      const requestId = req.headers['x-request-id'];
      console.log(`[${requestId}] Proxy response: ${proxyRes.statusCode}`);

      // Add security headers
      proxyRes.headers['X-Content-Type-Options'] = 'nosniff';
      proxyRes.headers['X-Frame-Options'] = 'SAMEORIGIN';
      proxyRes.headers['X-XSS-Protection'] = '1; mode=block';

      // Add CORS headers in development
      if (apiConfig.isLocalDevelopment) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      }
    }
  };

  // Apply proxy middleware
  app.use(apiConfig.prefix, createProxyMiddleware(proxyConfig));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      environment: apiConfig.isLocalDevelopment ? 'development' : 'production',
      apiUrl: apiConfig.baseUrl
    });
  });
};
