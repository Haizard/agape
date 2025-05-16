/**
 * Script to identify cross-contaminated marks in the database
 * This script will:
 * 1. Find all results that have the same studentId and assessmentId but different subjectIds
 * 2. Log the details for manual review
 */
const mongoose = require('mongoose');
const Result = require('../models/Result');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agape')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function identifyCrossContaminatedMarks() {
  try {
    console.log('Starting cross-contaminated marks identification...');
    
    // Find all results
    const results = await Result.find({});
    console.log(`Found ${results.length} results`);
    
    // Group results by studentId and assessmentId
    const resultGroups = {};
    for (const result of results) {
      // Skip results without assessmentId (older data)
      if (!result.assessmentId) continue;
      
      const key = `${result.studentId}-${result.assessmentId}`;
      if (!resultGroups[key]) {
        resultGroups[key] = [];
      }
      resultGroups[key].push(result);
    }
    
    // Find groups with multiple results (potential cross-contamination)
    const crossContaminatedGroups = Object.entries(resultGroups)
      .filter(([_, group]) => group.length > 1)
      .map(([key, group]) => ({ key, group }));
    
    console.log(`Found ${crossContaminatedGroups.length} potential cross-contaminated groups`);
    
    // Log details of each cross-contaminated group
    for (const { key, group } of crossContaminatedGroups) {
      const [studentId, assessmentId] = key.split('-');
      console.log(`\nGroup for student ${studentId}, assessment ${assessmentId}:`);
      
      for (const result of group) {
        console.log(`  Result ${result._id}: subject=${result.subjectId}, marks=${result.marksObtained}`);
      }
    }
    
    console.log('\nCross-contaminated marks identification completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during cross-contaminated marks identification:', error);
    process.exit(1);
  }
}

// Run the identification
identifyCrossContaminatedMarks();
