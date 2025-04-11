// Script to check if there are any principal subjects in the database
const axios = require('axios');

// Configuration
const API_URL = 'https://agape-seminary-school.onrender.com/api';
const TOKEN = ''; // Add your authentication token here

// Function to get all subjects
async function getAllSubjects() {
  try {
    console.log('Fetching all subjects...');
    
    const response = await axios.get(`${API_URL}/subjects`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log(`Found ${response.data.length} subjects in total.`);
    
    // Filter for A-Level subjects
    const aLevelSubjects = response.data.filter(subject => 
      subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
    );
    console.log(`Found ${aLevelSubjects.length} A-Level subjects.`);
    
    // Filter for principal subjects
    const principalSubjects = response.data.filter(subject => subject.isPrincipal);
    console.log(`Found ${principalSubjects.length} principal subjects.`);
    
    if (principalSubjects.length > 0) {
      console.log('Principal subjects:');
      principalSubjects.forEach(subject => {
        console.log(`- ${subject.name} (${subject.code})`);
      });
    } else {
      console.log('No principal subjects found in the database.');
    }
    
    return {
      allSubjects: response.data,
      aLevelSubjects,
      principalSubjects
    };
  } catch (error) {
    console.error('Error fetching subjects:', error.response?.data || error.message);
    return null;
  }
}

// Execute the script
getAllSubjects();
