/**
 * Script to create default assessments for each term
 * This script will:
 * 1. Check if default assessments already exist
 * 2. Create default assessments for each term if they don't exist
 * 3. Ensure they are universal, visible, and active
 */
const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agape', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function createDefaultAssessments() {
  try {
    console.log('Starting default assessment creation...');
    
    // Find an admin user to use as the creator
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.error('No admin user found. Cannot create assessments without a creator.');
      process.exit(1);
    }
    
    console.log(`Using admin user ${adminUser._id} as creator`);
    
    // Define default assessments for each term
    const defaultAssessments = [
      {
        name: 'Term 1 Exam',
        term: '1',
        weightage: 100,
        maxMarks: 100,
        examDate: new Date(),
        status: 'active',
        isVisible: true,
        isUniversal: true,
        createdBy: adminUser._id
      },
      {
        name: 'Term 2 Exam',
        term: '2',
        weightage: 100,
        maxMarks: 100,
        examDate: new Date(),
        status: 'active',
        isVisible: true,
        isUniversal: true,
        createdBy: adminUser._id
      },
      {
        name: 'Term 3 Exam',
        term: '3',
        weightage: 100,
        maxMarks: 100,
        examDate: new Date(),
        status: 'active',
        isVisible: true,
        isUniversal: true,
        createdBy: adminUser._id
      }
    ];
    
    // Check if default assessments already exist
    for (const assessment of defaultAssessments) {
      const existingAssessment = await Assessment.findOne({
        name: assessment.name,
        term: assessment.term,
        isUniversal: true
      });
      
      if (existingAssessment) {
        console.log(`Default assessment "${assessment.name}" for term ${assessment.term} already exists`);
        
        // Ensure it has the correct properties
        existingAssessment.isVisible = true;
        existingAssessment.status = 'active';
        await existingAssessment.save();
        
        console.log(`Updated properties for "${assessment.name}"`);
      } else {
        // Create the default assessment
        const newAssessment = new Assessment(assessment);
        await newAssessment.save();
        
        console.log(`Created default assessment "${assessment.name}" for term ${assessment.term}`);
      }
    }
    
    console.log('Default assessment creation completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during default assessment creation:', error);
    process.exit(1);
  }
}

// Run the creation script
createDefaultAssessments();
