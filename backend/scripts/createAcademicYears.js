const mongoose = require('mongoose');
const AcademicYear = require('../models/AcademicYear');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function createAcademicYears() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check if there are any academic years
    const existingYears = await AcademicYear.find();
    console.log(`Found ${existingYears.length} existing academic years`);

    if (existingYears.length === 0) {
      // Create sample academic years
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

      console.log('Creating sample academic years...');
      const result = await AcademicYear.insertMany(academicYears);
      console.log(`Created ${result.length} academic years`);
    } else {
      console.log('Academic years already exist. No need to create sample data.');
    }

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
createAcademicYears();
