const mongoose = require('mongoose');
const Teacher = mongoose.model('Teacher');
const Class = mongoose.model('Class');
const Subject = mongoose.model('Subject');
const Student = mongoose.model('Student');

/**
 * Get classes assigned to the current teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAssignedClasses = async (req, res) => {
  try {
    // Get teacher ID from authenticated user
    const teacherId = req.user.id;

    // Find the teacher
    const teacher = await Teacher.findById(teacherId)
      .populate('classes')
      .populate('subjects');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get classes assigned to the teacher
    const assignedClasses = teacher.classes || [];

    // Return the classes
    res.json(assignedClasses);
  } catch (error) {
    console.error('Error fetching assigned classes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned classes',
      error: error.message
    });
  }
};

/**
 * Get a simplified list of classes assigned to the current teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSimpleAssignedClasses = async (req, res) => {
  try {
    // Get teacher ID from authenticated user
    const teacherId = req.user.id;

    // Find the teacher
    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get class IDs assigned to the teacher
    const classIds = teacher.classes || [];

    // Find the classes
    const classes = await Class.find({ _id: { $in: classIds } });

    // Return the classes
    res.json(classes);
  } catch (error) {
    console.error('Error fetching simple assigned classes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching simple assigned classes',
      error: error.message
    });
  }
};

/**
 * Get subjects assigned to the current teacher for a specific class
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAssignedSubjectsForMarksEntry = async (req, res) => {
  try {
    console.log('GET /api/teachers/my-subjects - Fetching subjects for current teacher');
    const userId = req.user.userId;
    const { classId } = req.query;

    console.log(`User ID: ${userId}, Class ID: ${classId || 'not provided'}`);

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // If user is admin, return all subjects
    if (req.user.role === 'admin') {
      console.log('User is admin, fetching all subjects');
      const subjects = await Subject.find().select('name code type description');
      return res.json(subjects);
    }

    // Find the teacher profile
    console.log('Looking for teacher with userId:', userId);
    const teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      console.log('No teacher profile found for user:', userId);
      return res.status(404).json({
        message: 'Teacher profile not found. Please ensure your account is properly set up as a teacher.'
      });
    }

    console.log(`Found teacher: ${teacher.firstName} ${teacher.lastName} (${teacher._id})`);

    // If classId is provided, find subjects for that specific class
    if (classId) {
      console.log(`Finding subjects for teacher ${teacher._id} in class ${classId}`);
      const classObj = await Class.findById(classId)
        .populate({
          path: 'subjects.subject',
          model: 'Subject',
          select: 'name code type description'
        });

      if (!classObj) {
        console.log(`Class not found with ID: ${classId}`);
        return res.status(404).json({ message: 'Class not found' });
      }

      // Log all subjects in the class for debugging
      console.log(`Class ${classId} has ${classObj.subjects.length} subjects:`);
      for (const subjectAssignment of classObj.subjects) {
        console.log(`Subject: ${subjectAssignment.subject ? subjectAssignment.subject.name : 'Unknown'}, ` +
                    `Teacher: ${subjectAssignment.teacher ? subjectAssignment.teacher.toString() : 'None'}, ` +
                    `Teacher ID matches: ${subjectAssignment.teacher &&
                      subjectAssignment.teacher.toString() === teacher._id.toString()}`);
      }

      // Filter subjects taught by this teacher in this class
      const teacherSubjects = [];
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacher._id.toString() &&
            subjectAssignment.subject) {

          teacherSubjects.push({
            _id: subjectAssignment.subject._id,
            name: subjectAssignment.subject.name,
            code: subjectAssignment.subject.code,
            type: subjectAssignment.subject.type,
            description: subjectAssignment.subject.description,
            educationLevel: subjectAssignment.subject.educationLevel || 'UNKNOWN'
          });

          console.log(`Teacher ${teacher._id} is assigned to teach ${subjectAssignment.subject.name} in class ${classId}`);
        }
      }

      console.log(`Found ${teacherSubjects.length} subjects for teacher ${teacher._id} in class ${classId}`);

      // If no subjects found for this class, return empty array with error message
      if (teacherSubjects.length === 0) {
        console.log('No subjects found for teacher in this class, returning empty array');
        return res.status(403).json({
          message: 'You are not assigned to teach any subjects in this class.',
          subjects: []
        });
      }

      return res.json(teacherSubjects);
    }

    // If no classId, find all subjects across all classes
    console.log(`Finding all subjects for teacher ${teacher._id} across all classes`);
    const classes = await Class.find({
      'subjects.teacher': teacher._id
    })
    .populate({
      path: 'subjects.subject',
      model: 'Subject',
      select: 'name code type description'
    });

    // Create a map to store unique subjects
    const subjectMap = {};

    // Process each class
    for (const classObj of classes) {
      // Process each subject assignment in the class
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacher._id.toString() &&
            subjectAssignment.subject) {

          const subjectId = subjectAssignment.subject._id.toString();

          // If this subject is not in the map yet, add it
          if (!subjectMap[subjectId]) {
            subjectMap[subjectId] = {
              _id: subjectAssignment.subject._id,
              name: subjectAssignment.subject.name,
              code: subjectAssignment.subject.code,
              type: subjectAssignment.subject.type,
              description: subjectAssignment.subject.description
            };
          }
        }
      }
    }

    // Convert the map to an array
    const subjects = Object.values(subjectMap);
    console.log(`Found ${subjects.length} unique subjects for teacher ${teacher._id} across all classes`);

    // If no subjects found, return empty array with error message
    if (subjects.length === 0) {
      console.log('No subjects found for teacher, returning empty array');
      return res.status(403).json({
        message: 'You are not assigned to teach any subjects. Please contact an administrator.',
        subjects: []
      });
    }

    // Return the subjects
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching assigned subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned subjects',
      error: error.message
    });
  }
};

/**
 * Get students in a class assigned to the current teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Get subjects assigned to the current teacher for marks entry
 * This is a strict version that only returns subjects the teacher is assigned to teach
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAssignedSubjects = async (req, res) => {
  try {
    console.log('GET /api/teachers/marks-entry-subjects - Fetching subjects for marks entry');
    const userId = req.user.userId;
    const { classId } = req.query;

    console.log(`User ID: ${userId}, Class ID: ${classId || 'not provided'}`);

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // If user is admin, return all subjects
    if (req.user.role === 'admin') {
      console.log('User is admin, fetching all subjects');
      const subjects = await Subject.find().select('name code type description educationLevel');
      return res.json(subjects);
    }

    // Find the teacher profile
    console.log('Looking for teacher with userId:', userId);
    const teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      console.log('No teacher profile found for user:', userId);
      return res.status(404).json({
        message: 'Teacher profile not found. Please ensure your account is properly set up as a teacher.'
      });
    }

    console.log(`Found teacher: ${teacher.firstName} ${teacher.lastName} (${teacher._id})`);

    // If classId is provided, find subjects for that specific class
    if (classId) {
      console.log(`Finding subjects for teacher ${teacher._id} in class ${classId}`);
      const classObj = await Class.findById(classId)
        .populate({
          path: 'subjects.subject',
          model: 'Subject',
          select: 'name code type description educationLevel'
        });

      if (!classObj) {
        console.log(`Class not found with ID: ${classId}`);
        return res.status(404).json({ message: 'Class not found' });
      }

      // Log all subjects in the class for debugging
      console.log(`Class ${classId} has ${classObj.subjects.length} subjects:`);
      for (const subjectAssignment of classObj.subjects) {
        console.log(`Subject: ${subjectAssignment.subject ? subjectAssignment.subject.name : 'Unknown'}, ` +
                    `Teacher: ${subjectAssignment.teacher ? subjectAssignment.teacher.toString() : 'None'}, ` +
                    `Teacher ID matches: ${subjectAssignment.teacher &&
                      subjectAssignment.teacher.toString() === teacher._id.toString()}`);
      }

      // Filter subjects taught by this teacher in this class
      const teacherSubjects = [];
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacher._id.toString() &&
            subjectAssignment.subject) {

          teacherSubjects.push({
            _id: subjectAssignment.subject._id,
            name: subjectAssignment.subject.name,
            code: subjectAssignment.subject.code,
            type: subjectAssignment.subject.type,
            description: subjectAssignment.subject.description,
            educationLevel: subjectAssignment.subject.educationLevel || 'UNKNOWN'
          });

          console.log(`Teacher ${teacher._id} is assigned to teach ${subjectAssignment.subject.name} in class ${classId}`);
        }
      }

      console.log(`Found ${teacherSubjects.length} subjects for teacher ${teacher._id} in class ${classId}`);

      // If no subjects found for this class, return empty array with error message
      if (teacherSubjects.length === 0) {
        console.log('No subjects found for teacher in this class, returning empty array');
        return res.status(403).json({
          message: 'You are not assigned to teach any subjects in this class.',
          subjects: []
        });
      }

      return res.json(teacherSubjects);
    }

    // If no classId, find all subjects across all classes
    console.log(`Finding all subjects for teacher ${teacher._id} across all classes`);
    const classes = await Class.find({
      'subjects.teacher': teacher._id
    })
    .populate({
      path: 'subjects.subject',
      model: 'Subject',
      select: 'name code type description educationLevel'
    });

    // Create a map to store unique subjects
    const subjectMap = {};

    // Process each class
    for (const classObj of classes) {
      // Process each subject assignment in the class
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacher._id.toString() &&
            subjectAssignment.subject) {

          const subjectId = subjectAssignment.subject._id.toString();

          // If this subject is not in the map yet, add it
          if (!subjectMap[subjectId]) {
            subjectMap[subjectId] = {
              _id: subjectAssignment.subject._id,
              name: subjectAssignment.subject.name,
              code: subjectAssignment.subject.code,
              type: subjectAssignment.subject.type,
              description: subjectAssignment.subject.description,
              educationLevel: subjectAssignment.subject.educationLevel || 'UNKNOWN'
            };
          }
        }
      }
    }

    // Convert the map to an array
    const subjects = Object.values(subjectMap);
    console.log(`Found ${subjects.length} unique subjects for teacher ${teacher._id} across all classes`);

    // If no subjects found, return empty array with error message
    if (subjects.length === 0) {
      console.log('No subjects found for teacher, returning empty array');
      return res.status(403).json({
        message: 'You are not assigned to teach any subjects. Please contact an administrator.',
        subjects: []
      });
    }

    // Return the subjects
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching assigned subjects for marks entry:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned subjects',
      error: error.message
    });
  }
};

/**
 * Get students in a class assigned to the current teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAssignedStudents = async (req, res) => {
  try {
    console.log('GET /api/teachers/classes/:classId/students - Fetching students for teacher');
    const userId = req.user.userId;
    const { classId } = req.params;

    console.log(`User ID: ${userId}, Class ID: ${classId}`);

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // If user is admin, return all students in the class
    if (req.user.role === 'admin') {
      console.log('User is admin, fetching all students in class');
      const students = await Student.find({ class: classId })
        .populate('subjectCombination')
        .populate('selectedSubjects')
        .sort({ firstName: 1, lastName: 1 });

      console.log(`Found ${students.length} students in class ${classId}`);
      return res.json(students);
    }

    // Find the teacher profile
    console.log('Looking for teacher with userId:', userId);
    const teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      console.log('No teacher profile found for user:', userId);
      return res.status(404).json({
        message: 'Teacher profile not found. Please ensure your account is properly set up as a teacher.'
      });
    }

    console.log(`Found teacher: ${teacher.firstName} ${teacher.lastName} (${teacher._id})`);

    // Check if the teacher is assigned to the class
    const Class = require('../models/Class');
    const classObj = await Class.findOne({
      _id: classId,
      'subjects.teacher': teacher._id
    });

    if (!classObj) {
      console.log(`Teacher ${teacher._id} is not assigned to class ${classId}`);

      // Instead of returning all students, return an empty array with a message
      console.log('Teacher is not assigned to this class, returning empty array');
      return res.status(403).json({
        message: 'You are not assigned to teach any subjects in this class.',
        students: []
      });
    }

    console.log(`Teacher ${teacher._id} is assigned to class ${classId}`);

    // Find all students in the class first
    const allStudents = await Student.find({ class: classId })
      .populate({
        path: 'subjectCombination',
        populate: {
          path: 'subjects compulsorySubjects',
          model: 'Subject',
          select: 'name code type description educationLevel isPrincipal isCompulsory'
        }
      })
      .populate('selectedSubjects')
      .sort({ firstName: 1, lastName: 1 });

    console.log(`Found ${allStudents.length} total students in class ${classId}`);

    // Get the teacher's assigned subjects for this class
    const teacherSubjects = classObj.subjects
      .filter(subjectAssignment =>
        subjectAssignment.teacher &&
        subjectAssignment.teacher.toString() === teacher._id.toString()
      )
      .map(subjectAssignment =>
        typeof subjectAssignment.subject === 'object' ?
          subjectAssignment.subject._id.toString() :
          subjectAssignment.subject.toString()
      );

    console.log(`Teacher ${teacher._id} teaches ${teacherSubjects.length} subjects in class ${classId}:`, teacherSubjects);

    // Filter students based on the teacher's subjects
    const filteredStudents = allStudents.filter(student => {
      // If student has a subject combination
      if (student.subjectCombination &&
          typeof student.subjectCombination === 'object') {

        // Get principal subjects
        const principalSubjectIds = student.subjectCombination.subjects ?
          student.subjectCombination.subjects.map(s =>
            typeof s === 'object' ? s._id.toString() : s.toString()
          ) : [];

        // Get subsidiary subjects
        const subsidiarySubjectIds = student.subjectCombination.compulsorySubjects ?
          student.subjectCombination.compulsorySubjects.map(s =>
            typeof s === 'object' ? s._id.toString() : s.toString()
          ) : [];

        // Combine all subject IDs
        const studentSubjectIds = [...principalSubjectIds, ...subsidiarySubjectIds];

        // Check if any of the student's subjects are taught by this teacher
        const hasTeacherSubject = studentSubjectIds.some(subjectId =>
          teacherSubjects.includes(subjectId)
        );

        return hasTeacherSubject;
      }

      // If student doesn't have a subject combination, include them
      // This ensures we don't exclude students who might need to be assigned combinations
      return true;
    });

    console.log(`Filtered to ${filteredStudents.length} students who have subjects taught by teacher ${teacher._id}`);

    // Log A-Level students with their subject combinations for debugging
    const aLevelStudents = filteredStudents.filter(student =>
      student.educationLevel === 'A_LEVEL' || student.form === 5 || student.form === 6
    );

    console.log(`Found ${aLevelStudents.length} A-Level students taught by this teacher in class ${classId}`);

    for (const student of aLevelStudents) {
      if (student.subjectCombination) {
        console.log(`Student ${student._id} has combination: ${student.subjectCombination.name || student.subjectCombination._id}`);

        // Log principal subjects
        if (student.subjectCombination.subjects && student.subjectCombination.subjects.length > 0) {
          console.log(`Principal subjects: ${student.subjectCombination.subjects.map(s => s.name || s.code).join(', ')}`);
        }

        // Log subsidiary subjects
        if (student.subjectCombination.compulsorySubjects && student.subjectCombination.compulsorySubjects.length > 0) {
          console.log(`Subsidiary subjects: ${student.subjectCombination.compulsorySubjects.map(s => s.name || s.code).join(', ')}`);
        }
      } else {
        console.log(`Student ${student._id} has no subject combination assigned`);
      }
    }

    // Return the filtered students
    res.json(filteredStudents);
  } catch (error) {
    console.error('Error fetching assigned students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned students',
      error: error.message
    });
  }
};
