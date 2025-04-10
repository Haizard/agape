const mongoose = require('mongoose');
const FeeSchedule = require('./backend/models/FeeSchedule');
const AcademicYear = require('./backend/models/AcademicYear');
const User = require('./backend/models/User');

mongoose.connect('mongodb://localhost:27017/school_management', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      // Find an active academic year
      const academicYear = await AcademicYear.findOne({ isActive: true });
      if (!academicYear) {
        console.log('No active academic year found');
        process.exit(1);
      }
      
      // Find an admin user
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        console.log('No admin user found');
        process.exit(1);
      }
      
      // Create a sample fee schedule
      const feeSchedule = new FeeSchedule({
        name: 'Sample Fee Schedule',
        description: 'A sample fee schedule for testing',
        academicYear: academicYear._id,
        installments: [
          {
            name: 'First Term',
            dueDate: new Date('2023-09-01'),
            percentage: 40
          },
          {
            name: 'Second Term',
            dueDate: new Date('2024-01-15'),
            percentage: 30
          },
          {
            name: 'Third Term',
            dueDate: new Date('2024-04-15'),
            percentage: 30
          }
        ],
        enableReminders: true,
        reminderDays: 7,
        isActive: true,
        createdBy: adminUser._id
      });
      
      await feeSchedule.save();
      console.log('Sample fee schedule created successfully:', feeSchedule);
      process.exit(0);
    } catch (error) {
      console.error('Error creating sample fee schedule:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
