/**
 * Database Backup Script
 *
 * This script creates a backup of all collections in the database.
 * The backup is saved as JSON files in the backup directory.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Create backup directory if it doesn't exist
const backupDir = path.join(__dirname, '../backups', new Date().toISOString().replace(/:/g, '-'));
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

async function backupDatabase() {
  try {
    console.log('Starting database backup...');
    console.log(`Backup will be saved to: ${backupDir}`);

    // Wait for connection to be established
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();

    // Process each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`Backing up ${collectionName}...`);

      // Get all documents in the collection
      const documents = await mongoose.connection.db.collection(collectionName).find({}).toArray();

      // Save documents to a JSON file
      const filePath = path.join(backupDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));

      console.log(`Backed up ${documents.length} documents from ${collectionName}`);
    }

    console.log('Database backup complete.');
    console.log(`Backup saved to: ${backupDir}`);
  } catch (err) {
    console.error('Error during database backup:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the backup
backupDatabase();
