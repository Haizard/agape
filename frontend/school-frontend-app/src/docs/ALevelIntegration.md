# A-Level Integration Documentation

This document provides comprehensive documentation for the A-Level integration in the Agape system.

## Table of Contents

1. [Overview](#overview)
2. [Database Models](#database-models)
3. [API Endpoints](#api-endpoints)
4. [Frontend Components](#frontend-components)
5. [Utilities and Helpers](#utilities-and-helpers)
6. [Error Handling](#error-handling)
7. [Caching and Offline Support](#caching-and-offline-support)
8. [Best Practices](#best-practices)

## Overview

The Agape system supports both O-Level and A-Level education. A-Level education has specific requirements:

- Subject combinations (principal and subsidiary subjects)
- Different grading system
- Different division calculation
- Form 5 and Form 6 specific reports

This document explains how these requirements are implemented in the system.

## Database Models

### ALevelResult Model

The `ALevelResult` model stores A-Level exam results with the following key fields:

- `studentId`: Reference to the student
- `examId`: Reference to the exam
- `subjectId`: Reference to the subject
- `classId`: Reference to the class
- `marksObtained`: Marks obtained in the exam
- `grade`: Grade (A, B, C, D, E, S, F)
- `points`: Points (1-7)
- `isPrincipal`: Whether this is a principal subject

### SubjectCombination Model

The `SubjectCombination` model defines valid combinations of subjects for A-Level students:

- `name`: Name of the combination (e.g., "PCM")
- `code`: Code of the combination
- `educationLevel`: Always "A_LEVEL"
- `subjects`: Array of subject references
- `compulsorySubjects`: Array of compulsory subject references

### Subject Model

The `Subject` model supports both O-Level and A-Level subjects:

- `educationLevel`: "O_LEVEL", "A_LEVEL", or "BOTH"
- `isPrincipal`: Whether this is a principal subject (for A-Level)
- `gradingSystem`: Different grading systems for O-Level and A-Level

### Student Model

The `Student` model includes A-Level specific fields:

- `educationLevel`: "O_LEVEL" or "A_LEVEL"
- `form`: Form level (1-6)
- `subjectCombination`: Reference to the subject combination (for A-Level)

## API Endpoints

### A-Level Results Endpoints

- `GET /api/a-level-results/student/:studentId/:examId`: Get A-Level student report
- `GET /api/a-level-results/class/:classId/:examId`: Get A-Level class report
- `POST /api/a-level-results/enter-marks`: Enter A-Level marks
- `POST /api/a-level-results/batch`: Batch enter A-Level marks
- `GET /api/a-level-results/student/:studentId/:examId/pdf`: Generate A-Level student report PDF

### A-Level Comprehensive Report Endpoints

- `GET /api/a-level-comprehensive/student/:studentId/:examId`: Get comprehensive A-Level report
- `GET /api/a-level-comprehensive/student/:studentId/:examId/pdf`: Generate comprehensive A-Level report PDF

### Subject Combination Endpoints

- `GET /api/subject-combinations`: Get all subject combinations
- `GET /api/subject-combinations/:id`: Get a specific subject combination
- `POST /api/subject-combinations`: Create a new subject combination
- `PUT /api/subject-combinations/:id`: Update a subject combination
- `DELETE /api/subject-combinations/:id`: Delete a subject combination

## Frontend Components

### A-Level Result Components

- `ALevelResultReport`: Displays A-Level student reports
- `Form5ALevelResultReport`: Specialized report for Form 5 students
- `Form6ALevelResultReport`: Specialized report for Form 6 students
- `ALevelClassResultReport`: Displays A-Level class reports
- `ALevelComprehensiveReport`: Displays comprehensive A-Level reports

### A-Level Management Components

- `ALevelSubjectAssignment`: Assigns subject combinations to A-Level students
- `ALevelMarksEntry`: Enters marks for A-Level students
- `SubjectCombinationManagement`: Manages A-Level subject combinations

### Shared Components

- `SubjectCombinationDisplay`: Displays subject combinations
- `ALevelReportSummary`: Displays A-Level report summary
- `ALevelReportHeader`: Displays A-Level report header

## Utilities and Helpers

### Education Level Utilities

The `educationLevelUtils.js` file provides utilities for handling education level specific operations:

- `getEducationLevelFromForm`: Gets the education level from a form level
- `calculateGrade`: Calculates grade based on marks and education level
- `calculatePoints`: Calculates points based on grade and education level
- `calculateDivision`: Calculates division based on points and education level
- `getBestSubjects`: Gets the best N subjects based on points
- `separatePrincipalAndSubsidiarySubjects`: Separates subjects into principal and subsidiary
- `calculateBestThreePrincipalPoints`: Calculates best three principal subjects points

### Higher-Order Components

- `withEducationLevel`: Adds education level validation to a component
- `withErrorHandling`: Adds error handling to a component

### Hooks

- `useCachedData`: Custom hook for fetching data with caching support

## Error Handling

The system includes robust error handling for A-Level specific errors:

- Education level mismatch detection
- Automatic redirection to the correct component
- User-friendly error messages
- Recovery suggestions

Example:

```jsx
// Using the withErrorHandling HOC
const ALevelResultReportWithErrorHandling = withErrorHandling(
  ALevelResultReport,
  {
    componentName: 'ALevelResultReport',
    expectedEducationLevel: 'A_LEVEL'
  }
);

// Using the withEducationLevel HOC
const ALevelResultReportWithEducationLevel = withEducationLevel(
  ALevelResultReport,
  {
    educationLevel: 'A_LEVEL',
    redirectOnMismatch: true
  }
);
```

## Caching and Offline Support

The system includes robust caching and offline support:

- API responses are cached in localStorage
- Cached data is used when the API is unavailable
- Mock data is generated when no cached data is available
- Cache expiration and size management

Example:

```jsx
// Using the useCachedData hook
const { data, loading, error, isFromCache, isMockData, refetch } = useCachedData({
  fetchFn: () => api.get(`/api/a-level-results/student/${studentId}/${examId}`),
  resourceType: 'result',
  resourceId: `${studentId}_${examId}`,
  params: { educationLevel: 'A_LEVEL' },
  useMockOnError: true
});
```

## Best Practices

### Education Level Validation

Always validate the education level of data before rendering:

```jsx
// Using the validateEducationLevel utility
const { isValid, error } = validateEducationLevel(data, 'A_LEVEL');
if (!isValid) {
  // Handle error
}
```

### Subject Handling

Handle principal and subsidiary subjects separately:

```jsx
// Using the separatePrincipalAndSubsidiarySubjects utility
const { principal, subsidiary } = separatePrincipalAndSubsidiarySubjects(subjects);
```

### Division Calculation

Use the correct division calculation for A-Level:

```jsx
// Using the calculateDivision utility
const division = calculateDivision(bestThreePoints, 'A_LEVEL');
```

### Error Recovery

Provide clear recovery options for errors:

```jsx
// Using the getErrorRecoveryOptions utility
const recoveryOptions = getErrorRecoveryOptions(error);
if (recoveryOptions.canRedirect) {
  // Show redirect button
}
```
