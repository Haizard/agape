const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Route to create an admin user
router.post('/create-admin', async (req, res) => {
  try {
    console.log('Creating admin user...');
    
    // Admin user data
    const adminData = {
      username: 'superadmin',
      email: 'superadmin@school.com',
      password: 'SuperAdmin@123',
      role: 'admin'
    };
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { email: adminData.email },
        { username: adminData.username }
      ]
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      
      // Update existing admin
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      
      return res.json({
        message: 'Admin password updated successfully',
        username: existingAdmin.username,
        email: existingAdmin.email,
        role: existingAdmin.role
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);
    
    // Create new admin user
    const adminUser = new User({
      username: adminData.username,
      email: adminData.email,
      password: hashedPassword,
      role: adminData.role
    });
    
    // Save admin user
    await adminUser.save();
    
    res.status(201).json({
      message: 'Admin user created successfully',
      username: adminData.username,
      email: adminData.email,
      role: adminData.role
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ 
      message: 'Error creating admin user',
      error: error.message
    });
  }
});

module.exports = router;
