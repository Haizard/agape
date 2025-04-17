// Script to check subjects using the API
const axios = require('axios');

// Configuration
const API_URL = 'https://agape-seminary-school.onrender.com/api';
// You'll need to replace this with your actual token
const TOKEN = ''; // Add your token here before running

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
      console.log('\nPrincipal subjects:');
      principalSubjects.forEach(subject => {
        console.log(`- ${subject.name} (${subject.code})`);
      });
    } else {
      console.log('\nNo principal subjects found in the database.');
    }
    
    // List A-Level subjects that are not marked as principal
    const nonPrincipalALevelSubjects = aLevelSubjects.filter(subject => !subject.isPrincipal);
    if (nonPrincipalALevelSubjects.length > 0) {
      console.log('\nA-Level subjects NOT marked as principal:');
      nonPrincipalALevelSubjects.forEach(subject => {
        console.log(`- ${subject.name} (${subject.code})`);
      });
    }
    
    return {
      allSubjects: response.data,
      aLevelSubjects,
      principalSubjects,
      nonPrincipalALevelSubjects
    };
  } catch (error) {
    console.error('Error fetching subjects:', error.response?.data || error.message);
    return null;
  }
}

// Function to get all subject combinations
async function getAllSubjectCombinations() {
  try {
    console.log('\nFetching all subject combinations...');
    
    const response = await axios.get(`${API_URL}/subject-combinations`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log(`Found ${response.data.length} subject combinations.`);
    
    if (response.data.length > 0) {
      console.log('\nSubject combinations:');
      response.data.forEach(combo => {
        console.log(`\n${combo.name} (${combo.code}):`);
        
        // Principal subjects
        console.log('  Principal subjects:');
        if (combo.subjects && combo.subjects.length > 0) {
          combo.subjects.forEach(subject => {
            if (typeof subject === 'object') {
              const isPrincipalMarked = subject.isPrincipal ? 'YES' : 'NO';
              console.log(`  - ${subject.name} (${subject.code}) - isPrincipal: ${isPrincipalMarked}`);
            } else {
              console.log(`  - ${subject} (ID only)`);
            }
          });
        } else {
          console.log('  - None');
        }
        
        // Subsidiary subjects
        console.log('  Subsidiary subjects:');
        if (combo.compulsorySubjects && combo.compulsorySubjects.length > 0) {
          combo.compulsorySubjects.forEach(subject => {
            if (typeof subject === 'object') {
              const isPrincipalMarked = subject.isPrincipal ? 'YES' : 'NO';
              console.log(`  - ${subject.name} (${subject.code}) - isPrincipal: ${isPrincipalMarked}`);
            } else {
              console.log(`  - ${subject} (ID only)`);
            }
          });
        } else {
          console.log('  - None');
        }
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching subject combinations:', error.response?.data || error.message);
    return null;
  }
}

// Execute the script
async function main() {
  const subjects = await getAllSubjects();
  const combinations = await getAllSubjectCombinations();
  
  if (!subjects || !combinations) {
    console.log('\nPlease add your authentication token to the TOKEN variable in this script to run it.');
  }
}

main();
