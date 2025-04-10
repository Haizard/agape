const express = require('express');
const router = express.Router();
const SubjectCombination = require('../models/SubjectCombination');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all subject combinations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { educationLevel, active } = req.query;

    // Build query
    const query = {};
    if (educationLevel) query.educationLevel = educationLevel;
    if (active === 'true') query.isActive = true;

    const combinations = await SubjectCombination.find(query)
      .populate('subjects', 'name code')
      .populate('compulsorySubjects', 'name code')
      .sort({ createdAt: -1 });

    res.json(combinations);
  } catch (error) {
    console.error('Error fetching subject combinations:', error);
    res.status(500).json({ message: 'Error fetching subject combinations' });
  }
});

// Get subject combination by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const combination = await SubjectCombination.findById(req.params.id)
      .populate('subjects', 'name code')
      .populate('compulsorySubjects', 'name code');

    if (!combination) {
      return res.status(404).json({ message: 'Subject combination not found' });
    }

    res.json(combination);
  } catch (error) {
    console.error('Error fetching subject combination:', error);
    res.status(500).json({ message: 'Error fetching subject combination' });
  }
});

// Create a new subject combination
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { name, code, description, educationLevel, subjects, compulsorySubjects } = req.body;

    // Validate required fields
    if (!name || !code || !educationLevel) {
      return res.status(400).json({ message: 'Name, code, and education level are required' });
    }

    // Create combination
    const combination = new SubjectCombination({
      name,
      code,
      description,
      educationLevel,
      subjects,
      compulsorySubjects,
      isActive: true,
      createdBy: req.user.userId
    });

    await combination.save();

    res.status(201).json(combination);
  } catch (error) {
    console.error('Error creating subject combination:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update a subject combination
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { name, code, description, educationLevel, subjects, compulsorySubjects, isActive } = req.body;

    // Validate required fields
    if (!name || !code || !educationLevel) {
      return res.status(400).json({ message: 'Name, code, and education level are required' });
    }

    // Find the existing combination first
    const existingCombination = await SubjectCombination.findById(req.params.id);
    if (!existingCombination) {
      return res.status(404).json({ message: 'Subject combination not found' });
    }

    // Check for name uniqueness (only if name is being changed)
    if (name !== existingCombination.name) {
      const nameExists = await SubjectCombination.findOne({ name, _id: { $ne: req.params.id } });
      if (nameExists) {
        return res.status(400).json({ message: 'A subject combination with this name already exists' });
      }
    }

    // Check for code uniqueness (only if code is being changed)
    if (code !== existingCombination.code) {
      const codeExists = await SubjectCombination.findOne({ code, _id: { $ne: req.params.id } });
      if (codeExists) {
        return res.status(400).json({ message: 'A subject combination with this code already exists' });
      }
    }

    // Update combination
    existingCombination.name = name;
    existingCombination.code = code;
    existingCombination.description = description;
    existingCombination.educationLevel = educationLevel;
    existingCombination.subjects = subjects;
    existingCombination.compulsorySubjects = compulsorySubjects;
    existingCombination.isActive = isActive;
    existingCombination.updatedBy = req.user.userId;

    await existingCombination.save();

    // Populate the subjects for the response
    await existingCombination.populate('subjects', 'name code');
    await existingCombination.populate('compulsorySubjects', 'name code');

    res.json(existingCombination);
  } catch (error) {
    console.error('Error updating subject combination:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a subject combination
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const combination = await SubjectCombination.findByIdAndDelete(req.params.id);

    if (!combination) {
      return res.status(404).json({ message: 'Subject combination not found' });
    }

    res.json({ message: 'Subject combination deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject combination:', error);
    res.status(500).json({ message: 'Error deleting subject combination' });
  }
});

module.exports = router;
