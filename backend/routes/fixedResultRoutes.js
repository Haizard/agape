const express = require('express');
const router = express.Router();
const FixedResult = require('../models/FixedResult');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { checkExistingMarks, preventDuplicateMarks } = require('../middleware/markEntryValidation');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Batch enter marks (DEPRECATED)
router.post('/enter-marks/batch', authenticateToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  console.log('Batch enter marks request received (DEPRECATED)');
  logger.warn(`DEPRECATED ROUTE USED: ${req.method} ${req.originalUrl} - Use /api/o-level/marks/batch instead`);

  // Forward to the new standardized route
  return res.status(301).json({
    success: false,
    message: 'This route is deprecated. Please use /api/o-level/marks/batch instead.',
    redirectTo: '/api/o-level/marks/batch'
  });
});

module.exports = router;
