const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

// Get API configuration based on environment
function getApiConfig() {
  const isDev = process.env.NODE_ENV === 'development';
  const config = {
    target: isDev ? 'http://localhost:5000' : 'https://agape-render.onrender.com',
    changeOrigin: true,
    secure: !isDev,
    pathRewrite: {
      '^/api/api/': '/api/', // Fix double /api/ issue
      '^/api': '/api'
    },
    onProxyReq: (proxyReq, req) => {
      // Add correlation ID for request tracking
      const correlationId = Math.random().toString(36).substring(7);
      proxyReq.setHeader('X-Correlation-ID', correlationId);
      console.log(`[API Proxy] ${req.method} ${req.path} -> ${proxyReq.path} (${correlationId})`);
    },
    onProxyRes: (proxyRes, req) => {
      // Log response status
      console.log(`[API Proxy] ${req.method} ${req.path} -> ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error('[API Proxy] Error:', err);
      res.writeHead(500, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify({
        message: 'Proxy Error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
      }));
    }
  };

  return config;
}

module.exports = function(app) {
  const apiConfig = getApiConfig();
  
  // Add security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  // API proxy middleware
  app.use(
    '/api',
    createProxyMiddleware({
      ...apiConfig,
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
    })
  );

  // Log proxy configuration on startup
  console.log('[API Proxy] Configuration:', {
    target: apiConfig.target,
    environment: process.env.NODE_ENV
  });
};
