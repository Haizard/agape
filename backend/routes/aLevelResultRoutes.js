const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aLevelResultController = require('../controllers/aLevelResultController');

// Get all A-Level results
router.get('/', auth, aLevelResultController.getAllResults);

// Get A-Level results by student ID
router.get('/student/:studentId', auth, aLevelResultController.getResultsByStudent);

// Get A-Level results by exam ID
router.get('/exam/:examId', auth, aLevelResultController.getResultsByExam);

// Get A-Level results by student ID and exam ID
router.get('/student/:studentId/exam/:examId', auth, aLevelResultController.getResultsByStudentAndExam);

// Get A-Level students in a class who take a specific subject
router.get('/students-by-class-and-subject', auth, aLevelResultController.getStudentsByClassAndSubject);

// Create a new A-Level result
router.post('/', auth, aLevelResultController.createResult);

// Update an A-Level result
router.put('/:id', auth, aLevelResultController.updateResult);

// Delete an A-Level result
router.delete('/:id', auth, aLevelResultController.deleteResult);

module.exports = router;
