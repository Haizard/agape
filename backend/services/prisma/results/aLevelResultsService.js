/**
 * Prisma A-Level Results Service
 *
 * This service handles A-Level results-related operations using Prisma.
 */

const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');
const gradeCalculator = require('../../../utils/unifiedGradeCalculator');

/**
 * Get A-Level results for a student in an exam
 * @param {Object} params - Parameters
 * @param {string} params.studentId - Student ID
 * @param {string} params.examId - Exam ID
 * @param {Object} params.student - Student object (optional)
 * @returns {Promise<Object>} - Result of the operation
 */
async function getALevelStudentResults({ studentId, examId, student = null }) {
  try {
    logger.info(`[PrismaALevelResultsService] Getting A-Level results for student ${studentId}, exam ${examId}`);

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
          educationLevel: true,
          subjectCombinationId: true
        }
      });

      if (!student) {
        logger.warn(`[PrismaALevelResultsService] Student with ID ${studentId} not found`);
        return {
          success: false,
          message: `Student with ID ${studentId} not found`
        };
      }

      // Verify student is A-Level
      if (student.educationLevel !== 'A_LEVEL') {
        logger.warn(`[PrismaALevelResultsService] Student is not an A-Level student`);
        return {
          success: false,
          message: `Student is not an A-Level student`
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
      logger.warn(`[PrismaALevelResultsService] Exam with ID ${examId} not found`);
      return {
        success: false,
        message: `Exam with ID ${examId} not found`
      };
    }

    // Get all results for the student in this exam
    let results = await prisma.result.findMany({
      where: {
        studentId,
        examId
      },
      include: {
        subject: true
      },
      orderBy: [
        {
          isPrincipal: 'desc'
        },
        {
          subject: {
            name: 'asc'
          }
        }
      ]
    });

    // Check for and remove duplicate results (same subject)
    const subjectMap = new Map();
    const duplicates = [];

    // Identify duplicates
    for (const result of results) {
      const subjectId = result.subjectId;
      if (subjectMap.has(subjectId)) {
        // We have a duplicate
        duplicates.push({
          original: subjectMap.get(subjectId),
          duplicate: result
        });
      } else {
        subjectMap.set(subjectId, result);
      }
    }

    // Log and handle duplicates if found
    if (duplicates.length > 0) {
      logger.warn(`[PrismaALevelResultsService] Found ${duplicates.length} duplicate results for student ${studentId} in exam ${examId}`);

      // Keep only the most recent result for each subject
      for (const { original, duplicate } of duplicates) {
        // Determine which one to keep (the most recently updated one)
        const keepOriginal = original.updatedAt > duplicate.updatedAt;
        const toDelete = keepOriginal ? duplicate : original;

        // Delete the duplicate from the database
        try {
          await prisma.result.delete({
            where: { id: toDelete.id }
          });
          logger.info(`[PrismaALevelResultsService] Deleted duplicate result ${toDelete.id} for subject ${toDelete.subjectId}`);
        } catch (error) {
          logger.error(`[PrismaALevelResultsService] Error deleting duplicate result: ${error.message}`);
        }
      }

      // Refresh the results after removing duplicates
      results = await prisma.result.findMany({
        where: {
          studentId,
          examId
        },
        include: {
          subject: true
        },
        orderBy: [
          {
            isPrincipal: 'desc'
          },
          {
            subject: {
              name: 'asc'
            }
          }
        ]
      });
    }

    logger.info(`[PrismaALevelResultsService] Found ${results.length} results for student ${studentId} in exam ${examId}`);

    // Separate principal and subsidiary subjects
    const principalResults = results.filter(result => result.isPrincipal);
    const subsidiaryResults = results.filter(result => result.isSubsidiary);
    const otherResults = results.filter(result => !result.isPrincipal && !result.isSubsidiary);

    // Calculate points
    const principalPoints = principalResults.reduce((sum, result) => sum + result.points, 0);
    const subsidiaryPoints = subsidiaryResults.reduce((sum, result) => sum + result.points, 0);
    const totalPoints = principalPoints + subsidiaryPoints;

    // Calculate division if we have enough principal subjects
    let division = null;
    if (principalResults.length >= 3) {
      // Sort principal results by points (ascending)
      const sortedPrincipalResults = [...principalResults].sort((a, b) => a.points - b.points);

      // Take the best 3 principal subjects (lowest points)
      const bestPrincipalSubjects = sortedPrincipalResults.slice(0, 3);

      // Calculate total points for best 3 principal subjects
      const bestPrincipalPoints = bestPrincipalSubjects.reduce((sum, result) => sum + result.points, 0);

      // Determine division using the unified calculator
      division = gradeCalculator.calculateALevelDivision(bestPrincipalPoints);

      logger.info(`[PrismaALevelResultsService] Calculated division for student ${studentId}: ${division} (${bestPrincipalPoints} points from best 3 principal subjects)`);
    }

    // Validate the results
    const validationResult = gradeCalculator.validateSubjectsForDivision(results, gradeCalculator.EDUCATION_LEVELS.A_LEVEL);
    if (!validationResult.isValid) {
      logger.warn(`[PrismaALevelResultsService] ${validationResult.message}`);
    }

    // Calculate average marks
    const totalMarks = results.reduce((sum, result) => sum + result.marksObtained, 0);
    const averageMarks = results.length > 0 ? totalMarks / results.length : 0;

    // Get student's subject combination
    let combination = null;
    if (student.subjectCombinationId) {
      combination = await prisma.subjectCombination.findUnique({
        where: { id: student.subjectCombinationId },
        select: {
          id: true,
          name: true,
          code: true,
          subjects: {
            include: {
              subject: true
            }
          }
        }
      });
    }

    // Calculate missing subjects
    const missingPrincipalSubjects = [];
    const missingSubsidiarySubjects = [];

    if (combination) {
      // Find principal subjects in the combination that are missing from results
      const principalSubjectsInCombination = combination.subjects
        .filter(item => item.isPrincipal)
        .map(item => item.subject);

      const principalSubjectIdsInResults = principalResults.map(result => result.subjectId);

      for (const subject of principalSubjectsInCombination) {
        if (!principalSubjectIdsInResults.includes(subject.id)) {
          missingPrincipalSubjects.push(subject);
        }
      }

      // Find subsidiary subjects in the combination that are missing from results
      const subsidiarySubjectsInCombination = combination.subjects
        .filter(item => item.isSubsidiary)
        .map(item => item.subject);

      const subsidiarySubjectIdsInResults = subsidiaryResults.map(result => result.subjectId);

      for (const subject of subsidiarySubjectsInCombination) {
        if (!subsidiarySubjectIdsInResults.includes(subject.id)) {
          missingSubsidiarySubjects.push(subject);
        }
      }
    }

    // Get best principal subjects if available
    let bestPrincipalSubjects = [];
    if (principalResults.length >= 3) {
      // Sort principal results by points (ascending)
      const sortedPrincipalResults = [...principalResults].sort((a, b) => a.points - b.points);

      // Take the best 3 principal subjects (lowest points)
      bestPrincipalSubjects = sortedPrincipalResults.slice(0, 3);
    }

    return {
      success: true,
      data: {
        student,
        exam,
        results,
        principalResults,
        subsidiaryResults,
        otherResults,
        totalSubjects: results.length,
        principalPoints,
        subsidiaryPoints,
        totalPoints,
        division,
        bestPrincipalSubjects,
        averageMarks: Math.round(averageMarks * 10) / 10, // Round to 1 decimal place
        combination,
        missingPrincipalSubjects,
        missingSubsidiarySubjects,
        validationWarning: !validationResult.isValid ? validationResult.message : null
      }
    };
  } catch (error) {
    logger.error(`[PrismaALevelResultsService] Error getting A-Level student results: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting A-Level student results: ${error.message}`,
      error
    };
  }
}

/**
 * Get A-Level class results for an exam
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.examId - Exam ID
 * @param {Object} params.classObj - Class object (optional)
 * @returns {Promise<Object>} - Result of the operation
 */
async function getALevelClassResults({ classId, examId, classObj = null }) {
  try {
    logger.info(`[PrismaALevelResultsService] Getting A-Level class results for class ${classId}, exam ${examId}`);

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
        logger.warn(`[PrismaALevelResultsService] Class with ID ${classId} not found`);
        return {
          success: false,
          message: `Class with ID ${classId} not found`
        };
      }

      // Verify class is A-Level
      if (classObj.educationLevel !== 'A_LEVEL') {
        logger.warn(`[PrismaALevelResultsService] Class is not an A-Level class`);
        return {
          success: false,
          message: `Class is not an A-Level class`
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
      logger.warn(`[PrismaALevelResultsService] Exam with ID ${examId} not found`);
      return {
        success: false,
        message: `Exam with ID ${examId} not found`
      };
    }

    // Get all A-Level students in the class
    const students = await prisma.student.findMany({
      where: {
        classId,
        educationLevel: 'A_LEVEL'
      },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
        subjectCombinationId: true
      }
    });

    logger.info(`[PrismaALevelResultsService] Found ${students.length} A-Level students in class ${classId}`);

    // Get all subjects for this class
    const classSubjects = await prisma.classSubject.findMany({
      where: { classId },
      include: {
        subject: true
      }
    });

    const subjects = classSubjects.map(cs => cs.subject);

    logger.info(`[PrismaALevelResultsService] Found ${subjects.length} subjects for class ${classId}`);

    // Get all results for this class and exam
    let results = await prisma.result.findMany({
      where: {
        classId,
        examId,
        student: {
          educationLevel: 'A_LEVEL'
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

    // Check for and remove duplicate results (same student and subject)
    const studentSubjectMap = new Map();
    const duplicates = [];

    // Identify duplicates
    for (const result of results) {
      const key = `${result.studentId}_${result.subjectId}`;
      if (studentSubjectMap.has(key)) {
        // We have a duplicate
        duplicates.push({
          original: studentSubjectMap.get(key),
          duplicate: result
        });
      } else {
        studentSubjectMap.set(key, result);
      }
    }

    // Log and handle duplicates if found
    if (duplicates.length > 0) {
      logger.warn(`[PrismaALevelResultsService] Found ${duplicates.length} duplicate results for class ${classId} in exam ${examId}`);

      // Keep only the most recent result for each student-subject pair
      for (const { original, duplicate } of duplicates) {
        // Determine which one to keep (the most recently updated one)
        const keepOriginal = original.updatedAt > duplicate.updatedAt;
        const toDelete = keepOriginal ? duplicate : original;

        // Delete the duplicate from the database
        try {
          await prisma.result.delete({
            where: { id: toDelete.id }
          });
          logger.info(`[PrismaALevelResultsService] Deleted duplicate result ${toDelete.id} for student ${toDelete.studentId}, subject ${toDelete.subjectId}`);
        } catch (error) {
          logger.error(`[PrismaALevelResultsService] Error deleting duplicate result: ${error.message}`);
        }
      }

      // Refresh the results after removing duplicates
      results = await prisma.result.findMany({
        where: {
          classId,
          examId,
          student: {
            educationLevel: 'A_LEVEL'
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
    }

    logger.info(`[PrismaALevelResultsService] Found ${results.length} results for class ${classId} in exam ${examId}`);

    // Process results for each student
    const studentResults = await Promise.all(students.map(async (student) => {
      // Get results for this student
      const studentResults = results.filter(result => result.studentId === student.id);

      // Separate principal and subsidiary subjects
      const principalResults = studentResults.filter(result => result.isPrincipal);
      const subsidiaryResults = studentResults.filter(result => result.isSubsidiary);

      // Calculate points
      const principalPoints = principalResults.reduce((sum, result) => sum + result.points, 0);
      const subsidiaryPoints = subsidiaryResults.reduce((sum, result) => sum + result.points, 0);
      const totalPoints = principalPoints + subsidiaryPoints;

      // Calculate division if we have enough principal subjects
      let division = null;
      let bestPrincipalSubjects = [];

      if (principalResults.length >= 3) {
        // Sort principal results by points (ascending)
        const sortedPrincipalResults = [...principalResults].sort((a, b) => a.points - b.points);

        // Take the best 3 principal subjects (lowest points)
        bestPrincipalSubjects = sortedPrincipalResults.slice(0, 3);

        // Calculate total points for best 3 principal subjects
        const bestPrincipalPoints = bestPrincipalSubjects.reduce((sum, result) => sum + result.points, 0);

        // Determine division using the unified calculator
        division = gradeCalculator.calculateALevelDivision(bestPrincipalPoints);

        logger.info(`[PrismaALevelResultsService] Calculated division for student ${student.id}: ${division} (${bestPrincipalPoints} points from best 3 principal subjects)`);
      }

      // Validate the results
      const validationResult = gradeCalculator.validateSubjectsForDivision(studentResults, gradeCalculator.EDUCATION_LEVELS.A_LEVEL);
      if (!validationResult.isValid) {
        logger.warn(`[PrismaALevelResultsService] Student ${student.id}: ${validationResult.message}`);
      }

      // Calculate average marks
      const totalMarks = studentResults.reduce((sum, result) => sum + result.marksObtained, 0);
      const averageMarks = studentResults.length > 0 ? totalMarks / studentResults.length : 0;

      return {
        student,
        results: studentResults,
        principalResults,
        subsidiaryResults,
        totalSubjects: studentResults.length,
        principalPoints,
        subsidiaryPoints,
        totalPoints,
        division,
        bestPrincipalSubjects,
        averageMarks: Math.round(averageMarks * 10) / 10, // Round to 1 decimal place
        validationWarning: !validationResult.isValid ? validationResult.message : null,
        missingPrincipalSubjects: validationResult.missingPrincipalSubjects || 0,
        missingSubsidiarySubjects: validationResult.missingSubsidiarySubjects || 0
      };
    }));

    // Sort students by total points (ascending)
    const sortedResults = [...studentResults].sort((a, b) => {
      if (a.totalPoints !== b.totalPoints) {
        return a.totalPoints - b.totalPoints;
      }

      // If total points are the same, sort by principal points
      if (a.principalPoints !== b.principalPoints) {
        return a.principalPoints - b.principalPoints;
      }

      // If principal points are the same, sort by average marks (descending)
      return b.averageMarks - a.averageMarks;
    });

    // Add position to each student
    const rankedResults = sortedResults.map((result, index) => ({
      ...result,
      position: index + 1
    }));

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
        gradeDistribution,
        isPrincipal: subject.isPrincipal
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
        subjectStats,
        timestamp: new Date()
      }
    };
  } catch (error) {
    logger.error(`[PrismaALevelResultsService] Error getting A-Level class results: ${error.message}`, error);
    return {
      success: false,
      message: `Error getting A-Level class results: ${error.message}`,
      error
    };
  }
}

/**
 * Generate A-Level student report
 * @param {Object} params - Parameters
 * @param {string} params.studentId - Student ID
 * @param {string} params.examId - Exam ID
 * @param {Object} params.student - Student object (optional)
 * @returns {Promise<Object>} - Result of the operation
 */
async function generateALevelStudentReport({ studentId, examId, student = null }) {
  try {
    logger.info(`[PrismaALevelResultsService] Generating A-Level report for student ${studentId}, exam ${examId}`);

    // Get student results
    const resultsResponse = await getALevelStudentResults({ studentId, examId, student });

    if (!resultsResponse.success) {
      return resultsResponse;
    }

    const {
      student: studentData,
      exam,
      results,
      principalResults,
      subsidiaryResults,
      principalPoints,
      subsidiaryPoints,
      totalPoints,
      averageMarks,
      combination
    } = resultsResponse.data;

    // Get class results for ranking
    const classResultsResponse = await getALevelClassResults({ classId: studentData.classId, examId });

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
      isPrincipal: result.isPrincipal,
      isSubsidiary: result.isSubsidiary,
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
        class: classResultsResponse.data.class.name,
        combination: combination ? combination.name : 'No Combination'
      },
      exam: {
        name: exam.name,
        term: exam.term,
        academicYear: academicYear ? academicYear.name : 'Unknown'
      },
      results: formattedResults,
      summary: {
        totalSubjects: results.length,
        principalSubjects: principalResults.length,
        subsidiarySubjects: subsidiaryResults.length,
        averageMarks,
        principalPoints,
        subsidiaryPoints,
        totalPoints,
        position,
        totalStudents
      },
      generatedAt: new Date()
    };

    return {
      success: true,
      data: report
    };
  } catch (error) {
    logger.error(`[PrismaALevelResultsService] Error generating A-Level student report: ${error.message}`, error);
    return {
      success: false,
      message: `Error generating A-Level student report: ${error.message}`,
      error
    };
  }
}

/**
 * Generate A-Level class report
 * @param {Object} params - Parameters
 * @param {string} params.classId - Class ID
 * @param {string} params.examId - Exam ID
 * @param {Object} params.classObj - Class object (optional)
 * @returns {Promise<Object>} - Result of the operation
 */
async function generateALevelClassReport({ classId, examId, classObj = null }) {
  try {
    logger.info(`[PrismaALevelResultsService] Generating A-Level class report for class ${classId}, exam ${examId}`);

    // Get class results
    const classResultsResponse = await getALevelClassResults({ classId, examId, classObj });

    if (!classResultsResponse.success) {
      return classResultsResponse;
    }

    const { class: classData, exam, students, subjectStats } = classResultsResponse.data;

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
      principalSubjects: student.principalResults.length,
      subsidiarySubjects: student.subsidiaryResults.length,
      averageMarks: student.averageMarks,
      principalPoints: student.principalPoints,
      subsidiaryPoints: student.subsidiaryPoints,
      totalPoints: student.totalPoints,
      position: student.position
    }));

    // Format subject statistics for report
    const formattedSubjectStats = subjectStats.map(stat => ({
      name: stat.subject.name,
      code: stat.subject.code,
      isPrincipal: stat.isPrincipal,
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
        subjectStats: formattedSubjectStats
      },
      generatedAt: new Date()
    };

    return {
      success: true,
      data: report
    };
  } catch (error) {
    logger.error(`[PrismaALevelResultsService] Error generating A-Level class report: ${error.message}`, error);
    return {
      success: false,
      message: `Error generating A-Level class report: ${error.message}`,
      error
    };
  }
}

module.exports = {
  getALevelStudentResults,
  getALevelClassResults,
  generateALevelStudentReport,
  generateALevelClassReport
};
