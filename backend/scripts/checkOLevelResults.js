const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';

async function checkOLevelResults() {
  try {
    console.log(`Connecting to MongoDB with URI: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Count O-Level results
    const count = await mongoose.connection.db.collection('olevelresults').countDocuments();
    console.log(`Found ${count} O-Level results in the database`);

    // Get a sample of O-Level results
    if (count > 0) {
      const results = await mongoose.connection.db.collection('olevelresults').find().limit(10).toArray();

      console.log('Sample of O-Level results:');
      for (const result of results) {
        console.log(`Student ID: ${result.studentId}, Subject ID: ${result.subjectId}, Marks: ${result.marksObtained}, Grade: ${result.grade}, Points: ${result.points}`);
      }
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error checking O-Level results:', error);

    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }

    process.exit(1);
  }
}

checkOLevelResults();
