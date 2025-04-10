import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import components
import Dashboard from '../components/dashboard/Dashboard';
import UnifiedAcademicManagement from '../components/academic/UnifiedAcademicManagement';
import MarksEntry from '../components/marks/MarksEntry';
import OfflineMarksEntry from '../components/marks/OfflineMarksEntry';
import StudentReports from '../components/reports/StudentReports';
import BatchReportDownload from '../components/reports/BatchReportDownload';
import Settings from '../components/settings/Settings';
import Profile from '../components/profile/Profile';
import NotFound from '../components/common/NotFound';

/**
 * AppRoutes Component
 * 
 * Defines all application routes
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />
      
      {/* Academic Management */}
      <Route path="/academic/unified" element={<UnifiedAcademicManagement />} />
      
      {/* Marks Management */}
      <Route path="/marks/entry" element={<MarksEntry />} />
      <Route path="/marks/offline-entry" element={<OfflineMarksEntry />} />
      
      {/* Reports */}
      <Route path="/reports/student" element={<StudentReports />} />
      <Route path="/reports/batch-download" element={<BatchReportDownload />} />
      
      {/* Settings */}
      <Route path="/settings" element={<Settings />} />
      
      {/* Profile */}
      <Route path="/profile" element={<Profile />} />
      
      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
