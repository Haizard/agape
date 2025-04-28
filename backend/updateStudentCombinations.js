const mongoose = require('mongoose');
require('./models/Student');
const Student = mongoose.model('Student');
require('dotenv').config();

// Map roll numbers to combination codes
const assignments = {
  "0001": "HGL",
  "0002": "PCB",
  "0003": "PCB",
  "0004": "PCB",
  "0005": "PCB",
  "0006": "PCB",
  "0007": "EGM",
  "0008": "PCB",
  "0009": "EGM",
  "0010": "EGM",
  "0011": "PCB",
  "0012": "HGL",
  "0013": "PCB",
  "0014": "HGL",
  "0015": "PCB",
  "0016": "PCB",
  "0017": "PCB",
  "0018": "PCB",
  "0019": "PCM",
  "0020": "HGL",
  "0021": "PCM",
  "0022": "HGL",
  "0023": "PCB",
  "0024": "PCB",
  "0025": "PCB",
  "0026": "HGE",
  "0027": "PCM",
  "0028": "PCM",
  "0029": "HGE",
  "0030": "PCB",
  "0031": "PCB",
  "0032": "PCB"
};

// FILL THESE IN after running listSubjectCombinations.js
const combinationMap = {
  "PCB": "67f52262e5cf9e3acc8870b4",
  "HGL": "67fa3898e70d59ef7c24a908",
  "EGM": "67f52263e5cf9e3acc8870be",
  "PCM": "67f52262e5cf9e3acc8870b2",
  "HGE": "67f52264e5cf9e3acc8870c2"
};

async function main() {
  const mongoUri = process.env.DATABASE_URL || 'mongodb://localhost:27017/agape_db';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  for (const [rollNumber, comboCode] of Object.entries(assignments)) {
    const student = await Student.findOne({ rollNumber });
    if (!student) {
      console.log(`Student ${rollNumber} not found`);
      continue;
    }
    const combinationId = combinationMap[comboCode];
    if (!combinationId) {
      console.log(`Combination ${comboCode} not found`);
      continue;
    }
    student.subjectCombination = combinationId;
    await student.save();
    console.log(`Updated ${student.firstName} ${student.lastName} (${rollNumber}) to combination ${comboCode}`);
  }

  await mongoose.disconnect();
  console.log('All done!');
}

main().catch((err) => {
  console.error('Error:', err);
  mongoose.disconnect();
}); 