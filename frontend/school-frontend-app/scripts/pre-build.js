// Pre-build script to ensure dependencies are properly installed
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Running pre-build dependency check...');

try {
  // Check if ajv is installed
  try {
    require.resolve('ajv/dist/compile/codegen');
    console.log('ajv/dist/compile/codegen is already installed');
  } catch (error) {
    console.log('Installing ajv explicitly...');
    execSync('npm install ajv@8.12.0 --no-save', { stdio: 'inherit' });
    
    // Try to resolve again to verify installation
    try {
      require.resolve('ajv/dist/compile/codegen');
      console.log('ajv/dist/compile/codegen is now installed');
    } catch (secondError) {
      console.error('Failed to install ajv properly:', secondError.message);
      // Try a different approach
      console.log('Trying alternative installation approach...');
      execSync('npm install ajv@8.12.0 ajv-keywords@5.1.0 --legacy-peer-deps --no-save', { stdio: 'inherit' });
    }
  }
  
  console.log('Pre-build dependency check completed');
} catch (error) {
  console.error('Error during pre-build dependency check:', error.message);
  // Continue with the build even if this fails
}
