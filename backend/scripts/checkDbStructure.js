const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';

async function checkDbStructure() {
  try {
    console.log(`Connecting to MongoDB with URI: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    
    // Get database stats
    const stats = await mongoose.connection.db.stats();
    console.log('Database stats:', stats);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check if result collections exist
    const hasOLevelResults = collections.some(c => c.name === 'olevelresults');
    const hasALevelResults = collections.some(c => c.name === 'alevelresults');
    const hasResults = collections.some(c => c.name === 'results');
    
    console.log(`Has OLevelResults collection: ${hasOLevelResults}`);
    console.log(`Has ALevelResults collection: ${hasALevelResults}`);
    console.log(`Has Results collection: ${hasResults}`);
    
    // Check for any results in the database
    if (hasResults) {
      const resultsCount = await mongoose.connection.db.collection('results').countDocuments();
      console.log(`Results collection has ${resultsCount} documents`);
      
      if (resultsCount > 0) {
        // Get a sample of results
        const resultsSample = await mongoose.connection.db.collection('results').find().limit(5).toArray();
        console.log('Results sample:', JSON.stringify(resultsSample, null, 2));
      }
    }
    
    // Check for students
    const hasStudents = collections.some(c => c.name === 'students');
    if (hasStudents) {
      const studentsCount = await mongoose.connection.db.collection('students').countDocuments();
      console.log(`Students collection has ${studentsCount} documents`);
      
      if (studentsCount > 0) {
        // Get a sample of students
        const studentsSample = await mongoose.connection.db.collection('students').find().limit(5).toArray();
        console.log('Students sample:', JSON.stringify(studentsSample, null, 2));
      }
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error checking database structure:', error);
    
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
    
    process.exit(1);
  }
}

checkDbStructure();
