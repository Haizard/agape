// Direct installation script for Netlify Functions dependencies
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Installing dependencies for Netlify Functions...');

// Path to the functions directory
const functionsDir = path.join(__dirname, '..', 'netlify', 'functions');

// Check if the functions directory exists
if (fs.existsSync(functionsDir)) {
  console.log(`Functions directory found at ${functionsDir}`);
  
  // Install dependencies directly
  try {
    console.log('Installing jsonwebtoken...');
    execSync('npm install jsonwebtoken@9.0.0 --no-save', { stdio: 'inherit' });
    
    console.log('Installing bcryptjs...');
    execSync('npm install bcryptjs@2.4.3 --no-save', { stdio: 'inherit' });
    
    console.log('Installing mongoose...');
    execSync('npm install mongoose@7.0.3 --no-save', { stdio: 'inherit' });
    
    console.log('Installing axios...');
    execSync('npm install axios@1.8.4 --no-save', { stdio: 'inherit' });
    
    console.log('Successfully installed all function dependencies');
  } catch (error) {
    console.error('Error installing function dependencies:', error.message);
    // Don't exit with error to allow build to continue
    console.log('Continuing build despite installation errors...');
  }
  
  // Check if package.json exists in the functions directory
  const packageJsonPath = path.join(functionsDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      // Change to the functions directory and install dependencies
      process.chdir(functionsDir);
      console.log('Installing dependencies from functions package.json...');
      execSync('npm install', { stdio: 'inherit' });
      console.log('Successfully installed dependencies from functions package.json');
      
      // Change back to the original directory
      process.chdir(path.join(__dirname, '..'));
    } catch (error) {
      console.error('Error installing dependencies from functions package.json:', error.message);
      // Don't exit with error to allow build to continue
      console.log('Continuing build despite installation errors...');
    }
  } else {
    console.log('No package.json found in the functions directory');
  }
} else {
  console.log('No functions directory found');
}
