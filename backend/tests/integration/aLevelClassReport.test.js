/**
 * Integration tests for A-Level Class Report API
 * 
 * These tests verify that the A-Level class report API correctly integrates with
 * the database and returns the expected data structure.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Student = require('../../models/Student');
const Class = require('../../models/Class');
const Exam = require('../../models/Exam');
const ALevelResult = require('../../models/ALevelResult');
const Subject = require('../../models/Subject');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('A-Level Class Report API Integration Tests', () => {
  let token;
  let classId;
  let examId;
  let adminUser;
  
  // Setup test data before running tests
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/school-test');
    
    // Create admin user
    adminUser = await User.create({
      username: 'admin_test',
      email: 'admin_test@example.com',
      password: 'password123',
      role: 'admin'
    });
    
    // Generate JWT token
    token = jwt.sign(
      { id: adminUser._id, username: adminUser.username, role: adminUser.role },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );
    
    // Create test class
    const testClass = await Class.create({
      name: 'Form 5A Test',
      section: 'A',
      stream: 'Science',
      form: 5,
      educationLevel: 'A_LEVEL',
      academicYear: mongoose.Types.ObjectId()
    });
    classId = testClass._id;
    
    // Create test exam
    const testExam = await Exam.create({
      name: 'Mid Term Test',
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-06-10'),
      academicYear: testClass.academicYear
    });
    examId = testExam._id;
    
    // Create test subjects
    const physics = await Subject.create({
      name: 'Physics',
      code: 'PHY',
      isPrincipal: true,
      educationLevel: 'A_LEVEL'
    });
    
    const chemistry = await Subject.create({
      name: 'Chemistry',
      code: 'CHE',
      isPrincipal: true,
      educationLevel: 'A_LEVEL'
    });
    
    const generalStudies = await Subject.create({
      name: 'General Studies',
      code: 'GS',
      isPrincipal: false,
      educationLevel: 'A_LEVEL'
    });
    
    // Create test students
    const student1 = await Student.create({
      firstName: 'John',
      lastName: 'Doe',
      rollNumber: 'S001',
      gender: 'male',
      form: 5,
      educationLevel: 'A_LEVEL',
      class: classId
    });
    
    const student2 = await Student.create({
      firstName: 'Jane',
      lastName: 'Smith',
      rollNumber: 'S002',
      gender: 'female',
      form: 5,
      educationLevel: 'A_LEVEL',
      class: classId
    });
    
    // Create test results
    await ALevelResult.create({
      studentId: student1._id,
      examId: examId,
      subjectId: physics._id,
      marksObtained: 85,
      grade: 'A',
      points: 1,
      isPrincipal: true
    });
    
    await ALevelResult.create({
      studentId: student1._id,
      examId: examId,
      subjectId: chemistry._id,
      marksObtained: 78,
      grade: 'B',
      points: 2,
      isPrincipal: true
    });
    
    await ALevelResult.create({
      studentId: student1._id,
      examId: examId,
      subjectId: generalStudies._id,
      marksObtained: 65,
      grade: 'C',
      points: 3,
      isPrincipal: false
    });
    
    await ALevelResult.create({
      studentId: student2._id,
      examId: examId,
      subjectId: physics._id,
      marksObtained: 92,
      grade: 'A',
      points: 1,
      isPrincipal: true
    });
    
    await ALevelResult.create({
      studentId: student2._id,
      examId: examId,
      subjectId: chemistry._id,
      marksObtained: 88,
      grade: 'A',
      points: 1,
      isPrincipal: true
    });
    
    await ALevelResult.create({
      studentId: student2._id,
      examId: examId,
      subjectId: generalStudies._id,
      marksObtained: 75,
      grade: 'B',
      points: 2,
      isPrincipal: false
    });
  });
  
  // Clean up test data after tests
  afterAll(async () => {
    // Delete test data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Class.deleteMany({});
    await Exam.deleteMany({});
    await Subject.deleteMany({});
    await ALevelResult.deleteMany({});
    
    // Disconnect from test database
    await mongoose.disconnect();
  });
  
  describe('GET /api/a-level-reports/class/:classId/:examId', () => {
    it('should return a class report with all students', async () => {
      const response = await request(app)
        .get(`/api/a-level-reports/class/${classId}/${examId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const report = response.body.data;
      
      // Check class information
      expect(report.className).toBe('Form 5A Test');
      expect(report.formLevel).toBe(5);
      
      // Check students
      expect(report.students).toHaveLength(2);
      expect(report.totalStudents).toBe(2);
      
      // Check division distribution
      expect(report.divisionDistribution).toBeDefined();
      
      // Check student results
      const student1 = report.students.find(s => s.name.includes('John'));
      expect(student1).toBeDefined();
      expect(student1.results).toHaveLength(3);
      
      // Check subject results
      const physicsResult = student1.results.find(r => r.subject === 'Physics');
      expect(physicsResult).toBeDefined();
      expect(physicsResult.marks).toBe(85);
      expect(physicsResult.grade).toBe('A');
    });
    
    it('should filter students by form level', async () => {
      // Create a Form 6 student
      const student3 = await Student.create({
        firstName: 'Bob',
        lastName: 'Johnson',
        rollNumber: 'S003',
        gender: 'male',
        form: 6,
        educationLevel: 'A_LEVEL',
        class: classId
      });
      
      // Add results for the Form 6 student
      const physics = await Subject.findOne({ code: 'PHY' });
      const chemistry = await Subject.findOne({ code: 'CHE' });
      const generalStudies = await Subject.findOne({ code: 'GS' });
      
      await ALevelResult.create({
        studentId: student3._id,
        examId: examId,
        subjectId: physics._id,
        marksObtained: 90,
        grade: 'A',
        points: 1,
        isPrincipal: true
      });
      
      await ALevelResult.create({
        studentId: student3._id,
        examId: examId,
        subjectId: chemistry._id,
        marksObtained: 85,
        grade: 'A',
        points: 1,
        isPrincipal: true
      });
      
      await ALevelResult.create({
        studentId: student3._id,
        examId: examId,
        subjectId: generalStudies._id,
        marksObtained: 80,
        grade: 'A',
        points: 1,
        isPrincipal: false
      });
      
      // Test Form 5 filter
      const form5Response = await request(app)
        .get(`/api/a-level-reports/class/${classId}/${examId}`)
        .query({ formLevel: '5' })
        .set('Authorization', `Bearer ${token}`);
      
      expect(form5Response.status).toBe(200);
      expect(form5Response.body.success).toBe(true);
      expect(form5Response.body.data).toBeDefined();
      
      const form5Report = form5Response.body.data;
      
      // Check that only Form 5 students are included
      expect(form5Report.students).toHaveLength(2);
      expect(form5Report.students.every(s => !s.name.includes('Bob'))).toBe(true);
      
      // Test Form 6 filter
      const form6Response = await request(app)
        .get(`/api/a-level-reports/class/${classId}/${examId}`)
        .query({ formLevel: '6' })
        .set('Authorization', `Bearer ${token}`);
      
      expect(form6Response.status).toBe(200);
      expect(form6Response.body.success).toBe(true);
      expect(form6Response.body.data).toBeDefined();
      
      const form6Report = form6Response.body.data;
      
      // Check that only Form 6 students are included
      expect(form6Report.students).toHaveLength(1);
      expect(form6Report.students[0].name).toContain('Bob');
    });
  });
});
