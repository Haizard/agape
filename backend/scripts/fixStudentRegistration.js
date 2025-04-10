/**
 * Script to fix student registration issues
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  fixStudentModel();
})
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

async function fixStudentModel() {
  try {
    console.log('Fixing Student model...');
    
    // Get the current Student model schema
    const Student = require('../models/Student');
    console.log('Current Student model loaded');
    
    // Create a backup of the current Student model
    const studentModelPath = require.resolve('../models/Student');
    const backupPath = studentModelPath + '.backup';
    fs.copyFileSync(studentModelPath, backupPath);
    console.log(`Backup created at ${backupPath}`);
    
    // Create a new Student model file with the correct schema
    const newStudentModel = `const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'M', 'F', 'Other'],
    default: 'male'
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  admissionNumber: {
    type: String,
    required: [true, 'Admission number is required'],
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'transferred'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Add any indexes needed
studentSchema.index({ userId: 1 }, { unique: true });
studentSchema.index({ admissionNumber: 1 }, { unique: true });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;`;

    // Write the new model file
    fs.writeFileSync(studentModelPath, newStudentModel);
    console.log('Updated Student model file');
    
    // Clear the require cache to reload the model
    delete require.cache[studentModelPath];
    
    // Reload the model
    const UpdatedStudent = require('../models/Student');
    console.log('Reloaded Student model');
    
    console.log('Student model fix completed.');
  } catch (err) {
    console.error('Error fixing Student model:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}
