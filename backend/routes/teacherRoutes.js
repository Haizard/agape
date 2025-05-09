const express = require('express');
const router = express.Router();
const TeacherAssignment = require('../models/TeacherAssignment');
const TeacherSubject = require('../models/TeacherSubject');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const User = require('../models/User');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const mongoose = require('mongoose');
const teacherAuthController = require('../controllers/teacherAuthController');
const enhancedTeacherSubjectService = require('../services/enhancedTeacherSubjectService');
const enhancedTeacherAuth = require('../middleware/enhancedTeacherAuth');

// Import teacher profile middleware
const { validateTeacherProfileData, ensureTeacherProfileCreation } = require('../middleware/teacherProfileCreation');
const { validateEnhancedTeacherProfile, ensureTeacherProfileIntegrity } = require('../middleware/enhancedTeacherProfileValidation');
const teacherProfileService = require('../services/teacherProfileService');

// Get the current teacher's profile
router.get('/profile/me', 
  authenticateToken,
  authorizeRole(['teacher', 'admin']),
  async (req, res) => {
    try {
    console.log('GET /api/teachers/profile/me - Fetching current teacher profile');

    // Get the user ID from the authenticated user
    const userId = req.user.userId;

    if (!userId) {
      console.log('No user ID found in the authenticated user');
      return res.status(403).json({ message: 'Not authorized' });
    }

    // For admin users, create a temporary profile
    if (req.user.role === 'admin') {
      console.log('Creating temporary teacher profile for admin user');
      const adminUser = await User.findById(userId);

      if (!adminUser) {
        return res.status(404).json({ message: 'Admin user not found' });
      }

      // Create a temporary teacher object
      const tempTeacher = {
        _id: 'admin-' + userId,
        firstName: adminUser.username || 'Admin',
        lastName: 'User',
        email: adminUser.email || 'admin@example.com',
        isAdmin: true,
        isTemporary: true,
        subjects: [],
        status: 'active'
      };

      return res.json({
        success: true,
        teacher: tempTeacher
      });
    }

    // Sync and get teacher profile using the service
    const teacher = await teacherProfileService.syncTeacherProfile(userId);
    
    // Get full profile with user details and subjects
    const fullProfile = await teacherProfileService.getTeacherWithUser(teacher._id);
    
    console.log(`Found teacher profile: ${fullProfile._id}`);
    return res.json({
      success: true,
      teacher: fullProfile
    });

  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    
    if (error.message === 'Invalid user or not a teacher') {
      return res.status(404).json({
        code: 'TEACHER_PROFILE_NOT_FOUND',
        message: 'Complete teacher profile not found',
        userId: req.user.userId
      });
    }

    res.status(500).json({
      code: 'PROFILE_FETCH_FAILED',
      message: 'Failed to retrieve teacher profile'
    });
  }
});

// Teacher subjects endpoint
// Secure route with JWT auth and role validation
router.get('/:classId/subjects', 
  authenticateToken,
  authorizeRole(['teacher']),
  enhancedTeacherAuth.ensureTeacherProfile,
  async (req, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.teacher._id;

      // Validate teacher-class assignment
      const isAssigned = await TeacherAssignment.exists({
        teacher: teacherId,
        class: classId,
        status: 'active'
      });

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access - Teacher not assigned to this class'
        });
      }

      // Get assigned subjects with population
      const assignments = await TeacherAssignment.find({
        teacher: teacherId,
        class: classId
      }).populate({
        path: 'subject',
        select: 'name code type assessmentCriteria',
        model: 'Subject'
      });

      // Extract subjects with assessment criteria
      const subjects = assignments.map(assignment => ({
        _id: assignment.subject._id,
        name: assignment.subject.name,
        code: assignment.subject.code,
        type: assignment.subject.type,
        assessmentCriteria: assignment.subject.assessmentCriteria
      }));

      // Returns subjects with their assessment structure
      res.json({
        subjects: [{
          _id: subject._id,
          assessmentCriteria: subject.assessmentCriteria // Contains marking schema
        }]
      });
    } catch (err) {
      console.error('Error fetching teacher subjects:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects',
        error: err.message
      });
    }
});

module.exports = router;
