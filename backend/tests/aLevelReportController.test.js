/**
 * A-Level Report Controller Tests
 *
 * Tests for the A-Level report controller endpoints
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const ALevelResult = require('../models/ALevelResult');
const Subject = require('../models/Subject');
const CharacterAssessment = require('../models/CharacterAssessment');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Mock data
const mockStudent = {
  _id: new mongoose.Types.ObjectId(),
  firstName: 'John',
  lastName: 'Doe',
  rollNumber: 'S12345',
  gender: 'male',
  form: 5,
  educationLevel: 'A_LEVEL',
  class: new mongoose.Types.ObjectId()
};

const mockClass = {
  _id: mockStudent.class,
  name: 'Form 5A',
  section: 'A',
  stream: 'Science',
  form: 5,
  educationLevel: 'A_LEVEL',
  academicYear: new mongoose.Types.ObjectId()
};

const mockExam = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Mid Term Exam',
  startDate: new Date('2023-06-01'),
  endDate: new Date('2023-06-10'),
  academicYear: mockClass.academicYear
};

const mockSubject1 = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Physics',
  code: 'PHY',
  isPrincipal: true,
  educationLevel: 'A_LEVEL'
};

const mockSubject2 = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Mathematics',
  code: 'MATH',
  isPrincipal: true,
  educationLevel: 'A_LEVEL'
};

const mockSubject3 = {
  _id: new mongoose.Types.ObjectId(),
  name: 'General Studies',
  code: 'GS',
  isPrincipal: false,
  educationLevel: 'A_LEVEL'
};

const mockResult1 = {
  _id: new mongoose.Types.ObjectId(),
  studentId: mockStudent._id,
  examId: mockExam._id,
  subjectId: mockSubject1._id,
  marksObtained: 85,
  grade: 'A',
  points: 5,
  isPrincipal: true
};

const mockResult2 = {
  _id: new mongoose.Types.ObjectId(),
  studentId: mockStudent._id,
  examId: mockExam._id,
  subjectId: mockSubject2._id,
  marksObtained: 78,
  grade: 'B',
  points: 4,
  isPrincipal: true
};

const mockResult3 = {
  _id: new mongoose.Types.ObjectId(),
  studentId: mockStudent._id,
  examId: mockExam._id,
  subjectId: mockSubject3._id,
  marksObtained: 65,
  grade: 'C',
  points: 3,
  isPrincipal: false
};

const mockCharacterAssessment = {
  _id: new mongoose.Types.ObjectId(),
  studentId: mockStudent._id,
  examId: mockExam._id,
  punctuality: 'Good',
  discipline: 'Good',
  respect: 'Good',
  leadership: 'Good',
  participation: 'Good',
  overallAssessment: 'Good',
  comments: 'Good student',
  assessedBy: new mongoose.Types.ObjectId()
};

const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin'
};

// Generate a valid JWT token for testing
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '1h' }
  );
};

// Mock the database models
jest.mock('../models/Student');
jest.mock('../models/Class');
jest.mock('../models/Exam');
jest.mock('../models/ALevelResult');
jest.mock('../models/Subject');
jest.mock('../models/CharacterAssessment');
jest.mock('../models/User');

describe('A-Level Report Controller', () => {
  let token;

  beforeAll(() => {
    token = generateToken(mockUser);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    Student.findById = jest.fn().mockResolvedValue(mockStudent);

    Class.findById = jest.fn().mockResolvedValue(mockClass);

    Exam.findById = jest.fn().mockImplementation(() => ({
      populate: jest.fn().mockResolvedValue(mockExam)
    }));

    ALevelResult.find = jest.fn().mockImplementation(() => ({
      populate: jest.fn().mockResolvedValue([mockResult1, mockResult2, mockResult3])
    }));

    CharacterAssessment.findOne = jest.fn().mockImplementation(() => ({
      populate: jest.fn().mockResolvedValue(mockCharacterAssessment)
    }));

    Student.find = jest.fn().mockResolvedValue([mockStudent]);
  });

  describe('GET /api/a-level-reports/student/:studentId/:examId', () => {
    it('should return a standardized A-Level student report', async () => {
      const response = await request(app)
        .get(`/api/a-level-reports/student/${mockStudent._id}/${mockExam._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // Check that the response has the expected structure
      const report = response.body.data;
      expect(report.studentId).toBe(mockStudent._id.toString());
      expect(report.studentDetails).toBeDefined();
      expect(report.examId).toBe(mockExam._id.toString());
      expect(report.subjectResults).toHaveLength(3);
      expect(report.principalSubjects).toHaveLength(2);
      expect(report.subsidiarySubjects).toHaveLength(1);
      expect(report.summary).toBeDefined();
      expect(report.characterAssessment).toBeDefined();
    });

    it('should return 404 if student not found', async () => {
      Student.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/a-level-reports/student/${mockStudent._id}/${mockExam._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Student not found');
    });

    it('should return 404 if exam not found', async () => {
      Exam.findById = jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(null)
      }));

      const response = await request(app)
        .get(`/api/a-level-reports/student/${mockStudent._id}/${mockExam._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Exam not found');
    });

    it('should return 404 if no results found', async () => {
      ALevelResult.find = jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue([])
      }));

      const response = await request(app)
        .get(`/api/a-level-reports/student/${mockStudent._id}/${mockExam._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No results found for this student');
    });
  });

  describe('GET /api/a-level-reports/class/:classId/:examId', () => {
    it('should return a standardized A-Level class report', async () => {
      const response = await request(app)
        .get(`/api/a-level-reports/class/${mockClass._id}/${mockExam._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // Check that the response has the expected structure
      const report = response.body.data;
      expect(report.classId).toBe(mockClass._id.toString());
      expect(report.className).toBe(mockClass.name);
      expect(report.examId).toBe(mockExam._id.toString());
      expect(report.students).toBeDefined();
      expect(report.classAverage).toBeDefined();
      expect(report.totalStudents).toBeDefined();
      expect(report.divisionDistribution).toBeDefined();
    });

    it('should return a filtered report when form level is provided', async () => {
      // Mock the Student.find to return filtered results
      Student.find = jest.fn().mockImplementation((query) => {
        // Check if the form filter is applied correctly
        expect(query).toHaveProperty('form', 5);
        return Promise.resolve([mockStudent]);
      });

      const response = await request(app)
        .get(`/api/a-level-reports/class/${mockClass._id}/${mockExam._id}`)
        .query({ formLevel: '5' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // Check that the response has the expected structure with form level
      const report = response.body.data;
      expect(report.formLevel).toBe('5');
    });

    it('should return 404 if class not found', async () => {
      Class.findById = jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(null)
      }));

      const response = await request(app)
        .get(`/api/a-level-reports/class/${mockClass._id}/${mockExam._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Class not found');
    });

    it('should return 404 if no students found in class', async () => {
      Student.find = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/a-level-reports/class/${mockClass._id}/${mockExam._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No students found in class');
    });

    it('should return 404 if no students found with specified form level', async () => {
      Student.find = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/a-level-reports/class/${mockClass._id}/${mockExam._id}`)
        .query({ formLevel: '6' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No students found in class with form level 6');
    });
  });
});
