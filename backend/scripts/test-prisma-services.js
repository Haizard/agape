/**
 * Prisma Services Test Script
 *
 * This script tests the functionality of Prisma services.
 * It creates test data, performs operations, and cleans up afterward.
 *
 * Run it with: node scripts/test-prisma-services.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Import Prisma services
const teacherAssignmentService = require('../services/prisma/teacherAssignmentService');
const studentService = require('../services/prisma/studentService');
const subjectSelectionService = require('../services/prisma/subjectSelectionService');

// Test data
const testData = {
  academicYear: {
    name: 'Test Academic Year 2023-2024',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2024-06-30'),
    isCurrent: true
  },
  class: {
    name: 'Test Class',
    stream: 'Science',
    section: 'A',
    educationLevel: 'O_LEVEL',
    capacity: 40
  },
  subjects: [
    {
      name: 'Test Mathematics',
      code: 'TMATH',
      type: 'CORE',
      educationLevel: 'O_LEVEL',
      isCompulsory: true,
      isPrincipal: false,
      passMark: 40
    },
    {
      name: 'Test Physics',
      code: 'TPHYS',
      type: 'OPTIONAL',
      educationLevel: 'O_LEVEL',
      isCompulsory: false,
      isPrincipal: false,
      passMark: 40
    },
    {
      name: 'Test Chemistry',
      code: 'TCHEM',
      type: 'OPTIONAL',
      educationLevel: 'O_LEVEL',
      isCompulsory: false,
      isPrincipal: false,
      passMark: 40
    }
  ],
  teacher: {
    firstName: 'Test',
    lastName: 'Teacher',
    email: 'test.teacher@example.com',
    qualification: 'BSc Education',
    experience: '5 years',
    employeeId: 'TEST-TCH-001'
  },
  user: {
    username: 'testteacher',
    email: 'test.teacher@example.com',
    password: 'password123',
    role: 'teacher'
  },
  student: {
    firstName: 'Test',
    lastName: 'Student',
    gender: 'male',
    admissionNumber: 'TEST-STU-001'
  },
  studentUser: {
    username: 'teststudent',
    email: 'test.student@example.com',
    password: 'password123',
    role: 'student'
  }
};

// Helper function to create test data
async function createTestData() {
  console.log('Creating test data...');

  try {
    // Create academic year
    const academicYear = await prisma.academicYear.create({
      data: testData.academicYear
    });
    console.log(`Created academic year: ${academicYear.id}`);

    // Create class
    const classObj = await prisma.class.create({
      data: {
        ...testData.class,
        academicYearId: academicYear.id
      }
    });
    console.log(`Created class: ${classObj.id}`);

    // Create subjects
    const subjects = [];
    for (const subjectData of testData.subjects) {
      const subject = await prisma.subject.create({
        data: subjectData
      });
      subjects.push(subject);
      console.log(`Created subject: ${subject.id} (${subject.name})`);
    }

    // Create teacher user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testData.user.password, salt);

    const teacherUser = await prisma.user.create({
      data: {
        ...testData.user,
        password: hashedPassword
      }
    });
    console.log(`Created teacher user: ${teacherUser.id}`);

    // Create teacher
    const teacher = await prisma.teacher.create({
      data: {
        ...testData.teacher,
        userId: teacherUser.id
      }
    });
    console.log(`Created teacher: ${teacher.id}`);

    // Create student user
    const studentHashedPassword = await bcrypt.hash(testData.studentUser.password, salt);

    const studentUser = await prisma.user.create({
      data: {
        ...testData.studentUser,
        password: studentHashedPassword
      }
    });
    console.log(`Created student user: ${studentUser.id}`);

    // Create student
    const student = await prisma.student.create({
      data: {
        ...testData.student,
        userId: studentUser.id,
        classId: classObj.id,
        educationLevel: 'O_LEVEL',
        form: 1
      }
    });
    console.log(`Created student: ${student.id}`);

    return {
      academicYear,
      classObj,
      subjects,
      teacher,
      teacherUser,
      student,
      studentUser
    };
  } catch (error) {
    console.error('Error creating test data:', error.message);
    // Return empty objects to prevent errors in test functions
    return {
      academicYear: { id: 'test-academic-year' },
      classObj: { id: 'test-class' },
      subjects: [{ id: 'test-subject', name: 'Test Subject' }],
      teacher: { id: 'test-teacher' },
      teacherUser: { id: 'test-teacher-user' },
      student: { id: 'test-student' },
      studentUser: { id: 'test-student-user' }
    };
  }
}

// Helper function to clean up test data
async function cleanupTestData() {
  console.log('\nCleaning up test data...');

  // Delete in reverse order of creation to respect foreign key constraints
  try {
    // Find student subject selections by student ID
    const studentSelections = await prisma.studentSubjectSelection.findMany({
      where: {
        student: {
          admissionNumber: {
            contains: 'TEST'
          }
        }
      }
    });

    // Delete each selection individually
    for (const selection of studentSelections) {
      await prisma.studentSubjectSelection.delete({
        where: { id: selection.id }
      });
    }

    console.log(`Deleted ${studentSelections.length} student subject selections`);
  } catch (error) {
    console.log('No student subject selections to delete or error:', error.message);
  }

  try {
    // Find and delete teacher subjects
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: {
        OR: [
          { teacher: { employeeId: { contains: 'TEST' } } },
          { subject: { code: { startsWith: 'T' } } }
        ]
      }
    });

    for (const ts of teacherSubjects) {
      await prisma.teacherSubject.delete({
        where: { id: ts.id }
      });
    }

    console.log(`Deleted ${teacherSubjects.length} teacher subjects`);
  } catch (error) {
    console.log('No teacher subjects to delete or error:', error.message);
  }

  try {
    // Find and delete class subjects
    const classSubjects = await prisma.classSubject.findMany({
      where: {
        OR: [
          { class: { name: { contains: 'Test' } } },
          { subject: { code: { startsWith: 'T' } } },
          { teacher: { employeeId: { contains: 'TEST' } } }
        ]
      }
    });

    for (const cs of classSubjects) {
      await prisma.classSubject.delete({
        where: { id: cs.id }
      });
    }

    console.log(`Deleted ${classSubjects.length} class subjects`);
  } catch (error) {
    console.log('No class subjects to delete or error:', error.message);
  }

  try {
    // Find and delete students
    const students = await prisma.student.findMany({
      where: {
        admissionNumber: {
          contains: 'TEST'
        }
      }
    });

    for (const student of students) {
      await prisma.student.delete({
        where: { id: student.id }
      });
    }

    console.log(`Deleted ${students.length} students`);
  } catch (error) {
    console.log('No students to delete or error:', error.message);
  }

  try {
    // Find and delete teachers
    const teachers = await prisma.teacher.findMany({
      where: {
        employeeId: {
          contains: 'TEST'
        }
      }
    });

    for (const teacher of teachers) {
      await prisma.teacher.delete({
        where: { id: teacher.id }
      });
    }

    console.log(`Deleted ${teachers.length} teachers`);
  } catch (error) {
    console.log('No teachers to delete or error:', error.message);
  }

  try {
    // Find and delete users
    const users = await prisma.user.findMany({
      where: {
        username: {
          startsWith: 'test'
        }
      }
    });

    for (const user of users) {
      await prisma.user.delete({
        where: { id: user.id }
      });
    }

    console.log(`Deleted ${users.length} users`);
  } catch (error) {
    console.log('No users to delete or error:', error.message);
  }

  try {
    // Find and delete subjects
    const subjects = await prisma.subject.findMany({
      where: {
        code: {
          startsWith: 'T'
        }
      }
    });

    for (const subject of subjects) {
      await prisma.subject.delete({
        where: { id: subject.id }
      });
    }

    console.log(`Deleted ${subjects.length} subjects`);
  } catch (error) {
    console.log('No subjects to delete or error:', error.message);
  }

  try {
    // Find and delete classes
    const classes = await prisma.class.findMany({
      where: {
        name: {
          contains: 'Test'
        }
      }
    });

    for (const cls of classes) {
      await prisma.class.delete({
        where: { id: cls.id }
      });
    }

    console.log(`Deleted ${classes.length} classes`);
  } catch (error) {
    console.log('No classes to delete or error:', error.message);
  }

  try {
    // Find and delete academic years
    const academicYears = await prisma.academicYear.findMany({
      where: {
        name: {
          contains: 'Test'
        }
      }
    });

    for (const ay of academicYears) {
      await prisma.academicYear.delete({
        where: { id: ay.id }
      });
    }

    console.log(`Deleted ${academicYears.length} academic years`);
  } catch (error) {
    console.log('No academic years to delete or error:', error.message);
  }

  console.log('Test data cleanup completed.');
}

// Test teacher assignment service
async function testTeacherAssignmentService(testData) {
  console.log('\nTesting Teacher Assignment Service...');

  try {
    const { teacher, subjects, classObj } = testData;

    // Test assigning a teacher to a subject
    const assignmentResult = await teacherAssignmentService.assignTeacherToSubject({
      classId: classObj.id,
      subjectId: subjects[0].id,
      teacherId: teacher.id,
      assignedBy: 'test-script'
    });

    console.log('Assignment result:', assignmentResult.success ? 'Success' : 'Failed');
    console.log('Message:', assignmentResult.message);

    // Test updating multiple subject assignments
    const batchAssignmentResult = await teacherAssignmentService.updateClassSubjectAssignments({
      classId: classObj.id,
      assignments: [
        { subjectId: subjects[1].id, teacherId: teacher.id },
        { subjectId: subjects[2].id, teacherId: teacher.id }
      ],
      assignedBy: 'test-script'
    });

    console.log('Batch assignment result:', batchAssignmentResult.success ? 'Success' : 'Failed');
    console.log('Message:', batchAssignmentResult.message);

    if (batchAssignmentResult.results) {
      console.log(`Successfully assigned ${batchAssignmentResult.results.filter(r => r.success).length} subjects`);
    }

    // Verify assignments
    try {
      const classSubjects = await prisma.classSubject.findMany({
        where: {
          classId: classObj.id
        },
        include: {
          subject: true,
          teacher: true
        }
      });

      console.log(`\nVerified ${classSubjects.length} class-subject assignments:`);
      for (const cs of classSubjects) {
        if (cs.subject && cs.teacher) {
          console.log(`- ${cs.subject.name}: Teacher ${cs.teacher.firstName} ${cs.teacher.lastName}`);
        }
      }

      return { assignmentResult, batchAssignmentResult, classSubjects };
    } catch (error) {
      console.error('Error verifying assignments:', error.message);
      return { assignmentResult, batchAssignmentResult, classSubjects: [] };
    }
  } catch (error) {
    console.error('Error testing teacher assignment service:', error.message);
    return {
      assignmentResult: { success: false, message: error.message },
      batchAssignmentResult: { success: false, message: error.message },
      classSubjects: []
    };
  }
}

// Test student subject selection service
async function testSubjectSelectionService(testData) {
  console.log('\nTesting Subject Selection Service...');

  try {
    const { student, subjects, classObj, academicYear } = testData;

    // Test creating a subject selection
    const selectionResult = await subjectSelectionService.createSubjectSelection({
      studentId: student.id,
      selectionClassId: classObj.id,
      academicYearId: academicYear.id,
      optionalSubjects: [subjects[1].id, subjects[2].id],
      notes: 'Test subject selection',
      approvedBy: 'test-script'
    });

    console.log('Selection result:', selectionResult.success ? 'Success' : 'Failed');
    if (selectionResult.success) {
      console.log('Selection created with ID:', selectionResult.data.selection.id);
      console.log(`Selected ${selectionResult.data.allSubjects.length} subjects in total`);
    } else {
      console.log('Error:', selectionResult.message);
    }

    return selectionResult;
  } catch (error) {
    console.error('Error testing subject selection service:', error.message);
    return {
      success: false,
      message: error.message,
      data: { selection: { id: 'test-selection' }, allSubjects: [] }
    };
  }
}

// Main test function
async function runTests() {
  try {
    console.log('Starting Prisma services tests...');

    // Create test data
    const testDataObjects = await createTestData();

    // Run tests
    const teacherAssignmentResults = await testTeacherAssignmentService(testDataObjects);
    console.log('Teacher assignment test completed:', teacherAssignmentResults.assignmentResult.success ? 'Success' : 'Failed');

    const subjectSelectionResults = await testSubjectSelectionService(testDataObjects);
    console.log('Subject selection test completed:', subjectSelectionResults.success ? 'Success' : 'Failed');

    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error running tests:', error.message);
  } finally {
    try {
      // Clean up test data
      await cleanupTestData();
    } catch (error) {
      console.error('Error during cleanup:', error.message);
    } finally {
      // Disconnect Prisma client
      await prisma.$disconnect();
      console.log('Prisma client disconnected.');
    }
  }
}

// Run the tests
runTests();
