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
      console.log('Allowing request with no origin');
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
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma',
    'Expires',
    'expires',
    'Content-Disposition'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization', 'Content-Disposition'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Open CORS options for critical routes (like login and file uploads)
const openCorsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma',
    'Expires',
    'expires',
    'Content-Disposition'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization', 'Content-Disposition'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Create middleware functions
const standardCors = cors(corsOptions);
const openCors = cors(openCorsOptions);

// Middleware to handle CORS preflight requests
const handlePreflight = (req, res, next) => {
  const origin = req.headers.origin;
  const requestHeaders = req.headers['access-control-request-headers'];

  // Log detailed information about the request
  console.log(`CORS Request: ${req.method} ${req.originalUrl}`);
  console.log(`Origin: ${origin || 'No origin'}`);
  console.log(`Requested Headers: ${requestHeaders || 'None'}`);

  // Always set CORS headers for development
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, Expires, expires');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours

  console.log('CORS headers set for request');
  console.log('Allowed headers:', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, Expires, expires');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log(`OPTIONS preflight request for ${req.originalUrl} - responding with 204 No Content`);
    return res.sendStatus(204);
  }

  next();
};

// Log CORS configuration on module load
console.log('✅ CORS middleware configuration loaded');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
console.log(`Allowed headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, Expires, expires`);

module.exports = {
  standardCors,
  openCors,
  handlePreflight,
  allowedOrigins
};
