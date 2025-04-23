/**
 * Prisma O-Level Results Service
 * 
 * This service handles O-Level results-related operations using Prisma.
 */

const prisma = require('../../lib/prisma');
const logger = require('../../utils/logger');
const { calculateGrade, calculatePoints, calculateDivision } = require('../../utils/gradeUtils');

/**
 * Save O-Level marks for a student
 * @param {Object} params - Parameters
 * @param {string} params.studentId - Student ID
 * @param {string} params.classId - Class ID
 * @param {string} params.subjectId - Subject ID
 * @param {string} params.examId - Exam ID
 * @param {number} params.marks - Marks (0-100)
 * @param {string} params.enteredBy - User ID of the person entering the marks
 * @param {string} params.comments - Optional comments
 * @returns {Promise<Object>} - Result of the operation
 */
async function saveMarks({ studentId, classId, subjectId, examId, marks, enteredBy, comments }) {
  try {
    logger.info(`[PrismaOLevelResultsService] Saving marks for student ${studentId}, subject ${subjectId}, exam ${examId}`);
    
    // Validate required fields
    if (!studentId || !classId || !subjectId || !examId || marks === undefined || !enteredBy) {
      return {
        success: false,
        message: 'Missing required fields: studentId, classId, subjectId, examId, marks, enteredBy'
      };
    }
    
    // Validate marks range
    if (marks < 0 || marks > 100) {
      return {
        success: false,
        message: 'Marks must be between 0 and 100'
      };
    }
    
    // Calculate grade and points based on marks
    const grade = calculateGrade(marks);
    const points = calculatePoints(grade);
    
    // Check if result already exists for this student, subject, and exam
    const existingResult = await prisma.result.findFirst({
      where: {
        studentId,
        subjectId,
        examId
      }
    });
    
    let result;
    
    if (existingResult) {
      // Update existing result
      result = await prisma.result.update({
        where: { id: existingResult.id },
        data: {
          marksObtained: marks,
          grade,
          points,
          comments,
          updatedBy: enteredBy,
          updatedAt: new Date()
        }
      });
      
      logger.info(`[PrismaOLevelResultsService] Updated marks for student ${studentId}: ${marks}`);
    } else {
      // Create new result
      result = await prisma.result.create({
        data: {
          studentId,
          classId,
          subjectId,
          examId,
          marksObtained: marks,
          grade,
          points,
          comments,
          enteredBy,
          updatedBy: enteredBy
        }
      });
      
      logger.info(`[PrismaOLevelResultsService] Created new marks for student ${studentId}: ${marks}`);
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error(`[PrismaOLevelResultsService] Error saving marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error saving marks: ${error.message}`,
      error
    };
  }
}

/**
 * Save marks for multiple students
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.subjectId - Subject ID
 * @param {string} params.examId - Exam ID
 * @param {Array} params.studentMarks - Array of student marks objects
 * @param {string} params.enteredBy - User ID of the person entering the marks
 * @returns {Promise<Object>} - Result of the operation
 */
async function saveBulkMarks({ classId, subjectId, examId, studentMarks, enteredBy }) {
  try {
    logger.info(`[PrismaOLevelResultsService] Saving bulk marks for class ${classId}, subject ${subjectId}, exam ${examId}`);
    
    // Validate required fields
    if (!classId || !subjectId || !examId || !studentMarks || !Array.isArray(studentMarks) || !enteredBy) {
      return {
        success: false,
        message: 'Missing required fields: classId, subjectId, examId, studentMarks, enteredBy'
      };
    }
    
    const results = [];
    const errors = [];
    
    // Process each student's marks
    for (const studentMark of studentMarks) {
      const { studentId, marks, comments } = studentMark;
      
      if (!studentId || marks === undefined) {
        errors.push({
          studentId,
          error: 'Missing studentId or marks'
        });
        continue;
      }
      
      const result = await saveMarks({
        studentId,
        classId,
        subjectId,
        examId,
        marks,
        enteredBy,
        comments
      });
      
      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({
          studentId,
          error: result.message
        });
      }
    }
    
    return {
      success: errors.length === 0,
      message: `Saved marks for ${results.length} students, failed for ${errors.length} students`,
      data: {
        results,
        errors
      }
    };
  } catch (error) {
    logger.error(`[PrismaOLevelResultsService] Error saving bulk marks: ${error.message}`, error);
    return {
      success: false,
      message: `Error saving bulk marks: ${error.message}`,
      error
    };
  }
}

/**
 * Get O-Level results for a student in an exam
 * @param {Object} params - Parameters
 * @param {string} params.studentId - Student ID
 * @param {string} params.examId - Exam ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function getStudentResults({ studentId, examId }) {
  try {
    logger.info(`[PrismaOLevelResultsService] Getting results for student ${studentId}, exam ${examId}`);
    
    // Validate required fields
    if (!studentId || !examId) {
      return {
        success: false,
        message: 'Missing required fields: studentId, examId'
      };
    }
    
    // Get student details
    const student = await prisma.student.findUnique({
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
      return {
        success: false,
        message: `Student with ID ${studentId} not found`
      };
    }
    
    // Verify student is O-Level
    if (student.educationLevel !== 'O_LEVEL') {
      return {
        success: false,
        message: `Student is not an O-Level student`
      };
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
    
    // Calculate division if we have enough subjects
    let division = null;
    let totalPoints = null;
    let bestSubjects = [];
    
    if (results.length >= 7) {
      // Sort results by points (ascending)
      const sortedResults = [...results].sort((a, b) => a.points - b.points);
      
      // Take the best 7 subjects (lowest points)
      bestSubjects = sortedResults.slice(0, 7);
      
      // Calculate total points
      totalPoints = bestSubjects.reduce((sum, result) => sum + result.points, 0);
      
      // Determine division
      division = calculateDivision(totalPoints);
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
        missingSubjects: results.length < 7 ? 7 - results.length : 0
      }
    };
  } catch (error) {
    logger.error(`[PrismaOLevelResultsService] Error getting student results: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting student results: ${error.message}`,
      error
    };
  }
}

/**
 * Get O-Level class results for an exam
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.examId - Exam ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function getClassResults({ classId, examId }) {
  try {
    logger.info(`[PrismaOLevelResultsService] Getting class results for class ${classId}, exam ${examId}`);
    
    // Validate required fields
    if (!classId || !examId) {
      return {
        success: false,
        message: 'Missing required fields: classId, examId'
      };
    }
    
    // Get class details
    const classObj = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        academicYearId: true,
        educationLevel: true
      }
    });
    
    if (!classObj) {
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }
    
    // Verify class is O-Level
    if (classObj.educationLevel !== 'O_LEVEL') {
      return {
        success: false,
        message: `Class is not an O-Level class`
      };
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
    
    // Get all subjects for this class
    const classSubjects = await prisma.classSubject.findMany({
      where: { classId },
      include: {
        subject: true
      }
    });
    
    const subjects = classSubjects.map(cs => cs.subject);
    
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
    
    // Process results for each student
    const studentResults = await Promise.all(students.map(async (student) => {
      // Get results for this student
      const studentResults = results.filter(result => result.studentId === student.id);
      
      // Calculate division
      let division = null;
      let totalPoints = null;
      let bestSubjects = [];
      
      if (studentResults.length >= 7) {
        // Sort results by points (ascending)
        const sortedResults = [...studentResults].sort((a, b) => a.points - b.points);
        
        // Take the best 7 subjects (lowest points)
        bestSubjects = sortedResults.slice(0, 7);
        
        // Calculate total points
        totalPoints = bestSubjects.reduce((sum, result) => sum + result.points, 0);
        
        // Determine division
        division = calculateDivision(totalPoints);
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
        missingSubjects: studentResults.length < 7 ? 7 - studentResults.length : 0
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
    logger.error(`[PrismaOLevelResultsService] Error getting class results: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting class results: ${error.message}`,
      error
    };
  }
}

/**
 * Generate O-Level result report for a student
 * @param {Object} params - Parameters
 * @param {string} params.studentId - Student ID
 * @param {string} params.examId - Exam ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function generateStudentReport({ studentId, examId }) {
  try {
    logger.info(`[PrismaOLevelResultsService] Generating report for student ${studentId}, exam ${examId}`);
    
    // Get student results
    const resultsResponse = await getStudentResults({ studentId, examId });
    
    if (!resultsResponse.success) {
      return resultsResponse;
    }
    
    const { student, exam, results, division, totalPoints, bestSubjects, averageMarks } = resultsResponse.data;
    
    // Get class results for ranking
    const classResultsResponse = await getClassResults({ classId: student.classId, examId });
    
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
      comments: result.comments || ''
    }));
    
    // Generate report
    const report = {
      school: {
        name: school ? school.name : 'School Name',
        address: school ? school.address : 'School Address',
        logo: school ? school.logoUrl : null
      },
      student: {
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
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
    logger.error(`[PrismaOLevelResultsService] Error generating student report: ${error.message}`, error);
    return {
      success: false,
      message: `Error generating student report: ${error.message}`,
      error
    };
  }
}

/**
 * Generate O-Level class result report
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.examId - Exam ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function generateClassReport({ classId, examId }) {
  try {
    logger.info(`[PrismaOLevelResultsService] Generating class report for class ${classId}, exam ${examId}`);
    
    // Get class results
    const classResultsResponse = await getClassResults({ classId, examId });
    
    if (!classResultsResponse.success) {
      return classResultsResponse;
    }
    
    const { class: classObj, exam, students, divisionStats, subjectStats } = classResultsResponse.data;
    
    // Get school information
    const school = await prisma.school.findFirst();
    
    // Get academic year
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: classObj.academicYearId }
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
        name: classObj.name,
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
    logger.error(`[PrismaOLevelResultsService] Error generating class report: ${error.message}`, error);
    return {
      success: false,
      message: `Error generating class report: ${error.message}`,
      error
    };
  }
}

module.exports = {
  saveMarks,
  saveBulkMarks,
  getStudentResults,
  getClassResults,
  generateStudentReport,
  generateClassReport
};
