const mongoose = require('mongoose');
const Class = require('./models/Class');
const Teacher = require('./models/Teacher');
const Subject = require('./models/Subject');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/school-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

async function assignTeacherToSubject() {
  try {
    // Find the teacher by userId
    const teacher = await Teacher.findOne({ userId: '67fa6ac7f511ccf0cff1f7e1' });
    if (!teacher) {
      console.log('Teacher not found');
      return;
    }
    console.log('Found teacher:', teacher.firstName, teacher.lastName);

    // Find the class
    const classObj = await Class.findById('67fdfc962cc25690fef0298e');
    if (!classObj) {
      console.log('Class not found');
      return;
    }
    console.log('Found class:', classObj.name);

    // Find all subjects in the class
    if (!classObj.subjects || !Array.isArray(classObj.subjects) || classObj.subjects.length === 0) {
      console.log('No subjects found in class');
      return;
    }

    console.log('Class has', classObj.subjects.length, 'subjects');

    // Assign the teacher to the first subject
    const firstSubject = classObj.subjects[0];
    if (!firstSubject.subject) {
      console.log('First subject has no subject ID');
      return;
    }

    console.log('Assigning teacher to subject:', firstSubject.subject);
    
    // Update the class to assign the teacher to the subject
    firstSubject.teacher = teacher._id;
    await classObj.save();
    
    console.log('Teacher assigned to subject successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

assignTeacherToSubject();
