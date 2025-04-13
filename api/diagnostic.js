// Diagnostic API endpoint
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Only handle GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Return detailed diagnostic information
  return res.status(200).json({
    status: 'ok',
    message: 'Diagnostic API is running',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime() + ' seconds'
    },
    request: {
      url: req.url,
      method: req.method,
      headers: req.headers,
      query: req.query
    },
    vercel: {
      region: process.env.VERCEL_REGION || 'unknown',
      environment: process.env.VERCEL_ENV || 'unknown',
      url: process.env.VERCEL_URL || 'unknown'
    },
    envVars: {
      jwtSecretSet: process.env.JWT_SECRET ? 'yes' : 'no',
      jwtRefreshSecretSet: process.env.JWT_REFRESH_SECRET ? 'yes' : 'no',
      mongodbUriSet: process.env.MONGODB_URI ? 'yes' : 'no'
    }
  });
};
