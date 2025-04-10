const express = require('express');
const router = express.Router();
const dataConsistencyMonitor = require('../utils/dataConsistencyMonitor');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Run all data consistency checks
router.get('/check', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const results = await dataConsistencyMonitor.runAllChecks();
    res.json({
      success: true,
      message: `Found ${results.totalIssues} data consistency issues`,
      results
    });
  } catch (error) {
    console.error(`Error running data consistency checks: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error running data consistency checks',
      error: error.message
    });
  }
});

// Fix all data consistency issues
router.post('/fix', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const results = await dataConsistencyMonitor.fixAllIssues();
    res.json({
      success: true,
      message: `Fixed ${results.totalFixed} data consistency issues`,
      results
    });
  } catch (error) {
    console.error(`Error fixing data consistency issues: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fixing data consistency issues',
      error: error.message
    });
  }
});

// Check for duplicate results
router.get('/check/duplicates', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const results = await dataConsistencyMonitor.checkDuplicateResults();
    res.json({
      success: true,
      message: `Found ${results.totalDuplicates} duplicate results`,
      results
    });
  } catch (error) {
    console.error(`Error checking for duplicate results: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error checking for duplicate results',
      error: error.message
    });
  }
});

// Check for incorrect grades and points
router.get('/check/grades', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const results = await dataConsistencyMonitor.checkIncorrectGradesAndPoints();
    res.json({
      success: true,
      message: `Found ${results.totalIncorrect} results with incorrect grades or points`,
      results
    });
  } catch (error) {
    console.error(`Error checking for incorrect grades and points: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error checking for incorrect grades and points',
      error: error.message
    });
  }
});

// Check for missing required fields
router.get('/check/missing', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const results = await dataConsistencyMonitor.checkMissingRequiredFields();
    res.json({
      success: true,
      message: `Found ${results.totalMissing} results with missing required fields`,
      results
    });
  } catch (error) {
    console.error(`Error checking for missing required fields: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error checking for missing required fields',
      error: error.message
    });
  }
});

// Check for orphaned results
router.get('/check/orphaned', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const results = await dataConsistencyMonitor.checkOrphanedResults();
    res.json({
      success: true,
      message: `Found ${results.totalOrphaned} orphaned results`,
      results
    });
  } catch (error) {
    console.error(`Error checking for orphaned results: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error checking for orphaned results',
      error: error.message
    });
  }
});

module.exports = router;
