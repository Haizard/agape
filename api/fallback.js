// Fallback API endpoint for other routes
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Extract the path from the request
  const path = req.url.replace(/^\/api\//, '');
  
  // Return a fallback response
  return res.status(200).json({
    message: `API endpoint for ${path} is not yet implemented in serverless mode`,
    requestMethod: req.method,
    path: path,
    timestamp: new Date().toISOString(),
    note: 'This is a fallback response for development purposes'
  });
};
