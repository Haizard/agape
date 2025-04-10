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

async function addAcademicYears() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create academic years
    const academicYears = [
      {
        name: '2022-2023',
        year: 2022,
        startDate: new Date('2022-09-01'),
        endDate: new Date('2023-06-30'),
        isActive: false,
        terms: [
          {
            name: 'Term 1',
            startDate: new Date('2022-09-01'),
            endDate: new Date('2022-12-15')
          },
          {
            name: 'Term 2',
            startDate: new Date('2023-01-10'),
            endDate: new Date('2023-03-30')
          },
          {
            name: 'Term 3',
            startDate: new Date('2023-04-10'),
            endDate: new Date('2023-06-30')
          }
        ]
      },
      {
        name: '2024-2025',
        year: 2024,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        isActive: false,
        terms: [
          {
            name: 'Term 1',
            startDate: new Date('2024-09-01'),
            endDate: new Date('2024-12-15')
          },
          {
            name: 'Term 2',
            startDate: new Date('2025-01-10'),
            endDate: new Date('2025-03-30')
          },
          {
            name: 'Term 3',
            startDate: new Date('2025-04-10'),
            endDate: new Date('2025-06-30')
          }
        ]
      }
    ];

    console.log('Saving academic years...');
    const savedYears = await AcademicYear.insertMany(academicYears);
    console.log(`Saved ${savedYears.length} academic years`);

    // Display all academic years
    const allYears = await AcademicYear.find().sort({ year: -1 });
    console.log('All academic years:');
    allYears.forEach(year => {
      console.log(`- ${year.name} (${year.year}): ${year.isActive ? 'Active' : 'Inactive'}`);
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
addAcademicYears();
