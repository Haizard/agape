const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const SubjectCombination = require('../models/SubjectCombination');
const mongoose = require('mongoose');
const { getFullSubjectCombination, filterSubjectsForTeacher } = require('../utils/subjectCombinationUtils');

// Get all subjects for a specific class - FIXED VERSION
router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/fixed-subjects/class/${req.params.classId} - Fetching subjects for class (FIXED)`);

    // First check if the class exists
    const classItem = await Class.findById(req.params.classId)
      .populate('subjectCombination')
      .populate({
        path: 'subjects.subject',
        model: 'Subject'
      });

    if (!classItem) {
      console.log(`Class not found with ID: ${req.params.classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log(`Found class: ${classItem.name}, Education Level: ${classItem.educationLevel}`);
    console.log('Class data:', JSON.stringify(classItem, null, 2));

    // Initialize subjects array
    let subjects = [];

    // CASE 1: If class has subjects directly assigned
    if (classItem.subjects && classItem.subjects.length > 0) {
      console.log(`Class has ${classItem.subjects.length} subjects directly assigned`);

      // Extract subject IDs
      const subjectIds = [];
      for (const assignment of classItem.subjects) {
        if (!assignment.subject) {
          console.log('Found subject assignment without subject:', assignment);
          continue;
        }

        const subjectId = assignment.subject._id || assignment.subject;
        if (subjectId) {
          subjectIds.push(subjectId);
        }
      }

      console.log('Extracted subject IDs:', subjectIds);

      // Get full subject details
      if (subjectIds.length > 0) {
        const subjectsFromClass = await Subject.find({
          _id: { $in: subjectIds }
        });

        subjects = [...subjects, ...subjectsFromClass];
        console.log(`Found ${subjectsFromClass.length} subjects from class assignments`);
      }
    }

    // CASE 2: If class has a subject combination (A_LEVEL)
    if (classItem.educationLevel === 'A_LEVEL' && classItem.subjectCombination) {
      console.log('Class has a subject combination:',
        typeof classItem.subjectCombination === 'object'
          ? classItem.subjectCombination._id
          : classItem.subjectCombination
      );

      try {
        // Get the combination details if not already populated
        let combination = classItem.subjectCombination;
        let combinationId;

        if (typeof combination === 'object') {
          combinationId = combination._id;
          if (!combination.subjects) {
            // If combination object exists but subjects aren't populated
            combination = await SubjectCombination.findById(combinationId).populate('subjects');
          }
        } else {
          // If combination is just an ID
          combinationId = combination;
          combination = await SubjectCombination.findById(combinationId).populate('subjects');
        }

        console.log('Subject combination data:', JSON.stringify(combination, null, 2));

        if (combination?.subjects) {
          console.log(`Subject combination has ${combination.subjects.length} subjects`);

          // Get full subject details
          const combinationSubjectIds = [];
          for (const subject of combination.subjects) {
            const subjectId = typeof subject === 'object' ? subject._id : subject;
            if (subjectId) {
              combinationSubjectIds.push(subjectId);
            }
          }

          console.log('Subject IDs from combination:', combinationSubjectIds);

          if (combinationSubjectIds.length > 0) {
            const subjectsFromCombination = await Subject.find({
              _id: { $in: combinationSubjectIds }
            });

            console.log(`Found ${subjectsFromCombination.length} subjects from combination`);

            // Add subjects from combination that aren't already in the list
            for (const subject of subjectsFromCombination) {
              if (!subjects.some(s => s._id.toString() === subject._id.toString())) {
                subjects.push(subject);
              }
            }
          }
        }
      } catch (combinationError) {
        console.error('Error processing subject combination:', combinationError);
      }
    }

    // CASE 3: Add compulsory subjects
    try {
      console.log('Checking for compulsory subjects...');

      // Get all compulsory subjects for this education level
      const compulsorySubjects = await Subject.find({
        isCompulsory: true,
        educationLevel: { $in: [classItem.educationLevel, 'BOTH'] }
      });

      console.log(`Found ${compulsorySubjects.length} compulsory subjects for ${classItem.educationLevel}`);

      // Add compulsory subjects that aren't already in the list
      for (const subject of compulsorySubjects) {
        if (!subjects.some(s => s._id.toString() === subject._id.toString())) {
          subjects.push(subject);
          console.log(`Added compulsory subject: ${subject.name}`);
        }
      }

      // If class has a subject combination, also add its compulsory subjects
      if (classItem.subjectCombination) {
        let combinationId = typeof classItem.subjectCombination === 'object'
          ? classItem.subjectCombination._id
          : classItem.subjectCombination;

        // Use the utility function to get the full subject combination
        const fullCombination = await getFullSubjectCombination(combinationId);

        if (fullCombination && fullCombination.compulsorySubjects) {
          console.log(`Found ${fullCombination.compulsorySubjects.length} compulsory subjects in combination ${fullCombination.name}`);

          // Add compulsory subjects from the combination that aren't already in the list
          for (const subject of fullCombination.compulsorySubjects) {
            if (!subjects.some(s => s._id.toString() === subject._id.toString())) {
              subjects.push(subject);
              console.log(`Added compulsory subject from combination: ${subject.name}`);
            }
          }
        }

        // The compulsory subjects are already added above using the utility function
      }
    } catch (compulsoryError) {
      console.error('Error processing compulsory subjects:', compulsoryError);
      // Continue without compulsory subjects if there's an error
    }

    // Remove duplicates
    const uniqueSubjects = [];
    const subjectIds = new Set();

    for (const subject of subjects) {
      if (!subjectIds.has(subject._id.toString())) {
        subjectIds.add(subject._id.toString());
        uniqueSubjects.push(subject);
      }
    }

    console.log(`Returning ${uniqueSubjects.length} unique subjects for class ${req.params.classId}`);
    res.json(uniqueSubjects);
  } catch (error) {
    console.error(`Error fetching subjects for class ${req.params.classId}:`, error);
    res.status(500).json({ message: 'Failed to fetch subjects for this class' });
  }
});

// Get subjects assigned to a specific teacher for a specific class
router.get('/teacher/:teacherId/class/:classId', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/fixed-subjects/teacher/${req.params.teacherId}/class/${req.params.classId} - Fetching teacher-specific subjects for class`);

    // First check if the class exists
    const classItem = await Class.findById(req.params.classId)
      .populate('subjectCombination')
      .populate({
        path: 'subjects.subject',
        model: 'Subject'
      });

    if (!classItem) {
      console.log(`Class not found with ID: ${req.params.classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log(`Found class: ${classItem.name}, Education Level: ${classItem.educationLevel}`);

    // Initialize subjects array
    let subjects = [];

    // CASE 1: Find subjects directly assigned to this teacher in this class
    if (classItem.subjects && classItem.subjects.length > 0) {
      console.log(`Class has ${classItem.subjects.length} subjects directly assigned`);

      // Filter for subjects assigned to this teacher
      const teacherSubjectAssignments = classItem.subjects.filter(assignment => {
        const teacherId = assignment.teacher?._id || assignment.teacher;
        return teacherId && teacherId.toString() === req.params.teacherId;
      });

      console.log(`Found ${teacherSubjectAssignments.length} subjects assigned to teacher ${req.params.teacherId}`);

      // Extract subject IDs
      const subjectIds = [];
      for (const assignment of teacherSubjectAssignments) {
        if (!assignment.subject) {
          console.log('Found subject assignment without subject:', assignment);
          continue;
        }

        const subjectId = assignment.subject._id || assignment.subject;
        if (subjectId) {
          subjectIds.push(subjectId);
        }
      }

      console.log('Extracted subject IDs:', subjectIds);

      // Get full subject details
      if (subjectIds.length > 0) {
        const subjectsFromClass = await Subject.find({
          _id: { $in: subjectIds }
        });

        subjects = [...subjects, ...subjectsFromClass];
        console.log(`Found ${subjectsFromClass.length} subjects from class assignments`);
      }
    }

    // CASE 2: If class is A_LEVEL and has a subject combination, check if teacher teaches any of those subjects
    if (classItem.educationLevel === 'A_LEVEL' && classItem.subjectCombination && subjects.length === 0) {
      console.log('Class is A_LEVEL with subject combination, checking if teacher teaches any of these subjects');

      try {
        // Get the teacher's profile to see what subjects they're qualified to teach
        const Teacher = require('../models/Teacher');
        const teacher = await Teacher.findById(req.params.teacherId).populate('subjects');

        if (!teacher) {
          console.log(`Teacher not found with ID: ${req.params.teacherId}`);
          return res.status(404).json({ message: 'Teacher not found' });
        }

        // Get the teacher's subject IDs
        const teacherSubjectIds = teacher.subjects.map(s =>
          typeof s === 'object' ? s._id.toString() : s.toString()
        );

        console.log('Teacher subject IDs:', teacherSubjectIds);

        // Get the combination ID
        const combinationId = typeof classItem.subjectCombination === 'object'
          ? classItem.subjectCombination._id
          : classItem.subjectCombination;

        // Use the utility function to get the full subject combination
        const fullCombination = await getFullSubjectCombination(combinationId);

        console.log('Full subject combination data:', JSON.stringify(fullCombination, null, 2));

        if (fullCombination?.subjects) {
          console.log(`Subject combination has ${fullCombination.subjects.length} subjects`);

          // Get subject IDs from combination
          const combinationSubjectIds = [];
          for (const subject of fullCombination.subjects) {
            const subjectId = typeof subject === 'object' ? subject._id.toString() : subject.toString();
            if (subjectId) {
              combinationSubjectIds.push(subjectId);
            }
          }

          console.log('Subject IDs from combination:', combinationSubjectIds);

          // Find subjects that are both in the combination and in the teacher's subjects
          const matchingSubjectIds = combinationSubjectIds.filter(id =>
            teacherSubjectIds.includes(id)
          );

          console.log('Matching subject IDs:', matchingSubjectIds);

          if (matchingSubjectIds.length > 0) {
            const subjectsFromCombination = await Subject.find({
              _id: { $in: matchingSubjectIds }
            });

            console.log(`Found ${subjectsFromCombination.length} subjects from combination that teacher can teach`);

            // Add subjects from combination that aren't already in the list
            for (const subject of subjectsFromCombination) {
              if (!subjects.some(s => s._id.toString() === subject._id.toString())) {
                subjects.push(subject);
              }
            }

            // Also add compulsory subjects if the teacher teaches any subject in the combination
            if (fullCombination?.compulsorySubjects) {
              console.log(`Adding ${fullCombination.compulsorySubjects.length} compulsory subjects from combination`);

              // Add all compulsory subjects regardless of teacher assignment
              for (const subject of fullCombination.compulsorySubjects) {
                if (!subjects.some(s => s._id.toString() === subject._id.toString())) {
                  subjects.push(subject);
                  console.log(`Added compulsory subject: ${subject.name}`);
                }
              }
            }
          }
        }
      } catch (combinationError) {
        console.error('Error processing subject combination:', combinationError);
      }
    }

    // Note: We're adding compulsory subjects automatically when a teacher teaches any subject in a combination.
    // This ensures that teachers can see all relevant subjects for their students, including compulsory ones.

    // Return the subjects
    console.log(`Returning ${subjects.length} subjects for teacher ${req.params.teacherId} in class ${req.params.classId}`);
    res.json(subjects);
  } catch (error) {
    console.error(`Error fetching subjects for teacher ${req.params.teacherId} in class ${req.params.classId}:`, error);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});

module.exports = router;
