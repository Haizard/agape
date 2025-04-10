const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

// Define the schema directly in this script
const academicYearSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true,
    unique: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  terms: [{
    name: {
      type: String,
      required: true
    },
    startDate: Date,
    endDate: Date
  }]
}, { timestamps: true });

// Create the model
const AcademicYear = mongoose.model('AcademicYear', academicYearSchema);

async function addAcademicYear() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Delete all existing academic years
    console.log('Deleting all existing academic years...');
    await AcademicYear.deleteMany({});
    console.log('All academic years deleted');

    // Create a new academic year
    const academicYear = new AcademicYear({
      name: '2023-2024',
      year: 2023,
      startDate: new Date('2023-09-01'),
      endDate: new Date('2024-06-30'),
      isActive: true,
      terms: [
        {
          name: 'Term 1',
          startDate: new Date('2023-09-01'),
          endDate: new Date('2023-12-15')
        },
        {
          name: 'Term 2',
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-03-30')
        },
        {
          name: 'Term 3',
          startDate: new Date('2024-04-10'),
          endDate: new Date('2024-06-30')
        }
      ]
    });

    console.log('Saving academic year...');
    const savedYear = await academicYear.save();
    console.log('Academic year saved:', savedYear);

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
addAcademicYear();
