const express = require('express');
const router = express.Router();
const CharacterAssessment = require('../models/CharacterAssessment');
const Student = require('../models/Student');
const Exam = require('../models/Exam');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get character assessment for a student
router.get('/:studentId/:examId', authenticateToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    // Find the character assessment
    const assessment = await CharacterAssessment.findOne({ studentId, examId })
      .populate('assessedBy', 'username');

    if (!assessment) {
      return res.status(404).json({ message: 'Character assessment not found' });
    }

    res.json(assessment);
  } catch (error) {
    console.error('Error fetching character assessment:', error);
    res.status(500).json({ message: 'Error fetching character assessment' });
  }
});

// Update just the comments for a character assessment
router.patch('/comments/:assessmentId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { comments } = req.body;

    // Validate required fields
    if (comments === undefined) {
      return res.status(400).json({ message: 'Comments field is required' });
    }

    // Find and update the assessment
    const assessment = await CharacterAssessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Character assessment not found' });
    }

    // Update the comments
    assessment.comments = comments;
    assessment.lastUpdated = Date.now();
    assessment.assessedBy = req.user.id;

    // Save the updated assessment
    await assessment.save();

    res.json({
      success: true,
      message: 'Comments updated successfully',
      assessment
    });
  } catch (error) {
    console.error('Error updating character assessment comments:', error);
    res.status(500).json({ message: 'Error updating character assessment comments' });
  }
});



// Create or update character assessment
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const {
      studentId,
      examId,
      academicYearId,
      classId,
      punctuality,
      discipline,
      respect,
      leadership,
      participation,
      overallAssessment,
      comments
    } = req.body;

    // Validate required fields
    if (!studentId || !examId || !academicYearId || !classId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if assessment already exists
    let assessment = await CharacterAssessment.findOne({ studentId, examId });

    if (assessment) {
      // Update existing assessment
      assessment.punctuality = punctuality || assessment.punctuality;
      assessment.discipline = discipline || assessment.discipline;
      assessment.respect = respect || assessment.respect;
      assessment.leadership = leadership || assessment.leadership;
      assessment.participation = participation || assessment.participation;
      assessment.overallAssessment = overallAssessment || assessment.overallAssessment;
      assessment.comments = comments !== undefined ? comments : assessment.comments;
      assessment.assessedBy = req.user.userId;
      assessment.assessmentDate = new Date();

      await assessment.save();

      res.json({
        success: true,
        message: 'Character assessment updated successfully',
        assessment
      });
    } else {
      // Create new assessment
      const newAssessment = new CharacterAssessment({
        studentId,
        examId,
        academicYearId,
        classId,
        punctuality: punctuality || 'Good',
        discipline: discipline || 'Good',
        respect: respect || 'Good',
        leadership: leadership || 'Good',
        participation: participation || 'Good',
        overallAssessment: overallAssessment || 'Good',
        comments: comments || '',
        assessedBy: req.user.userId,
        assessmentDate: new Date()
      });

      await newAssessment.save();

      res.status(201).json({
        success: true,
        message: 'Character assessment created successfully',
        assessment: newAssessment
      });
    }
  } catch (error) {
    console.error('Error creating/updating character assessment:', error);
    res.status(500).json({ message: 'Error creating/updating character assessment' });
  }
});

// Update character assessment comments only
router.patch('/comments/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    if (comments === undefined) {
      return res.status(400).json({ message: 'Comments field is required' });
    }

    const assessment = await CharacterAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Character assessment not found' });
    }

    // Update only the comments field
    assessment.comments = comments;
    assessment.assessedBy = req.user.userId;
    assessment.assessmentDate = new Date();

    await assessment.save();

    res.json({
      success: true,
      message: 'Character assessment comments updated successfully',
      assessment
    });
  } catch (error) {
    console.error('Error updating character assessment comments:', error);
    res.status(500).json({ message: 'Error updating character assessment comments' });
  }
});

// Delete character assessment
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await CharacterAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Character assessment not found' });
    }

    await assessment.remove();

    res.json({
      success: true,
      message: 'Character assessment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting character assessment:', error);
    res.status(500).json({ message: 'Error deleting character assessment' });
  }
});

module.exports = router;
