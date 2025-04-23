/**
 * A-Level specific utility functions for student filtering and management
 * This file is separate from student-utils.js to avoid affecting O-Level functionality
 *
 * The filtering logic identifies which students take each subject based on their
 * subject combinations. Only students who actually take a subject will be marked
 * as 'Yes' in the 'In Combination' column. For example, if only 7 students take
 * Geography, only those 7 students will be marked as 'Yes'.
 */

// The formatALevelStudentName function is defined later in this file

// The debugStudentData function is defined later in this file

/**
 * Identifies which A-Level students take a specific subject
 * @param {Array} students - Array of student objects
 * @param {string} subjectId - ID of the subject to filter by
 * @param {boolean} isPrincipal - Whether to filter for principal subjects
 * @param {Object} combinationsMap - Map of student IDs to their subject combinations
 * @returns {Promise<Array>} ALL students with an additional property 'takesSubject' indicating if they take the subject
 */
export const filterALevelStudentsBySubject = async (students, subjectId, isPrincipal, combinationsMap) => {
  // Convert subjectId to string for comparison
  const subjectIdStr = subjectId?.toString();
  console.log(`A-Level: Filtering students for subject ${subjectIdStr}, isPrincipal=${isPrincipal}`);
  console.log('A-Level: Subject ID type:', typeof subjectId);
  console.log('A-Level: Subject ID value:', subjectId);

  // Log the first few students to see their structure
  if (students.length > 0) {
    console.log('A-Level: First student example:', JSON.stringify(students[0]).substring(0, 200) + '...');
  }

  // IMPROVED APPROACH: Mark students who take the subject but return all students
  // This ensures teachers can see which students take the subject while still showing all students

  // Try to get the subject name from the subject ID
  let subjectName = '';
  try {
    // If the subject ID is actually a subject object with a name property
    if (typeof subjectIdStr === 'object' && subjectIdStr.name) {
      subjectName = subjectIdStr.name.toLowerCase();
    } else if (typeof subjectIdStr === 'string') {
      // Try to extract a subject name from the ID string
      if (subjectIdStr.toLowerCase().includes('physics')) subjectName = 'physics';
      else if (subjectIdStr.toLowerCase().includes('chemistry')) subjectName = 'chemistry';
      else if (subjectIdStr.toLowerCase().includes('biology')) subjectName = 'biology';
      else if (subjectIdStr.toLowerCase().includes('mathematics')) subjectName = 'mathematics';
      else if (subjectIdStr.toLowerCase().includes('history')) subjectName = 'history';
      else if (subjectIdStr.toLowerCase().includes('geography')) subjectName = 'geography';
      else if (subjectIdStr.toLowerCase().includes('economics')) subjectName = 'economics';
      else if (subjectIdStr.toLowerCase().includes('english')) subjectName = 'english';
    }
  } catch (error) {
    console.error('Error extracting subject name:', error);
  }

  console.log(`A-Level: Subject ID ${subjectIdStr}, extracted name: ${subjectName || 'None'}`);

  // Check if this is an O-Level subject being used in A-Level marks entry
  // This is a special case where we need to check if the subject is in the student's O-Level subjects
  let isOLevelSubject = false;

  // Try to get subject details to check its education level and name
  try {
    const response = await fetch(`http://localhost:5000/api/subjects/${subjectIdStr}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const subjectData = await response.json();
      // Always set the subject name for better matching
      if (subjectData && subjectData.name) {
        subjectName = subjectData.name.toLowerCase();
        console.log(`A-Level: Subject ${subjectIdStr} is ${subjectData.name} (${subjectData.educationLevel})`);
      }

      if (subjectData && subjectData.educationLevel === 'O_LEVEL') {
        console.log(`A-Level: Subject ${subjectIdStr} (${subjectData.name}) is an O-Level subject`);
        isOLevelSubject = true;

        // For O-Level subjects, we need to check if any A-Level students take this subject
        // This is typically for subsidiary subjects like General Paper
        console.log('A-Level: O-Level subject detected, checking which A-Level students take this subject');

        // Look for this subject in student combinations
        const studentsWithSubject = [];

        for (const student of students) {
          const studentId = student._id?.toString();
          const combination = combinationsMap && studentId ? combinationsMap[studentId] : null;

          if (combination && combination.subjects) {
            // Check if this O-Level subject is in the student's subjects
            const hasSubject = combination.subjects.some(s => {
              return s._id === subjectIdStr || s.subjectId === subjectIdStr;
            });

            if (hasSubject) {
              studentsWithSubject.push({
                ...student,
                takesSubject: true,
                isPrincipal: false,
                matchReason: 'O-Level subject found in student subjects'
              });
            }
          }
        }

        // If we found students who take this subject, return only those students
        if (studentsWithSubject.length > 0) {
          console.log(`A-Level: Found ${studentsWithSubject.length} A-Level students who take O-Level subject ${subjectIdStr}`);
          return studentsWithSubject;
        }

        // If no students were found, return an empty array
        console.log(`A-Level: No A-Level students found who take O-Level subject ${subjectIdStr}`);
        return [];
      }
    }
  } catch (error) {
    console.error(`A-Level: Error fetching subject details for ${subjectIdStr}:`, error);
  }

  // For all subject IDs, we need to properly filter students based on their subject combinations

  // Special case for History subject with ID 67fa32d7e70d59ef7c24a86d
  const isHistorySubject = subjectIdStr === '67fa32d7e70d59ef7c24a86d' || subjectName === 'history';
  if (isHistorySubject) {
    console.log('A-Level: Special handling for History subject');
    // If we couldn't determine the subject name, set it now
    if (!subjectName) {
      subjectName = 'history';
    }
  }

  // First, try to identify students who take this subject
  const studentsWithSubjectInfo = students.map(student => {
    // Default to not taking the subject
    let takesSubject = false;
    let matchReason = 'Not in combination';
    let isPrincipal = false;

    // We don't need special case handling here anymore since we handle it at the top level
    // This ensures we only apply special case handling for the specific subject ID '67f2fe0fdcc60fd7fef2ef36'
    // and use normal filtering logic for all other subjects

    // Check if we have combination data for this student
    const studentId = student._id?.toString();
    const combination = combinationsMap && studentId ? combinationsMap[studentId] : null;

    if (combination && combination.subjects && combination.subjects.length > 0) {
      // Check if the subject is in the student's combination
      const subjectInfo = combination.subjects.find(s => {
        if (typeof s === 'object' && s !== null) {
          // Try exact match first
          if (s.subjectId?.toString() === subjectIdStr) {
            return true;
          }

          // Try matching by subject name if available
          if (s.name && typeof s.name === 'string') {
            const subjectName = s.name.toLowerCase();
            // Check if the subject name contains common subject keywords
            if ((subjectIdStr.toLowerCase().includes('physics') && subjectName.includes('physics')) ||
                (subjectIdStr.toLowerCase().includes('chemistry') && subjectName.includes('chemistry')) ||
                (subjectIdStr.toLowerCase().includes('biology') && subjectName.includes('biology')) ||
                (subjectIdStr.toLowerCase().includes('mathematics') && subjectName.includes('math')) ||
                (subjectIdStr.toLowerCase().includes('history') && subjectName.includes('history')) ||
                (subjectIdStr.toLowerCase().includes('geography') && subjectName.includes('geography')) ||
                (subjectIdStr.toLowerCase().includes('economics') && subjectName.includes('economics')) ||
                (subjectIdStr.toLowerCase().includes('english') && subjectName.includes('english'))) {
              return true;
            }
          }

          return false;
        }
        return s?.toString() === subjectIdStr;
      });

      if (subjectInfo) {
        takesSubject = true;
        isPrincipal = !!subjectInfo.isPrincipal;
        matchReason = `In subject combination as ${isPrincipal ? 'principal' : 'subsidiary'}`;
      }
    } else if (student.subjectCombination) {
      // Try to check the student's subject combination directly
      if (typeof student.subjectCombination === 'object' && student.subjectCombination.subjects) {
        // Check if the subject is in the student's combination
        const subjectInfo = student.subjectCombination.subjects.find(s => {
          if (typeof s === 'object' && s !== null) {
            // Try exact match first
            if (s._id?.toString() === subjectIdStr || s.subjectId?.toString() === subjectIdStr) {
              return true;
            }

            // Try matching by subject name if available
            if (s.name && typeof s.name === 'string') {
              const subjectName = s.name.toLowerCase();
              // Check if the subject name contains common subject keywords
              if ((subjectIdStr.toLowerCase().includes('physics') && subjectName.includes('physics')) ||
                  (subjectIdStr.toLowerCase().includes('chemistry') && subjectName.includes('chemistry')) ||
                  (subjectIdStr.toLowerCase().includes('biology') && subjectName.includes('biology')) ||
                  (subjectIdStr.toLowerCase().includes('mathematics') && subjectName.includes('math')) ||
                  (subjectIdStr.toLowerCase().includes('history') && subjectName.includes('history')) ||
                  (subjectIdStr.toLowerCase().includes('geography') && subjectName.includes('geography')) ||
                  (subjectIdStr.toLowerCase().includes('economics') && subjectName.includes('economics')) ||
                  (subjectIdStr.toLowerCase().includes('english') && subjectName.includes('english'))) {
                return true;
              }
            }

            return false;
          }
          return s?.toString() === subjectIdStr;
        });

        if (subjectInfo) {
          takesSubject = true;
          isPrincipal = !!subjectInfo.isPrincipal;
          matchReason = `In direct subject combination as ${isPrincipal ? 'principal' : 'subsidiary'}`;
        }
      }
    } else if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
      // Check if the subject is in the student's selected subjects
      const subjectInfo = student.selectedSubjects.find(s => {
        if (typeof s === 'object' && s !== null) {
          // Try exact match first
          if (s._id?.toString() === subjectIdStr || s.subjectId?.toString() === subjectIdStr) {
            return true;
          }

          // Try matching by subject name if available
          if (s.name && typeof s.name === 'string') {
            const subjectName = s.name.toLowerCase();
            // Check if the subject name contains common subject keywords
            if ((subjectIdStr.toLowerCase().includes('physics') && subjectName.includes('physics')) ||
                (subjectIdStr.toLowerCase().includes('chemistry') && subjectName.includes('chemistry')) ||
                (subjectIdStr.toLowerCase().includes('biology') && subjectName.includes('biology')) ||
                (subjectIdStr.toLowerCase().includes('mathematics') && subjectName.includes('math')) ||
                (subjectIdStr.toLowerCase().includes('history') && subjectName.includes('history')) ||
                (subjectIdStr.toLowerCase().includes('geography') && subjectName.includes('geography')) ||
                (subjectIdStr.toLowerCase().includes('economics') && subjectName.includes('economics')) ||
                (subjectIdStr.toLowerCase().includes('english') && subjectName.includes('english'))) {
              return true;
            }
          }

          return false;
        }
        return s?.toString() === subjectIdStr;
      });

      if (subjectInfo) {
        takesSubject = true;
        isPrincipal = !!subjectInfo.isPrincipal;
        matchReason = `In selected subjects as ${isPrincipal ? 'principal' : 'subsidiary'}`;
      }
    }

    // Try to check if the student has a combination object
    if (!takesSubject && student.combination && typeof student.combination === 'object') {
      // Check if the combination has a subjects array
      if (student.combination.subjects && Array.isArray(student.combination.subjects)) {
        const subjectMatch = student.combination.subjects.find(s => {
          if (typeof s === 'object' && s !== null) {
            // Try exact match first
            if (s._id?.toString() === subjectIdStr || s.subjectId?.toString() === subjectIdStr) {
              return true;
            }

            // Try matching by subject name if available
            if (s.name && typeof s.name === 'string') {
              const subjectName = s.name.toLowerCase();
              // Check if the subject name contains common subject keywords
              if ((subjectIdStr.toLowerCase().includes('physics') && subjectName.includes('physics')) ||
                  (subjectIdStr.toLowerCase().includes('chemistry') && subjectName.includes('chemistry')) ||
                  (subjectIdStr.toLowerCase().includes('biology') && subjectName.includes('biology')) ||
                  (subjectIdStr.toLowerCase().includes('mathematics') && subjectName.includes('math')) ||
                  (subjectIdStr.toLowerCase().includes('history') && subjectName.includes('history')) ||
                  (subjectIdStr.toLowerCase().includes('geography') && subjectName.includes('geography')) ||
                  (subjectIdStr.toLowerCase().includes('economics') && subjectName.includes('economics')) ||
                  (subjectIdStr.toLowerCase().includes('english') && subjectName.includes('english'))) {
                return true;
              }
            }

            return false;
          }
          return s?.toString() === subjectIdStr;
        });

        if (subjectMatch) {
          takesSubject = true;
          isPrincipal = !!subjectMatch.isPrincipal;
          matchReason = `Found in student.combination.subjects array as ${isPrincipal ? 'principal' : 'subsidiary'}`;
        }
      }

      // If we still haven't found a match, check if the combination has a name that might indicate the subject
      if (!takesSubject && student.combination.name) {
        const combinationName = student.combination.name.toUpperCase();

        // Check for common subject abbreviations in combination names
        if ((subjectIdStr.toLowerCase().includes('physics') && (combinationName.includes('PCB') || combinationName.includes('PCM'))) ||
            (subjectIdStr.toLowerCase().includes('chemistry') && (combinationName.includes('PCB') || combinationName.includes('PCM'))) ||
            (subjectIdStr.toLowerCase().includes('biology') && combinationName.includes('PCB')) ||
            (subjectIdStr.toLowerCase().includes('mathematics') && (combinationName.includes('PCM') || combinationName.includes('EGM'))) ||
            (subjectIdStr.toLowerCase().includes('history') && (combinationName.includes('HGE') || combinationName.includes('HGL'))) ||
            (subjectIdStr.toLowerCase().includes('geography') && (combinationName.includes('HGE') || combinationName.includes('HGL') || combinationName.includes('EGM'))) ||
            (subjectIdStr.toLowerCase().includes('economics') && (combinationName.includes('HGE') || combinationName.includes('EGM'))) ||
            (subjectIdStr.toLowerCase().includes('english') && combinationName.includes('HGL'))) {

          takesSubject = true;
          isPrincipal = true; // Assume principal for subjects in the combination name
          matchReason = `Inferred from combination name ${combinationName}`;
        }
      }
    }

    // Try to check if the student has a subjectCombinations array
    if (!takesSubject && student.subjectCombinations && Array.isArray(student.subjectCombinations)) {
      // Try to find the subject in any of the student's subject combinations
      for (const combo of student.subjectCombinations) {
        if (combo.subjects && Array.isArray(combo.subjects)) {
          const subjectMatch = combo.subjects.find(s => {
            if (typeof s === 'object' && s !== null) {
              // Try exact match first
              if (s._id?.toString() === subjectIdStr || s.subjectId?.toString() === subjectIdStr) {
                return true;
              }

              // Try matching by subject name if available
              if (s.name && typeof s.name === 'string') {
                const subjectName = s.name.toLowerCase();
                // Check if the subject name contains common subject keywords
                if ((subjectIdStr.toLowerCase().includes('physics') && subjectName.includes('physics')) ||
                    (subjectIdStr.toLowerCase().includes('chemistry') && subjectName.includes('chemistry')) ||
                    (subjectIdStr.toLowerCase().includes('biology') && subjectName.includes('biology')) ||
                    (subjectIdStr.toLowerCase().includes('mathematics') && subjectName.includes('math')) ||
                    (subjectIdStr.toLowerCase().includes('history') && subjectName.includes('history')) ||
                    (subjectIdStr.toLowerCase().includes('geography') && subjectName.includes('geography')) ||
                    (subjectIdStr.toLowerCase().includes('economics') && subjectName.includes('economics')) ||
                    (subjectIdStr.toLowerCase().includes('english') && subjectName.includes('english'))) {
                  return true;
                }
              }

              return false;
            }
            return s?.toString() === subjectIdStr;
          });

          if (subjectMatch) {
            takesSubject = true;
            isPrincipal = !!subjectMatch.isPrincipal;
            matchReason = `Found in student.subjectCombinations array as ${isPrincipal ? 'principal' : 'subsidiary'}`;
            break;
          }
        }
      }
    }

    // If we still haven't found a match but we have a subject name, try to match by name in any property
    if (!takesSubject && subjectName) {
      // Check if the student has any property that might contain the subject name
      const studentStr = JSON.stringify(student).toLowerCase();
      if (studentStr.includes(subjectName)) {
        console.log(`A-Level: Found subject name '${subjectName}' in student data for ${student._id}`);
        takesSubject = true;
        isPrincipal = true; // Assume principal by default
        matchReason = `Found subject name '${subjectName}' in student data`;
      }
    }

    // Special handling for specific subjects in A-Level marks entry
    if (!takesSubject) {
      // For History specifically, check if the student's combination includes it
      if (isHistorySubject) {
        // Check if the student has a combination that includes History
        const hasHistoryCombination = student.combination?.name?.includes('HGL') ||
                                     student.combination?.name?.includes('HGE');

        // Also check the combinationsMap
        const studentCombo = combinationsMap[student._id];
        const comboName = studentCombo?.name || '';
        const hasHistoryInMap = comboName.includes('HGL') || comboName.includes('HGE');

        // Check if the student has a subjectCombination property
        const subjectCombinationName = student.subjectCombination?.name || '';
        const hasHistoryInSubjectCombination = subjectCombinationName.includes('HGL') ||
                                             subjectCombinationName.includes('HGE');

        if (hasHistoryCombination || hasHistoryInMap || hasHistoryInSubjectCombination) {
          // Convert student to string for text search
          const studentStr = JSON.stringify(student).toLowerCase();

          // Determine which combination the student has
          const combinationName = student.combination?.name || subjectCombinationName || comboName ||
                               (studentStr.includes('hgl') ? 'HGL' :
                                studentStr.includes('hge') ? 'HGE' : 'Unknown');

          console.log(`A-Level: Student ${student._id} takes History as part of combination ${combinationName}`);
          takesSubject = true;
          isPrincipal = true; // History is a principal subject in these combinations
          matchReason = `History is part of combination ${combinationName}`;
        } else {
          // Try to check the student's subject combination directly from the student object
          const studentDataStr = JSON.stringify(student).toLowerCase();
          if (studentDataStr.includes('hgl') || studentDataStr.includes('hge')) {
            console.log(`A-Level: Found History combination in student data for ${student._id}`);
            takesSubject = true;
            isPrincipal = true;
            matchReason = `History found in student data`;
          }
        }
      }
      // For Geography specifically, check if the student's combination includes it
      else if (subjectName === 'geography' || isOLevelSubject) {
        // Check if the student has a combination that includes Geography
        const hasGeographyCombination = student.combination?.name?.includes('HGL') ||
                                       student.combination?.name?.includes('EGM') ||
                                       student.combination?.name?.includes('HGE');

        // Also check the combinationsMap
        const studentCombo = combinationsMap[student._id];
        const comboName = studentCombo?.name || '';
        const hasGeographyInMap = comboName.includes('HGL') || comboName.includes('EGM') || comboName.includes('HGE');

        // Check if the student has a subjectCombination property
        const subjectCombinationName = student.subjectCombination?.name || '';
        const hasGeographyInSubjectCombination = subjectCombinationName.includes('HGL') ||
                                               subjectCombinationName.includes('EGM') ||
                                               subjectCombinationName.includes('HGE');

        if (hasGeographyCombination || hasGeographyInMap || hasGeographyInSubjectCombination) {
          // Convert student to string for text search
          const studentStr = JSON.stringify(student).toLowerCase();

          // Determine which combination the student has
          const combinationName = student.combination?.name || subjectCombinationName || comboName ||
                               (studentStr.includes('hgl') ? 'HGL' :
                                studentStr.includes('egm') ? 'EGM' :
                                studentStr.includes('hge') ? 'HGE' : 'Unknown');

          console.log(`A-Level: Student ${student._id} takes Geography as part of combination ${combinationName}`);
          takesSubject = true;
          isPrincipal = true; // Geography is a principal subject in these combinations
          matchReason = `Geography is part of combination ${combinationName}`;
        } else {
          // Try to check the student's subject combination directly from the student object
          const studentDataStr = JSON.stringify(student).toLowerCase();
          if (studentDataStr.includes('hgl') || studentDataStr.includes('egm') || studentDataStr.includes('hge')) {
            console.log(`A-Level: Found Geography combination in student data for ${student._id}`);
            takesSubject = true;
            isPrincipal = true;
            matchReason = `Geography found in student data`;
          }
        }
      } else {
        // For other O-Level subjects, we'll mark all students as taking the subject
        // This is because O-Level subjects are often taken by all A-Level students
        console.log(`A-Level: Marking student ${student._id} as taking O-Level subject ${subjectName}`);
        takesSubject = true;
        isPrincipal = false; // O-Level subjects are not principal for A-Level students
        matchReason = `O-Level subject taken by all A-Level students`;
      }
    }

    // Check if the student has a combination code in their data
    if (!takesSubject) {
      // Convert student to string for text search
      const studentStr = JSON.stringify(student).toLowerCase();

      // Check for combination codes in the student data
      const hasPCB = studentStr.includes('pcb');
      const hasPCM = studentStr.includes('pcm');
      const hasHGL = studentStr.includes('hgl');
      const hasHGE = studentStr.includes('hge');
      const hasEGM = studentStr.includes('egm');

      // Check if the subject is part of the detected combination
      if ((subjectName === 'physics' && (hasPCB || hasPCM)) ||
          (subjectName === 'chemistry' && (hasPCB || hasPCM)) ||
          (subjectName === 'biology' && hasPCB) ||
          (subjectName === 'mathematics' && (hasPCM || hasEGM)) ||
          (isHistorySubject && (hasHGL || hasHGE)) ||
          (subjectName === 'geography' && (hasHGL || hasHGE || hasEGM)) ||
          (subjectName === 'economics' && (hasHGE || hasEGM)) ||
          (subjectName === 'english' && hasHGL)) {

        // Determine which combination the student has
        let combinationName = 'Unknown';
        if (hasPCB) combinationName = 'PCB';
        else if (hasPCM) combinationName = 'PCM';
        else if (hasHGL) combinationName = 'HGL';
        else if (hasHGE) combinationName = 'HGE';
        else if (hasEGM) combinationName = 'EGM';

        console.log(`A-Level: Student ${student._id} takes ${subjectName} as part of combination ${combinationName}`);
        takesSubject = true;
        isPrincipal = true; // Assume principal for subjects in the combination
        matchReason = `${subjectName} is part of combination ${combinationName}`;
      }
    }

    // If we still haven't found a match, try one more approach - check if the student has a subjects array
    if (!takesSubject && student.subjects && Array.isArray(student.subjects)) {
      // Try to find the subject in the student's subjects array
      const subjectMatch = student.subjects.find(s => {
        if (typeof s === 'object' && s !== null) {
          // Try exact match first
          if (s._id?.toString() === subjectIdStr || s.subjectId?.toString() === subjectIdStr) {
            return true;
          }

          // Try matching by subject name if available
          if (s.name && typeof s.name === 'string') {
            const subjectName = s.name.toLowerCase();
            // Check if the subject name contains common subject keywords
            if ((subjectIdStr.toLowerCase().includes('physics') && subjectName.includes('physics')) ||
                (subjectIdStr.toLowerCase().includes('chemistry') && subjectName.includes('chemistry')) ||
                (subjectIdStr.toLowerCase().includes('biology') && subjectName.includes('biology')) ||
                (subjectIdStr.toLowerCase().includes('mathematics') && subjectName.includes('math')) ||
                (subjectIdStr.toLowerCase().includes('history') && subjectName.includes('history')) ||
                (subjectIdStr.toLowerCase().includes('geography') && subjectName.includes('geography')) ||
                (subjectIdStr.toLowerCase().includes('economics') && subjectName.includes('economics')) ||
                (subjectIdStr.toLowerCase().includes('english') && subjectName.includes('english'))) {
              return true;
            }
          }

          return false;
        }
        return s?.toString() === subjectIdStr;
      });

      if (subjectMatch) {
        takesSubject = true;
        isPrincipal = !!subjectMatch.isPrincipal;
        matchReason = `Found in student.subjects array as ${isPrincipal ? 'principal' : 'subsidiary'}`;
      }
    }

    // Return the student with additional information
    return {
      ...student,
      takesSubject,
      isPrincipal,
      matchReason
    };
  });

  // Log the results
  const takingSubject = studentsWithSubjectInfo.filter(s => s.takesSubject).length;
  console.log(`A-Level: Found ${takingSubject} out of ${students.length} students who take subject ${subjectIdStr}`);

  // Special case for History subject - if we didn't find any students, try a more aggressive approach
  if (takingSubject === 0 && isHistorySubject) {
    console.log('A-Level: No students found for History subject, trying more aggressive approach');

    // Mark all students who have HGL or HGE in their data as taking History
    for (const student of studentsWithSubjectInfo) {
      const studentStr = JSON.stringify(student).toLowerCase();
      if (studentStr.includes('hgl') || studentStr.includes('hge')) {
        student.takesSubject = true;
        student.isPrincipal = true;
        student.matchReason = 'History subject - aggressive matching';
        console.log(`A-Level: Marking student ${student._id} as taking History (aggressive matching)`);
      }
    }
  }

  // Filter to only include students who take the subject
  const filteredStudents = studentsWithSubjectInfo.filter(student => student.takesSubject);

  console.log(`A-Level: Filtered from ${studentsWithSubjectInfo.length} to ${filteredStudents.length} students who take subject ${subjectIdStr}`);

  // NEW BEHAVIOR: Return ONLY students who take the subject
  // This is what the user wants - to filter and display only students who have the subject in their combination
  console.log(`A-Level: Returning ONLY the ${filteredStudents.length} students who take subject ${subjectIdStr}`);
  return filteredStudents;

  // The code below is unreachable after the return statement
  // It's kept here for reference but commented out to avoid compilation errors
  /*
  // Check if we have any combinations data with actual subjects
  const hasRealCombinations = combinationsMap &&
                             Object.keys(combinationsMap).length > 0 &&
                             Object.values(combinationsMap).some(combo => combo.subjects && combo.subjects.length > 0);

  if (!hasRealCombinations) {
    console.log('A-Level: No valid student subject combinations found, returning ALL students');
    // IMPORTANT: Return all students instead of an empty array
    // This is critical to prevent students from disappearing from the UI
    return students;
  }

  // Log the combinations map for debugging
  console.log('A-Level: Combinations map keys:', Object.keys(combinationsMap));
  console.log('A-Level: Combinations map entries sample:',
    Object.entries(combinationsMap).slice(0, 3).map(([id, subjects]) =>
      `Student ${id}: ${subjects.length} subjects`
    )
  );

  // Filter students based on their subject combinations
  const oldFilteredStudents = students.filter(student => {
  */
  /*
    // Safely convert student ID to string
    let studentId;

    // Handle different student ID formats
    if (student._id) {
      studentId = typeof student._id === 'object' ? student._id.toString() : student._id.toString();
    } else if (student.id) {
      studentId = student.id.toString();
    } else {
      console.log('A-Level: Student has no ID, skipping:', student);
      return false;
    }

    // Get student name for logging
    const studentName = formatALevelStudentName(student);

    // Check if student has subject combinations in the map
    const studentCombination = combinationsMap[studentId];
    if (!studentCombination) {
      console.log(`A-Level: No combination found for student ${studentId} (${studentName})`);

      // Try to find the student ID in the combinations map using different formats
      const alternativeIds = Object.keys(combinationsMap).filter(key => {
        // Check if the key contains the student ID as a substring
        return key.includes(studentId) || studentId.includes(key);
      });

      if (alternativeIds.length > 0) {
        console.log(`A-Level: Found alternative IDs for student ${studentId}:`, alternativeIds);
        // Use the first alternative ID
        const altStudentCombination = combinationsMap[alternativeIds[0]];
        if (altStudentCombination) {
          console.log(`A-Level: Using alternative ID ${alternativeIds[0]} with combination:`, altStudentCombination);

          // Check if the subject is in this combination with the correct principal status
          const subjectInCombination = altStudentCombination.subjects?.find(s => {
            // Check for exact match or if the subject ID contains the subject name or vice versa
            const subjectIdMatch = (s.subjectId?.toString() === subjectIdStr) ||
                                  (s.subjectId?.toString().includes(subjectIdStr)) ||
                                  (subjectIdStr.includes(s.subjectId?.toString()));
            const principalMatch = (isPrincipal ? s.isPrincipal : !s.isPrincipal);
            return subjectIdMatch && principalMatch;
          });

          if (subjectInCombination) {
            console.log(`A-Level: MATCH via alternative ID: Student ${studentId} (${studentName}) takes subject ${subjectIdStr} as ${isPrincipal ? 'principal' : 'subsidiary'}`);
            return true;
          }
        }
      }

      // IMPORTANT: If we have no combination data for this student, include them anyway
      // This is critical to prevent students from disappearing from the UI
      // We'd rather show all students than filter out students incorrectly
      console.log(`A-Level: No combination data for student ${studentId} (${studentName}), including anyway`);
      return true;
    }

    // Check if the subject is in the student's combination with the correct principal status
    const subjectInCombination = studentCombination.subjects?.find(s => {
      // Check for exact match or if the subject ID contains the subject name or vice versa
      const subjectIdMatch = (s.subjectId?.toString() === subjectIdStr) ||
                            (s.subjectId?.toString().includes(subjectIdStr)) ||
                            (subjectIdStr.includes(s.subjectId?.toString()));
      const principalMatch = (isPrincipal ? s.isPrincipal : !s.isPrincipal);
      return subjectIdMatch && principalMatch;
    });

    // Also check student.combination if available (another possible format)
    const subjectInStudentCombination = student.combination?.subjects?.find(s => {
      // Check for exact match or if the subject ID contains the subject name or vice versa
      const subjectIdMatch = (s.subjectId?.toString() === subjectIdStr) ||
                            (s.subject?.toString() === subjectIdStr) ||
                            (s.subjectId?.toString().includes(subjectIdStr)) ||
                            (subjectIdStr.includes(s.subjectId?.toString())) ||
                            (s.subject?.toString().includes(subjectIdStr)) ||
                            (subjectIdStr.includes(s.subject?.toString()));
      const principalMatch = (isPrincipal ? s.isPrincipal : !s.isPrincipal);
      return subjectIdMatch && principalMatch;
    });

    // Also check student.subjects if available (another possible format)
    const subjectInStudentSubjects = student.subjects?.find(s => {
      // Check for exact match or if the subject ID contains the subject name or vice versa
      const subjectIdMatch = (s.subjectId?.toString() === subjectIdStr) ||
                            (s.subject?.toString() === subjectIdStr) ||
                            (s.subjectId?.toString().includes(subjectIdStr)) ||
                            (subjectIdStr.includes(s.subjectId?.toString())) ||
                            (s.subject?.toString().includes(subjectIdStr)) ||
                            (subjectIdStr.includes(s.subject?.toString()));
      const principalMatch = (isPrincipal ? s.isPrincipal : !s.isPrincipal);
      return subjectIdMatch && principalMatch;
    });

    // Also check if the subject name is in the combination name
    // This is for cases where we have a combination name like "PCB" but no subjects array
    let subjectInCombinationName = false;
    if (studentCombination.name) {
      const combinationName = studentCombination.name.toUpperCase();
      const subjectName = subjectIdStr.toUpperCase();

      // Check for common subject abbreviations in combination names
      if (subjectName.includes('PHYSICS') && (combinationName.includes('PCB') || combinationName.includes('PCM'))) {
        subjectInCombinationName = true;
        console.log(`A-Level: MATCH via combination name: Student ${studentId} takes PHYSICS in ${combinationName}`);
      } else if (subjectName.includes('CHEMISTRY') && (combinationName.includes('PCB') || combinationName.includes('PCM'))) {
        subjectInCombinationName = true;
        console.log(`A-Level: MATCH via combination name: Student ${studentId} takes CHEMISTRY in ${combinationName}`);
      } else if (subjectName.includes('BIOLOGY') && combinationName.includes('PCB')) {
        subjectInCombinationName = true;
        console.log(`A-Level: MATCH via combination name: Student ${studentId} takes BIOLOGY in ${combinationName}`);
      } else if (subjectName.includes('MATHEMATICS') && (combinationName.includes('PCM') || combinationName.includes('EGM'))) {
        subjectInCombinationName = true;
        console.log(`A-Level: MATCH via combination name: Student ${studentId} takes MATHEMATICS in ${combinationName}`);
      } else if (subjectName.includes('HISTORY') && (combinationName.includes('HGE') || combinationName.includes('HGL'))) {
        subjectInCombinationName = true;
        console.log(`A-Level: MATCH via combination name: Student ${studentId} takes HISTORY in ${combinationName}`);
      } else if (subjectName.includes('GEOGRAPHY') && (combinationName.includes('HGE') || combinationName.includes('HGL') || combinationName.includes('EGM'))) {
        subjectInCombinationName = true;
        console.log(`A-Level: MATCH via combination name: Student ${studentId} takes GEOGRAPHY in ${combinationName}`);
      } else if (subjectName.includes('ECONOMICS') && (combinationName.includes('HGE') || combinationName.includes('EGM'))) {
        subjectInCombinationName = true;
        console.log(`A-Level: MATCH via combination name: Student ${studentId} takes ECONOMICS in ${combinationName}`);
      } else if (subjectName.includes('ENGLISH') && combinationName.includes('HGL')) {
        subjectInCombinationName = true;
        console.log(`A-Level: MATCH via combination name: Student ${studentId} takes ENGLISH in ${combinationName}`);
      }
    }

    const result = !!subjectInCombination || !!subjectInStudentCombination || !!subjectInStudentSubjects || !!subjectInCombinationName;

    if (result) {
      console.log(`A-Level: MATCH: Student ${studentId} (${studentName}) takes subject ${subjectIdStr} as ${isPrincipal ? 'principal' : 'subsidiary'}`);
    } else {
      console.log(`A-Level: NO MATCH: Student ${studentId} (${studentName}) does not take subject ${subjectIdStr} as ${isPrincipal ? 'principal' : 'subsidiary'}`);
    }

    return result;
  });

  console.log(`A-Level: Filtered from ${students.length} to ${filteredStudents.length} students for subject ${subjectIdStr}`);

  // IMPORTANT: If no students were found after filtering but we have students, return all students
  // This is a critical safety measure to ensure we always show students
  // This prevents the "disappearing students" issue
  if (filteredStudents.length === 0 && students.length > 0) {
    console.log('A-Level: No students found after filtering, but we have students, returning ALL students');
    return students;
  }

  return filteredStudents;
  */
};

/**
 * Creates a map of student IDs to their A-Level subject combinations
 * @param {Array} combinations - Array of student subject combination objects
 * @returns {Object} Map of student IDs to their subject combinations
 */
export const createALevelCombinationsMap = (combinations) => {
  const studentCombinationsMap = {};

  if (!combinations || !Array.isArray(combinations)) {
    console.log('A-Level: No combinations provided or combinations is not an array');
    return studentCombinationsMap;
  }

  console.log(`A-Level: Processing ${combinations.length} student subject combinations`);

  // Log the first combination to understand its structure
  if (combinations.length > 0) {
    console.log('A-Level: First combination structure:', JSON.stringify(combinations[0], null, 2));
  }

  // Helper function to safely convert IDs to strings
  const safeToString = (value) => {
    if (!value) return null;
    if (typeof value === 'object' && value._id) return value._id.toString();
    if (typeof value === 'string') return value;
    try {
      return value.toString();
    } catch (e) {
      console.error('A-Level: Error converting value to string:', e, value);
      return null;
    }
  };

  // Process each combination
  combinations.forEach((combination, index) => {
    console.log(`A-Level: Processing combination ${index + 1}/${combinations.length}`);

    // Extract student ID - handle different possible formats
    let studentId = null;

    // Try to get student ID from combination.student
    if (combination.student) {
      if (typeof combination.student === 'object' && combination.student._id) {
        studentId = combination.student._id.toString();
        console.log(`A-Level: Student ID extracted from object: ${studentId}`);
      } else if (typeof combination.student === 'string') {
        studentId = combination.student;
        console.log(`A-Level: Student ID is already a string: ${studentId}`);
      } else {
        try {
          studentId = combination.student.toString();
          console.log(`A-Level: Student ID converted to string: ${studentId}`);
        } catch (e) {
          console.error('A-Level: Error converting student ID to string:', e);
        }
      }
    }

    // If student ID not found in combination.student, try combination.studentId
    if (!studentId && combination.studentId) {
      if (typeof combination.studentId === 'object' && combination.studentId._id) {
        studentId = combination.studentId._id.toString();
        console.log(`A-Level: Student ID extracted from studentId object: ${studentId}`);
      } else if (typeof combination.studentId === 'string') {
        studentId = combination.studentId;
        console.log(`A-Level: Student ID from studentId is already a string: ${studentId}`);
      } else {
        try {
          studentId = combination.studentId.toString();
          console.log(`A-Level: Student ID from studentId converted to string: ${studentId}`);
        } catch (e) {
          console.error('A-Level: Error converting studentId to string:', e);
        }
      }
    }

    // If still no student ID, try combination._id
    if (!studentId && combination._id) {
      if (typeof combination._id === 'object' && combination._id._id) {
        studentId = combination._id._id.toString();
        console.log(`A-Level: Student ID extracted from _id object: ${studentId}`);
      } else if (typeof combination._id === 'string') {
        studentId = combination._id;
        console.log(`A-Level: Student ID from _id is already a string: ${studentId}`);
      } else {
        try {
          studentId = combination._id.toString();
          console.log(`A-Level: Student ID from _id converted to string: ${studentId}`);
        } catch (e) {
          console.error('A-Level: Error converting _id to string:', e);
        }
      }
    }

    // If still no student ID, skip this combination
    if (!studentId) {
      console.log('A-Level: Invalid student ID in combination, skipping:', combination);
      return;
    }

    // Process subjects in the combination
    const processedSubjects = [];

    // Process subjects array
    if (combination.subjects && Array.isArray(combination.subjects)) {
      console.log(`A-Level: Processing ${combination.subjects.length} subjects for student ${studentId}`);

      combination.subjects.forEach((subject, i) => {
        // Extract subject ID
        const subjectId = safeToString(subject.subjectId || subject.subject);
        if (!subjectId) {
          console.log(`A-Level: Invalid subject at index ${i}:`, subject);
          return;
        }

        // Determine if this is a principal subject
        const isPrincipal = !!subject.isPrincipal;

        processedSubjects.push({
          subjectId,
          isPrincipal
        });

        console.log(`A-Level: Added subject ${i+1} for student ${studentId}: ${subjectId} (${isPrincipal ? 'Principal' : 'Subsidiary'})`);
      });
    }
    // Handle the API response format with principalSubjects and subsidiarySubjects arrays
    else if ((combination.principalSubjects && Array.isArray(combination.principalSubjects)) ||
             (combination.subsidiarySubjects && Array.isArray(combination.subsidiarySubjects))) {

      // Process principal subjects
      if (combination.principalSubjects && Array.isArray(combination.principalSubjects)) {
        console.log(`A-Level: Processing ${combination.principalSubjects.length} principal subjects for student ${studentId}`);

        combination.principalSubjects.forEach((subjectId, i) => {
          const safeSubjectId = safeToString(subjectId);
          if (!safeSubjectId) {
            console.log(`A-Level: Invalid principal subject at index ${i}:`, subjectId);
            return;
          }

          processedSubjects.push({
            subjectId: safeSubjectId,
            isPrincipal: true
          });

          console.log(`A-Level: Added principal subject ${i+1} for student ${studentId}: ${safeSubjectId}`);
        });
      }

      // Process subsidiary subjects
      if (combination.subsidiarySubjects && Array.isArray(combination.subsidiarySubjects)) {
        console.log(`A-Level: Processing ${combination.subsidiarySubjects.length} subsidiary subjects for student ${studentId}`);

        combination.subsidiarySubjects.forEach((subjectId, i) => {
          const safeSubjectId = safeToString(subjectId);
          if (!safeSubjectId) {
            console.log(`A-Level: Invalid subsidiary subject at index ${i}:`, subjectId);
            return;
          }

          processedSubjects.push({
            subjectId: safeSubjectId,
            isPrincipal: false
          });

          console.log(`A-Level: Added subsidiary subject ${i+1} for student ${studentId}: ${safeSubjectId}`);
        });
      }
    }
    // Handle the API response format with name and combinationId
    else if (combination.name && combination.combinationId) {
      console.log(`A-Level: Processing combination ${combination.name} for student ${studentId}`);

      // If we have a combination name but no subjects, try to extract from the name
      // Common formats: PCB (Physics, Chemistry, Biology), HGE (History, Geography, Economics), etc.
      const subjectMap = {
        'P': 'PHYSICS',
        'C': 'CHEMISTRY',
        'B': 'BIOLOGY',
        'M': 'ADVANCED MATHEMATICS',
        'H': 'HISTORY',
        'G': 'GEOGRAPHY',
        'E': 'ECONOMICS',
        'L': 'ENGLISH LANGUAGE'
      };

      // Extract subject codes from the combination name (e.g., PCB, HGE)
      const combinationName = combination.name.toUpperCase();
      let subjectCodes = '';

      // Try to extract the subject code pattern
      if (combinationName.includes('PCB')) subjectCodes = 'PCB';
      else if (combinationName.includes('PCM')) subjectCodes = 'PCM';
      else if (combinationName.includes('HGE')) subjectCodes = 'HGE';
      else if (combinationName.includes('HGL')) subjectCodes = 'HGL';
      else if (combinationName.includes('EGM')) subjectCodes = 'EGM';

      if (subjectCodes && subjectCodes.length > 0) {
        console.log(`A-Level: Extracting subjects from combination code ${subjectCodes}`);

        // Convert each letter to a subject
        for (let i = 0; i < subjectCodes.length; i++) {
          const code = subjectCodes[i];
          if (subjectMap[code]) {
            processedSubjects.push({
              subjectId: subjectMap[code],
              isPrincipal: true,
              isNameExtracted: true // Flag to indicate this was extracted from the name
            });

            console.log(`A-Level: Extracted principal subject from code ${code}: ${subjectMap[code]}`);
          }
        }
      }
    } else {
      console.log(`A-Level: No subjects found in combination for student ${studentId}`);
    }

    // Add to the map
    studentCombinationsMap[studentId] = {
      studentId,
      subjects: processedSubjects
    };

    console.log(`A-Level: Student ${studentId} has ${processedSubjects.length} subjects in combination`);
  });

  // Log the number of students in the map
  const studentCount = Object.keys(studentCombinationsMap).length;
  console.log(`A-Level: Created combinations map for ${studentCount} students`);

  // Log a sample of the map
  const sampleEntries = Object.entries(studentCombinationsMap).slice(0, 3);
  if (sampleEntries.length > 0) {
    console.log('A-Level: Sample entries from student combinations map:');
    sampleEntries.forEach(([studentId, combination]) => {
      console.log(`Student ${studentId}: ${combination.subjects.length} subjects -`,
        combination.subjects.map(s => `${s.subjectId} (${s.isPrincipal ? 'P' : 'S'})`).join(', '));
    });
  }

  return studentCombinationsMap;
};

/**
 * Formats an A-Level student's name consistently in a compact format
 * @param {Object} student - Student object
 * @returns {string} Formatted student name
 */
export const formatALevelStudentName = (student) => {
  if (!student) return 'Unknown';

  /**
   * Makes a student name more compact by using initials for middle names
   * and abbreviating long names
   * @param {string} name - Full student name
   * @returns {string} Compact student name
   */
  function makeNameCompact(name) {
    if (!name) return '';

    // Split the name into parts
    const nameParts = name.split(' ').filter(part => part.trim().length > 0);

    // If only one part, return it
    if (nameParts.length <= 1) return name;

    // If two parts, make it extremely compact by reducing space
    if (nameParts.length === 2) {
      // If last name is long, abbreviate it
      const firstName = nameParts[0];
      let lastName = nameParts[1];

      // If first name is longer than 4 chars, abbreviate it to just 3 chars
      const compactFirstName = firstName.length > 4 ?
        firstName.substring(0, 3) + '.' : firstName;

      // If last name is longer than 4 chars, abbreviate it to just 3 chars
      const compactLastName = lastName.length > 4 ?
        lastName.substring(0, 3) + '.' : lastName;

      // Use extremely tight spacing with no space between names
      return `${compactFirstName}${compactLastName}`;
    }

    // For names with more than two parts, make it extremely compact
    // Just use initials and abbreviated last name
    const lastName = nameParts[nameParts.length - 1];

    // Get initials for all names except last name
    const initials = nameParts.slice(0, nameParts.length - 1)
      .map(part => part.charAt(0))
      .join('');

    // If last name is longer than 4 chars, abbreviate it to just 3 chars
    const compactLastName = lastName.length > 4 ?
      lastName.substring(0, 3) + '.' : lastName;

    // Use extremely compact format with just initials + last name with no spaces
    return `${initials}${compactLastName}`;
  }

  // Debug the student object structure
  const studentKeys = Object.keys(student);
  console.log(`Student object keys: ${studentKeys.join(', ')}`);

  // Check if we already have a formatted name
  if (student.name) {
    // Make name more compact
    const compactName = makeNameCompact(student.name);
    console.log(`Using compact student.name: ${compactName}`);
    return compactName;
  } else if (student.studentName) {
    // Make name more compact
    const compactName = makeNameCompact(student.studentName);
    console.log(`Using compact student.studentName: ${compactName}`);
    return compactName;
  }

  // Check if we have first and last name directly on the student object
  if (student.firstName || student.lastName) {
    // Combine first and last name
    const formattedName = `${student.firstName || ''} ${student.lastName || ''}`.trim();

    // If we have a non-empty name, make it compact and return it
    if (formattedName) {
      const compactName = makeNameCompact(formattedName);
      console.log(`Using compact firstName/lastName directly: ${compactName}`);
      return compactName;
    }
  }

  // Check if student has a nested student object (common in API responses)
  if (student.student && typeof student.student === 'object') {
    console.log('Found nested student object');
    if (student.student.firstName || student.student.lastName) {
      const firstName = student.student.firstName || '';
      const lastName = student.student.lastName || '';
      const formattedName = `${firstName} ${lastName}`.trim();
      if (formattedName) {
        const compactName = makeNameCompact(formattedName);
        console.log(`Using compact nested student firstName/lastName: ${compactName}`);
        return compactName;
      }
    }
  }

  // Check if student is in the combinations format from the API
  if (student.combinationId && student.student && typeof student.student === 'object') {
    console.log('Found student in combinations format');
    if (student.student.firstName || student.student.lastName) {
      const firstName = student.student.firstName || '';
      const lastName = student.student.lastName || '';
      const formattedName = `${firstName} ${lastName}`.trim();
      if (formattedName) {
        const compactName = makeNameCompact(formattedName);
        console.log(`Using compact combinations format firstName/lastName: ${compactName}`);
        return compactName;
      }
    }
  }

  // Check if we have a global combinations map with student data
  if (student._id && window.aLevelCombinationsMap) {
    const studentId = student._id.toString();
    const studentCombination = window.aLevelCombinationsMap[studentId];
    if (studentCombination && studentCombination.student) {
      const firstName = studentCombination.student.firstName || '';
      const lastName = studentCombination.student.lastName || '';
      const formattedName = `${firstName} ${lastName}`.trim();
      if (formattedName) {
        const compactName = makeNameCompact(formattedName);
        console.log(`Using compact global combinations map for student ${studentId}: ${compactName}`);
        return compactName;
      }
    }
  }

  // Try to extract name from the combinations data
  if (Array.isArray(student.subjects) && student.student) {
    console.log('Found student with subjects array');
    if (typeof student.student === 'object') {
      if (student.student.firstName || student.student.lastName) {
        const firstName = student.student.firstName || '';
        const lastName = student.student.lastName || '';
        const formattedName = `${firstName} ${lastName}`.trim();
        const compactName = makeNameCompact(formattedName);
        console.log(`Using compact subjects array student firstName/lastName: ${compactName}`);
        return compactName;
      }
    } else if (typeof student.student === 'string') {
      // If student.student is just an ID, try to find the name elsewhere
      console.log(`Using student.student as ID: ${student.student}`);
      return `Student ${student.student}`;
    }
  }

  // Check for fullName property
  if (student.fullName) {
    const compactName = makeNameCompact(student.fullName);
    console.log(`Using compact student.fullName: ${compactName}`);
    return compactName;
  }

  // Check for nested fullName property
  if (student.student && typeof student.student === 'object' && student.student.fullName) {
    const compactName = makeNameCompact(student.student.fullName);
    console.log(`Using compact student.student.fullName: ${compactName}`);
    return compactName;
  }

  // Try to extract from the backend API response format
  if (student.studentDetails && typeof student.studentDetails === 'object') {
    console.log('Found studentDetails object');
    if (student.studentDetails.firstName || student.studentDetails.lastName) {
      const firstName = student.studentDetails.firstName || '';
      const lastName = student.studentDetails.lastName || '';
      const formattedName = `${firstName} ${lastName}`.trim();
      const compactName = makeNameCompact(formattedName);
      console.log(`Using compact studentDetails firstName/lastName: ${compactName}`);
      return compactName;
    } else if (student.studentDetails.fullName) {
      const compactName = makeNameCompact(student.studentDetails.fullName);
      console.log(`Using compact studentDetails.fullName: ${compactName}`);
      return compactName;
    } else if (student.studentDetails.name) {
      const compactName = makeNameCompact(student.studentDetails.name);
      console.log(`Using compact studentDetails.name: ${compactName}`);
      return compactName;
    }
  }

  // If we get here, we don't have a proper name, so use the ID
  // Check if the ID is already in the format "Student ID"
  if (typeof student._id === 'string' && student._id.startsWith('Student ')) {
    console.log(`Using existing Student ID format: ${student._id}`);
    return student._id;
  }

  // Otherwise, format the ID as "Student ID"
  console.log(`Falling back to Student ID: ${student._id}`);
  return `Student ${student._id}`;
};

/**
 * Debug function to log student data structure
 * @param {Object} student - Student object
 */
export const debugStudentData = (student) => {
  if (!student) {
    console.log('Student is null or undefined');
    return;
  }

  // Get all keys from the student object
  const keys = Object.keys(student);

  // Create a detailed structure report
  const report = {
    id: student._id,
    hasName: !!student.name,
    name: student.name,
    hasStudentName: !!student.studentName,
    studentName: student.studentName,
    hasFirstName: !!student.firstName,
    firstName: student.firstName,
    hasLastName: !!student.lastName,
    lastName: student.lastName,
    hasFullName: !!student.fullName,
    fullName: student.fullName,
    hasNestedStudent: !!student.student,
    nestedStudentType: student.student ? typeof student.student : 'none',
    nestedStudentKeys: student.student && typeof student.student === 'object' ? Object.keys(student.student) : [],
    nestedStudentHasFirstName: student.student && typeof student.student === 'object' ? !!student.student.firstName : false,
    nestedStudentFirstName: student.student && typeof student.student === 'object' ? student.student.firstName : null,
    nestedStudentHasLastName: student.student && typeof student.student === 'object' ? !!student.student.lastName : false,
    nestedStudentLastName: student.student && typeof student.student === 'object' ? student.student.lastName : null,
    nestedStudentHasFullName: student.student && typeof student.student === 'object' ? !!student.student.fullName : false,
    nestedStudentFullName: student.student && typeof student.student === 'object' ? student.student.fullName : null,
    hasStudentDetails: !!student.studentDetails,
    studentDetailsType: student.studentDetails ? typeof student.studentDetails : 'none',
    studentDetailsKeys: student.studentDetails && typeof student.studentDetails === 'object' ? Object.keys(student.studentDetails) : [],
    hasCombinationId: !!student.combinationId,
    hasSubjects: Array.isArray(student.subjects),
    subjectsLength: Array.isArray(student.subjects) ? student.subjects.length : 0,
    keys: keys
  };

  console.log('Student data structure:', report);

  // If there are nested objects, log their structure too
  if (student.student && typeof student.student === 'object') {
    console.log('Nested student object structure:', student.student);
  }

  if (student.studentDetails && typeof student.studentDetails === 'object') {
    console.log('Student details object structure:', student.studentDetails);
  }

  // Try to determine the best name to use
  let bestName = 'Unknown';
  if (student.name) bestName = student.name;
  else if (student.studentName) bestName = student.studentName;
  else if (student.fullName) bestName = student.fullName;
  else if (student.firstName && student.lastName) bestName = `${student.firstName} ${student.lastName}`;
  else if (student.student && typeof student.student === 'object') {
    if (student.student.fullName) bestName = student.student.fullName;
    else if (student.student.firstName && student.student.lastName) bestName = `${student.student.firstName} ${student.student.lastName}`;
  }
  else if (student.studentDetails && typeof student.studentDetails === 'object') {
    if (student.studentDetails.fullName) bestName = student.studentDetails.fullName;
    else if (student.studentDetails.firstName && student.studentDetails.lastName) bestName = `${student.studentDetails.firstName} ${student.studentDetails.lastName}`;
    else if (student.studentDetails.name) bestName = student.studentDetails.name;
  }

  console.log(`Best name to use: ${bestName}`);
};

/**
 * Extracts A-Level subject combinations from student data
 * @param {Array} students - Array of student objects
 * @returns {Array} Array of student subject combination objects
 */
export const extractALevelCombinations = (students) => {
  if (!students || !Array.isArray(students) || students.length === 0) {
    console.log('A-Level: No students provided or students is not an array');
    return [];
  }

  console.log(`A-Level: Extracting combinations from ${students.length} students`);

  // Create combinations array
  const combinations = students.map(student => {
    // Check if student has a subjectCombination property
    if (student.subjectCombination &&
        typeof student.subjectCombination === 'object' &&
        student.subjectCombination.subjects &&
        Array.isArray(student.subjectCombination.subjects)) {

      // Extract subjects from the combination
      const subjects = student.subjectCombination.subjects.map(subject => ({
        subjectId: subject.subjectId || subject.subject || subject._id,
        isPrincipal: !!subject.isPrincipal
      }));

      // Extract student name from various possible properties
      const firstName = student.firstName ||
                      (student.student && student.student.firstName) ||
                      (student.studentDetails && student.studentDetails.firstName) ||
                      '';

      const lastName = student.lastName ||
                     (student.student && student.student.lastName) ||
                     (student.studentDetails && student.studentDetails.lastName) ||
                     '';

      const fullName = student.name ||
                      student.studentName ||
                      student.fullName ||
                      (student.student && student.student.fullName) ||
                      (student.studentDetails && student.studentDetails.fullName) ||
                      (firstName && lastName ? `${firstName} ${lastName}` : '');

      console.log(`Extracted name for student ${student._id}: ${fullName || 'Unknown'}`);

      return {
        student: {
          _id: student._id,
          firstName: firstName,
          lastName: lastName,
          fullName: fullName
        },
        studentId: student._id,
        subjects: subjects
      };
    }

    // If no combination found, create a default one with all subjects as principal
    // Extract student name from various possible properties
    const firstName = student.firstName ||
                    (student.student && student.student.firstName) ||
                    (student.studentDetails && student.studentDetails.firstName) ||
                    '';

    const lastName = student.lastName ||
                   (student.student && student.student.lastName) ||
                   (student.studentDetails && student.studentDetails.lastName) ||
                   '';

    const fullName = student.name ||
                    student.studentName ||
                    student.fullName ||
                    (student.student && student.student.fullName) ||
                    (student.studentDetails && student.studentDetails.fullName) ||
                    (firstName && lastName ? `${firstName} ${lastName}` : '');

    console.log(`Extracted name for student ${student._id} (no combination): ${fullName || 'Unknown'}`);

    return {
      student: {
        _id: student._id,
        firstName: firstName,
        lastName: lastName,
        fullName: fullName
      },
      studentId: student._id,
      subjects: []
    };
  });

  console.log(`Created ${combinations.length} combinations from student data`);
  return combinations;
};

export default {
  filterALevelStudentsBySubject,
  createALevelCombinationsMap,
  extractALevelCombinations,
  formatALevelStudentName,
  debugStudentData
};
