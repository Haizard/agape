# O-Level Access Control System

## Overview

This document outlines the implementation of strict subject-level and student-level access control for O-Level marks entry in the Agape Lutheran Junior Seminary School Management System. The implementation ensures that teachers can only access and enter marks for:

1. Classes they are assigned to
2. Subjects they are explicitly assigned to teach within those classes
3. Students who are enrolled in those classes and take the subjects the teacher teaches

## Key Components

### 1. Enhanced Teacher Authentication Middleware

The `enhancedTeacherAuth.js` middleware has been updated to include:

- `strictSubjectAccessControl`: Ensures teachers can only access subjects they are specifically assigned to teach
- `filterStudentsBySubjectSelection`: Ensures teachers can only see students who take the subjects they teach

### 2. Teacher Authorization Middleware

The `teacherAuthorization.js` middleware has been updated to include strict checks for:

- Subject-level access control for O-Level classes
- Student-level access control for optional subjects
- Batch operations validation

### 3. Enhanced Teacher Subject Service

The `enhancedTeacherSubjectService.js` service has been updated to include:

- `isTeacherSpecificallyAssignedToSubject`: Checks all three assignment models (Class.subjects, TeacherSubject, TeacherAssignment)
- Improved logging and error handling

## Implementation Details

### Subject-Level Access Control

For O-Level classes, we now check if a teacher is specifically assigned to a subject using three methods:

1. **Class.subjects Array**: Check if the teacher is directly assigned to the subject in the Class model
2. **TeacherSubject Model**: Check if there's an active TeacherSubject record linking the teacher to the subject
3. **TeacherAssignment Model**: Check if there's a TeacherAssignment record linking the teacher to the subject

A teacher must be assigned to a subject in at least one of these models to access it.

### Student-Level Access Control

For O-Level classes, we filter students based on subject selection:

1. **Core Subjects**: All students in the class take core subjects
2. **Optional Subjects**: Only students who have selected the subject can be accessed

We check student subject selection using two methods:

1. **StudentSubjectSelection Model**: Check if the subject is in the student's approved optional subjects
2. **Student.selectedSubjects Array**: Check if the subject is in the student's selected subjects array

### API Endpoints

The following endpoints have been updated to use the new access control system:

- `GET /api/enhanced-teachers/o-level/classes/:classId/subjects/:subjectId/students`: Get students for a subject
- `POST /api/o-level/marks/batch`: Enter batch marks for O-Level students

## Testing

Automated tests have been added to validate the access control system:

- `backend/tests/oLevelAccessControl.test.js`: Tests for subject-level and student-level access control

The tests cover the following scenarios:

1. Teacher can access core subject and see all students
2. Teacher can access optional subject and see only students who take it
3. Teacher cannot access unassigned subject
4. Admin can access any subject
5. Teacher can enter marks for core subject for all students
6. Teacher can enter marks for optional subject only for students who take it
7. Teacher cannot enter marks for optional subject for students who don't take it
8. Teacher cannot enter marks for unassigned subject

## Usage Examples

### Accessing Students for a Subject

```javascript
// Get students for a subject
const response = await fetch(`/api/enhanced-teachers/o-level/classes/${classId}/subjects/${subjectId}/students`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
// result.students will only include students the teacher is authorized to see
```

### Entering Marks for Students

```javascript
// Enter marks for students
const response = await fetch('/api/o-level/marks/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify([
    {
      studentId: '60d5ec9f8e1b2c3a4c5d6e7f',
      examId: '60d5ec9f8e1b2c3a4c5d6e7f',
      academicYearId: '60d5ec9f8e1b2c3a4c5d6e7f',
      examTypeId: '60d5ec9f8e1b2c3a4c5d6e7f',
      subjectId: '60d5ec9f8e1b2c3a4c5d6e7f',
      classId: '60d5ec9f8e1b2c3a4c5d6e7f',
      marksObtained: 85
    }
    // More student marks...
  ])
});

const result = await response.json();
// Will return 403 if teacher is not authorized for the subject or students
```

## Troubleshooting

If a teacher is unable to access a subject or student, check the following:

1. Is the teacher assigned to the subject in at least one of the three assignment models?
2. For optional subjects, has the student selected the subject?
3. Is the subject selection approved?

The system logs detailed information about authorization checks, which can be used to diagnose issues.
