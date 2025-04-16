const mongoose = require('mongoose');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

/**
 * Middleware to validate student data before creation or update
 */
const validateStudentData = async (req, res, next) => {
  try {
    console.log('Validating student data...');
    const { firstName, lastName, class: classId, educationLevel, subjectCombination } = req.body;

    // Basic validation
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        message: 'First name and last name are required',
        details: 'Please provide both first name and last name for the student.'
      });
    }

    if (!classId) {
      return res.status(400).json({ 
        message: 'Class is required',
        details: 'Please assign the student to a class.'
      });
    }

    // Validate class exists
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ 
        message: 'Invalid class ID format',
        details: 'The provided class ID is not in a valid format.'
      });
    }

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ 
        message: 'Class not found',
        details: 'The specified class does not exist in the system.'
      });
    }

    // Validate education level
    const providedEducationLevel = educationLevel || classObj.educationLevel || 'O_LEVEL';
    if (providedEducationLevel !== 'O_LEVEL' && providedEducationLevel !== 'A_LEVEL') {
      return res.status(400).json({ 
        message: 'Invalid education level',
        details: 'Education level must be either O_LEVEL or A_LEVEL.'
      });
    }

    // For A-Level students, validate subject combination if provided
    if (providedEducationLevel === 'A_LEVEL' && subjectCombination) {
      if (!mongoose.Types.ObjectId.isValid(subjectCombination)) {
        return res.status(400).json({ 
          message: 'Invalid subject combination ID format',
          details: 'The provided subject combination ID is not in a valid format.'
        });
      }

      const SubjectCombination = require('../models/SubjectCombination');
      const combination = await SubjectCombination.findById(subjectCombination);
      if (!combination) {
        return res.status(404).json({ 
          message: 'Subject combination not found',
          details: 'The specified subject combination does not exist in the system.'
        });
      }

      // Ensure the combination is for A-Level
      if (combination.educationLevel !== 'A_LEVEL') {
        return res.status(400).json({ 
          message: 'Invalid subject combination for A-Level student',
          details: 'The specified subject combination is not for A-Level education.'
        });
      }
    }

    // Add validated education level to the request body
    req.body.educationLevel = providedEducationLevel;

    // Log successful validation
    console.log('Student data validation successful');
    next();
  } catch (error) {
    console.error('Error validating student data:', error);
    res.status(500).json({ 
      message: 'Server error during student validation',
      details: error.message
    });
  }
};

/**
 * Middleware to validate subject assignments for students
 */
const validateSubjectAssignment = async (req, res, next) => {
  try {
    console.log('Validating subject assignment...');
    const { subjects } = req.body;
    const studentId = req.params.id;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ 
        message: 'Invalid subjects array',
        details: 'Please provide a non-empty array of subject IDs.'
      });
    }

    // Validate student exists
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ 
        message: 'Invalid student ID format',
        details: 'The provided student ID is not in a valid format.'
      });
    }

    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      return res.status(404).json({ 
        message: 'Student not found',
        details: 'The specified student does not exist in the system.'
      });
    }

    // Validate all subjects exist and are appropriate for the student's education level
    const validSubjects = [];
    const invalidSubjects = [];

    for (const subjectId of subjects) {
      if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        invalidSubjects.push({ id: subjectId, reason: 'Invalid ID format' });
        continue;
      }

      const subject = await Subject.findById(subjectId);
      if (!subject) {
        invalidSubjects.push({ id: subjectId, reason: 'Subject not found' });
        continue;
      }

      // Check if subject is appropriate for the student's education level
      if (subject.educationLevel && 
          subject.educationLevel !== 'BOTH' && 
          subject.educationLevel !== student.educationLevel) {
        invalidSubjects.push({ 
          id: subjectId, 
          name: subject.name,
          reason: `Subject is for ${subject.educationLevel} but student is ${student.educationLevel}` 
        });
        continue;
      }

      validSubjects.push(subjectId);
    }

    if (invalidSubjects.length > 0) {
      return res.status(400).json({ 
        message: 'Some subjects are invalid',
        details: 'One or more subjects are invalid or inappropriate for this student.',
        invalidSubjects
      });
    }

    // Add validated subjects to the request
    req.validatedSubjects = validSubjects;

    // Log successful validation
    console.log(`Validated ${validSubjects.length} subjects for student ${studentId}`);
    next();
  } catch (error) {
    console.error('Error validating subject assignment:', error);
    res.status(500).json({ 
      message: 'Server error during subject validation',
      details: error.message
    });
  }
};

module.exports = {
  validateStudentData,
  validateSubjectAssignment
};
