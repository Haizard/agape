/**
 * Legacy A-Level utility functions for student filtering and management
 * This file contains the same filtering logic as the old version to ensure compatibility
 */

/**
 * Safely convert a value to string, handling null/undefined
 * @param {*} value - Value to convert to string
 * @returns {string} String value or empty string if null/undefined
 */
const safeToString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

/**
 * Identifies which A-Level students take a specific subject
 * @param {Array} students - Array of student objects
 * @param {string} subjectId - ID of the subject to filter by
 * @param {boolean} isPrincipal - Whether to filter for principal subjects
 * @param {Object} combinationsMap - Map of student IDs to their subject combinations
 * @returns {Array} Filtered students who take the subject
 */
export const filterALevelStudentsBySubject = (students, subjectId, isPrincipal, combinationsMap) => {
  if (!students || !Array.isArray(students) || students.length === 0) {
    console.log('No students provided for filtering');
    return [];
  }

  if (!subjectId) {
    console.log('No subject ID provided for filtering');
    return students;
  }

  // Convert subjectId to string for comparison
  const subjectIdStr = subjectId?.toString();
  console.log(`Legacy: Filtering students for subject ${subjectIdStr}, isPrincipal=${isPrincipal}`);

  // First, try to identify students who take this subject
  const studentsWithSubjectInfo = students.map(student => {
    // Default to not taking the subject
    let takesSubject = false;
    let matchReason = 'Not in combination';
    let isPrincipalSubject = isPrincipal;

    // Check if we have combination data for this student
    const studentId = student._id?.toString();
    const combination = combinationsMap && studentId ? combinationsMap[studentId] : null;

    // Method 1: Check in combinationsMap
    if (combination && combination.subjects) {
      // Check if the subject is in the student's combination with the correct principal status
      const subjectInCombination = combination.subjects?.find(s => {
        // Check for exact match or if the subject ID contains the subject name or vice versa
        const subjectIdMatch = (s.subjectId?.toString() === subjectIdStr) ||
                              (s.subjectId?.toString().includes(subjectIdStr)) ||
                              (subjectIdStr.includes(s.subjectId?.toString()));

        // If we're not checking for principal status specifically, match any subject
        const principalMatch = isPrincipal === null ? true : (isPrincipal ? s.isPrincipal : !s.isPrincipal);
        return subjectIdMatch && principalMatch;
      });

      if (subjectInCombination) {
        takesSubject = true;
        matchReason = `Found in combination as ${isPrincipal ? 'principal' : 'subsidiary'} subject`;
      }
    }

    // Method 2: Check in student.combination
    if (!takesSubject && student.combination && typeof student.combination === 'object') {
      // Check if the combination has a subjects array
      if (student.combination.subjects && Array.isArray(student.combination.subjects)) {
        const subjectMatch = student.combination.subjects.find(s => {
          if (typeof s === 'object' && s !== null) {
            // Try exact match first
            if (s._id?.toString() === subjectIdStr || s.subjectId?.toString() === subjectIdStr) {
              return true;
            }

            // Try name match if available
            if (s.name && typeof s.name === 'string') {
              const subjectName = s.name.toLowerCase();
              if (subjectName.includes(subjectIdStr.toLowerCase()) ||
                  subjectIdStr.toLowerCase().includes(subjectName)) {
                return true;
              }
            }
          }
          return false;
        });

        if (subjectMatch) {
          takesSubject = true;
          matchReason = 'Found in student.combination';
          isPrincipalSubject = !!subjectMatch.isPrincipal;
        }
      }
    }

    // Method 3: Check in student.subjectCombination
    if (!takesSubject && student.subjectCombination && typeof student.subjectCombination === 'object') {
      // Check if the combination has a subjects array
      if (student.subjectCombination.subjects && Array.isArray(student.subjectCombination.subjects)) {
        const subjectMatch = student.subjectCombination.subjects.find(s => {
          if (typeof s === 'object' && s !== null) {
            // Try exact match first
            if (s._id?.toString() === subjectIdStr || s.subjectId?.toString() === subjectIdStr) {
              return true;
            }

            // Try name match if available
            if (s.name && typeof s.name === 'string') {
              const subjectName = s.name.toLowerCase();
              if (subjectName.includes(subjectIdStr.toLowerCase()) ||
                  subjectIdStr.toLowerCase().includes(subjectName)) {
                return true;
              }
            }
          }
          return false;
        });

        if (subjectMatch) {
          takesSubject = true;
          matchReason = 'Found in student.subjectCombination';
          isPrincipalSubject = !!subjectMatch.isPrincipal;
        }
      }
    }

    // Method 4: Check in student.subjects (from API)
    if (!takesSubject && student.subjects && Array.isArray(student.subjects)) {
      const subjectMatch = student.subjects.find(s => {
        if (typeof s === 'object' && s !== null) {
          // Try exact match first
          if (s._id?.toString() === subjectIdStr || s.subjectId?.toString() === subjectIdStr) {
            return true;
          }

          // Try name match if available
          if (s.name && typeof s.name === 'string') {
            const subjectName = s.name.toLowerCase();
            if (subjectName.includes(subjectIdStr.toLowerCase()) ||
                subjectIdStr.toLowerCase().includes(subjectName)) {
              return true;
            }
          }
        }
        return false;
      });

      if (subjectMatch) {
        takesSubject = true;
        matchReason = 'Found in student.subjects';
        isPrincipalSubject = !!subjectMatch.isPrincipal;
      }
    }

    // Method 5: Check in student.subject_ids or student.subjectIds
    if (!takesSubject && (student.subject_ids || student.subjectIds)) {
      const subjectIds = student.subject_ids || student.subjectIds;
      if (Array.isArray(subjectIds)) {
        const hasSubject = subjectIds.some(id => {
          if (typeof id === 'string' || typeof id === 'number') {
            return id.toString() === subjectIdStr;
          }
          if (typeof id === 'object' && id !== null) {
            return id._id?.toString() === subjectIdStr || id.id?.toString() === subjectIdStr;
          }
          return false;
        });

        if (hasSubject) {
          takesSubject = true;
          matchReason = 'Found in student.subject_ids';
          // Can't determine principal status from just IDs
          isPrincipalSubject = isPrincipal;
        }
      }
    }

    // Return student with takesSubject flag
    return {
      ...student,
      takesSubject,
      matchReason,
      isPrincipal: isPrincipalSubject
    };
  });

  // Filter to only include students who take the subject
  const filteredStudents = studentsWithSubjectInfo.filter(student => student.takesSubject);

  console.log(`Legacy: Filtered from ${studentsWithSubjectInfo.length} to ${filteredStudents.length} students who take subject ${subjectIdStr}`);

  // Return ONLY students who take the subject
  return filteredStudents;
};

/**
 * Creates a map of student IDs to their subject combinations
 * @param {Array} combinations - Array of student combination objects
 * @returns {Object} Map of student IDs to their subject combinations
 */
export const createALevelCombinationsMap = (combinations) => {
  if (!combinations || !Array.isArray(combinations) || combinations.length === 0) {
    console.log('No combinations provided for mapping');
    return {};
  }

  console.log(`Legacy: Creating combinations map from ${combinations.length} combinations`);

  const studentCombinationsMap = {};

  combinations.forEach(combination => {
    const studentId = combination.studentId?.toString();
    if (!studentId) {
      console.log('Legacy: Combination has no studentId:', combination);
      return;
    }

    const processedSubjects = [];

    // Process subjects array
    if (combination.subjects && Array.isArray(combination.subjects)) {
      console.log(`Legacy: Processing ${combination.subjects.length} subjects for student ${studentId}`);

      combination.subjects.forEach((subject, i) => {
        // Extract subject ID
        const subjectId = safeToString(subject.subjectId || subject.subject || subject._id);
        if (!subjectId) {
          console.log(`Legacy: Invalid subject at index ${i}:`, subject);
          return;
        }

        // Determine if this is a principal subject
        const isPrincipal = !!subject.isPrincipal;

        processedSubjects.push({
          subjectId,
          isPrincipal
        });

        console.log(`Legacy: Added subject ${i+1} for student ${studentId}: ${subjectId} (${isPrincipal ? 'Principal' : 'Subsidiary'})`);
      });
    }

    // Add to the map
    studentCombinationsMap[studentId] = {
      studentId,
      subjects: processedSubjects
    };
  });

  console.log(`Legacy: Created combinations map with ${Object.keys(studentCombinationsMap).length} entries`);
  return studentCombinationsMap;
};

/**
 * Extracts A-Level subject combinations from student data
 * @param {Array} students - Array of student objects
 * @returns {Array} Array of student subject combination objects
 */
export const extractALevelCombinations = (students) => {
  if (!students || !Array.isArray(students) || students.length === 0) {
    console.log('Legacy: No students provided or students is not an array');
    return [];
  }

  console.log(`Legacy: Extracting combinations from ${students.length} students`);

  // Create combinations array
  const combinations = students.map(student => {
    // Extract student name from various possible properties
    const firstName = student.firstName ||
                    (student.student && student.student.firstName) ||
                    (student.studentDetails && student.studentDetails.firstName) ||
                    '';
    const lastName = student.lastName ||
                   (student.student && student.student.lastName) ||
                   (student.studentDetails && student.studentDetails.lastName) ||
                   '';
    const fullName = student.fullName ||
                   (student.student && student.student.fullName) ||
                   (student.studentDetails && student.studentDetails.fullName) ||
                   `${firstName} ${lastName}`.trim();

    // Initialize subjects array
    let subjects = [];
    let sourceFound = false;

    // Method 1: Check if student has a subjectCombination property
    if (!sourceFound && student.subjectCombination &&
        typeof student.subjectCombination === 'object' &&
        student.subjectCombination.subjects &&
        Array.isArray(student.subjectCombination.subjects)) {

      // Extract subjects from the combination
      subjects = student.subjectCombination.subjects.map(subject => ({
        subjectId: subject.subjectId || subject.subject || subject._id,
        isPrincipal: !!subject.isPrincipal,
        name: subject.name || ''
      }));

      if (subjects.length > 0) {
        sourceFound = true;
        console.log(`Legacy: Extracted combination for student ${student._id} with ${subjects.length} subjects from subjectCombination`);
      }
    }

    // Method 2: Check if student has a combination property
    if (!sourceFound && student.combination &&
        typeof student.combination === 'object' &&
        student.combination.subjects &&
        Array.isArray(student.combination.subjects)) {

      // Extract subjects from the combination
      subjects = student.combination.subjects.map(subject => ({
        subjectId: subject.subjectId || subject.subject || subject._id,
        isPrincipal: !!subject.isPrincipal,
        name: subject.name || ''
      }));

      if (subjects.length > 0) {
        sourceFound = true;
        console.log(`Legacy: Extracted combination for student ${student._id} with ${subjects.length} subjects from combination`);
      }
    }

    // Method 3: Check if student has a subjects property directly
    if (!sourceFound && student.subjects && Array.isArray(student.subjects)) {
      // Extract subjects directly
      subjects = student.subjects.map(subject => {
        if (typeof subject === 'object' && subject !== null) {
          return {
            subjectId: subject.subjectId || subject._id || subject.id,
            isPrincipal: !!subject.isPrincipal,
            name: subject.name || ''
          };
        } else if (typeof subject === 'string') {
          return {
            subjectId: subject,
            isPrincipal: false,
            name: ''
          };
        }
        return null;
      }).filter(s => s !== null);

      if (subjects.length > 0) {
        sourceFound = true;
        console.log(`Legacy: Extracted combination for student ${student._id} with ${subjects.length} subjects from student.subjects`);
      }
    }

    // Method 4: Check if student has subject_ids or subjectIds
    if (!sourceFound && (student.subject_ids || student.subjectIds)) {
      const subjectIds = student.subject_ids || student.subjectIds;
      if (Array.isArray(subjectIds)) {
        subjects = subjectIds.map(id => {
          if (typeof id === 'object' && id !== null) {
            return {
              subjectId: id._id || id.id,
              isPrincipal: !!id.isPrincipal,
              name: id.name || ''
            };
          } else {
            return {
              subjectId: id,
              isPrincipal: false,
              name: ''
            };
          }
        });

        if (subjects.length > 0) {
          sourceFound = true;
          console.log(`Legacy: Extracted combination for student ${student._id} with ${subjects.length} subjects from subject_ids`);
        }
      }
    }

    // If no combination found, log it
    if (!sourceFound) {
      console.log(`Legacy: No combination found for student ${student._id}: ${fullName || 'Unknown'}`);
    }

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
  });

  // Log summary
  const studentsWithSubjects = combinations.filter(c => c.subjects.length > 0).length;
  console.log(`Legacy: Created ${combinations.length} combinations from student data, ${studentsWithSubjects} students have subjects`);

  return combinations;
};

/**
 * Format student name from various properties
 * @param {Object} student - Student object
 * @returns {string} Formatted student name
 */
export const formatALevelStudentName = (student) => {
  if (!student) return 'Unknown Student';

  // Try to extract name from various properties
  const firstName = student.firstName ||
                  (student.student && student.student.firstName) ||
                  '';
  const lastName = student.lastName ||
                 (student.student && student.student.lastName) ||
                 '';
  const fullName = student.fullName ||
                 (student.student && student.student.fullName) ||
                 '';

  // Return the most complete name available
  if (fullName) return fullName;
  if (firstName || lastName) return `${firstName} ${lastName}`.trim();
  return 'Unknown Student';
};

/**
 * Debug student data to help identify issues
 * @param {Object} student - Student object
 * @returns {Object} Debug information
 */
export const debugStudentData = (student) => {
  if (!student) return { error: 'No student provided' };

  return {
    id: student._id,
    name: formatALevelStudentName(student),
    hasCombination: !!(student.subjectCombination || student.combination),
    combinationType: student.subjectCombination ? 'subjectCombination' : (student.combination ? 'combination' : 'none'),
    subjectCount: (student.subjectCombination && student.subjectCombination.subjects) ? student.subjectCombination.subjects.length :
                 (student.combination && student.combination.subjects) ? student.combination.subjects.length : 0
  };
};

export default {
  filterALevelStudentsBySubject,
  createALevelCombinationsMap,
  extractALevelCombinations,
  formatALevelStudentName,
  debugStudentData
};
