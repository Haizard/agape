const ALevelResult = require('../models/ALevelResult');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Get all A-Level results
exports.getAllResults = async (req, res) => {
  try {
    const results = await ALevelResult.find()
      .populate('studentId', 'firstName lastName rollNumber')
      .populate('examId', 'name')
      .populate('subjectId', 'name code');
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error(`Error getting all A-Level results: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error getting A-Level results',
      error: error.message
    });
  }
};

// Get A-Level results by student ID
exports.getResultsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const results = await ALevelResult.find({ studentId })
      .populate('studentId', 'firstName lastName rollNumber')
      .populate('examId', 'name')
      .populate('subjectId', 'name code');
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error(`Error getting A-Level results for student ${req.params.studentId}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error getting A-Level results for student',
      error: error.message
    });
  }
};

// Get A-Level results by exam ID
exports.getResultsByExam = async (req, res) => {
  try {
    const { examId } = req.params;
    
    const results = await ALevelResult.find({ examId })
      .populate('studentId', 'firstName lastName rollNumber')
      .populate('examId', 'name')
      .populate('subjectId', 'name code');
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error(`Error getting A-Level results for exam ${req.params.examId}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error getting A-Level results for exam',
      error: error.message
    });
  }
};

// Get A-Level results by student ID and exam ID
exports.getResultsByStudentAndExam = async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    
    const results = await ALevelResult.find({ studentId, examId })
      .populate('studentId', 'firstName lastName rollNumber')
      .populate('examId', 'name')
      .populate('subjectId', 'name code');
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error(`Error getting A-Level results for student ${req.params.studentId} and exam ${req.params.examId}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error getting A-Level results for student and exam',
      error: error.message
    });
  }
};

// Create a new A-Level result
exports.createResult = async (req, res) => {
  try {
    const { studentId, examId, subjectId, marksObtained, grade, points, isPrincipal } = req.body;
    
    // Create a new result
    const result = new ALevelResult({
      studentId,
      examId,
      subjectId,
      marksObtained,
      grade,
      points,
      isPrincipal
    });
    
    // Save the result
    await result.save();
    
    res.status(201).json({
      success: true,
      message: 'A-Level result created successfully',
      data: result
    });
  } catch (error) {
    logger.error(`Error creating A-Level result: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error creating A-Level result',
      error: error.message
    });
  }
};

// Update an A-Level result
exports.updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, examId, subjectId, marksObtained, grade, points, isPrincipal } = req.body;
    
    // Find and update the result
    const result = await ALevelResult.findByIdAndUpdate(
      id,
      {
        studentId,
        examId,
        subjectId,
        marksObtained,
        grade,
        points,
        isPrincipal
      },
      { new: true, runValidators: true }
    );
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'A-Level result not found'
      });
    }
    
    res.json({
      success: true,
      message: 'A-Level result updated successfully',
      data: result
    });
  } catch (error) {
    logger.error(`Error updating A-Level result ${req.params.id}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error updating A-Level result',
      error: error.message
    });
  }
};

// Delete an A-Level result
exports.deleteResult = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and delete the result
    const result = await ALevelResult.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'A-Level result not found'
      });
    }
    
    res.json({
      success: true,
      message: 'A-Level result deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting A-Level result ${req.params.id}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error deleting A-Level result',
      error: error.message
    });
  }
};

// Get A-Level students in a class who take a specific subject
exports.getStudentsByClassAndSubject = async (req, res) => {
  try {
    const { classId, subjectId } = req.query;
    if (!classId || !subjectId) {
      return res.status(400).json({ success: false, message: 'classId and subjectId are required' });
    }
    const Student = require('../models/Student');
    const SubjectCombination = require('../models/SubjectCombination');

    // Find students in the class, A_LEVEL, with a subjectCombination
    const students = await Student.find({
      class: classId,
      educationLevel: 'A_LEVEL',
      subjectCombination: { $ne: null }
    }).populate({
      path: 'subjectCombination',
      populate: {
        path: 'subjects compulsorySubjects',
        model: 'Subject',
        select: 'name code type educationLevel isPrincipal isCompulsory'
      }
    });

    // Only keep students whose subjectCombination is not null (i.e., they take the subject)
    const filtered = students.filter(s => s.subjectCombination);

    // For each student, build a flat array of subject IDs (from both subjects and compulsorySubjects)
    const data = filtered
      .filter(s => {
        // Check if the student takes the subject (principal or compulsory)
        const subjectIds = [];
        for (const subj of s.subjectCombination?.subjects ?? []) {
          if (subj && subj._id) subjectIds.push(subj._id.toString());
        }
        for (const subj of s.subjectCombination?.compulsorySubjects ?? []) {
          if (subj && subj._id) subjectIds.push(subj._id.toString());
        }
        return subjectIds.includes(subjectId.toString());
      })
      .map(s => {
        const subjectIds = [];
        for (const subj of s.subjectCombination?.subjects ?? []) {
          if (subj && subj._id) subjectIds.push(subj._id.toString());
        }
        for (const subj of s.subjectCombination?.compulsorySubjects ?? []) {
          if (subj && subj._id) subjectIds.push(subj._id.toString());
        }
        return {
          _id: s._id,
          firstName: s.firstName,
          lastName: s.lastName,
          rollNumber: s.rollNumber,
          admissionNumber: s.admissionNumber,
          subjectCombination: s.subjectCombination,
          subjectIds // <-- new field for easy eligibility check
        };
      });

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    logger.error(`Error getting A-Level students by class and subject: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error getting students', error: error.message });
  }
};
