import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  TextField,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarMonthIcon,
  FileDownload as FileDownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

/**
 * BulkReportDownloader Component
 * Allows downloading multiple student reports at once with advanced filtering
 */
const BulkReportDownloader = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [years, setYears] = useState([]);
  const [examTypes, setExamTypes] = useState([]);

  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Download status
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/classes`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Filter for A-Level classes only
      const aLevelClasses = response.data.filter(c =>
        c.educationLevel === 'A_LEVEL' ||
        c.name?.includes('Form 5') ||
        c.name?.includes('Form 6')
      );

      setClasses(aLevelClasses);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes. Please try again.');
    }
  }, []);

  // Fetch exams
  const fetchExams = useCallback(async () => {
    try {
      let url = `${process.env.REACT_APP_API_URL || ''}/api/exams`;

      // Add filters if selected
      const params = new URLSearchParams();
      if (selectedYear) params.append('academicYearId', selectedYear);
      if (selectedExamType) params.append('examTypeId', selectedExamType);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setExams(response.data);

      // Extract unique years and exam types
      const uniqueYears = [...new Set(response.data.map(exam => exam.academicYear))].filter(Boolean);
      const uniqueTypes = [...new Set(response.data.map(exam => exam.type))].filter(Boolean);

      setYears(uniqueYears);
      setExamTypes(uniqueTypes);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Failed to load exams. Please try again.');
    }
  }, [selectedYear, selectedExamType]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/students?class=${selectedClass}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setStudents(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again.');
      setLoading(false);
    }
  }, [selectedClass]);

  // Load initial data
  useEffect(() => {
    fetchClasses();
    fetchExams();
  }, [fetchClasses, fetchExams]);

  // Load students when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [selectedClass, fetchStudents]);

  // Handle class selection
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
    setSelectedStudents([]);
  };

  // Handle exam selection
  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
  };

  // Handle year selection
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  // Handle exam type selection
  const handleExamTypeChange = (event) => {
    setSelectedExamType(event.target.value);
  };

  // Handle search query change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handle student selection
  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all students
  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student._id));
    }
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`;
    return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           student.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Download selected student reports
  const handleDownload = async () => {
    if (!selectedExam || selectedStudents.length === 0) {
      setError('Please select an exam and at least one student.');
      return;
    }

    try {
      setDownloading(true);
      setDownloadProgress(0);
      setError(null);
      setSuccess(null);

      // Create a zip file with all reports
      const downloadUrl = `${process.env.REACT_APP_API_URL || ''}/api/reports/bulk-download`;

      const response = await axios.post(
        downloadUrl,
        {
          examId: selectedExam,
          studentIds: selectedStudents
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(percentCompleted);
          }
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Get exam name for the filename
      const exam = exams.find(e => e._id === selectedExam);
      const examName = exam ? exam.name.replace(/\s+/g, '_') : 'reports';

      link.setAttribute('download', `${examName}_reports.zip`);
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      link.remove();

      setDownloading(false);
      setSuccess(`Successfully downloaded ${selectedStudents.length} student reports.`);
    } catch (err) {
      console.error('Error downloading reports:', err);
      setError('Failed to download reports. Please try again.');
      setDownloading(false);
    }
  };

  // View a single student report
  const handleViewReport = (studentId) => {
    if (!selectedExam) {
      setError('Please select an exam first.');
      return;
    }

    navigate(`/results/student-report/${studentId}/${selectedExam}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Bulk Report Downloader
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Download multiple student reports at once with advanced filtering options.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Filters Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Filters
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="year-select-label">Academic Year</InputLabel>
                  <Select
                    labelId="year-select-label"
                    value={selectedYear}
                    onChange={handleYearChange}
                    label="Academic Year"
                  >
                    <MenuItem value="">All Years</MenuItem>
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="exam-type-select-label">Exam Type</InputLabel>
                  <Select
                    labelId="exam-type-select-label"
                    value={selectedExamType}
                    onChange={handleExamTypeChange}
                    label="Exam Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {examTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="exam-select-label">Exam</InputLabel>
                  <Select
                    labelId="exam-select-label"
                    value={selectedExam}
                    onChange={handleExamChange}
                    label="Exam"
                    required
                  >
                    <MenuItem value="">Select Exam</MenuItem>
                    {exams.map((exam) => (
                      <MenuItem key={exam._id} value={exam._id}>
                        {exam.name} ({exam.academicYear})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="class-select-label">Class</InputLabel>
                  <Select
                    labelId="class-select-label"
                    value={selectedClass}
                    onChange={handleClassChange}
                    label="Class"
                  >
                    <MenuItem value="">Select Class</MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={!selectedExam || selectedStudents.length === 0 || downloading}
                  onClick={handleDownload}
                  startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
                >
                  {downloading ? `Downloading (${downloadProgress}%)` : `Download ${selectedStudents.length} Reports`}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Students Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Students
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  size="small"
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                    endAdornment: searchQuery && (
                      <IconButton size="small" onClick={handleClearSearch}>
                        <ClearIcon />
                      </IconButton>
                    )
                  }}
                  sx={{ mr: 2 }}
                />

                <Button
                  variant="outlined"
                  onClick={handleSelectAll}
                  startIcon={
                    selectedStudents.length === filteredStudents.length
                      ? <CheckBoxIcon />
                      : <CheckBoxOutlineBlankIcon />
                  }
                  size="small"
                >
                  {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : filteredStudents.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  {selectedClass
                    ? 'No students found. Try a different search or class.'
                    : 'Please select a class to view students.'}
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudents.includes(student._id);
                  return (
                    <ListItem
                      key={student._id}
                      disablePadding
                      secondaryAction={
                        <Tooltip title="View Report">
                          <IconButton
                            edge="end"
                            onClick={() => handleViewReport(student._id)}
                            disabled={!selectedExam}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemButton
                        onClick={() => handleStudentSelect(student._id)}
                        selected={isSelected}
                      >
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={isSelected}
                            tabIndex={-1}
                            disableRipple
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${student.firstName} ${student.lastName}`}
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {student.admissionNumber}
                              </Typography>
                              {student.gender && ` — ${student.gender}`}
                              {student.subjectCombination && ` — ${student.subjectCombination}`}
                            </React.Fragment>
                          }
                        />
                        {student.form && (
                          <Chip
                            label={`Form ${student.form}`}
                            size="small"
                            color={student.form === 5 || student.form === '5' ? 'primary' : 'secondary'}
                            sx={{ ml: 1 }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )}

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {selectedStudents.length} of {filteredStudents.length} students selected
              </Typography>

              <Button
                variant="contained"
                color="primary"
                disabled={!selectedExam || selectedStudents.length === 0 || downloading}
                onClick={handleDownload}
                startIcon={<FileDownloadIcon />}
              >
                Download Selected
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BulkReportDownloader;
