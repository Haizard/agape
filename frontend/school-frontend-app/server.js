const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://*"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:", "https://*"],
      imgSrc: ["'self'", "data:", "https://*", "http://*"],
      connectSrc: ["'self'", "https://*", "http://*", "wss://*", "ws://*"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// API proxy middleware
const apiProxy = createProxyMiddleware('/api', {
  target: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
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
  }
});

// Use the API proxy middleware
app.use('/api', apiProxy);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Frontend server is running' });
});

// For any request that doesn't match a static file, send the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
