/**
 * Mock Data Service
 * 
 * This service provides mock data for development when MongoDB is not available.
 * It's used when the USE_MOCK_DATA environment variable is set to 'true'.
 */

// Mock collections
const mockData = {
  users: [
    {
      _id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      password: '$2a$10$X7aPHQx5M.DPmPZN0gX0Y.Wz0mKQhMzXwh9M1vB7Uwo7xEJZ9LRfq', // hashed 'password123'
      role: 'admin',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '2',
      name: 'Teacher User',
      email: 'teacher@example.com',
      password: '$2a$10$X7aPHQx5M.DPmPZN0gX0Y.Wz0mKQhMzXwh9M1vB7Uwo7xEJZ9LRfq', // hashed 'password123'
      role: 'teacher',
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02')
    }
  ],
  
  classes: [
    {
      _id: '1',
      name: 'Form 1A',
      educationLevel: 'O_LEVEL',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '2',
      name: 'Form 2B',
      educationLevel: 'O_LEVEL',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '3',
      name: 'Form 3C',
      educationLevel: 'O_LEVEL',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '4',
      name: 'Form 4D',
      educationLevel: 'O_LEVEL',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '5',
      name: 'Form 5 PCM',
      educationLevel: 'A_LEVEL',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '6',
      name: 'Form 6 PCB',
      educationLevel: 'A_LEVEL',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    }
  ],
  
  students: [
    {
      _id: '1',
      name: 'John Doe',
      registrationNumber: 'S001',
      classId: '1',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '2',
      name: 'Jane Smith',
      registrationNumber: 'S002',
      classId: '1',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '3',
      name: 'Michael Johnson',
      registrationNumber: 'S003',
      classId: '2',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '4',
      name: 'Emily Brown',
      registrationNumber: 'S004',
      classId: '2',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '5',
      name: 'David Wilson',
      registrationNumber: 'S005',
      classId: '5',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    }
  ],
  
  subjects: [
    {
      _id: '1',
      name: 'Mathematics',
      code: 'MATH',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '2',
      name: 'English',
      code: 'ENG',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '3',
      name: 'Physics',
      code: 'PHY',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '4',
      name: 'Chemistry',
      code: 'CHEM',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '5',
      name: 'Biology',
      code: 'BIO',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    }
  ],
  
  academicYears: [
    {
      _id: '1',
      name: '2025-2026',
      isActive: true,
      terms: [
        {
          _id: '1',
          name: 'Term 1',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-04-30')
        },
        {
          _id: '2',
          name: 'Term 2',
          startDate: new Date('2025-05-01'),
          endDate: new Date('2025-08-31')
        },
        {
          _id: '3',
          name: 'Term 3',
          startDate: new Date('2025-09-01'),
          endDate: new Date('2025-12-31')
        }
      ],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '2',
      name: '2024-2025',
      isActive: false,
      terms: [
        {
          _id: '4',
          name: 'Term 1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-04-30')
        },
        {
          _id: '5',
          name: 'Term 2',
          startDate: new Date('2024-05-01'),
          endDate: new Date('2024-08-31')
        },
        {
          _id: '6',
          name: 'Term 3',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-12-31')
        }
      ],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    }
  ],
  
  marks: [
    {
      _id: '1',
      studentId: '1',
      subjectId: '1',
      academicYearId: '1',
      termId: '1',
      mark: 85,
      grade: 'A',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '2',
      studentId: '1',
      subjectId: '2',
      academicYearId: '1',
      termId: '1',
      mark: 78,
      grade: 'B',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '3',
      studentId: '2',
      subjectId: '1',
      academicYearId: '1',
      termId: '1',
      mark: 92,
      grade: 'A+',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    }
  ],
  
  teachers: [
    {
      _id: '1',
      name: 'Mr. Smith',
      email: 'smith@example.com',
      subjects: ['1', '3'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '2',
      name: 'Ms. Johnson',
      email: 'johnson@example.com',
      subjects: ['2', '5'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    }
  ],
  
  subjectCombinations: [
    {
      _id: '1',
      name: 'PCM',
      subjects: ['1', '3', '4'],
      educationLevel: 'A_LEVEL',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      _id: '2',
      name: 'PCB',
      subjects: ['1', '4', '5'],
      educationLevel: 'A_LEVEL',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    }
  ]
};

// Helper functions to simulate MongoDB operations
const mockDataService = {
  // Find documents in a collection
  find: (collection, query = {}, options = {}) => {
    if (!mockData[collection]) {
      return [];
    }
    
    let results = [...mockData[collection]];
    
    // Apply filters based on query
    if (Object.keys(query).length > 0) {
      results = results.filter(item => {
        for (const [key, value] of Object.entries(query)) {
          if (item[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }
    
    // Apply pagination
    if (options.limit) {
      const skip = options.skip || 0;
      results = results.slice(skip, skip + options.limit);
    }
    
    // Apply sorting
    if (options.sort) {
      const sortField = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortField];
      
      results.sort((a, b) => {
        if (a[sortField] < b[sortField]) return sortOrder === 1 ? -1 : 1;
        if (a[sortField] > b[sortField]) return sortOrder === 1 ? 1 : -1;
        return 0;
      });
    }
    
    return results;
  },
  
  // Find a single document
  findOne: (collection, query = {}) => {
    if (!mockData[collection]) {
      return null;
    }
    
    return mockData[collection].find(item => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) {
          return false;
        }
      }
      return true;
    }) || null;
  },
  
  // Find by ID
  findById: (collection, id) => {
    if (!mockData[collection]) {
      return null;
    }
    
    return mockData[collection].find(item => item._id === id) || null;
  },
  
  // Create a new document
  create: (collection, data) => {
    if (!mockData[collection]) {
      mockData[collection] = [];
    }
    
    const newId = (mockData[collection].length + 1).toString();
    const newItem = {
      _id: newId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockData[collection].push(newItem);
    return newItem;
  },
  
  // Update a document
  updateOne: (collection, query, update) => {
    if (!mockData[collection]) {
      return { modifiedCount: 0 };
    }
    
    let modifiedCount = 0;
    
    mockData[collection] = mockData[collection].map(item => {
      let matches = true;
      
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        modifiedCount++;
        return {
          ...item,
          ...update.$set,
          updatedAt: new Date()
        };
      }
      
      return item;
    });
    
    return { modifiedCount };
  },
  
  // Delete a document
  deleteOne: (collection, query) => {
    if (!mockData[collection]) {
      return { deletedCount: 0 };
    }
    
    const initialLength = mockData[collection].length;
    
    mockData[collection] = mockData[collection].filter(item => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] === value) {
          return false;
        }
      }
      return true;
    });
    
    return { deletedCount: initialLength - mockData[collection].length };
  },
  
  // Count documents
  countDocuments: (collection, query = {}) => {
    if (!mockData[collection]) {
      return 0;
    }
    
    return mockData[collection].filter(item => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) {
          return false;
        }
      }
      return true;
    }).length;
  }
};

module.exports = mockDataService;
