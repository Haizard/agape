const mongoose = require('mongoose');
const Result = require('../models/Result');
const OLevelResult = require('../models/OLevelResult');
const ALevelResult = require('../models/ALevelResult');
const MigrationStatus = require('../models/MigrationStatus');
const fs = require('fs');
const path = require('path');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';

// Setup logging
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `phase_out_old_model_${new Date().toISOString().split('T')[0]}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  logStream.write(logMessage);
  console.log(message);
}

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    log(`Connecting to MongoDB with URI: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Create or update migration status
async function updateMigrationStatus(name, status, updates = {}) {
  try {
    const migrationStatus = await MigrationStatus.findOneAndUpdate(
      { name },
      { 
        status,
        lastUpdated: new Date(),
        ...updates
      },
      { 
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    
    return migrationStatus;
  } catch (error) {
    log(`Error updating migration status: ${error.message}`);
    throw error;
  }
}

// Verify all results have been migrated
async function verifyAllResultsMigrated() {
  log('Verifying all results have been migrated...');
  
  try {
    // Count results in each model
    const oldResultsCount = await Result.countDocuments();
    const oLevelResultsCount = await OLevelResult.countDocuments();
    const aLevelResultsCount = await ALevelResult.countDocuments();
    
    log(`Results count:
- Old model: ${oldResultsCount}
- O-LEVEL model: ${oLevelResultsCount}
- A-LEVEL model: ${aLevelResultsCount}
- Total new models: ${oLevelResultsCount + aLevelResultsCount}
`);
    
    // Check for missing results
    const missingResults = oldResultsCount - (oLevelResultsCount + aLevelResultsCount);
    if (missingResults > 0) {
      log(`Warning: ${missingResults} results may not have been migrated`);
      return false;
    } else {
      log('All results have been migrated successfully');
      return true;
    }
  } catch (error) {
    log(`Verification failed: ${error.message}`);
    throw error;
  }
}

// Backup old results before phasing out
async function backupOldResults() {
  const backupName = 'old_results_backup';
  
  try {
    log('Backing up old results...');
    
    // Get all results from the old model
    const oldResults = await Result.find();
    
    // Create or update backup status
    await updateMigrationStatus(backupName, 'in_progress', {
      startTime: new Date(),
      totalRecords: oldResults.length,
      processedRecords: 0
    });
    
    log(`Found ${oldResults.length} results in the old model`);
    
    // Create backup file
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const backupFile = path.join(backupDir, `old_results_backup_${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(oldResults, null, 2));
    
    log(`Backup saved to ${backupFile}`);
    
    // Update backup status
    await updateMigrationStatus(backupName, 'completed', {
      endTime: new Date(),
      processedRecords: oldResults.length
    });
    
    return backupFile;
  } catch (error) {
    log(`Backup failed: ${error.message}`);
    await updateMigrationStatus(backupName, 'failed', {
      endTime: new Date()
    });
    throw error;
  }
}

// Phase out old model by renaming the collection
async function phaseOutOldModel() {
  const phaseOutName = 'phase_out_old_model';
  
  try {
    log('Phasing out old model...');
    
    // Create or update phase out status
    await updateMigrationStatus(phaseOutName, 'in_progress', {
      startTime: new Date()
    });
    
    // Rename the collection instead of dropping it
    // This is safer than dropping the collection
    const db = mongoose.connection.db;
    const newCollectionName = `results_archived_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}`;
    
    // Check if the collection exists
    const collections = await db.listCollections({ name: 'results' }).toArray();
    if (collections.length > 0) {
      await db.collection('results').rename(newCollectionName);
      log(`Renamed 'results' collection to '${newCollectionName}'`);
    } else {
      log(`'results' collection does not exist, nothing to rename`);
    }
    
    // Update phase out status
    await updateMigrationStatus(phaseOutName, 'completed', {
      endTime: new Date()
    });
    
    return newCollectionName;
  } catch (error) {
    log(`Phase out failed: ${error.message}`);
    await updateMigrationStatus(phaseOutName, 'failed', {
      endTime: new Date()
    });
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    log('Starting phase out process...');
    
    // Verify all results have been migrated
    const allMigrated = await verifyAllResultsMigrated();
    if (!allMigrated) {
      log('Not all results have been migrated. Please run the migration script first.');
      process.exit(1);
    }
    
    // Backup old results
    const backupFile = await backupOldResults();
    log(`Old results backed up to ${backupFile}`);
    
    // Phase out old model
    const newCollectionName = await phaseOutOldModel();
    log(`Old model phased out. Collection renamed to ${newCollectionName}`);
    
    log('Phase out process completed');
    
    // Close log stream
    logStream.end();
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Phase out failed:', error);
    
    // Ensure we disconnect even if there's an error
    try {
      await mongoose.disconnect();
      log('Disconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
    
    process.exit(1);
  }
}

// Run the main function
main();
