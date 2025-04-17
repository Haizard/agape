/**
 * A-Level Subject Service
 * Provides methods for fetching and managing A-Level subjects
 */
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const TeacherAssignment = require('../models/TeacherAssignment');
const logger = require('../utils/logger');

// Cache for A-Level subjects
let aLevelSubjectsCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Get all A-Level subjects
 * @returns {Promise<Array>} Array of A-Level subjects
 */
const getAllALevelSubjects = async () => {
  try {
    // Check if cache is valid
    if (aLevelSubjectsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_TTL)) {
      logger.info(`Using cached A-Level subjects (${aLevelSubjectsCache.length} subjects)`);
      return aLevelSubjectsCache;
    }

    // Fetch all subjects that are A_LEVEL or BOTH
    const subjects = await Subject.find({
      educationLevel: { $in: ['A_LEVEL', 'BOTH'] }
    }).populate('subjectCombinations', 'name code');

    // Update cache
    aLevelSubjectsCache = subjects;
    cacheTimestamp = Date.now();

    logger.info(`Fetched ${subjects.length} A-Level subjects from database`);
    return subjects;
  } catch (error) {
    logger.error(`Error fetching A-Level subjects: ${error.message}`);
    throw error;
  }
};

/**
 * Get subjects for a specific A-Level class
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} Array of subjects for the class
 */
const getSubjectsForALevelClass = async (classId) => {
  try {
    // First check if the class exists
    const classItem = await Class.findById(classId)
      .populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code type description educationLevel'
      });

    if (!classItem) {
      logger.error(`Class not found with ID: ${classId}`);
      throw new Error('Class not found');
    }

    logger.info(`Found class: ${classItem.name}`);

    // Check if this is an A-Level class
    const isALevelClass = classItem.form === 5 || 
                          classItem.form === 6 || 
                          classItem.educationLevel === 'A_LEVEL' ||
                          (classItem.name && (
                            classItem.name.toUpperCase().includes('FORM 5') ||
                            classItem.name.toUpperCase().includes('FORM 6') ||
                            classItem.name.toUpperCase().includes('FORM V') ||
                            classItem.name.toUpperCase().includes('FORM VI') ||
                            classItem.name.toUpperCase().includes('A-LEVEL') ||
                            classItem.name.toUpperCase().includes('A LEVEL')
                          ));

    if (!isALevelClass) {
      logger.info(`Class ${classId} is not an A-Level class`);
      return [];
    }

    // Extract subjects from the class
    const classSubjects = [];
    if (classItem.subjects && Array.isArray(classItem.subjects)) {
      for (const subjectItem of classItem.subjects) {
        if (!subjectItem.subject) continue;
        classSubjects.push(subjectItem.subject);
      }
    }

    logger.info(`Found ${classSubjects.length} subjects directly assigned to class ${classId}`);

    // If class has subjects, return them
    if (classSubjects.length > 0) {
      return classSubjects;
    }

    // If no subjects found in class, find teacher assignments for this class
    const assignments = await TeacherAssignment.find({ class: classId })
      .populate('subject', 'name code description educationLevel type');

    const assignmentSubjects = [];
    for (const assignment of assignments) {
      if (!assignment.subject) continue;
      assignmentSubjects.push(assignment.subject);
    }

    logger.info(`Found ${assignmentSubjects.length} subjects from teacher assignments for class ${classId}`);

    // If assignments found, return those subjects
    if (assignmentSubjects.length > 0) {
      return assignmentSubjects;
    }

    // If no subjects found in class or assignments, return all A-Level subjects
    logger.info(`No subjects found for class ${classId}, returning all A-Level subjects`);
    return await getAllALevelSubjects();
  } catch (error) {
    logger.error(`Error fetching subjects for A-Level class ${classId}: ${error.message}`);
    
    // If any error occurs, return all A-Level subjects as fallback
    try {
      logger.info(`Using fallback: returning all A-Level subjects for class ${classId}`);
      return await getAllALevelSubjects();
    } catch (fallbackError) {
      logger.error(`Fallback failed: ${fallbackError.message}`);
      throw error; // Throw the original error if fallback fails
    }
  }
};

/**
 * Clear the A-Level subjects cache
 */
const clearCache = () => {
  aLevelSubjectsCache = null;
  cacheTimestamp = null;
  logger.info('A-Level subjects cache cleared');
};

module.exports = {
  getAllALevelSubjects,
  getSubjectsForALevelClass,
  clearCache
};
