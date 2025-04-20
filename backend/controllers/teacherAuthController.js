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
// Import the teacher subject service
const teacherSubjectService = require('../services/teacherSubjectService');

exports.getAssignedSubjectsForMarksEntry = async (req, res) => {
    // Clear the cache to ensure we get fresh data
    teacherSubjectService.clearCache();
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

    // First check if the teacher is authorized for this class using the improved authorization logic
    if (classId) {
      const isAuthorized = await teacherSubjectService.isTeacherAuthorizedForClass(teacher._id, classId);

      if (!isAuthorized) {
        console.log(`Teacher ${teacher._id} is not authorized to teach in class ${classId}`);
        return res.status(403).json({
          message: 'You are not authorized to teach in this class.',
          subjects: []
        });
      }
    }

    // Use the teacher subject service to get the teacher's subjects
    // Include subjects from students in the class that the teacher teaches in other classes
    console.log(`[TeacherAuthController] Calling getTeacherSubjects with teacherId: ${teacher._id}, classId: ${classId}, useCache: true, includeStudentSubjects: true`);
    const subjects = await teacherSubjectService.getTeacherSubjects(teacher._id, classId, true, true); // Use cache and include student subjects

    // If no subjects found, try one more approach: check if the teacher teaches any subjects in other classes
    // that are also taught in this class
    if (subjects.length === 0 && classId) {
      console.log(`No subjects found for teacher ${teacher._id} in class ${classId}, trying alternative approach`);

      // Get all subjects the teacher teaches in any class
      const allTeacherSubjects = await teacherSubjectService.getTeacherSubjects(teacher._id, null, false, false);
      console.log(`Teacher ${teacher._id} teaches ${allTeacherSubjects.length} subjects across all classes`);

      if (allTeacherSubjects.length > 0) {
        // Get all subjects in the current class
        const classObj = await Class.findById(classId).populate('subjects.subject');

        if (classObj?.subjects?.length > 0) {
          const classSubjectIds = classObj.subjects.map(s => {
            if (s.subject?._id) {
              return s.subject._id.toString();
            }
            return null;
          }).filter(Boolean);

          console.log(`Class ${classId} has ${classSubjectIds.length} subjects`);

          // Find subjects that the teacher teaches in other classes that are also in this class
          const matchingSubjects = allTeacherSubjects.filter(subject =>
            classSubjectIds.includes(subject._id.toString())
          );

          if (matchingSubjects.length > 0) {
            console.log(`Found ${matchingSubjects.length} subjects that teacher ${teacher._id} teaches in other classes that are also in class ${classId}`);
            return res.json(matchingSubjects);
          }
        }
      }

      // Check if the teacher has any students in this class
      console.log(`Checking if teacher ${teacher._id} has any students in class ${classId}`);
      const students = await teacherSubjectService.getTeacherStudents(teacher._id, classId);

      if (students.length > 0) {
        console.log(`Teacher ${teacher._id} has ${students.length} students in class ${classId}, but no subjects`);

        // Get all subjects in the class
        const classObj = await Class.findById(classId).populate('subjects.subject');

        if (classObj?.subjects?.length > 0) {
          // Return all subjects in the class
          const classSubjects = classObj.subjects.map(s => {
            if (s.subject) {
              return {
                _id: s.subject._id,
                name: s.subject.name,
                code: s.subject.code,
                type: s.subject.type || 'UNKNOWN',
                description: s.subject.description || '',
                educationLevel: s.subject.educationLevel || 'UNKNOWN',
                isPrincipal: s.subject.isPrincipal || false,
                isCompulsory: s.subject.isCompulsory || false,
                assignmentType: 'class' // From class
              };
            }
            return null;
          }).filter(Boolean);

          if (classSubjects.length > 0) {
            console.log(`Found ${classSubjects.length} subjects in class ${classId} for teacher ${teacher._id} based on student assignments`);
            return res.json(classSubjects);
          }
        }
      }

      // If we get here, we still couldn't find any subjects
      console.log(`No subjects found for teacher ${teacher._id} in class ${classId}, returning empty array`);
      return res.status(403).json({
        message: 'You are not assigned to teach any subjects in this class.',
        subjects: []
      });
    }

    // If we get here with no subjects, it means we're not looking for a specific class
    // and the teacher doesn't teach any subjects anywhere
    if (subjects.length === 0) {
      console.log(`No subjects found for teacher ${teacher._id} across all classes, returning empty array`);
      return res.status(403).json({
        message: 'You are not assigned to teach any subjects.',
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
    // Clear the cache to ensure we get fresh data
    teacherSubjectService.clearCache();
  try {
    console.log('GET /api/teachers/marks-entry-subjects - Fetching subjects for marks entry');
    const userId = req.user.userId;
    const { classId } = req.query;

    console.log(`User ID: ${userId}, Class ID: ${classId || 'not provided'}`);

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    // Log the full user object for debugging
    console.log('Full user object from token:', req.user);

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

    // First check if the teacher is authorized for this class using the improved authorization logic
    if (classId) {
      const isAuthorized = await teacherSubjectService.isTeacherAuthorizedForClass(teacher._id, classId);

      if (!isAuthorized) {
        console.log(`Teacher ${teacher._id} is not authorized to teach in class ${classId}`);
        return res.status(403).json({
          message: 'You are not authorized to teach in this class.',
          subjects: []
        });
      }
    }

    // Use the teacher subject service to get the teacher's subjects
    // This is the strict version that only returns subjects the teacher is assigned to teach
    console.log(`[TeacherAuthController] Calling getTeacherSubjects with teacherId: ${teacher._id}, classId: ${classId}, useCache: false, includeStudentSubjects: false`);
    const subjects = await teacherSubjectService.getTeacherSubjects(teacher._id, classId, false, false); // Don't use cache and don't include student subjects

    // If no subjects found, try one more approach: check if the teacher teaches any subjects in other classes
    // that are also taught in this class
    if (subjects.length === 0 && classId) {
      console.log(`No subjects found for teacher ${teacher._id} in class ${classId}, trying alternative approach`);

      // Get all subjects the teacher teaches in any class
      const allTeacherSubjects = await teacherSubjectService.getTeacherSubjects(teacher._id, null, false, false);
      console.log(`Teacher ${teacher._id} teaches ${allTeacherSubjects.length} subjects across all classes`);

      if (allTeacherSubjects.length > 0) {
        // Get all subjects in the current class
        const classObj = await Class.findById(classId).populate('subjects.subject');

        if (classObj?.subjects?.length > 0) {
          const classSubjectIds = classObj.subjects.map(s => {
            if (s.subject?._id) {
              return s.subject._id.toString();
            }
            return null;
          }).filter(Boolean);

          console.log(`Class ${classId} has ${classSubjectIds.length} subjects`);

          // Find subjects that the teacher teaches in other classes that are also in this class
          const matchingSubjects = allTeacherSubjects.filter(subject =>
            classSubjectIds.includes(subject._id.toString())
          );

          if (matchingSubjects.length > 0) {
            console.log(`Found ${matchingSubjects.length} subjects that teacher ${teacher._id} teaches in other classes that are also in class ${classId}`);
            return res.json(matchingSubjects);
          }
        }
      }

      // Check if the teacher has any students in this class
      console.log(`Checking if teacher ${teacher._id} has any students in class ${classId}`);
      const students = await teacherSubjectService.getTeacherStudents(teacher._id, classId);

      if (students.length > 0) {
        console.log(`Teacher ${teacher._id} has ${students.length} students in class ${classId}, but no subjects`);

        // Get all subjects in the class
        const classObj = await Class.findById(classId).populate('subjects.subject');

        if (classObj?.subjects?.length > 0) {
          // Return all subjects in the class
          const classSubjects = classObj.subjects.map(s => {
            if (s.subject) {
              return {
                _id: s.subject._id,
                name: s.subject.name,
                code: s.subject.code,
                type: s.subject.type || 'UNKNOWN',
                description: s.subject.description || '',
                educationLevel: s.subject.educationLevel || 'UNKNOWN',
                isPrincipal: s.subject.isPrincipal || false,
                isCompulsory: s.subject.isCompulsory || false,
                assignmentType: 'class' // From class
              };
            }
            return null;
          }).filter(Boolean);

          if (classSubjects.length > 0) {
            console.log(`Found ${classSubjects.length} subjects in class ${classId} for teacher ${teacher._id} based on student assignments`);
            return res.json(classSubjects);
          }
        }
      }

      // If we get here, we still couldn't find any subjects
      console.log(`No subjects found for teacher ${teacher._id} in class ${classId}, returning empty array`);
      return res.status(403).json({
        message: 'You are not assigned to teach any subjects in this class.',
        subjects: []
      });
    }

    // If we get here with no subjects, it means we're not looking for a specific class
    // and the teacher doesn't teach any subjects anywhere
    if (subjects.length === 0) {
      console.log(`No subjects found for teacher ${teacher._id} across all classes, returning empty array`);
      return res.status(403).json({
        message: 'You are not assigned to teach any subjects.',
        subjects: []
      });
    }

    // Return the subjects
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching assigned subjects for marks entry:', error);

    // Provide more specific error messages based on the error type
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching assigned subjects',
      error: error.message,
      details: 'There was an error retrieving the subjects you are assigned to teach.'
    });
  }
};

/**
 * Get students in a class assigned to the current teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Get subjects for a specific student that the teacher is assigned to teach
 * This endpoint is used by the A-Level marks entry system to determine which subjects
 * a teacher can enter marks for a specific student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAssignedSubjectsForStudent = async (req, res) => {
    // Clear the cache to ensure we get fresh data
    teacherSubjectService.clearCache();
  try {
    console.log('GET /api/teachers/students/:studentId/subjects - Fetching subjects for student that the teacher is assigned to teach');
    const userId = req.user.userId;
    const { studentId } = req.params;
    const { classId } = req.query;

    console.log(`User ID: ${userId}, Student ID: ${studentId}, Class ID: ${classId || 'not provided'}`);

    if (!userId) {
      console.log('No userId found in token');
      return res.status(400).json({ message: 'Invalid user token' });
    }

    if (!studentId) {
      console.log('No studentId provided');
      return res.status(400).json({ message: 'Student ID is required' });
    }

    if (!classId) {
      console.log('No classId provided');
      return res.status(400).json({ message: 'Class ID is required' });
    }

    // If user is admin, return all subjects for the student
    if (req.user.role === 'admin') {
      console.log('User is admin, fetching all subjects for student');

      // Get the student with subject combination
      const student = await Student.findById(studentId)
        .populate({
          path: 'subjectCombination',
          populate: {
            path: 'subjects compulsorySubjects',
            model: 'Subject',
            select: 'name code type description educationLevel isPrincipal isCompulsory'
          }
        });

      if (!student) {
        console.log(`Student ${studentId} not found`);
        return res.status(404).json({ message: 'Student not found' });
      }

      // Get subjects from combination
      const subjects = [];

      // Add principal subjects
      if (student.subjectCombination?.subjects && Array.isArray(student.subjectCombination.subjects)) {
        for (const subject of student.subjectCombination.subjects) {
          if (typeof subject === 'object' && subject._id) {
            subjects.push({
              _id: subject._id,
              name: subject.name,
              code: subject.code,
              type: subject.type,
              description: subject.description,
              educationLevel: subject.educationLevel || 'UNKNOWN',
              isPrincipal: true,
              isCompulsory: false
            });
          }
        }
      }

      // Add subsidiary subjects
      if (student.subjectCombination?.compulsorySubjects && Array.isArray(student.subjectCombination.compulsorySubjects)) {
        for (const subject of student.subjectCombination.compulsorySubjects) {
          if (typeof subject === 'object' && subject._id) {
            subjects.push({
              _id: subject._id,
              name: subject.name,
              code: subject.code,
              type: subject.type,
              description: subject.description,
              educationLevel: subject.educationLevel || 'UNKNOWN',
              isPrincipal: false,
              isCompulsory: true
            });
          }
        }
      }

      console.log(`Found ${subjects.length} subjects for student ${studentId}`);
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

    // Check if the teacher is authorized for this class
    const isAuthorized = await teacherSubjectService.isTeacherAuthorizedForClass(teacher._id, classId);

    if (!isAuthorized) {
      console.log(`Teacher ${teacher._id} is not authorized to teach in class ${classId}`);
      return res.status(403).json({
        message: 'You are not authorized to teach in this class.'
      });
    }

    // Get subjects for this student that the teacher is assigned to teach
    try {
      // First, check if the student exists with full population of subject combination
      const student = await Student.findById(studentId)
        .populate({
          path: 'subjectCombination',
          populate: {
            path: 'subjects compulsorySubjects',
            model: 'Subject',
            select: 'name code type description educationLevel isPrincipal isCompulsory'
          }
        })
        .populate('selectedSubjects');

      if (!student) {
        console.log(`Student ${studentId} not found`);
        return res.status(404).json({
          message: 'Student not found',
          subjects: []
        });
      }

      // Check if the student belongs to the specified class
      if (student.class.toString() !== classId) {
        console.log(`Student ${studentId} does not belong to class ${classId}`);
        return res.status(400).json({
          message: 'Student does not belong to the specified class',
          subjects: []
        });
      }

      // Log student subject combination for debugging
      if (student.subjectCombination) {
        console.log(`Student ${studentId} has subject combination: ${student.subjectCombination.name || student.subjectCombination.code}`);

        // Log principal subjects
        if (student.subjectCombination.subjects && Array.isArray(student.subjectCombination.subjects)) {
          const principalSubjects = student.subjectCombination.subjects
            .filter(s => typeof s === 'object' && s._id)
            .map(s => s.name || s.code);
          console.log(`Principal subjects: ${principalSubjects.join(', ')}`);
        }

        // Log subsidiary subjects
        if (student.subjectCombination.compulsorySubjects && Array.isArray(student.subjectCombination.compulsorySubjects)) {
          const subsidiarySubjects = student.subjectCombination.compulsorySubjects
            .filter(s => typeof s === 'object' && s._id)
            .map(s => s.name || s.code);
          console.log(`Subsidiary subjects: ${subsidiarySubjects.join(', ')}`);
        }
      } else {
        console.log(`Student ${studentId} has no subject combination`);
      }

      // Check if the teacher is assigned to teach any subjects in this class
      const classObj = await Class.findById(classId)
        .populate({
          path: 'subjects.subject',
          select: 'name code type description educationLevel isPrincipal isCompulsory'
        });

      if (!classObj) {
        console.log(`Class ${classId} not found`);
        return res.status(404).json({
          message: 'Class not found',
          subjects: []
        });
      }

      // Check if the teacher is assigned to any subjects in this class
      const teacherSubjectAssignments = classObj.subjects.filter(s =>
        s.teacher && s.teacher.toString() === teacher._id.toString());

      if (teacherSubjectAssignments.length > 0) {
        console.log(`Teacher ${teacher._id} is assigned to teach ${teacherSubjectAssignments.length} subjects in class ${classId}`);

        // Log the subjects the teacher is assigned to teach
        teacherSubjectAssignments.forEach(assignment => {
          console.log(`Teacher ${teacher._id} is assigned to teach subject: ${assignment.subject?.name || assignment.subject}`);
        });
      } else {
        console.log(`Teacher ${teacher._id} is not assigned to teach any subjects in class ${classId}`);
      }

      // Get all subjects the teacher teaches in this class
      console.log(`Getting subjects for teacher ${teacher._id} in class ${classId}`);
      const teacherClassSubjects = await teacherSubjectService.getTeacherSubjects(teacher._id, classId, false, false);

      if (teacherClassSubjects.length === 0 && teacherSubjectAssignments.length === 0) {
        console.log(`No subjects found for teacher ${teacher._id} in class ${classId}`);
        return res.status(403).json({
          message: 'You are not assigned to teach any subjects in this class. Please contact an administrator to assign you to teach subjects in this class.',
          subjects: []
        });
      }



      console.log(`Teacher ${teacher._id} teaches ${teacherClassSubjects.length} subjects in class ${classId}`);

      try {
        // Try to get student-specific subjects
        console.log(`Getting subjects for student ${studentId} taught by teacher ${teacher._id} in class ${classId}`);
        const studentSubjects = await teacherSubjectService.getTeacherSubjectsForStudent(teacher._id, studentId, classId);

        if (studentSubjects.length > 0) {
          console.log(`Found ${studentSubjects.length} subjects for student ${studentId} taught by teacher ${teacher._id}`);
          return res.json(studentSubjects);
        }

        // We already have the student object from above, so we don't need to fetch it again
        // Just check if this is an A-Level student
        const isALevelStudent = student.educationLevel === 'A_LEVEL' || student.form === 5 || student.form === 6;

        if (isALevelStudent) {
          // For A-Level students, we need to check if they have a subject combination
          if (!student.subjectCombination) {
            console.log(`A-Level student ${studentId} has no subject combination`);
            return res.status(400).json({
              message: 'This A-Level student has no subject combination assigned. Please assign a subject combination to the student first.',
              subjects: []
            });
          }

          // If the teacher is assigned to teach subjects in this class, check if any of them match the student's subjects
          if (teacherSubjectAssignments.length > 0) {
            console.log(`Teacher ${teacher._id} is assigned to teach subjects in class ${classId}, checking if any match student ${studentId}'s subjects`);

            // Get the student's subject combination
            const studentSubjectIds = [];

            // Add principal subjects
            if (student.subjectCombination.subjects && Array.isArray(student.subjectCombination.subjects)) {
              for (const subject of student.subjectCombination.subjects) {
                if (typeof subject === 'object' && subject._id) {
                  studentSubjectIds.push(subject._id.toString());
                  console.log(`Added principal subject ${subject.name} (${subject._id}) from student's combination`);
                }
              }
            }

            // Add subsidiary subjects
            if (student.subjectCombination.compulsorySubjects && Array.isArray(student.subjectCombination.compulsorySubjects)) {
              for (const subject of student.subjectCombination.compulsorySubjects) {
                if (typeof subject === 'object' && subject._id) {
                  studentSubjectIds.push(subject._id.toString());
                  console.log(`Added subsidiary subject ${subject.name} (${subject._id}) from student's combination`);
                }
              }
            }

            // Get the teacher's assigned subject IDs
            const teacherSubjectIds = teacherSubjectAssignments
              .filter(assignment => assignment.subject?._id)
              .map(assignment => assignment.subject._id.toString());

            console.log(`Teacher ${teacher._id} is assigned to teach subjects: ${teacherSubjectIds.join(', ')}`);
            console.log(`Student ${studentId} has subjects: ${studentSubjectIds.join(', ')}`);

            // Check if any of the teacher's subjects match the student's subjects
            const matchingSubjects = teacherSubjectIds.filter(subjectId => studentSubjectIds.includes(subjectId));

            if (matchingSubjects.length > 0) {
              console.log(`Found ${matchingSubjects.length} matching subjects between teacher ${teacher._id} and student ${studentId}`);

              // Get the matching subjects
              const subjects = await Subject.find({
                _id: { $in: matchingSubjects }
              }).select('name code type description educationLevel isPrincipal isCompulsory');

              return res.json(subjects);
            }
          }

          // If they have a combination but no matching subjects with the teacher,
          // it means the teacher doesn't teach any of the student's subjects
          console.log(`A-Level student ${studentId} has a subject combination, but none of the subjects match with teacher ${teacher._id}`);
          return res.status(403).json({
            message: 'You are not assigned to teach any of this student\'s subjects. Please contact an administrator to assign you to teach one of this student\'s subjects.',
            subjects: []
          });
        }

        // For O-Level students, return all teacher's subjects for this class
        console.log(`O-Level student ${studentId}, returning all teacher subjects for class ${classId}`);
        return res.json(teacherClassSubjects);
      } catch (studentSubjectsError) {
        // If there's an error getting student-specific subjects, log it and return a helpful error message
        console.error(`Error getting student-specific subjects: ${studentSubjectsError.message}`);
        return res.status(500).json({
          message: 'Error determining which subjects you can teach for this student',
          error: studentSubjectsError.message,
          subjects: []
        });
      }
    } catch (error) {
      console.error('Error getting assigned subjects for student:', error);
      return res.status(500).json({
        message: 'Failed to get assigned subjects for student',
        error: error.message,
        details: 'There was an error retrieving the subjects you teach in this class.'
      });
    }
  } catch (error) {
    console.error('Error getting assigned subjects for student:', error);

    // Provide more specific error messages based on the error type
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        message: 'Invalid student or class ID format',
        error: error.message
      });
    }

    return res.status(500).json({
      message: 'Failed to get assigned subjects for student',
      error: error.message,
      details: 'There was an unexpected error processing your request.'
    });
  }
};

exports.getAssignedStudents = async (req, res) => {
    // Clear the cache to ensure we get fresh data
    teacherSubjectService.clearCache();
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

    // First check if the teacher is authorized for this class using the improved authorization logic
    const isAuthorized = await teacherSubjectService.isTeacherAuthorizedForClass(teacher._id, classId);

    if (!isAuthorized) {
      console.log(`Teacher ${teacher._id} is not authorized to teach in class ${classId}`);
      return res.status(403).json({
        message: 'You are not authorized to teach in this class.',
        students: []
      });
    }

    // Use the teacher subject service to get the teacher's students
    const students = await teacherSubjectService.getTeacherStudents(teacher._id, classId);

    // If no students found, return empty array with error message
    if (students.length === 0) {
      console.log(`No students found for teacher ${teacher._id} in class ${classId}, returning empty array`);
      return res.status(403).json({
        message: 'You are not assigned to teach any students in this class.',
        students: []
      });
    }

    // Return the students
    res.json(students);
  } catch (error) {
    console.error('Error fetching assigned students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned students',
      error: error.message
    });
  }
};
