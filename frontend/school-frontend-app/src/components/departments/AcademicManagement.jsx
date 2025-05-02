import React from 'react';
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import DepartmentLayout from '../layout/DepartmentLayout';
import ClassManagement from '../academic/ClassManagement';
import SubjectManagement from '../academic/SubjectManagement';
import EducationLevelManagement from '../academic/EducationLevelManagement';
import SubjectCombinationManagement from '../academic/SubjectCombinationManagement';
import SubjectAssignmentPage from '../academic/SubjectAssignmentPage';
import CompulsorySubjectAssignment from '../academic/CompulsorySubjectAssignment';
import StudentSubjectSelection from '../academic/StudentSubjectSelection';
import ALevelSubjectAssignment from '../academic/ALevelSubjectAssignment';
import CoreSubjectManagement from '../admin/CoreSubjectManagement';
import OptionalSubjectManagement from '../admin/OptionalSubjectManagement';
import FixedSubjectClassAssignment from '../academic/FixedSubjectClassAssignment';
import NewAcademicYearManagement from '../academic/NewAcademicYearManagement';

import {
  School as SchoolIcon,
  Class as ClassIcon,
  Subject as SubjectIcon,
  Category as CategoryIcon,
  Assignment as AssignmentIcon,
  Book as BookIcon,
  MenuBook as MenuBookIcon,
  LibraryBooks as LibraryBooksIcon,
  AssignmentInd as AssignmentIndIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';

const AcademicManagement = () => {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop();

  const menuItems = [
    {
      id: 'academic-years',
      label: 'Academic Years',
      icon: <CalendarIcon />,
      path: 'academic-years',
      component: <NewAcademicYearManagement />
    },
    {
      id: 'education-levels',
      label: 'Education Levels',
      icon: <SchoolIcon />,
      path: 'education-levels',
      component: <EducationLevelManagement />
    },
    {
      id: 'subject-combinations',
      label: 'Subject Combinations',
      icon: <CategoryIcon />,
      path: 'subject-combinations',
      component: <SubjectCombinationManagement />
    },
    {
      id: 'classes',
      label: 'Classes',
      icon: <ClassIcon />,
      path: 'classes',
      component: <ClassManagement />
    },
    {
      id: 'subjects',
      label: 'Subjects',
      icon: <SubjectIcon />,
      path: 'subjects',
      component: <SubjectManagement />
    },
    {
      id: 'core-subjects',
      label: 'Core Subjects',
      icon: <BookIcon />,
      path: 'core-subjects',
      component: <CoreSubjectManagement />
    },
    {
      id: 'optional-subjects',
      label: 'Optional Subjects',
      icon: <MenuBookIcon />,
      path: 'optional-subjects',
      component: <OptionalSubjectManagement />
    },
    {
      id: 'subject-class-assignment',
      label: 'Subject-Class Assignment',
      icon: <LibraryBooksIcon />,
      path: 'subject-class-assignment',
      component: <FixedSubjectClassAssignment />
    },
    {
      id: 'subject-teacher-assignment',
      label: 'Subject-Teacher Assignment',
      icon: <AssignmentIndIcon />,
      path: 'subject-teacher-assignment',
      component: <SubjectAssignmentPage />
    },
    {
      id: 'compulsory-subject-assignment',
      label: 'Compulsory Subjects',
      icon: <MenuBookIcon />,
      path: 'compulsory-subject-assignment',
      component: <CompulsorySubjectAssignment />
    },
    {
      id: 'student-subject-selection',
      label: 'Student Subject Selection',
      icon: <AssignmentIcon />,
      path: 'student-subject-selection',
      component: <StudentSubjectSelection />
    },
    {
      id: 'a-level-subject-assignment',
      label: 'A-Level Subject Assignment',
      icon: <AssignmentIcon />,
      path: 'a-level-subject-assignment',
      component: <ALevelSubjectAssignment />
    }
  ];

  return (
    <DepartmentLayout
      title="Academic Management"
      menuItems={menuItems}
      defaultSelected="classes"
    >
      {/* Add Routes to handle nested routes */}
      <Routes>
        <Route path="academic-years" element={<NewAcademicYearManagement />} />
        <Route path="education-levels" element={<EducationLevelManagement />} />
        <Route path="subject-combinations" element={<SubjectCombinationManagement />} />
        <Route path="classes" element={<ClassManagement />} />
        <Route path="subjects" element={<SubjectManagement />} />
        <Route path="core-subjects" element={<CoreSubjectManagement />} />
        <Route path="optional-subjects" element={<OptionalSubjectManagement />} />
        <Route path="subject-class-assignment" element={<FixedSubjectClassAssignment />} />
        <Route path="subject-teacher-assignment" element={<SubjectAssignmentPage />} />
        <Route path="compulsory-subject-assignment" element={<CompulsorySubjectAssignment />} />
        <Route path="student-subject-selection" element={<StudentSubjectSelection />} />
        <Route path="a-level-subject-assignment" element={<ALevelSubjectAssignment />} />
        {/* Default route - redirect to classes if no path specified */}
        <Route index element={<Navigate to="classes" replace />} />
        {/* Catch-all route for any unmatched paths */}
        <Route path="*" element={<Navigate to="classes" replace />} />
      </Routes>
    </DepartmentLayout>
  );
};

export default AcademicManagement;
