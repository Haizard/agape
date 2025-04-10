import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  Class as ClassIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * BatchReportDownload Component
 * 
 * Allows downloading multiple student reports at once
 */
const BatchReportDownload = () => {
  // State for classes and students
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // State for academic years and terms
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  
  // State for download progress
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadResults, setDownloadResults] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Fetch classes when component mounts
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        // For development with mock data
        if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
          setClasses([
            { _id: '1', name: 'Form 1A', educationLevel: 'O_LEVEL' },
            { _id: '2', name: 'Form 2B', educationLevel: 'O_LEVEL' },
            { _id: '3', name: 'Form 5 PCM', educationLevel: 'A_LEVEL' },
            { _id: '4', name: 'Form 6 PCB', educationLevel: 'A_LEVEL' }
          ]);
          return;
        }
        
        // Fetch from API in production
        const response = await fetch('/api/classes');
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
    
    fetchClasses();
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
    // Reset selected students when class changes
    setSelectedStudents([]);
    setSelectAll(false);
  }, [selectedClass]);
  
  // Handle class change
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
  };
  
  // Handle select all checkbox
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedStudents(students.map(student => student._id));
    } else {
      setSelectedStudents([]);
    }
  };
  
  // Handle individual student selection
  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        // Remove student if already selected
        const newSelected = prev.filter(id => id !== studentId);
        setSelectAll(false);
        return newSelected;
      } else {
        // Add student if not selected
        const newSelected = [...prev, studentId];
        // Check if all students are now selected
        if (newSelected.length === students.length) {
          setSelectAll(true);
        }
        return newSelected;
      }
    });
  };
  
  // Download reports for selected students
  const handleDownload = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }
    
    if (!selectedAcademicYear || !selectedTerm) {
      setError('Please select an academic year and term');
      return;
    }
    
    setDownloading(true);
    setDownloadProgress(0);
    setDownloadResults([]);
    setError(null);
    setSuccess(null);
    
    try {
      const zip = new JSZip();
      const selectedStudentsData = students.filter(student => 
        selectedStudents.includes(student._id)
      );
      
      // Create a folder for the reports
      const reportsFolder = zip.folder("student_reports");
      
      // Get class name for the filename
      const className = classes.find(c => c._id === selectedClass)?.name || 'Class';
      
      // Get academic year and term names
      const academicYear = academicYears.find(y => y._id === selectedAcademicYear)?.name || '';
      const term = terms.find(t => t._id === selectedTerm)?.name || '';
      
      // Process each student
      for (let i = 0; i < selectedStudentsData.length; i++) {
        const student = selectedStudentsData[i];
        
        try {
          // Update progress
          const progress = Math.round(((i + 1) / selectedStudentsData.length) * 100);
          setDownloadProgress(progress);
          
          // For development with mock data
          if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Create a mock PDF content (just text for demonstration)
            const pdfContent = `Mock Report for ${student.name} - ${academicYear} ${term}`;
            
            // Add to zip
            const filename = `${student.registrationNumber}_${student.name.replace(/\\s+/g, '_')}_Report.pdf`;
            reportsFolder.file(filename, pdfContent);
            
            // Add to results
            setDownloadResults(prev => [...prev, {
              studentId: student._id,
              studentName: student.name,
              success: true,
              filename
            }]);
            
            continue;
          }
          
          // In production, fetch the actual report PDF
          const response = await fetch(`/api/results/report/${student._id}?academicYear=${selectedAcademicYear}&term=${selectedTerm}`);
          
          if (!response.ok) {
            throw new Error(`Failed to download report for ${student.name}`);
          }
          
          const blob = await response.blob();
          
          // Add to zip
          const filename = `${student.registrationNumber}_${student.name.replace(/\\s+/g, '_')}_Report.pdf`;
          reportsFolder.file(filename, blob);
          
          // Add to results
          setDownloadResults(prev => [...prev, {
            studentId: student._id,
            studentName: student.name,
            success: true,
            filename
          }]);
        } catch (err) {
          console.error(`Error downloading report for ${student.name}:`, err);
          
          // Add failed download to results
          setDownloadResults(prev => [...prev, {
            studentId: student._id,
            studentName: student.name,
            success: false,
            error: err.message
          }]);
        }
      }
      
      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Save the zip file
      saveAs(zipBlob, `${className}_${academicYear}_${term}_Reports.zip`);
      
      // Check if all downloads were successful
      const allSuccess = downloadResults.every(result => result.success);
      if (allSuccess) {
        setSuccess(`Successfully downloaded reports for ${selectedStudentsData.length} students`);
      } else {
        const failedCount = downloadResults.filter(result => !result.success).length;
        setError(`Failed to download ${failedCount} out of ${selectedStudentsData.length} reports`);
      }
    } catch (err) {
      console.error('Error creating zip file:', err);
      setError(`Failed to create zip file: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Batch Report Download
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Academic Period
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
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
            <FormControl fullWidth>
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
        </Grid>
        
        <Typography variant="h6" gutterBottom>
          Select Class and Students
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={handleClassChange}
                label="Class"
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
        </Grid>
        
        {selectedClass && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1">
                Students ({students.length})
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectAll}
                    onChange={handleSelectAll}
                    disabled={students.length === 0}
                  />
                }
                label="Select All"
              />
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {students.length === 0 ? (
              <Alert severity="info">No students found in this class</Alert>
            ) : (
              <List>
                {students.map(student => (
                  <ListItem key={student._id} dense button onClick={() => handleStudentSelect(student._id)}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedStudents.includes(student._id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={student.name} 
                      secondary={`Reg No: ${student.registrationNumber}`} 
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={downloading || selectedStudents.length === 0 || !selectedAcademicYear || !selectedTerm}
          >
            {downloading ? 'Downloading...' : `Download Reports (${selectedStudents.length})`}
          </Button>
        </Box>
      </Paper>
      
      {downloading && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Download Progress
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={downloadProgress} 
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              {downloadProgress}% Complete
            </Typography>
          </Box>
          
          <Typography variant="subtitle1" gutterBottom>
            Processing: {downloadResults.length} of {selectedStudents.length} students
          </Typography>
        </Paper>
      )}
      
      {downloadResults.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Download Results
          </Typography>
          
          <List>
            {downloadResults.map((result, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {result.success ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={result.studentName}
                  secondary={result.success ? result.filename : `Error: ${result.error}`}
                />
              </ListItem>
            ))}
          </List>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default BatchReportDownload;
