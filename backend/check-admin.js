const axios = require('axios');

const checkAdmin = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/users/debug/check-user/admin@example.com');
    console.log('Admin user details:', response.data);
  } catch (error) {
    console.error('Error checking admin:', error.response?.data || error.message);
  }
};

checkAdmin();