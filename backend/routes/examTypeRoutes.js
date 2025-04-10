const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const ExamType = require('../models/ExamType');

// Get all exam types
router.get('/', authenticateToken, async (req, res) => {
  try {
    const examTypes = await ExamType.find();
    res.json(examTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new exam type (admin only)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const examType = new ExamType(req.body);
    const newExamType = await examType.save();
    res.status(201).json(newExamType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update exam type (admin only)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const examType = await ExamType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!examType) {
      return res.status(404).json({ message: 'Exam type not found' });
    }
    res.json(examType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete exam type (admin only)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const examType = await ExamType.findByIdAndDelete(req.params.id);
    if (!examType) {
      return res.status(404).json({ message: 'Exam type not found' });
    }
    res.json({ message: 'Exam type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;