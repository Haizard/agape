const fs = require('fs');
const path = require('path');

/**
 * Checks if the logo file exists and returns the path if it does
 * @returns {string|null} The path to the logo file or null if it doesn't exist
 */
const getLogoPath = () => {
  try {
    // Try different possible paths to find the logo
    const possiblePaths = [
      // Path from the utils directory
      path.join(__dirname, '../../frontend/school-frontend-app/public/images/lutheran_logo.png'),
      // Path from the project root
      path.join(__dirname, '../frontend/school-frontend-app/public/images/lutheran_logo.png'),
      // Absolute path (for production)
      path.join(process.cwd(), 'frontend/school-frontend-app/public/images/lutheran_logo.png'),
      // Public directory path
      path.join(process.cwd(), 'public/images/lutheran_logo.png')
    ];

    // Check each path
    for (const logoPath of possiblePaths) {
      if (fs.existsSync(logoPath)) {
        console.log('Logo found at:', logoPath);
        return logoPath;
      }
    }

    console.error('Logo file not found in any of the expected locations');
    return null;
  } catch (error) {
    console.error('Error finding logo file:', error);
    return null;
  }
};

module.exports = {
  getLogoPath
};
