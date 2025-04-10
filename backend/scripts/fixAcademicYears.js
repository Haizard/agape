const mongoose = require('mongoose');
const AcademicYear = require('../models/AcademicYear');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function fixAcademicYears() {
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

    // Create new academic years
    const academicYears = [
      {
        name: '2023-2024',
        year: 2023,
        startDate: new Date('2023-09-01'),
        endDate: new Date('2024-06-30'),
        isActive: true
      },
      {
        name: '2022-2023',
        year: 2022,
        startDate: new Date('2022-09-01'),
        endDate: new Date('2023-06-30'),
        isActive: false
      },
      {
        name: '2021-2022',
        year: 2021,
        startDate: new Date('2021-09-01'),
        endDate: new Date('2022-06-30'),
        isActive: false
      }
    ];

    console.log('Creating new academic years...');
    const result = await AcademicYear.insertMany(academicYears);
    console.log(`Created ${result.length} academic years`);

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
fixAcademicYears();
