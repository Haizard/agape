/**
 * Script to fix JWT verification
 * 
 * This script will update the auth middleware to properly handle role verification
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Path to the auth middleware file
const authMiddlewarePath = path.join(__dirname, '../middleware/auth.js');

// Read the current file
console.log(`Reading auth middleware file: ${authMiddlewarePath}`);
const authMiddleware = fs.readFileSync(authMiddlewarePath, 'utf8');

// Create a backup
const backupPath = `${authMiddlewarePath}.backup`;
console.log(`Creating backup at: ${backupPath}`);
fs.writeFileSync(backupPath, authMiddleware);

// Updated authorizeRole function with better role handling
const updatedAuthorizeRole = `const authorizeRole = (roles) => {
  return (req, res, next) => {
    console.log('Authorizing role...');
    console.log('User:', req.user);
    console.log('Required roles:', roles);

    // Convert to array if a single role is provided
    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    // Check if user and role exist
    if (!req.user) {
      console.log('User not found in request');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!req.user.role) {
      console.log('User role not found in request');
      return res.status(403).json({ message: 'Unauthorized: User role not found' });
    }

    // Normalize roles for case-insensitive comparison
    const userRole = req.user.role.toLowerCase();
    const normalizedRoles = roles.map(role => role.toLowerCase());
    
    console.log(\`User role (normalized): \${userRole}\`);
    console.log(\`Required roles (normalized): \${normalizedRoles.join(', ')}\`);
    
    // Check if user's role is in the required roles
    if (!normalizedRoles.includes(userRole)) {
      console.log(\`User role \${userRole} not in required roles: \${normalizedRoles.join(', ')}\`);
      return res.status(403).json({
        message: \`Unauthorized: Required role(s): \${roles.join(', ')}, your role: \${req.user.role}\`
      });
    }

    console.log('Authorization successful for role:', req.user.role);
    next();
  };
};`;

// Replace the authorizeRole function in the file
const updatedAuthMiddleware = authMiddleware.replace(
  /const authorizeRole = \(roles\) => {[\s\S]*?};/,
  updatedAuthorizeRole
);

// Write the updated file
console.log('Writing updated auth middleware file');
fs.writeFileSync(authMiddlewarePath, updatedAuthMiddleware);

console.log('Auth middleware updated successfully');
