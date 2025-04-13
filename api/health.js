// Health check API endpoint
const { MongoClient } = require('mongodb');

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

  // Check database connection if MONGODB_URI is provided
  let dbStatus = 'Not checked';
  if (process.env.MONGODB_URI) {
    try {
      const client = new MongoClient(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000 // 5 second timeout
      });
      await client.connect();
      await client.db().admin().ping();
      await client.close();
      dbStatus = 'Connected';
    } catch (error) {
      dbStatus = `Error: ${error.message}`;
    }
  } else {
    dbStatus = 'No MONGODB_URI provided';
  }

  // Return health status
  return res.status(200).json({
    status: 'ok',
    message: 'API is running on Vercel',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: dbStatus,
    serverTime: new Date().toLocaleTimeString()
  });
};
