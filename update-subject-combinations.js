// Script to check and update subject combinations
// This script should be run in the browser console when logged in as an admin

/**
 * Checks and updates subject combinations to ensure principal subjects are in the correct array
 */
async function updateSubjectCombinations() {
  // Get the authentication token
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No authentication token found. Please log in first.');
    return;
  }
  
  try {
    // Fetch all subjects
    console.log('Fetching all subjects...');
    const subjectsResponse = await fetch('/api/subjects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!subjectsResponse.ok) {
      throw new Error(`Failed to fetch subjects: ${subjectsResponse.status} ${subjectsResponse.statusText}`);
    }
    
    const allSubjects = await subjectsResponse.json();
    console.log(`Found ${allSubjects.length} subjects in total.`);
    
    // Create a map of subject IDs to subjects for easy lookup
    const subjectMap = {};
    allSubjects.forEach(subject => {
      subjectMap[subject._id] = subject;
    });
    
    // Fetch all subject combinations
    console.log('Fetching all subject combinations...');
    const combinationsResponse = await fetch('/api/subject-combinations', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!combinationsResponse.ok) {
      throw new Error(`Failed to fetch combinations: ${combinationsResponse.status} ${combinationsResponse.statusText}`);
    }
    
    const combinations = await combinationsResponse.json();
    console.log(`Found ${combinations.length} subject combinations.`);
    
    // Check each combination
    for (const combination of combinations) {
      console.log(`\nChecking combination: ${combination.name} (${combination.code})`);
      
      let needsUpdate = false;
      const updatedCombination = {
        ...combination,
        subjects: [...(combination.subjects || [])],
        compulsorySubjects: [...(combination.compulsorySubjects || [])]
      };
      
      // Check principal subjects
      if (combination.subjects && combination.subjects.length > 0) {
        console.log('  Principal subjects:');
        for (let i = 0; i < combination.subjects.length; i++) {
          const subjectId = typeof combination.subjects[i] === 'object' 
            ? combination.subjects[i]._id 
            : combination.subjects[i];
          
          const subject = subjectMap[subjectId];
          if (subject) {
            console.log(`  - ${subject.name} (${subject.code}) - isPrincipal: ${subject.isPrincipal ? 'YES' : 'NO'}`);
            
            // If this subject is not marked as principal, update it
            if (!subject.isPrincipal) {
              console.log(`    This subject should be marked as principal. Updating...`);
              
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
              
              if (updateResponse.ok) {
                console.log(`    Successfully updated subject: ${subject.name}`);
                // Update the subject in our map
                subjectMap[subject._id] = { ...subject, isPrincipal: true };
              } else {
                console.error(`    Failed to update subject: ${subject.name}`);
              }
            }
          } else {
            console.log(`  - Unknown subject (ID: ${subjectId})`);
          }
        }
      } else {
        console.log('  No principal subjects found.');
      }
      
      // Check subsidiary subjects
      if (combination.compulsorySubjects && combination.compulsorySubjects.length > 0) {
        console.log('  Subsidiary subjects:');
        for (let i = 0; i < combination.compulsorySubjects.length; i++) {
          const subjectId = typeof combination.compulsorySubjects[i] === 'object' 
            ? combination.compulsorySubjects[i]._id 
            : combination.compulsorySubjects[i];
          
          const subject = subjectMap[subjectId];
          if (subject) {
            console.log(`  - ${subject.name} (${subject.code}) - isPrincipal: ${subject.isPrincipal ? 'YES' : 'NO'}`);
            
            // If this subject is marked as principal but is in the subsidiary array, we should move it
            if (subject.isPrincipal) {
              console.log(`    This subject is marked as principal but is in the subsidiary array. It should be moved.`);
              needsUpdate = true;
              
              // Remove from compulsorySubjects
              updatedCombination.compulsorySubjects = updatedCombination.compulsorySubjects.filter(s => 
                (typeof s === 'object' ? s._id : s) !== subjectId
              );
              
              // Add to subjects if not already there
              const alreadyInSubjects = updatedCombination.subjects.some(s => 
                (typeof s === 'object' ? s._id : s) === subjectId
              );
              
              if (!alreadyInSubjects) {
                updatedCombination.subjects.push(subjectId);
              }
            }
          } else {
            console.log(`  - Unknown subject (ID: ${subjectId})`);
          }
        }
      } else {
        console.log('  No subsidiary subjects found.');
      }
      
      // Update the combination if needed
      if (needsUpdate) {
        console.log(`  Updating combination: ${combination.name}`);
        
        const updateResponse = await fetch(`/api/subject-combinations/${combination._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedCombination)
        });
        
        if (updateResponse.ok) {
          console.log(`  Successfully updated combination: ${combination.name}`);
        } else {
          console.error(`  Failed to update combination: ${combination.name}`);
        }
      } else {
        console.log(`  No updates needed for combination: ${combination.name}`);
      }
    }
    
    console.log('\nSubject combination check and update complete!');
    
  } catch (error) {
    console.error('Error updating subject combinations:', error);
  }
}

// Call the function to run it
// updateSubjectCombinations();
