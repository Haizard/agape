const fs = require('fs');
const path = require('path');

// Paths to API service files
const unifiedApiServicePath = path.join(__dirname, '..', 'src', 'services', 'unifiedApi.js');

// Force the UnifiedApiService to use the relative URL
if (fs.existsSync(unifiedApiServicePath)) {
  console.log('Forcing UnifiedApiService to use relative URL...');
  let content = fs.readFileSync(unifiedApiServicePath, 'utf8');
  
  // Replace the baseURL with a hardcoded relative URL
  content = content.replace(
    'baseURL: process.env.REACT_APP_API_URL || \'/api\',',
    'baseURL: \'/api\','
  );
  
  fs.writeFileSync(unifiedApiServicePath, content);
  console.log('Modified UnifiedApiService to use relative URL');
}

// Create a .env.production file with the correct API URL
const envProdPath = path.join(__dirname, '..', '.env.production');
const envProdContent = 'REACT_APP_API_URL=/api\nREACT_APP_USE_MOCK_DATA=false\nGENERATE_SOURCEMAP=false\nREACT_APP_TIMEOUT=60000\nREACT_APP_USE_PROXY=true';

console.log('Creating .env.production file with correct API URL...');
fs.writeFileSync(envProdPath, envProdContent);
console.log('.env.production file created successfully');

console.log('Relative URL fix applied successfully.');
