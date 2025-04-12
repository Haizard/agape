const fs = require('fs');
const path = require('path');

// Find the login component file
const srcDir = path.join(__dirname, '..', 'src');
const componentFiles = [];

function findFiles(dir, pattern) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, pattern);
    } else if (file.match(pattern)) {
      componentFiles.push(filePath);
    }
  });
}

// Find all potential login component files
findFiles(srcDir, /login/i);

console.log(`Found ${componentFiles.length} potential login component files:`);
componentFiles.forEach(file => console.log(`- ${file}`));

// Look for the file that contains the login form submission
let loginComponentFile = null;
let loginComponentContent = '';

for (const file of componentFiles) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Check if this file contains login form submission logic
  if (content.includes('login') && 
      (content.includes('onSubmit') || content.includes('handleSubmit')) && 
      (content.includes('fetch') || content.includes('axios'))) {
    console.log(`Found login component file: ${file}`);
    loginComponentFile = file;
    loginComponentContent = content;
    break;
  }
}

if (!loginComponentFile) {
  console.log('Could not find login component file. Creating a patch file instead.');
  
  // Create a patch file that can be included in the index.html
  const patchFilePath = path.join(srcDir, '..', 'public', 'login-patch.js');
  const patchContent = `
// Login patch script
(function() {
  // Wait for the page to load
  window.addEventListener('load', function() {
    // Check if we're on the login page
    if (window.location.pathname.includes('login') || document.querySelector('form')) {
      console.log('Login patch applied');
      
      // Find all forms on the page
      const forms = document.querySelectorAll('form');
      
      forms.forEach(form => {
        // Override the form submission
        form.addEventListener('submit', async function(event) {
          event.preventDefault();
          
          // Get the username and password fields
          const usernameField = form.querySelector('input[type="text"], input[type="email"], input[name="username"], input[name="email"]');
          const passwordField = form.querySelector('input[type="password"]');
          
          if (!usernameField || !passwordField) {
            console.error('Could not find username or password fields');
            return;
          }
          
          const username = usernameField.value;
          const password = passwordField.value;
          
          try {
            // Call the Netlify Function directly
            const response = await fetch('/.netlify/functions/mock-login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.token) {
              // Login successful
              console.log('Login successful!');
              
              // Store the token and user data in localStorage
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              
              // Redirect to the main page
              window.location.href = '/';
            } else {
              // Login failed
              console.error('Login failed:', data.message);
              alert(data.message || 'Login failed. Please try again.');
            }
          } catch (error) {
            // Error occurred
            console.error('Login error:', error);
            alert('An error occurred: ' + error.message);
          }
        });
      });
    }
  });
})();
`;
  
  fs.writeFileSync(patchFilePath, patchContent);
  console.log(`Created login patch file: ${patchFilePath}`);
  
  // Add the script to index.html
  const indexHtmlPath = path.join(srcDir, '..', 'public', 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Check if the patch script is already included
    if (!indexHtmlContent.includes('login-patch.js')) {
      // Add the script before the closing body tag
      indexHtmlContent = indexHtmlContent.replace(
        '</body>',
        '  <script src="%PUBLIC_URL%/login-patch.js"></script>\n  </body>'
      );
      
      fs.writeFileSync(indexHtmlPath, indexHtmlContent);
      console.log(`Added login patch script to index.html`);
    } else {
      console.log(`Login patch script already included in index.html`);
    }
  } else {
    console.log(`Could not find index.html`);
  }
} else {
  // Modify the login component file
  console.log(`Modifying login component file: ${loginComponentFile}`);
  
  // Create a backup of the original file
  const backupFilePath = `${loginComponentFile}.backup`;
  fs.writeFileSync(backupFilePath, loginComponentContent);
  console.log(`Created backup of original file: ${backupFilePath}`);
  
  // Modify the content to use the Netlify Function directly
  let modifiedContent = loginComponentContent;
  
  // Replace the API URL
  modifiedContent = modifiedContent.replace(
    /['"]https:\/\/agape-seminary-school\.onrender\.com\/api\/users\/login['"]/g,
    '"/.netlify/functions/mock-login"'
  );
  
  modifiedContent = modifiedContent.replace(
    /['"]\/api\/users\/login['"]/g,
    '"/.netlify/functions/mock-login"'
  );
  
  // Write the modified content back to the file
  fs.writeFileSync(loginComponentFile, modifiedContent);
  console.log(`Modified login component file to use Netlify Function directly`);
}

console.log('Login component modification complete!');
