// Simple Express server that listens on port 8000
const express = require('express');
const app = express();

// Health check endpoint
app.get('*', (req, res) => {
  console.log(`Health check request received: ${req.url}`);
  res.status(200).json({ status: 'ok', message: 'Health check passed' });
});

// Start the server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Health check server is running on port ${PORT}`);
});
