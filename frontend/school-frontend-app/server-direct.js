/**
 * Direct Server for React Application
 * 
 * This server ensures that your actual React application is served,
 * not any static placeholder.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with relaxed CSP for React app
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:", "wss:", "ws:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Frontend server is running' });
});

// API proxy for local development
app.use('/api', (req, res) => {
  res.redirect(`https://misty-roby-haizard-17a53e2a.koyeb.app${req.originalUrl}`);
});

// For any request that doesn't match a static file, send the index.html
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'build', 'index.html');
  
  // Check if index.html exists
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('Error: index.html not found in build directory');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving React application from ${path.join(__dirname, 'build')}`);
  
  // List files in build directory for debugging
  try {
    const files = fs.readdirSync(path.join(__dirname, 'build'));
    console.log('Files in build directory:', files);
    
    if (fs.existsSync(path.join(__dirname, 'build', 'index.html'))) {
      console.log('index.html exists in build directory');
    } else {
      console.error('WARNING: index.html does not exist in build directory!');
    }
  } catch (error) {
    console.error('Error listing build directory:', error.message);
  }
});
