// Simple build script that just copies files
const fs = require('fs');
const path = require('path');

console.log('Starting simple build process...');

// Create build directory
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Copy files from public directory
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  const files = fs.readdirSync(publicDir);
  files.forEach(file => {
    const sourcePath = path.join(publicDir, file);
    const destPath = path.join(buildDir, file);
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file} to build directory`);
  });
}

console.log('Simple build completed successfully!');
