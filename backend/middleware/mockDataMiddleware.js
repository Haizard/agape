/**
 * Mock Data Middleware
 * 
 * This middleware intercepts API requests and returns mock data when USE_MOCK_DATA is true.
 */

const mockDataService = require('../services/mockDataService');

// Map API endpoints to mock data collections
const endpointToCollectionMap = {
  '/api/classes': 'classes',
  '/api/students': 'students',
  '/api/subjects': 'subjects',
  '/api/academic-years': 'academicYears',
  '/api/marks': 'marks',
  '/api/teachers': 'teachers',
  '/api/subject-combinations': 'subjectCombinations',
  '/api/users': 'users'
};

// Helper to extract ID from URL like /api/classes/123
const extractIdFromUrl = (url) => {
  const parts = url.split('/');
  return parts[parts.length - 1];
};

// Helper to parse query parameters
const parseQueryParams = (req) => {
  const query = {};
  
  // Handle common query parameters
  if (req.query.educationLevel) {
    query.educationLevel = req.query.educationLevel;
  }
  
  if (req.query.classId) {
    query.classId = req.query.classId;
  }
  
  if (req.query.academicYear) {
    query.academicYearId = req.query.academicYear;
  }
  
  if (req.query.term) {
    query.termId = req.query.term;
  }
  
  if (req.query.subject) {
    query.subjectId = req.query.subject;
  }
  
  return query;
};

// Helper to parse pagination options
const parsePaginationOptions = (req) => {
  const options = {};
  
  if (req.query.page && req.query.limit) {
    options.skip = (parseInt(req.query.page) - 1) * parseInt(req.query.limit);
    options.limit = parseInt(req.query.limit);
  } else if (req.query.limit) {
    options.limit = parseInt(req.query.limit);
  }
  
  return options;
};

// The middleware function
const mockDataMiddleware = (req, res, next) => {
  // Only use mock data if USE_MOCK_DATA is true
  if (process.env.USE_MOCK_DATA !== 'true') {
    return next();
  }
  
  // Get the base endpoint (e.g., /api/classes from /api/classes/123)
  const baseEndpoint = '/' + req.path.split('/').slice(0, 3).join('/');
  const collection = endpointToCollectionMap[baseEndpoint];
  
  // If we don't have a mapping for this endpoint, continue to the actual handler
  if (!collection) {
    return next();
  }
  
  console.log(`[Mock] Handling ${req.method} ${req.path}`);
  
  try {
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // Check if it's a request for a specific item by ID
        if (req.path.split('/').length > 3 && !req.path.includes('?')) {
          const id = extractIdFromUrl(req.path);
          
          // Special case for academic years with terms
          if (baseEndpoint === '/api/academic-years' && id) {
            const academicYear = mockDataService.findById('academicYears', id);
            if (academicYear) {
              return res.json(academicYear);
            }
            return res.status(404).json({ message: 'Academic year not found' });
          }
          
          // Special case for classes with students
          if (baseEndpoint === '/api/classes' && req.path.includes('/students')) {
            const classId = req.path.split('/')[3];
            const students = mockDataService.find('students', { classId });
            return res.json(students);
          }
          
          // Special case for classes with subjects
          if (baseEndpoint === '/api/classes' && req.path.includes('/subjects')) {
            const classId = req.path.split('/')[3];
            const classData = mockDataService.findById('classes', classId);
            
            if (classData) {
              if (classData.educationLevel === 'A_LEVEL') {
                // For A-Level, get subjects from subject combinations
                const combinations = mockDataService.find('subjectCombinations', { educationLevel: 'A_LEVEL' });
                const subjectIds = new Set();
                combinations.forEach(combo => {
                  combo.subjects.forEach(subjectId => {
                    subjectIds.add(subjectId);
                  });
                });
                
                const subjects = Array.from(subjectIds).map(id => mockDataService.findById('subjects', id));
                return res.json(subjects.filter(Boolean));
              } else {
                // For O-Level, return all subjects
                return res.json(mockDataService.find('subjects'));
              }
            }
            
            return res.status(404).json({ message: 'Class not found' });
          }
          
          // General case for getting item by ID
          const item = mockDataService.findById(collection, id);
          if (item) {
            return res.json(item);
          }
          return res.status(404).json({ message: 'Item not found' });
        }
        
        // Handle collection requests with query parameters
        const query = parseQueryParams(req);
        const options = parsePaginationOptions(req);
        const items = mockDataService.find(collection, query, options);
        
        // If pagination is requested, return with metadata
        if (req.query.page && req.query.limit) {
          const totalItems = mockDataService.countDocuments(collection, query);
          const totalPages = Math.ceil(totalItems / parseInt(req.query.limit));
          
          return res.json({
            items,
            pagination: {
              totalItems,
              totalPages,
              currentPage: parseInt(req.query.page),
              pageSize: parseInt(req.query.limit)
            }
          });
        }
        
        // Otherwise just return the items
        return res.json(items);
        
      case 'POST':
        // Create a new item
        const newItem = mockDataService.create(collection, req.body);
        return res.status(201).json(newItem);
        
      case 'PUT':
      case 'PATCH':
        // Update an item
        const updateId = extractIdFromUrl(req.path);
        const result = mockDataService.updateOne(
          collection,
          { _id: updateId },
          { $set: req.body }
        );
        
        if (result.modifiedCount > 0) {
          return res.json({ message: 'Updated successfully' });
        }
        return res.status(404).json({ message: 'Item not found' });
        
      case 'DELETE':
        // Delete an item
        const deleteId = extractIdFromUrl(req.path);
        const deleteResult = mockDataService.deleteOne(collection, { _id: deleteId });
        
        if (deleteResult.deletedCount > 0) {
          return res.json({ message: 'Deleted successfully' });
        }
        return res.status(404).json({ message: 'Item not found' });
        
      default:
        // For unsupported methods, continue to the actual handler
        return next();
    }
  } catch (error) {
    console.error('[Mock] Error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = mockDataMiddleware;
