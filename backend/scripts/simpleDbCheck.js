const { MongoClient } = require('mongodb');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';

async function checkDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    const db = client.db('john_vianey');
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check O-Level results
    const oLevelResultsCount = await db.collection('olevelresults').countDocuments();
    console.log(`Found ${oLevelResultsCount} O-Level results`);
    
    if (oLevelResultsCount > 0) {
      const oLevelResults = await db.collection('olevelresults').find().limit(5).toArray();
      console.log('Sample O-Level results:', JSON.stringify(oLevelResults, null, 2));
    }
    
    // Check A-Level results
    const aLevelResultsCount = await db.collection('alevelresults').countDocuments();
    console.log(`Found ${aLevelResultsCount} A-Level results`);
    
    // Check old results
    const oldResultsCount = await db.collection('results').countDocuments();
    console.log(`Found ${oldResultsCount} old results`);
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

checkDatabase();
