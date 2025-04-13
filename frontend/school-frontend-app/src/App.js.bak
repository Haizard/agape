// Third-party imports first
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Local components next
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoginForm from './components/LoginForm';
import ResultManagement from './components/ResultManagement';
import DirectResultsPage from './components/admin/DirectResultsPage';
import ExamList from './components/ExamList';
import ExamCreation from './components/admin/ExamCreation';
import RegisterForm from './components/RegisterForm';
import AdminRegistration from './components/AdminRegistration';
import TestConnection from './components/TestConnection';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import AcademicsPage from './pages/AcademicsPage';
import NewsPage from './pages/NewsPage';
import ContactPage from './pages/ContactPage';
import CampusLifePage from './pages/CampusLifePage';
import PublicNavigation from './components/PublicNavigation';
import Footer from './components/Footer';
import TeacherPanel from './components/TeacherPanel';
import StudentPanel from './components/StudentPanel';
import ParentPanel from './components/ParentPanel';
import StudentManagement from './components/StudentManagement';
import AdminDashboard from './components/AdminDashboard';
import Navigation from './components/Navigation';
import ClassManagement from './components/academic/ClassManagement';
import SubjectManagement from './components/academic/SubjectManagement';
import EducationLevelManagement from './components/academic/EducationLevelManagement';
import SubjectCombinationManagement from './components/academic/SubjectCombinationManagement';
import SubjectAssignmentPage from './components/academic/SubjectAssignmentPage';
import CompulsorySubjectAssignment from './components/academic/CompulsorySubjectAssignment';
import TeacherAssignment from './components/academic/TeacherAssignment';
import StudentAssignment from './components/academic/StudentAssignmentFixed';
import ParentContactManagement from './components/admin/ParentContactManagement';
import SMSSettings from './components/admin/SMSSettings';
import UserProfile from './components/UserProfile';
import ExamTypeManagement from './components/ExamTypeManagement';
import FixedExamTypeManagement from './components/FixedExamTypeManagement';
import TeacherManagement from './components/TeacherManagement.jsx';
import AcademicYearManagement from './components/academic/AcademicYearManagement';
import NewAcademicYearManagement from './components/academic/NewAcademicYearManagement';
import DirectStudentRegistration from './components/admin/DirectStudentRegistration';
import DebugUserRole from './components/admin/DebugUserRole';
import SubjectClassAssignment from './components/academic/SubjectClassAssignment';
import SubjectClassAssignmentNew from './components/academic/SubjectClassAssignmentNew';
import FixedSubjectClassAssignment from './components/academic/FixedSubjectClassAssignment';
import StudentSubjectSelection from './components/academic/StudentSubjectSelection';
import ALevelSubjectAssignment from './components/academic/ALevelSubjectAssignment';
import CoreSubjectManagement from './components/admin/CoreSubjectManagement';
import OptionalSubjectManagement from './components/admin/OptionalSubjectManagement';

// Department Layout Components
import AcademicManagement from './components/departments/AcademicManagement';
import UserManagement from './components/departments/UserManagement';
import AssessmentManagement from './components/departments/AssessmentManagement';
import CommunicationManagement from './components/departments/CommunicationManagement';
import LinkUserToTeacher from './components/admin/LinkUserToTeacher';
import AdminUserManagement from './components/admin/AdminUserManagement';

// Finance components
import FinanceDashboard from './components/finance/FinanceDashboard';
import QuickbooksIntegration from './components/finance/QuickbooksIntegration';
import FeeStructures from './components/finance/FeeStructures';
import FeeTemplates from './components/finance/FeeTemplatesWrapper';
import BulkFeeStructures from './components/finance/BulkFeeStructures';
import FeeSchedule from './components/finance/FeeSchedule';
import ImportExport from './components/finance/ImportExport';
import StudentFees from './components/finance/StudentFeesNew';
import Payments from './components/finance/Payments';
import Reports from './components/finance/Reports';
import Settings from './components/finance/Settings';
import FinanceLayout from './components/finance/FinanceLayout';

// Auth context
import { AuthProvider } from './contexts/AuthContext';
import UnifiedUserCreation from './components/admin/UnifiedUserCreation';
// Import only the new report components
import ClassTabularReport from './components/results/ClassTabularReport';
import SingleStudentReport from './components/results/SingleStudentReport';
import BulkReportDownloader from './components/results/BulkReportDownloader';
import ALevelMarksEntry from './components/results/ALevelMarksEntry';
import OLevelMarksEntry from './components/results/OLevelMarksEntry';
import UnifiedMarksEntry from './components/results/UnifiedMarksEntry';
import CharacterAssessmentEntry from './components/results/CharacterAssessmentEntry';
import ResultManagementWorkflow from './components/workflows/ResultManagementWorkflow';
import UnifiedAcademicManagement from './components/academic/UnifiedAcademicManagement';
import ResultReportSelector from './components/results/ResultReportSelector';
import RoleFixButton from './components/common/RoleFixButton';
import { checkAndFixUserRole } from './utils/roleFixUtil';
// StudentPanel is already imported on line 25

// Constants
const drawerWidth = 280;

// Update the document title
document.title = 'AGAPE LUTHERAN JUNIOR SEMINARY';

// Component definition
function App() {
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // Check and fix user role on app load
  useEffect(() => {
    if (isAuthenticated && user) {
      const fixedUser = checkAndFixUserRole();
      console.log('Checked user role:', fixedUser);
    }
  }, [isAuthenticated, user]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AuthProvider>
        <BrowserRouter>
          <div className="App">
            {isAuthenticated ? (
              <>
                <Box sx={{ display: 'flex' }}>
                  <Navigation />
                  <Box
                    component="main"
                    sx={{
                      flexGrow: 1,
                      p: 3,
                      width: { sm: `calc(100% - ${drawerWidth}px)` },
                      ml: { sm: `${drawerWidth}px` },
                      mt: '64px',
                    }}
                >
                  <Routes>
                    {/* Admin Routes */}
                    <Route path="admin/*" element={
                      <ProtectedRoute allowedRole={['admin', 'ADMIN', 'Admin']}>
                        <Routes>
                          <Route index element={<AdminDashboard />} />
                          <Route path="assessment-management/*" element={<AssessmentManagement />} />
                          <Route path="academic-management/*" element={<AcademicManagement />} />
                          <Route path="communication-management/*" element={<CommunicationManagement />} />

                          {/* Keep individual routes for direct access */}
                          <Route path="results" element={<DirectResultsPage />} />
                          <Route path="result-reports" element={<ResultReportSelector />} />

                          {/* Keep individual routes for direct access */}
                          <Route path="education-levels" element={<EducationLevelManagement />} />
                          <Route path="subject-combinations" element={<SubjectCombinationManagement />} />
                          <Route path="classes" element={<ClassManagement />} />
                          <Route path="subjects" element={<SubjectManagement />} />
                          <Route path="user-management/*" element={<UserManagement />} />

                          {/* Keep individual routes for direct access */}
                          <Route path="teachers" element={<TeacherManagement />} />
                          <Route path="link-teacher-profiles" element={<LinkUserToTeacher />} />
                          <Route path="users" element={<AdminUserManagement />} />
                          <Route path="create-user" element={<UnifiedUserCreation />} />
                          <Route path="direct-student-register" element={<DirectStudentRegistration />} />
                          <Route path="debug-user-role" element={<DebugUserRole />} />
                          <Route path="teacher-assignments" element={<TeacherAssignment />} />
                          <Route path="student-assignments" element={<StudentAssignment />} />
                          <Route path="students" element={<StudentManagement />} />
                          <Route path="exams" element={<ExamList />} />
                          <Route path="exam-creation" element={<ExamCreation />} />
                          <Route path="news" element={<NewsPage />} />
                          <Route path="exam-types" element={<FixedExamTypeManagement />} />
                          <Route path="academic-years" element={<NewAcademicYearManagement />} />
                          <Route path="subject-class-assignment" element={<FixedSubjectClassAssignment />} />
                          <Route path="subject-teacher-assignment" element={<SubjectAssignmentPage />} />
                          <Route path="compulsory-subject-assignment" element={<CompulsorySubjectAssignment />} />
                          <Route path="student-subject-selection" element={<StudentSubjectSelection />} />
                          <Route path="a-level-subject-assignment" element={<ALevelSubjectAssignment />} />
                          <Route path="core-subjects" element={<CoreSubjectManagement />} />
                          <Route path="optional-subjects" element={<OptionalSubjectManagement />} />
                          <Route path="parent-contacts" element={<ParentContactManagement />} />
                          <Route path="sms-settings" element={<SMSSettings />} />
                        </Routes>
                      </ProtectedRoute>
                    } />
                    {/* Teacher Routes */}
                    <Route path="/teacher/*" element={
                      <ProtectedRoute allowedRole="teacher">
                        <TeacherPanel />
                      </ProtectedRoute>
                    } />
                    {/* Special teacher routes that are not part of TeacherPanel */}
                    {/* Legacy teacher report route removed */}

                    {/* Student Routes */}
                    <Route path="/student/*" element={
                      <ProtectedRoute allowedRole="student">
                        <StudentPanel />
                      </ProtectedRoute>
                    } />

                    {/* Parent Routes */}
                    <Route path="/parent/*" element={
                      <ProtectedRoute allowedRole="parent">
                        <Routes>
                          <Route index element={<ParentPanel />} />
                          <Route path="results" element={<ResultManagement />} />
                          <Route path="academics" element={<AcademicsPage />} />
                          <Route path="news" element={<NewsPage />} />
                        </Routes>
                      </ProtectedRoute>
                    } />

                    {/* Result Report Routes */}
                    <Route path="/results" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <ResultReportSelector />
                      </ProtectedRoute>
                    } />
                    {/* Only keep the new report routes */}
                    <Route path="/results/class-report/:classId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ClassTabularReport />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/student-report/:studentId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <SingleStudentReport />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/bulk-download" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <BulkReportDownloader />
                      </ProtectedRoute>
                    } />
                    {/* Legacy Mark Entry Routes */}
                    <Route path="/results/a-level/enter-marks" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ALevelMarksEntry />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/o-level/enter-marks" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <OLevelMarksEntry />
                      </ProtectedRoute>
                    } />

                    {/* Unified Mark Entry Route */}
                    <Route path="/results/enter-marks" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <UnifiedMarksEntry />
                      </ProtectedRoute>
                    } />

                    {/* Workflow Routes */}
                    <Route path="/workflows/result-management" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ResultManagementWorkflow />
                      </ProtectedRoute>
                    } />

                    {/* Unified Academic Management */}
                    <Route path="/academic/unified" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <UnifiedAcademicManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/character-assessment" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <CharacterAssessmentEntry />
                      </ProtectedRoute>
                    } />

                    {/* Legacy routes removed */}

                    {/* Finance Routes */}
                    <Route path="/finance" element={
                      <ProtectedRoute allowedRoles={['admin', 'finance']}>
                        <FinanceLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<FinanceDashboard />} />
                      <Route path="quickbooks" element={<QuickbooksIntegration />} />
                      <Route path="fee-structures" element={<FeeStructures />} />
                      <Route path="fee-templates" element={<FeeTemplates />} />
                      <Route path="bulk-fee-structures" element={<BulkFeeStructures />} />
                      <Route path="fee-schedules" element={<FeeSchedule />} />
                      <Route path="student-fees" element={<StudentFees />} />
                      <Route path="payments" element={<Payments />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="import-export" element={<ImportExport />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>

                    {/* Common Routes for All Authenticated Users */}
                    <Route path="/profile" element={<UserProfile />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/fix-role" element={<Box sx={{ p: 3 }}>
                      <Typography variant="h4" gutterBottom>Fix Admin Role</Typography>
                      <Typography variant="body1" paragraph>
                        If you're experiencing authorization issues where you're logged in as admin but getting "Unauthorized" errors,
                        use the button below to fix your role.
                      </Typography>
                      <RoleFixButton />
                    </Box>} />

                    <Route path="*" element={
                      <Navigate to={`/${user?.role || ''}`} replace />
                    } />
                  </Routes>
                </Box>
              </Box>
            </>
          ) : (
            // Public routes remain the same
            <>
              <PublicNavigation />
              <Box sx={{
                minHeight: '100vh',
                paddingTop: '80px',
                display: 'flex',
                flexDirection: 'column',
                '@media (max-width: 600px)': {
                  paddingTop: '70px',
                }
              }}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/academics" element={<AcademicsPage />} />
                  <Route path="/campus-life" element={<CampusLifePage />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/register" element={<RegisterForm />} />
                  <Route path="/admin-registration" element={<AdminRegistration />} />
                  <Route path="/test-connection" element={<TestConnection />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Footer />
              </Box>
            </>
          )}
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LocalizationProvider>
  );
}

export default App;

