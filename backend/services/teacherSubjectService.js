/**
 * Teacher Subject Service
 *
 * This service provides a centralized way to handle teacher-subject relationships.
 * It ensures strict filtering based on teacher assignments and provides consistent
 * behavior across all endpoints.
 */

const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const TeacherAssignment = require('../models/TeacherAssignment');
const Student = require('../models/Student');

// Cache for teacher-subject relationships
const cache = {
  teacherSubjects: new Map(), // Map of teacherId -> Map of classId -> subjects
  lastUpdated: new Map(), // Map of teacherId -> timestamp
  TTL: 1 * 60 * 1000, // 1 minute - reduced to ensure fresh data
};

/**
 * Get subjects assigned to a teacher for a specific class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID (optional)
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @param {boolean} includeStudentSubjects - Whether to include subjects from students in the class (default: false)
 * @returns {Promise<Array>} - Array of subjects
 */
async function getTeacherSubjects(teacherId, classId = null, useCache = true, includeStudentSubjects = false) {
  console.log(`[TeacherSubjectService] Getting subjects for teacher ${teacherId}${classId ? ` in class ${classId}` : ''} (useCache: ${useCache}, includeStudentSubjects: ${includeStudentSubjects})`);

  // Check cache if enabled
  if (useCache) {
    const cacheKey = `${teacherId}:${classId || 'all'}:${includeStudentSubjects ? 'withStudents' : 'direct'}`;
    const cachedData = getCachedSubjects(teacherId, classId, includeStudentSubjects);
    if (cachedData) {
      console.log(`[TeacherSubjectService] Cache hit for ${cacheKey}`);
      return cachedData;
    }
    console.log(`[TeacherSubjectService] Cache miss for ${cacheKey}`);
  }

  try {
    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      console.log(`[TeacherSubjectService] Teacher not found: ${teacherId}`);
      return [];
    }

    // Create a map to store unique subjects
    const subjectMap = {};

    // Method 1: Get subjects directly assigned to the teacher
    // If classId is provided, find subjects for that specific class
    if (classId) {
      console.log(`[TeacherSubjectService] Finding subjects for teacher ${teacherId} in class ${classId}`);

      // Find the class and check if it exists
      const classObj = await Class.findById(classId)
        .populate({
          path: 'subjects.subject',
          model: 'Subject',
          select: 'name code type description educationLevel isPrincipal isCompulsory'
        });

      if (!classObj) {
        console.log(`[TeacherSubjectService] Class not found: ${classId}`);
        return [];
      }

      // Log all subjects in the class for debugging
      console.log(`[TeacherSubjectService] Class ${classId} has ${classObj.subjects.length} subjects:`);

      // Filter subjects taught by this teacher in this class
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacherId &&
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
              educationLevel: subjectAssignment.subject.educationLevel || 'UNKNOWN',
              isPrincipal: subjectAssignment.subject.isPrincipal || false,
              isCompulsory: subjectAssignment.subject.isCompulsory || false,
              assignmentType: 'direct' // Directly assigned to teach this subject
            };
            console.log(`[TeacherSubjectService] Teacher ${teacherId} is directly assigned to teach ${subjectAssignment.subject.name} in class ${classId}`);
          }
        }
      }

      // Method 2: If requested, include subjects from students in the class that the teacher teaches in other classes
      if (includeStudentSubjects) {
        console.log(`[TeacherSubjectService] Including subjects from students in class ${classId} that teacher ${teacherId} teaches in other classes`);

        // First, get all subjects the teacher teaches across all classes
        const allTeacherSubjects = await getAllTeacherSubjects(teacherId);
        const teacherSubjectIds = allTeacherSubjects.map(subject => subject._id.toString());

        if (teacherSubjectIds.length === 0) {
          console.log(`[TeacherSubjectService] Teacher ${teacherId} doesn't teach any subjects in any class`);
        } else {
          console.log(`[TeacherSubjectService] Teacher ${teacherId} teaches ${teacherSubjectIds.length} subjects across all classes`);

          // Get all students in the class
          const students = await Student.find({ class: classId })
            .populate({
              path: 'subjectCombination',
              populate: {
                path: 'subjects compulsorySubjects',
                model: 'Subject',
                select: 'name code type description educationLevel isPrincipal isCompulsory'
              }
            })
            .populate('selectedSubjects');

          console.log(`[TeacherSubjectService] Found ${students.length} students in class ${classId}`);

          // Check each student's subjects
          for (const student of students) {
            // If student has a subject combination
            if (student.subjectCombination && typeof student.subjectCombination === 'object') {
              // Process principal subjects
              if (student.subjectCombination.subjects && Array.isArray(student.subjectCombination.subjects)) {
                for (const subject of student.subjectCombination.subjects) {
                  if (typeof subject === 'object' && subject._id) {
                    const subjectId = subject._id.toString();
                    if (teacherSubjectIds.includes(subjectId) && !subjectMap[subjectId]) {
                      subjectMap[subjectId] = {
                        _id: subject._id,
                        name: subject.name,
                        code: subject.code,
                        type: subject.type,
                        description: subject.description,
                        educationLevel: subject.educationLevel || 'UNKNOWN',
                        isPrincipal: true,
                        isCompulsory: false,
                        assignmentType: 'student' // From student's combination
                      };
                      console.log(`[TeacherSubjectService] Added principal subject ${subject.name} from student ${student._id} in class ${classId}`);
                    }
                  }
                }
              }

              // Process subsidiary subjects
              if (student.subjectCombination.compulsorySubjects && Array.isArray(student.subjectCombination.compulsorySubjects)) {
                for (const subject of student.subjectCombination.compulsorySubjects) {
                  if (typeof subject === 'object' && subject._id) {
                    const subjectId = subject._id.toString();
                    if (teacherSubjectIds.includes(subjectId) && !subjectMap[subjectId]) {
                      subjectMap[subjectId] = {
                        _id: subject._id,
                        name: subject.name,
                        code: subject.code,
                        type: subject.type,
                        description: subject.description,
                        educationLevel: subject.educationLevel || 'UNKNOWN',
                        isPrincipal: false,
                        isCompulsory: true,
                        assignmentType: 'student' // From student's combination
                      };
                      console.log(`[TeacherSubjectService] Added subsidiary subject ${subject.name} from student ${student._id} in class ${classId}`);
                    }
                  }
                }
              }
            }

            // Check selected subjects as well
            if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
              for (const subject of student.selectedSubjects) {
                if (typeof subject === 'object' && subject._id) {
                  const subjectId = subject._id.toString();
                  if (teacherSubjectIds.includes(subjectId) && !subjectMap[subjectId]) {
                    subjectMap[subjectId] = {
                      _id: subject._id,
                      name: subject.name,
                      code: subject.code,
                      type: subject.type,
                      description: subject.description,
                      educationLevel: subject.educationLevel || 'UNKNOWN',
                      isPrincipal: false,
                      isCompulsory: false,
                      assignmentType: 'selected' // From student's selected subjects
                    };
                    console.log(`[TeacherSubjectService] Added selected subject ${subject.name} from student ${student._id} in class ${classId}`);
                  }
                }
              }
            }
          }
        }
      }
    } else {
      // If no classId, find all subjects across all classes
      const allSubjects = await getAllTeacherSubjects(teacherId);

      // Add all subjects to the map
      for (const subject of allSubjects) {
        const subjectId = subject._id.toString();
        if (!subjectMap[subjectId]) {
          subjectMap[subjectId] = subject;
        }
      }
    }

    // Convert the map to an array
    const subjects = Object.values(subjectMap);
    console.log(`[TeacherSubjectService] Found ${subjects.length} unique subjects for teacher ${teacherId}${classId ? ` in class ${classId}` : ' across all classes'}`);

    // If no subjects found and we're looking for a specific class, try to find subjects from other classes
    if (subjects.length === 0 && classId) {
      console.log(`[TeacherSubjectService] WARNING: No subjects found for teacher ${teacherId} in class ${classId}`);

      // Let's check if the class exists and has subjects
      const classObj = await Class.findById(classId)
        .populate({
          path: 'subjects.subject',
          model: 'Subject',
          select: 'name code type description educationLevel isPrincipal isCompulsory'
        });

      if (!classObj) {
        console.log(`[TeacherSubjectService] Class ${classId} not found`);
      } else {
        console.log(`[TeacherSubjectService] Class ${classId} exists with ${classObj.subjects.length} subject assignments`);

        // Check if the teacher exists
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
          console.log(`[TeacherSubjectService] Teacher ${teacherId} not found`);
        } else {
          console.log(`[TeacherSubjectService] Teacher ${teacherId} exists: ${teacher.firstName} ${teacher.lastName}`);

          // Try to find subjects that the teacher teaches in other classes
          // that are also taken by students in this class
          console.log(`[TeacherSubjectService] Checking if teacher ${teacherId} teaches subjects that students in class ${classId} are taking`);

          // Get all subjects the teacher teaches in any class
          const allTeacherSubjects = await getAllTeacherSubjects(teacherId);
          const teacherSubjectIds = allTeacherSubjects.map(subject => subject._id.toString());

          if (teacherSubjectIds.length > 0) {
            console.log(`[TeacherSubjectService] Teacher ${teacherId} teaches ${teacherSubjectIds.length} subjects across all classes`);

            // Get all students in the class
            const students = await Student.find({ class: classId })
              .populate({
                path: 'subjectCombination',
                populate: {
                  path: 'subjects compulsorySubjects',
                  model: 'Subject',
                  select: 'name code type description educationLevel isPrincipal isCompulsory'
                }
              })
              .populate('selectedSubjects');

            console.log(`[TeacherSubjectService] Found ${students.length} students in class ${classId}`);

            // Check if any student has a subject that the teacher teaches
            for (const student of students) {
              if (student.subjectCombination && typeof student.subjectCombination === 'object') {
                // Process principal subjects
                if (student.subjectCombination.subjects && Array.isArray(student.subjectCombination.subjects)) {
                  for (const subject of student.subjectCombination.subjects) {
                    if (typeof subject === 'object' && subject._id) {
                      const subjectId = subject._id.toString();
                      if (teacherSubjectIds.includes(subjectId) && !subjectMap[subjectId]) {
                        subjectMap[subjectId] = {
                          _id: subject._id,
                          name: subject.name,
                          code: subject.code,
                          type: subject.type,
                          description: subject.description,
                          educationLevel: subject.educationLevel || 'UNKNOWN',
                          isPrincipal: true,
                          isCompulsory: false,
                          assignmentType: 'student-combination' // From student's combination
                        };
                        console.log(`[TeacherSubjectService] Added principal subject ${subject.name} from student ${student._id} in class ${classId}`);
                      }
                    }
                  }
                }

                // Process subsidiary subjects
                if (student.subjectCombination.compulsorySubjects && Array.isArray(student.subjectCombination.compulsorySubjects)) {
                  for (const subject of student.subjectCombination.compulsorySubjects) {
                    if (typeof subject === 'object' && subject._id) {
                      const subjectId = subject._id.toString();
                      if (teacherSubjectIds.includes(subjectId) && !subjectMap[subjectId]) {
                        subjectMap[subjectId] = {
                          _id: subject._id,
                          name: subject.name,
                          code: subject.code,
                          type: subject.type,
                          description: subject.description,
                          educationLevel: subject.educationLevel || 'UNKNOWN',
                          isPrincipal: false,
                          isCompulsory: true,
                          assignmentType: 'student-combination' // From student's combination
                        };
                        console.log(`[TeacherSubjectService] Added subsidiary subject ${subject.name} from student ${student._id} in class ${classId}`);
                      }
                    }
                  }
                }
              }

              // Check selected subjects as well
              if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
                for (const subject of student.selectedSubjects) {
                  if (typeof subject === 'object' && subject._id) {
                    const subjectId = subject._id.toString();
                    if (teacherSubjectIds.includes(subjectId) && !subjectMap[subjectId]) {
                      subjectMap[subjectId] = {
                        _id: subject._id,
                        name: subject.name,
                        code: subject.code,
                        type: subject.type,
                        description: subject.description,
                        educationLevel: subject.educationLevel || 'UNKNOWN',
                        isPrincipal: false,
                        isCompulsory: false,
                        assignmentType: 'student-selected' // From student's selected subjects
                      };
                      console.log(`[TeacherSubjectService] Added selected subject ${subject.name} from student ${student._id} in class ${classId}`);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Cache the results
    if (useCache) {
      cacheSubjects(teacherId, classId, subjects, includeStudentSubjects);
    }

    return subjects;
  } catch (error) {
    console.error(`[TeacherSubjectService] Error getting teacher subjects:`, error);
    return [];
  }
}

/**
 * Get all subjects a teacher teaches across all classes
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Array>} - Array of subjects
 * @private
 */
async function getAllTeacherSubjects(teacherId) {
  console.log(`[TeacherSubjectService] Getting all subjects for teacher ${teacherId} across all classes`);

  try {
    // Find all classes where this teacher is assigned to teach
    const classes = await Class.find({
      'subjects.teacher': teacherId
    })
    .populate({
      path: 'subjects.subject',
      model: 'Subject',
      select: 'name code type description educationLevel isPrincipal isCompulsory'
    });

    // Create a map to store unique subjects
    const subjectMap = {};

    // Process each class
    for (const classObj of classes) {
      // Process each subject assignment in the class
      for (const subjectAssignment of classObj.subjects) {
        if (subjectAssignment.teacher &&
            subjectAssignment.teacher.toString() === teacherId &&
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
              educationLevel: subjectAssignment.subject.educationLevel || 'UNKNOWN',
              isPrincipal: subjectAssignment.subject.isPrincipal || false,
              isCompulsory: subjectAssignment.subject.isCompulsory || false,
              assignmentType: 'direct' // Directly assigned to teach this subject
            };
          }
        }
      }
    }

    // Convert the map to an array
    const subjects = Object.values(subjectMap);
    console.log(`[TeacherSubjectService] Found ${subjects.length} unique subjects for teacher ${teacherId} across all classes`);

    return subjects;
  } catch (error) {
    console.error(`[TeacherSubjectService] Error getting all teacher subjects:`, error);
    return [];
  }
}

/**
 * Get students assigned to a teacher for a specific class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} - Array of students
 */
async function getTeacherStudents(teacherId, classId) {
  console.log(`[TeacherSubjectService] Getting students for teacher ${teacherId} in class ${classId}`);

  try {
    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      console.log(`[TeacherSubjectService] Teacher not found: ${teacherId}`);
      return [];
    }

    // Check if the teacher is assigned to the class
    const classObj = await Class.findOne({
      _id: classId,
      'subjects.teacher': teacherId
    });

    if (!classObj) {
      console.log(`[TeacherSubjectService] Teacher ${teacherId} is not assigned to class ${classId}`);
      return [];
    }

    console.log(`[TeacherSubjectService] Teacher ${teacherId} is assigned to class ${classId}`);

    // Get the teacher's assigned subjects for this class
    const teacherSubjects = await getTeacherSubjects(teacherId, classId);
    const teacherSubjectIds = teacherSubjects.map(subject => subject._id.toString());

    console.log(`[TeacherSubjectService] Teacher ${teacherId} teaches ${teacherSubjectIds.length} subjects in class ${classId}:`, teacherSubjectIds);

    // Find all students in the class with deep population of subject combinations
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

    // Log subject combinations for debugging
    for (const student of allStudents) {
      if (student.subjectCombination) {
        console.log(`[TeacherSubjectService] Student ${student._id} has subject combination: ${student.subjectCombination.name || student.subjectCombination.code}`);

        // Log principal subjects
        if (student.subjectCombination.subjects && Array.isArray(student.subjectCombination.subjects)) {
          const principalSubjects = student.subjectCombination.subjects
            .filter(s => typeof s === 'object' && s._id)
            .map(s => s.name || s.code);
          console.log(`[TeacherSubjectService] Principal subjects: ${principalSubjects.join(', ')}`);
        }

        // Log subsidiary subjects
        if (student.subjectCombination.compulsorySubjects && Array.isArray(student.subjectCombination.compulsorySubjects)) {
          const subsidiarySubjects = student.subjectCombination.compulsorySubjects
            .filter(s => typeof s === 'object' && s._id)
            .map(s => s.name || s.code);
          console.log(`[TeacherSubjectService] Subsidiary subjects: ${subsidiarySubjects.join(', ')}`);
        }
      } else {
        console.log(`[TeacherSubjectService] Student ${student._id} has no subject combination`);
      }
    }

    console.log(`[TeacherSubjectService] Found ${allStudents.length} total students in class ${classId}`);

    // First, determine if this is an A-Level class
    const isALevelClass = classObj && (
      classObj.form === 5 ||
      classObj.form === 6 ||
      classObj.educationLevel === 'A_LEVEL' ||
      (classObj.name && (
        classObj.name.toUpperCase().includes('FORM 5') ||
        classObj.name.toUpperCase().includes('FORM 6') ||
        classObj.name.toUpperCase().includes('FORM V') ||
        classObj.name.toUpperCase().includes('FORM VI') ||
        classObj.name.toUpperCase().includes('F5') ||
        classObj.name.toUpperCase().includes('F6') ||
        classObj.name.toUpperCase().includes('FV') ||
        classObj.name.toUpperCase().includes('FVI') ||
        classObj.name.toUpperCase().includes('A-LEVEL') ||
        classObj.name.toUpperCase().includes('A LEVEL')
      ))
    );

    // Special case for this school - force A-Level class if name contains 'FORM V' or 'FORM VI'
    let forceALevel = false;
    if (classObj?.name && (
      classObj.name.toUpperCase().includes('FORM V') ||
      classObj.name.toUpperCase().includes('FORM VI')
    )) {
      console.log(`[TeacherSubjectService] Forcing class ${classObj.name} to be recognized as an A-Level class`);
      forceALevel = true;
    }

    // If forced or detected as A-Level, set isALevelClass to true
    if (forceALevel) {
      console.log(`[TeacherSubjectService] Class ${classId} is forced to be an A-Level class: ${classObj?.name}`);
    } else {
      console.log(`[TeacherSubjectService] Class ${classId} is ${isALevelClass ? 'an A-Level' : 'not an A-Level'} class: ${classObj?.name}, Form: ${classObj?.form}`);
    }

    // Filter students based on the teacher's subjects
    const filteredStudents = allStudents.filter(student => {
      // Check if the student is an A-Level student
      const isALevelStudent = student.educationLevel === 'A_LEVEL' ||
                           student.form === 5 ||
                           student.form === 6;

      // CASE 1: Student has a subject combination
      if (student.subjectCombination && typeof student.subjectCombination === 'object') {
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

        // Check if any of the student's subjects are taught by the teacher
        const hasTeacherSubject = studentSubjectIds.some(subjectId =>
          teacherSubjectIds.includes(subjectId)
        );

        if (hasTeacherSubject) {
          console.log(`[TeacherSubjectService] Student ${student._id} has subjects taught by teacher ${teacherId}`);
          return true;
        }
      }

      // CASE 2: Student doesn't have a subject combination
      console.log(`[TeacherSubjectService] Student ${student._id} has no subject combination, education level: ${student.educationLevel}, form: ${student.form}`);

      // CASE 2A: A-Level class with A-Level student
      if ((isALevelClass || forceALevel) && isALevelStudent) {
        // For A-Level students in A-Level classes, include them if the teacher is assigned to the class
        // We already checked above that the teacher is assigned to the class, so we can include all A-Level students
        console.log(`[TeacherSubjectService] A-Level student ${student._id} in A-Level class ${classId}, including in teacher's students`);
        return true;
      }
      // CASE 2B: A-Level class with O-Level student
      else if ((isALevelClass || forceALevel) && !isALevelStudent) {
        // Don't include O-Level students in A-Level classes
        console.log(`[TeacherSubjectService] O-Level student ${student._id} in A-Level class ${classId}, excluding from teacher's students`);
        return false;
      }
      // CASE 2C: O-Level class with A-Level student
      else if (!isALevelClass && !forceALevel && isALevelStudent) {
        // A-Level students in O-Level classes should have subject combinations
        console.log(`[TeacherSubjectService] A-Level student ${student._id} in O-Level class ${classId} has no subject combination, excluding from teacher's students`);
        return false;
      }
      // CASE 2D: O-Level class with O-Level student
      else {
        // For O-Level students in O-Level classes, include them by default
        console.log(`[TeacherSubjectService] O-Level student ${student._id} in O-Level class ${classId}, including in teacher's students`);
        return true;
      }
    });

    console.log(`[TeacherSubjectService] Filtered to ${filteredStudents.length} students who have subjects taught by teacher ${teacherId}`);

    return filteredStudents;
  } catch (error) {
    console.error(`[TeacherSubjectService] Error getting teacher students:`, error);
    return [];
  }
}

/**
 * Check if a teacher is authorized to teach a subject in a class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<boolean>} - Whether the teacher is authorized
 */
async function isTeacherAuthorizedForSubject(teacherId, classId, subjectId) {
  console.log(`[TeacherSubjectService] Checking if teacher ${teacherId} is authorized to teach subject ${subjectId} in class ${classId}`);

  try {
    // Get the teacher's subjects for this class
    const teacherSubjects = await getTeacherSubjects(teacherId, classId);

    // Check if the subject is in the teacher's subjects
    const isAuthorized = teacherSubjects.some(subject => subject._id.toString() === subjectId);

    console.log(`[TeacherSubjectService] Teacher ${teacherId} is ${isAuthorized ? 'authorized' : 'not authorized'} to teach subject ${subjectId} in class ${classId}`);

    return isAuthorized;
  } catch (error) {
    console.error(`[TeacherSubjectService] Error checking teacher authorization:`, error);
    return false;
  }
}

/**
 * Check if a teacher is authorized to teach in a class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>} - Whether the teacher is authorized
 */
async function isTeacherAuthorizedForClass(teacherId, classId) {
  console.log(`[TeacherSubjectService] Checking if teacher ${teacherId} is authorized to teach in class ${classId}`);

  try {
    // Method 1: Check if the teacher is directly assigned to teach a subject in the class
    const classObj = await Class.findOne({
      _id: classId,
      'subjects.teacher': teacherId
    });

    if (classObj) {
      console.log(`[TeacherSubjectService] Teacher ${teacherId} is directly assigned to teach in class ${classId}`);
      return true;
    }

    // If we get here, the teacher is not directly assigned to the class
    console.log(`[TeacherSubjectService] Teacher ${teacherId} is NOT directly assigned to teach in class ${classId}`);

    // Let's log the class subjects to help with debugging
    const fullClassObj = await Class.findById(classId)
      .populate({
        path: 'subjects.subject',
        model: 'Subject'
      })
      .populate({
        path: 'subjects.teacher',
        model: 'Teacher',
        select: '_id firstName lastName'
      });

    if (fullClassObj) {
      console.log(`[TeacherSubjectService] Class ${classId} has ${fullClassObj.subjects.length} subject assignments:`);

      // Check if any subject has this teacher assigned
      let teacherFound = false;

      fullClassObj.subjects.forEach((subjectAssignment, index) => {
        const teacherInfo = subjectAssignment.teacher ?
          `${subjectAssignment.teacher._id} (${subjectAssignment.teacher.firstName} ${subjectAssignment.teacher.lastName})` :
          'No teacher assigned';
        const subjectInfo = subjectAssignment.subject ?
          `${subjectAssignment.subject._id} (${subjectAssignment.subject.name})` :
          'Unknown subject';
        console.log(`[TeacherSubjectService] Subject #${index + 1}: ${subjectInfo} - Teacher: ${teacherInfo}`);

        // Check if this subject has the teacher we're looking for
        if (subjectAssignment.teacher && subjectAssignment.teacher._id.toString() === teacherId) {
          teacherFound = true;
          console.log(`[TeacherSubjectService] Found teacher ${teacherId} assigned to subject ${subjectInfo}`);
        }
      });

      // If we found the teacher in any subject, return true
      if (teacherFound) {
        console.log(`[TeacherSubjectService] Teacher ${teacherId} is authorized to teach in class ${classId} based on subject assignments`);
        return true;
      }

      // Additional check: Look for the teacher in the class's classTeacher field
      if (fullClassObj.classTeacher && fullClassObj.classTeacher.toString() === teacherId) {
        console.log(`[TeacherSubjectService] Teacher ${teacherId} is the class teacher for class ${classId}`);
        return true;
      }

      // Additional check: Check if the teacher teaches any subjects in other classes
      // that students in this class are taking
      console.log(`[TeacherSubjectService] Checking if teacher ${teacherId} teaches subjects that students in class ${classId} are taking`);

      // Get all subjects the teacher teaches in any class
      const allTeacherSubjects = await getAllTeacherSubjects(teacherId);
      const teacherSubjectIds = allTeacherSubjects.map(subject => subject._id.toString());

      if (teacherSubjectIds.length > 0) {
        console.log(`[TeacherSubjectService] Teacher ${teacherId} teaches ${teacherSubjectIds.length} subjects across all classes`);

        // Get all students in the class
        const students = await Student.find({ class: classId })
          .populate({
            path: 'subjectCombination',
            populate: {
              path: 'subjects compulsorySubjects',
              model: 'Subject'
            }
          })
          .populate('selectedSubjects');

        console.log(`[TeacherSubjectService] Found ${students.length} students in class ${classId}`);

        // Check if any student has a subject that the teacher teaches
        for (const student of students) {
          if (student.subjectCombination && typeof student.subjectCombination === 'object') {
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
              teacherSubjectIds.includes(subjectId)
            );

            if (hasTeacherSubject) {
              console.log(`[TeacherSubjectService] Found student ${student._id} in class ${classId} who has a subject taught by teacher ${teacherId}`);
              return true;
            }
          }

          // Check selected subjects as well
          if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
            const selectedSubjectIds = student.selectedSubjects.map(s =>
              typeof s === 'object' ? s._id.toString() : s.toString()
            );

            const hasTeacherSubject = selectedSubjectIds.some(subjectId =>
              teacherSubjectIds.includes(subjectId)
            );

            if (hasTeacherSubject) {
              console.log(`[TeacherSubjectService] Found student ${student._id} in class ${classId} who has a selected subject taught by teacher ${teacherId}`);
              return true;
            }
          }
        }
      }
    } else {
      console.log(`[TeacherSubjectService] Class ${classId} not found`);
    }

    // If we get here, the teacher is not authorized for this class
    console.log(`[TeacherSubjectService] Teacher ${teacherId} is not authorized to teach in class ${classId}`);
    return false;
  } catch (error) {
    console.error(`[TeacherSubjectService] Error checking teacher authorization:`, error);
    return false;
  }
}

/**
 * Get cached subjects for a teacher
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID (optional)
 * @param {boolean} includeStudentSubjects - Whether to include subjects from students (optional)
 * @returns {Array|null} - Array of subjects or null if not cached
 */
function getCachedSubjects(teacherId, classId = null, includeStudentSubjects = false) {
  const now = Date.now();
  const lastUpdated = cache.lastUpdated.get(teacherId) || 0;

  // Check if cache is expired
  if (now - lastUpdated > cache.TTL) {
    console.log(`[TeacherSubjectService] Cache expired for teacher ${teacherId}`);
    return null;
  }

  // Get teacher's cache
  const teacherCache = cache.teacherSubjects.get(teacherId);
  if (!teacherCache) {
    return null;
  }

  // Get subjects for the specific class or all classes
  const key = `${classId || 'all'}:${includeStudentSubjects ? 'withStudents' : 'direct'}`;
  return teacherCache.get(key) || null;
}

/**
 * Cache subjects for a teacher
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID (optional)
 * @param {Array} subjects - Array of subjects
 * @param {boolean} includeStudentSubjects - Whether subjects include those from students (optional)
 */
function cacheSubjects(teacherId, classId, subjects, includeStudentSubjects = false) {
  // Get or create teacher's cache
  let teacherCache = cache.teacherSubjects.get(teacherId);
  if (!teacherCache) {
    teacherCache = new Map();
    cache.teacherSubjects.set(teacherId, teacherCache);
  }

  // Cache subjects for the specific class or all classes
  const key = `${classId || 'all'}:${includeStudentSubjects ? 'withStudents' : 'direct'}`;
  teacherCache.set(key, subjects);

  // Update last updated timestamp
  cache.lastUpdated.set(teacherId, Date.now());

  console.log(`[TeacherSubjectService] Cached ${subjects.length} subjects for teacher ${teacherId}${classId ? ` in class ${classId}` : ''} (${includeStudentSubjects ? 'with' : 'without'} student subjects)`);
}

/**
 * Clear cache for a teacher
 * @param {string} teacherId - Teacher ID (optional, if not provided, clear all cache)
 */
function clearCache(teacherId = null) {
  if (teacherId) {
    console.log(`[TeacherSubjectService] Clearing cache for teacher ${teacherId}`);
    cache.teacherSubjects.delete(teacherId);
    cache.lastUpdated.delete(teacherId);
  } else {
    console.log(`[TeacherSubjectService] Clearing all cache`);
    cache.teacherSubjects.clear();
    cache.lastUpdated.clear();
  }
}

/**
 * Get subjects for a specific student that are taught by a specific teacher
 * @param {string} teacherId - Teacher ID
 * @param {string} studentId - Student ID
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} - Array of subjects
 */
async function getTeacherSubjectsForStudent(teacherId, studentId, classId) {
  console.log(`[TeacherSubjectService] Getting subjects for student ${studentId} taught by teacher ${teacherId} in class ${classId}`);

  try {
    // Get all subjects the teacher teaches
    const teacherSubjects = await getTeacherSubjects(teacherId, classId);
    const teacherSubjectIds = teacherSubjects.map(subject => subject._id.toString());

    console.log(`[TeacherSubjectService] Teacher ${teacherId} teaches ${teacherSubjectIds.length} subjects in class ${classId}`);
    if (teacherSubjectIds.length === 0) {
      console.log(`[TeacherSubjectService] Teacher ${teacherId} doesn't teach any subjects in class ${classId}`);
      return [];
    }

    // Get the student with all subject-related fields populated
    const student = await Student.findById(studentId)
      .populate({
        path: 'subjectCombination',
        populate: {
          path: 'subjects compulsorySubjects',
          model: 'Subject',
          select: 'name code type description educationLevel isPrincipal isCompulsory'
        }
      })
      .populate('selectedSubjects')
      .populate('class');

    if (!student) {
      console.log(`[TeacherSubjectService] Student ${studentId} not found`);
      return [];
    }

    console.log(`[TeacherSubjectService] Found student ${studentId}: ${student.firstName} ${student.lastName}`);

    // Get the class object
    const classObj = student.class || await Class.findById(classId);
    if (!classObj) {
      console.log(`[TeacherSubjectService] Class ${classId} not found`);
      return [];
    }

    // Determine if this is an A-Level class
    const isALevelClass = classObj && (
      classObj.form === 5 ||
      classObj.form === 6 ||
      classObj.educationLevel === 'A_LEVEL' ||
      (classObj.name && (
        classObj.name.toUpperCase().includes('FORM 5') ||
        classObj.name.toUpperCase().includes('FORM 6') ||
        classObj.name.toUpperCase().includes('FORM V') ||
        classObj.name.toUpperCase().includes('FORM VI') ||
        classObj.name.toUpperCase().includes('F5') ||
        classObj.name.toUpperCase().includes('F6') ||
        classObj.name.toUpperCase().includes('FV') ||
        classObj.name.toUpperCase().includes('FVI') ||
        classObj.name.toUpperCase().includes('A-LEVEL') ||
        classObj.name.toUpperCase().includes('A LEVEL')
      ))
    );

    // Special case for this school - force A-Level class if name contains 'FORM V' or 'FORM VI'
    let forceALevel = false;
    if (classObj?.name && (
      classObj.name.toUpperCase().includes('FORM V') ||
      classObj.name.toUpperCase().includes('FORM VI')
    )) {
      console.log(`[TeacherSubjectService] Forcing class ${classObj.name} to be recognized as an A-Level class`);
      forceALevel = true;
    }

    // Check if the student is actually an A-Level student (Form 5 or 6)
    const isALevelStudent = student.educationLevel === 'A_LEVEL' ||
                           student.form === 5 ||
                           student.form === 6;

    console.log(`[TeacherSubjectService] Student ${studentId} education level: ${student.educationLevel}, form: ${student.form}`);
    console.log(`[TeacherSubjectService] Class ${classId} is ${(isALevelClass || forceALevel) ? 'an A-Level' : 'not an A-Level'} class`);

    // Check if student has a subject combination
    if (!student.subjectCombination) {
      console.log(`[TeacherSubjectService] Student ${studentId} has no subject combination`);

      // CASE 1: A-Level class with A-Level student
      if ((isALevelClass || forceALevel) && isALevelStudent) {
        // For A-Level students in A-Level classes, return all teacher subjects
        // We already checked above that the teacher is assigned to the class
        console.log(`[TeacherSubjectService] A-Level student ${studentId} in A-Level class ${classId}, returning teacher subjects`);
        return teacherSubjects;
      }
      // CASE 2: A-Level class with O-Level student
      else if ((isALevelClass || forceALevel) && !isALevelStudent) {
        console.log(`[TeacherSubjectService] O-Level student ${studentId} in A-Level class ${classId}, cannot access A-Level subjects`);
        return [];
      }
      // CASE 3: O-Level class with A-Level student
      else if (!isALevelClass && !forceALevel && isALevelStudent) {
        console.log(`[TeacherSubjectService] A-Level student ${studentId} in O-Level class ${classId}, cannot access subjects without combination`);
        return [];
      }
      // CASE 4: O-Level class with O-Level student
      else {
        console.log(`[TeacherSubjectService] O-Level student ${studentId} in O-Level class ${classId}, returning all teacher subjects`);
        return teacherSubjects;
      }
    }

    // Get student's subjects from combination
    const studentSubjects = [];

    // Add principal subjects
    if (student.subjectCombination.subjects && Array.isArray(student.subjectCombination.subjects)) {
      for (const subject of student.subjectCombination.subjects) {
        if (typeof subject === 'object' && subject._id) {
          studentSubjects.push({
            _id: subject._id,
            name: subject.name,
            code: subject.code,
            type: subject.type,
            description: subject.description,
            educationLevel: subject.educationLevel || 'UNKNOWN',
            isPrincipal: true,
            isCompulsory: false
          });
          console.log(`[TeacherSubjectService] Added principal subject ${subject.name} from student's combination`);
        }
      }
    }

    // Add subsidiary subjects
    if (student.subjectCombination.compulsorySubjects && Array.isArray(student.subjectCombination.compulsorySubjects)) {
      for (const subject of student.subjectCombination.compulsorySubjects) {
        if (typeof subject === 'object' && subject._id) {
          studentSubjects.push({
            _id: subject._id,
            name: subject.name,
            code: subject.code,
            type: subject.type,
            description: subject.description,
            educationLevel: subject.educationLevel || 'UNKNOWN',
            isPrincipal: false,
            isCompulsory: true
          });
          console.log(`[TeacherSubjectService] Added subsidiary subject ${subject.name} from student's combination`);
        }
      }
    }

    // Add selected subjects if any
    if (student.selectedSubjects && Array.isArray(student.selectedSubjects)) {
      for (const subject of student.selectedSubjects) {
        if (typeof subject === 'object' && subject._id) {
          // Check if this subject is already in the list
          const existingSubject = studentSubjects.find(s => s._id.toString() === subject._id.toString());
          if (!existingSubject) {
            studentSubjects.push({
              _id: subject._id,
              name: subject.name,
              code: subject.code,
              type: subject.type,
              description: subject.description,
              educationLevel: subject.educationLevel || 'UNKNOWN',
              isPrincipal: false,
              isCompulsory: false
            });
            console.log(`[TeacherSubjectService] Added selected subject ${subject.name} from student's selected subjects`);
          }
        }
      }
    }

    console.log(`[TeacherSubjectService] Student ${studentId} has ${studentSubjects.length} subjects in combination`);

    // Log all teacher subjects and student subjects for debugging
    console.log(`[TeacherSubjectService] Teacher ${teacherId} teaches ${teacherSubjects.length} subjects in class ${classId}:`);
    for (const subject of teacherSubjects) {
      console.log(`[TeacherSubjectService] Teacher subject: ${subject.name} (${subject._id})`);
    }

    console.log(`[TeacherSubjectService] Student ${studentId} has ${studentSubjects.length} subjects in combination:`);
    for (const subject of studentSubjects) {
      console.log(`[TeacherSubjectService] Student subject: ${subject.name} (${subject._id})`);
    }

    // Filter student subjects to only include those taught by the teacher
    const filteredSubjects = [];

    // First, try exact ID matching
    for (const studentSubject of studentSubjects) {
      const studentSubjectId = studentSubject._id.toString();
      const matchingTeacherSubject = teacherSubjects.find(ts => ts._id.toString() === studentSubjectId);

      if (matchingTeacherSubject) {
        console.log(`[TeacherSubjectService] EXACT MATCH: Subject ${studentSubject.name} (${studentSubjectId}) is taught by teacher ${teacherId}`);
        filteredSubjects.push(studentSubject);
      }
    }

    // If no exact matches, try matching by code
    if (filteredSubjects.length === 0) {
      console.log(`[TeacherSubjectService] No exact ID matches found, trying to match by subject code`);

      for (const studentSubject of studentSubjects) {
        if (!studentSubject.code) continue;

        const matchingTeacherSubject = teacherSubjects.find(ts =>
          ts.code && ts.code.toUpperCase() === studentSubject.code.toUpperCase());

        if (matchingTeacherSubject) {
          console.log(`[TeacherSubjectService] CODE MATCH: Subject ${studentSubject.name} (${studentSubject.code}) is taught by teacher ${teacherId}`);
          filteredSubjects.push(studentSubject);
        }
      }
    }

    // If no code matches, try matching by name
    if (filteredSubjects.length === 0) {
      console.log(`[TeacherSubjectService] No code matches found, trying to match by subject name`);

      for (const studentSubject of studentSubjects) {
        if (!studentSubject.name) continue;

        const matchingTeacherSubject = teacherSubjects.find(ts =>
          ts.name && ts.name.toUpperCase() === studentSubject.name.toUpperCase());

        if (matchingTeacherSubject) {
          console.log(`[TeacherSubjectService] NAME MATCH: Subject ${studentSubject.name} is taught by teacher ${teacherId}`);
          filteredSubjects.push(studentSubject);
        }
      }
    }

    console.log(`[TeacherSubjectService] Found ${filteredSubjects.length} subjects for student ${studentId} taught by teacher ${teacherId}`);

    // If no subjects found but this is an A-Level student in an A-Level class, return all teacher subjects
    if (filteredSubjects.length === 0 && (isALevelClass || forceALevel) && isALevelStudent) {
      console.log(`[TeacherSubjectService] No matching subjects found, but this is an A-Level student in an A-Level class. Returning all teacher subjects as fallback.`);
      return teacherSubjects;
    }

    return filteredSubjects;
  } catch (error) {
    console.error('[TeacherSubjectService] Error getting teacher subjects for student:', error);
    return [];
  }
}

module.exports = {
  getTeacherSubjects,
  getTeacherStudents,
  isTeacherAuthorizedForSubject,
  isTeacherAuthorizedForClass,
  getTeacherSubjectsForStudent,
  clearCache
};
