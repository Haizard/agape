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

// Import teacher profile middleware
const { validateTeacherProfileData, ensureTeacherProfileCreation } = require('../middleware/teacherProfileCreation');
const { validateEnhancedTeacherProfile, ensureTeacherProfileIntegrity } = require('../middleware/enhancedTeacherProfileValidation');
const teacherProfileService = require('../services/teacherProfileService');

// Get the current teacher's profile
router.get('/profile/me', authenticateToken, authorizeRole(['teacher', 'admin']), ensureTeacherProfileIntegrity, async (req, res) => {
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
        success: false,
        message: 'Teacher profile not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher profile',
      error: error.message
    });
  }
});

module.exports = router;
