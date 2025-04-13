const fs = require('fs');
const path = require('path');

// Find all JavaScript files in the src directory
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Search for login function in all JS files
const srcDir = path.join(__dirname, '..', 'src');
const jsFiles = findJsFiles(srcDir);

console.log(`Searching for login function in ${jsFiles.length} files...`);

let loginFileFound = false;

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Check if this file contains login functionality
  if (content.includes('login') && content.includes('fetch') && content.includes('/api/users/login')) {
    console.log(`Found potential login file: ${file}`);
    
    // Modify the file to use the proxy
    let newContent = content;
    
    // Replace any absolute URLs with relative URLs
    newContent = newContent.replace(
      /https:\/\/agape-seminary-school\.onrender\.com\/api\/users\/login/g,
      '/api/users/login'
    );
    
    // Write the modified content back to the file
    fs.writeFileSync(file, newContent);
    console.log(`Modified login file: ${file}`);
    loginFileFound = true;
  }
});

if (!loginFileFound) {
  console.log('No login file found. Trying to patch all fetch calls...');
  
  // Patch all fetch calls to use relative URLs
  jsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('fetch') && content.includes('https://agape-seminary-school.onrender.com/api')) {
      console.log(`Found file with fetch calls: ${file}`);
      
      // Replace any absolute URLs with relative URLs
      const newContent = content.replace(
        /https:\/\/agape-seminary-school\.onrender\.com\/api/g,
        '/api'
      );
      
      // Write the modified content back to the file
      fs.writeFileSync(file, newContent);
      console.log(`Modified file with fetch calls: ${file}`);
    }
  });
}

console.log('Login patch applied successfully.');
