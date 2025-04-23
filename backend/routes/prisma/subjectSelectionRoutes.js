/**
 * Prisma Subject Selection Routes
 * 
 * These routes handle student subject selection operations using Prisma.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { createSubjectSelection, updateSubjectSelection } = require('../../services/prisma/subjectSelectionService');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/prisma/student-subject-selections
 * @desc    Create a new subject selection
 * @access  Private (Admin, Teacher)
 */
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const {
      student,
      selectionClass,
      academicYear,
      optionalSubjects,
      notes
    } = req.body;
    
    // Validate required fields
    if (!student || !selectionClass || !academicYear || !optionalSubjects) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: student, selectionClass, academicYear, optionalSubjects'
      });
    }
    
    logger.info(`[Prisma] POST /api/prisma/student-subject-selections - Creating subject selection for student ${student}`);
    
    const result = await createSubjectSelection({
      studentId: student,
      selectionClassId: selectionClass,
      academicYearId: academicYear,
      optionalSubjects,
      notes,
      approvedBy: req.user._id
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        existingSelection: result.existingSelection
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Subject selection created successfully',
      data: result.data.selection
    });
  } catch (error) {
    logger.error(`[Prisma] Error creating subject selection: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

/**
 * @route   PUT /api/prisma/student-subject-selections/:id
 * @desc    Update an existing subject selection
 * @access  Private (Admin, Teacher)
 */
router.put('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const selectionId = req.params.id;
    const { optionalSubjects, notes, status } = req.body;
    
    logger.info(`[Prisma] PUT /api/prisma/student-subject-selections/${selectionId} - Updating subject selection`);
    
    const result = await updateSubjectSelection(selectionId, {
      optionalSubjects,
      notes,
      status
    });
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Subject selection updated successfully',
      data: result.data
    });
  } catch (error) {
    logger.error(`[Prisma] Error updating subject selection: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

module.exports = router;
