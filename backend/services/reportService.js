/**
 * Report Service
 *
 * Handles report generation with automatic selection based on education level.
 * This is a refactored version that uses standardized approaches and consistent error handling.
 */

const ResultService = require('./resultService');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const AcademicYear = require('../models/AcademicYear');
const { generateOLevelStudentReportPDF, generateOLevelClassReportPDF } = require('../utils/oLevelReportGenerator');
const { generateALevelStudentReportPDF, generateALevelClassReportPDF } = require('../utils/aLevelReportGenerator');
const resultConsistencyChecker = require('../utils/resultConsistencyChecker');
const schoolConfig = require('../config/schoolConfig');
const { EDUCATION_LEVELS } = require('../constants/apiEndpoints');
const logger = require('../utils/logger');

/**
 * Service to handle report generation with automatic selection based on education level
 */
class ReportService {
  /**
   * Generate a student result report in JSON format
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @param {String} [providedEducationLevel] - Optional education level override
   * @returns {Promise<Object>} - The report data
   */
  static async generateStudentReportJson(studentId, term, providedEducationLevel) {
    try {
      // Get student details
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error(`Student not found with ID: ${studentId}`);
      }

      // Get class details
      const classObj = await Class.findById(student.class);
      if (!classObj) {
        throw new Error(`Class not found for student: ${studentId}`);
      }

      // Get all active assessments for the term, sorted by displayOrder
      const assessments = await Assessment.find({
        term,
        status: 'active',
        isVisible: true
      }).sort({ displayOrder: 1, examDate: 1 });

      if (!assessments || assessments.length === 0) {
        throw new Error(`No assessments found for term ${term}`);
      }

      // Get all students in the class for ranking
      const classStudents = await Student.find({ class: classObj._id });

      // Initialize report data
      const subjectResults = [];
      let totalMarks = 0;
      let totalPoints = 0;
      let resultsCount = 0;
      const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 };

      // Get all subjects for this class
      const classSubjects = classObj.subjects.map(s => s.subject).filter(Boolean);

      // Process each subject
      for (const subject of classSubjects) {
        const subjectAssessments = [];
        let subjectTotalMarks = 0;
        let subjectWeightedMarks = 0;
        let subjectTotalWeightage = 0;

        // Get results for each assessment
        for (const assessment of assessments) {
          const result = await Result.findOne({
            studentId: studentId,
            assessmentId: assessment._id,
            subjectId: subject._id
          });

          // Always include the assessment, even if no result exists
          const assessmentEntry = {
            assessmentName: assessment.name,
            marks: result ? result.marksObtained : null,
            maxMarks: assessment.maxMarks,
            weightage: assessment.weightage,
            weightedMarks: result ? (result.marksObtained / assessment.maxMarks) * assessment.weightage : 0
          };

          subjectAssessments.push(assessmentEntry);

          if (result) {
            subjectTotalMarks += result.marksObtained;
            subjectWeightedMarks += (result.marksObtained / assessment.maxMarks) * assessment.weightage;
            subjectTotalWeightage += assessment.weightage;
          }
        }

        // Calculate final grade based on weighted average
        const finalPercentage = subjectTotalWeightage > 0 ? (subjectWeightedMarks / subjectTotalWeightage) * 100 : 0;
        const grade = ReportService.calculateGrade(finalPercentage);
        const points = ReportService.calculatePoints(grade);

        // Update grade distribution
        if (gradeDistribution[grade] !== undefined) {
          gradeDistribution[grade]++;
        }

        // Update totals
        totalMarks += finalPercentage;
        totalPoints += points;
        resultsCount++;

        // Add to subject results
        subjectResults.push({
          subject: subject.name,
          assessments: subjectAssessments,
          totalMarks: subjectTotalMarks,
          weightedAverage: finalPercentage.toFixed(2),
          grade,
          points,
          remarks: ReportService.getRemarksByLevel(grade, providedEducationLevel),
          isPrincipal: subject.isPrincipal || false
        });
      }
      }
    try {
      // Get student details
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error(`Student not found with ID: ${studentId}`);
      }

      // Get exam details
      const exam = await Exam.findById(examId)
        .populate('academicYear');
      if (!exam) {
        throw new Error(`Exam not found with ID: ${examId}`);
      }

      // Get class details
      const classObj = await Class.findById(student.class);
      if (!classObj) {
        throw new Error(`Class not found for student: ${studentId}`);
      }

      // Determine education level
      const educationLevel = providedEducationLevel || student.educationLevel || EDUCATION_LEVELS.O_LEVEL;
      logger.info(`Generating ${educationLevel} report for student ${studentId}, exam ${examId}`);

      // Get all students in the class for ranking
      const classStudents = await Student.find({ class: classObj._id });

      // Get results for this student
      const results = await ResultService.getStudentResults(studentId, {
        examId: examId
      });

      if (results.length === 0) {
        logger.warn(`No results found for student ${studentId}, exam ${examId}`);
      }

      // Process results
      const subjectResults = [];
      let totalMarks = 0;
      let totalPoints = 0;
      let resultsCount = 0;
      const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 };

      // Get all subjects for this class
      const classSubjects = classObj.subjects.map(s => s.subject).filter(Boolean);

      // Process each subject
      for (const subject of classSubjects) {
        // Find result for this subject
        const result = results.find(r =>
          (r.subjectId && r.subjectId._id.toString() === subject._id.toString()) ||
          (r.subject && r.subject._id.toString() === subject._id.toString())
        );

        if (result) {
          // We have a result for this subject
          logger.debug(`Found result for subject ${subject.name}: Marks=${result.marksObtained}, Grade=${result.grade}`);

          // Update grade distribution
          if (gradeDistribution[result.grade] !== undefined) {
            gradeDistribution[result.grade]++;
          }

          // Update totals
          totalMarks += result.marksObtained || 0;
          totalPoints += result.points || 0;
          resultsCount++;

          // Add to subject results
          subjectResults.push({
            subject: subject.name,
            marks: result.marksObtained || 0,
            grade: result.grade || '',
            points: result.points || 0,
            remarks: ReportService.getRemarksByLevel(result.grade, educationLevel),
            isPrincipal: subject.isPrincipal || false // For A-LEVEL
          });
        } else {
          // No result for this subject
          logger.debug(`No result found for subject ${subject.name}`);

          // Add empty result
          subjectResults.push({
            subject: subject.name,
            marks: null,
            grade: '',
            points: null,
            remarks: 'No Result',
            isPrincipal: subject.isPrincipal || false // For A-LEVEL
          });
        }
      }

      // Calculate average marks
      const averageMarks = resultsCount > 0 ? totalMarks / resultsCount : 0;

      // Calculate best points and division based on education level
      let bestPoints;
      let division;
      if (educationLevel === EDUCATION_LEVELS.O_LEVEL) {
        // Sort by points (ascending)
        const sortedResults = [...subjectResults].filter(r => r.points !== null).sort((a, b) => a.points - b.points);

        // Take best 7 subjects (or all if less than 7)
        const bestSevenSubjects = sortedResults.slice(0, Math.min(7, sortedResults.length));
        const bestSevenPoints = bestSevenSubjects.reduce((sum, subject) => sum + subject.points, 0);

        // Determine division
        division = ReportService.calculateOLevelDivision(bestSevenPoints);
        bestPoints = bestSevenPoints;
      } else {
        // For A-LEVEL, find principal subjects
        const principalSubjects = subjectResults.filter(result => result.isPrincipal && result.points !== null);

        // Sort by points (ascending)
        principalSubjects.sort((a, b) => a.points - b.points);

        // Take best 3 principal subjects (or all if less than 3)
        const bestThreeSubjects = principalSubjects.slice(0, Math.min(3, principalSubjects.length));
        const bestThreePoints = bestThreeSubjects.reduce((sum, subject) => sum + subject.points, 0);

        // Determine division
        division = ReportService.calculateALevelDivision(bestThreePoints);
        bestPoints = bestThreePoints;
      }

      // Calculate student rank
      let studentRank = 'N/A';
      try {
        // Get results for all students in the class
        const allStudentResults = await Promise.all(
          classStudents.map(async (s) => {
            const studentResults = await ResultService.getStudentResults(s._id, {
              examId: examId
            });

            // Calculate total marks for this student
            const studentTotalMarks = studentResults.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
            const studentAverage = studentResults.length > 0 ? studentTotalMarks / studentResults.length : 0;

            return {
              studentId: s._id,
              average: studentAverage
            };
          })
        );

        // Sort by average (descending)
        allStudentResults.sort((a, b) => b.average - a.average);

        // Find rank of current student
        const studentIndex = allStudentResults.findIndex(r => r.studentId.toString() === studentId);
        if (studentIndex !== -1) {
          studentRank = (studentIndex + 1).toString();
        }
      } catch (rankError) {
        logger.error(`Error calculating student rank: ${rankError.message}`);
        // Continue without rank
      }

      // Format the report
      const report = {
        reportTitle: `${exam.name} Result Report`,
        schoolName: schoolConfig.name,
        academicYear: exam.academicYear ? exam.academicYear.name : 'Unknown',
        examName: exam.name,
        examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
        studentDetails: {
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          class: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
          gender: student.gender
        },
        subjectResults,
        summary: {
          totalMarks,
          averageMarks: averageMarks.toFixed(2),
          totalPoints,
          bestSevenPoints: educationLevel === EDUCATION_LEVELS.O_LEVEL ? bestPoints : undefined,
          bestThreePoints: educationLevel === EDUCATION_LEVELS.A_LEVEL ? bestPoints : undefined,
          division,
          rank: studentRank,
          totalStudents: classStudents.length,
          gradeDistribution
        },
        student: {
          fullName: `${student.firstName} ${student.lastName}`
        },
        class: {
          fullName: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim()
        },
        exam: {
          name: exam.name,
          term: exam.term || 'Term 1'
        },
        educationLevel
      };

      return report;
    } catch (error) {
      logger.error(`Error generating student report JSON: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a student result report
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @param {Object} res - Express response object for PDF streaming
   * @param {String} [providedEducationLevel] - Optional education level override
   * @returns {Promise<void>} - Streams PDF to response
   */
  static async generateStudentReport(studentId, examId, res, providedEducationLevel) {
    try {
      // Get report data
      const report = await ReportService.generateStudentReportJson(studentId, examId, providedEducationLevel);

      // Generate PDF based on education level
      if (report.educationLevel === EDUCATION_LEVELS.A_LEVEL) {
        generateALevelStudentReportPDF(report, res);
      } else {
        generateOLevelStudentReportPDF(report, res);
      }
    } catch (error) {
      logger.error(`Error generating student report PDF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a class result report in JSON format
   * @param {String} classId - The class ID
   * @param {String} examId - The exam ID
   * @param {String} [providedEducationLevel] - Optional education level override
   * @param {Number} [page=1] - Page number for pagination
   * @param {Number} [limit=50] - Number of students per page
   * @returns {Promise<Object>} - The report data
   */
  static async generateClassReportJson(classId, examId, providedEducationLevel, page = 1, limit = 50) {
    try {
      // Get class details
      const classObj = await Class.findById(classId)
        .populate('students')
        .populate({
          path: 'subjects.subject',
          model: 'Subject'
        })
        .populate('academicYear')
        .populate('classTeacher');

      if (!classObj) {
        throw new Error(`Class not found with ID: ${classId}`);
      }

      // Get exam details
      const exam = await Exam.findById(examId)
        .populate('academicYear');
      if (!exam) {
        throw new Error(`Exam not found with ID: ${examId}`);
      }

      // Determine education level
      const educationLevel = providedEducationLevel || classObj.educationLevel || EDUCATION_LEVELS.O_LEVEL;
      logger.info(`Generating ${educationLevel} class report for class ${classId}, exam ${examId}`);

      // Get all students in the class
      const students = classObj.students || [];

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedStudents = students.slice(startIndex, endIndex);

      // Get all subjects for this class
      const subjects = classObj.subjects.map(s => s.subject).filter(Boolean);

      // Process each student
      const studentResults = [];
      let classTotal = 0;
      let classCount = 0;

      for (const student of paginatedStudents) {
        // Get results for this student
        const results = await ResultService.getStudentResults(student._id, {
          examId: examId
        });

        // Process student results
        const subjectResults = [];
        let studentTotal = 0;
        let studentPoints = 0;
        let resultsCount = 0;

        // Process each subject
        for (const subject of subjects) {
          // Find result for this subject
          const result = results.find(r =>
            (r.subjectId && r.subjectId._id.toString() === subject._id.toString()) ||
            (r.subject && r.subject._id.toString() === subject._id.toString())
          );

          if (result) {
            // Add to subject results
            subjectResults.push({
              subject: subject.name,
              marks: result.marksObtained || 0,
              grade: result.grade || '',
              points: result.points || 0,
              remarks: ReportService.getRemarksByLevel(result.grade, educationLevel),
              isPrincipal: subject.isPrincipal || false // For A-LEVEL
            });

            // Update totals
            studentTotal += result.marksObtained || 0;
            studentPoints += result.points || 0;
            resultsCount++;

            // Update class totals
            classTotal += result.marksObtained || 0;
            classCount++;
          } else {
            // No result for this subject
            subjectResults.push({
              subject: subject.name,
              marks: null,
              grade: '',
              points: null,
              remarks: 'No Result',
              isPrincipal: subject.isPrincipal || false // For A-LEVEL
            });
          }
        }

        // Calculate student average
        const studentAverage = resultsCount > 0 ? studentTotal / resultsCount : 0;

        // Calculate best subjects and division based on education level
        let bestPoints;
        let division;
        if (educationLevel === EDUCATION_LEVELS.O_LEVEL) {
          // Sort by points (ascending)
          const sortedResults = [...subjectResults].filter(r => r.points !== null).sort((a, b) => a.points - b.points);

          // Take best 7 subjects (or all if less than 7)
          const bestSevenSubjects = sortedResults.slice(0, Math.min(7, sortedResults.length));
          const bestSevenPoints = bestSevenSubjects.reduce((sum, subject) => sum + subject.points, 0);

          // Determine division
          division = ReportService.calculateOLevelDivision(bestSevenPoints);
          bestPoints = bestSevenPoints;
        } else {
          // For A-LEVEL, find principal subjects
          const principalSubjects = subjectResults.filter(result => result.isPrincipal && result.points !== null);

          // Sort by points (ascending)
          principalSubjects.sort((a, b) => a.points - b.points);

          // Take best 3 principal subjects (or all if less than 3)
          const bestThreeSubjects = principalSubjects.slice(0, Math.min(3, principalSubjects.length));
          const bestThreePoints = bestThreeSubjects.reduce((sum, subject) => sum + subject.points, 0);

          // Determine division
          division = ReportService.calculateALevelDivision(bestThreePoints);
          bestPoints = bestThreePoints;
        }

        // Add student result summary
        studentResults.push({
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          sex: student.gender === 'male' ? 'M' : 'F',
          results: subjectResults,
          totalMarks: studentTotal,
          averageMarks: studentAverage.toFixed(2),
          totalPoints: studentPoints,
          bestSevenPoints: educationLevel === EDUCATION_LEVELS.O_LEVEL ? bestPoints : undefined,
          bestThreePoints: educationLevel === EDUCATION_LEVELS.A_LEVEL ? bestPoints : undefined,
          division,
          rank: 'N/A' // Will be calculated below
        });
      }

      // Calculate class average
      const classAverage = classCount > 0 ? (classTotal / classCount).toFixed(2) : '0.00';

      // Calculate student ranks
      if (studentResults.length > 0) {
        // Sort by average marks (descending)
        studentResults.sort((a, b) => Number.parseFloat(b.averageMarks) - Number.parseFloat(a.averageMarks));

        // Assign ranks
        for (let i = 0; i < studentResults.length; i++) {
          studentResults[i].rank = (i + 1).toString();
        }
      }

      // Format the report
      const report = {
        className: classObj.name,
        section: classObj.section || '',
        stream: classObj.stream || '',
        academicYear: classObj.academicYear ? classObj.academicYear.name : 'Unknown',
        examName: exam.name,
        examDate: exam.startDate ? `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}` : 'N/A',
        students: studentResults,
        classAverage,
        totalStudents: students.length,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(students.length / limit),
          totalItems: students.length
        },
        educationLevel,
        schoolName: schoolConfig.name
      };

      return report;
    } catch (error) {
      logger.error(`Error generating class report JSON: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a class result report
   * @param {String} classId - The class ID
   * @param {String} examId - The exam ID
   * @param {Object} res - Express response object for PDF streaming
   * @param {String} [providedEducationLevel] - Optional education level override
   * @returns {Promise<void>} - Streams PDF to response
   */
  static async generateClassReport(classId, examId, res, providedEducationLevel) {
    try {
      // Get report data (without pagination for PDF)
      const report = await ReportService.generateClassReportJson(classId, examId, providedEducationLevel, 1, 1000);

      // Generate PDF based on education level
      if (report.educationLevel === EDUCATION_LEVELS.A_LEVEL) {
        generateALevelClassReportPDF(report, res);
      } else {
        generateOLevelClassReportPDF(report, res);
      }
    } catch (error) {
      logger.error(`Error generating class report PDF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate O-LEVEL division based on points
   * @param {Number} points - The total points from best 7 subjects
   * @returns {String} - The division (I, II, III, IV, 0)
   */
  static calculateOLevelDivision(points) {
    if (points >= 7 && points <= 14) return 'I';
    if (points >= 15 && points <= 21) return 'II';
    if (points >= 22 && points <= 25) return 'III';
    if (points >= 26 && points <= 32) return 'IV';
    return '0';
  }

  /**
   * Calculate A-LEVEL division based on points
   * @param {Number} points - The total points from best 3 principal subjects
   * @returns {String} - The division (I, II, III, IV, V)
   */
  static calculateALevelDivision(points) {
    // Convert points to a number to ensure proper comparison
    const numPoints = Number(points);
    if (Number.isNaN(numPoints)) {
      logger.warn(`Invalid A-Level points value: ${points}`);
      return '0';
    }

    // Handle edge cases
    if (numPoints === 0) {
      logger.warn('No points or no principal subjects with grades for A-Level division calculation');
      return '0';
    }

    // In A-Level, lower points are better (A=1, B=2, etc.)
    if (numPoints >= 3 && numPoints <= 9) return 'I';
    if (numPoints >= 10 && numPoints <= 12) return 'II';
    if (numPoints >= 13 && numPoints <= 17) return 'III';
    if (numPoints >= 18 && numPoints <= 19) return 'IV';
    if (numPoints >= 20 && numPoints <= 21) return 'V';

    logger.warn(`A-Level division 0 (points ${numPoints} outside valid ranges)`);
    return '0';
  }

  /**
   * Get remarks based on grade and education level
   * @param {String} grade - The grade
   * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
   * @returns {String} - The remarks
   */
  static getRemarksByLevel(grade, educationLevel) {
    if (educationLevel === EDUCATION_LEVELS.O_LEVEL) {
      switch (grade) {
        case 'A': return 'Excellent';
        case 'B': return 'Very Good';
        case 'C': return 'Good';
        case 'D': return 'Satisfactory';
        case 'F': return 'Fail';
        default: return '-';
      }
    }

    if (educationLevel === EDUCATION_LEVELS.A_LEVEL) {
      switch (grade) {
        case 'A': return 'Excellent';
        case 'B': return 'Very Good';
        case 'C': return 'Good';
        case 'D': return 'Satisfactory';
        case 'E': return 'Pass';
        case 'S': return 'Subsidiary Pass';
        case 'F': return 'Fail';
        default: return '-';
      }
    }

    return '-';
  }
  /**
   * Send result report via SMS
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @param {String} [providedEducationLevel] - Optional education level override
   * @returns {Promise<Object>} - SMS sending result
   */
  static async sendReportSms(studentId, examId, providedEducationLevel) {
    try {
      // Get report data
      const report = await ReportService.generateStudentReportJson(studentId, examId, providedEducationLevel);

      // Get student phone number
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error(`Student not found with ID: ${studentId}`);
      }

      // Get parent phone number
      const phoneNumber = student.parentPhone || student.phone;
      if (!phoneNumber) {
        throw new Error(`No phone number found for student ${studentId}`);
      }

      // Compose SMS message
      let message = `${schoolConfig.shortName}\n`;
      message += `${student.firstName} ${student.lastName}\n`;
      message += `${report.examName} Results\n`;
      message += `Avg: ${report.summary.averageMarks}%\n`;

      if (report.educationLevel === EDUCATION_LEVELS.A_LEVEL) {
        message += `Points: ${report.summary.bestThreePoints}\n`;
        message += `Div: ${report.summary.division}\n`;

        // Add principal subjects
        const principalSubjects = report.subjectResults.filter(s => s.isPrincipal);
        message += `Principal: ${principalSubjects.map(s => `${s.subject}: ${s.grade}`).join(', ')}\n`;

        // Add subsidiary subjects
        const subsidiarySubjects = report.subjectResults.filter(s => !s.isPrincipal);
        message += `Subsidiary: ${subsidiarySubjects.map(s => `${s.subject}: ${s.grade}`).join(', ')}`;
      } else {
        message += `Points: ${report.summary.bestSevenPoints}\n`;
        message += `Div: ${report.summary.division}\n`;
        message += `Rank: ${report.summary.rank} of ${report.summary.totalStudents}\n`;

        // Add top subjects
        const topSubjects = report.subjectResults
          .filter(s => s.grade)
          .sort((a, b) => a.points - b.points)
          .slice(0, 5);

        message += `Subjects: ${topSubjects.map(s => `${s.subject}: ${s.grade}`).join(', ')}`;
      }

      // TODO: Implement actual SMS sending logic here
      // For now, just log the message
      logger.info(`SMS message composed for student ${studentId}:\n${message}`);

      return {
        success: true,
        phoneNumber,
        messageLength: message.length,
        // This would be replaced with actual SMS API response
        smsApiResponse: {
          messageId: `SMS-${Date.now()}`,
          status: 'queued'
        }
      };
    } catch (error) {
      logger.error(`Error sending report SMS: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ReportService;
