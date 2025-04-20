import React from 'react';
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
  const menuItems = [
    {
      id: 'academic-years',
      label: 'Academic Years',
      icon: <CalendarIcon />,
      component: <NewAcademicYearManagement />
    },
    {
      id: 'education-levels',
      label: 'Education Levels',
      icon: <SchoolIcon />,
      component: <EducationLevelManagement />
    },
    {
      id: 'subject-combinations',
      label: 'Subject Combinations',
      icon: <CategoryIcon />,
      component: <SubjectCombinationManagement />
    },
    {
      id: 'classes',
      label: 'Classes',
      icon: <ClassIcon />,
      component: <ClassManagement />
    },
    {
      id: 'subjects',
      label: 'Subjects',
      icon: <SubjectIcon />,
      component: <SubjectManagement />
    },
    {
      id: 'core-subjects',
      label: 'Core Subjects',
      icon: <BookIcon />,
      component: <CoreSubjectManagement />
    },
    {
      id: 'optional-subjects',
      label: 'Optional Subjects',
      icon: <MenuBookIcon />,
      component: <OptionalSubjectManagement />
    },
    {
      id: 'subject-class-assignment',
      label: 'Subject-Class Assignment',
      icon: <LibraryBooksIcon />,
      component: <FixedSubjectClassAssignment />
    },
    {
      id: 'subject-teacher-assignment',
      label: 'Subject-Teacher Assignment',
      icon: <AssignmentIndIcon />,
      component: <SubjectAssignmentPage />
    },
    {
      id: 'compulsory-subject-assignment',
      label: 'Compulsory Subjects',
      icon: <MenuBookIcon />,
      component: <CompulsorySubjectAssignment />
    },
    {
      id: 'student-subject-selection',
      label: 'Student Subject Selection',
      icon: <AssignmentIcon />,
      component: <StudentSubjectSelection />
    },
    {
      id: 'a-level-subject-assignment',
      label: 'A-Level Subject Assignment',
      icon: <AssignmentIcon />,
      component: <ALevelSubjectAssignment />
    }
  ];

  return (
    <DepartmentLayout
      title="Academic Management"
      menuItems={menuItems}
      defaultSelected="classes"
    />
  );
};

export default AcademicManagement;
