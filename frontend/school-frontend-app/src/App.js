// Third-party imports first
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Import API URL test utility
import { runApiUrlTests } from './utils/testApiUrl';

// Context providers
import { ResultProvider } from './contexts/ResultContext';

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
import BulkAssessmentEntry from './components/assessment/BulkAssessmentEntry';
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
import TeacherSubjectAssignment from './components/admin/TeacherSubjectAssignment';
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
import StudentClassDiagnostic from './components/diagnostics/StudentClassDiagnostic';
import SubjectClassAssignment from './components/academic/SubjectClassAssignment';
import SubjectClassAssignmentNew from './components/academic/SubjectClassAssignmentNew';
import FixedSubjectClassAssignment from './components/academic/FixedSubjectClassAssignment';
import StudentSubjectSelection from './components/academic/StudentSubjectSelection';
import ALevelSubjectAssignment from './components/academic/ALevelSubjectAssignment';
import CoreSubjectManagement from './components/admin/CoreSubjectManagement';
import OptionalSubjectManagement from './components/admin/OptionalSubjectManagement';
import FixAssignmentsPage from './pages/FixAssignmentsPage';

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
import { AssessmentProvider } from './contexts/AssessmentContext';
import UnifiedUserCreation from './components/admin/UnifiedUserCreation';
// Import only the new report components
import ClassTabularReport from './components/results/ClassTabularReport';
import SingleStudentReport from './components/results/SingleStudentReport';
import BulkReportDownloader from './components/results/BulkReportDownloader';
import PrintableClassReport from './components/results/PrintableClassReport';
import ALevelMarksEntry from './components/results/ALevelMarksEntry';
import OLevelMarksEntry from './components/results/OLevelMarksEntry';
import LegacyReportRedirect from './components/results/aLevel/LegacyReportRedirect';
import ALevelFormStudentReport from './components/results/ALevelFormStudentReport';
import ALevelStudentReportRouter from './components/results/aLevel/ALevelStudentReportRouter';
import ALevelClassReportRouter from './components/results/aLevel/ALevelClassReportRouter';
import OLevelClassReportRouter from './components/results/oLevel/OLevelClassReportRouter';
import EnhancedStudentResultReport from './components/results/aLevel/EnhancedStudentResultReport';
import EnhancedOLevelStudentResultReport from './components/results/oLevel/EnhancedStudentResultReport';
import OLevelClassReport from './components/reports/OLevelClassReport';
import OLevelResultReport from './components/reports/OLevelResultReport';
import DemoDataNavigator from './components/demo/DemoDataNavigator';
import UnifiedMarksEntry from './components/results/UnifiedMarksEntry';
import CharacterAssessmentEntry from './components/results/CharacterAssessmentEntry';
import ResultManagementWorkflow from './components/workflows/ResultManagementWorkflow';
import UnifiedAcademicManagement from './components/academic/UnifiedAcademicManagement';
import ResultReportSelector from './components/results/ResultReportSelector';
import EnhancedOLevelClassReportContainer from './components/results/EnhancedOLevelClassReportContainer';
import ALevelSampleReportContainer from './components/results/ALevelSampleReportContainer';
import PublicALevelReportContainer from './components/results/PublicALevelReportContainer';
import MarksHistoryViewer from './components/marks/MarksHistoryViewer';
import MarksHistoryDashboard from './components/marks/MarksHistoryDashboard';
import MarksEntryDashboard from './components/results/MarksEntryDashboard';
import ALevelBulkMarksEntry from './components/results/ALevelBulkMarksEntry';
import SimplifiedALevelBulkMarksEntry from './components/results/SimplifiedALevelBulkMarksEntry';
import LegacyALevelBulkMarksEntryPage from './pages/LegacyALevelBulkMarksEntryPage';
import OLevelBulkMarksEntry from './components/results/OLevelBulkMarksEntry';
import EnhancedBulkMarksEntry from './components/marks/EnhancedBulkMarksEntry';
import UnifiedBulkMarksEntry from './components/marks/UnifiedBulkMarksEntry';
import NewALevelMarksEntry from './components/results/NewALevelMarksEntry';
import NewALevelBulkMarksEntry from './components/results/NewALevelBulkMarksEntry';
import NewALevelBulkMarksEntryV2 from './components/results/NewALevelBulkMarksEntryV2';
import ALevelComprehensiveReportSelector from './components/results/ALevelComprehensiveReportSelector';
import ALevelComprehensiveReportRouter from './components/results/ALevelComprehensiveReportRouter';
import ALevelClassReportSelector from './components/results/aLevel/ALevelClassReportSelector';
import OLevelClassReportSelector from './components/results/oLevel/OLevelClassReportSelector';
import ALevelClassReportsPage from './components/results/aLevel/ALevelClassReportsPage';
import OLevelClassReportsPage from './components/results/oLevel/OLevelClassReportsPage';
import EnterSampleMarks from './components/results/EnterSampleMarks';
import DirectMarksEntry from './components/results/DirectMarksEntry';
import RoleFixButton from './components/common/RoleFixButton';
import { checkAndFixUserRole } from './utils/roleFixUtil';
import AuthDebugPage from './components/auth/AuthDebugPage';
import TokenInfoDisplay from './components/common/TokenInfoDisplay';
import TokenRefreshButton from './components/common/TokenRefreshButton';
import PrismaTest from './components/PrismaTest';
import PrismaStudentResults from './components/results/PrismaStudentResults';
import PrismaClassResults from './components/results/PrismaClassResults';
import PrismaResultsDemo from './components/results/PrismaResultsDemo';
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

  // Test API URL configuration on app load
  useEffect(() => {
    console.log('Testing API URL configuration...');
    const testResults = runApiUrlTests();
    console.log('API URL test results:', testResults);
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AuthProvider>
        <AssessmentProvider>
          <ResultProvider>
          <div className="App">
            <Routes>
              {/* Public Routes - No Authentication Required */}
              <Route path="/public">
                <Route path="a-level-report/:classId/:examId" element={<PublicALevelReportContainer />} />
                <Route path="reports" element={<ResultReportSelector />} />
                <Route path="printable-report/:classId/:examId" element={<PrintableClassReport />} />
              </Route>
            </Routes>

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
                          <Route path="enhanced-o-level-report/:classId/:examId" element={<EnhancedOLevelClassReportContainer />} />
                          <Route path="enhanced-a-level-report/:classId/:examId" element={<LegacyReportRedirect type="class" />} />
                          <Route path="simple-a-level-report/:classId/:examId" element={<LegacyReportRedirect type="class" />} />
                          <Route path="a-level-sample-report" element={<ALevelSampleReportContainer />} />
                          <Route path="a-level-class-reports" element={
                            <Box sx={{ p: 3 }}>
                              <Typography variant="h4" gutterBottom>A-Level Class Reports</Typography>
                              <Typography variant="body1" paragraph>
                                Select a class and exam to view the A-Level Class Report.
                              </Typography>
                              <ALevelClassReportSelector />
                            </Box>
                          } />
                          {/* O-Level Class Reports are now only accessible through Assessment Management */}
                          {/* Routes for A-Level class reports with different path patterns */}
                          <Route path="a-level-class-reports/results/a-level/class/:classId/:examId" element={<ALevelClassReportRouter />} />
                          <Route path="a-level-class-reports/results/a-level/class/:classId/:examId/form/:formLevel" element={<ALevelClassReportRouter />} />
                          <Route path="results/a-level/class/:classId/:examId" element={<ALevelClassReportRouter />} />
                          <Route path="results/a-level/class/:classId/:examId/form/:formLevel" element={<ALevelClassReportRouter />} />
                          <Route path="assessment-management/a-level-class-reports" element={
                            <Navigate to="/admin/a-level-class-reports" replace />
                          } />
                          <Route path="assessment-management/results/a-level-class-reports" element={
                            <Navigate to="/admin/a-level-class-reports" replace />
                          } />
                          <Route path="a-level-class-reports/results/a-level-comprehensive-selector" element={
                            <Navigate to="/results/a-level-comprehensive-selector" replace />
                          } />

                          {/* Add a catch-all route for A-Level class reports with query parameters */}
                          <Route path="a-level-class-reports/*" element={
                            <Navigate to="/admin/a-level-class-reports" replace />
                          } />

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
                          <Route path="student-class-diagnostic" element={<StudentClassDiagnostic />} />
                          <Route path="teacher-assignments" element={<TeacherAssignment />} />
                          <Route path="teacher-subject-assignment" element={<TeacherSubjectAssignment />} />
                          <Route path="student-assignments" element={<StudentAssignment />} />
                          <Route path="students" element={<StudentManagement />} />
                          <Route path="exams" element={<ExamList />} />
                          <Route path="exam-creation" element={<ExamCreation />} />
                          <Route path="news" element={<NewsPage />} />
                          <Route path="exam-types" element={<FixedExamTypeManagement />} />
                          {/* Removed duplicate academic-years route */}
                          <Route path="subject-class-assignment" element={<FixedSubjectClassAssignment />} />
                          <Route path="subject-teacher-assignment" element={<SubjectAssignmentPage />} />
                          <Route path="fix-assignments" element={<FixAssignmentsPage />} />
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
                    <Route path="/results/result-reports" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ResultReportSelector />
                      </ProtectedRoute>
                    } />
                    {/* Only keep the new report routes */}
                    <Route path="/results/class-report/:classId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ClassTabularReport />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/printable-report/:classId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'guest']}>
                        <PrintableClassReport />
                      </ProtectedRoute>
                    } />
                    {/* O-Level Student Report Route */}
                    <Route path="/results/o-level/student/:studentId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <EnhancedOLevelStudentResultReport />
                      </ProtectedRoute>
                    } />
                    {/* Legacy O-Level Student Report Route */}
                    <Route path="/results/o-level/student-legacy/:studentId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <SingleStudentReport educationLevel="O_LEVEL" />
                      </ProtectedRoute>
                    } />
                    {/* A-Level Student Report Route */}
                    <Route path="/results/a-level/student/:studentId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <EnhancedStudentResultReport />
                      </ProtectedRoute>
                    } />
                    {/* A-Level Clean Student Report Route */}
                    <Route path="/results/a-level/student-clean/:studentId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <EnhancedStudentResultReport />
                      </ProtectedRoute>
                    } />
                    {/* Legacy A-Level Student Report Route */}
                    <Route path="/results/a-level/student-legacy/:studentId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <ALevelStudentReportRouter />
                      </ProtectedRoute>
                    } />
                    {/* A-Level Class Report Routes */}
                    <Route path="results/a-level/class/:classId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ALevelClassReportRouter />
                      </ProtectedRoute>
                    } />
                    <Route path="results/a-level/class/:classId/:examId/form/:formLevel" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ALevelClassReportRouter />
                      </ProtectedRoute>
                    } />

                    {/* O-Level Class Report Routes */}
                    <Route path="results/o-level/class/:classId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <OLevelClassReportRouter />
                      </ProtectedRoute>
                    } />
                    <Route path="results/o-level/class/:classId/:examId/form/:formLevel" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <OLevelClassReportRouter />
                      </ProtectedRoute>
                    } />

                    {/* Prisma-based Routes */}
                    <Route path="results/prisma" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <PrismaResultsDemo />
                      </ProtectedRoute>
                    } />
                    <Route path="results/prisma/student/:studentId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <PrismaStudentResults />
                      </ProtectedRoute>
                    } />
                    <Route path="results/prisma/class/:classId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <PrismaClassResults />
                      </ProtectedRoute>
                    } />

                    {/* O-Level Student Report Routes */}
                    <Route path="results/o-level/student-clean/:studentId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <EnhancedOLevelStudentResultReport />
                      </ProtectedRoute>
                    } />
                    {/* Legacy O-Level Clean Student Report Route */}
                    <Route path="results/o-level/student-clean-legacy/:studentId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <OLevelResultReport />
                      </ProtectedRoute>
                    } />
                    <Route path="admin/assessment-management/results/a-level/class/:classId/:examId/form/:formLevel"
                      element={<ALevelClassReportRouter />}
                    />
                    <Route path="admin/assessment-management/results/a-level/class/:classId/:examId"
                      element={<ALevelClassReportRouter />}
                    />
                    <Route path="admin/assessment-management/results/o-level/class/:classId/:examId"
                      element={<OLevelClassReportRouter />}
                    />
                    <Route path="admin/assessment-management/results/o-level/class/:classId/:examId/form/:formLevel"
                      element={<OLevelClassReportRouter />}
                    />
                    {/* Generic Student Report Route (for backward compatibility) */}
                    <Route path="results/student-report/:studentId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <SingleStudentReport />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/bulk-download" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <BulkReportDownloader />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/a-level-comprehensive-selector" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ALevelComprehensiveReportSelector />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/a-level/class-reports" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ALevelClassReportsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/o-level/class-reports" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <OLevelClassReportsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/a-level-comprehensive/:studentId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ALevelComprehensiveReportRouter />
                      </ProtectedRoute>
                    } />
                    {/* A-Level Form-Specific Routes - Redirected to new unified class report */}
                    <Route path="/results/a-level/form5/class/:classId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <LegacyReportRedirect type="class" formLevel="5" />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/a-level/form6/class/:classId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <LegacyReportRedirect type="class" formLevel="6" />
                      </ProtectedRoute>
                    } />
                    {/* Demo Routes */}
                    <Route path="/demo/form5-data" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <DemoDataNavigator />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/class-report/demo-class/demo-exam" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ClassTabularReport />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/a-level/form5/student/:studentId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <ALevelFormStudentReport />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/a-level/form6/student/:studentId/:examId" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <ALevelFormStudentReport />
                      </ProtectedRoute>
                    } />

                    {/* Marks Entry Dashboard */}
                    <Route path="/results/marks-entry-dashboard" element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <MarksEntryDashboard />
                      </ProtectedRoute>
                    } />





                    {/* O-Level Marks Entry Routes */}
                    <Route path="/results/o-level/marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <OLevelMarksEntry />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/o-level/bulk-marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ErrorBoundary>
                          <OLevelBulkMarksEntry />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/results/o-level/enhanced-bulk-marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <EnhancedBulkMarksEntry />
                      </ProtectedRoute>
                    } />

                    {/* A-Level Marks Entry Routes */}
                    <Route path="/results/a-level/marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ALevelMarksEntry />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/a-level/bulk-marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ALevelBulkMarksEntry />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/a-level/legacy-bulk-marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <LegacyALevelBulkMarksEntryPage />
                      </ProtectedRoute>
                    } />

                    {/* New A-Level Marks Entry Routes */}
                    <Route path="/results/new-a-level/marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <NewALevelMarksEntry />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/new-a-level/bulk-marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <NewALevelBulkMarksEntryV2 />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/new-a-level/bulk-marks-entry-v2" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <NewALevelBulkMarksEntryV2 />
                      </ProtectedRoute>
                    } />

                    {/* Unified Marks Entry Route */}
                    <Route path="/marks/unified-bulk-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ErrorBoundary>
                          <UnifiedBulkMarksEntry key="unified-bulk-entry-v2" />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } />

                    {/* Teacher-specific routes */}
                    <Route path="/teacher/o-level/marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <OLevelMarksEntry />
                      </ProtectedRoute>
                    } />
                    <Route path="/teacher/o-level/bulk-marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ErrorBoundary>
                          <OLevelBulkMarksEntry />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } />
                    <Route path="/teacher/o-level/enhanced-bulk-marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <EnhancedBulkMarksEntry />
                      </ProtectedRoute>
                    } />
                    <Route path="/teacher/a-level/marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ALevelMarksEntry />
                      </ProtectedRoute>
                    } />
                    <Route path="/teacher/a-level/bulk-marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <ALevelBulkMarksEntry />
                      </ProtectedRoute>
                    } />
                    <Route path="/teacher/new-a-level/marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <NewALevelMarksEntry />
                      </ProtectedRoute>
                    } />
                    <Route path="/teacher/new-a-level/bulk-marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <NewALevelBulkMarksEntryV2 />
                      </ProtectedRoute>
                    } />
                    <Route path="/teacher/new-a-level/bulk-marks-entry-v2" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <NewALevelBulkMarksEntryV2 />
                      </ProtectedRoute>
                    } />

                    {/* Marks History Routes */}
                    <Route path="/marks-history" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <MarksHistoryDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/marks-history/:type/:id" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <MarksHistoryViewer />
                      </ProtectedRoute>
                    } />

                    {/* Sample Marks Entry for Testing */}
                    <Route path="/results/enter-sample-marks" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <EnterSampleMarks />
                      </ProtectedRoute>
                    } />

                    {/* Direct Marks Entry */}
                    <Route path="/results/direct-marks-entry" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                        <DirectMarksEntry />
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

                    {/* Authentication Debug Page */}
                    <Route path="/auth-debug" element={<AuthDebugPage />} />

                    {/* Token Info Display */}
                    <Route path="/token-info" element={<Box sx={{ p: 3 }}>
                      <Typography variant="h4" gutterBottom>Authentication Token Information</Typography>
                      <Typography variant="body1" paragraph>
                        This page shows information about your current authentication token. If you're experiencing authentication issues,
                        you can use the refresh button to get a new token.
                      </Typography>
                      <Box sx={{ maxWidth: 600, mt: 2 }}>
                        <TokenInfoDisplay />
                      </Box>
                    </Box>} />

                    {/* Prisma Test Page */}
                    <Route path="/prisma-test" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <PrismaTest />
                      </ProtectedRoute>
                    } />

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
                  <Route path="/public/printable-report/:classId/:examId" element={<PrintableClassReport />} />
                  {/* Add a direct route for easier access */}
                  <Route path="/printable-report/:classId/:examId" element={<PrintableClassReport />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Footer />
              </Box>
            </>
          )}
          </div>
        </ResultProvider>
        </AssessmentProvider>
      </AuthProvider>
    </LocalizationProvider>
  );
}

export default App;
