const mongoose = require('mongoose');
const Subject = require('./models/Subject');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/school_management')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Define optional subjects for O-Level
    const optionalSubjects = [
      {
        name: 'BIOLOGY',
        code: 'BIO',
        type: 'OPTIONAL',
        educationLevel: 'O_LEVEL',
        description: 'Biology for O-Level students',
        passMark: 40
      },
      {
        name: 'COMPUTER SCIENCE',
        code: 'CS',
        type: 'OPTIONAL',
        educationLevel: 'O_LEVEL',
        description: 'Computer Science for O-Level students',
        passMark: 40
      },
      {
        name: 'BOOKKEEPING',
        code: 'BK',
        type: 'OPTIONAL',
        educationLevel: 'O_LEVEL',
        description: 'Bookkeeping for O-Level students',
        passMark: 40
      },
      {
        name: 'AGRICULTURE',
        code: 'AGRI',
        type: 'OPTIONAL',
        educationLevel: 'O_LEVEL',
        description: 'Agriculture for O-Level students',
        passMark: 40
      }
    ];
    
    // Add each subject if it doesn't already exist
    for (const subjectData of optionalSubjects) {
      try {
        // Check if subject already exists
        const existingSubject = await Subject.findOne({ code: subjectData.code });
        
        if (existingSubject) {
          // Update the existing subject to be optional if it's not already
          if (existingSubject.type !== 'OPTIONAL') {
            existingSubject.type = 'OPTIONAL';
            await existingSubject.save();
            console.log(`Updated subject ${existingSubject.name} to be OPTIONAL`);
          } else {
            console.log(`Subject ${existingSubject.name} already exists as OPTIONAL`);
          }
        } else {
          // Create new subject
          const newSubject = new Subject(subjectData);
          await newSubject.save();
          console.log(`Created new optional subject: ${newSubject.name}`);
        }
      } catch (error) {
        console.error(`Error processing subject ${subjectData.name}:`, error);
      }
    }
    
    // Verify optional subjects
    const allOptionalSubjects = await Subject.find({ type: 'OPTIONAL' });
    console.log(`\nTotal optional subjects: ${allOptionalSubjects.length}`);
    console.log('Optional subjects:', allOptionalSubjects.map(s => s.name).join(', '));
    
    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });
