# Unified Teacher Assignment Service

## Overview

The Unified Teacher Assignment Service is a robust solution for handling teacher-subject assignments in the school management system. It provides a centralized way to manage teacher assignments that preserves existing assignments and works correctly for both admin users and teachers.

## Key Features

1. **Role-Based Assignment Handling**: Automatically detects the user's role and uses the appropriate endpoint for teacher assignments.

2. **Preservation of Existing Assignments**: Always fetches the current class data to ensure all existing subject-teacher assignments are preserved.

3. **Admin User Detection**: Detects and warns when an admin user is being assigned as a teacher.

4. **Consistent Teacher ID Handling**: Ensures teacher IDs are consistently handled as either valid strings or null.

5. **Robust User Role Detection**: Uses multiple sources to reliably determine the user's role.

## Implementation Details

### 1. Unified Teacher Assignment Service

The service is implemented in `frontend/school-frontend-app/src/services/unifiedTeacherAssignmentService.js` and provides the following functions:

- `assignTeachersToSubjects(classId, subjectTeachers, forceAdminEndpoint)`: Assigns teachers to subjects in a class, preserving existing assignments.
- `getCurrentUserRole()`: Gets the current user's role from the JWT token.
- `getCurrentTeacherId()`: Gets the current teacher's ID.
- `isTeacherAdmin(teacherId)`: Checks if a teacher is an admin user.

### 2. Enhanced User Role Detection

The `getUserRole()` function in `frontend/school-frontend-app/src/utils/authUtils.js` provides a robust way to determine the user's role:

1. First tries to get the role from the JWT token (most reliable)
2. Then tries to get the role from the current user in localStorage
3. Finally tries to get the role from userRole in localStorage (legacy)

### 3. Integration with Components

The service is integrated with the following components:

- `SubjectAssignmentPage.js`: Uses the unified service for teacher assignments in the main subject assignment page.
- `TeacherSubjectAssignmentDialog.js`: Uses the unified service for teacher assignments in the dialog.

## Usage

To use the unified teacher assignment service in a component:

```javascript
import unifiedTeacherAssignmentService from '../../services/unifiedTeacherAssignmentService';
import { getUserRole } from '../../utils/authUtils';

// Get the current user's role
const userRole = getUserRole();

// Assign teachers to subjects
const result = await unifiedTeacherAssignmentService.assignTeachersToSubjects(
  classId,
  subjectTeachers,
  userRole === 'admin' // Force admin endpoint if user is admin
);
```

## Benefits

1. **Reliability**: The service ensures that teacher assignments are correctly tracked and preserved throughout the application.

2. **Consistency**: All components use the same logic for teacher assignments, reducing the risk of bugs.

3. **Maintainability**: The centralized service makes it easier to update the teacher assignment logic in the future.

4. **Security**: The service includes checks to prevent admin users from being accidentally assigned as teachers.

## Future Enhancements

1. **Transaction Support**: Add support for transactions to ensure all assignments are updated atomically.

2. **Conflict Resolution**: Add logic to detect and resolve conflicts when multiple users are assigning teachers to the same subjects.

3. **Audit Logging**: Add audit logging to track who made each assignment change and when.

4. **Performance Optimization**: Add caching to improve performance for frequently accessed assignments.
