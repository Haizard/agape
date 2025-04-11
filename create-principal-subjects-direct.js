// Script to create principal subjects directly in the database
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agape', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define Subject schema
const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['CORE', 'OPTIONAL'],
    default: 'CORE'
  },
  educationLevel: {
    type: String,
    enum: ['O_LEVEL', 'A_LEVEL', 'BOTH'],
    required: true,
    default: 'O_LEVEL'
  },
  isCompulsory: {
    type: Boolean,
    default: false
  },
  isPrincipal: {
    type: Boolean,
    default: false
  },
  description: String
});

// Create Subject model
const Subject = mongoose.model('Subject', subjectSchema);

// Principal subjects to create
const principalSubjects = [
  { 
    name: 'Advanced Mathematics', 
    code: 'A-MATH-2', 
    educationLevel: 'A_LEVEL', 
    isCompulsory: false, 
    isPrincipal: true,
    description: 'Advanced Mathematics for A-Level students'
  },
  { 
    name: 'Physics', 
    code: 'A-PHY-2', 
    educationLevel: 'A_LEVEL', 
    isCompulsory: false, 
    isPrincipal: true,
    description: 'Physics for A-Level students'
  },
  { 
    name: 'Chemistry', 
    code: 'A-CHEM-2', 
    educationLevel: 'A_LEVEL', 
    isCompulsory: false, 
    isPrincipal: true,
    description: 'Chemistry for A-Level students'
  },
  { 
    name: 'Biology', 
    code: 'A-BIO-2', 
    educationLevel: 'A_LEVEL', 
    isCompulsory: false, 
    isPrincipal: true,
    description: 'Biology for A-Level students'
  }
];

// Function to create subjects
async function createSubjects() {
  try {
    console.log('Creating principal subjects...');
    
    for (const subjectData of principalSubjects) {
      try {
        // Check if subject with same code already exists
        const existingSubject = await Subject.findOne({ code: subjectData.code });
        if (existingSubject) {
          console.log(`Subject with code ${subjectData.code} already exists, skipping`);
          continue;
        }
        
        // Create new subject
        const subject = new Subject(subjectData);
        const newSubject = await subject.save();
        console.log(`Created subject: ${newSubject.name} (${newSubject.code})`);
      } catch (error) {
        console.error(`Error creating subject ${subjectData.code}:`, error.message);
      }
    }
    
    console.log('Done creating principal subjects.');
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating subjects:', error);
    mongoose.connection.close();
  }
}

// Execute the function
createSubjects();
