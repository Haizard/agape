import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DepartmentLayout from '../layout/DepartmentLayout';
import TeacherManagement from '../TeacherManagement';
import LinkUserToTeacher from '../admin/LinkUserToTeacher';
import AdminUserManagement from '../admin/AdminUserManagement';
import UnifiedUserCreation from '../admin/UnifiedUserCreation';
import DirectStudentRegistration from '../admin/DirectStudentRegistration';
import DebugUserRole from '../admin/DebugUserRole';

import {
  People as PeopleIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Link as LinkIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';

const UserManagement = () => {
  const menuItems = [
    {
      id: 'teachers',
      label: 'Teachers',
      icon: <PeopleIcon />,
      component: <TeacherManagement />,
      path: 'teachers'
    },
    {
      id: 'link-teacher-profiles',
      label: 'Link Teacher Profiles',
      icon: <LinkIcon />,
      component: <LinkUserToTeacher />,
      path: 'link-teacher-profiles'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <SupervisorAccountIcon />,
      component: <AdminUserManagement />,
      path: 'users'
    },
    {
      id: 'create-user',
      label: 'Create User',
      icon: <PersonAddIcon />,
      component: <UnifiedUserCreation />,
      path: 'create-user'
    },
    {
      id: 'direct-student-register',
      label: 'Student Registration',
      icon: <PersonIcon />,
      component: <DirectStudentRegistration />,
      path: 'direct-student-register'
    },
    {
      id: 'debug-user-role',
      label: 'Debug User Role',
      icon: <BugReportIcon />,
      component: <DebugUserRole />,
      path: 'debug-user-role'
    }
  ];

  return (
    <DepartmentLayout
      title="User Management"
      menuItems={menuItems}
      defaultSelected="teachers"
    >
      <Routes>
        <Route path="teachers" element={<TeacherManagement />} />
        <Route path="link-teacher-profiles" element={<LinkUserToTeacher />} />
        <Route path="users" element={<AdminUserManagement />} />
        <Route path="create-user" element={<UnifiedUserCreation />} />
        <Route path="direct-student-register" element={<DirectStudentRegistration />} />
        <Route path="debug-user-role" element={<DebugUserRole />} />
      </Routes>
    </DepartmentLayout>
  );
};

export default UserManagement;
