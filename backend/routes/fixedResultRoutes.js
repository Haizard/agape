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

// Batch enter marks
router.post('/enter-marks/batch', authenticateToken, authorizeRole(['teacher', 'admin']), checkExistingMarks, preventDuplicateMarks, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('Batch enter marks request received');
    console.log('User:', req.user);
    console.log('Request body:', req.body);

    const { marksData } = req.body;

    if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
      return res.status(400).json({ message: 'Invalid marks data. Expected an array of marks.' });
    }

    // Validate each mark and fix any issues
    const validationErrors = [];
    marksData.forEach((mark, index) => {
      // Check for missing fields
      if (!mark.studentId) validationErrors.push(`Mark ${index + 1}: Missing studentId`);
      if (!mark.subjectId) validationErrors.push(`Mark ${index + 1}: Missing subjectId`);
      if (!mark.academicYearId) validationErrors.push(`Mark ${index + 1}: Missing academicYearId`);
      if (mark.marksObtained === undefined) validationErrors.push(`Mark ${index + 1}: Missing marksObtained`);

      // Special handling for classId
      if (!mark.classId) {
        console.log(`Mark ${index + 1}: Missing classId, using fallback`);
        // Use a fallback class ID
        mark.classId = '67f2fe0fdcc60fd7fef2ef36';
      }

      // Ensure classId is a valid ObjectId
      try {
        if (!mongoose.Types.ObjectId.isValid(mark.classId)) {
          console.log(`Mark ${index + 1}: Invalid classId format, using fallback`);
          mark.classId = '67f2fe0fdcc60fd7fef2ef36';
        }
      } catch (err) {
        console.log(`Mark ${index + 1}: Error validating classId, using fallback`);
        mark.classId = '67f2fe0fdcc60fd7fef2ef36';
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: validationErrors
      });
    }

    // Check if teacher is authorized to enter marks for these subjects
    // Skip this check for admin users
    if (req.user.role === 'teacher') {
      // Find the teacher by userId
      const teacher = await Teacher.findOne({ userId: req.user.userId });
      if (!teacher) {
        return res.status(403).json({ message: 'Teacher profile not found' });
      }

      // Check if teacher is assigned to these subjects
      for (const mark of marksData) {
        const classItem = await Class.findOne({
          _id: mark.classId,
          'subjects': {
            $elemMatch: {
              'subject': mark.subjectId,
              'teacher': teacher._id
            }
          }
        });

        if (!classItem) {
          return res.status(403).json({
            message: `You are not authorized to enter marks for subject ${mark.subjectId} in class ${mark.classId}`
          });
        }
      }
    }

    const results = [];

    for (const markData of marksData) {
      const {
        studentId,
        examId,
        academicYearId,
        examTypeId,
        subjectId,
        classId,
        marksObtained,
        examName
      } = markData;

      // Calculate grade based on marks
      let grade;
      if (marksObtained >= 80) grade = 'A';
      else if (marksObtained >= 65) grade = 'B';
      else if (marksObtained >= 50) grade = 'C';
      else if (marksObtained >= 40) grade = 'D';
      else grade = 'F';

      // Check if a result already exists for this student, exam, and subject
      const existingResult = await FixedResult.findOne({
        studentId,
        examId: examId || { $exists: false },
        academicYearId,
        examTypeId: examTypeId || { $exists: false },
        subjectId,
        classId
      });

      if (existingResult) {
        // Update existing result
        existingResult.marksObtained = marksObtained;
        existingResult.grade = grade;
        existingResult.updatedAt = Date.now();

        // Update examName if provided
        if (examName) {
          existingResult.examName = examName;
        }

        await existingResult.save({ session });
        results.push(existingResult);
      } else {
        // Create new result
        const resultData = {
          studentId,
          academicYearId,
          subjectId,
          classId,
          marksObtained,
          grade,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        // Add optional fields if provided
        if (examId) resultData.examId = examId;
        if (examTypeId) resultData.examTypeId = examTypeId;
        if (examName) resultData.examName = examName;

        console.log('Creating new result with data:', resultData);

        const newResult = new FixedResult(resultData);

        // Validate the new result
        try {
          await newResult.validate();
        } catch (validationError) {
          console.error('Validation error:', validationError);
          throw new Error(`Result validation failed: ${Object.keys(validationError.errors).join(', ')}`);
        }

        await newResult.save({ session });
        results.push(newResult);
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: `Successfully processed ${results.length} results`,
      results
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error entering batch marks:', error);
    res.status(400).json({ message: `Error entering marks: ${error.message}` });
  }
});

module.exports = router;
