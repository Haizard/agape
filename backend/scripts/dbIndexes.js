const mongoose = require('mongoose');
const config = require('../config/database');

async function createIndexes() {
  try {
    await mongoose.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Database connected for index creation');

    // Get all models
    const TeacherSubject = require('../models/TeacherSubject');
    const Class = require('../models/Class');
    const Subject = require('../models/Subject');

    // Create indexes for TeacherSubject
    await TeacherSubject.init(); // Verifies compound indexes
    console.log('TeacherSubject indexes verified');

    // Create indexes for Class
    await Class.init();
    console.log('Class indexes verified');

    // Create indexes for Subject
    await Subject.init();
    console.log('Subject indexes verified');

    process.exit(0);
  } catch (error) {
    console.error('Index creation error:', error);
    process.exit(1);
  }
}

createIndexes();