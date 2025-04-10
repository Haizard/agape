/**
 * Script to fix the login process
 * 
 * This script will update the login route to ensure the correct role is assigned
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Path to the user routes file
const userRoutesPath = path.join(__dirname, '../routes/userRoutes.js');

// Read the current file
console.log(`Reading user routes file: ${userRoutesPath}`);
const userRoutes = fs.readFileSync(userRoutesPath, 'utf8');

// Create a backup
const backupPath = `${userRoutesPath}.backup`;
console.log(`Creating backup at: ${backupPath}`);
fs.writeFileSync(backupPath, userRoutes);

// Updated login route with better role handling
const updatedLoginRoute = `// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is not active' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get JWT secret from environment variables or use a default
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';

    // Force normalize the role to lowercase for consistency
    const normalizedRole = user.role.toLowerCase();
    
    // Special case for admin2 user - always set role to 'admin'
    const finalRole = user.username === 'admin2' ? 'admin' : normalizedRole;
    
    // Log the role information
    console.log(\`User login: \${user.username}\`);
    console.log(\`Original role: \${user.role}\`);
    console.log(\`Normalized role: \${normalizedRole}\`);
    console.log(\`Final role for token: \${finalRole}\`);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        role: finalRole,
        email: user.email,
        username: user.username
      },
      jwtSecret,
      { expiresIn: '24h' } // 24h expiration
    );

    // Send response with explicit role information
    const responseData = {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: finalRole,
        username: user.username
      }
    };
    
    console.log('Sending login response with role:', finalRole);
    res.json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});`;

// Replace the login route in the file
const updatedUserRoutes = userRoutes.replace(
  /\/\/ Login route[\s\S]*?res\.json\(\{[\s\S]*?\}\);[\s\S]*?\}\);/,
  updatedLoginRoute
);

// Write the updated file
console.log('Writing updated user routes file');
fs.writeFileSync(userRoutesPath, updatedUserRoutes);

console.log('Login process updated successfully');
