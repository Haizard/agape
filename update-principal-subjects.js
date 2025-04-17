// Script to update A-Level subjects to mark them as principal
// This script should be run in the browser console when logged in as an admin

/**
 * Updates A-Level subjects to mark them as principal
 * @param {Array} principalSubjectCodes - Array of subject codes to mark as principal
 */
async function updatePrincipalSubjects(principalSubjectCodes) {
  // Get the authentication token
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No authentication token found. Please log in first.');
    return;
  }
  
  try {
    // Fetch all subjects
    console.log('Fetching all subjects...');
    const response = await fetch('/api/subjects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch subjects: ${response.status} ${response.statusText}`);
    }
    
    const subjects = await response.json();
    console.log(`Found ${subjects.length} subjects in total.`);
    
    // Filter for A-Level subjects
    const aLevelSubjects = subjects.filter(subject => 
      subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
    );
    console.log(`Found ${aLevelSubjects.length} A-Level subjects.`);
    
    // Find subjects to update
    const subjectsToUpdate = aLevelSubjects.filter(subject => 
      principalSubjectCodes.includes(subject.code) && !subject.isPrincipal
    );
    
    console.log(`Found ${subjectsToUpdate.length} subjects to update:`);
    subjectsToUpdate.forEach(subject => {
      console.log(`- ${subject.name} (${subject.code})`);
    });
    
    // Update each subject
    for (const subject of subjectsToUpdate) {
      console.log(`Updating subject: ${subject.name} (${subject.code})`);
      
      const updateResponse = await fetch(`/api/subjects/${subject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...subject,
          isPrincipal: true
        })
      });
      
      if (!updateResponse.ok) {
        console.error(`Failed to update subject ${subject.code}: ${updateResponse.status} ${updateResponse.statusText}`);
        continue;
      }
      
      const updatedSubject = await updateResponse.json();
      console.log(`Successfully updated subject: ${updatedSubject.name} (${updatedSubject.code})`);
    }
    
    console.log('Subject update complete!');
    
  } catch (error) {
    console.error('Error updating subjects:', error);
  }
}

// Example usage:
// updatePrincipalSubjects(['MATH', 'PHY', 'CHEM', 'BIO', 'HIST', 'GEO']);
