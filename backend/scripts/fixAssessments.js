/**
 * Script to fix assessment properties
 * This script will:
 * 1. Find all assessments
 * 2. Set isVisible to true
 * 3. Set status to 'active'
 * 4. Set isUniversal to true if not already set
 * 5. Log the changes
 */
const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');

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

async function fixAssessments() {
  try {
    console.log('Starting assessment fix...');

    // Find all assessments
    const assessments = await Assessment.find({});
    console.log(`Found ${assessments.length} assessments`);

    // Log assessment properties
    assessments.forEach(a => {
      console.log({
        id: a._id,
        name: a.name,
        isUniversal: a.isUniversal,
        isVisible: a.isVisible,
        status: a.status,
        term: a.term
      });
    });

    // Count assessments with various properties
    const invisibleCount = assessments.filter(a => !a.isVisible).length;
    const nonActiveCount = assessments.filter(a => a.status !== 'active').length;
    const nonUniversalCount = assessments.filter(a => !a.isUniversal).length;

    console.log(`Found ${invisibleCount} invisible assessments`);
    console.log(`Found ${nonActiveCount} non-active assessments`);
    console.log(`Found ${nonUniversalCount} non-universal assessments`);

    // Update all assessments to have the correct properties
    const updateResult = await Assessment.updateMany(
      {},
      {
        $set: {
          isVisible: true,
          status: 'active',
          isUniversal: true
        }
      }
    );

    // Also update any assessments that might have term as a number instead of string
    const termFixResult = await Assessment.updateMany(
      { term: { $type: "number" } },
      [{ $set: { term: { $toString: "$term" } } }]
    );

    console.log(`Fixed ${termFixResult.nModified || termFixResult.modifiedCount} assessments with numeric terms`);

    console.log(`Updated ${updateResult.nModified || updateResult.modifiedCount} assessments`);

    // Verify the changes
    const updatedAssessments = await Assessment.find({});
    const stillInvisibleCount = updatedAssessments.filter(a => !a.isVisible).length;
    const stillNonActiveCount = updatedAssessments.filter(a => a.status !== 'active').length;
    const stillNonUniversalCount = updatedAssessments.filter(a => !a.isUniversal).length;

    console.log(`After update: ${stillInvisibleCount} invisible, ${stillNonActiveCount} non-active, ${stillNonUniversalCount} non-universal`);

    console.log('Assessment fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during assessment fix:', error);
    process.exit(1);
  }
}

// Run the fix
fixAssessments();
