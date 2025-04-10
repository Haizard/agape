const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login API...');
    
    const response = await axios.post('http://localhost:5000/api/users/login', {
      emailOrUsername: 'admin',  // Replace with a valid username or email
      password: 'admin123'       // Replace with the correct password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Login failed!');
    
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    console.error('Error config:', error.config);
    
    throw error;
  }
}

// Run the test
testLogin()
  .then(data => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed');
    process.exit(1);
  });
