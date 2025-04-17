// Script to check the current state of subjects in the database
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Import models
const Subject = require('./backend/models/Subject');
const SubjectCombination = require('./backend/models/SubjectCombination');

// Function to check subjects
async function checkSubjects() {
  try {
    console.log('Checking subjects in the database...');
    
    // Get all subjects
    const allSubjects = await Subject.find({});
    console.log(`Total subjects in database: ${allSubjects.length}`);
    
    // Get A-Level subjects
    const aLevelSubjects = allSubjects.filter(subject => 
      subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
    );
    console.log(`A-Level subjects: ${aLevelSubjects.length}`);
    
    // Get principal subjects
    const principalSubjects = allSubjects.filter(subject => subject.isPrincipal);
    console.log(`Principal subjects: ${principalSubjects.length}`);
    
    // List principal subjects
    if (principalSubjects.length > 0) {
      console.log('\nCurrent principal subjects:');
      principalSubjects.forEach(subject => {
        console.log(`- ${subject.name} (${subject.code})`);
      });
    } else {
      console.log('\nNo principal subjects found in the database.');
    }
    
    // List A-Level subjects that are not marked as principal
    const nonPrincipalALevelSubjects = aLevelSubjects.filter(subject => !subject.isPrincipal);
    if (nonPrincipalALevelSubjects.length > 0) {
      console.log('\nA-Level subjects NOT marked as principal:');
      nonPrincipalALevelSubjects.forEach(subject => {
        console.log(`- ${subject.name} (${subject.code})`);
      });
    }
    
    // Check subject combinations
    const combinations = await SubjectCombination.find({})
      .populate('subjects')
      .populate('compulsorySubjects');
    
    console.log(`\nTotal subject combinations: ${combinations.length}`);
    
    if (combinations.length > 0) {
      console.log('\nSubject combinations:');
      combinations.forEach(combo => {
        console.log(`\n${combo.name} (${combo.code}):`);
        
        // Principal subjects
        console.log('  Principal subjects:');
        if (combo.subjects && combo.subjects.length > 0) {
          combo.subjects.forEach(subject => {
            const isPrincipalMarked = subject.isPrincipal ? 'YES' : 'NO';
            console.log(`  - ${subject.name} (${subject.code}) - isPrincipal: ${isPrincipalMarked}`);
          });
        } else {
          console.log('  - None');
        }
        
        // Subsidiary subjects
        console.log('  Subsidiary subjects:');
        if (combo.compulsorySubjects && combo.compulsorySubjects.length > 0) {
          combo.compulsorySubjects.forEach(subject => {
            const isPrincipalMarked = subject.isPrincipal ? 'YES' : 'NO';
            console.log(`  - ${subject.name} (${subject.code}) - isPrincipal: ${isPrincipalMarked}`);
          });
        } else {
          console.log('  - None');
        }
      });
    }
    
  } catch (error) {
    console.error('Error checking subjects:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
checkSubjects();
