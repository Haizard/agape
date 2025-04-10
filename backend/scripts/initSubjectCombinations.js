const mongoose = require('mongoose');
require('dotenv').config();
const SubjectCombination = require('../models/SubjectCombination');
const Subject = require('../models/Subject');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function initSubjectCombinations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check if subject combinations already exist
    const existingCombinations = await SubjectCombination.find();
    if (existingCombinations.length > 0) {
      console.log(`${existingCombinations.length} subject combinations already exist. Skipping initialization.`);
      process.exit(0);
    }

    // Find an admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    // Create General Studies subject if it doesn't exist
    let generalStudies = await Subject.findOne({ code: 'GS', educationLevel: 'A_LEVEL' });
    if (!generalStudies) {
      generalStudies = new Subject({
        name: 'General Studies',
        code: 'GS',
        type: 'CORE',
        educationLevel: 'A_LEVEL',
        isCompulsory: true,
        description: 'Compulsory subject for all A Level students',
        passMark: 35
      });

      // Set the grading system manually
      generalStudies.gradingSystem = new Map();
      generalStudies.gradingSystem.set('A_LEVEL', new Map([
        ['A', { type: Number, min: 80, max: 100, points: 1 }],
        ['B', { type: Number, min: 70, max: 79, points: 2 }],
        ['C', { type: Number, min: 60, max: 69, points: 3 }],
        ['D', { type: Number, min: 50, max: 59, points: 4 }],
        ['E', { type: Number, min: 40, max: 49, points: 5 }],
        ['S', { type: Number, min: 35, max: 39, points: 6 }],
        ['F', { type: Number, min: 0, max: 34, points: 7 }]
      ]));
      await generalStudies.save();
      console.log('Created General Studies subject');
    }

    // Define A Level subjects
    const subjectDefinitions = [
      { name: 'Physics', code: 'PHY', type: 'CORE', educationLevel: 'A_LEVEL' },
      { name: 'Chemistry', code: 'CHE', type: 'CORE', educationLevel: 'A_LEVEL' },
      { name: 'Biology', code: 'BIO', type: 'CORE', educationLevel: 'A_LEVEL' },
      { name: 'Mathematics', code: 'MAT', type: 'CORE', educationLevel: 'A_LEVEL' },
      { name: 'Geography', code: 'GEO', type: 'CORE', educationLevel: 'A_LEVEL' },
      { name: 'History', code: 'HIS', type: 'CORE', educationLevel: 'A_LEVEL' },
      { name: 'Kiswahili', code: 'KIS', type: 'CORE', educationLevel: 'A_LEVEL' },
      { name: 'Literature', code: 'LIT', type: 'CORE', educationLevel: 'A_LEVEL' },
      { name: 'Economics', code: 'ECO', type: 'CORE', educationLevel: 'A_LEVEL' },
      { name: 'Commerce', code: 'COM', type: 'CORE', educationLevel: 'A_LEVEL' },
      { name: 'Accountancy', code: 'ACC', type: 'CORE', educationLevel: 'A_LEVEL' },
      { name: 'Agriculture', code: 'AGR', type: 'CORE', educationLevel: 'A_LEVEL' },
      { name: 'Nutrition', code: 'NUT', type: 'CORE', educationLevel: 'A_LEVEL' }
    ];

    // Create subjects if they don't exist
    const subjects = {};
    for (const def of subjectDefinitions) {
      // First try to find by code and education level
      let subject = await Subject.findOne({ code: def.code, educationLevel: 'A_LEVEL' });

      // If not found, try to find by just code and update it
      if (!subject) {
        subject = await Subject.findOne({ code: def.code });
        if (subject) {
          console.log(`Updating existing subject: ${def.name} (${def.code}) to BOTH`);
          subject.educationLevel = 'BOTH';
          await subject.save();
        }
      }

      // If still not found, create a new subject
      if (!subject) {
        subject = new Subject({
          name: def.name,
          code: def.code,
          type: def.type,
          educationLevel: def.educationLevel,
          description: `${def.name} for A Level`,
          passMark: 35
        });

        // Set the grading system manually
        subject.gradingSystem = new Map();
        subject.gradingSystem.set('A_LEVEL', new Map([
          ['A', { type: Number, min: 80, max: 100, points: 1 }],
          ['B', { type: Number, min: 70, max: 79, points: 2 }],
          ['C', { type: Number, min: 60, max: 69, points: 3 }],
          ['D', { type: Number, min: 50, max: 59, points: 4 }],
          ['E', { type: Number, min: 40, max: 49, points: 5 }],
          ['S', { type: Number, min: 35, max: 39, points: 6 }],
          ['F', { type: Number, min: 0, max: 34, points: 7 }]
        ]));
        await subject.save();
        console.log(`Created subject: ${def.name}`);
      }
      subjects[def.code] = subject._id;
    }

    // Define subject combinations
    const combinationDefinitions = [
      {
        name: 'Physics, Chemistry, Mathematics',
        code: 'PCM',
        subjects: ['PHY', 'CHE', 'MAT']
      },
      {
        name: 'Physics, Chemistry, Biology',
        code: 'PCB',
        subjects: ['PHY', 'CHE', 'BIO']
      },
      {
        name: 'Chemistry, Biology, Geography',
        code: 'CBG',
        subjects: ['CHE', 'BIO', 'GEO']
      },
      {
        name: 'Chemistry, Biology, Agriculture',
        code: 'CBA',
        subjects: ['CHE', 'BIO', 'AGR']
      },
      {
        name: 'Chemistry, Biology, Nutrition',
        code: 'CBN',
        subjects: ['CHE', 'BIO', 'NUT']
      },
      {
        name: 'Physics, Geography, Mathematics',
        code: 'PGM',
        subjects: ['PHY', 'GEO', 'MAT']
      },
      {
        name: 'Economics, Geography, Mathematics',
        code: 'EGM',
        subjects: ['ECO', 'GEO', 'MAT']
      },
      {
        name: 'Economics, Commerce, Accountancy',
        code: 'ECA',
        subjects: ['ECO', 'COM', 'ACC']
      },
      {
        name: 'History, Geography, Economics',
        code: 'HGE',
        subjects: ['HIS', 'GEO', 'ECO']
      },
      {
        name: 'History, Geography, Literature',
        code: 'HGL',
        subjects: ['HIS', 'GEO', 'LIT']
      },
      {
        name: 'History, Kiswahili, Literature',
        code: 'HKL',
        subjects: ['HIS', 'KIS', 'LIT']
      },
      {
        name: 'Economics, Geography, Literature',
        code: 'EGL',
        subjects: ['ECO', 'GEO', 'LIT']
      },
      {
        name: 'History, Geography, Kiswahili',
        code: 'HGK',
        subjects: ['HIS', 'GEO', 'KIS']
      }
    ];

    // Create subject combinations
    for (const def of combinationDefinitions) {
      const subjectIds = def.subjects.map(code => subjects[code]);

      const combination = new SubjectCombination({
        name: def.name,
        code: def.code,
        educationLevel: 'A_LEVEL',
        description: `A Level combination: ${def.name}`,
        subjects: subjectIds,
        compulsorySubjects: [generalStudies._id],
        isActive: true,
        createdBy: adminUser._id
      });

      await combination.save();
      console.log(`Created subject combination: ${def.name}`);
    }

    console.log('Subject combinations initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing subject combinations:', error);
    process.exit(1);
  }
}

// Run the initialization
initSubjectCombinations();
