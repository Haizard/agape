/**
 * CORS Configuration Middleware
 * 
 * Configures Cross-Origin Resource Sharing (CORS) for Express
 * with environment-specific settings.
 */

// Define CORS configuration based on environment
const configureCors = (app) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Define allowed origins based on environment
  const allowedOrigins = isDevelopment 
    ? ['http://localhost:3000'] // Development origins
    : ['https://your-production-domain.com']; // Production origins
  
  // Log CORS configuration on startup
  console.log(`CORS configured for ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} environment`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  
  // CORS middleware for all routes
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Check if the request origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Expires, Cache-Control, Pragma');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400'); // 24 hours
    }
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      console.log(`Handling OPTIONS preflight request from: ${origin}`);
      return res.status(204).end();
    }
    
    next();
  });
  
  // Log successful CORS setup
  console.log('✅ CORS middleware successfully configured');
};

module.exports = configureCors;
