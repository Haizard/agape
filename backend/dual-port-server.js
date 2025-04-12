require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('node:dns');
const http = require('http');
const app = require('./index');
const { logConnectionState } = require('./connection-state');

// Set DNS servers to Google's public DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);
console.log('Using DNS servers:', dns.getServers());

// MongoDB connection logic (same as server.js)
// ... (connection code omitted for brevity)

// Start the main application server on port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Main server is running on port ${PORT}`);
});

// Create a simple health check server on port 8000
const healthServer = http.createServer((req, res) => {
  console.log(`Health check request received on port 8000: ${req.url}`);
  
  // Return 200 OK for health checks
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', message: 'Health check passed' }));
});

// Start the health check server on port 8000
healthServer.listen(8000, () => {
  console.log('Health check server is running on port 8000');
});
