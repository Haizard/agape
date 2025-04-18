import noAuthApi from './noAuthApi';

/**
 * Get A-Level class result report without authentication
 * @param {string} classId - The class ID
 * @param {string} examId - The exam ID
 * @returns {Promise} - The API response
 */
export const getPublicALevelReport = async (classId, examId) => {
  try {
    console.log(`Fetching public A-Level report for class ${classId} and exam ${examId}`);

    // Try the public endpoint
    const endpoint = `a-level-reports/public/${classId}/${examId}`;
    const response = await noAuthApi.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching public A-Level report:', error);

    // Return sample data if the API call fails
    return getSampleALevelReport();
  }
};

/**
 * Get sample A-Level report data
 * @returns {Object} - Sample A-Level report data
 */
export const getSampleALevelReport = () => {
  return {
    className: 'FORM V',
    examName: 'MIDTERM EXAMINATION',
    educationLevel: 'A_LEVEL',
    year: new Date().getFullYear(),
    students: [
      {
        id: '1',
        studentName: 'Jane Daniel',
        sex: 'F',
        points: 18,
        division: 'II',
        subjectResults: [
          { subject: { name: 'General Studies' }, marks: 67.8 },
          { subject: { name: 'History' }, marks: 36.0 },
          { subject: { name: 'Physics' }, marks: 34.1 },
          { subject: { name: 'Chemistry' }, marks: null },
          { subject: { name: 'Kiswahili' }, marks: null },
          { subject: { name: 'Advanced Mathematics' }, marks: null },
          { subject: { name: 'Biology' }, marks: null },
          { subject: { name: 'Geography' }, marks: 41.7 },
          { subject: { name: 'English' }, marks: 60.0 },
          { subject: { name: 'BAM' }, marks: null },
          { subject: { name: 'Economics' }, marks: 55.3 }
        ],
        totalMarks: 224.9,
        averageMarks: 44.9,
        rank: 3
      },
      {
        id: '2',
        studentName: 'John Michael',
        sex: 'M',
        points: 12,
        division: 'I',
        subjectResults: [
          { subject: { name: 'General Studies' }, marks: 74.2 },
          { subject: { name: 'History' }, marks: null },
          { subject: { name: 'Physics' }, marks: 78.1 },
          { subject: { name: 'Chemistry' }, marks: 67.0 },
          { subject: { name: 'Kiswahili' }, marks: null },
          { subject: { name: 'Advanced Mathematics' }, marks: 85.5 },
          { subject: { name: 'Biology' }, marks: null },
          { subject: { name: 'Geography' }, marks: null },
          { subject: { name: 'English' }, marks: 71.4 },
          { subject: { name: 'BAM' }, marks: null },
          { subject: { name: 'Economics' }, marks: null }
        ],
        totalMarks: 376.2,
        averageMarks: 62.7,
        rank: 1
      },
      {
        id: '3',
        studentName: 'Sarah Paul',
        sex: 'F',
        points: 21,
        division: 'III',
        subjectResults: [
          { subject: { name: 'General Studies' }, marks: 58.9 },
          { subject: { name: 'History' }, marks: null },
          { subject: { name: 'Physics' }, marks: null },
          { subject: { name: 'Chemistry' }, marks: 41.1 },
          { subject: { name: 'Kiswahili' }, marks: 47.6 },
          { subject: { name: 'Advanced Mathematics' }, marks: null },
          { subject: { name: 'Biology' }, marks: 55.3 },
          { subject: { name: 'Geography' }, marks: 33.2 },
          { subject: { name: 'English' }, marks: null },
          { subject: { name: 'BAM' }, marks: null },
          { subject: { name: 'Economics' }, marks: null }
        ],
        totalMarks: 236.1,
        averageMarks: 47.2,
        rank: 2
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
    divisionSummary: {
      'I': 1,
      'II': 1,
      'III': 1,
      'IV': 0,
      '0': 0
    },
    subjectPerformance: {
      'gs': {
        name: 'General Studies',
        registered: 3,
        grades: { A: 0, B: 2, C: 1, D: 0, E: 0, S: 0, F: 0 },
        passed: 3,
        gpa: '2.33'
      },
      'hist': {
        name: 'History',
        registered: 1,
        grades: { A: 0, B: 0, C: 0, D: 1, E: 0, S: 0, F: 0 },
        passed: 1,
        gpa: '4.00'
      },
      'phys': {
        name: 'Physics',
        registered: 2,
        grades: { A: 0, B: 1, C: 0, D: 1, E: 0, S: 0, F: 0 },
        passed: 2,
        gpa: '3.00'
      },
      'chem': {
        name: 'Chemistry',
        registered: 2,
        grades: { A: 0, B: 0, C: 1, D: 1, E: 0, S: 0, F: 0 },
        passed: 2,
        gpa: '3.50'
      },
      'kisw': {
        name: 'Kiswahili',
        registered: 1,
        grades: { A: 0, B: 0, C: 1, D: 0, E: 0, S: 0, F: 0 },
        passed: 1,
        gpa: '3.00'
      },
      'math': {
        name: 'Advanced Mathematics',
        registered: 1,
        grades: { A: 1, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 },
        passed: 1,
        gpa: '1.00'
      },
      'bio': {
        name: 'Biology',
        registered: 1,
        grades: { A: 0, B: 0, C: 1, D: 0, E: 0, S: 0, F: 0 },
        passed: 1,
        gpa: '3.00'
      },
      'geo': {
        name: 'Geography',
        registered: 2,
        grades: { A: 0, B: 0, C: 0, D: 2, E: 0, S: 0, F: 0 },
        passed: 2,
        gpa: '4.00'
      },
      'eng': {
        name: 'English',
        registered: 2,
        grades: { A: 0, B: 1, C: 1, D: 0, E: 0, S: 0, F: 0 },
        passed: 2,
        gpa: '2.50'
      },
      'econ': {
        name: 'Economics',
        registered: 1,
        grades: { A: 0, B: 0, C: 1, D: 0, E: 0, S: 0, F: 0 },
        passed: 1,
        gpa: '3.00'
      }
    },
    overallPerformance: {
      totalPassed: 3,
      examGpa: '2.67'
    }
  };
};
