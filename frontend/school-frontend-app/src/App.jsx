import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { AssessmentProvider } from './contexts/AssessmentContext';
import theme from './theme';
import AssessmentList from './components/assessment/AssessmentList';

// Layout Components
import MainLayout from './components/layout/MainLayout';
import DepartmentLayout from './components/layout/DepartmentLayout';

// Page Components
import Dashboard from './components/Dashboard';
import AssessmentManagement from './components/assessment/AssessmentManagement';
import BulkAssessmentEntry from './components/assessment/BulkAssessmentEntry';
import AssessmentReport from './components/assessment/AssessmentReport';
import StudentResultView from './components/assessment/StudentResultView';
import ResultManagement from './components/academic/ResultManagement';
import CharacterAssessmentEntry from './components/results/CharacterAssessmentEntry';
import Login from './components/auth/Login';
import PrivateRoute from './components/auth/PrivateRoute';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AssessmentProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  
                  {/* Assessment Routes */}
                  <Route path="/assessments" element={<AssessmentManagement />}>
                    <Route index element={<AssessmentList />} />
                    <Route path="manage" element={<AssessmentList />} />
                    <Route path="bulk-entry" element={<BulkAssessmentEntry />} />
                    <Route path="report" element={<AssessmentReport />} />
                    <Route path="student/:studentId" element={<StudentResultView />} />
                    <Route path="results" element={<ResultManagement />} />
                    <Route path="character" element={<CharacterAssessmentEntry />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </Router>
        </AssessmentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;