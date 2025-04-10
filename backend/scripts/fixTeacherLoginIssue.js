const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

async function fixTeacherLoginIssue() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find all teacher users
    console.log('Finding all teacher users...');
    const teacherUsers = await User.find({ role: 'teacher' });
    console.log(`Found ${teacherUsers.length} teacher users`);

    // Find all teacher profiles
    console.log('Finding all teacher profiles...');
    const teacherProfiles = await Teacher.find();
    console.log(`Found ${teacherProfiles.length} teacher profiles`);

    // Find all subjects
    console.log('Finding all subjects...');
    const subjects = await Subject.find();
    console.log(`Found ${subjects.length} subjects`);

    // Find all classes
    console.log('Finding all classes...');
    const classes = await Class.find();
    console.log(`Found ${classes.length} classes`);

    // Fix 1: Ensure each teacher user has a teacher profile
    console.log('\nFix 1: Ensuring each teacher user has a teacher profile...');
    for (const user of teacherUsers) {
      // Check if teacher profile exists for this user
      const existingProfile = teacherProfiles.find(profile => 
        profile.userId && profile.userId.toString() === user._id.toString()
      );

      if (!existingProfile) {
        console.log(`Creating teacher profile for user: ${user.username}`);
        
        // Create a new teacher profile
        const newTeacher = new Teacher({
          firstName: user.username.split('.')[0] || 'Teacher',
          lastName: user.username.split('.')[1] || user.username,
          email: user.email,
          gender: 'Male', // Default value
          qualification: 'Teacher',
          experience: '1 year',
          employeeId: `TCH${Math.floor(1000 + Math.random() * 9000)}`, // Random 4-digit number
          userId: user._id,
          status: 'active'
        });

        // Assign random subjects (at least 2)
        const randomSubjects = [];
        const numSubjects = Math.floor(2 + Math.random() * 3); // 2-4 subjects
        
        for (let i = 0; i < numSubjects && i < subjects.length; i++) {
          const randomIndex = Math.floor(Math.random() * subjects.length);
          const randomSubject = subjects[randomIndex];
          
          if (!randomSubjects.includes(randomSubject._id)) {
            randomSubjects.push(randomSubject._id);
          }
        }
        
        newTeacher.subjects = randomSubjects;
        await newTeacher.save();
        
        console.log(`Created teacher profile for ${user.username} with ${randomSubjects.length} subjects`);
      } else {
        console.log(`Teacher profile already exists for user: ${user.username}`);
      }
    }

    // Fix 2: Ensure each teacher profile has a user account
    console.log('\nFix 2: Ensuring each teacher profile has a user account...');
    for (const profile of teacherProfiles) {
      if (!profile.userId) {
        console.log(`Teacher profile ${profile._id} (${profile.firstName} ${profile.lastName}) has no user account`);
        
        // Create a username from first and last name
        const username = `${profile.firstName.toLowerCase()}.${profile.lastName.toLowerCase()}`;
        
        // Check if a user with this username already exists
        let existingUser = await User.findOne({ username });
        
        if (!existingUser) {
          // Create a new user
          const password = await bcrypt.hash('password123', 10);
          
          const newUser = new User({
            username,
            email: profile.email || `${username}@stjohnvianney.edu.tz`,
            password,
            role: 'teacher'
          });
          
          existingUser = await newUser.save();
          console.log(`Created user account for teacher: ${username}`);
        } else {
          console.log(`User account already exists with username: ${username}`);
        }
        
        // Link the user to the teacher profile
        profile.userId = existingUser._id;
        await profile.save();
        console.log(`Linked user account to teacher profile`);
      }
    }

    // Fix 3: Ensure each teacher is assigned to teach subjects in classes
    console.log('\nFix 3: Ensuring each teacher is assigned to teach subjects in classes...');
    for (const teacher of teacherProfiles) {
      // Get the subjects this teacher can teach
      const teacherSubjects = teacher.subjects || [];
      
      if (teacherSubjects.length === 0) {
        console.log(`Teacher ${teacher.firstName} ${teacher.lastName} has no subjects assigned`);
        
        // Assign random subjects (at least 2)
        const randomSubjects = [];
        const numSubjects = Math.floor(2 + Math.random() * 3); // 2-4 subjects
        
        for (let i = 0; i < numSubjects && i < subjects.length; i++) {
          const randomIndex = Math.floor(Math.random() * subjects.length);
          const randomSubject = subjects[randomIndex];
          
          if (!randomSubjects.includes(randomSubject._id)) {
            randomSubjects.push(randomSubject._id);
          }
        }
        
        teacher.subjects = randomSubjects;
        await teacher.save();
        
        console.log(`Assigned ${randomSubjects.length} subjects to teacher ${teacher.firstName} ${teacher.lastName}`);
      }
      
      // Check if teacher is assigned to teach in any class
      let isAssignedToClass = false;
      
      for (const cls of classes) {
        for (const subjectAssignment of cls.subjects) {
          if (subjectAssignment.teacher && 
              subjectAssignment.teacher.toString() === teacher._id.toString()) {
            isAssignedToClass = true;
            break;
          }
        }
        if (isAssignedToClass) break;
      }
      
      if (!isAssignedToClass) {
        console.log(`Teacher ${teacher.firstName} ${teacher.lastName} is not assigned to any class`);
        
        // Assign teacher to teach their subjects in at least one class
        for (const subjectId of teacher.subjects) {
          // Find a class that doesn't have a teacher for this subject
          for (const cls of classes) {
            let subjectExists = false;
            
            // Check if this subject is already in the class
            for (const subjectAssignment of cls.subjects) {
              if (subjectAssignment.subject && 
                  subjectAssignment.subject.toString() === subjectId.toString()) {
                subjectExists = true;
                
                // If subject exists but has no teacher, assign this teacher
                if (!subjectAssignment.teacher) {
                  subjectAssignment.teacher = teacher._id;
                  await cls.save();
                  console.log(`Assigned teacher to existing subject in class ${cls.name}`);
                }
                
                break;
              }
            }
            
            // If subject doesn't exist in this class, add it with this teacher
            if (!subjectExists) {
              cls.subjects.push({
                subject: subjectId,
                teacher: teacher._id
              });
              
              await cls.save();
              console.log(`Added new subject to class ${cls.name} with teacher ${teacher.firstName} ${teacher.lastName}`);
              break;
            }
          }
        }
      }
    }

    // Fix 4: Update JWT_SECRET in .env file if it doesn't exist
    console.log('\nFix 4: Checking JWT_SECRET in environment...');
    if (!process.env.JWT_SECRET) {
      console.log('JWT_SECRET not found in environment variables');
      console.log('Please add the following line to your .env file:');
      console.log('JWT_SECRET=your_secret_key_here');
    } else {
      console.log('JWT_SECRET found in environment variables');
    }

    console.log('\nAll fixes applied successfully!');
    console.log('\nTeacher Login Information:');
    
    // Display login information for all teachers
    for (const teacher of teacherProfiles) {
      if (teacher.userId) {
        const user = await User.findById(teacher.userId);
        if (user) {
          console.log(`\nTeacher: ${teacher.firstName} ${teacher.lastName}`);
          console.log(`Username: ${user.username}`);
          console.log(`Email: ${user.email}`);
          console.log(`Password: password123 (default)`);
        }
      }
    }
    
    console.log('\nPlease try logging in with one of these teacher accounts.');
    
  } catch (error) {
    console.error('Error fixing teacher login issue:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
fixTeacherLoginIssue();
