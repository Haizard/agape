/**
 * Script to update existing exams with education level based on associated classes
 */
const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Class = require('../models/Class');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function updateExamEducationLevels() {
  try {
    console.log('Starting exam education level update...');
    
    // Get all exams
    const exams = await Exam.find({});
    console.log(`Found ${exams.length} exams to process`);
    
    let updatedCount = 0;
    
    // Process each exam
    for (const exam of exams) {
      // Skip exams that already have an education level set
      if (exam.educationLevel) {
        console.log(`Exam ${exam._id} (${exam.name}) already has education level: ${exam.educationLevel}`);
        continue;
      }
      
      // Check if the exam has associated classes
      if (!exam.classes || exam.classes.length === 0) {
        console.log(`Exam ${exam._id} (${exam.name}) has no associated classes, skipping`);
        continue;
      }
      
      // Get the first class ID from the exam
      const firstClassId = exam.classes[0].class;
      if (!firstClassId) {
        console.log(`Exam ${exam._id} (${exam.name}) has invalid class reference, skipping`);
        continue;
      }
      
      // Get the class details
      const classDetails = await Class.findById(firstClassId);
      if (!classDetails) {
        console.log(`Class ${firstClassId} not found for exam ${exam._id} (${exam.name}), skipping`);
        continue;
      }
      
      // Set the education level based on the class
      const educationLevel = classDetails.educationLevel;
      if (!educationLevel) {
        console.log(`Class ${firstClassId} has no education level for exam ${exam._id} (${exam.name}), skipping`);
        continue;
      }
      
      // Update the exam
      exam.educationLevel = educationLevel;
      await exam.save();
      
      console.log(`Updated exam ${exam._id} (${exam.name}) with education level: ${educationLevel}`);
      updatedCount++;
    }
    
    console.log(`Completed! Updated ${updatedCount} exams with education levels.`);
  } catch (error) {
    console.error('Error updating exam education levels:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the update function
updateExamEducationLevels();
