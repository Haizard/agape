// Script to create principal subjects for A-Level using bulk endpoint
const axios = require('axios');

// Configuration
const API_URL = 'https://agape-seminary-school.onrender.com/api';
const TOKEN = ''; // Add your authentication token here

// Principal subjects to create
const principalSubjects = [
  { 
    name: 'Advanced Mathematics', 
    code: 'A-MATH', 
    educationLevel: 'A_LEVEL', 
    isCompulsory: false, 
    isPrincipal: true,
    description: 'Advanced Mathematics for A-Level students'
  },
  { 
    name: 'Physics', 
    code: 'A-PHY', 
    educationLevel: 'A_LEVEL', 
    isCompulsory: false, 
    isPrincipal: true,
    description: 'Physics for A-Level students'
  },
  { 
    name: 'Chemistry', 
    code: 'A-CHEM', 
    educationLevel: 'A_LEVEL', 
    isCompulsory: false, 
    isPrincipal: true,
    description: 'Chemistry for A-Level students'
  },
  { 
    name: 'Biology', 
    code: 'A-BIO', 
    educationLevel: 'A_LEVEL', 
    isCompulsory: false, 
    isPrincipal: true,
    description: 'Biology for A-Level students'
  },
  { 
    name: 'History', 
    code: 'A-HIST', 
    educationLevel: 'A_LEVEL', 
    isCompulsory: false, 
    isPrincipal: true,
    description: 'History for A-Level students'
  },
  { 
    name: 'Geography', 
    code: 'A-GEO', 
    educationLevel: 'A_LEVEL', 
    isCompulsory: false, 
    isPrincipal: true,
    description: 'Geography for A-Level students'
  }
];

// Function to create subjects in bulk
async function createSubjectsInBulk() {
  try {
    console.log('Creating principal subjects for A-Level in bulk...');
    
    const response = await axios.post(`${API_URL}/subjects/bulk`, principalSubjects, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log('Bulk creation response:', response.data);
    console.log(`Created ${response.data.created.length} subjects successfully.`);
    
    if (response.data.errors.length > 0) {
      console.log('Errors:', response.data.errors);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error creating subjects in bulk:', error.response?.data || error.message);
    return null;
  }
}

// Execute the script
createSubjectsInBulk();
