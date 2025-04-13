require('dotenv').config();
const express = require('express');
const http = require('http');
const app = require('./index');
const mongoose = require('mongoose');
const dns = require('node:dns');
const { logConnectionState } = require('./connection-state');

// Set DNS servers to Google's public DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);
console.log('Using DNS servers:', dns.getServers());

// MongoDB connection logic
const MAX_RETRIES = 10;
let retryCount = 0;

// Add a direct connection string as a fallback
if (!process.env.MONGODB_DIRECT_URI && process.env.MONGODB_URI) {
  try {
    // Try to generate a direct URI from the SRV URI if not provided
    const srvUri = process.env.MONGODB_URI;
    if (srvUri.includes('mongodb+srv://')) {
      console.log('Generating direct URI from SRV URI as fallback');

      // Extract parts from the SRV URI
      const withoutProtocol = srvUri.replace('mongodb+srv://', '');
      const authAndRest = withoutProtocol.split('@');
      if (authAndRest.length === 2) {
        const auth = authAndRest[0]; // username:password
        const hostAndDb = authAndRest[1].split('/');
        if (hostAndDb.length >= 1) {
          const host = hostAndDb[0]; // e.g., schoolsystem.mp5ul7f.mongodb.net
          const dbAndOptions = hostAndDb.slice(1).join('/');

          // Extract the cluster identifier (usually the second part of the hostname)
          const clusterParts = host.split('.');
          let replicaSetId = 'atlas';
          if (clusterParts.length > 1) {
            // Use the first 6 chars of the second part as the replica set ID
            replicaSetId = `atlas-${clusterParts[1].substring(0, 6)}`;
          }

          // Create a direct URI using the cluster name
          const directUri = `mongodb://${auth}@${host.replace('.mongodb.net', '-shard-00-00.mongodb.net')}:27017,${host.replace('.mongodb.net', '-shard-00-01.mongodb.net')}:27017,${host.replace('.mongodb.net', '-shard-00-02.mongodb.net')}:27017/${dbAndOptions ? dbAndOptions : ''}${dbAndOptions && !dbAndOptions.includes('?') ? '?' : '&'}ssl=true&replicaSet=${replicaSetId}&authSource=admin`;

          process.env.MONGODB_DIRECT_URI = directUri;
          console.log('Successfully generated direct connection URI as fallback');
        }
      }
    }
  } catch (err) {
    console.error('Error generating direct URI:', err);
  }
}

const connectDB = async () => {
  // Check if we should use mock data instead of MongoDB
  if (process.env.USE_MOCK_DATA === 'true') {
    console.log('Using mock data instead of MongoDB connection');
    return;
  }

  try {
    // Check if we're using an SRV connection string
    const isSrvUri = process.env.MONGODB_URI.includes('mongodb+srv://');
    console.log(`Using ${isSrvUri ? 'SRV' : 'standard'} connection string`);

    // Configure connection options based on URI type
    let options;
    if (isSrvUri) {
      // SRV URI options (no directConnection)
      options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        family: 4,
        maxPoolSize: 20,
        minPoolSize: 5,
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        readPreference: 'primaryPreferred',
        maxIdleTimeMS: 60000,
        heartbeatFrequencyMS: 10000,
        autoIndex: false,
        bufferCommands: true,
        connectTimeoutMS: 30000
      };
      console.log('Using SRV URI configuration (no directConnection)');
    } else {
      // Standard URI options (can use directConnection)
      options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        family: 4,
        maxPoolSize: 20,
        minPoolSize: 5,
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        readPreference: 'primaryPreferred',
        maxIdleTimeMS: 60000,
        heartbeatFrequencyMS: 10000,
        autoIndex: false,
        bufferCommands: true,
        connectTimeoutMS: 30000,
        directConnection: process.env.NODE_ENV === 'production'
      };
      console.log('Using standard URI configuration with directConnection:', process.env.NODE_ENV === 'production');
    }

    // Try to connect with the primary connection string
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('Connected to MongoDB Atlas successfully');
    retryCount = 0; // Reset retry count on successful connection
  } catch (err) {
    console.error('MongoDB connection error:', err);

    // Try to use a direct connection string if available for various error types
    const shouldTryDirectConnection = (
      // DNS resolution errors
      (err.code === 'ETIMEOUT' && err.syscall === 'queryTxt') ||
      // SRV record errors
      err.message?.includes('SRV') ||
      // General connection errors
      err.name === 'MongoServerSelectionError' ||
      // Retry count is high
      retryCount > MAX_RETRIES / 2
    ) && process.env.MONGODB_DIRECT_URI;

    if (shouldTryDirectConnection) {
      try {
        console.log('Attempting to connect using direct connection string...');
        const directOptions = {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 60000,
          family: 4,
          readPreference: 'primaryPreferred',
          w: 'majority',
          directConnection: true
        };
        await mongoose.connect(process.env.MONGODB_DIRECT_URI, directOptions);
        console.log('Connected to MongoDB using direct connection string');
        retryCount = 0; // Reset retry count on successful connection
        return; // Exit the function if direct connection succeeds
      } catch (directErr) {
        console.error('Direct connection failed:', directErr);
      }
    }

    // Standard retry logic
    if (!mongoose.connection.readyState) {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Retrying connection (Attempt ${retryCount}/${MAX_RETRIES}) in 5 seconds...`);
        setTimeout(connectDB, 5000);
      } else {
        console.error('Max retry attempts reached. Unable to connect to MongoDB.');
      }
    }
  }
};

// Initial connection
connectDB();

// Connection event handlers
mongoose.connection.on('connecting', () => {
  console.log('Connecting to MongoDB...');
  logConnectionState();
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
  logConnectionState();
});

mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
  logConnectionState();
  if (!mongoose.connection.readyState) {
    console.log('Attempting to reconnect...');
    const baseBackoff = 5000 * (1.5 ** Math.min(retryCount, 10));
    const jitter = Math.random() * 2000;
    const backoffTime = Math.min(baseBackoff + jitter, 60000);

    console.log(`Will attempt reconnection in ${Math.round(backoffTime/1000)} seconds (retry ${retryCount + 1})`);

    if (global.reconnectTimer) {
      clearTimeout(global.reconnectTimer);
    }

    global.reconnectTimer = setTimeout(() => {
      retryCount++;
      connectDB();
    }, backoffTime);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  try {
    logConnectionState();
  } catch (logError) {
    console.error('Error logging connection state:', logError);
  }
});

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

// Handle process termination
process.on('SIGINT', async () => {
  try {
    console.log('Shutting down servers...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});
