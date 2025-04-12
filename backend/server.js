require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('node:dns');
const app = require('./index');
const { logConnectionState } = require('./connection-state');
const assignmentRoutes = require('./routes/assignmentRoutes');

// Set DNS servers to Google's public DNS
// This can help with DNS resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Log DNS servers for debugging
console.log('Using DNS servers:', dns.getServers());

const MAX_RETRIES = 10; // Increased from 5 to 10
let retryCount = 0;

// Add a direct connection string as a fallback
// You'll need to add this to your .env file
// Format: mongodb://username:password@host1:port1,host2:port2,host3:port3/database?options
if (!process.env.MONGODB_DIRECT_URI && process.env.MONGODB_URI) {
  try {
    // Try to generate a direct URI from the SRV URI if not provided
    // This is a simple transformation and might not work for all connection strings
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
            // This is a common pattern for Atlas clusters
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
    // Set up mock data here if needed
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
        serverSelectionTimeoutMS: 30000,      // Increased timeout for server selection
        socketTimeoutMS: 60000,               // Increased timeout for socket operations
        family: 4,                            // Force IPv4 only
        maxPoolSize: 20,                      // Increased pool size for more connections
        minPoolSize: 5,                       // Maintain at least 5 socket connections
        retryWrites: true,                    // Retry write operations if they fail
        retryReads: true,                     // Retry read operations if they fail
        w: 'majority',                        // Write to primary and at least one secondary
        readPreference: 'primaryPreferred',   // Prefer primary but allow secondary reads
        maxIdleTimeMS: 60000,                 // Increased idle time before closing connections
        heartbeatFrequencyMS: 10000,          // Check server status every 10 seconds
        autoIndex: false,                     // Don't build indexes automatically in production
        bufferCommands: true,                 // Enable command buffering when disconnected
        connectTimeoutMS: 30000               // Increased timeout for initial connection
      };
      console.log('Using SRV URI configuration (no directConnection)');
    } else {
      // Standard URI options (can use directConnection)
      options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,      // Increased timeout for server selection
        socketTimeoutMS: 60000,               // Increased timeout for socket operations
        family: 4,                            // Force IPv4 only
        maxPoolSize: 20,                      // Increased pool size for more connections
        minPoolSize: 5,                       // Maintain at least 5 socket connections
        retryWrites: true,                    // Retry write operations if they fail
        retryReads: true,                     // Retry read operations if they fail
        w: 'majority',                        // Write to primary and at least one secondary
        readPreference: 'primaryPreferred',   // Prefer primary but allow secondary reads
        maxIdleTimeMS: 60000,                 // Increased idle time before closing connections
        heartbeatFrequencyMS: 10000,          // Check server status every 10 seconds
        autoIndex: false,                     // Don't build indexes automatically in production
        bufferCommands: true,                 // Enable command buffering when disconnected
        connectTimeoutMS: 30000,              // Increased timeout for initial connection
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
          // Direct connection is safe here because we're using a standard URI
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
        // Don't exit the process, just log the error
        // process.exit(1);
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
    // Use an exponential backoff strategy with jitter to prevent thundering herd
    const baseBackoff = 5000 * (1.5 ** Math.min(retryCount, 10));
    const jitter = Math.random() * 2000; // Add up to 2 seconds of random jitter
    const backoffTime = Math.min(baseBackoff + jitter, 60000); // Max 60 seconds

    console.log(`Will attempt reconnection in ${Math.round(backoffTime/1000)} seconds (retry ${retryCount + 1})`);

    // Clear any existing reconnection timers
    if (global.reconnectTimer) {
      clearTimeout(global.reconnectTimer);
    }

    // Set a new reconnection timer
    global.reconnectTimer = setTimeout(() => {
      // Increment retry count here to track total reconnection attempts
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

let PORT = Number.parseInt(process.env.PORT, 10) || 5000; // Default port is 5000
if (PORT < 1 || PORT > 65535) {
  console.error('Invalid port number. Using default port 5000.');
  PORT = 5000;
}
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Create a simple health check server on port 8000
const http = require('node:http');
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

app.use('/api/assignments', assignmentRoutes);

// Handle process termination
process.on('SIGINT', async () => {
  try {
    console.log('Shutting down server...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    // Add any other cleanup here if needed
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

