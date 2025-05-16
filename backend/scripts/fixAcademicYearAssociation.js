/**
 * Script to fix academic year association for assessments
 * This script will:
 * 1. Find the current academic year
 * 2. Update all assessments to be associated with the current academic year
 */
const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const AcademicYear = require('../models/AcademicYear');

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

async function fixAcademicYearAssociation() {
  try {
    console.log('Starting academic year association fix...');
    
    // Find the current academic year
    const currentAcademicYear = await AcademicYear.findOne({ isActive: true });
    
    if (!currentAcademicYear) {
      console.error('No active academic year found. Please set an active academic year first.');
      process.exit(1);
    }
    
    console.log(`Found current academic year: ${currentAcademicYear.name} (${currentAcademicYear._id})`);
    
    // Find assessments without an academic year
    const assessmentsWithoutYear = await Assessment.find({
      $or: [
        { academicYearId: { $exists: false } },
        { academicYearId: null }
      ]
    });
    
    console.log(`Found ${assessmentsWithoutYear.length} assessments without an academic year`);
    
    // Update assessments without an academic year
    if (assessmentsWithoutYear.length > 0) {
      const updateResult = await Assessment.updateMany(
        {
          $or: [
            { academicYearId: { $exists: false } },
            { academicYearId: null }
          ]
        },
        {
          $set: { academicYearId: currentAcademicYear._id }
        }
      );
      
      console.log(`Updated ${updateResult.nModified || updateResult.modifiedCount} assessments with the current academic year`);
    }
    
    // Find all assessments
    const allAssessments = await Assessment.find({});
    console.log(`Total assessments: ${allAssessments.length}`);
    
    // Log assessment details
    for (const assessment of allAssessments) {
      console.log({
        id: assessment._id,
        name: assessment.name,
        academicYearId: assessment.academicYearId,
        term: assessment.term,
        isUniversal: assessment.isUniversal,
        isVisible: assessment.isVisible,
        status: assessment.status
      });
    }
    
    console.log('Academic year association fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during academic year association fix:', error);
    process.exit(1);
  }
}

// Run the fix
fixAcademicYearAssociation();
