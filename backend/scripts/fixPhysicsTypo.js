const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const OLevelResult = require('../models/OLevelResult');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  fixPhysicsTypo();
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

async function fixPhysicsTypo() {
  try {
    // Find the subject with the typo
    const subjectWithTypo = await Subject.findOne({ name: 'PHYISCS' });
    
    if (subjectWithTypo) {
      console.log('Found subject with typo:', subjectWithTypo);
      
      // Update the subject name
      subjectWithTypo.name = 'PHYSICS';
      await subjectWithTypo.save();
      console.log('Updated subject name to PHYSICS');
      
      // Update all results that reference this subject
      const updatedResults = await OLevelResult.updateMany(
        { 'subjectId': subjectWithTypo._id },
        { $set: { 'subjectName': 'PHYSICS' } }
      );
      
      console.log(`Updated ${updatedResults.modifiedCount} results`);
    } else {
      console.log('No subject with the name PHYISCS found');
    }
    
    console.log('Fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing physics typo:', error);
    process.exit(1);
  }
}
