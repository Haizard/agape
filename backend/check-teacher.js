const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const Subject = require('./models/Subject');
const Class = require('./models/Class');

async function main() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agape');
    
    // Get teacher
    const teacher = await Teacher.findById('67fa4b39e70d59ef7c24aedc').populate('subjects');
    console.log('Teacher:', JSON.stringify(teacher, null, 2));
    
    // Get subjects
    const subjects = await Subject.find();
    console.log('Available Subjects:', subjects.map(s => ({ _id: s._id.toString(), name: s.name })));
    
    // Get class
    const classObj = await Class.findById('67fa6d5df511ccf0cff1f86c')
      .populate('subjects.subject')
      .populate('subjects.teacher');
    console.log('Class:', JSON.stringify(classObj, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

main();
