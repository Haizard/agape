/**
 * Custom CORS middleware for handling cross-origin requests
 */
const cors = require('cors');

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://st-john-vianey-frontend.onrender.com',
  'https://agape-seminary-school-system.onrender.com',
  'https://agape-seminary-school.onrender.com',
  'https://agape-seminary-school-frontend.onrender.com',
  'https://agape-seminary-school-system.netlify.app',
  'https://agape-seminary-school-backend.koyeb.app',
  'https://misty-roby-haizard-17a53e2a.koyeb.app',
  'https://agape-school-system.onrender.com',
  'https://agape-render.onrender.com',
  'https://agape-seminary-school.onrender.com',
];

// Add any origins from environment variable
if (process.env.CORS_ALLOWED_ORIGINS) {
  try {
    const envOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    console.log('Adding origins from environment variable:', envOrigins);
    allowedOrigins.push(...envOrigins);
  } catch (error) {
    console.error('Error parsing CORS_ALLOWED_ORIGINS:', error);
  }
}

// Standard CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) === -1) {
      // For development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        console.log('Development mode: Allowing origin:', origin);
        return callback(null, true);
      }

      console.log('Blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }

    console.log('Allowed origin:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma'],
};

// Open CORS options for critical routes (like login)
const openCorsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Create middleware functions
const standardCors = cors(corsOptions);
const openCors = cors(openCorsOptions);

// Middleware to handle CORS preflight requests
const handlePreflight = (req, res, next) => {
  // Set CORS headers for preflight requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log(`OPTIONS request for ${req.originalUrl} received`);
    return res.sendStatus(204);
  }

  next();
};

module.exports = {
  standardCors,
  openCors,
  handlePreflight,
  allowedOrigins
};
