/**
 * Script to check the Student model and fix any issues
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    return true;
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    return false;
  }
}

async function checkStudentModel() {
  try {
    console.log('Checking Student model...');

    // Check if the Student collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log('Available collections:', collectionNames);

    if (!collectionNames.includes('students')) {
      console.log('Students collection does not exist yet. This is normal if no students have been created.');
    } else {
      // Check the structure of the Student model
      const studentSample = await Student.findOne();
      if (studentSample) {
        console.log('Sample student document:', studentSample);
      } else {
        console.log('No student documents found in the collection.');
      }
    }

    // Check if there are any users with role 'student'
    const studentUsers = await User.find({ role: 'student' });
    console.log(`Found ${studentUsers.length} users with role 'student'`);

    if (studentUsers.length > 0) {
      // Check if these users have corresponding student profiles
      for (const user of studentUsers) {
        const studentProfile = await Student.findOne({ userId: user._id });
        console.log(`User ${user.username} (${user._id}) - Student profile: ${studentProfile ? 'Found' : 'Missing'}`);
      }
    }

    console.log('Student model check completed.');
  } catch (err) {
    console.error('Error during Student model check:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Main function
async function main() {
  const connected = await connectToMongoDB();
  if (connected) {
    await checkStudentModel();
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  } else {
    console.error('Could not connect to MongoDB. Exiting...');
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
