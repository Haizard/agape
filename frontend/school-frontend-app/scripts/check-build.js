/**
 * Check Build Script
 * 
 * This script checks if the build directory contains the actual React app
 * or a static placeholder.
 */

const fs = require('fs');
const path = require('path');

console.log('Checking build directory...');

const buildDir = path.join(__dirname, '..', 'build');

// Check if build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('Build directory does not exist!');
  process.exit(1);
}

// List files in build directory
const files = fs.readdirSync(buildDir);
console.log('Files in build directory:', files);

// Check if index.html exists
const indexPath = path.join(buildDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('index.html does not exist in build directory!');
  process.exit(1);
}

// Read index.html
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// Check if index.html contains React app or static placeholder
if (indexHtml.includes('static/js/') && indexHtml.includes('static/css/')) {
  console.log('Build directory contains React app!');
} else if (indexHtml.includes('Agape Seminary School') && indexHtml.includes('bootstrap')) {
  console.error('Build directory contains static placeholder!');
  process.exit(1);
} else {
  console.warn('Unable to determine if build directory contains React app or static placeholder.');
}

// Check for static directory
const staticDir = path.join(buildDir, 'static');
if (fs.existsSync(staticDir)) {
  console.log('static directory exists!');
  
  // List subdirectories in static directory
  const staticSubdirs = fs.readdirSync(staticDir);
  console.log('Subdirectories in static directory:', staticSubdirs);
  
  // Check for js and css directories
  if (staticSubdirs.includes('js') && staticSubdirs.includes('css')) {
    console.log('static directory contains js and css subdirectories!');
    console.log('Build directory appears to contain a valid React app!');
  } else {
    console.warn('static directory does not contain js and css subdirectories!');
  }
} else {
  console.error('static directory does not exist!');
  console.error('Build directory does not appear to contain a valid React app!');
  process.exit(1);
}
