/**
 * Database Restore Script
 * 
 * This script restores a database backup created by the backupDatabase.js script.
 * It will restore all collections from the JSON files in the specified backup directory.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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

async function restoreDatabase(backupPath) {
  try {
    console.log('Starting database restore...');
    console.log(`Restoring from: ${backupPath}`);
    
    // Check if backup directory exists
    if (!fs.existsSync(backupPath)) {
      console.error(`Backup directory not found: ${backupPath}`);
      process.exit(1);
    }
    
    // Get all JSON files in the backup directory
    const files = fs.readdirSync(backupPath)
      .filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
      console.error('No backup files found in the specified directory');
      process.exit(1);
    }
    
    console.log(`Found ${files.length} backup files`);
    
    // Process each backup file
    for (const file of files) {
      const collectionName = path.basename(file, '.json');
      console.log(`Restoring ${collectionName}...`);
      
      // Read the backup file
      const filePath = path.join(backupPath, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (data.length === 0) {
        console.log(`No documents to restore for ${collectionName}`);
        continue;
      }
      
      // Clear the collection before restoring
      await mongoose.connection.db.collection(collectionName).deleteMany({});
      
      // Insert the documents
      const result = await mongoose.connection.db.collection(collectionName).insertMany(data);
      
      console.log(`Restored ${result.insertedCount} documents to ${collectionName}`);
    }
    
    console.log('Database restore complete.');
  } catch (err) {
    console.error('Error during database restore:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Get backup path from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Please specify the backup directory path');
  console.log('Usage: node restoreDatabase.js <backupDirectoryPath>');
  process.exit(1);
}

const backupPath = args[0];
restoreDatabase(backupPath);
