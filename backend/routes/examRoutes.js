const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
const Exam = require('../models/Exam');
const Result = require('../models/Result');

// Create a new exam
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/exams - Creating exam with data:', req.body);

    // Validate required fields
    if (!req.body.name || !req.body.type || !req.body.academicYear || !req.body.term) {
      return res.status(400).json({ message: 'Missing required fields: name, type, academicYear, and term are required' });
    }

    // Create and save the exam
    const exam = new Exam(req.body);
    const savedExam = await exam.save();

    console.log('Exam created successfully:', savedExam);
    res.status(201).json(savedExam);
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(400).json({
      message: error.message,
      code: error.code,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all exams
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/exams - Fetching exams with params:', req.query);

    // Build query based on request parameters
    const query = {};

    // Filter by academic year if provided
    if (req.query.academicYearId) {
      query.academicYear = req.query.academicYearId;
    }

    // Filter by exam type if provided
    if (req.query.examTypeId) {
      query.examType = req.query.examTypeId;
    }

    // Filter by class if provided
    if (req.query.classId) {
      query['classes.class'] = req.query.classId;
    }

    console.log('Query:', query);

    const exams = await Exam.find(query)
      .populate('examType', 'name maxMarks')
      .populate('academicYear', 'name year')
      .sort({ createdAt: -1 });

    console.log(`Found ${exams.length} exams`);
    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific exam by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/exams/${req.params.id} - Fetching exam by ID`);
    const exam = await Exam.findById(req.params.id)
      .populate('examType', 'name maxMarks')
      .populate('academicYear', 'name year');

    if (!exam) {
      console.log(`Exam with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    console.log('Exam found:', exam);
    res.json(exam);
  } catch (error) {
    console.error(`Error fetching exam with ID ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Update an exam by ID
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`PUT /api/exams/${req.params.id} - Updating exam`);
    console.log('Update data:', req.body);

    // Validate required fields
    if (!req.body.name || !req.body.type || !req.body.academicYear || !req.body.term) {
      return res.status(400).json({ message: 'Missing required fields: name, type, academicYear, and term are required' });
    }

    // Find and update the exam
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!exam) {
      console.log(`Exam with ID ${req.params.id} not found for update`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    console.log('Exam updated successfully:', exam);
    res.json(exam);
  } catch (error) {
    console.error(`Error updating exam with ID ${req.params.id}:`, error);
    res.status(400).json({
      message: error.message,
      code: error.code,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete an exam by ID
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`DELETE /api/exams/${req.params.id} - Deleting exam`);

    // Check if there are any results associated with this exam
    const results = await Result.find({ examId: req.params.id });
    if (results.length > 0) {
      console.log(`Cannot delete exam with ID ${req.params.id} because it has ${results.length} results associated with it`);
      return res.status(400).json({
        message: 'Cannot delete this exam because it has results associated with it. Delete the results first or archive the exam instead.'
      });
    }

    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      console.log(`Exam with ID ${req.params.id} not found for deletion`);
      return res.status(404).json({ message: 'Exam not found' });
    }

    console.log('Exam deleted successfully:', exam);
    res.json({ message: 'Exam deleted successfully', exam });
  } catch (error) {
    console.error(`Error deleting exam with ID ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
