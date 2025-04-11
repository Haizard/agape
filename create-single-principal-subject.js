// Script to create a single principal subject
const axios = require('axios');

// Configuration
const API_URL = 'https://agape-seminary-school.onrender.com/api';
const TOKEN = localStorage.getItem('token'); // Get token from localStorage

// Principal subject to create
const principalSubject = { 
  name: 'Advanced Mathematics', 
  code: 'A-MATH-1', // Using a different code to avoid conflicts
  educationLevel: 'A_LEVEL', 
  isCompulsory: false, 
  isPrincipal: true,
  description: 'Advanced Mathematics for A-Level students'
};

// Function to create a subject
async function createSubject() {
  try {
    console.log('Creating principal subject...');
    
    const response = await axios.post(`${API_URL}/subjects`, principalSubject, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log('Subject created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating subject:', error.response?.data || error.message);
    return null;
  }
}

// Execute the function
createSubject();
