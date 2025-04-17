// Script to automatically fix principal subject markings
(async function() {
  console.log('Starting automatic principal subject fix...');
  
  // Get the authentication token
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No authentication token found. Please log in first.');
    return;
  }
  
  // API URL
  const API_URL = '/api';
  
  try {
    // Step 1: Fetch all subjects
    console.log('Fetching all subjects...');
    const subjectsResponse = await fetch(`${API_URL}/subjects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!subjectsResponse.ok) {
      throw new Error(`Failed to fetch subjects: ${subjectsResponse.status} ${subjectsResponse.statusText}`);
    }
    
    const allSubjects = await subjectsResponse.json();
    console.log(`Found ${allSubjects.length} subjects in total.`);
    
    // Filter for A-Level subjects
    const aLevelSubjects = allSubjects.filter(subject => 
      subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
    );
    console.log(`Found ${aLevelSubjects.length} A-Level subjects.`);
    
    // Step 2: Fetch all subject combinations
    console.log('Fetching all subject combinations...');
    const combinationsResponse = await fetch(`${API_URL}/subject-combinations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!combinationsResponse.ok) {
      throw new Error(`Failed to fetch combinations: ${combinationsResponse.status} ${combinationsResponse.statusText}`);
    }
    
    const combinations = await combinationsResponse.json();
    console.log(`Found ${combinations.length} subject combinations.`);
    
    // Create a map of subject IDs to subjects for easy lookup
    const subjectMap = {};
    allSubjects.forEach(subject => {
      subjectMap[subject._id] = subject;
    });
    
    // Step 3: Identify which subjects should be principal
    // We'll consider a subject as principal if it's in the 'subjects' array of any combination
    const shouldBePrincipal = new Set();
    const shouldBeSubsidiary = new Set();
    
    combinations.forEach(combination => {
      // Check principal subjects
      if (combination.subjects && Array.isArray(combination.subjects)) {
        combination.subjects.forEach(subjectRef => {
          const subjectId = typeof subjectRef === 'object' ? subjectRef._id : subjectRef;
          shouldBePrincipal.add(subjectId);
        });
      }
      
      // Check subsidiary subjects
      if (combination.compulsorySubjects && Array.isArray(combination.compulsorySubjects)) {
        combination.compulsorySubjects.forEach(subjectRef => {
          const subjectId = typeof subjectRef === 'object' ? subjectRef._id : subjectRef;
          shouldBeSubsidiary.add(subjectId);
        });
      }
    });
    
    console.log(`Identified ${shouldBePrincipal.size} subjects that should be principal.`);
    console.log(`Identified ${shouldBeSubsidiary.size} subjects that should be subsidiary.`);
    
    // Step 4: Update subjects that need to be marked as principal
    const subjectsToUpdate = [];
    
    aLevelSubjects.forEach(subject => {
      const shouldBePrincipalFlag = shouldBePrincipal.has(subject._id);
      
      if (shouldBePrincipalFlag && !subject.isPrincipal) {
        console.log(`Subject ${subject.name} (${subject.code}) should be marked as principal.`);
        subjectsToUpdate.push({
          ...subject,
          isPrincipal: true
        });
      } else if (!shouldBePrincipalFlag && subject.isPrincipal && shouldBeSubsidiary.has(subject._id)) {
        console.log(`Subject ${subject.name} (${subject.code}) should be marked as subsidiary.`);
        subjectsToUpdate.push({
          ...subject,
          isPrincipal: false
        });
      }
    });
    
    console.log(`Found ${subjectsToUpdate.length} subjects that need updating.`);
    
    // Step 5: Update the subjects
    for (const subject of subjectsToUpdate) {
      console.log(`Updating subject: ${subject.name} (${subject.code})...`);
      
      const updateResponse = await fetch(`${API_URL}/subjects/${subject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subject)
      });
      
      if (!updateResponse.ok) {
        console.error(`Failed to update subject ${subject.name}: ${updateResponse.status} ${updateResponse.statusText}`);
        continue;
      }
      
      const updatedSubject = await updateResponse.json();
      console.log(`Successfully updated subject: ${updatedSubject.name} (${updatedSubject.code}) - isPrincipal: ${updatedSubject.isPrincipal}`);
      
      // Update our local copy
      subjectMap[subject._id] = updatedSubject;
    }
    
    console.log('Subject updates complete!');
    
    // Step 6: Check if any subjects are in the wrong array in combinations
    const combinationsToUpdate = [];
    
    combinations.forEach(combination => {
      let needsUpdate = false;
      const updatedCombination = {
        ...combination,
        subjects: [...(combination.subjects || [])],
        compulsorySubjects: [...(combination.compulsorySubjects || [])]
      };
      
      // Check if any principal subjects are in the subsidiary array
      if (combination.compulsorySubjects && Array.isArray(combination.compulsorySubjects)) {
        for (let i = combination.compulsorySubjects.length - 1; i >= 0; i--) {
          const subjectRef = combination.compulsorySubjects[i];
          const subjectId = typeof subjectRef === 'object' ? subjectRef._id : subjectRef;
          const subject = subjectMap[subjectId];
          
          if (subject && subject.isPrincipal) {
            console.log(`Subject ${subject.name} is marked as principal but is in the subsidiary array of combination ${combination.name}.`);
            
            // Remove from compulsorySubjects
            updatedCombination.compulsorySubjects.splice(i, 1);
            
            // Add to subjects if not already there
            const alreadyInSubjects = updatedCombination.subjects.some(s => 
              (typeof s === 'object' ? s._id : s) === subjectId
            );
            
            if (!alreadyInSubjects) {
              updatedCombination.subjects.push(subjectId);
            }
            
            needsUpdate = true;
          }
        }
      }
      
      // Check if any subsidiary subjects are in the principal array
      if (combination.subjects && Array.isArray(combination.subjects)) {
        for (let i = combination.subjects.length - 1; i >= 0; i--) {
          const subjectRef = combination.subjects[i];
          const subjectId = typeof subjectRef === 'object' ? subjectRef._id : subjectRef;
          const subject = subjectMap[subjectId];
          
          if (subject && !subject.isPrincipal) {
            console.log(`Subject ${subject.name} is not marked as principal but is in the principal array of combination ${combination.name}.`);
            
            // Remove from subjects
            updatedCombination.subjects.splice(i, 1);
            
            // Add to compulsorySubjects if not already there
            const alreadyInCompulsory = updatedCombination.compulsorySubjects.some(s => 
              (typeof s === 'object' ? s._id : s) === subjectId
            );
            
            if (!alreadyInCompulsory) {
              updatedCombination.compulsorySubjects.push(subjectId);
            }
            
            needsUpdate = true;
          }
        }
      }
      
      if (needsUpdate) {
        combinationsToUpdate.push(updatedCombination);
      }
    });
    
    console.log(`Found ${combinationsToUpdate.length} combinations that need updating.`);
    
    // Step 7: Update the combinations
    for (const combination of combinationsToUpdate) {
      console.log(`Updating combination: ${combination.name} (${combination.code})...`);
      
      const updateResponse = await fetch(`${API_URL}/subject-combinations/${combination._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(combination)
      });
      
      if (!updateResponse.ok) {
        console.error(`Failed to update combination ${combination.name}: ${updateResponse.status} ${updateResponse.statusText}`);
        continue;
      }
      
      const updatedCombination = await updateResponse.json();
      console.log(`Successfully updated combination: ${updatedCombination.name} (${updatedCombination.code})`);
    }
    
    console.log('Combination updates complete!');
    console.log('All updates complete! Your subjects should now be properly marked as principal or subsidiary.');
    
    // Create a visual notification
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.style.fontFamily = 'Arial, sans-serif';
    notification.style.fontSize = '16px';
    notification.textContent = `Updated ${subjectsToUpdate.length} subjects and ${combinationsToUpdate.length} combinations!`;
    
    document.body.appendChild(notification);
    
    // Remove the notification after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 5000);
    
  } catch (error) {
    console.error('Error fixing principal subjects:', error);
    
    // Create an error notification
    const errorNotification = document.createElement('div');
    errorNotification.style.position = 'fixed';
    errorNotification.style.top = '20px';
    errorNotification.style.left = '50%';
    errorNotification.style.transform = 'translateX(-50%)';
    errorNotification.style.backgroundColor = '#f44336';
    errorNotification.style.color = 'white';
    errorNotification.style.padding = '15px 20px';
    errorNotification.style.borderRadius = '4px';
    errorNotification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    errorNotification.style.zIndex = '9999';
    errorNotification.style.fontFamily = 'Arial, sans-serif';
    errorNotification.style.fontSize = '16px';
    errorNotification.textContent = `Error: ${error.message}`;
    
    document.body.appendChild(errorNotification);
    
    // Remove the notification after 5 seconds
    setTimeout(() => {
      errorNotification.style.opacity = '0';
      errorNotification.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        document.body.removeChild(errorNotification);
      }, 500);
    }, 5000);
  }
})();
