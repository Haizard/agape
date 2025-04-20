# O-Level Batch Marks Entry API Documentation

## Overview

This API endpoint allows for efficient batch entry of marks for O-Level students. It is optimized for performance with bulk database operations and comprehensive validation.

## Endpoint

```http
POST /api/o-level/marks/batch
```

## Authentication

- Requires a valid JWT token in the Authorization header
- User must have 'admin' or 'teacher' role
- Teachers must be authorized to access the specified class and subject

## Request Format

The request body should be an array of mark objects, each containing:

```json
[
  {
    "studentId": "60d5ec9f8e1b2c3a4c5d6e7f",
    "examId": "60d5ec9f8e1b2c3a4c5d6e7f",
    "academicYearId": "60d5ec9f8e1b2c3a4c5d6e7f",
    "examTypeId": "60d5ec9f8e1b2c3a4c5d6e7f",
    "subjectId": "60d5ec9f8e1b2c3a4c5d6e7f",
    "classId": "60d5ec9f8e1b2c3a4c5d6e7f",
    "marksObtained": 85,
    "comment": "Good performance",
    "_id": "60d5ec9f8e1b2c3a4c5d6e7f" // Optional, for updating existing results
  },
  // More student marks...
]
```

### Required Fields

- `studentId`: MongoDB ObjectId of the student
- `examId`: MongoDB ObjectId of the exam
- `academicYearId`: MongoDB ObjectId of the academic year
- `examTypeId`: MongoDB ObjectId of the exam type
- `subjectId`: MongoDB ObjectId of the subject
- `classId`: MongoDB ObjectId of the class
- `marksObtained`: Numeric value between 0 and 100

### Optional Fields

- `_id`: MongoDB ObjectId of an existing result (for updates)
- `comment`: String with comments about the student's performance

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Successfully processed 25 results",
  "successCount": 25,
  "errorCount": 2,
  "processingTime": 1250,
  "updateCount": 15,
  "insertCount": 10,
  "errors": [
    {
      "studentId": "60d5ec9f8e1b2c3a4c5d6e7f",
      "message": "Invalid marks value",
      "details": "Marks must be a number between 0 and 100"
    }
  ]
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error processing batch marks",
  "error": "Error message"
}
```

## Validation Rules

1. `marksObtained` must be a number between 0 and 100
2. All required fields must be present
3. `studentId` must be a valid MongoDB ObjectId
4. Students must be O-Level students
5. No duplicate entries for the same student, subject, exam, and academic year

## Grade Calculation

Grades and points are automatically calculated based on the Tanzania NECTA CSEE grading system:

- A: 75-100 (1 point)
- B: 65-74 (2 points)
- C: 45-64 (3 points)
- D: 30-44 (4 points)
- F: 0-29 (5 points)

## Performance Optimization

- Uses MongoDB `bulkWrite` for updates and `insertMany` for new entries
- Batch validation to reduce database queries
- Preloads all referenced entities in bulk
- Uses transactions to ensure data integrity

## Example Usage

### Request

```javascript
const response = await fetch('/api/o-level/marks/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify([
    {
      studentId: "60d5ec9f8e1b2c3a4c5d6e7f",
      examId: "60d5ec9f8e1b2c3a4c5d6e7f",
      academicYearId: "60d5ec9f8e1b2c3a4c5d6e7f",
      examTypeId: "60d5ec9f8e1b2c3a4c5d6e7f",
      subjectId: "60d5ec9f8e1b2c3a4c5d6e7f",
      classId: "60d5ec9f8e1b2c3a4c5d6e7f",
      marksObtained: 85
    },
    // More student marks...
  ])
});

const result = await response.json();
```

### Response

```json
{
  "success": true,
  "message": "Successfully processed 1 results",
  "successCount": 1,
  "errorCount": 0,
  "processingTime": 250,
  "updateCount": 0,
  "insertCount": 1,
  "errors": []
}
```

## Migration Status

### Legacy Endpoints (Deprecated)

The following legacy endpoints have been deprecated and will redirect to the new standardized endpoint:

- `/api/o-level-results/batch` - Returns 301 with redirect to new endpoint
- `/api/results/enter-marks/batch` - Returns 301 with redirect to new endpoint
- `/api/v2/results/enter-batch-marks` - Returns 301 with redirect to new endpoint
- `/api/fixed-results/enter-marks/batch` - Returns 301 with redirect to new endpoint

### Frontend Components Updated

All frontend components have been updated to use the new standardized endpoint:

- `DirectMarksEntry.jsx`
- `FixedSubjectMarksEntry.js`
- `WorkingSubjectMarksEntry.js`
- `EnterSampleMarks.jsx`
- `ALevelBulkMarksEntry.jsx` (for O-Level marks)
- `UnifiedMarksEntry.jsx`
- `SubjectMarksEntry.js`

## Notes

- The API uses MongoDB transactions to ensure data integrity
- Performance metrics are included in the response
- Detailed error messages help identify issues with specific entries
- Legacy endpoints will be completely removed after a 3-6 month deprecation period
