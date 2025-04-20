const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const Subject = require('../models/Subject');


// Get all subjects
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/subjects - Fetching all subjects');

    // Build query based on parameters
    const query = {};

    // Filter by education level if provided
    if (req.query.educationLevel) {
      // If BOTH is requested, we need to find subjects with either the specific level or BOTH
      if (req.query.educationLevel === 'BOTH') {
        query.educationLevel = { $in: ['O_LEVEL', 'A_LEVEL', 'BOTH'] };
      } else {
        query.educationLevel = { $in: [req.query.educationLevel, 'BOTH'] };
      }
    }

    // Filter by subject combination if provided
    if (req.query.subjectCombination) {
      query.subjectCombinations = req.query.subjectCombination;
    }

    const subjects = await Subject.find(query)
      .populate('subjectCombinations', 'name code');

    console.log(`GET /api/subjects - Found ${subjects.length} subjects`);
    res.json(subjects);
  } catch (error) {
    console.error('GET /api/subjects - Error:', error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create new subject
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    console.log('POST /api/subjects - Creating subject with data:', req.body);
    const subject = new Subject(req.body);
    const newSubject = await subject.save();
    console.log('Subject created successfully:', newSubject);
    res.status(201).json(newSubject);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(400).json({
      message: error.message,
      code: error.code,
      name: error.name
    });
  }
});

// Create multiple subjects (bulk creation)
router.post('/bulk', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log('POST /api/subjects/bulk - Creating multiple subjects');

    if (!Array.isArray(req.body)) {
      return res.status(400).json({ message: 'Request body must be an array of subjects' });
    }

    console.log(`Attempting to create ${req.body.length} subjects`);

    // Create subjects in bulk
    const results = [];
    const errors = [];

    for (const subjectData of req.body) {
      try {
        // Check if subject with same code already exists
        const existingSubject = await Subject.findOne({ code: subjectData.code });
        if (existingSubject) {
          console.log(`Subject with code ${subjectData.code} already exists, skipping`);
          errors.push({ code: subjectData.code, error: 'Subject with this code already exists' });
          continue;
        }

        const subject = new Subject(subjectData);
        const newSubject = await subject.save();
        results.push(newSubject);
        console.log(`Created subject: ${newSubject.name} (${newSubject.code})`);
      } catch (error) {
        console.error(`Error creating subject ${subjectData.code}:`, error);
        errors.push({ code: subjectData.code, error: error.message });
      }
    }

    res.status(201).json({
      message: `Created ${results.length} subjects successfully, ${errors.length} failed`,
      created: results,
      errors: errors
    });
  } catch (error) {
    console.error('Error in bulk subject creation:', error);
    res.status(500).json({
      message: error.message,
      code: error.code,
      name: error.name
    });
  }
});

// Update subject
router.put('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    console.log(`PUT /api/subjects/${req.params.id} - Updating subject with data:`, req.body);
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) {
      console.log(`Subject not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Subject not found' });
    }
    console.log('Subject updated successfully:', subject);
    res.json(subject);
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(400).json({
      message: error.message,
      code: error.code,
      name: error.name
    });
  }
});

// Delete subject
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
  try {
    console.log(`DELETE /api/subjects/${req.params.id} - Deleting subject`);
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      console.log(`Subject not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Subject not found' });
    }
    console.log('Subject deleted successfully:', subject);
    res.json({
      message: 'Subject deleted successfully',
      deletedSubject: subject
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({
      message: error.message,
      code: error.code,
      name: error.name
    });
  }
});

// Update subject type (toggle between CORE and OPTIONAL)
router.patch('/:id/type', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log(`PATCH /api/subjects/${req.params.id}/type - Updating subject type:`, req.body);

    // Validate request body
    if (!req.body.type || !['CORE', 'OPTIONAL'].includes(req.body.type)) {
      return res.status(400).json({ message: 'Invalid subject type. Must be CORE or OPTIONAL' });
    }

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      console.log(`Subject with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Update the subject type
    subject.type = req.body.type;
    await subject.save();

    console.log(`Subject with ID ${req.params.id} type updated to ${req.body.type}`);
    res.json(subject);
  } catch (error) {
    console.error(`PATCH /api/subjects/${req.params.id}/type - Error:`, error);
    res.status(500).json({
      message: error.message,
      code: error.code,
      name: error.name
    });
  }
});

// Get all A-Level subjects
router.get('/a-level', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/subjects/a-level - Fetching all A-Level subjects');

    // Find all subjects that are A_LEVEL or BOTH
    const subjects = await Subject.find({
      educationLevel: { $in: ['A_LEVEL', 'BOTH'] }
    }).populate('subjectCombinations', 'name code');

    console.log(`GET /api/subjects/a-level - Found ${subjects.length} A-Level subjects`);
    res.json(subjects);
  } catch (error) {
    console.error('GET /api/subjects/a-level - Error:', error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all O-Level subjects
router.get('/o-level', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/subjects/o-level - Fetching all O-Level subjects');

    // Find all subjects that are O_LEVEL or BOTH
    const subjects = await Subject.find({
      educationLevel: { $in: ['O_LEVEL', 'BOTH'] }
    }).populate('subjectCombinations', 'name code');

    console.log(`GET /api/subjects/o-level - Found ${subjects.length} O-Level subjects`);
    res.json(subjects);
  } catch (error) {
    console.error('GET /api/subjects/o-level - Error:', error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all O-Level subjects for a specific class
router.get('/o-level/class/:classId', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.classId;
    console.log(`GET /api/subjects/o-level/class/${classId} - Fetching O-Level subjects for class`);

    // Find all subjects that are O_LEVEL or BOTH
    const subjects = await Subject.find({
      educationLevel: { $in: ['O_LEVEL', 'BOTH'] }
    }).populate('subjectCombinations', 'name code');

    console.log(`GET /api/subjects/o-level/class/${classId} - Found ${subjects.length} O-Level subjects`);
    res.json(subjects);
  } catch (error) {
    console.error(`GET /api/subjects/o-level/class/${req.params.classId} - Error:`, error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all A-Level subjects for a specific class
router.get('/a-level/class/:classId', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.classId;
    console.log(`GET /api/subjects/a-level/class/${classId} - Fetching A-Level subjects for class`);

    // Find all subjects that are A_LEVEL or BOTH
    const subjects = await Subject.find({
      educationLevel: { $in: ['A_LEVEL', 'BOTH'] }
    }).populate('subjectCombinations', 'name code');

    console.log(`GET /api/subjects/a-level/class/${classId} - Found ${subjects.length} A-Level subjects`);
    res.json(subjects);
  } catch (error) {
    console.error(`GET /api/subjects/a-level/class/${req.params.classId} - Error:`, error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get subject by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/subjects/${req.params.id} - Fetching subject by ID`);
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      console.log(`Subject not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Subject not found' });
    }

    console.log(`Found subject: ${subject.name} (${subject.code})`);

    // Add a delay to ensure the response is sent
    setTimeout(() => {
      res.json(subject);
    }, 100);
  } catch (error) {
    console.error(`GET /api/subjects/${req.params.id} - Error:`, error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;