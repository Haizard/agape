const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const Subject = require('./models/Subject');
const Class = require('./models/Class');

async function main() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agape');
    
    // Get teacher
    const teacher = await Teacher.findById('67fa4b39e70d59ef7c24aedc');
    console.log('Teacher before update:', teacher.firstName, teacher.lastName);
    
    // Get subjects
    const subjects = await Subject.find();
    console.log('Available Subjects:', subjects.length);
    
    // Get class
    const classObj = await Class.findById('67fa6d5df511ccf0cff1f86c');
    console.log('Class:', classObj.name);
    
    // Get the first two subjects
    const subjectIds = subjects.slice(0, 2).map(s => s._id);
    console.log('Adding subjects to teacher:', subjectIds);
    
    // Update teacher with subjects
    teacher.subjects = subjectIds;
    await teacher.save();
    console.log('Teacher updated with subjects');
    
    // Update class with teacher for these subjects
    const updatedSubjects = classObj.subjects.map(s => {
      if (subjectIds.some(id => id.toString() === s.subject.toString())) {
        return {
          ...s,
          teacher: teacher._id
        };
      }
      return s;
    });
    
    classObj.subjects = updatedSubjects;
    await classObj.save();
    console.log('Class updated with teacher for subjects');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Done');
  }
}

main();
