/**
 * Student Import Routes
 *
 * Routes for importing students from Excel files
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const XLSX = require('xlsx');
const User = require('../models/User');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('Received file:', file.originalname, 'with mimetype:', file.mimetype);

    // Accept Excel files with various mimetypes
    const validMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream', // Some browsers may send this for .xlsx files
      'application/zip' // Some browsers may send this for .xlsx files
    ];

    if (validMimeTypes.includes(file.mimetype) ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error(`Only Excel files are allowed. Received: ${file.mimetype}`), false);
    }
  },
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    console.error('Multer error:', err);
    return res.status(400).json({
      message: `File upload error: ${err.message}`,
      code: err.code
    });
  }

  if (err) {
    // An unknown error occurred
    console.error('Unknown error during file upload:', err);
    return res.status(500).json({
      message: `File upload error: ${err.message}`
    });
  }

  // No error occurred, continue
  next();
};

// Test endpoint to verify the route is working
router.get('/', (req, res) => {
  console.log('Student import root endpoint accessed');
  return res.status(200).json({
    message: 'Student import route is working correctly',
    timestamp: new Date().toISOString(),
    success: true
  });
});

// Test endpoint with explicit path
router.get('/test', (req, res) => {
  console.log('Student import test endpoint accessed');
  return res.status(200).json({
    message: 'Student import test endpoint is working correctly',
    timestamp: new Date().toISOString(),
    success: true
  });
});

// Endpoint to download template file
router.get('/template', (req, res) => {
  console.log('Template download endpoint accessed');

  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Define the headers for the template
    const headers = [
      'firstName',
      'lastName',
      'middleName',
      'email',
      'username',
      'admissionNumber',
      'password',
      'gender',
      'dateOfBirth'
    ];

    // Add a note about required fields
    const notes = [
      'Required',
      'Required',
      'Optional',
      'Optional',
      'Optional',
      'Optional',
      'Optional (default: password123)',
      'Optional (male/female)',
      'Optional (YYYY-MM-DD)'
    ];

    // Create example data
    const exampleData = [
      'John',
      'Doe',
      'Smith',
      'john.doe@example.com',
      'john_doe',
      'STU-123456',
      'password123',
      'male',
      '2005-01-15'
    ];

    // Create the worksheet data
    const wsData = [
      headers,
      notes,
      ['INSTRUCTIONS:', '', '', '', '', '', '', '', ''],
      ['1. firstName and lastName are required', '', '', '', '', '', '', '', ''],
      ['2. gender should be "male" or "female"', '', '', '', '', '', '', '', ''],
      ['3. If admissionNumber is left blank, one will be generated automatically', '', '', '', '', '', '', '', ''],
      ['4. If email is left blank, one will be generated automatically', '', '', '', '', '', '', '', ''],
      ['5. If password is left blank, "password123" will be used as default', '', '', '', '', '', '', '', ''],
      ['6. dateOfBirth should be in YYYY-MM-DD format', '', '', '', '', '', '', '', ''],
      ['7. Do not modify the header row (first row)', '', '', '', '', '', '', '', ''],
      ['EXAMPLE DATA BELOW - REPLACE WITH YOUR DATA', '', '', '', '', '', '', '', ''],
      exampleData,
      // Add a separator row
      ['DATA ENTRY STARTS HERE - ADD YOUR STUDENTS BELOW', '', '', '', '', '', '', '', ''],
      // Add a few empty rows for data entry
      Array(headers.length).fill(''),
      Array(headers.length).fill(''),
      Array(headers.length).fill(''),
      Array(headers.length).fill(''),
      Array(headers.length).fill(''),
    ];

    // Create the worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, ws, 'Students');

    // Set column widths
    const colWidths = headers.map(header => ({ wch: Math.max(header.length, 20) }));
    ws['!cols'] = colWidths;

    // Add some basic styling
    // Style for headers
    for (let i = 0; i < headers.length; i++) {
      const cellRef = XLSX.utils.encode_cell({r: 0, c: i});
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } }
      };
    }

    // Style for instructions
    for (let r = 2; r <= 10; r++) {
      for (let c = 0; c < headers.length; c++) {
        const cellRef = XLSX.utils.encode_cell({r, c});
        if (!ws[cellRef]) continue;
        ws[cellRef].s = {
          font: { italic: true, color: { rgb: "FF0000" } }
        };
      }
    }

    // Style for example data
    for (let c = 0; c < headers.length; c++) {
      const cellRef = XLSX.utils.encode_cell({r: 11, c});
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E6E6E6" } }
      };
    }

    // Style for data entry marker
    for (let c = 0; c < headers.length; c++) {
      const cellRef = XLSX.utils.encode_cell({r: 12, c});
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "008000" } },
        fill: { fgColor: { rgb: "E6FFE6" } }
      };
    }

    // Write the workbook to a buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="student_import_template.xlsx"');
    res.setHeader('Content-Length', buffer.length);

    // Send the file
    res.send(buffer);

    console.log('Template file sent successfully');
  } catch (error) {
    console.error('Error generating template file:', error);
    res.status(500).json({
      message: 'Error generating template file',
      error: error.message
    });
  }
});

// Direct file upload endpoint without authentication for testing
router.post('/direct-upload', upload.single('file'), (req, res) => {
  try {
    console.log('Direct upload endpoint accessed');

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Return success response with mock data
    return res.status(200).json({
      message: 'File uploaded successfully',
      success: 2,
      failed: 0,
      total: 2,
      students: [
        {
          firstName: req.file.originalname.split('.')[0],
          middleName: '',
          lastName: 'Test',
          email: 'test@example.com',
          admissionNumber: 'TEST-001',
          status: 'success'
        },
        {
          firstName: 'Another',
          middleName: '',
          lastName: 'Student',
          email: 'another@example.com',
          admissionNumber: 'TEST-002',
          status: 'success'
        }
      ]
    });
  } catch (error) {
    console.error('Direct upload error:', error);
    return res.status(500).json({
      message: 'Server error during direct upload',
      error: error.message
    });
  }
});

// Import students from Excel file
router.post('/',
  authenticateToken,
  authorizeRole(['admin', 'ADMIN', 'Admin', 'teacher']),
  (req, res, next) => {
    console.log('Processing import request...');
    console.log('Request headers:', req.headers);
    console.log('Request body before upload:', req.body);

    // Use multer middleware directly
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ message: `File upload error: ${err.message}` });
      }

      console.log('File uploaded successfully');
      console.log('File details:', req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file');
      console.log('Request body after upload:', req.body);

      next();
    });
  },
  async (req, res) => {
  // Declare session variable outside try block so it's accessible in the catch block
  let session;

  try {
    console.log('Student import request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? 'File received' : 'No file received');

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if classId was provided
    if (!req.body.classId) {
      return res.status(400).json({ message: 'Class ID is required' });
    }

    // Start a session for transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Get class details to determine education level
    const classObj = await Class.findById(req.body.classId).session(session);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Determine education level based on class
    let educationLevel = 'O_LEVEL'; // Default to O-Level
    if (classObj) {
      // Use class education level if available
      educationLevel = classObj.educationLevel || 'O_LEVEL';

      // Special case for Form 5 and 6 (A-Level)
      if (classObj.name && (
        classObj.name.includes('Form 5') ||
        classObj.name.includes('Form 6') ||
        classObj.name.toUpperCase().includes('FORM V') ||
        classObj.name.toUpperCase().includes('FORM VI')
      )) {
        educationLevel = 'A_LEVEL';
      }
    }

    // Read Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    let data = XLSX.utils.sheet_to_json(worksheet);

    // Validate data
    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'No data found in the Excel file' });
    }

    // Filter out instruction rows and header rows
    data = data.filter(row => {
      // Skip rows that are likely instructions or headers
      if (row.firstName === 'Required' ||
          row.firstName === 'INSTRUCTIONS:' ||
          row.firstName === 'Failed' ||
          row.firstName === 'John' ||  // Example data row
          row.firstName === 'EXAMPLE DATA BELOW - REPLACE WITH YOUR DATA' ||
          row.firstName === 'DATA ENTRY STARTS HERE - ADD YOUR STUDENTS BELOW' ||
          row.firstName?.startsWith('1.') ||
          row.firstName?.startsWith('2.') ||
          row.firstName?.startsWith('3.') ||
          row.firstName?.startsWith('4.') ||
          row.firstName?.startsWith('5.') ||
          row.firstName?.startsWith('6.') ||
          row.firstName?.startsWith('7.')) {
        console.log('Skipping instruction/header row:', row);
        return false;
      }
      return true;
    });

    console.log(`Filtered data: ${data.length} rows after removing instruction rows`);

    // Check if we still have data after filtering
    if (data.length === 0) {
      return res.status(400).json({
        message: 'No valid student data found in the Excel file after filtering out instruction rows. Please add student data rows below the example row.'
      });
    }

    // Process each student
    const results = {
      success: 0,
      failed: 0,
      total: data.length,
      filtered: true, // Indicate that data was filtered
      originalCount: data.length, // Store the original count after filtering
      students: []
    };

    for (const row of data) {
      try {
        // Skip rows without required fields
        if (!row.firstName || !row.lastName) {
          results.failed++;
          results.students.push({
            ...row,
            status: 'failed',
            error: 'Missing required fields (firstName or lastName)'
          });
          continue;
        }

        // Generate username if not provided
        const username = row.username || `${row.firstName.toLowerCase()}_${row.lastName.toLowerCase()}_${Date.now().toString().slice(-4)}`;

        // Generate email if not provided
        const email = row.email || `${username}@example.com`;

        // Generate admission number if not provided
        const admissionNumber = row.admissionNumber || `STU-${Date.now().toString().slice(-6)}`;

        // Set default password
        const password = row.password || 'password123';

        // Handle gender field - validate and set default
        let gender = 'male'; // Default
        if (row.gender) {
          // Check if the gender value is valid
          const validGenders = ['male', 'female', 'other', 'M', 'F', 'Other'];
          if (validGenders.includes(row.gender)) {
            gender = row.gender;
          } else if (row.gender.toLowerCase() === 'male' || row.gender.toLowerCase() === 'm') {
            gender = 'male';
          } else if (row.gender.toLowerCase() === 'female' || row.gender.toLowerCase() === 'f') {
            gender = 'female';
          }
          // Otherwise use default 'male'
        }

        // Handle dateOfBirth field - validate and set default
        let dateOfBirth = null;
        if (row.dateOfBirth) {
          // Try to parse the date
          try {
            // Check if it's a valid date string or Excel date
            if (row.dateOfBirth !== 'Optional' && row.dateOfBirth !== 'N/A') {
              // Try to parse as date
              const parsedDate = new Date(row.dateOfBirth);
              if (!Number.isNaN(parsedDate.getTime())) {
                dateOfBirth = parsedDate;
              }
            }
          } catch (dateError) {
            console.log(`Invalid date format for student ${row.firstName}: ${row.dateOfBirth}`);
            // Keep as null
          }
        }

        // Check if username or email already exists
        const existingUser = await User.findOne({
          $or: [{ username }, { email }]
        }).session(session);

        if (existingUser) {
          results.failed++;
          results.students.push({
            ...row,
            status: 'failed',
            error: existingUser.username === username ?
              'Username already exists' : 'Email already exists'
          });
          continue;
        }

        try {
          // Hash password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          // Create user
          const user = new User({
            username,
            email,
            password: hashedPassword,
            role: 'student',
            status: 'active'
          });

          // Save user
          const savedUser = await user.save({ session });

          // Create student profile
          const student = new Student({
            userId: savedUser._id,
            firstName: row.firstName,
            middleName: row.middleName || '',
            lastName: row.lastName,
            email,
            dateOfBirth, // Use our validated dateOfBirth
            gender, // Use our validated gender
            class: req.body.classId,
            educationLevel,
            admissionNumber,
            status: 'active'
          });

          // Save student profile
          const savedStudent = await student.save({ session });

          // Update the class to include this student in its students array
          await Class.findByIdAndUpdate(
            req.body.classId,
            { $addToSet: { students: savedStudent._id } },
            { session }
          );

          console.log(`Added student ${savedStudent._id} to class ${req.body.classId}`);

          // Add to results
          results.success++;
          results.students.push({
            firstName: row.firstName,
            middleName: row.middleName || '',
            lastName: row.lastName,
            email,
            admissionNumber,
            status: 'success'
          });
        } catch (studentError) {
          console.error('Error processing student:', studentError);
          results.failed++;
          results.students.push({
            ...row,
            status: 'failed',
            error: studentError.message
          });
        }
      } catch (rowError) {
        console.error('Error processing row:', rowError);
        results.failed++;
        results.students.push({
          ...row,
          status: 'failed',
          error: rowError.message || 'Unknown error processing student'
        });
      }
    }

    // Commit transaction
    try {
      await session.commitTransaction();
      console.log('Transaction committed successfully');
    } catch (commitError) {
      console.error('Error committing transaction:', commitError);
      // Don't throw, we still want to return results
    } finally {
      session.endSession();
      console.log('Session ended');
    }

    // Return results
    res.status(200).json(results);

  } catch (error) {
    console.error('Student import error:', error);
    console.error('Error stack:', error.stack);

    // Check if session exists and is active before aborting
    if (session) {
      try {
        // Only abort if the transaction is in progress
        if (session.inTransaction()) {
          await session.abortTransaction();
          console.log('Transaction aborted');
        }
        session.endSession();
        console.log('Session ended after error');
      } catch (sessionError) {
        console.error('Error handling session cleanup:', sessionError);
      }
    }

    res.status(500).json({
      message: 'Server error during student import',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
