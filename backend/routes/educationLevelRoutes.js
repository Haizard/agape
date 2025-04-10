const express = require('express');
const router = express.Router();
const EducationLevel = require('../models/EducationLevel');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all education levels
router.get('/', authenticateToken, async (req, res) => {
  try {
    const educationLevels = await EducationLevel.find();
    res.json(educationLevels);
  } catch (error) {
    console.error('Error fetching education levels:', error);
    res.status(500).json({ message: 'Error fetching education levels' });
  }
});

// Get education level by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const educationLevel = await EducationLevel.findById(req.params.id);
    if (!educationLevel) {
      return res.status(404).json({ message: 'Education level not found' });
    }
    res.json(educationLevel);
  } catch (error) {
    console.error('Error fetching education level:', error);
    res.status(500).json({ message: 'Error fetching education level' });
  }
});

// Create a new education level
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const educationLevel = new EducationLevel(req.body);
    const newEducationLevel = await educationLevel.save();
    res.status(201).json(newEducationLevel);
  } catch (error) {
    console.error('Error creating education level:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update an education level
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const educationLevel = await EducationLevel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!educationLevel) {
      return res.status(404).json({ message: 'Education level not found' });
    }
    res.json(educationLevel);
  } catch (error) {
    console.error('Error updating education level:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete an education level
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const educationLevel = await EducationLevel.findByIdAndDelete(req.params.id);
    if (!educationLevel) {
      return res.status(404).json({ message: 'Education level not found' });
    }
    res.json({ message: 'Education level deleted successfully' });
  } catch (error) {
    console.error('Error deleting education level:', error);
    res.status(500).json({ message: 'Error deleting education level' });
  }
});

module.exports = router;
