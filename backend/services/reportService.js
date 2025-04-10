const ResultService = require('./resultService');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const AcademicYear = require('../models/AcademicYear');
const { generateOLevelStudentReportPDF, generateOLevelClassReportPDF } = require('../utils/oLevelReportGenerator');
const { generateALevelStudentReportPDF, generateALevelClassReportPDF } = require('../utils/aLevelReportGenerator');
const resultConsistencyChecker = require('../utils/resultConsistencyChecker');

/**
 * Service to handle report generation with automatic selection based on education level
 */
class ReportService {
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
      // Get student details
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error(`Student not found with ID: ${studentId}`);
      }

      // Get education level - use provided level if available, otherwise use student's level or default to O_LEVEL
      const educationLevel = providedEducationLevel || student.educationLevel || 'O_LEVEL';
      console.log(`Student ${studentId} (${student.firstName} ${student.lastName}) has education level: ${educationLevel} (${providedEducationLevel ? 'provided in request' : 'from student record'})`);
      console.log(`Using education level: ${educationLevel} for report generation`);

      // Get exam details
      const exam = await Exam.findById(examId)
        .populate('academicYear');
      if (!exam) {
        throw new Error(`Exam not found with ID: ${examId}`);
      }

      // Get class details
      const classObj = await Class.findById(student.class);
      if (!classObj) {
        throw new Error(`Class not found with ID: ${student.class}`);
      }

      // Get all students in the same class for ranking
      const classStudents = await Student.find({ class: student.class });
      console.log(`Found ${classStudents.length} students in class ${classObj.name} for ranking calculation`);

      // Get all subjects for this class to ensure we include all subjects in the report
      const classSubjects = await Subject.find({ _id: { $in: classObj.subjects.map(s => typeof s === 'object' ? s.subject : s) } });
      console.log(`Found ${classSubjects.length} subjects for class ${classObj._id}`);

      // Get consistent results using the consistency checker
      console.log(`Getting consistent results for student ${studentId} and exam ${examId}`);
      const results = await resultConsistencyChecker.getConsistentStudentResults(studentId, examId);
      console.log(`Found ${results.length} consistent results`);

      // Create a map of existing results for easy lookup
      const resultMap = {};
      for (const result of results) {
        if (result.subjectId && result.subjectId._id) {
          resultMap[result.subjectId._id.toString()] = result;
          console.log(`Mapped result for subject ${result.subjectId.name}: Marks=${result.marksObtained}, Grade=${result.grade}`);
        }
      }

      // Process results
      const subjectResults = [];
      const gradeDistribution = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'S': 0, 'F': 0 };
      let totalMarks = 0;
      let totalPoints = 0;
      let resultsCount = 0;

      // Process all class subjects, using results where available
      for (const subject of classSubjects) {
        const result = resultMap[subject._id.toString()];

        if (result) {
          // We have a result for this subject
          console.log(`Found result for subject ${subject.name}: Marks=${result.marksObtained}, Grade=${result.grade}`);

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
            remarks: this.getRemarksByLevel(result.grade, educationLevel),
            isPrincipal: subject.isPrincipal || false // For A-LEVEL
          });
        } else {
          // No result for this subject - add it with empty values
          console.log(`No result found for subject ${subject.name}`);

          // Add to subject results with empty values
          subjectResults.push({
            subject: subject.name,
            marks: 0,
            grade: '-',
            points: 0,
            remarks: '-',
            isPrincipal: subject.isPrincipal || false // For A-LEVEL
          });
        }
      }

      // Calculate averages
      const averageMarks = resultsCount > 0 ? totalMarks / resultsCount : 0;

      // Calculate best subjects and division based on education level
      let bestPoints, division;
      if (educationLevel === 'O_LEVEL') {
        // Filter out subjects with no results (marked with '-' grade)
        const validSubjects = subjectResults.filter(subject => subject.grade !== '-');
        console.log(`Found ${validSubjects.length} valid subjects with grades for O-LEVEL calculation`);

        // Sort by points (ascending)
        validSubjects.sort((a, b) => a.points - b.points);

        // Take best 7 subjects (or all if less than 7)
        const bestSevenSubjects = validSubjects.slice(0, Math.min(7, validSubjects.length));
        const bestSevenPoints = bestSevenSubjects.reduce((sum, subject) => sum + subject.points, 0);

        console.log(`Best 7 subjects total points: ${bestSevenPoints}`);

        // Determine division
        division = this.calculateOLevelDivision(bestSevenPoints);
        bestPoints = bestSevenPoints;
      } else {
        // For A-LEVEL, find principal subjects with valid grades
        const validSubjects = subjectResults.filter(subject => subject.grade !== '-' && subject.isPrincipal);
        console.log(`Found ${validSubjects.length} valid principal subjects with grades for A-LEVEL calculation`);

        // Sort by points (ascending)
        validSubjects.sort((a, b) => a.points - b.points);

        // Take best 3 subjects (or all if less than 3)
        const bestThreeSubjects = validSubjects.slice(0, Math.min(3, validSubjects.length));
        const bestThreePoints = bestThreeSubjects.reduce((sum, subject) => sum + subject.points, 0);

        console.log(`Best 3 principal subjects total points: ${bestThreePoints}`);

        // Determine division
        division = this.calculateALevelDivision(bestThreePoints);
        bestPoints = bestThreePoints;
      }

      // Calculate rank by comparing with other students in the same class
      let studentRank = 'N/A';

      // Only calculate rank if there are other students in the class
      if (classStudents.length > 0) {
        // Create an array to store all students' average marks
        const studentAverages = [];

        // Calculate average marks for all students in the class
        for (const classStudent of classStudents) {
          // Get results for this student
          const studentResults = await resultConsistencyChecker.getConsistentStudentResults(classStudent._id, examId);

          // Calculate total marks and count
          let studentTotalMarks = 0;
          let studentResultCount = 0;

          for (const result of studentResults) {
            studentTotalMarks += result.marksObtained || 0;
            studentResultCount++;
          }

          // Calculate average
          const studentAverage = studentResultCount > 0 ? studentTotalMarks / studentResultCount : 0;

          // Add to array
          studentAverages.push({
            studentId: classStudent._id.toString(),
            average: studentAverage
          });
        }

        // Sort by average marks (descending)
        studentAverages.sort((a, b) => b.average - a.average);

        // Find the current student's position
        for (let i = 0; i < studentAverages.length; i++) {
          if (studentAverages[i].studentId === studentId.toString()) {
            studentRank = i + 1;
            break;
          }
        }

        console.log(`Calculated rank for student ${studentId}: ${studentRank} out of ${classStudents.length}`);
      }

      // Format the report
      const report = {
        reportTitle: `${exam.name} Result Report`,
        schoolName: 'AGAPE LUTHERAN JUNIOR SEMINARY',
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
          bestSevenPoints: educationLevel === 'O_LEVEL' ? bestPoints : undefined,
          bestThreePoints: educationLevel === 'A_LEVEL' ? bestPoints : undefined,
          division,
          rank: studentRank, // Now calculated based on comparison with other students
          totalStudents: classStudents.length, // Total number of students for rank display
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
        totalMarks,
        averageMarks: averageMarks.toFixed(2),
        points: totalPoints,
        bestSevenPoints: educationLevel === 'O_LEVEL' ? bestPoints : undefined,
        bestThreePoints: educationLevel === 'A_LEVEL' ? bestPoints : undefined,
        division
      };

      // Generate PDF based on education level
      if (educationLevel === 'A_LEVEL') {
        generateALevelStudentReportPDF(report, res);
      } else {
        generateOLevelStudentReportPDF(report, res);
      }
    } catch (error) {
      console.error(`Error generating student report: ${error.message}`);
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

      // Get education level - use provided level if available, otherwise use class's level or default to O_LEVEL
      const educationLevel = providedEducationLevel || classObj.educationLevel || 'O_LEVEL';
      console.log(`Class ${classId} has education level: ${educationLevel} (${providedEducationLevel ? 'provided in request' : 'from class record'})`);
      console.log(`Using education level: ${educationLevel} for report generation`);

      // Get exam details
      const exam = await Exam.findById(examId)
        .populate('academicYear');
      if (!exam) {
        throw new Error(`Exam not found with ID: ${examId}`);
      }

      // Get all students in the class
      const students = await Student.find({ class: classId });
      if (!students || students.length === 0) {
        throw new Error(`No students found in class with ID: ${classId}`);
      }

      // Get results for all students
      const studentResults = [];
      let classTotal = 0;
      let classCount = 0;

      for (const student of students) {
        // Get consistent results using the consistency checker
        console.log(`Getting consistent results for student ${student._id} and exam ${examId}`);
        const results = await resultConsistencyChecker.getConsistentStudentResults(student._id, examId);
        console.log(`Found ${results.length} consistent results for student ${student._id}`);

        // Log the results for debugging
        for (const result of results) {
          const subjectName = result.subjectId?.name || 'Unknown';
          console.log(`Student ${student._id} - Subject: ${subjectName}, Marks: ${result.marksObtained}, Grade: ${result.grade}`);
        }

        // Process student results
        const subjectResults = [];
        let studentTotal = 0;
        let studentPoints = 0;

        for (const result of results) {
          // Get subject details
          const subject = result.subjectId;
          if (!subject || !subject.name) continue;

          // Add to subject results
          subjectResults.push({
            subject: subject.name,
            marks: result.marksObtained || 0,
            grade: result.grade || '',
            points: result.points || 0,
            remarks: this.getRemarksByLevel(result.grade, educationLevel),
            isPrincipal: subject.isPrincipal || false // For A-LEVEL
          });

          // Update totals
          studentTotal += result.marksObtained || 0;
          studentPoints += result.points || 0;

          // Update class totals
          classTotal += result.marksObtained || 0;
          classCount++;
        }

        // Calculate student average
        const studentAverage = subjectResults.length > 0 ? studentTotal / subjectResults.length : 0;

        // Calculate best subjects and division based on education level
        let bestPoints, division;
        if (educationLevel === 'O_LEVEL') {
          // Sort by points (ascending)
          subjectResults.sort((a, b) => a.points - b.points);

          // Take best 7 subjects (or all if less than 7)
          const bestSevenSubjects = subjectResults.slice(0, Math.min(7, subjectResults.length));
          const bestSevenPoints = bestSevenSubjects.reduce((sum, subject) => sum + subject.points, 0);

          // Determine division
          division = this.calculateOLevelDivision(bestSevenPoints);
          bestPoints = bestSevenPoints;
        } else {
          // For A-LEVEL, find principal subjects
          const principalSubjects = subjectResults.filter(result => result.isPrincipal);

          // Sort by points (ascending)
          principalSubjects.sort((a, b) => a.points - b.points);

          // Take best 3 subjects (or all if less than 3)
          const bestThreeSubjects = principalSubjects.slice(0, Math.min(3, principalSubjects.length));
          const bestThreePoints = bestThreeSubjects.reduce((sum, subject) => sum + subject.points, 0);

          // Determine division
          division = this.calculateALevelDivision(bestThreePoints);
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
          bestSevenPoints: educationLevel === 'O_LEVEL' ? bestPoints : undefined,
          bestThreePoints: educationLevel === 'A_LEVEL' ? bestPoints : undefined,
          division,
          rank: 'N/A' // Will be calculated below
        });
      }

      // Calculate class average
      const classAverageValue = classCount > 0 ? classTotal / classCount : 0;
      // Convert to string with 2 decimal places to avoid toFixed() issues in frontend
      const classAverage = classAverageValue.toFixed(2);

      // Sort students by average marks (descending) and assign ranks
      studentResults.sort((a, b) => parseFloat(b.averageMarks) - parseFloat(a.averageMarks));
      for (let i = 0; i < studentResults.length; i++) {
        studentResults[i].rank = i + 1;
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
        classAverage, // Now this is already a string with 2 decimal places
        totalStudents: students.length
      };

      // Generate PDF based on education level
      if (educationLevel === 'A_LEVEL') {
        generateALevelClassReportPDF(report, res);
      } else {
        generateOLevelClassReportPDF(report, res);
      }
    } catch (error) {
      console.error(`Error generating class report: ${error.message}`);
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
      console.log(`Invalid points value: ${points}`);
      return '0';
    }

    // Handle edge cases
    if (numPoints === 0) {
      console.log('No points or no principal subjects with grades');
      return '0';
    }

    // In A-Level, lower points are better (A=1, B=2, etc.)
    if (numPoints >= 3 && numPoints <= 9) return 'I';
    if (numPoints >= 10 && numPoints <= 12) return 'II';
    if (numPoints >= 13 && numPoints <= 17) return 'III';
    if (numPoints >= 18 && numPoints <= 19) return 'IV';
    if (numPoints >= 20 && numPoints <= 21) return 'V';

    console.log(`Division 0 (points ${numPoints} outside valid ranges)`);
    return '0';
  }

  /**
   * Get remarks based on grade and education level
   * @param {String} grade - The grade
   * @param {String} educationLevel - The education level ('O_LEVEL' or 'A_LEVEL')
   * @returns {String} - The remarks
   */
  static getRemarksByLevel(grade, educationLevel) {
    if (educationLevel === 'O_LEVEL') {
      switch (grade) {
        case 'A': return 'Excellent';
        case 'B': return 'Very Good';
        case 'C': return 'Good';
        case 'D': return 'Satisfactory';
        case 'F': return 'Fail';
        default: return '-';
      }
    } else if (educationLevel === 'A_LEVEL') {
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
}

module.exports = ReportService;
