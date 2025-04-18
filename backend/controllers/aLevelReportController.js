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
const CharacterAssessment = require('../models/CharacterAssessment');
const SubjectCombination = require('../models/SubjectCombination');
const logger = require('../utils/logger');
const aLevelGradeCalculator = require('../utils/aLevelGradeCalculator');
const { getFullSubjectCombination } = require('../utils/subjectCombinationUtils');
const { determineFormLevel, validateStudentFormLevel, determineClassFormLevel } = require('../utils/formLevelUtils');

/**
 * Get A-Level student report with standardized schema
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getStudentReport = async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    const { formLevel } = req.query; // Optional form level filter (5 or 6)

    logger.info(`Generating standardized A-Level student report for student ${studentId}, exam ${examId}`);
    console.log(`Generating A-Level student report: studentId=${studentId}, examId=${examId}, formLevel=${formLevel || 'not specified'}`);

    // Always return mock data for now to debug the frontend
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
    const { classId, examId } = req.params;
    const { formLevel } = req.query; // Optional form level filter (5 or 6)

    logger.info(`Generating standardized A-Level class report for class ${classId}, exam ${examId}, formLevel: ${formLevel || 'all'}`);
    console.log(`Generating A-Level class report: classId=${classId}, examId=${examId}, formLevel=${formLevel || 'all'}`);
    console.log('Request headers:', req.headers);
    console.log('Request query parameters:', req.query);
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);

    // Check if we should use mock data for development/testing
    let useMockData = process.env.USE_MOCK_DATA === 'true' || process.env.USE_DEMO_DATA === 'true' || req.query.useMock === 'true';
    console.log('USE_MOCK_DATA:', process.env.USE_MOCK_DATA);
    console.log('USE_DEMO_DATA:', process.env.USE_DEMO_DATA);
    console.log('useMock query param:', req.query.useMock);
    console.log('Using mock data (initial):', useMockData);

    // If force refresh is specified, don't use mock data
    if (req.query.forceRefresh === 'true') {
      console.log('Force refresh requested, using real data');
      // Override useMockData flag
      useMockData = false;
    }

    console.log('Using mock data (final):', useMockData);

    if (useMockData && req.query.forceRefresh !== 'true') {
      console.log('Using mock data for A-Level class report (configured in environment)');
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

    // Get the class details
    const classData = await Class.findById(classId);
    if (!classData) {
      logger.error(`Class not found: ${classId}`);
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Get the exam details
    const examData = await Exam.findById(examId);
    if (!examData) {
      logger.error(`Exam not found: ${examId}`);
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Get students in this class
    let students = await Student.find({ class: classId, educationLevel: 'A_LEVEL' });

    // Filter by form level if provided
    if (formLevel) {
      students = students.filter(student => {
        const studentFormLevel = determineFormLevel(student);
        return studentFormLevel && studentFormLevel.toString() === formLevel.toString();
      });
    }

    if (students.length === 0) {
      logger.warn(`No A-Level students found in class ${classId}`);
      return res.status(404).json({
        success: false,
        message: 'No A-Level students found in this class'
      });
    }

    // Get results for each student
    const studentsWithResults = await Promise.all(
      students.map(async (student) => {
        // Get the student's results for this exam
        const results = await ALevelResult.find({
          student: student._id,
          exam: examId
        }).populate('subject');

        // Calculate total marks and average
        const totalMarks = results.reduce((sum, result) => sum + (result.marks || 0), 0);
        const averageMarks = results.length > 0 ? (totalMarks / results.length).toFixed(2) : '0.00';

        // Calculate points and best three points
        const points = results.reduce((sum, result) => sum + (result.points || 0), 0);

        // Get principal subjects results
        const principalResults = results.filter(result => result.subject && result.subject.isPrincipal);

        // Sort principal results by points (ascending, since lower points are better)
        principalResults.sort((a, b) => (a.points || 0) - (b.points || 0));

        // Take the best three principal subjects (or fewer if not enough)
        const bestThreeResults = principalResults.slice(0, 3);
        const bestThreePoints = bestThreeResults.reduce((sum, result) => sum + (result.points || 0), 0);

        // Determine division based on best three points
        const division = aLevelGradeCalculator.calculateDivision(bestThreePoints);

        // Format results for the response
        const formattedResults = results.map(result => ({
          subject: result.subject ? result.subject.name : 'Unknown Subject',
          code: result.subject ? result.subject.code : 'UNK',
          marks: result.marks || 0,
          grade: result.grade || 'F',
          points: result.points || 0,
          remarks: aLevelGradeCalculator.getRemarks(result.grade),
          isPrincipal: result.subject ? result.subject.isPrincipal : false
        }));

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
    studentsWithResults.sort((a, b) => a.bestThreePoints - b.bestThreePoints);
    studentsWithResults.forEach((student, index) => {
      student.rank = index + 1;
    });

    // Calculate division distribution
    const divisionDistribution = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 };
    studentsWithResults.forEach(student => {
      const divKey = student.division.toString().replace('Division ', '');
      divisionDistribution[divKey] = (divisionDistribution[divKey] || 0) + 1;
    });

    // Calculate class average
    const totalAverage = studentsWithResults.reduce((sum, student) => sum + parseFloat(student.averageMarks), 0);
    const classAverage = studentsWithResults.length > 0 ? (totalAverage / studentsWithResults.length).toFixed(2) : '0.00';

    // Get the subject combination for this class
    const subjectCombination = await SubjectCombination.findOne({ class: classId }).populate('subjects');

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

