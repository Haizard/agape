/**
 * O-Level Access Control Tests
 * 
 * These tests validate the access control logic for O-Level marks entry,
 * ensuring teachers can only access subjects they are assigned to teach
 * and students who take those subjects.
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const TeacherSubject = require('../models/TeacherSubject');
const TeacherAssignment = require('../models/TeacherAssignment');
const StudentSubjectSelection = require('../models/StudentSubjectSelection');
const jwt = require('jsonwebtoken');

// Mock data
let adminToken;
let teacherToken;
let teacherId;
let classId;
let coreSubjectId;
let optionalSubjectId;
let unassignedSubjectId;
let student1Id; // Takes core and optional subjects
let student2Id; // Takes only core subjects

// Setup before tests
beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/agape_test', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Clear relevant collections
  await User.deleteMany({});
  await Teacher.deleteMany({});
  await Class.deleteMany({});
  await Subject.deleteMany({});
  await Student.deleteMany({});
  await TeacherSubject.deleteMany({});
  await TeacherAssignment.deleteMany({});
  await StudentSubjectSelection.deleteMany({});

  // Create admin user
  const adminUser = await User.create({
    username: 'admin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin'
  });

  // Create teacher user
  const teacherUser = await User.create({
    username: 'teacher',
    email: 'teacher@test.com',
    password: 'password123',
    role: 'teacher'
  });

  // Create teacher profile
  const teacher = await Teacher.create({
    firstName: 'Test',
    lastName: 'Teacher',
    email: 'teacher@test.com',
    userId: teacherUser._id
  });
  teacherId = teacher._id;

  // Create subjects
  const coreSubject = await Subject.create({
    name: 'Mathematics',
    code: 'MATH',
    type: 'CORE'
  });
  coreSubjectId = coreSubject._id;

  const optionalSubject = await Subject.create({
    name: 'Physics',
    code: 'PHY',
    type: 'OPTIONAL'
  });
  optionalSubjectId = optionalSubject._id;

  const unassignedSubject = await Subject.create({
    name: 'Chemistry',
    code: 'CHEM',
    type: 'OPTIONAL'
  });
  unassignedSubjectId = unassignedSubject._id;

  // Create class
  const classObj = await Class.create({
    name: 'Form 1',
    section: 'A',
    educationLevel: 'O_LEVEL',
    subjects: [
      { subject: coreSubjectId, teacher: teacherId },
      { subject: optionalSubjectId, teacher: teacherId },
      { subject: unassignedSubjectId, teacher: null }
    ]
  });
  classId = classObj._id;

  // Create students
  const student1 = await Student.create({
    firstName: 'Student',
    lastName: 'One',
    rollNumber: '001',
    class: classId,
    educationLevel: 'O_LEVEL'
  });
  student1Id = student1._id;

  const student2 = await Student.create({
    firstName: 'Student',
    lastName: 'Two',
    rollNumber: '002',
    class: classId,
    educationLevel: 'O_LEVEL'
  });
  student2Id = student2._id;

  // Create subject selections
  await StudentSubjectSelection.create({
    student: student1Id,
    coreSubjects: [coreSubjectId],
    optionalSubjects: [optionalSubjectId],
    status: 'APPROVED'
  });

  await StudentSubjectSelection.create({
    student: student2Id,
    coreSubjects: [coreSubjectId],
    optionalSubjects: [],
    status: 'APPROVED'
  });

  // Create teacher assignments
  await TeacherSubject.create({
    teacherId: teacherId,
    classId: classId,
    subjectId: coreSubjectId,
    status: 'active'
  });

  await TeacherAssignment.create({
    teacher: teacherId,
    class: classId,
    subject: optionalSubjectId
  });

  // Generate tokens
  adminToken = jwt.sign(
    { userId: adminUser._id, role: 'admin' },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '1h' }
  );

  teacherToken = jwt.sign(
    { userId: teacherUser._id, role: 'teacher' },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '1h' }
  );
});

// Clean up after tests
afterAll(async () => {
  await mongoose.connection.close();
});

// Test cases
describe('O-Level Access Control', () => {
  // Test case 1: Teacher can access core subject
  test('Teacher can access core subject', async () => {
    const response = await request(app)
      .get(`/api/enhanced-teachers/o-level/classes/${classId}/subjects/${coreSubjectId}/students`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.students.length).toBe(2); // Both students take core subjects
  });

  // Test case 2: Teacher can access optional subject
  test('Teacher can access optional subject', async () => {
    const response = await request(app)
      .get(`/api/enhanced-teachers/o-level/classes/${classId}/subjects/${optionalSubjectId}/students`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.students.length).toBe(1); // Only student1 takes this optional subject
    expect(response.body.students[0]._id).toBe(student1Id.toString());
  });

  // Test case 3: Teacher cannot access unassigned subject
  test('Teacher cannot access unassigned subject', async () => {
    const response = await request(app)
      .get(`/api/enhanced-teachers/o-level/classes/${classId}/subjects/${unassignedSubjectId}/students`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  // Test case 4: Admin can access any subject
  test('Admin can access any subject', async () => {
    const response = await request(app)
      .get(`/api/enhanced-teachers/o-level/classes/${classId}/subjects/${unassignedSubjectId}/students`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  // Test case 5: Teacher can enter marks for core subject
  test('Teacher can enter marks for core subject', async () => {
    const response = await request(app)
      .post('/api/o-level/marks/batch')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send([
        {
          studentId: student1Id.toString(),
          examId: mongoose.Types.ObjectId().toString(),
          academicYearId: mongoose.Types.ObjectId().toString(),
          examTypeId: mongoose.Types.ObjectId().toString(),
          subjectId: coreSubjectId.toString(),
          classId: classId.toString(),
          marksObtained: 85
        },
        {
          studentId: student2Id.toString(),
          examId: mongoose.Types.ObjectId().toString(),
          academicYearId: mongoose.Types.ObjectId().toString(),
          examTypeId: mongoose.Types.ObjectId().toString(),
          subjectId: coreSubjectId.toString(),
          classId: classId.toString(),
          marksObtained: 75
        }
      ]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  // Test case 6: Teacher can enter marks for optional subject only for students who take it
  test('Teacher can enter marks for optional subject only for students who take it', async () => {
    const response = await request(app)
      .post('/api/o-level/marks/batch')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send([
        {
          studentId: student1Id.toString(),
          examId: mongoose.Types.ObjectId().toString(),
          academicYearId: mongoose.Types.ObjectId().toString(),
          examTypeId: mongoose.Types.ObjectId().toString(),
          subjectId: optionalSubjectId.toString(),
          classId: classId.toString(),
          marksObtained: 90
        }
      ]);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  // Test case 7: Teacher cannot enter marks for optional subject for students who don't take it
  test('Teacher cannot enter marks for optional subject for students who don\'t take it', async () => {
    const response = await request(app)
      .post('/api/o-level/marks/batch')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send([
        {
          studentId: student2Id.toString(),
          examId: mongoose.Types.ObjectId().toString(),
          academicYearId: mongoose.Types.ObjectId().toString(),
          examTypeId: mongoose.Types.ObjectId().toString(),
          subjectId: optionalSubjectId.toString(),
          classId: classId.toString(),
          marksObtained: 80
        }
      ]);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  // Test case 8: Teacher cannot enter marks for unassigned subject
  test('Teacher cannot enter marks for unassigned subject', async () => {
    const response = await request(app)
      .post('/api/o-level/marks/batch')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send([
        {
          studentId: student1Id.toString(),
          examId: mongoose.Types.ObjectId().toString(),
          academicYearId: mongoose.Types.ObjectId().toString(),
          examTypeId: mongoose.Types.ObjectId().toString(),
          subjectId: unassignedSubjectId.toString(),
          classId: classId.toString(),
          marksObtained: 70
        }
      ]);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
});
