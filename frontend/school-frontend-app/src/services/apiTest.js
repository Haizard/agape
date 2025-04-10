import api from './api';

// Function to test API connectivity
export const testApiConnection = async () => {
  try {
    console.log('Testing API connection...');

    // Try to ping the server
    const response = await fetch('http://localhost:5000/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (response.ok) {
      console.log('API connection successful!');
      return { success: true, message: 'Connected to API server' };
    } else {
      console.error('API connection failed with status:', response.status);
      return { success: false, message: `Failed to connect to API server: ${response.statusText}` };
    }
  } catch (error) {
    console.error('API connection error:', error);
    return {
      success: false,
      message: 'Network error connecting to API server',
      error: error.message
    };
  }
};

// Function to test login
export const testLogin = async (emailOrUsername, password) => {
  try {
    console.log(`Testing login with ${emailOrUsername}...`);

    // Try to login using fetch directly (bypassing axios)
    const response = await fetch('http://localhost:5000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({ emailOrUsername, password })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Login successful!');
      return { success: true, data };
    } else {
      console.error('Login failed with status:', response.status);
      return { success: false, message: data.message || 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Network error during login',
      error: error.message
    };
  }
};

// Export a function to run both tests
export const runApiTests = async () => {
  const connectionTest = await testApiConnection();
  console.log('Connection test result:', connectionTest);

  if (connectionTest.success) {
    const loginTest = await testLogin('superadmin@school.com', 'admin123');
    console.log('Login test result:', loginTest);
    return { connectionTest, loginTest };
  }

  return { connectionTest, loginTest: null };
};

// Run tests automatically when this file is imported
runApiTests().then(results => {
  console.log('API tests completed:', results);
}).catch(error => {
  console.error('API tests failed:', error);
});

export default { testApiConnection, testLogin, runApiTests };
