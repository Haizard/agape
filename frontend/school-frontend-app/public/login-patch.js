// Login patch script
(function() {
  console.log('Login patch script loaded');
  
  // Function to patch the login form
  function patchLoginForm() {
    console.log('Attempting to patch login form');
    
    // Find all forms on the page
    const forms = document.querySelectorAll('form');
    console.log(`Found ${forms.length} forms on the page`);
    
    forms.forEach((form, index) => {
      console.log(`Examining form ${index + 1}`);
      
      // Check if this looks like a login form
      const usernameField = form.querySelector('input[type="text"], input[type="email"], input[name="username"], input[name="email"]');
      const passwordField = form.querySelector('input[type="password"]');
      
      if (usernameField && passwordField) {
        console.log('Found a login form with username and password fields');
        
        // Override the form submission
        form.addEventListener('submit', async function(event) {
          event.preventDefault();
          console.log('Login form submission intercepted');
          
          const username = usernameField.value;
          const password = passwordField.value;
          
          console.log(`Attempting login for: ${username}`);
          
          try {
            // Call the Netlify Function directly
            console.log('Calling Netlify Function directly');
            const response = await fetch('/.netlify/functions/mock-login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            console.log('Login response:', data);
            
            if (data.token) {
              // Login successful
              console.log('Login successful!');
              
              // Store the token and user data in localStorage
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              
              // Display success message
              const messageElement = document.createElement('div');
              messageElement.style.padding = '10px';
              messageElement.style.marginTop = '10px';
              messageElement.style.backgroundColor = '#dff0d8';
              messageElement.style.color = '#3c763d';
              messageElement.style.border = '1px solid #d6e9c6';
              messageElement.style.borderRadius = '4px';
              messageElement.textContent = 'Login successful! Redirecting...';
              
              // Find a good place to insert the message
              const submitButton = form.querySelector('button[type="submit"]');
              if (submitButton) {
                submitButton.parentNode.insertBefore(messageElement, submitButton.nextSibling);
              } else {
                form.appendChild(messageElement);
              }
              
              // Redirect to the main page after a short delay
              setTimeout(() => {
                window.location.href = '/';
              }, 2000);
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
        
        console.log('Login form patched successfully');
      }
    });
  }
  
  // Function to check if we're on the login page
  function isLoginPage() {
    return (
      window.location.pathname.includes('login') ||
      window.location.pathname.includes('signin') ||
      window.location.pathname === '/' ||
      document.title.toLowerCase().includes('login') ||
      document.title.toLowerCase().includes('sign in')
    );
  }
  
  // Wait for the page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOM loaded, checking if this is a login page');
      if (isLoginPage()) {
        console.log('This appears to be a login page');
        patchLoginForm();
      } else {
        console.log('This does not appear to be a login page');
      }
    });
  } else {
    console.log('DOM already loaded, checking if this is a login page');
    if (isLoginPage()) {
      console.log('This appears to be a login page');
      patchLoginForm();
    } else {
      console.log('This does not appear to be a login page');
    }
  }
  
  // Also try patching after a short delay to catch dynamically loaded forms
  setTimeout(function() {
    console.log('Delayed check for login form');
    patchLoginForm();
  }, 2000);
})();
