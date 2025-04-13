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
