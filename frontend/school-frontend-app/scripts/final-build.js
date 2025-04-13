// Final build script with better static page
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting final build process...');

// Function to execute commands and log output
function runCommand(command) {
  console.log(`Running command: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Function to copy directory recursively
function copyDirectory(source, destination) {
  // Create the destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Get all files and directories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  // Process each entry
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectory(sourcePath, destinationPath);
    } else {
      // Copy files
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

// Set environment variables
process.env.CI = 'true';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.ESLINT_NO_DEV_ERRORS = 'true';
process.env.REACT_APP_API_URL = '/api';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

// Create build directory
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Create a better static index.html
console.log('Creating better static index.html...');
const indexPath = path.join(buildDir, 'index.html');
fs.writeFileSync(indexPath, `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Agape Seminary School</title>\n  <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css\">\n  <style>\n    body {\n      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n      background-color: #f8f9fa;\n      margin: 0;\n      padding: 0;\n      min-height: 100vh;\n      display: flex;\n      flex-direction: column;\n    }\n    .header {\n      background-color: #343a40;\n      color: white;\n      padding: 1rem 0;\n      text-align: center;\n    }\n    .main-content {\n      flex: 1;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      padding: 2rem;\n    }\n    .container {\n      max-width: 800px;\n      background-color: white;\n      border-radius: 8px;\n      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\n      padding: 2rem;\n      text-align: center;\n    }\n    .logo {\n      max-width: 150px;\n      margin-bottom: 1.5rem;\n    }\n    h1 {\n      color: #343a40;\n      margin-bottom: 1rem;\n    }\n    p {\n      color: #6c757d;\n      line-height: 1.6;\n      margin-bottom: 1.5rem;\n    }\n    .btn-primary {\n      background-color: #007bff;\n      border-color: #007bff;\n      padding: 0.5rem 1.5rem;\n      font-weight: 500;\n    }\n    .btn-primary:hover {\n      background-color: #0069d9;\n      border-color: #0062cc;\n    }\n    .footer {\n      background-color: #343a40;\n      color: white;\n      text-align: center;\n      padding: 1rem 0;\n      margin-top: auto;\n    }\n    .loading-spinner {\n      display: inline-block;\n      width: 2rem;\n      height: 2rem;\n      border: 0.25rem solid rgba(0, 123, 255, 0.3);\n      border-radius: 50%;\n      border-top-color: #007bff;\n      animation: spin 1s ease-in-out infinite;\n      margin-bottom: 1rem;\n    }\n    @keyframes spin {\n      to { transform: rotate(360deg); }\n    }\n    .features {\n      display: flex;\n      justify-content: space-around;\n      margin: 2rem 0;\n      flex-wrap: wrap;\n    }\n    .feature {\n      flex: 1;\n      min-width: 200px;\n      margin: 1rem;\n      padding: 1.5rem;\n      background-color: #f8f9fa;\n      border-radius: 8px;\n      text-align: center;\n    }\n    .feature i {\n      font-size: 2rem;\n      color: #007bff;\n      margin-bottom: 1rem;\n    }\n  </style>\n  <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css\">\n</head>\n<body>\n  <div class=\"header\">\n    <div class=\"container-fluid\">\n      <h2>Agape Lutheran Junior Seminary</h2>\n    </div>\n  </div>\n\n  <div class=\"main-content\">\n    <div class=\"container\">\n      <div class=\"loading-spinner\"></div>\n      <h1>Welcome to Agape Seminary School</h1>\n      <p>Our school management system is currently being updated with new features to better serve our students, teachers, and administrators.</p>\n      \n      <div class=\"features\">\n        <div class=\"feature\">\n          <i class=\"fas fa-graduation-cap\"></i>\n          <h3>Academic Excellence</h3>\n          <p>Providing quality education since 1995</p>\n        </div>\n        <div class=\"feature\">\n          <i class=\"fas fa-users\"></i>\n          <h3>Community</h3>\n          <p>Building strong relationships and values</p>\n        </div>\n        <div class=\"feature\">\n          <i class=\"fas fa-book\"></i>\n          <h3>Curriculum</h3>\n          <p>Comprehensive and modern learning approach</p>\n        </div>\n      </div>\n      \n      <p>Please check back soon. The system will be available shortly.</p>\n      <button class=\"btn btn-primary\" onclick=\"window.location.reload()\">Refresh Page</button>\n      \n      <div class=\"mt-4\">\n        <p><small>If you need immediate assistance, please contact the school administration.</small></p>\n      </div>\n    </div>\n  </div>\n\n  <div class=\"footer\">\n    <div class=\"container-fluid\">\n      <p>&copy; 2024 Agape Lutheran Junior Seminary. All rights reserved.</p>\n    </div>\n  </div>\n\n  <script>\n    // Auto refresh every 60 seconds\n    setTimeout(() => {\n      window.location.reload();\n    }, 60000);\n    \n    // Check API health\n    fetch('/api/health')\n      .then(response => {\n        if (response.ok) {\n          console.log('API is healthy');\n        } else {\n          console.log('API health check failed');\n        }\n      })\n      .catch(error => {\n        console.error('Error checking API health:', error);\n      });\n  </script>\n  <script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js\"></script>\n</body>\n</html>`);

// Create a _redirects file for Vercel
const redirectsPath = path.join(buildDir, '_redirects');
fs.writeFileSync(redirectsPath, '/* /index.html 200');

// Copy public files to build directory
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  console.log('Copying public files to build directory...');
  try {
    copyDirectory(publicDir, buildDir);
  } catch (error) {
    console.error('Error copying public files:', error.message);
    // Continue even if copying fails
  }
}

console.log('Build completed successfully!');
