/**
 * File Upload Test Route
 * 
 * A simple route for testing file uploads
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Test endpoint
router.get('/', (req, res) => {
  console.log('File upload test route accessed');
  return res.status(200).json({ 
    message: 'File upload test route is working correctly',
    timestamp: new Date().toISOString()
  });
});

// Simple file upload endpoint
router.post('/', upload.single('file'), (req, res) => {
  try {
    console.log('File upload test request received');
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // Return success response
    return res.status(200).json({
      message: 'File uploaded successfully',
      file: {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
      }
    });
    
  } catch (error) {
    console.error('File upload test error:', error);
    return res.status(500).json({
      message: 'Server error during file upload test',
      error: error.message
    });
  }
});

module.exports = router;
