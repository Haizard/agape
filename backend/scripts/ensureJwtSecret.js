/**
 * Script to ensure JWT secret is properly set
 * 
 * This script checks if JWT_SECRET is set in the environment
 * and updates the .env file if needed.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Path to .env file
const envPath = path.join(__dirname, '..', '.env');

// Check if .env file exists
const envExists = fs.existsSync(envPath);

// Generate a secure random string for JWT secret
function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// Main function
async function ensureJwtSecret() {
  console.log('Checking JWT secret configuration...');
  
  // Check if JWT_SECRET is already set in environment
  if (process.env.JWT_SECRET) {
    console.log('JWT_SECRET is already set in environment.');
    
    // Check if the secret is the default fallback value
    if (process.env.JWT_SECRET === 'kjjf6565i87utgfu64erd') {
      console.log('WARNING: Using default fallback JWT_SECRET. This is not secure for production!');
      console.log('Generating a new secure JWT_SECRET...');
      
      // Generate a new secure secret
      const newSecret = generateSecureSecret();
      
      // Update the .env file
      updateEnvFile('JWT_SECRET', newSecret);
      
      console.log('JWT_SECRET has been updated with a secure value.');
    }
    
    return;
  }
  
  console.log('JWT_SECRET is not set in environment.');
  
  // Generate a new secure secret
  const newSecret = generateSecureSecret();
  
  // Update or create the .env file
  updateEnvFile('JWT_SECRET', newSecret);
  
  console.log('JWT_SECRET has been set with a secure value.');
}

// Function to update the .env file
function updateEnvFile(key, value) {
  try {
    let envContent = '';
    
    // Read existing .env file if it exists
    if (envExists) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if the key already exists in the file
      const regex = new RegExp(`^${key}=.*$`, 'm');
      
      if (regex.test(envContent)) {
        // Replace existing key
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Add new key
        envContent += `\n${key}=${value}`;
      }
    } else {
      // Create new .env file with the key
      envContent = `${key}=${value}\n`;
    }
    
    // Write to .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log(`Updated ${key} in .env file.`);
  } catch (error) {
    console.error('Error updating .env file:', error);
  }
}

// Run the function
ensureJwtSecret()
  .then(() => {
    console.log('JWT secret check completed.');
  })
  .catch(err => {
    console.error('Error ensuring JWT secret:', err);
  });
