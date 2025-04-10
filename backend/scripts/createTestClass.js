const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

// Define the Class schema
const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  section: {
    type: String,
    default: 'A'
  },
  stream: String,
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    }
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
}, { timestamps: true });

// Create the models
const Class = mongoose.model('Class', classSchema);

// Define the AcademicYear schema
const academicYearSchema = new mongoose.Schema({
  name: String,
  year: Number,
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  terms: [{
    name: String,
    startDate: Date,
    endDate: Date
  }]
});

const AcademicYear = mongoose.model('AcademicYear', academicYearSchema);

async function createTestClass() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get the academic year
    const academicYear = await AcademicYear.findOne({ year: 2023 });
    if (!academicYear) {
      throw new Error('Academic year 2023-2024 not found');
    }
    console.log('Found academic year:', academicYear.name);

    // Create test classes
    const classes = [
      {
        name: 'Form 1',
        section: 'A',
        stream: 'Science',
        academicYear: academicYear._id
      },
      {
        name: 'Form 2',
        section: 'B',
        stream: 'Arts',
        academicYear: academicYear._id
      },
      {
        name: 'Form 3',
        section: 'C',
        stream: 'Commerce',
        academicYear: academicYear._id
      },
      {
        name: 'Form 4',
        section: 'D',
        stream: 'Science',
        academicYear: academicYear._id
      }
    ];

    console.log('Creating test classes...');
    const savedClasses = await Class.insertMany(classes);
    console.log(`Created ${savedClasses.length} test classes`);

    // Display all classes
    const allClasses = await Class.find().populate('academicYear', 'name');
    console.log('All classes:');
    allClasses.forEach(cls => {
      console.log(`- ${cls.name} ${cls.section} (${cls.stream}): Academic Year: ${cls.academicYear.name}`);
    });

    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createTestClass();
