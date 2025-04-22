/**
 * O-Level Report Controller
 *
 * Provides standardized endpoints for O-Level result reports with consistent data schema
 * and centralized calculation logic.
 */
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const OLevelResult = require('../models/OLevelResult');
const logger = require('../utils/logger');
const oLevelGradeCalculator = require('../utils/oLevelGradeCalculator');

/**
 * Get mock data for O-Level class report
 * @param {string} classId - Class ID
 * @param {string} examId - Exam ID
 * @returns {Object} - Mock class report data
 */
const getMockClassReport = (classId, examId) => {
  console.log(`Generating mock O-Level class report for class ${classId}, exam ${examId}`);

  // Create a more comprehensive mock data set
  const students = [
    {
      id: 'student1',
      name: 'John Smith',
      rollNumber: 'S001',
      gender: 'M',
      sex: 'M',
      results: [
        { subject: 'Mathematics', code: 'MATH', marks: 85, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'English', code: 'ENG', marks: 78, grade: 'B', points: 2, remarks: 'Good' },
        { subject: 'Physics', code: 'PHY', marks: 92, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'Chemistry', code: 'CHEM', marks: 75, grade: 'B', points: 2, remarks: 'Good' },
        { subject: 'Biology', code: 'BIO', marks: 88, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'Geography', code: 'GEO', marks: 82, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'History', code: 'HIST', marks: 79, grade: 'B', points: 2, remarks: 'Good' }
      ],
      totalMarks: 579,
      averageMarks: '82.71',
      totalPoints: 10,
      bestSevenPoints: 10,
      points: 10,
      division: 'I',
      rank: 1
    },
    {
      id: 'student2',
      name: 'Jane Doe',
      rollNumber: 'S002',
      gender: 'F',
      sex: 'F',
      results: [
        { subject: 'Mathematics', code: 'MATH', marks: 92, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'English', code: 'ENG', marks: 88, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'Physics', code: 'PHY', marks: 85, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'Chemistry', code: 'CHEM', marks: 82, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'Biology', code: 'BIO', marks: 90, grade: 'A', points: 1, remarks: 'Excellent' },
        { subject: 'Geography', code: 'GEO', marks: 78, grade: 'B', points: 2, remarks: 'Good' },
        { subject: 'History', code: 'HIST', marks: 85, grade: 'A', points: 1, remarks: 'Excellent' }
      ],
      totalMarks: 600,
      averageMarks: '85.71',
      totalPoints: 8,
      bestSevenPoints: 8,
      points: 8,
      division: 'I',
      rank: 2
    },
    {
      id: 'student3',
      name: 'Michael Johnson',
      rollNumber: 'S003',
      gender: 'M',
      sex: 'M',
      results: [
        { subject: 'Mathematics', code: 'MATH', marks: 65, grade: 'C', points: 3, remarks: 'Average' },
        { subject: 'English', code: 'ENG', marks: 72, grade: 'B', points: 2, remarks: 'Good' },
        { subject: 'Physics', code: 'PHY', marks: 68, grade: 'C', points: 3, remarks: 'Average' },
        { subject: 'Chemistry', code: 'CHEM', marks: 70, grade: 'B', points: 2, remarks: 'Good' },
        { subject: 'Biology', code: 'BIO', marks: 75, grade: 'B', points: 2, remarks: 'Good' },
        { subject: 'Geography', code: 'GEO', marks: 68, grade: 'C', points: 3, remarks: 'Average' },
        { subject: 'History', code: 'HIST', marks: 72, grade: 'B', points: 2, remarks: 'Good' }
      ],
      totalMarks: 490,
      averageMarks: '70.00',
      totalPoints: 17,
      bestSevenPoints: 17,
      points: 17,
      division: 'II',
      rank: 3
    }
  ];

  // Calculate class average
  const totalAverage = students.reduce((sum, student) => sum + parseFloat(student.averageMarks), 0);
  const classAverage = (totalAverage / students.length).toFixed(2);

  // Calculate division distribution
  const divisionSummary = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 };
  students.forEach(student => {
    const divKey = student.division.toString().replace('Division ', '');
    divisionSummary[divKey] = (divisionSummary[divKey] || 0) + 1;
  });

  // Extract subjects
  const subjects = [
    { id: 'math', name: 'Mathematics', code: 'MATH' },
    { id: 'eng', name: 'English', code: 'ENG' },
    { id: 'phy', name: 'Physics', code: 'PHY' },
    { id: 'chem', name: 'Chemistry', code: 'CHEM' },
    { id: 'bio', name: 'Biology', code: 'BIO' },
    { id: 'geo', name: 'Geography', code: 'GEO' },
    { id: 'hist', name: 'History', code: 'HIST' }
  ];

  // Create subject analysis
  const subjectAnalysis = subjects.map(subject => {
    // Calculate grade distribution for this subject
    const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    let totalMarks = 0;
    let highestMarks = 0;
    let lowestMarks = 100;
    let studentCount = 0;

    students.forEach(student => {
      const result = student.results.find(r => r.code === subject.code);
      if (result) {
        grades[result.grade]++;
        totalMarks += result.marks;
        highestMarks = Math.max(highestMarks, result.marks);
        lowestMarks = Math.min(lowestMarks, result.marks);
        studentCount++;
      }
    });

    // Calculate GPA
    const totalPoints = grades.A * 1 + grades.B * 2 + grades.C * 3 + grades.D * 4 + grades.F * 5;
    const gpa = studentCount > 0 ? (totalPoints / studentCount).toFixed(2) : '0.00';

    return {
      name: subject.name,
      code: subject.code,
      teacher: '-',
      averageMarks: studentCount > 0 ? (totalMarks / studentCount).toFixed(2) : '0.00',
      highestMarks,
      lowestMarks: lowestMarks === 100 && studentCount === 0 ? 0 : lowestMarks,
      grades,
      studentCount,
      gpa
    };
  });

  return {
    reportTitle: 'Mid-Term Exam 2023 Class Result Report',
    schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
    academicYear: '2023-2024',
    examName: 'Mid-Term Exam 2023',
    examDate: '2023-06-15 - 2023-06-30',
    className: 'Form 3 Science',
    section: 'A',
    stream: 'Science',
    subjects,
    students,
    subjectAnalysis,
    classAverage,
    divisionSummary,
    passRate: 85.0,
    totalStudents: students.length,
    educationLevel: 'O_LEVEL'
  };
};

/**
 * Get O-Level student report with standardized schema
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getStudentReport = async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    const { format } = req.query; // Optional format parameter (json or pdf)

    logger.info(`Generating standardized O-Level student report for student ${studentId}, exam ${examId}`);
    console.log(`Generating O-Level student report: studentId=${studentId}, examId=${examId}, format=${format || 'json'}`);

    // Add circuit breaker for database operations
    let retryCount = 0;
    const maxRetries = 3;

    // Helper function to execute database operations with retry logic
    async function executeWithRetry(dbOperation, errorMessage) {
      try {
        return await dbOperation();
      } catch (error) {
        if ((error.name === 'MongoNetworkError' || error.name === 'MongoError') && retryCount < maxRetries) {
          retryCount++;
          console.log(`Database operation failed, retrying (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return executeWithRetry(dbOperation, errorMessage);
        }
        logger.error(`${errorMessage}: ${error.message}`);
        throw error;
      }
    }

    // Get the student details with retry logic
    const student = await executeWithRetry(
      () => Student.findById(studentId),
      `Error fetching student data for ${studentId}`
    );

    if (!student) {
      logger.error(`Student not found: ${studentId}`);
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify this is an O-Level student
    if (student.educationLevel === 'A_LEVEL') {
      logger.error(`Student ${studentId} is not an O-Level student`);
      return res.status(400).json({
        success: false,
        message: 'This is not an O-Level student'
      });
    }

    // Get the exam details with retry logic
    const exam = await executeWithRetry(
      () => Exam.findById(examId).populate('academicYear'),
      `Error fetching exam data for ${examId}`
    );

    if (!exam) {
      logger.error(`Exam not found: ${examId}`);
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Get the student's class with retry logic
    const classObj = await executeWithRetry(
      () => Class.findById(student.class),
      `Error fetching class data for student ${studentId}`
    );

    if (!classObj) {
      logger.error(`Class not found for student ${studentId}`);
      return res.status(404).json({
        success: false,
        message: 'Class not found for student'
      });
    }

    // Get the student's results for this exam with retry logic
    const results = await executeWithRetry(
      () => OLevelResult.find({
        studentId,
        examId
      }).populate('subjectId', 'name code'),
      `Error fetching results for student ${studentId} in exam ${examId}`
    );

    // Get student's selected subjects (both core and optional)
    let studentSubjectIds = [];
    try {
      // First try to get directly from student record
      if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
        studentSubjectIds = student.selectedSubjects.map(s =>
          typeof s === 'object' && s._id ? s._id.toString() : s.toString());
        console.log(`Student ${studentId} has ${studentSubjectIds.length} selected subjects directly on their record`);
      }

      // If no subjects found, try to find from StudentSubjectSelection model
      if (studentSubjectIds.length === 0) {
        try {
          const StudentSubjectSelection = mongoose.model('StudentSubjectSelection');
          const subjectSelection = await StudentSubjectSelection.findOne({ student: studentId });

          if (subjectSelection) {
            // Combine core and optional subjects
            const coreSubjectIds = subjectSelection.coreSubjects.map(s => s.toString());
            const optionalSubjectIds = subjectSelection.optionalSubjects.map(s => s.toString());
            studentSubjectIds = [...coreSubjectIds, ...optionalSubjectIds];
            console.log(`Student ${studentId} has ${studentSubjectIds.length} subjects from StudentSubjectSelection (${coreSubjectIds.length} core, ${optionalSubjectIds.length} optional)`);
          }
        } catch (error) {
          console.log(`Error fetching subject selection for student ${studentId}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`Error getting subject selections for student ${studentId}:`, error);
    }

    if (results.length === 0) {
      logger.warn(`No results found for student ${studentId} in exam ${examId}`);
      return res.status(404).json({
        success: false,
        message: 'No results found for this student in this exam'
      });
    }

    // Process results
    const subjectResults = [];
    let totalMarks = 0;
    let totalPoints = 0;
    let resultCount = 0;

    // Get all O-Level subjects
    const allSubjects = await executeWithRetry(
      () => Subject.find({ educationLevel: { $in: ['O_LEVEL', 'BOTH'] } }),
      'Error fetching all O-Level subjects'
    );

    // Process each subject
    for (const subject of allSubjects) {
      // Check if this student takes this subject
      let studentTakesSubject = false;

      // Method 1: Check if it's a core subject (all students take core subjects)
      if (subject.type === 'CORE') {
        studentTakesSubject = true;
        console.log(`Subject ${subject.name} is a core subject, student ${studentId} takes it by default`);
      } else {
        // Method 2: Check if it's in the student's selected subjects
        studentTakesSubject = studentSubjectIds.includes(subject._id.toString());

        if (studentTakesSubject) {
          console.log(`Student ${studentId} takes optional subject ${subject.name} based on subject selection`);
        } else {
          console.log(`Student ${studentId} does NOT take optional subject ${subject.name}`);
        }
      }

      // Find result for this subject
      const result = results.find(r => r.subjectId && r.subjectId._id && r.subjectId._id.toString() === subject._id.toString());

      if (result) {
        // Get remarks based on grade
        const remarks = oLevelGradeCalculator.getRemarks(result.grade);

        // Student has a result for this subject
        subjectResults.push({
          subject: subject.name,
          code: subject.code,
          marks: result.marksObtained,
          grade: result.grade,
          points: result.points,
          remarks,
          studentTakesSubject // Flag to indicate if student takes this subject
        });

        totalMarks += result.marksObtained;
        totalPoints += result.points;
        resultCount++;
      } else if (studentTakesSubject) {
        // Student takes this subject but has no result yet
        subjectResults.push({
          subject: subject.name,
          code: subject.code,
          marks: 0,
          grade: 'N/A',
          points: 0,
          remarks: 'No marks entered',
          studentTakesSubject: true
        });
      }
    }

    // Calculate average marks
    const averageMarks = resultCount > 0 ? totalMarks / resultCount : 0;

    // Sort subjects by name
    subjectResults.sort((a, b) => a.subject.localeCompare(b.subject));

    // Calculate best seven subjects (lowest points = best grades)
    const { bestSevenPoints, division } = oLevelGradeCalculator.calculateBestSevenAndDivision(subjectResults);

    // Calculate grade distribution
    const gradeDistribution = {
      A: 0, B: 0, C: 0, D: 0, F: 0
    };

    for (const result of subjectResults) {
      if (result.grade in gradeDistribution) {
        gradeDistribution[result.grade]++;
      }
    }

    // Get all students in the class for ranking
    const classStudents = await executeWithRetry(
      () => Student.find({ class: classObj._id, educationLevel: 'O_LEVEL' }),
      `Error fetching students for class ${classObj._id}`
    );

    // Calculate student rankings
    const studentRankings = [];
    for (const classStudent of classStudents) {
      // Get results for this student
      const studentResults = await executeWithRetry(
        () => OLevelResult.find({
          studentId: classStudent._id,
          examId
        }),
        `Error fetching results for student ${classStudent._id} in exam ${examId}`
      );

      if (studentResults.length === 0) continue;

      // Calculate average marks
      const studentTotalMarks = studentResults.reduce((sum, result) => sum + result.marksObtained, 0);
      const studentAverageMarks = studentResults.length > 0 ? studentTotalMarks / studentResults.length : 0;

      // Calculate best seven points
      const studentSubjectResults = studentResults.map(result => ({
        marks: result.marksObtained,
        grade: result.grade,
        points: result.points
      }));

      const { bestSevenPoints: studentBestSevenPoints } = oLevelGradeCalculator.calculateBestSevenAndDivision(studentSubjectResults);

      studentRankings.push({
        studentId: classStudent._id,
        averageMarks: studentAverageMarks,
        bestSevenPoints: studentBestSevenPoints
      });
    }

    // Sort by average marks (descending) and assign ranks
    studentRankings.sort((a, b) => b.averageMarks - a.averageMarks);
    let rank = 0;
    let previousAverage = null;
    for (let i = 0; i < studentRankings.length; i++) {
      if (i === 0 || studentRankings[i].averageMarks !== previousAverage) {
        rank = i + 1;
      }
      studentRankings[i].rank = rank;
      previousAverage = studentRankings[i].averageMarks;
    }

    // Find the current student's rank
    const studentRanking = studentRankings.find(r => r.studentId.toString() === studentId);
    const studentRank = studentRanking ? studentRanking.rank : 'N/A';

    // Log student details for debugging
    logger.debug(`Student details for report: ${JSON.stringify({
      id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`,
      gender: student.gender,
      rollNumber: student.rollNumber
    })}`);

    // Format the report
    const report = {
      reportTitle: `${exam.name} Result Report`,
      schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      studentDetails: {
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        rollNumber: student.rollNumber || '',
        class: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
        className: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
        gender: student.gender || '',
        sex: student.gender || ''
      },
      // Include student object directly for compatibility
      student: {
        _id: student._id,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        gender: student.gender || '',
        rollNumber: student.rollNumber || ''
      },
      subjectResults,
      summary: {
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        totalPoints,
        bestSevenPoints,
        points: bestSevenPoints, // Include points field as an alias for bestSevenPoints
        division,
        rank: studentRank,
        totalStudents: classStudents.length,
        gradeDistribution
      },
      educationLevel: 'O_LEVEL',
      // Add logs for debugging
      logs: [
        `Student ${student._id} name: ${student.firstName || ''} ${student.lastName || ''}`.trim(),
        `Student has valid results: ${resultCount > 0}`,
        `Student ${student._id} summary: totalMarks=${totalMarks}, resultCount=${resultCount}, averageMarks=${averageMarks.toFixed(2)}`,
        `O-Level division calculation: Student ${student._id} division calculation: bestSevenPoints=${bestSevenPoints}, division=${division}`
      ]
    };

    // Return JSON or generate PDF based on format
    if (format === 'pdf') {
      const { generateOLevelStudentReportPDF } = require('../utils/oLevelReportGenerator');
      return generateOLevelStudentReportPDF(report, res);
    } else {
      return res.json({
        success: true,
        data: report
      });
    }
  } catch (error) {
    logger.error(`Error generating standardized O-Level student report: ${error.message}`);
    console.error('Error generating O-Level student report:', error);
    return res.status(500).json({
      success: false,
      message: `Error generating O-Level student report: ${error.message}`
    });
  }
};

/**
 * Get O-Level class report with standardized schema
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getClassReport = async (req, res) => {
  try {
    const { classId, examId } = req.params;
    const { format, forceRefresh } = req.query; // Optional format parameter (json or pdf) and forceRefresh parameter

    // Log the request details
    console.log('=== O-LEVEL CLASS REPORT CONTROLLER ===');
    console.log(`Request params: classId=${classId}, examId=${examId}`);
    console.log(`Request query: format=${format || 'json'}, forceRefresh=${forceRefresh || 'false'}`);
    console.log('Request headers:', req.headers);
    console.log('User info:', req.user ? { id: req.user.id, role: req.user.role } : 'No user info');

    logger.info(`Generating standardized O-Level class report for class ${classId}, exam ${examId}`);
    console.log(`Generating O-Level class report: classId=${classId}, examId=${examId}, format=${format || 'json'}`);

    // Add circuit breaker for database operations
    let retryCount = 0;
    const maxRetries = 3;

    // Helper function to execute database operations with retry logic
    async function executeWithRetry(dbOperation, errorMessage) {
      try {
        return await dbOperation();
      } catch (error) {
        if ((error.name === 'MongoNetworkError' || error.name === 'MongoError') && retryCount < maxRetries) {
          retryCount++;
          console.log(`Database operation failed, retrying (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return executeWithRetry(dbOperation, errorMessage);
        }
        logger.error(`${errorMessage}: ${error.message}`);
        throw error;
      }
    }

    // Get the class details with retry logic
    console.log(`Fetching class details for classId: ${classId}`);
    const classObj = await executeWithRetry(
      () => Class.findById(classId),
      `Error fetching class data for ${classId}`
    );

    console.log('Class details:', classObj ? {
      id: classObj._id,
      name: classObj.name,
      educationLevel: classObj.educationLevel,
      subjectCount: classObj.subjects?.length || 0
    } : 'Class not found');

    if (!classObj) {
      logger.error(`Class not found: ${classId}`);
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Get the exam details with retry logic
    const exam = await executeWithRetry(
      () => Exam.findById(examId).populate('academicYear'),
      `Error fetching exam data for ${examId}`
    );

    if (!exam) {
      logger.error(`Exam not found: ${examId}`);
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Get students in this class with retry logic
    console.log(`Fetching students for class: ${classId}`);
    const students = await executeWithRetry(
      () => Student.find({ class: classId, educationLevel: 'O_LEVEL' }),
      `Error fetching students for class ${classId}`
    );

    console.log(`Found ${students.length} O-Level students in class ${classId}`);
    if (students.length > 0) {
      console.log('First student example:', {
        id: students[0]._id,
        name: `${students[0].firstName} ${students[0].lastName}`,
        rollNumber: students[0].rollNumber,
        gender: students[0].gender
      });
    }

    if (students.length === 0) {
      logger.warn(`No students found in class ${classId}`);

      // Return an empty report with a warning instead of mock data
      // This is the key change - we'll show real data (empty) instead of mock data
      logger.info('Returning empty report with warning');

      return res.json({
        success: true,
        warning: 'No students found in this class. The report will update automatically when students are added.',
        data: {
          classId,
          examId,
          className: classObj.name,
          examName: exam.name,
          academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
          students: [],
          subjects: [],
          subjectAnalysis: [],
          classAverage: '0.00',
          divisionSummary: { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 },
          passRate: 0,
          totalStudents: 0,
          educationLevel: 'O_LEVEL',
          mock: false // Important: We're not using mock data, we're showing real (empty) data
        }
      });
    }

    // Get all results for this class and exam
    console.log(`Fetching ALL results for class ${classId} and exam ${examId}`);
    const allResults = await executeWithRetry(
      () => OLevelResult.find({ classId, examId }).populate('subjectId', 'name code'),
      `Error fetching results for class ${classId} in exam ${examId}`
    );

    console.log(`Found ${allResults.length} total results for class ${classId} in exam ${examId}`);
    if (allResults.length > 0) {
      console.log('First result example:', {
        id: allResults[0]._id,
        studentId: allResults[0].studentId,
        subjectId: allResults[0].subjectId?._id || 'No subject ID',
        subjectName: allResults[0].subjectId?.name || 'No subject name',
        marks: allResults[0].marksObtained,
        grade: allResults[0].grade,
        points: allResults[0].points
      });

      // Group results by student to see distribution
      const resultsByStudent = {};
      allResults.forEach(result => {
        const studentId = result.studentId.toString();
        if (!resultsByStudent[studentId]) {
          resultsByStudent[studentId] = [];
        }
        resultsByStudent[studentId].push(result);
      });

      console.log(`Results distribution by student: ${Object.keys(resultsByStudent).length} students have results`);
      Object.keys(resultsByStudent).forEach(studentId => {
        console.log(`Student ${studentId} has ${resultsByStudent[studentId].length} results`);
      });
    }

    // Check if we have any results at all
    if (allResults.length === 0) {
      logger.warn(`No results found for class ${classId} in exam ${examId}`);

      // If forceRefresh is true, return an error
      if (forceRefresh === 'true') {
        return res.status(404).json({
          success: false,
          message: 'No marks have been entered for this class and exam. Real data was requested, so no mock data is being returned.'
        });
      }

      // Otherwise, continue with empty results - we'll handle this later
      logger.info(`No results found for class ${classId} in exam ${examId}, but forceRefresh is not true, continuing with empty results`);
    }

    // Extract unique subjects
    console.log('Extracting unique subjects from results and class data');
    const subjects = [];
    const subjectMap = new Map();

    // ALWAYS get all O-Level subjects from the database first
    console.log('Fetching ALL O-Level subjects from database');
    const allOLevelSubjects = await executeWithRetry(
      () => Subject.find({ educationLevel: { $in: ['O_LEVEL', 'BOTH'] } }),
      'Error fetching all O-Level subjects'
    );

    if (allOLevelSubjects && allOLevelSubjects.length > 0) {
      console.log(`Found ${allOLevelSubjects.length} O-Level subjects in database`);
      for (const subject of allOLevelSubjects) {
        if (!subjectMap.has(subject._id.toString())) {
          subjectMap.set(subject._id.toString(), true);
          subjects.push({
            id: subject._id,
            name: subject.name,
            code: subject.code || subject.name.substring(0, 4).toUpperCase()
          });
          console.log(`Added subject from database: ${subject.name} (${subject._id})`);
        }
      }
    }

    // Then get subjects assigned to the class
    console.log(`Fetching subjects assigned to class ${classId}`);
    const classWithSubjects = await executeWithRetry(
      () => Class.findById(classId).populate('subjects.subject'),
      `Error fetching subjects for class ${classId}`
    );

    if (classWithSubjects && classWithSubjects.subjects) {
      console.log(`Class has ${classWithSubjects.subjects.length} subject entries in class object`);
      for (const subjectEntry of classWithSubjects.subjects) {
        if (subjectEntry.subject && !subjectMap.has(subjectEntry.subject._id.toString())) {
          subjectMap.set(subjectEntry.subject._id.toString(), true);
          subjects.push({
            id: subjectEntry.subject._id,
            name: subjectEntry.subject.name,
            code: subjectEntry.subject.code || subjectEntry.subject.name.substring(0, 4).toUpperCase()
          });
          console.log(`Added subject from class: ${subjectEntry.subject.name} (${subjectEntry.subject._id})`);
        }
      }
    }

    // Then add any subjects from results that might not be in the class subjects
    for (const result of allResults) {
      if (result.subjectId && !subjectMap.has(result.subjectId._id.toString())) {
        subjectMap.set(result.subjectId._id.toString(), true);
        subjects.push({
          id: result.subjectId._id,
          name: result.subjectId.name,
          code: result.subjectId.code || result.subjectId.name.substring(0, 4).toUpperCase()
        });
        console.log(`Added subject from results: ${result.subjectId.name} (${result.subjectId._id})`);
      }
    }

    // If we still have no subjects, try to get them directly from the database
    if (subjects.length === 0) {
      console.log('No subjects found from class or results. Fetching all O-Level subjects from database.');
      const allSubjects = await executeWithRetry(
        () => Subject.find({ educationLevel: 'O_LEVEL' }),
        'Error fetching all O-Level subjects'
      );

      if (allSubjects && allSubjects.length > 0) {
        console.log(`Found ${allSubjects.length} O-Level subjects in database`);
        for (const subject of allSubjects) {
          if (!subjectMap.has(subject._id.toString())) {
            subjectMap.set(subject._id.toString(), true);
            subjects.push({
              id: subject._id,
              name: subject.name,
              code: subject.code || subject.name.substring(0, 4).toUpperCase()
            });
            console.log(`Added subject from database: ${subject.name} (${subject._id})`);
          }
        }
      }
    }

    // Sort subjects by name
    subjects.sort((a, b) => a.name.localeCompare(b.name));

    // Process student results
    console.log(`Processing results for ${students.length} students`);
    const studentResults = [];
    let classTotal = 0;
    let classCount = 0;

    // Division summary based on NECTA standards
    const divisionSummary = {
      'I': 0,   // 7-17 points
      'II': 0,  // 18-21 points
      'III': 0, // 22-25 points
      'IV': 0,  // 26-33 points
      '0': 0    // 34+ points
    };

    // Subject analysis
    const subjectAnalysis = subjects.map(subject => ({
      name: subject.name, // Use the original subject name
      code: subject.code,
      teacher: '-', // Use a dash instead of N/A for better display
      averageMarks: 0,
      highestMarks: 0,
      lowestMarks: 100,
      grades: { A: 0, B: 0, C: 0, D: 0, F: 0 }
    }));

    // Log all subjects for debugging
    console.log('All subjects for report:', subjects.map(s => `${s.name} (${s.code})`));

    // Track if we have any results at all
    let anyResultsFound = false;
    let totalResultsFound = 0;

    for (const student of students) {
      // Get results for this student
      const studentId = student._id;
      console.log(`Processing student: ${studentId} (${student.firstName} ${student.lastName})`);

      console.log(`Fetching results for student ${studentId} in exam ${examId}`);
      const results = await executeWithRetry(
        () => OLevelResult.find({
          studentId,
          examId,
          classId // Important: Add classId to ensure we only get results for this class
        }).populate('subjectId', 'name code'),
        `Error fetching results for student ${studentId} in exam ${examId}`
      );

      // Log the raw results for debugging
      console.log(`Raw results for student ${studentId}: ${JSON.stringify(results.map(r => ({
        id: r._id,
        subjectId: r.subjectId?._id,
        subjectName: r.subjectId?.name,
        marks: r.marksObtained,
        grade: r.grade
      })))}`);

      // Check if the student has any results with the correct classId
      const resultsWithCorrectClass = await OLevelResult.find({
        studentId,
        examId
      });

      console.log(`Student ${studentId} has ${resultsWithCorrectClass.length} results in total, but only ${results.length} for class ${classId}`);
      if (resultsWithCorrectClass.length > 0 && results.length === 0) {
        console.log(`WARNING: Student ${studentId} has results but none for class ${classId}. Check classId in results:`,
          resultsWithCorrectClass.map(r => ({ id: r._id, classId: r.classId })));
      }

      console.log(`Found ${results.length} results for student ${studentId} in exam ${examId}`);

      // If this student has at least one result, set anyResultsFound to true
      if (results.length > 0) {
        anyResultsFound = true;
        totalResultsFound += results.length;

        // Log the first result as an example
        if (results[0]) {
          console.log('Example result:', {
            subjectId: results[0].subjectId?._id || 'No subject ID',
            subjectName: results[0].subjectId?.name || 'No subject name',
            marks: results[0].marksObtained,
            grade: results[0].grade,
            points: results[0].points
          });
        }
      } else {
        console.log(`No results found for student ${studentId}, will use placeholder values`);
      }

      // Get student's selected subjects (both core and optional)
      let studentSubjectIds = [];
      try {
        // First try to get directly from student record
        if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
          studentSubjectIds = student.selectedSubjects.map(s =>
            typeof s === 'object' && s._id ? s._id.toString() : s.toString());
          console.log(`Student ${studentId} has ${studentSubjectIds.length} selected subjects directly on their record`);
        }

        // If no subjects found, try to find from StudentSubjectSelection model
        if (studentSubjectIds.length === 0) {
          try {
            const StudentSubjectSelection = mongoose.model('StudentSubjectSelection');
            const subjectSelection = await StudentSubjectSelection.findOne({ student: studentId });

            if (subjectSelection) {
              // Combine core and optional subjects
              const coreSubjectIds = subjectSelection.coreSubjects.map(s => s.toString());
              const optionalSubjectIds = subjectSelection.optionalSubjects.map(s => s.toString());
              studentSubjectIds = [...coreSubjectIds, ...optionalSubjectIds];
              console.log(`Student ${studentId} has ${studentSubjectIds.length} subjects from StudentSubjectSelection (${coreSubjectIds.length} core, ${optionalSubjectIds.length} optional)`);
            }
          } catch (error) {
            console.log(`Error fetching subject selection for student ${studentId}:`, error.message);
          }
        }

        // If still no subjects found, assume all subjects
        if (studentSubjectIds.length === 0) {
          studentSubjectIds = subjects.map(s => s.id.toString());
          console.log(`Assuming all subjects for student ${studentId} as no specific selections found`);
        }
      } catch (error) {
        console.error(`Error getting subject selections for student ${studentId}:`, error);
        // Default to all subjects if there's an error
        studentSubjectIds = subjects.map(s => s.id.toString());
      }

      // Process results
      const subjectResults = [];
      let totalMarks = 0;
      let totalPoints = 0;
      let resultCount = 0;
      let hasAnyValidResult = false; // Track if this student has at least one valid result

      for (const subject of subjects) {
        console.log(`Checking subject ${subject.name} (${subject.id}) for student ${studentId}`);

        // Check if this student takes this subject
        let studentTakesSubject = false;

        // First get the full subject details to check if it's a core subject
        const fullSubject = await Subject.findById(subject.id).select('name code type');

        // Method 1: Check if it's a core subject (all students take core subjects)
        if (fullSubject && fullSubject.type === 'CORE') {
          studentTakesSubject = true;
          console.log(`Subject ${subject.name} is a core subject, student ${studentId} takes it by default`);
        } else {
          // Method 2: Check if it's in the student's selected subjects
          studentTakesSubject = studentSubjectIds.includes(subject.id.toString());

          if (studentTakesSubject) {
            console.log(`Student ${studentId} takes optional subject ${subject.name} based on subject selection`);
          } else {
            console.log(`Student ${studentId} does NOT take optional subject ${subject.name}`);
          }
        }

        // Find result for this subject
        const result = results.find(r => r.subjectId && r.subjectId._id && r.subjectId._id.toString() === subject.id.toString());

        if (result) {
          console.log(`Found result for subject ${subject.name}: marks=${result.marksObtained}, grade=${result.grade}, points=${result.points}`);
          hasAnyValidResult = true; // Student has at least one valid result

          subjectResults.push({
            subject: subject.name, // Use the original subject name
            code: subject.code,
            marks: result.marksObtained,
            grade: result.grade,
            points: result.points,
            studentTakesSubject // Flag to indicate if student takes this subject
          });

          totalMarks += result.marksObtained;
          totalPoints += result.points;
          resultCount++;

          // Update subject analysis
          const subjectIndex = subjectAnalysis.findIndex(s => s.name === subject.name);
          if (subjectIndex !== -1) {
            const analysis = subjectAnalysis[subjectIndex];
            analysis.averageMarks += result.marksObtained;
            analysis.highestMarks = Math.max(analysis.highestMarks, result.marksObtained);
            analysis.lowestMarks = Math.min(analysis.lowestMarks, result.marksObtained);
            if (analysis.grades[result.grade] !== undefined) {
              analysis.grades[result.grade]++;
            }
          }
        } else {
          console.log(`No result found for subject ${subject.name}, using placeholder values`);

          // Still include the subject in the results, but with placeholder values
          subjectResults.push({
            subject: subject.name,
            code: subject.code,
            marks: 0,
            grade: 'N/A',
            points: 0,
            studentTakesSubject // Flag to indicate if student takes this subject
          });
        }
      }

      // Sort subject results by name for consistent display
      subjectResults.sort((a, b) => a.subject.localeCompare(b.subject));

      // Log whether this student has any valid results
      console.log(`Student ${studentId} has valid results: ${hasAnyValidResult}`);

      // If the student has no valid results, we'll still include them in the report
      // but with placeholder values for all subjects

      // Calculate average marks
      const averageMarks = resultCount > 0 ? totalMarks / resultCount : 0;
      console.log(`Student ${studentId} summary: totalMarks=${totalMarks}, resultCount=${resultCount}, averageMarks=${averageMarks.toFixed(2)}`);

      // Calculate best seven subjects (lowest points = best grades)
      const { bestSevenPoints, division } = oLevelGradeCalculator.calculateBestSevenAndDivision(subjectResults);
      console.log(`Student ${studentId} division calculation: bestSevenPoints=${bestSevenPoints}, division=${division}`);

      // Update division summary
      if (divisionSummary[division] !== undefined) {
        divisionSummary[division]++;
      }

      // Only add the student to the results if they have at least one valid result
      // or if we're including all students regardless of results
      const includeAllStudents = true; // Set to true to include all students, even those with no results

      if (hasAnyValidResult || includeAllStudents) {
        studentResults.push({
          id: studentId,
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          gender: student.gender || 'N/A',  // Include gender/sex field
          sex: student.gender || 'N/A',     // Include both gender and sex fields for compatibility
          results: subjectResults,
          totalMarks,
          averageMarks: averageMarks.toFixed(2),
          totalPoints,
          bestSevenPoints,
          points: bestSevenPoints,         // Include points field as an alias for bestSevenPoints
          division,
          hasResults: hasAnyValidResult     // Flag to indicate if this student has any valid results
        });

        console.log(`Added student ${studentId} to report with ${resultCount} results`);
      } else {
        console.log(`Skipped student ${studentId} because they have no valid results`);
      }

      classTotal += averageMarks;
      classCount++;
    }

    // Calculate class average
    const classAverage = classCount > 0 ? classTotal / classCount : 0;

    // Sort students by average marks (descending) and assign ranks
    studentResults.sort((a, b) => Number.parseFloat(b.averageMarks) - Number.parseFloat(a.averageMarks));
    studentResults.forEach((student, index) => {
      student.rank = index + 1;
    });

    // Finalize subject analysis
    for (const subject of subjectAnalysis) {
      const totalStudents = Object.values(subject.grades).reduce((sum, count) => sum + count, 0);
      if (totalStudents > 0) {
        subject.averageMarks = subject.averageMarks / totalStudents;

        // Calculate GPA (1-5 scale, A=1, F=5)
        const totalPoints = subject.grades.A * 1 + subject.grades.B * 2 + subject.grades.C * 3 +
                           subject.grades.D * 4 + subject.grades.F * 5;
        subject.gpa = (totalPoints / totalStudents).toFixed(2);
        subject.studentCount = totalStudents; // Add student count for the Result Summary card
      } else {
        subject.gpa = '0.00';
        subject.studentCount = 0;
      }
    }

    // Create the report object
    console.log(`Creating final report object with ${studentResults.length} students and ${subjects.length} subjects`);
    console.log(`Total results found: ${totalResultsFound}`);
    console.log(`Any results found: ${anyResultsFound}`);
    console.log(`Class average: ${classAverage.toFixed(2)}`);
    console.log('Division summary:', divisionSummary);

    // Log all subjects for debugging
    console.log('All subjects being included in report:', subjects.map(s => `${s.name} (${s.code})`));

    const report = {
      reportTitle: `${exam.name} Class Result Report`,
      schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
      academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
      examName: exam.name,
      examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
      className: classObj.name,
      section: classObj.section || '',
      stream: classObj.stream || '',
      // Ensure subjects are properly formatted for the frontend
      subjects: subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code
      })),
      students: studentResults,
      subjectAnalysis,
      classAverage: classAverage.toFixed(2),
      divisionSummary,
      passRate: 0, // Would need to calculate based on passing criteria
      totalStudents: students.length,
      educationLevel: 'O_LEVEL'
    };

    // Add warning if no results were found
    if (!anyResultsFound) {
      report.warning = 'No marks have been entered for this class and exam yet. The report will update automatically as marks are entered.';
      console.log('Adding warning to report: No marks found');

      // Important: Even though we have no results, this is still real data (just empty)
      // Setting mock to false explicitly tells the frontend not to use mock data
      report.mock = false;
    }

    // Check if we found any results at all
    if (!anyResultsFound) {
      logger.warn(`No results found for any student in class ${classId} for exam ${examId}`);

      // Add a warning to the report but don't use mock data
      // This is the key change - we'll show real data (empty) instead of mock data
      report.warning = 'No marks have been entered for any student in this class and exam. The report will update automatically as marks are entered.';
      report.mock = false; // Important: We're not using mock data, we're showing real (empty) data

      logger.info(`No results found for any student in class ${classId} for exam ${examId}, continuing with empty results and adding a warning`);
    }
    // If we have partial data (some students have marks, some don't), add a warning
    else if (anyResultsFound) {
      const studentsWithMarks = studentResults.length;
      const totalStudents = students.length;
      const percentageWithMarks = Math.round((studentsWithMarks / totalStudents) * 100);

      logger.info(`Partial data available: ${studentsWithMarks}/${totalStudents} students (${percentageWithMarks}%) have marks entered`);

      // Add a warning if less than 100% of students have marks
      if (studentsWithMarks < totalStudents) {
        report.warning = `Showing real-time data: ${studentsWithMarks} out of ${totalStudents} students have marks entered (${percentageWithMarks}%). The report will update automatically as more marks are entered.`;
      }
    }

    // Return JSON or generate PDF based on format
    if (format === 'pdf') {
      console.log('Generating PDF report');
      const { generateOLevelClassReportPDF } = require('../utils/oLevelReportGenerator');
      return generateOLevelClassReportPDF(report, res);
    } else {
      // Log the report data for debugging
      logger.info(`Returning O-Level class report for class ${classId}, exam ${examId} with ${report.students.length} students`);
      console.log(`O-Level class report response:`, {
        success: true,
        hasData: !!report,
        studentCount: report.students.length,
        subjectCount: report.subjects.length,
        isMock: report.mock === true,
        hasWarning: !!report.warning,
        warning: report.warning
      });

      // Ensure the response has a consistent format
      console.log('Sending JSON response with real data');
      return res.json({
        success: true,
        data: report
      });
    }
  } catch (error) {
    logger.error(`Error generating standardized O-Level class report: ${error.message}`);
    console.error('Error generating O-Level class report:', error);
    return res.status(500).json({
      success: false,
      message: `Error generating O-Level class report: ${error.message}`
    });
  }
};
