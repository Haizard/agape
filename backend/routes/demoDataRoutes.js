/**
 * Demo Data Routes
 * 
 * This file contains routes for serving demo data for testing purposes.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');
const { generateForm5ClassReport } = require('../data/demoForm5Results');
const demoSubjectCombinations = require('../data/demoSubjectCombinations');
const demoForm5Students = require('../data/demoForm5Students');

// Get demo Form 5 class report
router.get('/form5-class-report', authenticateToken, (req, res) => {
  try {
    const report = generateForm5ClassReport();
    return res.json(formatSuccessResponse(report, 'Demo Form 5 class report generated successfully'));
  } catch (error) {
    console.error('Error generating demo Form 5 class report:', error);
    return res.status(500).json(formatErrorResponse(error, 'demo/form5-class-report'));
  }
});

// Get demo subject combinations
router.get('/subject-combinations', authenticateToken, (req, res) => {
  try {
    return res.json(formatSuccessResponse(demoSubjectCombinations, 'Demo subject combinations retrieved successfully'));
  } catch (error) {
    console.error('Error retrieving demo subject combinations:', error);
    return res.status(500).json(formatErrorResponse(error, 'demo/subject-combinations'));
  }
});

// Get demo Form 5 students
router.get('/form5-students', authenticateToken, (req, res) => {
  try {
    return res.json(formatSuccessResponse(demoForm5Students, 'Demo Form 5 students retrieved successfully'));
  } catch (error) {
    console.error('Error retrieving demo Form 5 students:', error);
    return res.status(500).json(formatErrorResponse(error, 'demo/form5-students'));
  }
});

// Get a specific demo student by ID
router.get('/form5-students/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const student = demoForm5Students.find(s => s.id === id);
    
    if (!student) {
      return res.status(404).json(formatErrorResponse(new Error('Student not found'), 'demo/form5-students/:id'));
    }
    
    return res.json(formatSuccessResponse(student, 'Demo student retrieved successfully'));
  } catch (error) {
    console.error('Error retrieving demo student:', error);
    return res.status(500).json(formatErrorResponse(error, 'demo/form5-students/:id'));
  }
});

module.exports = router;
