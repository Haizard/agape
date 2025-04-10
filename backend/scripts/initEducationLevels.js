const mongoose = require('mongoose');
require('dotenv').config();
const EducationLevel = require('../models/EducationLevel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function initEducationLevels() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check if education levels already exist
    const existingLevels = await EducationLevel.find();
    if (existingLevels.length > 0) {
      console.log(`${existingLevels.length} education levels already exist. Skipping initialization.`);
      process.exit(0);
    }

    // Create O Level
    const oLevel = new EducationLevel({
      name: 'O_LEVEL',
      displayName: 'O Level (Form 1-4)',
      description: 'Ordinary Level Secondary Education (Form 1-4)',
      isActive: true
    });

    // Set the Map fields manually
    oLevel.gradingSystem = new Map();
    oLevel.gradingSystem.set('O_LEVEL', new Map([
      ['A', { min: 75, max: 100, points: 1 }],
      ['B', { min: 65, max: 74, points: 2 }],
      ['C', { min: 50, max: 64, points: 3 }],
      ['D', { min: 30, max: 49, points: 4 }],
      ['F', { min: 0, max: 29, points: 5 }]
    ]));

    oLevel.divisionRanges = new Map();
    oLevel.divisionRanges.set('O_LEVEL', [
      { division: 'I', min: 7, max: 14 },
      { division: 'II', min: 15, max: 21 },
      { division: 'III', min: 22, max: 25 },
      { division: 'IV', min: 26, max: 32 },
      { division: '0', min: 33, max: 36 }
    ]);

    oLevel.subjectCount = new Map();
    oLevel.subjectCount.set('O_LEVEL', { best: 7 });

    // Create A Level
    const aLevel = new EducationLevel({
      name: 'A_LEVEL',
      displayName: 'A Level (Form 5-6)',
      description: 'Advanced Level Secondary Education (Form 5-6)',
      isActive: true
    });

    // Set the Map fields manually
    aLevel.gradingSystem = new Map();
    aLevel.gradingSystem.set('A_LEVEL', new Map([
      ['A', { min: 80, max: 100, points: 1 }],
      ['B', { min: 70, max: 79, points: 2 }],
      ['C', { min: 60, max: 69, points: 3 }],
      ['D', { min: 50, max: 59, points: 4 }],
      ['E', { min: 40, max: 49, points: 5 }],
      ['S', { min: 35, max: 39, points: 6 }],
      ['F', { min: 0, max: 34, points: 7 }]
    ]));

    aLevel.divisionRanges = new Map();
    aLevel.divisionRanges.set('A_LEVEL', [
      { division: 'I', min: 3, max: 9 },
      { division: 'II', min: 10, max: 12 },
      { division: 'III', min: 13, max: 17 },
      { division: 'IV', min: 18, max: 19 },
      { division: 'V', min: 20, max: 21 }
    ]);

    aLevel.subjectCount = new Map();
    aLevel.subjectCount.set('A_LEVEL', { best: 3 });

    // Save education levels
    await oLevel.save();
    await aLevel.save();

    console.log('Education levels initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing education levels:', error);
    process.exit(1);
  }
}

// Run the initialization
initEducationLevels();
