const Result = require('../models/Result');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Student = require('../models/Student');

/**
 * Utility to ensure consistent marks across different result models
 */
const resultConsistencyChecker = {
  /**
   * Get the most reliable result for a student, subject, and exam
   * @param {String} studentId - The student ID
   * @param {String} subjectId - The subject ID
   * @param {String} examId - The exam ID
   * @returns {Promise<Object>} - The most reliable result
   */
  async getMostReliableResult(studentId, subjectId, examId) {
    try {
      // Get student to determine education level
      const student = await Student.findById(studentId);
      if (!student) {
        console.error(`Student not found with ID: ${studentId}`);
        return null;
      }

      const educationLevel = student.educationLevel || 'O_LEVEL';
      console.log(`Getting result for student ${studentId} (${student.firstName} ${student.lastName}), subject ${subjectId}, exam ${examId} with education level ${educationLevel}`);

      // Get result from the appropriate new model only
      const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;
      const result = await ResultModel.findOne({
        studentId,
        subjectId,
        examId
      });

      if (result) {
        console.log(`Found result in ${educationLevel} model: Marks=${result.marksObtained}, Grade=${result.grade}`);
      } else {
        console.log(`No result found in ${educationLevel} model`);
      }

      return result;
    } catch (error) {
      console.error(`Error getting most reliable result: ${error.message}`);
      return null;
    }
  },

  /**
   * Get all results for a student and exam, ensuring consistency
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @returns {Promise<Array>} - The consistent results
   */
  async getConsistentStudentResults(studentId, examId) {
    try {
      // Get student to determine education level
      const student = await Student.findById(studentId);
      if (!student) {
        console.error(`Student not found with ID: ${studentId}`);
        return [];
      }

      const educationLevel = student.educationLevel || 'O_LEVEL';
      console.log(`Getting results for student ${studentId} (${student.firstName} ${student.lastName}) with education level ${educationLevel}`);

      // Get results from the appropriate new model only
      const ResultModel = educationLevel === 'A_LEVEL' ? ALevelResult : OLevelResult;
      const results = await ResultModel.find({
        studentId,
        examId
      })
      .populate('subjectId', 'name code isPrincipal')
      .populate('examId', 'name type')
      .populate('examTypeId', 'name');

      console.log(`Found ${results.length} results in the ${educationLevel} model`);

      // Log the results for debugging
      for (const result of results) {
        const subjectName = result.subjectId?.name || 'Unknown';
        console.log(`Subject: ${subjectName}, Marks: ${result.marksObtained}, Grade: ${result.grade}, Points: ${result.points}`);
      }

      return results;
    } catch (error) {
      console.error(`Error getting consistent student results: ${error.message}`);
      return [];
    }
  }
};

module.exports = resultConsistencyChecker;
