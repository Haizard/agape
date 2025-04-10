import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';

// Import report templates
import OLevelReportTemplate from './templates/OLevelReportTemplate';
import ALevelReportTemplate from './templates/ALevelReportTemplate';

/**
 * StudentReportGenerator Component
 * 
 * Generates student reports based on education level (O-Level or A-Level)
 */
const StudentReportGenerator = () => {
  // State for selectors
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  
  // State for report data
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // State for education level
  const [educationLevel, setEducationLevel] = useState('O_LEVEL');
  
  // State for preview
  const [showPreview, setShowPreview] = useState(false);
  
  // Fetch academic years when component mounts
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        // For development with mock data
        if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
          setAcademicYears([
            { _id: '1', name: '2025-2026', isActive: true },
            { _id: '2', name: '2024-2025', isActive: false }
          ]);
          return;
        }
        
        // Fetch from API in production
        const response = await fetch('/api/new-academic-years');
        if (!response.ok) {
          throw new Error('Failed to fetch academic years');
        }
        const data = await response.json();
        setAcademicYears(data);
        
        // Set active academic year as default
        const activeYear = data.find(year => year.isActive);
        if (activeYear) {
          setSelectedAcademicYear(activeYear._id);
          // Fetch terms for this academic year
          fetchTerms(activeYear._id);
        }
      } catch (err) {
        console.error('Error fetching academic years:', err);
        setError('Failed to load academic years. Please try again.');
      }
    };
    
    fetchAcademicYears();
  }, []);
  
  // Fetch terms when academic year changes
  const fetchTerms = async (academicYearId) => {
    try {
      // For development with mock data
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        setTerms([
          { _id: '1', name: 'Term 1' },
          { _id: '2', name: 'Term 2' },
          { _id: '3', name: 'Term 3' }
        ]);
        return;
      }
      
      // Fetch from API in production
      const response = await fetch(`/api/new-academic-years/${academicYearId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch terms');
      }
      const data = await response.json();
      setTerms(data.terms || []);
      
      // Set first term as default if available
      if (data.terms && data.terms.length > 0) {
        setSelectedTerm(data.terms[0]._id);
      }
    } catch (err) {
      console.error('Error fetching terms:', err);
      setError('Failed to load terms. Please try again.');
    }
  };
  
  // Handle academic year change
  const handleAcademicYearChange = (e) => {
    const yearId = e.target.value;
    setSelectedAcademicYear(yearId);
    fetchTerms(yearId);
  };
  
  // Fetch classes when education level changes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        // For development with mock data
        if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
          if (educationLevel === 'O_LEVEL') {
            setClasses([
              { _id: '1', name: 'Form 1A', educationLevel: 'O_LEVEL' },
              { _id: '2', name: 'Form 2B', educationLevel: 'O_LEVEL' },
              { _id: '3', name: 'Form 3C', educationLevel: 'O_LEVEL' },
              { _id: '4', name: 'Form 4D', educationLevel: 'O_LEVEL' }
            ]);
          } else {
            setClasses([
              { _id: '5', name: 'Form 5 PCM', educationLevel: 'A_LEVEL' },
              { _id: '6', name: 'Form 6 PCB', educationLevel: 'A_LEVEL' }
            ]);
          }
          return;
        }
        
        // Fetch from API in production
        const response = await fetch(`/api/classes?educationLevel=${educationLevel}`);
        if (!response.ok) {
          throw new Error('Failed to fetch classes');
        }
        const data = await response.json();
        setClasses(data);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes. Please try again.');
      }
    };
    
    fetchClasses();
    // Reset selected class and student when education level changes
    setSelectedClass('');
    setSelectedStudent('');
  }, [educationLevel]);
  
  // Fetch students when class changes
  useEffect(() => {
    if (!selectedClass) return;
    
    const fetchStudents = async () => {
      try {
        // For development with mock data
        if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
          const mockStudents = [
            { _id: '1', name: 'John Doe', registrationNumber: 'S001' },
            { _id: '2', name: 'Jane Smith', registrationNumber: 'S002' },
            { _id: '3', name: 'Michael Johnson', registrationNumber: 'S003' },
            { _id: '4', name: 'Emily Brown', registrationNumber: 'S004' },
            { _id: '5', name: 'David Wilson', registrationNumber: 'S005' }
          ];
          setStudents(mockStudents);
          return;
        }
        
        // Fetch from API in production
        const response = await fetch(`/api/classes/${selectedClass}/students`);
        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }
        const data = await response.json();
        setStudents(data);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students. Please try again.');
      }
    };
    
    fetchStudents();
    // Reset selected student when class changes
    setSelectedStudent('');
  }, [selectedClass]);
  
  // Generate report
  const generateReport = async () => {
    if (!selectedAcademicYear || !selectedTerm || !selectedClass || !selectedStudent) {
      setError('Please select all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setReportData(null);
    
    try {
      // For development with mock data
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        // Get student data
        const student = students.find(s => s._id === selectedStudent);
        
        // Generate mock report data
        const mockReportData = {
          student: {
            id: student._id,
            name: student.name,
            registrationNumber: student.registrationNumber,
            class: classes.find(c => c._id === selectedClass).name
          },
          academicYear: academicYears.find(y => y._id === selectedAcademicYear).name,
          term: terms.find(t => t._id === selectedTerm).name,
          subjects: educationLevel === 'O_LEVEL' ? [
            { name: 'Mathematics', mark: 85, grade: 'A', position: 3, remarks: 'Excellent' },
            { name: 'English', mark: 78, grade: 'B', position: 5, remarks: 'Good' },
            { name: 'Physics', mark: 92, grade: 'A+', position: 1, remarks: 'Outstanding' },
            { name: 'Chemistry', mark: 88, grade: 'A', position: 2, remarks: 'Excellent' },
            { name: 'Biology', mark: 75, grade: 'B', position: 7, remarks: 'Good' },
            { name: 'History', mark: 82, grade: 'A', position: 4, remarks: 'Very Good' },
            { name: 'Geography', mark: 79, grade: 'B', position: 6, remarks: 'Good' }
          ] : [
            { name: 'Mathematics', mark: 85, grade: 'A', position: 3, remarks: 'Excellent' },
            { name: 'Physics', mark: 92, grade: 'A+', position: 1, remarks: 'Outstanding' },
            { name: 'Chemistry', mark: 88, grade: 'A', position: 2, remarks: 'Excellent' }
          ],
          attendance: {
            daysPresent: 58,
            daysAbsent: 2,
            totalDays: 60
          },
          classTeacherRemarks: 'A hardworking student who has shown great improvement this term.',
          principalRemarks: 'Keep up the good work and strive for excellence.',
          nextTermBegins: '2025-05-10',
          schoolFees: {
            amount: 500000,
            paid: 450000,
            balance: 50000
          },
          classAverage: 82.5,
          classPosition: 3,
          totalStudents: 45
        };
        
        // Set report data
        setReportData(mockReportData);
        setShowPreview(true);
        setSuccess('Report generated successfully');
        setLoading(false);
        return;
      }
      
      // Fetch from API in production
      const response = await fetch(
        `/api/results/report?academicYear=${selectedAcademicYear}&term=${selectedTerm}&class=${selectedClass}&student=${selectedStudent}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const data = await response.json();
      setReportData(data);
      setShowPreview(true);
      setSuccess('Report generated successfully');
    } catch (err) {
      console.error('Error generating report:', err);
      setError(`Failed to generate report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Print report
  const printReport = () => {
    window.print();
  };
  
  // Download report as PDF
  const downloadReport = () => {
    // This would be implemented with a PDF generation library like jsPDF
    // For now, we'll just show an alert
    alert('PDF download functionality will be implemented with jsPDF');
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Student Report Generator
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Tabs
          value={educationLevel}
          onChange={(e, newValue) => setEducationLevel(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab value="O_LEVEL" label="O-Level" />
          <Tab value="A_LEVEL" label="A-Level" />
        </Tabs>
        
        <Typography variant="h6" gutterBottom>
          Select Student and Period
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={selectedAcademicYear}
                onChange={handleAcademicYearChange}
                label="Academic Year"
              >
                <MenuItem value="">
                  <em>Select Academic Year</em>
                </MenuItem>
                {academicYears.map(year => (
                  <MenuItem key={year._id} value={year._id}>
                    {year.name} {year.isActive ? '(Current)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Term</InputLabel>
              <Select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                label="Term"
                disabled={!selectedAcademicYear}
              >
                <MenuItem value="">
                  <em>Select Term</em>
                </MenuItem>
                {terms.map(term => (
                  <MenuItem key={term._id} value={term._id}>
                    {term.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                label="Class"
                disabled={!selectedTerm}
              >
                <MenuItem value="">
                  <em>Select Class</em>
                </MenuItem>
                {classes.map(cls => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Student</InputLabel>
              <Select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                label="Student"
                disabled={!selectedClass}
              >
                <MenuItem value="">
                  <em>Select Student</em>
                </MenuItem>
                {students.map(student => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name} ({student.registrationNumber})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={generateReport}
            disabled={loading || !selectedAcademicYear || !selectedTerm || !selectedClass || !selectedStudent}
            startIcon={loading ? <CircularProgress size={20} /> : <PreviewIcon />}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </Box>
      </Paper>
      
      {showPreview && reportData && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Report Preview
            </Typography>
            
            <Box>
              <Button
                variant="outlined"
                color="primary"
                onClick={printReport}
                startIcon={<PrintIcon />}
                sx={{ mr: 1 }}
              >
                Print
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={downloadReport}
                startIcon={<DownloadIcon />}
              >
                Download PDF
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ mt: 2 }} className="report-preview">
            {educationLevel === 'O_LEVEL' ? (
              <OLevelReportTemplate reportData={reportData} />
            ) : (
              <ALevelReportTemplate reportData={reportData} />
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default StudentReportGenerator;
