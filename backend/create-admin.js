const axios = require('axios');

const createAdmin = async () => {
  try {
    console.log('Creating admin user...');
    const adminData = {
      email: 'admin@example.com',
      password: 'password123',
      username: 'admin',
      role: 'admin'.toLowerCase()
    };

    const response = await axios.post('http://localhost:5000/api/users/register', adminData);
    console.log('✓ Admin user created successfully:', response.data);

    // Test login with new admin credentials
    console.log('\nTesting admin login...');
    const loginResponse = await axios.post('http://localhost:5000/api/users/login', {
      email: adminData.email,
      password: adminData.password
    });
    console.log('✓ Admin login successful:', loginResponse.data);

  } catch (error) {
    if (error.response?.data?.error?.code === 11000) {
      console.log('Admin user already exists. Try logging in instead.');
    } else {
      console.error('Error:', error.response?.data || error.message);
    }
  }
};

console.log('Starting admin user creation...');
createAdmin();
