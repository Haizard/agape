import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';

// Layout
import MainLayout from './components/layout/MainLayout';

// Admin
import AdminDashboard from './components/admin/AdminDashboard';
import ResultMonitoringDashboard from './components/admin/ResultMonitoringDashboard';

// Teacher
import TeacherDashboard from './components/teacher/TeacherDashboard';
import EnterMarksForm from './components/teacher/EnterMarksForm';
import BatchMarksEntry from './components/teacher/BatchMarksEntry';

// Student
import StudentDashboard from './components/student/StudentDashboard';

// Common
import NotFound from './components/common/NotFound';

// Theme
import theme from './theme';

// Protected Route Component
const ProtectedRoute = ({ element, allowedRoles }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" />;
  }
  
  return element;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Main Layout Routes */}
            <Route path="/" element={<MainLayout />}>
              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />} 
              />
              <Route 
                path="/admin/results/monitor" 
                element={<ProtectedRoute element={<ResultMonitoringDashboard />} allowedRoles={['admin']} />} 
              />
              
              {/* Teacher Routes */}
              <Route 
                path="/teacher" 
                element={<ProtectedRoute element={<TeacherDashboard />} allowedRoles={['teacher']} />} 
              />
              <Route 
                path="/teacher/enter-marks" 
                element={<ProtectedRoute element={<EnterMarksForm />} allowedRoles={['teacher', 'admin']} />} 
              />
              <Route 
                path="/teacher/batch-marks" 
                element={<ProtectedRoute element={<BatchMarksEntry />} allowedRoles={['teacher', 'admin']} />} 
              />
              
              {/* Student Routes */}
              <Route 
                path="/student" 
                element={<ProtectedRoute element={<StudentDashboard />} allowedRoles={['student']} />} 
              />
              
              {/* Default Route */}
              <Route path="/" element={<Navigate to="/login" />} />
            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <ToastContainer position="bottom-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
