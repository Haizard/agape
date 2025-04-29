const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../../app');
const Assessment = require('../../models/Assessment');
const Result = require('../../models/Result');
const User = require('../../models/User');

describe('Assessment Controller', () => {
  let mongoServer;
  let token;
  let testUser;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user and get token
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin'
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Assessment.deleteMany({});
    await Result.deleteMany({});
  });

  describe('GET /api/assessments', () => {
    it('should return all assessments', async () => {
      // Create test assessments
      await Assessment.create([
        {
          name: 'Test Assessment 1',
          weightage: 60,
          maxMarks: 100,
          term: '1',
          examDate: new Date(),
          status: 'active',
          createdBy: testUser._id
        },
        {
          name: 'Test Assessment 2',
          weightage: 40,
          maxMarks: 100,
          term: '1',
          examDate: new Date(),
          status: 'active',
          createdBy: testUser._id
        }
      ]);

      const response = await request(app)
        .get('/api/assessments')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/assessments', () => {
    it('should create a new assessment', async () => {
      const assessmentData = {
        name: 'New Assessment',
        weightage: 30,
        maxMarks: 100,
        term: '1',
        examDate: new Date().toISOString(),
        status: 'active'
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${token}`)
        .send(assessmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(assessmentData.name);
    });

    it('should validate total weightage', async () => {
      // Create existing assessment
      await Assessment.create({
        name: 'Existing Assessment',
        weightage: 80,
        maxMarks: 100,
        term: '1',
        examDate: new Date(),
        status: 'active',
        createdBy: testUser._id
      });

      const assessmentData = {
        name: 'New Assessment',
        weightage: 30, // This would exceed 100%
        maxMarks: 100,
        term: '1',
        examDate: new Date().toISOString(),
        status: 'active'
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${token}`)
        .send(assessmentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('weightage');
    });
  });

  describe('PUT /api/assessments/:id', () => {
    it('should update an assessment', async () => {
      const assessment = await Assessment.create({
        name: 'Test Assessment',
        weightage: 50,
        maxMarks: 100,
        term: '1',
        examDate: new Date(),
        status: 'active',
        createdBy: testUser._id
      });

      const updateData = {
        name: 'Updated Assessment',
        weightage: 40
      };

      const response = await request(app)
        .put(`/api/assessments/${assessment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });
  });

  describe('DELETE /api/assessments/:id', () => {
    it('should delete an assessment', async () => {
      const assessment = await Assessment.create({
        name: 'Test Assessment',
        weightage: 50,
        maxMarks: 100,
        term: '1',
        examDate: new Date(),
        status: 'active',
        createdBy: testUser._id
      });

      const response = await request(app)
        .delete(`/api/assessments/${assessment._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedAssessment = await Assessment.findById(assessment._id);
      expect(deletedAssessment).toBeNull();
    });

    it('should not delete assessment with existing results', async () => {
      const assessment = await Assessment.create({
        name: 'Test Assessment',
        weightage: 50,
        maxMarks: 100,
        term: '1',
        examDate: new Date(),
        status: 'active',
        createdBy: testUser._id
      });

      // Create a result for this assessment
      await Result.create({
        studentId: mongoose.Types.ObjectId(),
        assessmentId: assessment._id,
        marksObtained: 80,
        maxMarks: 100
      });

      const response = await request(app)
        .delete(`/api/assessments/${assessment._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('existing results');
    });
  });

  describe('GET /api/assessments/stats', () => {
    it('should return assessment statistics', async () => {
      const assessment = await Assessment.create({
        name: 'Test Assessment',
        weightage: 50,
        maxMarks: 100,
        term: '1',
        examDate: new Date(),
        status: 'active',
        createdBy: testUser._id
      });

      // Create some results
      await Result.create([
        {
          studentId: mongoose.Types.ObjectId(),
          assessmentId: assessment._id,
          marksObtained: 80,
          maxMarks: 100
        },
        {
          studentId: mongoose.Types.ObjectId(),
          assessmentId: assessment._id,
          marksObtained: 90,
          maxMarks: 100
        }
      ]);

      const response = await request(app)
        .get('/api/assessments/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty('totalAssessments');
      expect(response.body.stats).toHaveProperty('completionRate');
    });
  });

  describe('GET /api/assessments/report/:classId/:assessmentId', () => {
    it('should generate assessment report', async () => {
      const assessment = await Assessment.create({
        name: 'Test Assessment',
        weightage: 50,
        maxMarks: 100,
        term: '1',
        examDate: new Date(),
        status: 'active',
        createdBy: testUser._id
      });

      const classId = mongoose.Types.ObjectId();

      // Create test results
      await Result.create([
        {
          studentId: mongoose.Types.ObjectId(),
          assessmentId: assessment._id,
          classId,
          marksObtained: 80,
          maxMarks: 100
        },
        {
          studentId: mongoose.Types.ObjectId(),
          assessmentId: assessment._id,
          classId,
          marksObtained: 90,
          maxMarks: 100
        }
      ]);

      const response = await request(app)
        .get(`/api/assessments/report/${classId}/${assessment._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.report).toHaveProperty('totalStudents');
      expect(response.body.report).toHaveProperty('averageScore');
      expect(response.body.report).toHaveProperty('results');
    });
  });
});