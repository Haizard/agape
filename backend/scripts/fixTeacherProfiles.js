const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

async function fixTeacherProfiles() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find all users with role 'teacher'
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

    // Create a map of userId to teacher profile
    const teacherProfileMap = new Map();
    for (const profile of teacherProfiles) {
      if (profile.userId) {
        teacherProfileMap.set(profile.userId.toString(), profile);
      }
    }

    // Create a map of email to teacher profile
    const emailProfileMap = new Map();
    for (const profile of teacherProfiles) {
      if (profile.email) {
        emailProfileMap.set(profile.email.toLowerCase(), profile);
      }
    }

    // Process each teacher user
    console.log('\nProcessing teacher users...');
    for (const user of teacherUsers) {
      console.log(`\nProcessing user: ${user.username} (${user.email})`);
      
      // Check if user already has a teacher profile
      let teacherProfile = teacherProfileMap.get(user._id.toString());
      
      if (!teacherProfile) {
        console.log(`No teacher profile found with userId: ${user._id}`);
        
        // Check if there's a teacher profile with matching email
        if (user.email) {
          teacherProfile = emailProfileMap.get(user.email.toLowerCase());
          
          if (teacherProfile) {
            console.log(`Found teacher profile with matching email: ${user.email}`);
            
            // Update the teacher profile with the userId
            teacherProfile.userId = user._id;
            await teacherProfile.save();
            console.log(`Updated teacher profile with userId: ${user._id}`);
            continue;
          }
        }
        
        // No matching profile found, create a new one
        console.log('Creating new teacher profile...');
        
        // Parse name from username or email
        let firstName = 'Teacher';
        let lastName = 'Name';
        
        if (user.username && user.username.includes('.')) {
          const nameParts = user.username.split('.');
          firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
          lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
        } else if (user.email && user.email.includes('@')) {
          const localPart = user.email.split('@')[0];
          if (localPart.includes('.')) {
            const nameParts = localPart.split('.');
            firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
            lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
          } else {
            firstName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
          }
        }
        
        // Generate a unique employee ID
        const existingIds = new Set(teacherProfiles.map(t => t.employeeId));
        let employeeId;
        let counter = 1;
        
        do {
          employeeId = `TCH${counter.toString().padStart(3, '0')}`;
          counter++;
        } while (existingIds.has(employeeId));
        
        // Assign random subjects (at least 2)
        const randomSubjects = [];
        const numSubjects = Math.min(subjects.length, Math.floor(2 + Math.random() * 3)); // 2-4 subjects
        
        for (let i = 0; i < numSubjects; i++) {
          const randomIndex = Math.floor(Math.random() * subjects.length);
          const randomSubject = subjects[randomIndex];
          
          if (!randomSubjects.some(s => s.toString() === randomSubject._id.toString())) {
            randomSubjects.push(randomSubject._id);
          }
        }
        
        // Create the teacher profile
        const newTeacher = new Teacher({
          firstName,
          lastName,
          email: user.email,
          gender: 'Male', // Default value
          qualification: 'Teacher',
          experience: '1 year',
          employeeId,
          subjects: randomSubjects,
          userId: user._id,
          status: 'active'
        });
        
        await newTeacher.save();
        console.log(`Created new teacher profile: ${firstName} ${lastName} (${employeeId})`);
      } else {
        console.log(`User already has a teacher profile: ${teacherProfile.firstName} ${teacherProfile.lastName} (${teacherProfile.employeeId})`);
        
        // Ensure the teacher has subjects assigned
        if (!teacherProfile.subjects || teacherProfile.subjects.length === 0) {
          console.log('Teacher has no subjects assigned, assigning random subjects...');
          
          // Assign random subjects (at least 2)
          const randomSubjects = [];
          const numSubjects = Math.min(subjects.length, Math.floor(2 + Math.random() * 3)); // 2-4 subjects
          
          for (let i = 0; i < numSubjects; i++) {
            const randomIndex = Math.floor(Math.random() * subjects.length);
            const randomSubject = subjects[randomIndex];
            
            if (!randomSubjects.some(s => s.toString() === randomSubject._id.toString())) {
              randomSubjects.push(randomSubject._id);
            }
          }
          
          teacherProfile.subjects = randomSubjects;
          await teacherProfile.save();
          console.log(`Assigned ${randomSubjects.length} subjects to teacher`);
        }
      }
    }
    
    // Find all teacher profiles again to verify
    console.log('\nVerifying teacher profiles...');
    const updatedTeacherProfiles = await Teacher.find().populate('userId');
    console.log(`Found ${updatedTeacherProfiles.length} teacher profiles`);
    
    // Display teacher login information
    console.log('\nTeacher Login Information:');
    for (const profile of updatedTeacherProfiles) {
      if (profile.userId) {
        console.log(`\nTeacher: ${profile.firstName} ${profile.lastName} (${profile.employeeId})`);
        console.log(`Username: ${profile.userId.username}`);
        console.log(`Email: ${profile.email}`);
        console.log(`Password: password123 (default)`);
        console.log(`Subjects: ${profile.subjects.length}`);
      } else {
        console.log(`\nTeacher: ${profile.firstName} ${profile.lastName} (${profile.employeeId})`);
        console.log(`WARNING: No user account linked to this teacher profile`);
      }
    }
    
    console.log('\nTeacher profiles fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing teacher profiles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
fixTeacherProfiles();
