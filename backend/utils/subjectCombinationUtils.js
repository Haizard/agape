/**
 * Utility functions for handling subject combinations
 */

const SubjectCombination = require('../models/SubjectCombination');
const Subject = require('../models/Subject');

/**
 * Get a subject combination with all its subjects (including compulsory subjects)
 * @param {string} combinationId - The ID of the subject combination
 * @returns {Object} - The subject combination with all subjects
 */
const getFullSubjectCombination = async (combinationId) => {
  try {
    const combination = await SubjectCombination.findById(combinationId)
      .populate('subjects', 'name code type educationLevel isCompulsory')
      .populate('compulsorySubjects', 'name code type educationLevel isCompulsory');
    
    if (!combination) {
      console.log(`Subject combination not found with ID: ${combinationId}`);
      return null;
    }
    
    return {
      _id: combination._id,
      name: combination.name,
      code: combination.code,
      educationLevel: combination.educationLevel,
      description: combination.description,
      subjects: combination.subjects || [],
      compulsorySubjects: combination.compulsorySubjects || [],
      allSubjects: [...(combination.subjects || []), ...(combination.compulsorySubjects || [])],
      isActive: combination.isActive
    };
  } catch (error) {
    console.error(`Error getting full subject combination: ${error.message}`);
    throw error;
  }
};

/**
 * Filter subjects based on teacher assignments
 * @param {Array} subjects - Array of subjects
 * @param {string} teacherId - The ID of the teacher
 * @param {Array} teacherSubjects - Array of subject IDs assigned to the teacher
 * @returns {Array} - Filtered subjects that the teacher is assigned to
 */
const filterSubjectsForTeacher = (subjects, teacherId, teacherSubjects) => {
  if (!teacherId || !teacherSubjects || !Array.isArray(teacherSubjects)) {
    return [];
  }
  
  return subjects.filter(subject => {
    const subjectId = subject._id ? subject._id.toString() : subject.toString();
    return teacherSubjects.includes(subjectId);
  });
};

/**
 * Format a subject combination for display
 * @param {Object} combination - The subject combination
 * @param {boolean} includeCompulsory - Whether to include compulsory subjects
 * @returns {Object} - Formatted subject combination
 */
const formatSubjectCombination = (combination, includeCompulsory = true) => {
  if (!combination) return null;
  
  const result = {
    _id: combination._id,
    name: combination.name,
    code: combination.code,
    description: combination.description,
    subjects: combination.subjects || []
  };
  
  if (includeCompulsory) {
    result.compulsorySubjects = combination.compulsorySubjects || [];
    result.allSubjects = [...(combination.subjects || []), ...(combination.compulsorySubjects || [])];
  }
  
  return result;
};

module.exports = {
  getFullSubjectCombination,
  filterSubjectsForTeacher,
  formatSubjectCombination
};
