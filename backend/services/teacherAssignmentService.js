/**
 * Comprehensive Teacher Assignment Service
 * 
 * This service centralizes all teacher-subject-class assignment logic in one place.
 * It provides methods for creating, checking, and managing teacher assignments
 * for both O-Level and A-Level classes.
 */

const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const TeacherSubject = require('../models/TeacherSubject');
const TeacherAssignment = require('../models/TeacherAssignment');
const User = require('../models/User');
const AcademicYear = require('../models/AcademicYear');

// Cache for teacher assignments to improve performance
const cache = {
  teacherAssignments: new Map(), // Map of teacherId -> Map of classId -> subjects
  lastUpdated: new Map(), // Map of teacherId -> timestamp
  TTL: 5 * 60 * 1000, // 5 minutes cache TTL
};

/**
 * Clear the cache for a specific teacher or all teachers
 * @param {string} teacherId - Teacher ID (optional)
 */
function clearCache(teacherId = null) {
  if (teacherId) {
    cache.teacherAssignments.delete(teacherId);
    cache.lastUpdated.delete(teacherId);
    console.log(`[TeacherAssignmentService] Cleared cache for teacher ${teacherId}`);
  } else {
    cache.teacherAssignments.clear();
    cache.lastUpdated.clear();
    console.log('[TeacherAssignmentService] Cleared all cache');
  }
}

/**
 * Get a teacher profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Teacher object or null
 */
async function getTeacherByUserId(userId) {
  if (!userId) {
    console.log('[TeacherAssignmentService] No userId provided');
    return null;
  }

  try {
    // Find the teacher by userId
    const teacher = await Teacher.findOne({ userId });
    
    if (!teacher) {
      console.log(`[TeacherAssignmentService] No teacher found for userId: ${userId}`);
      return null;
    }
    
    console.log(`[TeacherAssignmentService] Found teacher: ${teacher.firstName} ${teacher.lastName} (${teacher._id})`);
    return teacher;
  } catch (error) {
    console.error('[TeacherAssignmentService] Error finding teacher by userId:', error);
    return null;
  }
}

/**
 * Get a teacher profile by username
 * @param {string} username - Username
 * @returns {Promise<Object>} - Teacher object or null
 */
async function getTeacherByUsername(username) {
  if (!username) {
    console.log('[TeacherAssignmentService] No username provided');
    return null;
  }

  try {
    // Find the user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`[TeacherAssignmentService] No user found with username: ${username}`);
      return null;
    }
    
    // Find the teacher by userId
    return await getTeacherByUserId(user._id);
  } catch (error) {
    console.error('[TeacherAssignmentService] Error finding teacher by username:', error);
    return null;
  }
}

/**
 * Get all subjects a teacher is assigned to teach in a specific class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<Array>} - Array of subjects
 */
async function getTeacherSubjectsInClass(teacherId, classId, useCache = true) {
  if (!teacherId || !classId) {
    console.log('[TeacherAssignmentService] Missing teacherId or classId');
    return [];
  }

  console.log(`[TeacherAssignmentService] Getting subjects for teacher ${teacherId} in class ${classId}`);

  // Check cache if enabled
  if (useCache) {
    const teacherCache = cache.teacherAssignments.get(teacherId);
    if (teacherCache) {
      const cachedSubjects = teacherCache.get(classId);
      const lastUpdated = cache.lastUpdated.get(teacherId);
      
      if (cachedSubjects && lastUpdated && (Date.now() - lastUpdated < cache.TTL)) {
        console.log(`[TeacherAssignmentService] Cache hit for teacher ${teacherId} in class ${classId}`);
        return cachedSubjects;
      }
    }
  }

  try {
    // Find the class and check if it exists
    const classObj = await Class.findById(classId)
      .populate({
        path: 'subjects.subject',
        model: 'Subject',
        select: 'name code type description educationLevel isPrincipal isCompulsory'
      });

    if (!classObj) {
      console.log(`[TeacherAssignmentService] Class not found: ${classId}`);
      return [];
    }

    // Create a map to store unique subjects
    const subjectMap = {};

    // Method 1: Check direct assignments in the Class model
    for (const subjectAssignment of classObj.subjects) {
      if (subjectAssignment.teacher && 
          subjectAssignment.teacher.toString() === teacherId.toString() && 
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

    // Method 2: Check TeacherSubject assignments
    const teacherSubjectAssignments = await TeacherSubject.find({
      teacherId: teacherId,
      classId: classId,
      status: 'active'
    }).populate('subjectId');

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
            educationLevel: assignment.subjectId.educationLevel || 'UNKNOWN',
            isPrincipal: assignment.subjectId.isPrincipal || false,
            isCompulsory: assignment.subjectId.isCompulsory || false,
            assignmentType: 'teacherSubject' // Assigned via TeacherSubject model
          };
        }
      }
    }

    // Method 3: Check TeacherAssignment assignments
    const teacherAssignments = await TeacherAssignment.find({
      teacher: teacherId,
      class: classId
    }).populate('subject');

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
            educationLevel: assignment.subject.educationLevel || 'UNKNOWN',
            isPrincipal: assignment.subject.isPrincipal || false,
            isCompulsory: assignment.subject.isCompulsory || false,
            assignmentType: 'teacherAssignment' // Assigned via TeacherAssignment model
          };
        }
      }
    }

    // Convert the map to an array
    const subjects = Object.values(subjectMap);
    
    console.log(`[TeacherAssignmentService] Found ${subjects.length} subjects for teacher ${teacherId} in class ${classId}`);

    // Cache the results
    let teacherCache = cache.teacherAssignments.get(teacherId);
    if (!teacherCache) {
      teacherCache = new Map();
      cache.teacherAssignments.set(teacherId, teacherCache);
    }
    teacherCache.set(classId, subjects);
    cache.lastUpdated.set(teacherId, Date.now());

    return subjects;
  } catch (error) {
    console.error('[TeacherAssignmentService] Error getting teacher subjects:', error);
    return [];
  }
}

/**
 * Check if a teacher is assigned to teach in a specific class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>} - Whether the teacher is assigned to the class
 */
async function isTeacherAssignedToClass(teacherId, classId) {
  if (!teacherId || !classId) {
    return false;
  }

  try {
    // Get the teacher's subjects in this class
    const subjects = await getTeacherSubjectsInClass(teacherId, classId);
    
    // If the teacher has at least one subject in this class, they're assigned to it
    return subjects.length > 0;
  } catch (error) {
    console.error('[TeacherAssignmentService] Error checking teacher assignment:', error);
    return false;
  }
}

/**
 * Check if a teacher is assigned to teach a specific subject in a specific class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<boolean>} - Whether the teacher is assigned to teach the subject
 */
async function isTeacherAssignedToSubject(teacherId, classId, subjectId) {
  if (!teacherId || !classId || !subjectId) {
    return false;
  }

  try {
    // Get the teacher's subjects in this class
    const subjects = await getTeacherSubjectsInClass(teacherId, classId);
    
    // Check if the subject is in the teacher's subjects
    return subjects.some(subject => subject._id.toString() === subjectId.toString());
  } catch (error) {
    console.error('[TeacherAssignmentService] Error checking subject assignment:', error);
    return false;
  }
}

/**
 * Assign a teacher to teach all subjects in a class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} - Result object with success status and details
 */
async function assignTeacherToAllSubjectsInClass(teacherId, classId) {
  if (!teacherId || !classId) {
    return { 
      success: false, 
      message: 'Teacher ID and Class ID are required' 
    };
  }

  try {
    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return { 
        success: false, 
        message: `Teacher with ID ${teacherId} not found` 
      };
    }

    // Find the class
    const classObj = await Class.findById(classId).populate('subjects.subject');
    if (!classObj) {
      return { 
        success: false, 
        message: `Class with ID ${classId} not found` 
      };
    }

    // Check if the class has subjects
    if (!classObj.subjects || !Array.isArray(classObj.subjects) || classObj.subjects.length === 0) {
      return { 
        success: false, 
        message: 'No subjects found in class' 
      };
    }

    // Get the current academic year
    const academicYear = await AcademicYear.findOne({ isActive: true });
    if (!academicYear) {
      return { 
        success: false, 
        message: 'No active academic year found' 
      };
    }

    // Track assignments made
    const assignments = {
      classModel: 0,
      teacherSubject: 0,
      teacherAssignment: 0
    };

    // 1. Update the Class model
    for (let i = 0; i < classObj.subjects.length; i++) {
      classObj.subjects[i].teacher = teacherId;
      assignments.classModel++;
    }
    await classObj.save();

    // 2. Create TeacherSubject assignments
    for (const subject of classObj.subjects) {
      if (!subject.subject) continue;
      
      // Check if the assignment already exists
      const existingAssignment = await TeacherSubject.findOne({
        teacherId: teacherId,
        subjectId: subject.subject._id,
        classId: classId
      });
      
      if (!existingAssignment) {
        const teacherSubject = new TeacherSubject({
          teacherId: teacherId,
          subjectId: subject.subject._id,
          classId: classId,
          academicYearId: academicYear._id,
          status: 'active'
        });
        
        await teacherSubject.save();
        assignments.teacherSubject++;
      }
    }

    // 3. Create TeacherAssignment assignments
    for (const subject of classObj.subjects) {
      if (!subject.subject) continue;
      
      // Check if the assignment already exists
      const existingAssignment = await TeacherAssignment.findOne({
        teacher: teacherId,
        subject: subject.subject._id,
        class: classId
      });
      
      if (!existingAssignment) {
        const teacherAssignment = new TeacherAssignment({
          teacher: teacherId,
          subject: subject.subject._id,
          class: classId,
          academicYear: academicYear._id,
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        });
        
        await teacherAssignment.save();
        assignments.teacherAssignment++;
      }
    }

    // 4. Update the teacher's subjects array
    const subjectIds = classObj.subjects.map(s => s.subject._id);
    for (const subjectId of subjectIds) {
      if (!teacher.subjects.includes(subjectId)) {
        teacher.subjects.push(subjectId);
      }
    }
    await teacher.save();

    // Clear the cache for this teacher
    clearCache(teacherId);

    return {
      success: true,
      message: 'Teacher assigned to all subjects in class successfully',
      details: {
        teacher: {
          id: teacher._id,
          name: `${teacher.firstName} ${teacher.lastName}`
        },
        class: {
          id: classObj._id,
          name: classObj.name,
          educationLevel: classObj.educationLevel
        },
        assignments
      }
    };
  } catch (error) {
    console.error('[TeacherAssignmentService] Error assigning teacher to subjects:', error);
    return {
      success: false,
      message: 'Failed to assign teacher to subjects',
      error: error.message
    };
  }
}

/**
 * Assign a teacher to teach a specific subject in a class
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<Object>} - Result object with success status and details
 */
async function assignTeacherToSubject(teacherId, classId, subjectId) {
  if (!teacherId || !classId || !subjectId) {
    return { 
      success: false, 
      message: 'Teacher ID, Class ID, and Subject ID are required' 
    };
  }

  try {
    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return { 
        success: false, 
        message: `Teacher with ID ${teacherId} not found` 
      };
    }

    // Find the class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return { 
        success: false, 
        message: `Class with ID ${classId} not found` 
      };
    }

    // Find the subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return { 
        success: false, 
        message: `Subject with ID ${subjectId} not found` 
      };
    }

    // Get the current academic year
    const academicYear = await AcademicYear.findOne({ isActive: true });
    if (!academicYear) {
      return { 
        success: false, 
        message: 'No active academic year found' 
      };
    }

    // Track assignments made
    const assignments = {
      classModel: 0,
      teacherSubject: 0,
      teacherAssignment: 0
    };

    // 1. Update the Class model
    let subjectFound = false;
    for (let i = 0; i < classObj.subjects.length; i++) {
      if (classObj.subjects[i].subject.toString() === subjectId) {
        classObj.subjects[i].teacher = teacherId;
        subjectFound = true;
        assignments.classModel++;
        break;
      }
    }

    // If the subject wasn't found in the class, add it
    if (!subjectFound) {
      classObj.subjects.push({
        subject: subjectId,
        teacher: teacherId
      });
      assignments.classModel++;
    }
    
    await classObj.save();

    // 2. Create TeacherSubject assignment
    const existingTeacherSubject = await TeacherSubject.findOne({
      teacherId: teacherId,
      subjectId: subjectId,
      classId: classId
    });
    
    if (!existingTeacherSubject) {
      const teacherSubject = new TeacherSubject({
        teacherId: teacherId,
        subjectId: subjectId,
        classId: classId,
        academicYearId: academicYear._id,
        status: 'active'
      });
      
      await teacherSubject.save();
      assignments.teacherSubject++;
    }

    // 3. Create TeacherAssignment assignment
    const existingTeacherAssignment = await TeacherAssignment.findOne({
      teacher: teacherId,
      subject: subjectId,
      class: classId
    });
    
    if (!existingTeacherAssignment) {
      const teacherAssignment = new TeacherAssignment({
        teacher: teacherId,
        subject: subjectId,
        class: classId,
        academicYear: academicYear._id,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      });
      
      await teacherAssignment.save();
      assignments.teacherAssignment++;
    }

    // 4. Update the teacher's subjects array
    if (!teacher.subjects.includes(subjectId)) {
      teacher.subjects.push(subjectId);
      await teacher.save();
    }

    // Clear the cache for this teacher
    clearCache(teacherId);

    return {
      success: true,
      message: 'Teacher assigned to subject successfully',
      details: {
        teacher: {
          id: teacher._id,
          name: `${teacher.firstName} ${teacher.lastName}`
        },
        class: {
          id: classObj._id,
          name: classObj.name
        },
        subject: {
          id: subject._id,
          name: subject.name
        },
        assignments
      }
    };
  } catch (error) {
    console.error('[TeacherAssignmentService] Error assigning teacher to subject:', error);
    return {
      success: false,
      message: 'Failed to assign teacher to subject',
      error: error.message
    };
  }
}

/**
 * Get all classes a teacher is assigned to
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Array>} - Array of classes
 */
async function getTeacherClasses(teacherId) {
  if (!teacherId) {
    return [];
  }

  try {
    // Find all classes where this teacher is assigned to teach at least one subject
    const classes = await Class.find({
      'subjects.teacher': teacherId
    })
    .populate('academicYear')
    .sort({ name: 1 });

    return classes.map(cls => ({
      _id: cls._id,
      name: cls.name,
      section: cls.section,
      stream: cls.stream,
      educationLevel: cls.educationLevel,
      academicYear: cls.academicYear ? cls.academicYear.name : 'Unknown'
    }));
  } catch (error) {
    console.error('[TeacherAssignmentService] Error getting teacher classes:', error);
    return [];
  }
}

/**
 * Get all teachers assigned to a class
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} - Array of teachers
 */
async function getClassTeachers(classId) {
  if (!classId) {
    return [];
  }

  try {
    // Find the class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return [];
    }

    // Get unique teacher IDs from the class subjects
    const teacherIds = [...new Set(
      classObj.subjects
        .filter(s => s.teacher)
        .map(s => s.teacher.toString())
    )];

    // Find all teachers
    const teachers = await Teacher.find({
      _id: { $in: teacherIds }
    });

    return teachers.map(teacher => ({
      _id: teacher._id,
      name: `${teacher.firstName} ${teacher.lastName}`,
      email: teacher.email,
      employeeId: teacher.employeeId
    }));
  } catch (error) {
    console.error('[TeacherAssignmentService] Error getting class teachers:', error);
    return [];
  }
}

/**
 * Diagnose and fix teacher assignment issues
 * @param {string} teacherId - Teacher ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} - Diagnostic result
 */
async function diagnoseAndFixTeacherAssignments(teacherId, classId) {
  if (!teacherId || !classId) {
    return {
      success: false,
      message: 'Teacher ID and Class ID are required'
    };
  }

  try {
    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return {
        success: false,
        message: `Teacher with ID ${teacherId} not found`
      };
    }

    // Find the class
    const classObj = await Class.findById(classId).populate('subjects.subject');
    if (!classObj) {
      return {
        success: false,
        message: `Class with ID ${classId} not found`
      };
    }

    // Check if the class has subjects
    if (!classObj.subjects || !Array.isArray(classObj.subjects) || classObj.subjects.length === 0) {
      return {
        success: false,
        message: 'No subjects found in class'
      };
    }

    // Diagnostic information
    const diagnostic = {
      teacher: {
        id: teacher._id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        userId: teacher.userId
      },
      class: {
        id: classObj._id,
        name: classObj.name,
        educationLevel: classObj.educationLevel,
        subjectCount: classObj.subjects.length
      },
      assignments: {
        classModel: 0,
        teacherSubject: 0,
        teacherAssignment: 0
      },
      issues: []
    };

    // Check Class model assignments
    for (const subject of classObj.subjects) {
      if (!subject.teacher || subject.teacher.toString() !== teacherId.toString()) {
        diagnostic.issues.push({
          type: 'classModel',
          subject: subject.subject ? subject.subject.name : 'Unknown',
          issue: 'Teacher not assigned in Class model'
        });
      } else {
        diagnostic.assignments.classModel++;
      }
    }

    // Check TeacherSubject assignments
    const teacherSubjectAssignments = await TeacherSubject.find({
      teacherId: teacherId,
      classId: classId
    }).populate('subjectId');

    diagnostic.assignments.teacherSubject = teacherSubjectAssignments.length;

    // Check for missing TeacherSubject assignments
    for (const subject of classObj.subjects) {
      if (!subject.subject) continue;
      
      const hasTeacherSubject = teacherSubjectAssignments.some(
        ts => ts.subjectId && ts.subjectId._id.toString() === subject.subject._id.toString()
      );
      
      if (!hasTeacherSubject) {
        diagnostic.issues.push({
          type: 'teacherSubject',
          subject: subject.subject.name,
          issue: 'Missing TeacherSubject assignment'
        });
      }
    }

    // Check TeacherAssignment assignments
    const teacherAssignments = await TeacherAssignment.find({
      teacher: teacherId,
      class: classId
    }).populate('subject');

    diagnostic.assignments.teacherAssignment = teacherAssignments.length;

    // Check for missing TeacherAssignment assignments
    for (const subject of classObj.subjects) {
      if (!subject.subject) continue;
      
      const hasTeacherAssignment = teacherAssignments.some(
        ta => ta.subject && ta.subject._id.toString() === subject.subject._id.toString()
      );
      
      if (!hasTeacherAssignment) {
        diagnostic.issues.push({
          type: 'teacherAssignment',
          subject: subject.subject.name,
          issue: 'Missing TeacherAssignment assignment'
        });
      }
    }

    // If there are issues, fix them
    if (diagnostic.issues.length > 0) {
      console.log(`[TeacherAssignmentService] Found ${diagnostic.issues.length} issues with teacher assignments`);
      
      // Fix the issues by assigning the teacher to all subjects
      const fixResult = await assignTeacherToAllSubjectsInClass(teacherId, classId);
      
      return {
        success: fixResult.success,
        message: fixResult.message,
        diagnostic,
        fixResult
      };
    }

    return {
      success: true,
      message: 'No issues found with teacher assignments',
      diagnostic
    };
  } catch (error) {
    console.error('[TeacherAssignmentService] Error diagnosing teacher assignments:', error);
    return {
      success: false,
      message: 'Failed to diagnose teacher assignments',
      error: error.message
    };
  }
}

module.exports = {
  getTeacherByUserId,
  getTeacherByUsername,
  getTeacherSubjectsInClass,
  isTeacherAssignedToClass,
  isTeacherAssignedToSubject,
  assignTeacherToAllSubjectsInClass,
  assignTeacherToSubject,
  getTeacherClasses,
  getClassTeachers,
  diagnoseAndFixTeacherAssignments,
  clearCache
};
