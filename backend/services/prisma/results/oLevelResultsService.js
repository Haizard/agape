/**
 * Prisma O-Level Results Service
 *
 * This service handles O-Level results-related operations using Prisma.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');
const gradeCalculator = require('../../../utils/unifiedGradeCalculator');

/**
 * Get O-Level results for a student in an exam
 * @param {Object} params - Parameters
 * @param {string} params.studentId - Student ID
 * @param {string} params.examId - Exam ID
 * @param {Object} params.student - Student object (optional)
 * @returns {Promise<Object>} - Result of the operation
 */
async function getOLevelStudentResults({ studentId, examId, student = null }) {
  try {
    logger.info(`[PrismaOLevelResultsService] Getting O-Level results for student ${studentId}, exam ${examId}`);

    // If student object is not provided, fetch it
    if (!student) {
      student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          admissionNumber: true,
          firstName: true,
          lastName: true,
          classId: true,
          educationLevel: true
        }
      });

      if (!student) {
        logger.warn(`[PrismaOLevelResultsService] Student with ID ${studentId} not found`);
        return {
          success: false,
          message: `Student with ID ${studentId} not found`
        };
      }

      // Verify student is O-Level
      if (student.educationLevel !== 'O_LEVEL') {
        logger.warn(`[PrismaOLevelResultsService] Student is not an O-Level student`);
        return {
          success: false,
          message: `Student is not an O-Level student`
        };
      }
    }

    // Get exam details
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        name: true,
        type: true,
        term: true,
        academicYearId: true
      }
    });

    if (!exam) {
      logger.warn(`[PrismaOLevelResultsService] Exam with ID ${examId} not found`);
      return {
        success: false,
        message: `Exam with ID ${examId} not found`
      };
    }

    // Get all results for the student in this exam
    const results = await prisma.result.findMany({
      where: {
        studentId,
        examId
      },
      include: {
        subject: true
      },
      orderBy: {
        subject: {
          name: 'asc'
        }
      }
    });

    logger.info(`[PrismaOLevelResultsService] Found ${results.length} results for student ${studentId} in exam ${examId}`);

    // Calculate division using the enhanced calculator
    const divisionResult = gradeCalculator.calculateOLevelBestSevenAndDivision(results);

    // Extract values from the division result
    const {
      bestSevenResults: bestSubjects,
      bestSevenPoints: totalPoints,
      division,
      warning,
      validationResult,
      missingSubjects,
      missingCoreSubjects
    } = divisionResult;

    // Log the division calculation
    logger.info(`[PrismaOLevelResultsService] Calculated division for student ${studentId}: ${division} (${totalPoints} points)`);

    // Log any warnings
    if (warning) {
      logger.warn(`[PrismaOLevelResultsService] ${warning}`);
    }

    // Log validation results
    if (validationResult && !validationResult.isValid) {
      logger.warn(`[PrismaOLevelResultsService] ${validationResult.message}`);
    }

    // Calculate average marks
    const totalMarks = results.reduce((sum, result) => sum + result.marksObtained, 0);
    const averageMarks = results.length > 0 ? totalMarks / results.length : 0;

    return {
      success: true,
      data: {
        student,
        exam,
        results,
        totalSubjects: results.length,
        division,
        totalPoints,
        bestSubjects,
        averageMarks: Math.round(averageMarks * 10) / 10, // Round to 1 decimal place
        missingSubjects: missingSubjects || (results.length < 7 ? 7 - results.length : 0),
        missingCoreSubjects,
        validationWarning: warning,
        hasEnoughSubjects: results.length >= 7
      }
    };
  } catch (error) {
    logger.error(`[PrismaOLevelResultsService] Error getting O-Level student results: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting O-Level student results: ${error.message}`,
      error
    };
  }
}

/**
 * Get O-Level class results for an exam
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.examId - Exam ID
 * @param {Object} params.classObj - Class object (optional)
 * @returns {Promise<Object>} - Result of the operation
 */
async function getOLevelClassResults({ classId, examId, classObj = null }) {
  try {
    logger.info(`[PrismaOLevelResultsService] Getting O-Level class results for class ${classId}, exam ${examId}`);

    // If class object is not provided, fetch it
    if (!classObj) {
      classObj = await prisma.class.findUnique({
        where: { id: classId },
        select: {
          id: true,
          name: true,
          academicYearId: true,
          educationLevel: true
        }
      });

      if (!classObj) {
        logger.warn(`[PrismaOLevelResultsService] Class with ID ${classId} not found`);
        return {
          success: false,
          message: `Class with ID ${classId} not found`
        };
      }

      // Verify class is O-Level
      if (classObj.educationLevel !== 'O_LEVEL') {
        logger.warn(`[PrismaOLevelResultsService] Class is not an O-Level class`);
        return {
          success: false,
          message: `Class is not an O-Level class`
        };
      }
    }

    // Get exam details
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        name: true,
        type: true,
        term: true
      }
    });

    if (!exam) {
      logger.warn(`[PrismaOLevelResultsService] Exam with ID ${examId} not found`);
      return {
        success: false,
        message: `Exam with ID ${examId} not found`
      };
    }

    // Get all O-Level students in the class
    const students = await prisma.student.findMany({
      where: {
        classId,
        educationLevel: 'O_LEVEL'
      },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        lastName: true
      }
    });

    logger.info(`[PrismaOLevelResultsService] Found ${students.length} O-Level students in class ${classId}`);

    // Get all subjects for this class
    const classSubjects = await prisma.classSubject.findMany({
      where: { classId },
      include: {
        subject: true
      }
    });

    const subjects = classSubjects.map(cs => cs.subject);

    logger.info(`[PrismaOLevelResultsService] Found ${subjects.length} subjects for class ${classId}`);

    // Get all results for this class and exam
    const results = await prisma.result.findMany({
      where: {
        classId,
        examId,
        student: {
          educationLevel: 'O_LEVEL'
        }
      },
      include: {
        subject: true,
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    logger.info(`[PrismaOLevelResultsService] Found ${results.length} results for class ${classId} in exam ${examId}`);

    // Process results for each student
    const studentResults = await Promise.all(students.map(async (student) => {
      // Get results for this student
      const studentResults = results.filter(result => result.studentId === student.id);

      // Calculate division using the enhanced calculator
      const divisionResult = gradeCalculator.calculateOLevelBestSevenAndDivision(studentResults);

      // Extract values from the division result
      const {
        bestSevenResults: bestSubjects,
        bestSevenPoints: totalPoints,
        division,
        warning,
        validationResult,
        missingSubjects,
        missingCoreSubjects,
        hasEnoughSubjects
      } = divisionResult;

      // Log any warnings
      if (warning) {
        logger.warn(`[PrismaOLevelResultsService] Student ${student.id}: ${warning}`);
      }

      // Log validation results
      if (validationResult && !validationResult.isValid) {
        logger.warn(`[PrismaOLevelResultsService] Student ${student.id}: ${validationResult.message}`);
      }

      // Calculate average marks
      const totalMarks = studentResults.reduce((sum, result) => sum + result.marksObtained, 0);
      const averageMarks = studentResults.length > 0 ? totalMarks / studentResults.length : 0;

      return {
        student,
        results: studentResults,
        totalSubjects: studentResults.length,
        division,
        totalPoints,
        bestSubjects,
        averageMarks: Math.round(averageMarks * 10) / 10, // Round to 1 decimal place
        missingSubjects: missingSubjects || (studentResults.length < 7 ? 7 - studentResults.length : 0),
        missingCoreSubjects,
        validationWarning: warning,
        hasEnoughSubjects
      };
    }));

    // Sort students by division and total points
    const sortedResults = [...studentResults].sort((a, b) => {
      // First sort by division (I, II, III, IV, 0)
      if (a.division !== b.division) {
        if (!a.division) return 1;
        if (!b.division) return -1;

        const divisionOrder = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, '0': 5 };
        return divisionOrder[a.division] - divisionOrder[b.division];
      }

      // Then sort by total points (ascending)
      if (a.totalPoints !== b.totalPoints) {
        if (a.totalPoints === null) return 1;
        if (b.totalPoints === null) return -1;
        return a.totalPoints - b.totalPoints;
      }

      // Finally sort by average marks (descending)
      return b.averageMarks - a.averageMarks;
    });

    // Add position to each student
    const rankedResults = sortedResults.map((result, index) => ({
      ...result,
      position: index + 1
    }));

    // Calculate division statistics
    const divisionStats = {
      'I': rankedResults.filter(r => r.division === 'I').length,
      'II': rankedResults.filter(r => r.division === 'II').length,
      'III': rankedResults.filter(r => r.division === 'III').length,
      'IV': rankedResults.filter(r => r.division === 'IV').length,
      '0': rankedResults.filter(r => r.division === '0').length,
      'N/A': rankedResults.filter(r => r.division === null).length
    };

    // Calculate subject statistics
    const subjectStats = subjects.map(subject => {
      const subjectResults = results.filter(result => result.subjectId === subject.id);

      const totalMarks = subjectResults.reduce((sum, result) => sum + result.marksObtained, 0);
      const averageMarks = subjectResults.length > 0 ? totalMarks / subjectResults.length : 0;

      const gradeDistribution = {
        'A': subjectResults.filter(result => result.grade === 'A').length,
        'B': subjectResults.filter(result => result.grade === 'B').length,
        'C': subjectResults.filter(result => result.grade === 'C').length,
        'D': subjectResults.filter(result => result.grade === 'D').length,
        'E': subjectResults.filter(result => result.grade === 'E').length,
        'F': subjectResults.filter(result => result.grade === 'F').length
      };

      return {
        subject,
        totalStudents: subjectResults.length,
        averageMarks: Math.round(averageMarks * 10) / 10,
        gradeDistribution
      };
    });

    return {
      success: true,
      data: {
        class: classObj,
        exam,
        subjects,
        students: rankedResults,
        totalStudents: students.length,
        divisionStats,
        subjectStats,
        timestamp: new Date()
      }
    };
  } catch (error) {
    logger.error(`[PrismaOLevelResultsService] Error getting O-Level class results: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting O-Level class results: ${error.message}`,
      error
    };
  }
}

/**
 * Generate O-Level student report
 * @param {Object} params - Parameters
 * @param {string} params.studentId - Student ID
 * @param {string} params.examId - Exam ID
 * @param {Object} params.student - Student object (optional)
 * @returns {Promise<Object>} - Result of the operation
 */
async function generateOLevelStudentReport({ studentId, examId, student = null }) {
  try {
    logger.info(`[PrismaOLevelResultsService] Generating O-Level report for student ${studentId}, exam ${examId}`);

    // Get student results
    const resultsResponse = await getOLevelStudentResults({ studentId, examId, student });

    if (!resultsResponse.success) {
      return resultsResponse;
    }

    const { student: studentData, exam, results, division, totalPoints, bestSubjects, averageMarks } = resultsResponse.data;

    // Get class results for ranking
    const classResultsResponse = await getOLevelClassResults({ classId: studentData.classId, examId });

    if (!classResultsResponse.success) {
      return classResultsResponse;
    }

    // Find student's position in class
    const studentRanking = classResultsResponse.data.students.find(s => s.student.id === studentId);
    const position = studentRanking ? studentRanking.position : null;
    const totalStudents = classResultsResponse.data.totalStudents;

    // Get school information
    const school = await prisma.school.findFirst();

    // Get academic year
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: exam.academicYearId }
    });

    // Format results for report
    const formattedResults = results.map(result => ({
      subject: result.subject.name,
      code: result.subject.code,
      marks: result.marksObtained,
      grade: result.grade,
      points: result.points,
      comments: result.comment || ''
    }));

    // Generate report
    const report = {
      school: {
        name: school ? school.name : 'School Name',
        address: school ? school.address : 'School Address',
        logo: school ? school.logoUrl : null
      },
      student: {
        name: `${studentData.firstName} ${studentData.lastName}`,
        admissionNumber: studentData.admissionNumber,
        class: classResultsResponse.data.class.name
      },
      exam: {
        name: exam.name,
        term: exam.term,
        academicYear: academicYear ? academicYear.name : 'Unknown'
      },
      results: formattedResults,
      summary: {
        totalSubjects: results.length,
        averageMarks,
        division,
        totalPoints,
        position,
        totalStudents,
        bestSubjects: bestSubjects.map(result => ({
          subject: result.subject.name,
          grade: result.grade,
          points: result.points
        }))
      },
      generatedAt: new Date()
    };

    return {
      success: true,
      data: report
    };
  } catch (error) {
    logger.error(`[PrismaOLevelResultsService] Error generating O-Level student report: ${error.message}`, error);
    return {
      success: false,
      message: `Error generating O-Level student report: ${error.message}`,
      error
    };
  }
}

/**
 * Generate O-Level class report
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.examId - Exam ID
 * @param {Object} params.classObj - Class object (optional)
 * @returns {Promise<Object>} - Result of the operation
 */
async function generateOLevelClassReport({ classId, examId, classObj = null }) {
  try {
    logger.info(`[PrismaOLevelResultsService] Generating O-Level class report for class ${classId}, exam ${examId}`);

    // Get class results
    const classResultsResponse = await getOLevelClassResults({ classId, examId, classObj });

    if (!classResultsResponse.success) {
      return classResultsResponse;
    }

    const { class: classData, exam, students, divisionStats, subjectStats } = classResultsResponse.data;

    // Get school information
    const school = await prisma.school.findFirst();

    // Get academic year
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: classData.academicYearId }
    });

    // Format student results for report
    const formattedStudents = students.map(student => ({
      name: `${student.student.firstName} ${student.student.lastName}`,
      admissionNumber: student.student.admissionNumber,
      totalSubjects: student.totalSubjects,
      averageMarks: student.averageMarks,
      division: student.division || 'N/A',
      totalPoints: student.totalPoints || 'N/A',
      position: student.position,
      missingSubjects: student.missingSubjects
    }));

    // Format subject statistics for report
    const formattedSubjectStats = subjectStats.map(stat => ({
      name: stat.subject.name,
      code: stat.subject.code,
      totalStudents: stat.totalStudents,
      averageMarks: stat.averageMarks,
      gradeDistribution: stat.gradeDistribution
    }));

    // Generate report
    const report = {
      school: {
        name: school ? school.name : 'School Name',
        address: school ? school.address : 'School Address',
        logo: school ? school.logoUrl : null
      },
      class: {
        name: classData.name,
        academicYear: academicYear ? academicYear.name : 'Unknown'
      },
      exam: {
        name: exam.name,
        term: exam.term
      },
      students: formattedStudents,
      summary: {
        totalStudents: students.length,
        divisionStats,
        subjectStats: formattedSubjectStats
      },
      generatedAt: new Date()
    };

    return {
      success: true,
      data: report
    };
  } catch (error) {
    logger.error(`[PrismaOLevelResultsService] Error generating O-Level class report: ${error.message}`, error);
    return {
      success: false,
      message: `Error generating O-Level class report: ${error.message}`,
      error
    };
  }
}

module.exports = {
  getOLevelStudentResults,
  getOLevelClassResults,
  generateOLevelStudentReport,
  generateOLevelClassReport
};
