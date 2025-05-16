/**
 * Migration script to update existing assessments to be universal
 * Run this script with: node scripts/migrateAssessments.js
 */
const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const config = require('../config/config');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agape', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function migrateAssessments() {
  try {
    console.log('Starting assessment migration...');
    
    // Find assessments without a subjectId
    const assessmentsWithoutSubject = await Assessment.find({
      $or: [
        { subjectId: { $exists: false } },
        { subjectId: null }
      ],
      isUniversal: { $ne: true } // Only those not already marked as universal
    });
    
    console.log(`Found ${assessmentsWithoutSubject.length} assessments without a subject ID`);
    
    // Update them to be universal
    if (assessmentsWithoutSubject.length > 0) {
      const updateResult = await Assessment.updateMany(
        {
          $or: [
            { subjectId: { $exists: false } },
            { subjectId: null }
          ],
          isUniversal: { $ne: true }
        },
        {
          $set: { isUniversal: true }
        }
      );
      
      console.log(`Updated ${updateResult.nModified || updateResult.modifiedCount} assessments to be universal`);
    }
    
    // Find assessments with a subjectId but not marked as universal or non-universal
    const assessmentsWithSubject = await Assessment.find({
      subjectId: { $exists: true, $ne: null },
      isUniversal: { $exists: false }
    });
    
    console.log(`Found ${assessmentsWithSubject.length} assessments with a subject ID but no universal flag`);
    
    // Update them to be non-universal (subject-specific)
    if (assessmentsWithSubject.length > 0) {
      const updateResult = await Assessment.updateMany(
        {
          subjectId: { $exists: true, $ne: null },
          isUniversal: { $exists: false }
        },
        {
          $set: { isUniversal: false }
        }
      );
      
      console.log(`Updated ${updateResult.nModified || updateResult.modifiedCount} assessments to be subject-specific`);
    }
    
    console.log('Assessment migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during assessment migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateAssessments();
