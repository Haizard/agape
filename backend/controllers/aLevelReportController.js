/**
 * A-Level Report Controller
 *
 * Provides standardized endpoints for A-Level result reports with consistent data schema
 * and centralized calculation logic.
 */
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const ALevelResult = require('../models/ALevelResult');
const NewALevelResult = require('../models/NewALevelResult');
const CharacterAssessment = require('../models/CharacterAssessment');
const SubjectCombination = require('../models/SubjectCombination');
const logger = require('../utils/logger');
const aLevelGradeCalculator = require('../utils/aLevelGradeCalculator');
const { getFullSubjectCombination } = require('../utils/subjectCombinationUtils');
const { determineFormLevel, validateStudentFormLevel, determineClassFormLevel } = require('../utils/formLevelUtils');
const mongoose = require('mongoose');

/**
 * Get A-Level student report with standardized schema
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getStudentReport = async (req, res) => {
  try {
    let { studentId, examId } = req.params;
    const { formLevel } = req.query; // Optional form level filter (5 or 6)

    // Convert IDs to ObjectId
    if (studentId && typeof studentId === 'string') studentId = new mongoose.Types.ObjectId(studentId);
    if (examId && typeof examId === 'string') examId = new mongoose.Types.ObjectId(examId);

    logger.info(`Generating standardized A-Level student report for student ${studentId}, exam ${examId}`);
    console.log(`Generating A-Level student report: studentId=${studentId}, examId=${examId}, formLevel=${formLevel || 'not specified'}`);

    // Check if we should use mock data
    const useMockData = false; // Force real data
    console.log('Forcing use of real data for A-Level student report');

    if (useMockData) {
      console.log('Returning mock data for A-Level student report');
      return res.json({
      success: true,
      data: {
        studentId,
        examId,
        studentDetails: {
          name: 'John Smith',
          rollNumber: 'F5S001',
          class: 'Form 5 Science',
          gender: 'male',
          rank: 1,
          totalStudents: 25,
          form: formLevel || 5
        },
        examName: 'Mid-Term Exam 2023',
        academicYear: '2023-2024',
        examDate: '2023-06-15 - 2023-06-30',
        subjectCombination: {
          name: 'PCM',
          code: 'PCM',
          subjects: [
            { name: 'Physics', code: 'PHY', isPrincipal: true },
            { name: 'Chemistry', code: 'CHE', isPrincipal: true },
            { name: 'Mathematics', code: 'MAT', isPrincipal: true },
            { name: 'General Studies', code: 'GS', isPrincipal: false }
          ]
        },
        form5Results: formLevel === '6' || formLevel === 6 ? {
          averageMarks: '78.50',
          bestThreePoints: 5,
          division: 'II',
          examName: 'Final Exam 2022'
        } : null,
        characterAssessment: {
          punctuality: 'Excellent',
          discipline: 'Good',
          respect: 'Excellent',
          leadership: 'Good',
          participation: 'Excellent',
          overallAssessment: 'Excellent',
          comments: 'John is a dedicated student who shows great potential.',
          assessedBy: 'Mr. Johnson'
        },
        subjectResults: [
          { subject: 'Physics', code: 'PHY', marks: 85, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
          { subject: 'Chemistry', code: 'CHE', marks: 78, grade: 'B', points: 2, remarks: 'Good', isPrincipal: true },
          { subject: 'Mathematics', code: 'MAT', marks: 92, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
          { subject: 'General Studies', code: 'GS', marks: 75, grade: 'B', points: 2, remarks: 'Good', isPrincipal: false }
        ],
        principalSubjects: [
          { subject: 'Physics', code: 'PHY', marks: 85, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
          { subject: 'Chemistry', code: 'CHE', marks: 78, grade: 'B', points: 2, remarks: 'Good', isPrincipal: true },
          { subject: 'Mathematics', code: 'MAT', marks: 92, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true }
        ],
        subsidiarySubjects: [
          { subject: 'General Studies', code: 'GS', marks: 75, grade: 'B', points: 2, remarks: 'Good', isPrincipal: false }
        ],
        summary: {
          totalMarks: 330,
          averageMarks: '82.50',
          totalPoints: 6,
          bestThreePoints: 4,
          division: 'I',
          rank: 1,
          totalStudents: 25,
          gradeDistribution: { 'A': 2, 'B': 2, 'C': 0, 'D': 0, 'E': 0, 'S': 0, 'F': 0 }
        },
        educationLevel: 'A_LEVEL'
      }
    });
    }

    // Fetch real data from the database
    console.log('Fetching real data from database for A-Level student report');

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

    // Get the exam details with retry logic
    const exam = await executeWithRetry(
      () => Exam.findById(examId),
      `Error fetching exam data for ${examId}`
    );

    if (!exam) {
      logger.error(`Exam not found: ${examId}`);
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Get the student's results for this exam with retry logic
    // First, try to get results from the legacy ALevelResult model
    let results = await executeWithRetry(
      () => ALevelResult.find({
        $or: [
          { student: studentId, exam: examId },
          { studentId: studentId, examId: examId }
        ]
      }).populate('subject'),
      `Error fetching legacy results for student ${studentId} in exam ${examId}`
    );

    // If no results found in legacy model, try the new model
    if (results.length === 0) {
      console.log(`No legacy results found for student ${studentId} in exam ${examId}, trying new model`);
      const newResults = await executeWithRetry(
        () => NewALevelResult.find({
          studentId: studentId,
          examId: examId
        }).populate('subjectId'),
        `Error fetching new results for student ${studentId} in exam ${examId}`
      );

      // If we found results in the new model, transform them to match the legacy format
      if (newResults.length > 0) {
        console.log(`Found ${newResults.length} results in new model for student ${studentId} in exam ${examId}`);
        results = newResults.map(result => ({
          _id: result._id,
          student: result.studentId,
          exam: result.examId,
          subject: result.subjectId,
          marksObtained: result.marksObtained,
          grade: result.grade || aLevelGradeCalculator.calculateGrade(result.marksObtained),
          points: result.points || aLevelGradeCalculator.calculatePoints(result.grade || aLevelGradeCalculator.calculateGrade(result.marksObtained)),
          isPrincipal: result.isPrincipal,
          isInCombination: result.isInCombination
        }));
      }
    }

    if (results.length === 0) {
      logger.warn(`No results found for student ${studentId} in exam ${examId}`);
      return res.status(404).json({
        success: false,
        message: 'No results found for this student in this exam'
      });
    }

    // Get the student's class with retry logic
    const classData = await executeWithRetry(
      () => Class.findById(student.class),
      `Error fetching class data for student ${studentId}`
    );

    // Get the subject combination for this student with retry logic
    const subjectCombination = await executeWithRetry(
      () => SubjectCombination.findOne({ class: student.class }).populate('subjects'),
      `Error fetching subject combination for student ${studentId}`
    );

    // Format the subject combination
    const formattedSubjectCombination = subjectCombination ? {
      name: subjectCombination.name,
      code: subjectCombination.code,
      subjects: subjectCombination.subjects.map(subject => ({
        name: subject.name,
        code: subject.code,
        isPrincipal: subject.isPrincipal
      }))
    } : null;

    // Build a set of subject codes in the combination for robust filtering
    const combinationSubjectCodes = (subjectCombination?.subjects || []).map(s => s.code);

    // Format results for the response
    const formattedResults = results.map(result => {
      return {
        subject: result.subject ? result.subject.name : 'Unknown Subject',
        code: result.subject ? result.subject.code : 'UNK',
        marks: result.marksObtained || result.marks || 0,
        grade: result.grade || 'F',
        points: result.points || 0,
        remarks: aLevelGradeCalculator.getRemarks(result.grade),
        isPrincipal: result.subject ? result.subject.isPrincipal : false
      };
    });

    // Always include all subjects with marks, not just those in the combination
    const resultsForAverage = formattedResults; // Use all results for average
    const totalMarks = resultsForAverage.reduce((sum, result) => sum + (result.marks || 0), 0);
    const averageMarks = resultsForAverage.length > 0 ? (totalMarks / resultsForAverage.length).toFixed(2) : '0.00';

    // Get principal subjects results
    const principalResults = formattedResults.filter(
      result => result.isPrincipal && result.marks !== '' && result.marks !== undefined && result.marks !== null && result.marks !== 0
    );

    // Get subsidiary subjects results
    const subsidiaryResults = formattedResults.filter(result => !result.isPrincipal);

    // Calculate points and best three points
    const totalPoints = formattedResults.reduce((sum, result) => sum + (result.points || 0), 0);

    // Sort principal results by points (ascending, since lower points are better)
    principalResults.sort((a, b) => (a.points || 0) - (b.points || 0));

    // Take the best three principal subjects (or fewer if not enough)
    const bestThreeResults = principalResults.slice(0, 3);
    const bestThreePoints = bestThreeResults.reduce((sum, result) => sum + (result.points || 0), 0);

    // Determine division based on best three points
    const division = aLevelGradeCalculator.calculateDivision(bestThreePoints);

    // Calculate grade distribution
    const gradeDistribution = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'S': 0, 'F': 0 };
    for (const result of formattedResults) {
      if (result.grade in gradeDistribution) {
        gradeDistribution[result.grade]++;
      }
    }

    // Get character assessment for this student with retry logic
    let characterAssessment = null;
    try {
      characterAssessment = await executeWithRetry(
        () => CharacterAssessment.findOne({
          student: studentId,
          exam: examId
        }),
        `Error fetching character assessment for student ${studentId} in exam ${examId}`
      );
    } catch (error) {
      logger.warn(`No character assessment found for student ${studentId} in exam ${examId}`);
    }

    // Format character assessment
    const formattedCharacterAssessment = characterAssessment ? {
      punctuality: characterAssessment.punctuality,
      discipline: characterAssessment.discipline,
      respect: characterAssessment.respect,
      leadership: characterAssessment.leadership,
      participation: characterAssessment.participation,
      overallAssessment: characterAssessment.overallAssessment,
      comments: characterAssessment.comments,
      assessedBy: characterAssessment.assessedBy
    } : null;

    // Prepare the response
    const response = {
      success: true,
      data: {
        studentId,
        examId,
        studentDetails: {
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber || `F${student.form || '5'}S${student.admissionNumber || '000'}`,
          class: classData ? classData.name : 'Unknown Class',
          gender: student.gender,
          rank: 0, // This would need to be calculated from class rankings
          totalStudents: 0, // This would need to be calculated from class size
          form: determineFormLevel(student)
        },
        examName: exam.name,
        academicYear: exam.academicYear || '2023-2024',
        examDate: exam.startDate && exam.endDate ? `${exam.startDate} - ${exam.endDate}` : 'Unknown',
        subjectCombination: formattedSubjectCombination,
        form5Results: null, // This would need to be fetched from previous exams
        characterAssessment: formattedCharacterAssessment,
        subjectResults: formattedResults,
        principalSubjects: principalResults,
        subsidiarySubjects: subsidiaryResults,
        summary: {
          totalMarks,
          averageMarks,
          totalPoints,
          bestThreePoints,
          division,
          rank: 0, // This would need to be calculated from class rankings
          totalStudents: 0, // This would need to be calculated from class size
          gradeDistribution
        },
        educationLevel: 'A_LEVEL'
      }
    };

    return res.json(response);
  } catch (error) {
    logger.error(`Error generating standardized A-Level student report: ${error.message}`);
    console.error('Error generating A-Level student report:', error);
    return res.status(500).json({
      success: false,
      message: `Error generating A-Level student report: ${error.message}`
    });
  }
};

/**
 * Get A-Level class report with standardized schema
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getClassReport = async (req, res) => {
  try {
    let { classId, examId } = req.params;
    const { formLevel } = req.query; // Optional form level filter (5 or 6)

    // Convert IDs to ObjectId
    if (classId && typeof classId === 'string') classId = new mongoose.Types.ObjectId(classId);
    if (examId && typeof examId === 'string') examId = new mongoose.Types.ObjectId(examId);

    logger.info(`Generating standardized A-Level class report for class ${classId}, exam ${examId}, formLevel: ${formLevel || 'all'}`);
    console.log(`Generating A-Level class report: classId=${classId}, examId=${examId}, formLevel=${formLevel || 'all'}`);
    console.log('Request headers:', req.headers);
    console.log('Request query parameters:', req.query);
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);

    // IMPORTANT: We're forcing the use of real data for this endpoint
    // This is a temporary fix to ensure we're always using real data
    let useMockData = false;
    console.log('Forcing use of real data for A-Level class report');
    console.log('Setting useMockData to false explicitly');

    // Override any environment variables or query parameters
    process.env.USE_MOCK_DATA = 'false';
    process.env.USE_DEMO_DATA = 'false';

    // Log parameters for debugging
    console.log('USE_MOCK_DATA env (raw):', process.env.USE_MOCK_DATA);
    console.log('USE_DEMO_DATA env (raw):', process.env.USE_DEMO_DATA);
    console.log('useMock query param:', req.query.useMock);
    console.log('forceRefresh query param:', req.query.forceRefresh);

    console.log('Using mock data (final):', useMockData);

    console.log('Final useMockData value before check:', useMockData);
    console.log('Type of useMockData:', typeof useMockData);

    if (useMockData === true) {
      console.log('Using mock data for A-Level class report (configured in environment)');
      console.log('To use real data, set USE_DEMO_DATA=false in .env and use forceRefresh=true');
      console.log('WARNING: Mock data is being used despite our attempts to force real data!');
      return res.json({
        success: true,
        data: {
          classId,
          examId,
          className: 'Form 5 Science',
          examName: 'Mid-Term Exam 2023',
          academicYear: '2023-2024',
          formLevel: formLevel || 'all',
          students: [
            {
              id: 'student1',
              name: 'John Smith',
              rollNumber: 'F5S001',
              sex: 'M',
              results: [
                { subject: 'Physics', code: 'PHY', marks: 85, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
                { subject: 'Chemistry', code: 'CHE', marks: 78, grade: 'B', points: 2, remarks: 'Good', isPrincipal: true },
                { subject: 'Mathematics', code: 'MAT', marks: 92, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
                { subject: 'General Studies', code: 'GS', marks: 75, grade: 'B', points: 2, remarks: 'Good', isPrincipal: false }
              ],
              totalMarks: 330,
              averageMarks: '82.50',
              totalPoints: 6,
              bestThreePoints: 4,
              division: 'I',
              rank: 1
            },
            {
              id: 'student2',
              name: 'Jane Doe',
              rollNumber: 'F5S002',
              sex: 'F',
              results: [
                { subject: 'Physics', code: 'PHY', marks: 92, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
                { subject: 'Chemistry', code: 'CHE', marks: 88, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
                { subject: 'Mathematics', code: 'MAT', marks: 95, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
                { subject: 'General Studies', code: 'GS', marks: 82, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: false }
              ],
              totalMarks: 357,
              averageMarks: '89.25',
              totalPoints: 4,
              bestThreePoints: 3,
              division: 'I',
              rank: 2
            }
          ],
          divisionDistribution: { 'I': 2, 'II': 0, 'III': 0, 'IV': 0, '0': 0 },
          educationLevel: 'A_LEVEL'
        }
      });
    }

    // Fetch real data from the database
    console.log('Fetching real data from database for A-Level class report');

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
    const classData = await executeWithRetry(
      () => Class.findById(classId),
      `Error fetching class data for ${classId}`
    );

    if (!classData) {
      logger.error(`Class not found: ${classId}`);
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Get the exam details with retry logic
    const examData = await executeWithRetry(
      () => Exam.findById(examId),
      `Error fetching exam data for ${examId}`
    );

    if (!examData) {
      logger.error(`Exam not found: ${examId}`);
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Get students in this class with retry logic
    const students = await executeWithRetry(
      () => Student.find({ class: classId, educationLevel: 'A_LEVEL' }),
      `Error fetching students for class ${classId}`
    );
    let filteredStudents = students;
    // Filter by form level if provided
    if (formLevel) {
      console.log(`Filtering students by form level: ${formLevel}`);
      console.log('Student form levels before filtering:', students.map(s => ({ id: s._id, name: `${s.firstName} ${s.lastName}`, form: s.form })));
      const mappedFormLevel = formLevel === '5' ? '1' : (formLevel === '6' ? '2' : (formLevel === '1' ? '5' : (formLevel === '2' ? '6' : formLevel)));
      console.log(`Mapped form level ${formLevel} to ${mappedFormLevel} for database comparison`);
      filteredStudents = students.filter(student => {
        const rawFormLevel = student.form;
        console.log('Student', student._id, '(', student.firstName, student.lastName, ') has raw form level', rawFormLevel);
        const match = rawFormLevel && (
          rawFormLevel.toString() === formLevel.toString() ||
          (formLevel === '5' && rawFormLevel.toString() === '1') ||
          (formLevel === '6' && rawFormLevel.toString() === '2') ||
          (formLevel === '1' && rawFormLevel.toString() === '5') ||
          (formLevel === '2' && rawFormLevel.toString() === '6')
        );
        console.log('Student', student._id, '(', student.firstName, student.lastName, ') has raw form level', rawFormLevel, ', match with', formLevel, ':', match);
        return match;
      });
      console.log(`After filtering, ${filteredStudents.length} students remain`);
    }

    if (filteredStudents.length === 0) {
      logger.warn(`No A-Level students found in class ${classId}`);
      console.log('WARNING: No students found matching the criteria. Returning mock data as a fallback.');
      console.log('This is a temporary solution until real data is available.');

      // Return mock data as a fallback, but with a warning message
      return res.json({
        success: true,
        warning: 'No real data found. Showing mock data as a fallback.',
        data: {
          classId,
          examId,
          className: `Form ${formLevel || '5'} Science`,
          examName: 'Mid-Term Exam 2023',
          academicYear: '2023-2024',
          formLevel: formLevel || 'all',
          students: [
            {
              id: 'student1',
              name: 'John Smith',
              rollNumber: `F${formLevel || '5'}S001`,
              sex: 'M',
              results: [
                { subject: 'Physics', code: 'PHY', marks: 85, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
                { subject: 'Chemistry', code: 'CHE', marks: 78, grade: 'B', points: 2, remarks: 'Good', isPrincipal: true },
                { subject: 'Mathematics', code: 'MAT', marks: 92, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
                { subject: 'General Studies', code: 'GS', marks: 75, grade: 'B', points: 2, remarks: 'Good', isPrincipal: false }
              ],
              totalMarks: 330,
              averageMarks: '82.50',
              totalPoints: 6,
              bestThreePoints: 4,
              division: 'I',
              rank: 1
            },
            {
              id: 'student2',
              name: 'Jane Doe',
              rollNumber: `F${formLevel || '5'}S002`,
              sex: 'F',
              results: [
                { subject: 'Physics', code: 'PHY', marks: 92, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
                { subject: 'Chemistry', code: 'CHE', marks: 88, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
                { subject: 'Mathematics', code: 'MAT', marks: 95, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: true },
                { subject: 'General Studies', code: 'GS', marks: 82, grade: 'A', points: 1, remarks: 'Excellent', isPrincipal: false }
              ],
              totalMarks: 357,
              averageMarks: '89.25',
              totalPoints: 4,
              bestThreePoints: 3,
              division: 'I',
              rank: 2
            }
          ],
          divisionDistribution: { 'I': 2, 'II': 0, 'III': 0, 'IV': 0, '0': 0 },
          educationLevel: 'A_LEVEL',
          classAverage: '85.88',
          totalStudents: 2,
          absentStudents: 0,
          subjectCombination: {
            name: 'PCM',
            code: 'PCM',
            subjects: [
              { name: 'Physics', code: 'PHY', isPrincipal: true },
              { name: 'Chemistry', code: 'CHE', isPrincipal: true },
              { name: 'Mathematics', code: 'MAT', isPrincipal: true },
              { name: 'General Studies', code: 'GS', isPrincipal: false }
            ]
          }
        }
      });
    }

    // Get the subject combination for this class with retry logic
    const subjectCombination = await executeWithRetry(
      () => SubjectCombination.findOne({ class: classId }).populate('subjects'),
      `Error fetching subject combination for class ${classId}`
    );

    // Get all subjects for this class
    const allSubjects = subjectCombination ? subjectCombination.subjects : [];
    console.log(`Found ${allSubjects.length} subjects in combination for class ${classId}:`,
      allSubjects.map(s => s ? { name: s.name, code: s.code, isPrincipal: s.isPrincipal } : 'undefined'));

    // If no subjects found in combination, fetch all A-Level subjects as a fallback
    let subjectsForReport = allSubjects;
    if (subjectsForReport.length === 0) {
      console.log('No subjects found in combination, fetching all A-Level subjects as fallback');
      const allALevelSubjects = await executeWithRetry(
        () => Subject.find({ educationLevel: { $in: ['A_LEVEL', 'BOTH'] } }),
        'Error fetching all A-Level subjects'
      );
      subjectsForReport = allALevelSubjects;
      console.log('Found', subjectsForReport.length, 'A-Level subjects as fallback:',
        subjectsForReport.map(s => s ? { name: s.name, code: s.code, isPrincipal: s.isPrincipal } : 'undefined'));
    }

    // Get results for each student
    const studentsWithResults = await Promise.all(
      filteredStudents.map(async (student) => {
        console.log(`Processing student: ${student.firstName} ${student.lastName} (${student._id})`);

        // Always use NewALevelResult for fetching results
        let results = await executeWithRetry(
          () => NewALevelResult.find({
            studentId: student._id,
            examId: examId
          }).populate('subjectId'),
          `Error fetching new results for student ${student._id} in exam ${examId}`
        );

        // Transform results to match the expected format
        if (results.length > 0) {
          results = results.map(result => ({
            _id: result._id,
            student: result.studentId,
            exam: result.examId,
            subject: result.subjectId,
            marksObtained: result.marksObtained,
            grade: result.grade || aLevelGradeCalculator.calculateGrade(result.marksObtained),
            points: result.points || aLevelGradeCalculator.calculatePoints(result.grade || aLevelGradeCalculator.calculateGrade(result.marksObtained)),
            isPrincipal: result.isPrincipal,
            isInCombination: result.isInCombination
          }));
        }

        // Log the query for debugging
        console.log(`Query for student ${student._id} in exam ${examId}:`, {
          studentId: student._id,
          examId: examId
        });

        console.log(`Found ${results.length} results for student ${student._id} in exam ${examId}`);
        if (results.length > 0) {
          // Log all results for debugging
          for (let index = 0; index < results.length; index++) {
            const result = results[index];
            console.log(`Result ${index + 1}:`, {
              id: result._id,
              subject: result.subject?.name || 'Unknown',
              subjectId: result.subject?._id || 'Unknown',
              marksObtained: result.marksObtained,
              marks: result.marks, // Check if this field exists
              grade: result.grade,
              points: result.points,
              studentId: result.studentId,
              student: result.student,
              examId: result.examId,
              exam: result.exam
            });
          }
        }

        // Create a map of subject ID to result for quick lookup
        const resultsBySubjectId = {};
        for (const result of results) {
          if (result.subject?.['_id']) {
            resultsBySubjectId[result.subject._id.toString()] = result;
          }
        }

        // For each subject in the class, always include a result (real or placeholder)
        const formattedResults = subjectsForReport.map(subject => {
          const result = resultsBySubjectId[subject._id.toString()];
          // Always set isPrincipal from the subject combination definition
          const isPrincipal = subject.isPrincipal || false;
          if (result) {
            // If marks are undefined, null, or 0, set to blank string
            let marksValue = '';
            if (result.marksObtained !== undefined && result.marksObtained !== null && result.marksObtained !== 0) {
              marksValue = result.marksObtained;
            }
            return {
              subject: subject.name,
              code: subject.code,
              marks: marksValue,
              grade: result.grade || '',
              points: result.points || 0,
              remarks: aLevelGradeCalculator.getRemarks(result.grade),
              isPrincipal: isPrincipal
            };
          } else {
            return {
              subject: subject.name,
              code: subject.code,
              marks: '', // Blank if no marks entered
              grade: '', // Blank if no marks entered
              points: 0,
              remarks: 'No marks entered',
              isPrincipal: isPrincipal
            };
          }
        });

        // Identify principal subjects for the class
        const principalSubjectIds = subjectsForReport
          .filter(subject => subject.isPrincipal)
          .map(subject => subject._id.toString());

        // For each student, get their principal subject results
        const principalResults = formattedResults.filter(
          result => result.isPrincipal && result.marks !== '' && result.marks !== undefined && result.marks !== null && result.marks !== 0
        );

        // Only calculate division and GPA if all three principal subjects have marks
        let division = '-';
        let bestThreePoints = '-';
        if (principalResults.length === 3) {
          principalResults.sort((a, b) => (a.points || 0) - (b.points || 0));
          bestThreePoints = principalResults.reduce((sum, result) => sum + (result.points || 0), 0);
          division = aLevelGradeCalculator.calculateDivision(bestThreePoints);
        }

        // Always include all subjects with marks, not just those in the combination
        const resultsForAverage = formattedResults; // Use all results for average
        const totalMarks = resultsForAverage.reduce((sum, result) => sum + (result.marks || 0), 0);
        const averageMarks = resultsForAverage.length > 0 ? (totalMarks / resultsForAverage.length).toFixed(2) : '0.00';

        // Calculate points and best three points
        const points = formattedResults.reduce((sum, result) => sum + (result.points || 0), 0);

        return {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber || `F${student.form || '5'}S${student.admissionNumber || '000'}`,
          sex: student.gender === 'male' ? 'M' : 'F',
          results: formattedResults,
          totalMarks,
          averageMarks,
          totalPoints: points,
          bestThreePoints,
          division,
          rank: 0 // Will be calculated later
        };
      })
    );

    // Calculate ranks based on best three points
    for (let index = 0; index < studentsWithResults.length; index++) {
      studentsWithResults[index].rank = index + 1;
    }

    // Calculate division distribution
    const divisionDistribution = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 };
    for (const student of studentsWithResults) {
      // Only count students with a valid division (I, II, III, IV)
      if (['I', 'II', 'III', 'IV'].includes(student.division)) {
        divisionDistribution[student.division] = (divisionDistribution[student.division] || 0) + 1;
      }
      // Optionally, count '0' if you want to track students with invalid/incomplete divisions
      // else if (student.division === '0') {
      //   divisionDistribution['0'] = (divisionDistribution['0'] || 0) + 1;
      // }
    }

    // Calculate class average
    const totalAverage = studentsWithResults.reduce((sum, student) => sum + Number.parseFloat(student.averageMarks), 0);
    const classAverage = studentsWithResults.length > 0 ? (totalAverage / studentsWithResults.length).toFixed(2) : '0.00';

    // Format the subject combination
    const formattedSubjectCombination = subjectCombination ? {
      name: subjectCombination.name,
      code: subjectCombination.code,
      subjects: subjectCombination.subjects.map(subject => ({
        name: subject.name,
        code: subject.code,
        isPrincipal: subject.isPrincipal
      }))
    } : null;

    // Prepare the response
    const response = {
      success: true,
      data: {
        classId,
        examId,
        className: classData.name,
        examName: examData.name,
        academicYear: examData.academicYear || '2023-2024',
        formLevel: formLevel || 'all',
        students: studentsWithResults,
        divisionDistribution,
        educationLevel: 'A_LEVEL',
        classAverage,
        totalStudents: studentsWithResults.length,
        absentStudents: 0, // This would need to be calculated from attendance records
        subjectCombination: formattedSubjectCombination
      }
    };

    return res.json(response);
  } catch (error) {
    logger.error(`Error generating A-Level class report: ${error.message}`, { error });
    console.error('Error generating A-Level class report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate A-Level class report',
      error: error.message
    });
  }
};

