// Authentication API endpoint
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// MongoDB connection
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your-mongodb-uri';
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    await mongoose.connect(MONGODB_URI, options);
    isConnected = true;
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

// User model schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student'], default: 'student' },
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Create or get the User model
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Only handle POST requests for login
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Connect to the database
    await connectToDatabase();
    
    const { username, emailOrUsername, password } = req.body;
    const loginIdentifier = username || emailOrUsername;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: 'Username/email and password are required' });
    }

    console.log(`Attempting login with identifier: ${loginIdentifier}`);

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: loginIdentifier },
        { email: loginIdentifier }
      ]
    });

    if (!user) {
      // For demo/development, provide a fallback admin user
      if (process.env.NODE_ENV !== 'production' && 
          (loginIdentifier === 'admin' || loginIdentifier === 'admin@example.com') && 
          password === 'admin123') {
        
        console.log('Using fallback admin user for development');
        
        // Generate JWT token for fallback admin
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
        
        // Send response with fallback admin
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
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`User ${user.username} found with role: ${user.role}`);

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        username: user.username
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Send response
    return res.status(200).json({
      token,
      user: {
        id: user._id,
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
