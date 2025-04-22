/**
 * Legacy Redirect Routes
 * Handles redirects to legacy components
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const logger = require('../utils/logger');

/**
 * @route   GET /api/legacy/a-level-marks-entry
 * @desc    Serve the legacy A-Level marks entry HTML page
 * @access  Public
 */
router.get('/a-level-marks-entry', (req, res) => {
  logger.info('Serving legacy A-Level marks entry HTML page');
  res.sendFile(path.join(__dirname, '../public/legacy-a-level-marks-entry.html'));
});

module.exports = router;
