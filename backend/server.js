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
  // Try to generate a direct URI from the SRV URI if not provided
  // This is a simple transformation and might not work for all connection strings
  const srvUri = process.env.MONGODB_URI;
  if (srvUri.includes('mongodb+srv://')) {
    // Extract parts from the SRV URI
    const withoutProtocol = srvUri.replace('mongodb+srv://', '');
    const authAndRest = withoutProtocol.split('@');
    if (authAndRest.length === 2) {
      const auth = authAndRest[0]; // username:password
      const hostAndDb = authAndRest[1].split('/');
      if (hostAndDb.length >= 1) {
        const host = hostAndDb[0]; // e.g., schoolsystem.mp5ul7f.mongodb.net
        const dbAndOptions = hostAndDb.slice(1).join('/');

        // Create a direct URI using the cluster name
        // This is a guess and might need to be adjusted based on your actual cluster configuration
        const directUri = `mongodb://${auth}@${host.replace('.mongodb.net', '-shard-00-00.mongodb.net')}:27017,${host.replace('.mongodb.net', '-shard-00-01.mongodb.net')}:27017,${host.replace('.mongodb.net', '-shard-00-02.mongodb.net')}:27017/${dbAndOptions ? dbAndOptions : ''}${dbAndOptions && !dbAndOptions.includes('?') ? '?' : '&'}ssl=true&replicaSet=atlas-${host.split('.')[1].substring(0, 6)}&authSource=admin`;

        process.env.MONGODB_DIRECT_URI = directUri;
        console.log('Generated direct connection URI as fallback');
      }
    }
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
    // Enhanced connection options for better resilience
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000,      // Reduced from 30000 to fail faster
      socketTimeoutMS: 45000,               // Close sockets after 45 seconds of inactivity
      family: 4,                            // Force IPv4 only
      maxPoolSize: 10,                      // Maintain up to 10 socket connections
      minPoolSize: 3,                       // Maintain at least 3 socket connections
      retryWrites: true,                    // Retry write operations if they fail
      retryReads: true,                     // Retry read operations if they fail
      w: 'majority',                        // Write to primary and at least one secondary
      readPreference: 'primary',            // Read from primary only (required for transactions)
      maxIdleTimeMS: 30000,                 // Close idle connections after 30 seconds
      heartbeatFrequencyMS: 10000,          // Check server status every 10 seconds
      keepAlive: true,                      // Keep connections alive
      keepAliveInitialDelay: 300000,        // Send keep-alive after 5 minutes
      autoIndex: false,                     // Don't build indexes automatically in production
      bufferCommands: false,                // Disable command buffering when disconnected
      connectTimeoutMS: 10000,              // Timeout for initial connection
      // Uncomment the line below if you want to use a direct connection
      // directConnection: true,            // Use direct connection (bypass srv lookup)
    };

    // Try to connect with the primary connection string
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('Connected to MongoDB Atlas successfully');
    retryCount = 0; // Reset retry count on successful connection
  } catch (err) {
    console.error('MongoDB connection error:', err);

    // If the error is related to DNS resolution, try to use a direct connection string if available
    if (err.code === 'ETIMEOUT' && err.syscall === 'queryTxt' && process.env.MONGODB_DIRECT_URI) {
      try {
        console.log('Attempting to connect using direct connection string...');
        const options = {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 15000,
          socketTimeoutMS: 45000,
          family: 4,
          readPreference: 'primary',  // Read from primary only (required for transactions)
          w: 'majority'               // Write to primary and at least one secondary
        };
        await mongoose.connect(process.env.MONGODB_DIRECT_URI, options);
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
    // Use an exponential backoff strategy
    const backoffTime = Math.min(5000 * (1.5 ** retryCount), 60000); // Max 60 seconds
    console.log(`Will attempt reconnection in ${backoffTime/1000} seconds`);
    setTimeout(connectDB, backoffTime);
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

