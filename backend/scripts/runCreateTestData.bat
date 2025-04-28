@echo off
echo Running A-Level Test Data Generator...
node scripts/createALevelTestData.js
echo Done!
pause

node exportSubjectCombinations.js
