const fs = require('fs');
const path = require('path');

// Paths to API service files
const apiServicePath = path.join(__dirname, '..', 'src', 'services', 'api.js');
const unifiedApiServicePath = path.join(__dirname, '..', 'src', 'services', 'unifiedApi.js');
const indexPath = path.join(__dirname, '..', 'src', 'index.js');

// Modify the API service
if (fs.existsSync(apiServicePath)) {
  console.log('Modifying API service...');
  let content = fs.readFileSync(apiServicePath, 'utf8');
  
  // Add code to use the proxy
  if (!content.includes('REACT_APP_USE_PROXY')) {
    content = content.replace(
      '// Check if the API URL already includes /api',
      '// Add a fix for CORS issues\nconsole.log("Using the fix from api.js");\n\n// Check if the API URL already includes /api'
    );
    
    content = content.replace(
      'let baseURL = process.env.REACT_APP_API_URL || \'http://localhost:5000\';',
      'let baseURL = process.env.REACT_APP_API_URL || \'http://localhost:5000\';\n\n// Use the proxy if enabled\nif (process.env.REACT_APP_USE_PROXY === \'true\') {\n  // If we\'re using the proxy, make sure we\'re using the relative URL\n  if (baseURL.includes(\'https://\') || baseURL.includes(\'http://\')) {\n    baseURL = \'/api\';\n    console.log(\'Using proxy with relative URL: \', baseURL);\n  }\n}'
    );
    
    fs.writeFileSync(apiServicePath, content);
    console.log('Modified API service to use proxy');
  }
}

// Modify the Unified API service
if (fs.existsSync(unifiedApiServicePath)) {
  console.log('Modifying Unified API service...');
  let content = fs.readFileSync(unifiedApiServicePath, 'utf8');
  
  // Add code to use the proxy
  if (!content.includes('REACT_APP_USE_PROXY')) {
    content = content.replace(
      'constructor() {',
      'constructor() {\n    console.log("Using the fix from unifiedApi.js");'
    );
    
    content = content.replace(
      'const timeout = process.env.REACT_APP_TIMEOUT ? parseInt(process.env.REACT_APP_TIMEOUT, 10) : 60000;',
      'const timeout = process.env.REACT_APP_TIMEOUT ? parseInt(process.env.REACT_APP_TIMEOUT, 10) : 60000;\n\n    // Use the proxy if enabled\n    let apiUrl = process.env.REACT_APP_API_URL || \'/api\';\n    if (process.env.REACT_APP_USE_PROXY === \'true\') {\n      // If we\'re using the proxy, make sure we\'re using the relative URL\n      if (apiUrl.includes(\'https://\') || apiUrl.includes(\'http://\')) {\n        apiUrl = \'/api\';\n        console.log(\'Using proxy with relative URL: \', apiUrl);\n      }\n    }'
    );
    
    content = content.replace(
      'baseURL: process.env.REACT_APP_API_URL || \'/api\',',
      'baseURL: apiUrl,'
    );
    
    fs.writeFileSync(unifiedApiServicePath, content);
    console.log('Modified Unified API service to use proxy');
  }
}

// Modify the index.js file
if (fs.existsSync(indexPath)) {
  console.log('Modifying index.js...');
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Add code to use the proxy
  if (!content.includes('REACT_APP_USE_PROXY')) {
    content = content.replace(
      '// Configure axios base URL',
      '// Add a fix for CORS issues\nconsole.log("Using the fix from index.html");\n\n// Configure axios base URL'
    );
    
    content = content.replace(
      'let baseURL = process.env.REACT_APP_API_URL || \'http://localhost:5000\';',
      'let baseURL = process.env.REACT_APP_API_URL || \'http://localhost:5000\';\n\n// Use the proxy if enabled\nif (process.env.REACT_APP_USE_PROXY === \'true\') {\n  // If we\'re using the proxy, make sure we\'re using the relative URL\n  if (baseURL.includes(\'https://\') || baseURL.includes(\'http://\')) {\n    baseURL = \'/api\';\n    console.log(\'Using proxy with relative URL: \', baseURL);\n  }\n}'
    );
    
    fs.writeFileSync(indexPath, content);
    console.log('Modified index.js to use proxy');
  }
}

console.log('API services modified successfully.');
