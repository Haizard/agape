# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# 1. Create a proper vercel.json for unified deployment
$vercelConfigContent = @'
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/school-frontend-app/build",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ],
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
'@

Set-Content -Path "vercel.json" -Value $vercelConfigContent

# 2. Update the root package.json for unified build
$rootPackageJsonContent = @'
{
  "name": "agape-school-system",
  "version": "1.0.0",
  "description": "Agape Seminary School Management System",
  "private": true,
  "scripts": {
    "build": "cd frontend/school-frontend-app && npm install --legacy-peer-deps && npm run build",
    "start": "vercel dev",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^7.0.3"
  },
  "engines": {
    "node": "18.x"
  }
}
'@

Set-Content -Path "package.json" -Value $rootPackageJsonContent

# 3. Create a simple API health check endpoint
$healthApiContent = @'
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
'@

Set-Content -Path "api/health.js" -Value $healthApiContent

# 4. Create a simple API index endpoint
$indexApiContent = @'
// Root API endpoint
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

  // Return API info
  return res.status(200).json({
    status: 'ok',
    message: 'Agape Seminary School API',
    endpoints: [
      '/api/health',
      '/api/auth'
    ],
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
};
'@

Set-Content -Path "api/index.js" -Value $indexApiContent

# 5. Create a simple auth API endpoint
$authApiContent = @'
// Authentication API endpoint
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

// MongoDB connection
async function connectToDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await client.connect();
  return client;
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Only handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, emailOrUsername, password } = req.body;
    const loginIdentifier = username || emailOrUsername;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: 'Username/email and password are required' });
    }

    // For development/testing, allow a test user
    if (process.env.NODE_ENV !== 'production' && 
        (loginIdentifier === 'admin' || loginIdentifier === 'admin@example.com') && 
        password === 'admin123') {
      
      const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
      const token = jwt.sign(
        {
          userId: '123456789012',
          role: 'admin',
          email: 'admin@example.com',
          username: 'admin'
        },
        jwtSecret,
        { expiresIn: '24h' }
      );
      
      return res.status(200).json({
        token,
        user: {
          id: '123456789012',
          email: 'admin@example.com',
          role: 'admin',
          username: 'admin',
          name: 'Admin User'
        }
      });
    }

    // Connect to database for real users
    const client = await connectToDatabase();
    const db = client.db();
    const usersCollection = db.collection('users');

    // Find user by username or email
    const user = await usersCollection.findOne({
      $or: [
        { username: loginIdentifier },
        { email: loginIdentifier }
      ]
    });

    if (!user) {
      await client.close();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await client.close();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
        username: user.username
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    await client.close();
    
    // Send response
    return res.status(200).json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        username: user.username,
        name: user.name || user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};
'@

Set-Content -Path "api/auth.js" -Value $authApiContent

# 6. Create a README with deployment instructions
$readmeContent = @'
# Vercel Unified Deployment Guide

This project is configured for unified deployment on Vercel, with both frontend and backend components hosted on the same platform.

## Deployment Steps

1. **Sign up for Vercel**:
   - Go to [vercel.com](https://vercel.com) and create an account

2. **Install Vercel CLI** (optional for local development):
   ```
   npm install -g vercel
   ```

3. **Deploy to Vercel**:
   - Via GitHub: Connect your GitHub repository in the Vercel dashboard
   - Via CLI: Run `vercel` in the project directory

4. **Set Environment Variables**:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT token generation
   - `JWT_REFRESH_SECRET`: Secret key for JWT refresh token generation

## Project Structure

- `/frontend/school-frontend-app`: React frontend application
- `/api`: Serverless API functions for Vercel
- `/backend`: Original backend code (reference only)

## API Endpoints

- `/api/health`: Health check endpoint
- `/api/auth`: Authentication endpoint
- `/api`: Root API information

## Local Development

1. **Install dependencies**:
   ```
   npm install
   cd frontend/school-frontend-app
   npm install --legacy-peer-deps
   ```

2. **Run development server**:
   ```
   vercel dev
   ```

## Troubleshooting

- **API Connection Issues**: Verify environment variables are set correctly
- **Build Failures**: Check Vercel build logs for specific errors
- **Database Connection**: Ensure MongoDB URI is correct and accessible

## Automatic Updates

Once deployed, any changes pushed to your GitHub repository will automatically trigger a new deployment on Vercel.
'@

Set-Content -Path "VERCEL_UNIFIED_DEPLOYMENT.md" -Value $readmeContent

# 7. Create a .env.example file
$envExampleContent = @'
# Required environment variables for Vercel deployment

# MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT secrets
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

# Environment
NODE_ENV=production
'@

Set-Content -Path ".env.example" -Value $envExampleContent

# 8. Add the changes to git
git add vercel.json package.json api/health.js api/index.js api/auth.js VERCEL_UNIFIED_DEPLOYMENT.md .env.example

# 9. Commit the changes
git commit -m "Set up unified Vercel deployment for both frontend and backend"

# 10. Push the changes to GitHub
git push

Write-Host "Unified Vercel deployment setup pushed to GitHub."
Write-Host "Follow the instructions in VERCEL_UNIFIED_DEPLOYMENT.md to deploy both frontend and backend to Vercel."
Write-Host "Make sure to set the required environment variables in Vercel."
