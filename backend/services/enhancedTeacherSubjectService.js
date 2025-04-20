/**
 * Enhanced Teacher Subject Service
 *
 * This service extends the original teacherSubjectService with improved handling
 * for O-Level classes, ensuring they work the same way as A-Level classes.
 */

const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const TeacherSubject = require('../models/TeacherSubject');
const TeacherAssignment = require('../models/TeacherAssignment');
const Student = require('../models/Student');

// Import the original service
const originalService = require('./teacherSubjectService');

// Cache for teacher-subject relationships
const cache = {
  teacherSubjects: new Map(), // Map of teacherId -> Map of classId -> subjects
  lastUpdated: new Map(), // Map of teacherId -> timestamp
  TTL: 1 * 60 * 1000, // 1 minute - reduced to ensure fresh data
};

/**
 * Get subjects assigned to a teacher for a specific class
 * Enhanced version that treats O-Level classes the same as A-Level classes
 *
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID (optional)
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @param {boolean} includeStudentSubjects - Whether to include subjects from students in the class (default: false)
 * @returns {Promise<Array>} - Array of subjects
 */
async function getTeacherSubjects(teacherId, classId = null, useCache = true, includeStudentSubjects = false) {
  console.log(`[EnhancedTeacherSubjectService] Getting subjects for teacher ${teacherId}${classId ? ` in class ${classId}` : ''}`);

  try {
    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      console.log(`[EnhancedTeacherSubjectService] Teacher not found: ${teacherId}`);
      return [];
    }

    // Create a map to store unique subjects
    const subjectMap = {};

    // Method 1: Get subjects directly assigned to the teacher in the Class model
    if (classId) {
      console.log(`[EnhancedTeacherSubjectService] Finding subjects for teacher ${teacherId} in class ${classId}`);

      // Find the class and check if it exists
      const classObj = await Class.findById(classId)
        .populate({
          path: 'subjects.subject',
          model: 'Subject',
          select: 'name code type description educationLevel isPrincipal isCompulsory'
        });

      if (!classObj) {
        console.log(`[EnhancedTeacherSubjectService] Class not found: ${classId}`);
        return [];
      }

      // Log education level for debugging
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} education level: ${classObj.educationLevel || 'Not specified'}`);

      // Process each subject assignment in the class
      for (const subjectAssignment of classObj.subjects) {
        // For O-Level classes, use strict subject-level access control
        // Only add subjects that the teacher is specifically assigned to teach

        if (subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacherId.toString() &&
            subjectAssignment.subject) {

          // Add only this specific subject to the map
          const subjectId = subjectAssignment.subject._id.toString();

          // If this subject is not in the map yet, add it
          if (!subjectMap[subjectId]) {
            subjectMap[subjectId] = {
              _id: subjectAssignment.subject._id,
              name: subjectAssignment.subject.name,
              code: subjectAssignment.subject.code,
              type: subjectAssignment.subject.type,
              description: subjectAssignment.subject.description,
              educationLevel: subjectAssignment.subject.educationLevel || 'O_LEVEL',
              isPrincipal: subjectAssignment.subject.isPrincipal || false,
              isCompulsory: subjectAssignment.subject.isCompulsory || false,
              assignmentType: 'direct' // Directly assigned to teach this subject
            };
            console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is directly assigned to teach ${subjectAssignment.subject.name} in class ${classId}`);
          }
        }
      }
    }

    // Method 2: Check TeacherSubject assignments
    if (classId) {
      const teacherSubjectAssignments = await TeacherSubject.find({
        teacherId: teacherId,
        classId: classId,
        status: 'active'
      }).populate('subjectId');

      // Add only the specific subjects the teacher is assigned to teach
      for (const assignment of teacherSubjectAssignments) {
        if (assignment.subjectId) {
          const subjectId = assignment.subjectId._id.toString();

          // If this subject is not in the map yet, add it
          if (!subjectMap[subjectId]) {
            subjectMap[subjectId] = {
              _id: assignment.subjectId._id,
              name: assignment.subjectId.name,
              code: assignment.subjectId.code,
              type: assignment.subjectId.type,
              description: assignment.subjectId.description,
              educationLevel: assignment.subjectId.educationLevel || 'O_LEVEL',
              isPrincipal: assignment.subjectId.isPrincipal || false,
              isCompulsory: assignment.subjectId.isCompulsory || false,
              assignmentType: 'teacherSubject' // Assigned via TeacherSubject model
            };
            console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is assigned to teach ${assignment.subjectId.name} in class ${classId} via TeacherSubject model`);
          }
        }
      }
    }

    // Method 3: Check TeacherAssignment assignments
    if (classId) {
      const teacherAssignments = await TeacherAssignment.find({
        teacher: teacherId,
        class: classId
      }).populate('subject');

      // Add only the specific subjects the teacher is assigned to teach
      for (const assignment of teacherAssignments) {
        if (assignment.subject) {
          const subjectId = assignment.subject._id.toString();

          // If this subject is not in the map yet, add it
          if (!subjectMap[subjectId]) {
            subjectMap[subjectId] = {
              _id: assignment.subject._id,
              name: assignment.subject.name,
              code: assignment.subject.code,
              type: assignment.subject.type,
              description: assignment.subject.description,
              educationLevel: assignment.subject.educationLevel || 'O_LEVEL',
              isPrincipal: assignment.subject.isPrincipal || false,
              isCompulsory: assignment.subject.isCompulsory || false,
              assignmentType: 'teacherAssignment' // Assigned via TeacherAssignment model
            };
            console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is assigned to teach ${assignment.subject.name} in class ${classId} via TeacherAssignment model`);
          }
        }
      }
    }

    // Method 4: Check if the teacher is the class teacher
    if (classId) {
      const classObj = await Class.findOne({
        _id: classId,
        classTeacher: teacherId
      }).populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code type description educationLevel isPrincipal isCompulsory'
      });

      if (classObj) {
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is the class teacher for class ${classId}`);

        // Add all subjects in the class to the map
        for (const subjectAssignment of classObj.subjects) {
          if (subjectAssignment.subject) {
            const subjectId = subjectAssignment.subject._id.toString();

            // If this subject is not in the map yet, add it
            if (!subjectMap[subjectId]) {
              subjectMap[subjectId] = {
                _id: subjectAssignment.subject._id,
                name: subjectAssignment.subject.name,
                code: subjectAssignment.subject.code,
                type: subjectAssignment.subject.type,
                description: subjectAssignment.subject.description,
                educationLevel: subjectAssignment.subject.educationLevel || 'UNKNOWN',
                isPrincipal: subjectAssignment.subject.isPrincipal || false,
                isCompulsory: subjectAssignment.subject.isCompulsory || false,
                assignmentType: 'classTeacher' // Assigned as class teacher
              };
            }
          }
        }
      }
    }

    // Convert the map to an array
    const subjects = Object.values(subjectMap);
    console.log(`[EnhancedTeacherSubjectService] Found ${subjects.length} unique subjects for teacher ${teacherId}${classId ? ` in class ${classId}` : ' across all classes'}`);

    // If no subjects found and we're looking for a specific class, try to find subjects from other classes
    if (subjects.length === 0 && classId) {
      console.log(`[EnhancedTeacherSubjectService] WARNING: No subjects found for teacher ${teacherId} in class ${classId}`);

      // Let's check if the class exists and has subjects
      const classObj = await Class.findById(classId)
        .populate({
          path: 'subjects.subject',
          model: 'Subject',
          select: 'name code type description educationLevel isPrincipal isCompulsory'
        });

      if (!classObj) {
        console.log(`[EnhancedTeacherSubjectService] Class ${classId} not found`);
      } else {
        console.log(`[EnhancedTeacherSubjectService] Class ${classId} exists with ${classObj.subjects.length} subject assignments`);

        // For O-Level classes, check if the teacher is the class teacher
        if (classObj.educationLevel === 'O_LEVEL' && classObj.classTeacher && classObj.classTeacher.toString() === teacherId) {
          console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is the class teacher for O-Level class ${classId}, returning all subjects`);

          // Add all subjects in the class to the map
          for (const subjectAssignment of classObj.subjects) {
            if (subjectAssignment.subject) {
              const subjectId = subjectAssignment.subject._id.toString();

              // If this subject is not in the map yet, add it
              if (!subjectMap[subjectId]) {
                subjectMap[subjectId] = {
                  _id: subjectAssignment.subject._id,
                  name: subjectAssignment.subject.name,
                  code: subjectAssignment.subject.code,
                  type: subjectAssignment.subject.type,
                  description: subjectAssignment.subject.description,
                  educationLevel: subjectAssignment.subject.educationLevel || 'O_LEVEL',
                  isPrincipal: subjectAssignment.subject.isPrincipal || false,
                  isCompulsory: subjectAssignment.subject.isCompulsory || false,
                  assignmentType: 'classTeacher' // Class teacher has access to all subjects
                };
              }
            }
          }

          // Convert the map to an array again
          const oLevelSubjects = Object.values(subjectMap);
          console.log(`[EnhancedTeacherSubjectService] Returning ${oLevelSubjects.length} subjects for O-Level class ${classId}`);

          return oLevelSubjects;
        }
      }
    }

    return subjects;
  } catch (error) {
    console.error(`[EnhancedTeacherSubjectService] Error getting teacher subjects:`, error);
    return [];
  }
}

/**
 * Check if a teacher is authorized to teach a subject in a class
 * Enhanced version with strict subject-level access control
 *
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<boolean>} - Whether the teacher is authorized
 */
async function isTeacherAuthorizedForSubject(teacherId, classId, subjectId) {
  console.log(`[EnhancedTeacherSubjectService] Checking if teacher ${teacherId} is authorized to teach subject ${subjectId} in class ${classId}`);

  try {
    // Find the class to check its education level
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} not found`);
      return false;
    }

    // For O-Level classes, use strict subject-level access control
    if (classObj.educationLevel === 'O_LEVEL') {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} is an O-Level class, using strict subject-level access control`);

      // Check if the teacher is specifically assigned to this subject in this class
      return await isTeacherSpecificallyAssignedToSubject(teacherId, classId, subjectId);
    }

    // For A-Level classes, use the original service's method
    return await originalService.isTeacherAuthorizedForSubject(teacherId, classId, subjectId);
  } catch (error) {
    console.error(`[EnhancedTeacherSubjectService] Error checking teacher authorization:`, error);
    return false;
  }
}

/**
 * Check if a teacher is authorized to teach in a class
 * Enhanced version that treats O-Level classes the same as A-Level classes
 *
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>} - Whether the teacher is authorized
 */
async function isTeacherAuthorizedForClass(teacherId, classId) {
  console.log(`[EnhancedTeacherSubjectService] Checking if teacher ${teacherId} is authorized to teach in class ${classId}`);

  try {
    // Find the class to check its education level
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} not found`);
      return false;
    }

    // For O-Level classes, check if the teacher exists in the Teacher model
    if (classObj.educationLevel === 'O_LEVEL') {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} is an O-Level class`);

      // Check if the teacher exists
      const teacher = await Teacher.findById(teacherId);
      if (teacher) {
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} exists, authorizing for O-Level class ${classId}`);
        return true;
      }
    }

    // For A-Level classes or if the teacher doesn't exist,
    // use the original service's method
    return await originalService.isTeacherAuthorizedForClass(teacherId, classId);
  } catch (error) {
    console.error(`[EnhancedTeacherSubjectService] Error checking teacher authorization:`, error);
    return false;
  }
}

/**
 * Get students assigned to a teacher for a specific class
 * Enhanced version with strict subject-level access control
 *
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID (optional)
 * @returns {Promise<Array>} - Array of students
 */
async function getTeacherStudents(teacherId, classId, subjectId = null) {
  console.log(`[EnhancedTeacherSubjectService] Getting students for teacher ${teacherId} in class ${classId}${subjectId ? ` for subject ${subjectId}` : ''}`);

  try {
    // Find the class to check its education level
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} not found`);
      return [];
    }

    // For O-Level classes, use strict subject-level access control
    if (classObj.educationLevel === 'O_LEVEL') {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} is an O-Level class, using strict subject-level access control`);

      // First check if the teacher is the class teacher
      const isClassTeacher = classObj.classTeacher && classObj.classTeacher.toString() === teacherId.toString();

      if (isClassTeacher) {
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is the class teacher for O-Level class ${classId}`);

        // If a specific subject is provided, filter students who take that subject
        if (subjectId) {
          console.log(`[EnhancedTeacherSubjectService] Filtering students who take subject ${subjectId}`);

          // Get the subject to check if it's a core subject
          const subject = await Subject.findById(subjectId);
          const isCoreSubject = subject && subject.type === 'CORE';

          // Get all students in the class
          const allStudents = await Student.find({ class: classId })
            .select('_id firstName lastName rollNumber admissionNumber gender form selectedSubjects');

          // If it's a core subject, all students take it
          if (isCoreSubject) {
            console.log(`[EnhancedTeacherSubjectService] Subject ${subjectId} is a core subject, all students take it`);
            return allStudents;
          }

          // If it's an optional subject, filter students who have selected it
          console.log(`[EnhancedTeacherSubjectService] Subject ${subjectId} is an optional subject, filtering students`);

          // Create a set of student IDs who take this subject
          const studentIdSet = new Set();

          // Method 1: Check the Student model's selectedSubjects field
          for (const student of allStudents) {
            if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
              const selectedSubjects = student.selectedSubjects.map(s => s.toString());
              if (selectedSubjects.includes(subjectId)) {
                studentIdSet.add(student._id.toString());
                console.log(`[EnhancedTeacherSubjectService] Student ${student._id} takes subject ${subjectId} (from Student model)`);
              }
            }
          }

          // Method 2: Check the StudentSubjectSelection model
          const StudentSubjectSelection = mongoose.model('StudentSubjectSelection');
          const studentIds = allStudents.map(s => s._id);
          const selections = await StudentSubjectSelection.find({ student: { $in: studentIds } });

          for (const selection of selections) {
            const studentId = selection.student.toString();
            const coreSubjects = selection.coreSubjects.map(s => s.toString());
            const optionalSubjects = selection.optionalSubjects.map(s => s.toString());

            if (coreSubjects.includes(subjectId) || optionalSubjects.includes(subjectId)) {
              studentIdSet.add(studentId);
              console.log(`[EnhancedTeacherSubjectService] Student ${studentId} takes subject ${subjectId} (from StudentSubjectSelection model)`);
            }
          }

          // Filter students who take this subject
          const filteredStudents = allStudents.filter(student =>
            studentIdSet.has(student._id.toString()));

          console.log(`[EnhancedTeacherSubjectService] Found ${filteredStudents.length} students who take subject ${subjectId} in class ${classId}`);
          return filteredStudents;
        } else {
          // If no specific subject is provided, return all students in the class
          const students = await Student.find({ class: classId })
            .select('_id firstName lastName rollNumber admissionNumber gender form');

          console.log(`[EnhancedTeacherSubjectService] Found ${students.length} students in O-Level class ${classId}`);
          return students;
        }
      }

      // If the teacher is not the class teacher, check which subjects they teach
      const teacherSubjects = [];

      // Check if the teacher is assigned to any subjects in the class
      if (classObj.subjects && Array.isArray(classObj.subjects)) {
        for (const subjectAssignment of classObj.subjects) {
          if (subjectAssignment.teacher && subjectAssignment.teacher.toString() === teacherId.toString()) {
            const subjectId = subjectAssignment.subject?.toString() || subjectAssignment.subject;
            if (subjectId) {
              teacherSubjects.push(subjectId);
              console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is assigned to subject ${subjectId} in class ${classId}`);
            }
          }
        }
      }

      // If a specific subject is provided, check if the teacher teaches it
      if (subjectId) {
        if (!teacherSubjects.includes(subjectId)) {
          // Check if the teacher is specifically assigned to this subject
          const isAssigned = await isTeacherSpecificallyAssignedToSubject(teacherId, classId, subjectId);
          if (!isAssigned) {
            console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is not assigned to subject ${subjectId} in class ${classId}`);
            return [];
          }
        }

        // Get students who take this subject
        console.log(`[EnhancedTeacherSubjectService] Getting students who take subject ${subjectId} in class ${classId}`);

        // Get the subject to check if it's a core subject
        const subject = await Subject.findById(subjectId);
        const isCoreSubject = subject && subject.type === 'CORE';

        // Get all students in the class
        const allStudents = await Student.find({ class: classId })
          .select('_id firstName lastName rollNumber admissionNumber gender form selectedSubjects');

        // If it's a core subject, all students take it
        if (isCoreSubject) {
          console.log(`[EnhancedTeacherSubjectService] Subject ${subjectId} is a core subject, all students take it`);
          return allStudents;
        }

        // If it's an optional subject, filter students who have selected it
        console.log(`[EnhancedTeacherSubjectService] Subject ${subjectId} is an optional subject, filtering students`);

        // Create a set of student IDs who take this subject
        const studentIdSet = new Set();

        // Method 1: Check the Student model's selectedSubjects field
        for (const student of allStudents) {
          if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
            const selectedSubjects = student.selectedSubjects.map(s => s.toString());
            if (selectedSubjects.includes(subjectId)) {
              studentIdSet.add(student._id.toString());
              console.log(`[EnhancedTeacherSubjectService] Student ${student._id} takes subject ${subjectId} (from Student model)`);
            }
          }
        }

        // Method 2: Check the StudentSubjectSelection model
        const StudentSubjectSelection = mongoose.model('StudentSubjectSelection');
        const studentIds = allStudents.map(s => s._id);
        const selections = await StudentSubjectSelection.find({ student: { $in: studentIds } });

        for (const selection of selections) {
          const studentId = selection.student.toString();
          const coreSubjects = selection.coreSubjects.map(s => s.toString());
          const optionalSubjects = selection.optionalSubjects.map(s => s.toString());

          if (coreSubjects.includes(subjectId) || optionalSubjects.includes(subjectId)) {
            studentIdSet.add(studentId);
            console.log(`[EnhancedTeacherSubjectService] Student ${studentId} takes subject ${subjectId} (from StudentSubjectSelection model)`);
          }
        }

        // Filter students who take this subject
        const filteredStudents = allStudents.filter(student =>
          studentIdSet.has(student._id.toString()));

        console.log(`[EnhancedTeacherSubjectService] Found ${filteredStudents.length} students who take subject ${subjectId} in class ${classId}`);
        return filteredStudents;
      } else if (teacherSubjects.length > 0) {
        // If no specific subject is provided but the teacher teaches some subjects,
        // return all students who take any of the teacher's subjects
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} teaches ${teacherSubjects.length} subjects in class ${classId}`);

        // Get all students in the class
        const allStudents = await Student.find({ class: classId })
          .select('_id firstName lastName rollNumber admissionNumber gender form selectedSubjects');

        // Create a set of student IDs who take any of the teacher's subjects
        const studentIdSet = new Set();

        // Check which subjects are core subjects
        const subjects = await Subject.find({ _id: { $in: teacherSubjects } });
        const coreSubjectIds = subjects
          .filter(subject => subject.type === 'CORE')
          .map(subject => subject._id.toString());

        // If the teacher teaches any core subjects, all students take them
        if (coreSubjectIds.length > 0) {
          console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} teaches core subjects: ${coreSubjectIds.join(', ')}`);
          return allStudents;
        }

        // Otherwise, filter students who take any of the teacher's subjects
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} teaches optional subjects: ${teacherSubjects.join(', ')}`);

        // Method 1: Check the Student model's selectedSubjects field
        for (const student of allStudents) {
          if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
            const selectedSubjects = student.selectedSubjects.map(s => s.toString());
            for (const subjectId of teacherSubjects) {
              if (selectedSubjects.includes(subjectId)) {
                studentIdSet.add(student._id.toString());
                console.log(`[EnhancedTeacherSubjectService] Student ${student._id} takes subject ${subjectId} (from Student model)`);
                break;
              }
            }
          }
        }

        // Method 2: Check the StudentSubjectSelection model
        const StudentSubjectSelection = mongoose.model('StudentSubjectSelection');
        const studentIds = allStudents.map(s => s._id);
        const selections = await StudentSubjectSelection.find({ student: { $in: studentIds } });

        for (const selection of selections) {
          const studentId = selection.student.toString();
          const coreSubjects = selection.coreSubjects.map(s => s.toString());
          const optionalSubjects = selection.optionalSubjects.map(s => s.toString());

          let takesAnySubject = false;
          for (const subjectId of teacherSubjects) {
            if (coreSubjects.includes(subjectId) || optionalSubjects.includes(subjectId)) {
              takesAnySubject = true;
              console.log(`[EnhancedTeacherSubjectService] Student ${studentId} takes subject ${subjectId} (from StudentSubjectSelection model)`);
              break;
            }
          }

          if (takesAnySubject) {
            studentIdSet.add(studentId);
          }
        }

        // Filter students who take any of the teacher's subjects
        const filteredStudents = allStudents.filter(student =>
          studentIdSet.has(student._id.toString()));

        console.log(`[EnhancedTeacherSubjectService] Found ${filteredStudents.length} students who take any of teacher ${teacherId}'s subjects in class ${classId}`);
        return filteredStudents;
      }
    }

    // For A-Level classes or if the teacher doesn't exist,
    // use the original service's method
    return await originalService.getTeacherStudents(teacherId, classId);
  } catch (error) {
    console.error(`[EnhancedTeacherSubjectService] Error getting teacher students:`, error);
    return [];
  }
}

/**
 * Check if a teacher is assigned to a class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>} - Whether the teacher is assigned to the class
 */
async function isTeacherAssignedToClass(teacherId, classId) {
  console.log(`[EnhancedTeacherSubjectService] Checking if teacher ${teacherId} is assigned to class ${classId}`);

  try {
    // Method 1: Check if the teacher is assigned to any subject in the class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} not found`);
      return false;
    }

    // Check if the teacher is the class teacher
    if (classObj.classTeacher && classObj.classTeacher.toString() === teacherId.toString()) {
      console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is the class teacher for class ${classId}`);
      return true;
    }

    // Check if the teacher is assigned to any subject in the class
    if (classObj.subjects && Array.isArray(classObj.subjects)) {
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.teacher && subjectAssignment.teacher.toString() === teacherId.toString()) {
          console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is assigned to a subject in class ${classId}`);
          return true;
        }
      }
    }

    // Method 2: Check TeacherSubject assignments
    const teacherSubjectAssignments = await TeacherSubject.find({
      teacherId: teacherId,
      classId: classId,
      status: 'active'
    });

    if (teacherSubjectAssignments.length > 0) {
      console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} has TeacherSubject assignments for class ${classId}`);
      return true;
    }

    // Method 3: Check TeacherAssignment assignments
    const teacherAssignments = await TeacherAssignment.find({
      teacher: teacherId,
      class: classId
    });

    if (teacherAssignments.length > 0) {
      console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} has TeacherAssignment assignments for class ${classId}`);
      return true;
    }

    // For O-Level classes, check if the teacher exists in the Teacher model
    if (classObj.educationLevel === 'O_LEVEL') {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} is an O-Level class`);

      // Check if the teacher exists
      const teacher = await Teacher.findById(teacherId);
      if (teacher) {
        console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} exists, authorizing for O-Level class ${classId}`);
        return true;
      }
    }

    console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is not assigned to class ${classId}`);
    return false;
  } catch (error) {
    console.error(`[EnhancedTeacherSubjectService] Error checking teacher assignment:`, error);
    return false;
  }
}

/**
 * Check if a teacher is assigned to a subject in a class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<boolean>} - Whether the teacher is assigned to the subject
 */
async function isTeacherAssignedToSubject(teacherId, classId, subjectId) {
  console.log(`[EnhancedTeacherSubjectService] Checking if teacher ${teacherId} is assigned to subject ${subjectId} in class ${classId}`);

  try {
    // Find the class to check its education level
    const classObj = await Class.findById(classId);
    if (!classObj) {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} not found`);
      return false;
    }

    // For O-Level classes, use strict subject-level access control
    if (classObj.educationLevel === 'O_LEVEL') {
      console.log(`[EnhancedTeacherSubjectService] Class ${classId} is an O-Level class, using strict subject-level access control`);

      // Use the specific assignment check for O-Level classes
      return await isTeacherSpecificallyAssignedToSubject(teacherId, classId, subjectId);
    }

    // Method 1: Check if the teacher is directly assigned to the subject in the class
    if (classObj.subjects && Array.isArray(classObj.subjects)) {
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.subject &&
            subjectAssignment.subject.toString() === subjectId.toString() &&
            subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacherId.toString()) {
          console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is directly assigned to subject ${subjectId} in class ${classId}`);
          return true;
        }
      }
    }

    // Method 2: Check TeacherSubject assignments
    const teacherSubjectAssignments = await TeacherSubject.find({
      teacherId: teacherId,
      classId: classId,
      subjectId: subjectId,
      status: 'active'
    });

    if (teacherSubjectAssignments.length > 0) {
      console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} has TeacherSubject assignments for subject ${subjectId} in class ${classId}`);
      return true;
    }

    // Method 3: Check TeacherAssignment assignments
    const teacherAssignments = await TeacherAssignment.find({
      teacher: teacherId,
      class: classId,
      subject: subjectId
    });

    if (teacherAssignments.length > 0) {
      console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} has TeacherAssignment assignments for subject ${subjectId} in class ${classId}`);
      return true;
    }

    console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is not assigned to subject ${subjectId} in class ${classId}`);
    return false;
  } catch (error) {
    console.error(`[EnhancedTeacherSubjectService] Error checking teacher subject assignment:`, error);
    return false;
  }
}

/**
 * Check if a teacher is specifically assigned to teach a subject in a class
 * This is a stricter check than isTeacherAuthorizedForSubject
 *
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<boolean>} - Whether the teacher is specifically assigned to the subject
 */
async function isTeacherSpecificallyAssignedToSubject(teacherId, classId, subjectId) {
  console.log(`[EnhancedTeacherSubjectService] Checking if teacher ${teacherId} is specifically assigned to subject ${subjectId} in class ${classId}`);

  try {
    // Method 1: Check if the teacher is directly assigned to this subject in the Class model
    const classObj = await Class.findById(classId);
    if (classObj && classObj.subjects && Array.isArray(classObj.subjects)) {
      for (const subjectAssignment of classObj.subjects) {
        const assignedSubjectId = subjectAssignment.subject?.toString() || subjectAssignment.subject;
        const assignedTeacherId = subjectAssignment.teacher?.toString();

        if (assignedSubjectId === subjectId && assignedTeacherId === teacherId.toString()) {
          console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is directly assigned to subject ${subjectId} in class ${classId}`);
          return true;
        }
      }
    }

    // Method 2: Check TeacherSubject assignments
    const teacherSubjectAssignment = await TeacherSubject.findOne({
      teacherId: teacherId,
      classId: classId,
      subjectId: subjectId,
      status: 'active'
    });

    if (teacherSubjectAssignment) {
      console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} has a TeacherSubject assignment for subject ${subjectId} in class ${classId}`);
      return true;
    }

    // Method 3: Check TeacherAssignment assignments
    const teacherAssignment = await TeacherAssignment.findOne({
      teacher: teacherId,
      class: classId,
      subject: subjectId
    });

    if (teacherAssignment) {
      console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} has a TeacherAssignment for subject ${subjectId} in class ${classId}`);
      return true;
    }

    console.log(`[EnhancedTeacherSubjectService] Teacher ${teacherId} is NOT specifically assigned to subject ${subjectId} in class ${classId}`);
    return false;
  } catch (error) {
    console.error(`[EnhancedTeacherSubjectService] Error checking specific teacher assignment:`, error);
    return false;
  }
}

// Export the enhanced service methods
module.exports = {
  getTeacherSubjects,
  isTeacherAuthorizedForSubject,
  isTeacherAuthorizedForClass,
  getTeacherStudents,
  isTeacherAssignedToClass,
  isTeacherAssignedToSubject,
  isTeacherSpecificallyAssignedToSubject,
  // Re-export other methods from the original service
  getTeacherSubjectsForStudent: originalService.getTeacherSubjectsForStudent,
  clearCache: originalService.clearCache
};
