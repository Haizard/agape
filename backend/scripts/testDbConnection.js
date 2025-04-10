const mongoose = require('mongoose');

async function testConnection() {
  const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';

  try {
    console.log(`Connecting to MongoDB with URI: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB');

    // Get database stats
    const stats = await mongoose.connection.db.stats();
    console.log('Database stats:', stats);

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
  }
}

testConnection().catch(err => {
  console.error('Error in test connection script:', err);
  process.exit(1);
});
