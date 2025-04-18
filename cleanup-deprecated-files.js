/**
 * Cleanup Script for Deprecated A-Level Class Report Files
 * 
 * This script identifies and lists deprecated files that can be safely removed
 * after the migration to the new A-Level Class Report system.
 * 
 * Usage:
 * 1. Run this script to list deprecated files: node cleanup-deprecated-files.js
 * 2. Review the list of files
 * 3. Run with --remove flag to remove the files: node cleanup-deprecated-files.js --remove
 */
const fs = require('fs');
const path = require('path');

// List of deprecated files
const deprecatedFiles = [
  // Frontend components
  'frontend/school-frontend-app/src/components/results/ALevelFormSpecificReport.jsx',
  'frontend/school-frontend-app/src/components/results/EnhancedALevelClassReportContainer.jsx',
  'frontend/school-frontend-app/src/components/results/SimpleALevelClassReportContainer.jsx',
  
  // Backend controllers and routes
  'backend/controllers/aLevelResultController.js.deprecated',
  'backend/routes/aLevelResultRoutes.js.deprecated',
  
  // Tests
  'frontend/school-frontend-app/src/tests/ALevelFormSpecificReport.test.js',
  'backend/tests/aLevelResultController.test.js.deprecated',
  
  // Utilities
  'frontend/school-frontend-app/src/utils/aLevelGradeUtils.js.deprecated'
];

// Check if the --remove flag is provided
const shouldRemove = process.argv.includes('--remove');

console.log('Deprecated A-Level Class Report Files:');
console.log('=====================================');

// Process each deprecated file
deprecatedFiles.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  
  // Check if the file exists
  if (fs.existsSync(fullPath)) {
    console.log(`✓ ${filePath}`);
    
    // Remove the file if the --remove flag is provided
    if (shouldRemove) {
      try {
        fs.unlinkSync(fullPath);
        console.log(`  ✓ Removed`);
      } catch (error) {
        console.error(`  ✗ Error removing file: ${error.message}`);
      }
    }
  } else {
    console.log(`✗ ${filePath} (not found)`);
  }
});

console.log('\nSummary:');
console.log('========');
if (shouldRemove) {
  console.log('Deprecated files have been removed.');
} else {
  console.log('This was a dry run. To remove the deprecated files, run:');
  console.log('node cleanup-deprecated-files.js --remove');
}
