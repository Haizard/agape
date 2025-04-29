const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../../app');
const Assessment = require('../../models/Assessment');
const Result = require('../../models/Result');
const User = require('../../models/User');
const Class = require('../../models/Class');
const Student = require('../../models/Student');

describe('Assessment API Integration Tests', () => {
  let mongoServer;
  let token;
  let testUser;
  let testClass;
  let testStudents;
  let testAssessment;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user
    testUser = await User.create({
      name: 'Test Teacher',
      email: 'teacher@test.com',
      password: 'password123',
      role: 'teacher'
    });

    // Get authentication token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teacher@test.com',
        password: 'password123'
      });

    token = loginResponse.body.token;

    // Create test class
    testClass = await Class.create({
      name: 'Test Class',
      grade: '12',
      section: 'A',
      academicYear: '2024'
    });

    // Create test students
    testStudents = await Student.create([
      {
        name: 'Student 1',
        registrationNumber: 'REG001',
        classId: testClass._id
      },
      {
        name: 'Student 2',
        registrationNumber: 'REG002',
        classId: testClass._id
      }
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Assessment.deleteMany({});
    await Result.deleteMany({});

    // Create a test assessment
    testAssessment = await Assessment.create({
      name: 'Integration Test Assessment',
      weightage: 40,
      maxMarks: 100,
      term: '1',
      examDate: new Date(),
      status: 'active',
      createdBy: testUser._id
    });
  });

  describe('Assessment Lifecycle', () => {
    it('should handle complete assessment lifecycle', async () => {
      // 1. Create Assessment
      const createResponse = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Lifecycle Test Assessment',
          weightage: 30,
          maxMarks: 100,
          term: '1',
          examDate: new Date().toISOString(),
          status: 'active'
        });

      expect(createResponse.status).toBe(201);
      const assessmentId = createResponse.body.data._id;

      // 2. Enter Marks
      const marksData = testStudents.map(student => ({
        studentId: student._id,
        assessmentId,
        marksObtained: Math.floor(Math.random() * 40) + 60 // Random marks between 60-100
      }));

      const marksResponse = await request(app)
        .post('/api/assessments/bulk-marks')
        .set('Authorization', `Bearer ${token}`)
        .send({ marks: marksData });

      expect(marksResponse.status).toBe(200);

      // 3. Generate Report
      const reportResponse = await request(app)
        .get(`/api/assessments/report/${testClass._id}/${assessmentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(reportResponse.status).toBe(200);
      expect(reportResponse.body.report).toHaveProperty('results');
      expect(reportResponse.body.report.results).toHaveLength(testStudents.length);

      // 4. Update Assessment
      const updateResponse = await request(app)
        .put(`/api/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Assessment Name',
          weightage: 35
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.name).toBe('Updated Assessment Name');

      // 5. Get Statistics
      const statsResponse = await request(app)
        .get('/api/assessments/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.stats).toHaveProperty('totalAssessments');
      expect(statsResponse.body.stats.totalAssessments).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid assessment data', async () => {
      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '', // Invalid: empty name
          weightage: 150, // Invalid: > 100
          term: '4' // Invalid: not in enum
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should handle invalid marks data', async () => {
      const response = await request(app)
        .post('/api/assessments/bulk-marks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          marks: [
            {
              studentId: testStudents[0]._id,
              assessmentId: testAssessment._id,
              marksObtained: 150 // Invalid: > maxMarks
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle non-existent resources', async () => {
      const fakeId = mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/assessments/report/${testClass._id}/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Authorization', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/assessments');

      expect(response.status).toBe(401);
    });

    it('should handle invalid tokens', async () => {
      const response = await request(app)
        .get('/api/assessments')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain weightage consistency within term', async () => {
      // Create first assessment with 70% weightage
      await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'First Assessment',
          weightage: 70,
          maxMarks: 100,
          term: '1',
          examDate: new Date().toISOString(),
          status: 'active'
        });

      // Try to create second assessment with 40% weightage (should fail as total would exceed 100%)
      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Second Assessment',
          weightage: 40,
          maxMarks: 100,
          term: '1',
          examDate: new Date().toISOString(),
          status: 'active'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('weightage');
    });

    it('should prevent deletion of assessments with results', async () => {
      // Create a result for the test assessment
      await Result.create({
        studentId: testStudents[0]._id,
        assessmentId: testAssessment._id,
        marksObtained: 85,
        maxMarks: 100
      });

      // Try to delete the assessment
      const response = await request(app)
        .delete(`/api/assessments/${testAssessment._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('existing results');
    });
  });
});