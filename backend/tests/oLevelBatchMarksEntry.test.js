const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../index');
const OLevelResult = require('../models/OLevelResult');
const Student = require('../models/Student');
const User = require('../models/User');
const TeacherSubject = require('../models/TeacherSubject');

// Mock data
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Teacher',
  email: 'teacher@test.com',
  password: 'password123',
  role: 'teacher'
};

const mockTeacher = {
  _id: new mongoose.Types.ObjectId(),
  userId: mockUser._id,
  firstName: 'Test',
  lastName: 'Teacher'
};

const mockClass = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Form 1A',
  educationLevel: 'O_LEVEL'
};

const mockSubject = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Mathematics',
  code: 'MATH',
  type: 'CORE',
  educationLevel: 'O_LEVEL'
};

const mockExam = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Midterm Exam'
};

const mockAcademicYear = {
  _id: new mongoose.Types.ObjectId(),
  name: '2023-2024'
};

const mockExamType = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Midterm'
};

const mockStudents = [
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'Student',
    lastName: 'One',
    educationLevel: 'O_LEVEL',
    classId: mockClass._id
  },
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'Student',
    lastName: 'Two',
    educationLevel: 'O_LEVEL',
    classId: mockClass._id
  }
];

const mockTeacherSubject = {
  _id: new mongoose.Types.ObjectId(),
  teacherId: mockTeacher._id,
  classId: mockClass._id,
  subjectId: mockSubject._id
};

// Mock token generation
const generateToken = (user) => {
  return 'mock-token';
};

// Mock data for batch marks entry
const mockBatchMarksData = [
  {
    studentId: mockStudents[0]._id,
    examId: mockExam._id,
    academicYearId: mockAcademicYear._id,
    examTypeId: mockExamType._id,
    subjectId: mockSubject._id,
    classId: mockClass._id,
    marksObtained: 85
  },
  {
    studentId: mockStudents[1]._id,
    examId: mockExam._id,
    academicYearId: mockAcademicYear._id,
    examTypeId: mockExamType._id,
    subjectId: mockSubject._id,
    classId: mockClass._id,
    marksObtained: 75
  }
];

// Mock invalid data
const mockInvalidBatchMarksData = [
  {
    // Missing studentId
    examId: mockExam._id,
    academicYearId: mockAcademicYear._id,
    examTypeId: mockExamType._id,
    subjectId: mockSubject._id,
    classId: mockClass._id,
    marksObtained: 85
  },
  {
    studentId: mockStudents[1]._id,
    examId: mockExam._id,
    academicYearId: mockAcademicYear._id,
    examTypeId: mockExamType._id,
    subjectId: mockSubject._id,
    classId: mockClass._id,
    marksObtained: 120 // Invalid marks (> 100)
  }
];

// Mock existing result for update test
const mockExistingResult = {
  _id: new mongoose.Types.ObjectId(),
  studentId: mockStudents[0]._id,
  examId: mockExam._id,
  academicYearId: mockAcademicYear._id,
  examTypeId: mockExamType._id,
  subjectId: mockSubject._id,
  classId: mockClass._id,
  marksObtained: 70,
  grade: 'B',
  points: 2
};

// Mock update data
const mockUpdateData = [
  {
    _id: mockExistingResult._id,
    studentId: mockStudents[0]._id,
    examId: mockExam._id,
    academicYearId: mockAcademicYear._id,
    examTypeId: mockExamType._id,
    subjectId: mockSubject._id,
    classId: mockClass._id,
    marksObtained: 90
  }
];

describe('O-Level Batch Marks Entry API', () => {
  let token;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/agape_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Clear collections
    await OLevelResult.deleteMany({});
    await Student.deleteMany({});
    await User.deleteMany({});
    await TeacherSubject.deleteMany({});

    // Create test data
    await User.create(mockUser);
    await Student.insertMany(mockStudents);
    await TeacherSubject.create(mockTeacherSubject);
    await OLevelResult.create(mockExistingResult);

    // Generate token
    token = generateToken(mockUser);
  });

  afterAll(async () => {
    // Disconnect from test database
    await mongoose.connection.close();
  });

  describe('POST /api/o-level/marks/batch', () => {
    test('should create new marks entries successfully', async () => {
      // Mock authentication middleware
      jest.spyOn(require('../middleware/auth'), 'authenticateToken').mockImplementation((req, res, next) => {
        req.user = { id: mockUser._id, role: 'teacher' };
        next();
      });

      // Mock teacher authorization middleware
      jest.spyOn(require('../middleware/teacherAuthorization'), 'checkTeacherAuthorization').mockImplementation((req, res, next) => {
        next();
      });

      const response = await request(app)
        .post('/api/o-level/marks/batch')
        .set('Authorization', `Bearer ${token}`)
        .send(mockBatchMarksData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.successCount).toBe(2);
      expect(response.body.errorCount).toBe(0);

      // Verify data was saved
      const results = await OLevelResult.find({
        studentId: { $in: [mockStudents[0]._id, mockStudents[1]._id] },
        examId: mockExam._id
      });

      expect(results.length).toBe(3); // 2 new + 1 existing
      expect(results.find(r => r.studentId.toString() === mockStudents[0]._id.toString() && r._id.toString() !== mockExistingResult._id.toString()).marksObtained).toBe(85);
      expect(results.find(r => r.studentId.toString() === mockStudents[1]._id.toString()).marksObtained).toBe(75);
    });

    test('should update existing marks entries successfully', async () => {
      // Mock authentication middleware
      jest.spyOn(require('../middleware/auth'), 'authenticateToken').mockImplementation((req, res, next) => {
        req.user = { id: mockUser._id, role: 'teacher' };
        next();
      });

      // Mock teacher authorization middleware
      jest.spyOn(require('../middleware/teacherAuthorization'), 'checkTeacherAuthorization').mockImplementation((req, res, next) => {
        next();
      });

      const response = await request(app)
        .post('/api/o-level/marks/batch')
        .set('Authorization', `Bearer ${token}`)
        .send(mockUpdateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.successCount).toBe(1);
      expect(response.body.errorCount).toBe(0);

      // Verify data was updated
      const updatedResult = await OLevelResult.findById(mockExistingResult._id);
      expect(updatedResult.marksObtained).toBe(90);
      expect(updatedResult.grade).toBe('A');
      expect(updatedResult.points).toBe(1);
    });

    test('should handle validation errors correctly', async () => {
      // Mock authentication middleware
      jest.spyOn(require('../middleware/auth'), 'authenticateToken').mockImplementation((req, res, next) => {
        req.user = { id: mockUser._id, role: 'teacher' };
        next();
      });

      // Mock teacher authorization middleware
      jest.spyOn(require('../middleware/teacherAuthorization'), 'checkTeacherAuthorization').mockImplementation((req, res, next) => {
        next();
      });

      const response = await request(app)
        .post('/api/o-level/marks/batch')
        .set('Authorization', `Bearer ${token}`)
        .send(mockInvalidBatchMarksData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBe(2);
      expect(response.body.errors[0].message).toContain('Missing required fields');
      expect(response.body.errors[1].message).toContain('Invalid marks value');
    });

    test('should reject unauthorized access', async () => {
      // Mock authentication middleware to simulate unauthorized access
      jest.spyOn(require('../middleware/auth'), 'authenticateToken').mockImplementation((req, res, next) => {
        req.user = { id: mockUser._id, role: 'student' }; // Student role should not have access
        next();
      });

      const response = await request(app)
        .post('/api/o-level/marks/batch')
        .set('Authorization', `Bearer ${token}`)
        .send(mockBatchMarksData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
