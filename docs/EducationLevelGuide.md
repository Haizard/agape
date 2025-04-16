# Education Level Guide

This document explains how the system handles the different education levels (O-Level and A-Level) throughout the application.

## Overview

The system supports two education levels:

1. **O-Level (Form 1-4)**: The ordinary level of education for students in Forms 1 through 4.
2. **A-Level (Form 5-6)**: The advanced level of education for students in Forms 5 and 6.

Each education level has different requirements for subjects, combinations, and result reporting.

## Student Creation and Subject Assignment

### O-Level Students (Form 1-4)

- Education level is set to `O_LEVEL`
- Form level is typically 1-4
- Students are assigned:
  - Core subjects (mandatory)
  - Optional subjects (based on student preference or school rules)
- Core subjects are automatically assigned during student creation
- Optional subjects can be added later

### A-Level Students (Form 5-6)

- Education level is set to `A_LEVEL`
- Form level is typically 5-6
- Students are assigned:
  - A subject combination (e.g., PCM, HKL, EGM)
  - Subsidiary subjects (e.g., General Studies, Basic Math)
- Subject combinations define the principal subjects a student takes
- Each combination has its own set of principal and subsidiary subjects
- Students must have a combination assigned

## Result Report Structure

### O-Level Reports (Form 1-4)

- One result report per class (e.g., Form 1A, Form 2B)
- Reports include:
  - All students in the class
  - Marks for core and optional subjects
  - Calculations of totals, averages, divisions, and rankings
- Reports are based on the class structure

### A-Level Reports (Form 5-6)

- One general result report per form level (Form 5 or Form 6)
- Reports combine all students regardless of their combination
- Reports show:
  - Marks for all combination and subsidiary subjects
  - Blank entries for subjects a student is not enrolled in
  - Calculations based only on the student's enrolled subjects
- Reports are based on the form level and handle multiple combinations

## Teacher Access & Permissions

- Teachers can only see students enrolled in their subject(s)
- Teachers can only enter marks for subjects assigned to them
- Teachers can view marks and reports limited to their scope of responsibility
- Authorization checks are performed at multiple levels:
  - Subject level: Teachers can only access subjects they teach
  - Class level: Teachers can only access classes where they teach at least one subject
  - Report level: Teachers can only view reports for classes they teach

## Technical Implementation

### Database Models

- `Student` model has an `educationLevel` field with values `O_LEVEL` or `A_LEVEL`
- `Subject` model has an `educationLevel` field with values `O_LEVEL`, `A_LEVEL`, or `BOTH`
- `SubjectCombination` model defines combinations for A-Level students
- `Class` model has an `educationLevel` field to distinguish between O-Level and A-Level classes

### Authorization Middleware

- `authorizeTeacherForSubject`: Ensures teachers can only access subjects they teach
- `authorizeTeacherForClass`: Ensures teachers can only access classes where they teach
- `authorizeTeacherForReports`: Ensures teachers can only view reports for their classes

### Validation Middleware

- `validateStudentData`: Validates student data based on education level
- `validateSubjectAssignment`: Ensures subjects are appropriate for the student's education level

## Best Practices

1. Always check the education level before processing student data
2. Use the appropriate report template based on education level
3. Ensure A-Level students have a combination assigned
4. Validate that subjects are appropriate for the student's education level
5. Use the authorization middleware to enforce teacher permissions
6. Handle blank entries for subjects a student is not enrolled in
7. Calculate metrics based only on the student's enrolled subjects
