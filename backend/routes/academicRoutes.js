const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const AcademicYear = require('../models/AcademicYear');

// Get all academic years
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/academic-years - Fetching all academic years');
    const academicYears = await AcademicYear.find().sort({ year: -1 });
    console.log(`Found ${academicYears.length} academic years`);
    res.json(academicYears);
  } catch (error) {
    console.error('Error fetching academic years:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get the current academic year (alias for active)
router.get('/current', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/academic-years/current - Redirecting to active academic year');
    const activeYear = await AcademicYear.findOne({ isActive: true });

    if (!activeYear) {
      // If no active year, get the most recent one
      const mostRecentYear = await AcademicYear.findOne().sort({ year: -1 });

      if (!mostRecentYear) {
        return res.status(404).json({ message: 'No academic years found' });
      }

      console.log(`No active academic year found, returning most recent: ${mostRecentYear.name || mostRecentYear.year}`);
      return res.json(mostRecentYear);
    }

    console.log(`Found active academic year: ${activeYear.name || activeYear.year}`);
    res.json(activeYear);
  } catch (error) {
    console.error('Error fetching current academic year:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get the active academic year
router.get('/active', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/academic-years/active - Fetching active academic year');
    const activeYear = await AcademicYear.findOne({ isActive: true });

    if (!activeYear) {
      // If no active year, get the most recent one
      const mostRecentYear = await AcademicYear.findOne().sort({ year: -1 });

      if (!mostRecentYear) {
        return res.status(404).json({ message: 'No academic years found' });
      }

      console.log(`No active academic year found, returning most recent: ${mostRecentYear.name || mostRecentYear.year}`);
      return res.json(mostRecentYear);
    }

    console.log(`Found active academic year: ${activeYear.name || activeYear.year}`);
    res.json(activeYear);
  } catch (error) {
    console.error('Error fetching active academic year:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single academic year
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }
    res.json(academicYear);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new academic year
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    // Check if an active academic year already exists
    if (req.body.isActive) {
      await AcademicYear.updateMany(
        { isActive: true },
        { $set: { isActive: false } }
      );
    }

    const academicYear = new AcademicYear(req.body);
    const savedAcademicYear = await academicYear.save();
    res.status(201).json(savedAcademicYear);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an academic year
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    // If updating to active, deactivate other active years
    if (req.body.isActive) {
      await AcademicYear.updateMany(
        { _id: { $ne: req.params.id }, isActive: true },
        { $set: { isActive: false } }
      );
    }

    const academicYear = await AcademicYear.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    res.json(academicYear);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an academic year
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    // Prevent deletion of active academic year
    if (academicYear.isActive) {
      return res.status(400).json({
        message: 'Cannot delete an active academic year. Please set another year as active first.'
      });
    }

    // Check for dependencies
    // TODO: Add checks for classes, enrollments, results, etc. that depend on this academic year

    // Use deleteOne instead of remove (which is deprecated)
    await AcademicYear.deleteOne({ _id: req.params.id });
    res.json({ message: 'Academic year deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

