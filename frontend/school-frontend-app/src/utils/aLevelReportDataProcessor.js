/**
 * Utility functions for processing A-Level report data
 */

/**
 * Process and prepare A-Level report data for display
 * @param {Object} data - The raw report data
 * @param {string} sortField - The field to sort by
 * @param {string} sortDirection - The sort direction ('asc' or 'desc')
 * @returns {Object} - The processed data
 */
export const processALevelReportData = (data, sortField = 'rank', sortDirection = 'asc') => {
  if (!data) return null;

  // Deep clone to avoid modifying original data
  const processedData = JSON.parse(JSON.stringify(data));

  // Get current year for the title if not provided
  if (!processedData.year) {
    processedData.year = new Date().getFullYear();
  }

  // Sort students based on current sort settings
  if (processedData.students) {
    processedData.students.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle numeric values
      if (typeof aValue === 'string' && !Number.isNaN(Number(aValue))) {
        aValue = Number.parseFloat(aValue);
      }
      if (typeof bValue === 'string' && !Number.isNaN(Number(bValue))) {
        bValue = Number.parseFloat(bValue);
      }

      // Handle missing values
      if (aValue === undefined || aValue === null) aValue = sortDirection === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      if (bValue === undefined || bValue === null) bValue = sortDirection === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

      // Compare values
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }

  // Calculate division summary
  const divisionSummary = {
    'I': 0,
    'II': 0,
    'III': 0,
    'IV': 0,
    '0': 0
  };

  if (processedData.students) {
    for (const student of processedData.students) {
      const division = student.division || 'IV';
      if (division === 'Division I' || division === 'I') divisionSummary['I']++;
      else if (division === 'Division II' || division === 'II') divisionSummary['II']++;
      else if (division === 'Division III' || division === 'III') divisionSummary['III']++;
      else if (division === 'Division IV' || division === 'IV') divisionSummary['IV']++;
      else divisionSummary['0']++;
    }
  }

  processedData.divisionSummary = divisionSummary;

  // Calculate subject-wise performance
  const subjectPerformance = {};
  const subjects = processedData.subjects || [];

  if (processedData.students) {
    for (const subject of subjects) {
      const subjectId = subject.id || subject._id;
      const subjectName = subject.name;

      if (!subjectId || !subjectName) continue;

      subjectPerformance[subjectId] = {
        name: subjectName,
        registered: 0,
        grades: { A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 },
        passed: 0,
        gpa: 0,
        totalPoints: 0
      };

      for (const student of processedData.students) {
        const subjectResult = student.subjects?.[subjectId] ||
                             student.subjectResults?.find(r => r.subjectId === subjectId) ||
                             student.results?.find(r => r.subject?.name === subjectName);

        if (subjectResult?.grade) {
          subjectPerformance[subjectId].registered++;
          subjectPerformance[subjectId].grades[subjectResult.grade]++;

          // Calculate passed based on NECTA standards
          // For principal subjects: A-E are passing grades
          // For subsidiary subjects: A-S are passing grades
          const isPrincipal = student.subjectResults?.find(r => r.subject?.name === subjectName)?.subject?.isPrincipal || false;

          if (isPrincipal) {
            // Principal subjects: A, B, C, D, E are passing grades
            if (['A', 'B', 'C', 'D', 'E'].includes(subjectResult.grade)) {
              subjectPerformance[subjectId].passed++;
            }
          } else {
            // Subsidiary subjects: A, B, C, D, E, S are passing grades
            if (['A', 'B', 'C', 'D', 'E', 'S'].includes(subjectResult.grade)) {
              subjectPerformance[subjectId].passed++;
            }
          }

          // Calculate GPA points
          let points = 0;
          switch (subjectResult.grade) {
            case 'A': points = 1; break;
            case 'B': points = 2; break;
            case 'C': points = 3; break;
            case 'D': points = 4; break;
            case 'E': points = 5; break;
            case 'S': points = 6; break;
            case 'F': points = 7; break;
            default: points = 0;
          }

          subjectPerformance[subjectId].totalPoints += points;
        }
      }

      // Calculate GPA
      if (subjectPerformance[subjectId].registered > 0) {
        subjectPerformance[subjectId].gpa = (
          subjectPerformance[subjectId].totalPoints / subjectPerformance[subjectId].registered
        ).toFixed(2);
      }
    }
  }

  processedData.subjectPerformance = subjectPerformance;

  // Calculate overall performance
  let totalPassed = 0;
  let totalGpaPoints = 0;
  let totalStudents = processedData.students?.length || 0;

  if (processedData.students) {
    for (const student of processedData.students) {
      if (student.division && (student.division === 'I' || student.division === 'II' ||
          student.division === 'III' || student.division === 'Division I' ||
          student.division === 'Division II' || student.division === 'Division III')) {
        totalPassed++;
      }

      // Add to GPA calculation if student has points
      if (student.points || student.totalPoints) {
        totalGpaPoints += Number(student.points || student.totalPoints || 0);
      }
    }
  }

  processedData.overallPerformance = {
    totalPassed,
    examGpa: totalStudents > 0 ? (totalGpaPoints / totalStudents).toFixed(2) : '0.00'
  };

  return processedData;
};

/**
 * Create empty report data structure with placeholders
 * @returns {Object} - The empty report data structure
 */
export const createEmptyReportData = () => {
  return {
    className: 'Not Available',
    examName: 'Not Available',
    year: new Date().getFullYear(),
    educationLevel: 'A_LEVEL',
    students: [
      // Add placeholder student to show structure
      {
        id: 'placeholder-1',
        studentName: 'No Data Available',
        sex: '-',
        points: '-',
        division: '-',
        subjectResults: [],
        totalMarks: '-',
        averageMarks: '-',
        rank: '-'
      }
    ],
    subjects: [
      { id: 'gs', name: 'General Studies' },
      { id: 'hist', name: 'History' },
      { id: 'phys', name: 'Physics' },
      { id: 'chem', name: 'Chemistry' },
      { id: 'kisw', name: 'Kiswahili' },
      { id: 'math', name: 'Advanced Mathematics' },
      { id: 'bio', name: 'Biology' },
      { id: 'geo', name: 'Geography' },
      { id: 'eng', name: 'English' },
      { id: 'bam', name: 'BAM' },
      { id: 'econ', name: 'Economics' }
    ],
    divisionSummary: { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 },
    subjectPerformance: {},
    overallPerformance: { totalPassed: 0, examGpa: 'N/A' }
  };
};

/**
 * Get all unique subjects from student combinations
 * @param {Array} students - The students array
 * @returns {Array} - Array of unique subject names
 */
export const getUniqueSubjects = (students) => {
  const allSubjects = new Set();
  
  if (students && students.length > 0) {
    for (const student of students) {
      const studentSubjects = student.subjectResults || [];
      for (const subject of studentSubjects) {
        if (subject.subject?.name) {
          allSubjects.add(subject.subject.name);
        }
      }
    }
  }

  // If no subjects found, add placeholder subjects for A-Level
  if (allSubjects.size === 0) {
    // Add common A-Level subjects as placeholders
    ['General Studies', 'History', 'Physics', 'Chemistry', 'Kiswahili', 'Advanced Mathematics',
     'Biology', 'Geography', 'English', 'BAM', 'Economics'].forEach(subj => allSubjects.add(subj));
  }

  // Convert to array and sort alphabetically
  return Array.from(allSubjects).sort();
};
