const mongoose = require('mongoose');
const Student = require('../models/Student');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const Result = require('../models/Result');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log(`Connecting to MongoDB with URI: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Function to recalculate grades and points for O-Level results
async function fixOLevelGrades() {
  console.log('Fixing O-LEVEL grades and points...');
  
  try {
    const results = await OLevelResult.find();
    console.log(`Found ${results.length} O-LEVEL results`);
    
    let fixedCount = 0;
    
    for (const result of results) {
      const marks = result.marksObtained;
      let expectedGrade, expectedPoints;
      
      // Calculate expected grade and points for O-LEVEL
      if (marks >= 75) { expectedGrade = 'A'; expectedPoints = 1; }
      else if (marks >= 65) { expectedGrade = 'B'; expectedPoints = 2; }
      else if (marks >= 50) { expectedGrade = 'C'; expectedPoints = 3; }
      else if (marks >= 30) { expectedGrade = 'D'; expectedPoints = 4; }
      else { expectedGrade = 'F'; expectedPoints = 5; }
      
      // Check if grade or points are incorrect
      if (result.grade !== expectedGrade || result.points !== expectedPoints) {
        console.log(`Fixing O-LEVEL result ${result._id}: Marks=${marks}, Grade=${result.grade}->${expectedGrade}, Points=${result.points}->${expectedPoints}`);
        
        // Update the result
        await OLevelResult.updateOne(
          { _id: result._id },
          { $set: { grade: expectedGrade, points: expectedPoints } }
        );
        
        fixedCount++;
      }
    }
    
    console.log(`Fixed ${fixedCount} O-LEVEL results`);
    return fixedCount;
  } catch (error) {
    console.error('Error fixing O-LEVEL grades:', error);
    return 0;
  }
}

// Function to recalculate grades and points for A-Level results
async function fixALevelGrades() {
  console.log('Fixing A-LEVEL grades and points...');
  
  try {
    const results = await ALevelResult.find();
    console.log(`Found ${results.length} A-LEVEL results`);
    
    let fixedCount = 0;
    
    for (const result of results) {
      const marks = result.marksObtained;
      let expectedGrade, expectedPoints;
      
      // Calculate expected grade and points for A-LEVEL
      if (marks >= 80) { expectedGrade = 'A'; expectedPoints = 1; }
      else if (marks >= 70) { expectedGrade = 'B'; expectedPoints = 2; }
      else if (marks >= 60) { expectedGrade = 'C'; expectedPoints = 3; }
      else if (marks >= 50) { expectedGrade = 'D'; expectedPoints = 4; }
      else if (marks >= 40) { expectedGrade = 'E'; expectedPoints = 5; }
      else if (marks >= 35) { expectedGrade = 'S'; expectedPoints = 6; }
      else { expectedGrade = 'F'; expectedPoints = 7; }
      
      // Check if grade or points are incorrect
      if (result.grade !== expectedGrade || result.points !== expectedPoints) {
        console.log(`Fixing A-LEVEL result ${result._id}: Marks=${marks}, Grade=${result.grade}->${expectedGrade}, Points=${result.points}->${expectedPoints}`);
        
        // Update the result
        await ALevelResult.updateOne(
          { _id: result._id },
          { $set: { grade: expectedGrade, points: expectedPoints } }
        );
        
        fixedCount++;
      }
    }
    
    console.log(`Fixed ${fixedCount} A-LEVEL results`);
    return fixedCount;
  } catch (error) {
    console.error('Error fixing A-LEVEL grades:', error);
    return 0;
  }
}

// Function to remove duplicate results
async function removeDuplicateResults() {
  console.log('Removing duplicate results...');
  
  try {
    // Find duplicate O-LEVEL results
    const oLevelDuplicates = await OLevelResult.aggregate([
      {
        $group: {
          _id: {
            studentId: '$studentId',
            examId: '$examId',
            subjectId: '$subjectId'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);
    
    console.log(`Found ${oLevelDuplicates.length} sets of duplicate O-LEVEL results`);
    
    let oLevelRemoved = 0;
    
    for (const duplicate of oLevelDuplicates) {
      // Keep the first result, remove the rest
      const idsToRemove = duplicate.ids.slice(1);
      
      console.log(`Removing ${idsToRemove.length} duplicate O-LEVEL results for student ${duplicate._id.studentId}, subject ${duplicate._id.subjectId}, exam ${duplicate._id.examId}`);
      
      // Delete the duplicates
      const deleteResult = await OLevelResult.deleteMany({ _id: { $in: idsToRemove } });
      oLevelRemoved += deleteResult.deletedCount;
    }
    
    // Find duplicate A-LEVEL results
    const aLevelDuplicates = await ALevelResult.aggregate([
      {
        $group: {
          _id: {
            studentId: '$studentId',
            examId: '$examId',
            subjectId: '$subjectId'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);
    
    console.log(`Found ${aLevelDuplicates.length} sets of duplicate A-LEVEL results`);
    
    let aLevelRemoved = 0;
    
    for (const duplicate of aLevelDuplicates) {
      // Keep the first result, remove the rest
      const idsToRemove = duplicate.ids.slice(1);
      
      console.log(`Removing ${idsToRemove.length} duplicate A-LEVEL results for student ${duplicate._id.studentId}, subject ${duplicate._id.subjectId}, exam ${duplicate._id.examId}`);
      
      // Delete the duplicates
      const deleteResult = await ALevelResult.deleteMany({ _id: { $in: idsToRemove } });
      aLevelRemoved += deleteResult.deletedCount;
    }
    
    console.log(`Removed ${oLevelRemoved} duplicate O-LEVEL results and ${aLevelRemoved} duplicate A-LEVEL results`);
    return { oLevelRemoved, aLevelRemoved };
  } catch (error) {
    console.error('Error removing duplicate results:', error);
    return { oLevelRemoved: 0, aLevelRemoved: 0 };
  }
}

// Main function
async function main() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    console.log('Starting manual fix of results...');
    
    // Remove duplicate results
    const { oLevelRemoved, aLevelRemoved } = await removeDuplicateResults();
    
    // Fix grades and points
    const oLevelFixed = await fixOLevelGrades();
    const aLevelFixed = await fixALevelGrades();
    
    console.log('Results fix completed');
    console.log(`Summary:
- Removed ${oLevelRemoved} duplicate O-LEVEL results
- Removed ${aLevelRemoved} duplicate A-LEVEL results
- Fixed ${oLevelFixed} O-LEVEL grades/points
- Fixed ${aLevelFixed} A-LEVEL grades/points
`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Fix failed:', error);
    
    // Ensure we disconnect even if there's an error
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
    
    process.exit(1);
  }
}

// Run the main function
main();
