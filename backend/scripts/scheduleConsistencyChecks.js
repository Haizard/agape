const mongoose = require('mongoose');
const cron = require('node-cron');
const dataConsistencyMonitor = require('../utils/dataConsistencyMonitor');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';

// Setup logging
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `scheduled_checks_${new Date().toISOString().split('T')[0]}.log`);
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
    log(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-email-password'
  }
});

// Send email notification
async function sendEmailNotification(subject, message) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: process.env.ADMIN_EMAIL || 'admin@example.com',
      subject: subject,
      text: message
    };
    
    await transporter.sendMail(mailOptions);
    log(`Email notification sent: ${subject}`);
  } catch (error) {
    log(`Error sending email notification: ${error.message}`);
  }
}

// Run consistency checks
async function runConsistencyChecks() {
  try {
    log('Running scheduled data consistency checks...');
    
    // Run all checks
    const checks = await dataConsistencyMonitor.runAllChecks();
    
    // Log the results
    log(`Found ${checks.totalIssues} total data consistency issues`);
    
    // Send email notification if there are issues
    if (checks.totalIssues > 0) {
      const subject = `[ALERT] Data Consistency Issues Detected - ${checks.totalIssues} issues`;
      let message = `Data consistency check detected ${checks.totalIssues} issues:\n\n`;
      
      message += `- ${checks.duplicateResults.totalDuplicates} duplicate results\n`;
      message += `- ${checks.incorrectGradesAndPoints.totalIncorrect} results with incorrect grades or points\n`;
      message += `- ${checks.missingRequiredFields.totalMissing} results with missing required fields\n`;
      message += `- ${checks.orphanedResults.totalOrphaned} orphaned results\n\n`;
      
      message += `Please check the logs for more details: ${logFile}\n`;
      message += `You can run the fix script to automatically fix these issues.\n`;
      
      await sendEmailNotification(subject, message);
    } else {
      log('No data consistency issues found');
    }
    
    return checks;
  } catch (error) {
    log(`Error running consistency checks: ${error.message}`);
    
    // Send email notification about the error
    const subject = '[ERROR] Data Consistency Check Failed';
    const message = `Error running data consistency checks: ${error.message}\n\nPlease check the logs for more details: ${logFile}`;
    
    await sendEmailNotification(subject, message);
    
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Schedule the consistency checks to run daily at midnight
    cron.schedule('0 0 * * *', async () => {
      try {
        log('Running scheduled data consistency checks...');
        await runConsistencyChecks();
      } catch (error) {
        log(`Error in scheduled task: ${error.message}`);
      }
    });
    
    // Also run the checks immediately when the script starts
    await runConsistencyChecks();
    
    log('Scheduled data consistency checks are now running');
    
  } catch (error) {
    log(`Error in main function: ${error.message}`);
    
    // Ensure we disconnect from MongoDB if there's an error
    try {
      await mongoose.disconnect();
      log('Disconnected from MongoDB');
    } catch (disconnectError) {
      log(`Error disconnecting from MongoDB: ${disconnectError.message}`);
    }
    
    process.exit(1);
  }
}

// Run the main function
main();
