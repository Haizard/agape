import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Pagination,
  Divider,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  PictureAsPdf, GetApp,
  Share as ShareIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { generateEnhancedALevelReportPDF } from '../../utils/enhancedALevelReportGenerator';
import {
  generateALevelReportPDF,
  generateALevelReportExcel,
  downloadPDF,
  downloadExcel,
  printReport
} from '../../utils/exportUtils';
import { generateALevelExcelReport } from '../../utils/aLevelExcelGenerator';

/**
 * Enhanced A-Level Class Report Component
 *
 * A comprehensive A-Level class result report component that follows the format
 * from Agape Lutheran Junior Seminary. This component is specifically designed for A-Level results.
 *
 * @param {Object} props
 * @param {Object} props.data - The report data
 * @param {boolean} props.loading - Whether the data is loading
 * @param {string} props.error - Error message if any
 * @param {Function} props.onDownload - Function to call when downloading the report
 * @param {Function} props.onPrint - Function to call when printing the report
 */
const EnhancedALevelClassReport = ({
  data,
  loading = false,
  error = null,
  onDownload = null,
  onPrint = null
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [studentsPerPage, setStudentsPerPage] = useState(10);
  const [processedData, setProcessedData] = useState(null);
  const [showApprovals, setShowApprovals] = useState(true);
  const [reportError, setReportError] = useState(error);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'summary'
  const [selectedForm, setSelectedForm] = useState('all');
  const [selectedCombination, setSelectedCombination] = useState('all');

  // Process and prepare data for display
  useEffect(() => {
    if (!data) return;

    // Validate that this is A-Level data
    if (data.educationLevel && data.educationLevel !== 'A_LEVEL') {
      setReportError('This report is only for A-Level results. Please use the O-Level report for O-Level results.');
      return;
    }

    // Additional validation for class name
    if (data.className) {
      const isOLevelClass = data.className.includes('Form 1') ||
                          data.className.includes('Form 2') ||
                          data.className.includes('Form 3') ||
                          data.className.includes('Form 4') ||
                          data.className.includes('Form I') ||
                          data.className.includes('Form II') ||
                          data.className.includes('Form III') ||
                          data.className.includes('Form IV');

      if (isOLevelClass) {
        setReportError('This appears to be an O-Level class based on the class name. Please use the O-Level report component.');
        return;
      }
    }

    // Deep clone to avoid modifying original data
    const processedData = JSON.parse(JSON.stringify(data));

    // Get current year for the title if not provided
    if (!processedData.year) {
      processedData.year = new Date().getFullYear();
    } else if (typeof processedData.year === 'object' && processedData.year !== null) {
      // If year is an object, extract the year value
      processedData.year = processedData.year.year || processedData.year.name || new Date().getFullYear();
    }

    // Handle academicYear if it's an object
    if (typeof processedData.academicYear === 'object' && processedData.academicYear !== null) {
      processedData.academicYear = processedData.academicYear.name || processedData.academicYear.year || new Date().getFullYear();
    }

    // Sort students based on current sort settings
    if (processedData.students) {
      processedData.students.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        // Handle numeric values
        if (typeof aValue === 'string' && !Number.isNaN(Number(aValue))) {
          aValue = Number.parseFloat(aValue);
        }
        if (typeof bValue === 'string' && !Number.isNaN(Number(bValue))) {
          bValue = Number.parseFloat(bValue);
        }

        // Handle missing values
        if (aValue === undefined || aValue === null) aValue = sortDirection === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        if (bValue === undefined || bValue === null) bValue = sortDirection === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

        // Compare values
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
      });
    }

    // Calculate division summary
    const divisionSummary = {
      'I': 0,
      'II': 0,
      'III': 0,
      'IV': 0,
      '0': 0
    };

    if (processedData.students) {
      for (const student of processedData.students) {
        const division = student.division || 'IV';
        if (division === 'Division I' || division === 'I') divisionSummary.I++;
        else if (division === 'Division II' || division === 'II') divisionSummary.II++;
        else if (division === 'Division III' || division === 'III') divisionSummary.III++;
        else if (division === 'Division IV' || division === 'IV') divisionSummary.IV++;
        else divisionSummary[0]++;
      }
    }

    processedData.divisionSummary = divisionSummary;

    // Calculate subject-wise performance
    const subjectPerformance = {};
    const subjects = processedData.subjects || [];

    if (processedData.students) {
      for (const subject of subjects) {
        const subjectId = subject.id || subject._id;
        const subjectName = subject.name;

        if (!subjectId || !subjectName) continue;

        subjectPerformance[subjectId] = {
          name: subjectName,
          registered: 0,
          grades: { A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 },
          passed: 0,
          gpa: 0,
          totalPoints: 0
        };

        for (const student of processedData.students) {
          const subjectResult = student.subjects?.[subjectId] ||
                               student.subjectResults?.find(r => r.subjectId === subjectId) ||
                               student.results?.find(r => r.subject?.name === subjectName);

          if (subjectResult?.grade) {
            subjectPerformance[subjectId].registered++;
            subjectPerformance[subjectId].grades[subjectResult.grade]++;

            // Calculate passed based on NECTA standards
            // For principal subjects: A-E are passing grades
            // For subsidiary subjects: A-S are passing grades
            const isPrincipal = student.subjectResults?.find(r => r.subject?.name === subjectName)?.subject?.isPrincipal || false;

            if (isPrincipal) {
              // Principal subjects: A, B, C, D, E are passing grades
              if (['A', 'B', 'C', 'D', 'E'].includes(subjectResult.grade)) {
                subjectPerformance[subjectId].passed++;
              }
            } else {
              // Subsidiary subjects: A, B, C, D, E, S are passing grades
              if (['A', 'B', 'C', 'D', 'E', 'S'].includes(subjectResult.grade)) {
                subjectPerformance[subjectId].passed++;
              }
            }

            // Calculate GPA points
            let points = 0;
            switch (subjectResult.grade) {
              case 'A': points = 1; break;
              case 'B': points = 2; break;
              case 'C': points = 3; break;
              case 'D': points = 4; break;
              case 'E': points = 5; break;
              case 'S': points = 6; break;
              case 'F': points = 7; break;
              default: points = 0;
            }

            subjectPerformance[subjectId].totalPoints += points;
          }
        }

        // Calculate GPA
        if (subjectPerformance[subjectId].registered > 0) {
          subjectPerformance[subjectId].gpa = (
            subjectPerformance[subjectId].totalPoints / subjectPerformance[subjectId].registered
          ).toFixed(2);
        }
      }
    }

    processedData.subjectPerformance = subjectPerformance;

    // Calculate overall performance
    let totalPassed = 0;
    let totalGpaPoints = 0;
    const totalStudents = processedData.students?.length || 0;

    if (processedData.students) {
      for (const student of processedData.students) {
        if (student.division && (student.division === 'I' || student.division === 'II' ||
            student.division === 'III' || student.division === 'Division I' ||
            student.division === 'Division II' || student.division === 'Division III')) {
          totalPassed++;
        }

        // Add to GPA calculation if student has points
        if (student.points || student.totalPoints) {
          totalGpaPoints += Number(student.points || student.totalPoints || 0);
        }
      }
    }

    processedData.overallPerformance = {
      totalPassed,
      examGpa: totalStudents > 0 ? (totalGpaPoints / totalStudents).toFixed(2) : '0.00'
    };

    setProcessedData(processedData);
  }, [data, sortField, sortDirection]);

  // Update error from props
  useEffect(() => {
    setReportError(error);
  }, [error]);

  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and reset direction to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Handle download as PDF
  const handleDownloadPDF = () => {
    try {
      // Use both PDF generators for better compatibility
      try {
        // Try the enhanced PDF generator first
        const doc = generateEnhancedALevelReportPDF(reportData);
        const fileName = `${reportData.className || 'Class'}_${reportData.examName || 'Exam'}_A_Level_Result.pdf`;
        doc.save(fileName);
      } catch (enhancedError) {
        console.warn('Enhanced PDF generator failed, using standard generator:', enhancedError);
        // Fall back to the standard PDF generator
        const reportTitle = `${reportData.className} - ${reportData.examName} - ${reportData.year}`;
        const doc = generateALevelReportPDF(reportData, reportTitle);
        const filename = `A-Level_Report_${reportData.className}_${reportData.examName}_${reportData.year}.pdf`;
        downloadPDF(doc, filename);
      }

      if (onDownload) onDownload('pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setReportError(`Failed to generate PDF: ${err.message}`);
    }
  };

  // Handle download as Excel
  const handleDownloadExcel = async () => {
    try {
      // Try both Excel generators for better compatibility
      try {
        // Try the enhanced Excel generator first
        const buffer = await generateALevelExcelReport(reportData, reportData.className);

        // Create a Blob from the buffer
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Create a download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportData.className || 'Class'}_${reportData.examName || 'Exam'}_A_Level_Result.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (enhancedError) {
        console.warn('Enhanced Excel generator failed, using standard generator:', enhancedError);
        // Fall back to the standard Excel generator
        const reportTitle = `${reportData.className} - ${reportData.examName} - ${reportData.year}`;
        const blob = generateALevelReportExcel(reportData, reportTitle);
        const filename = `A-Level_Report_${reportData.className}_${reportData.examName}_${reportData.year}.xlsx`;
        downloadExcel(blob, filename);
      }

      if (onDownload) onDownload('excel');
    } catch (err) {
      console.error('Error generating Excel:', err);
      setReportError(`Failed to generate Excel: ${err.message}`);
    }
  };

  // Handle print
  const handlePrint = () => {
    try {
      // Try both print methods for better compatibility
      try {
        // Try the enhanced PDF generator first
        const doc = generateEnhancedALevelReportPDF(reportData);
        doc.autoPrint();
        doc.output('dataurlnewwindow');
      } catch (enhancedError) {
        console.warn('Enhanced print method failed, using standard method:', enhancedError);
        // Fall back to the standard print method
        printReport('enhanced-a-level-report-container');
      }

      if (onPrint) onPrint();
    } catch (err) {
      console.error('Error printing report:', err);
      setReportError(`Failed to print report: ${err.message}`);
    }
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // If error, show error message but continue to display the report structure
  const errorAlert = reportError ? (
    <Alert severity="error" sx={{ mb: 3 }}>
      {reportError}
    </Alert>
  ) : null;

  // If no data, create empty structure with placeholders
  const reportData = processedData || {
    className: 'Not Available',
    examName: 'Not Available',
    year: new Date().getFullYear(),
    educationLevel: 'A_LEVEL',
    students: [
      // Add placeholder student to show structure
      {
        id: 'placeholder-1',
        studentName: 'No Data Available',
        sex: '-',
        points: '-',
        division: '-',
        subjectResults: [
          // Add placeholder subject results to show structure
          { subject: { name: 'General Studies' }, marks: null },
          { subject: { name: 'Physics' }, marks: null },
          { subject: { name: 'Chemistry' }, marks: null },
          { subject: { name: 'Mathematics' }, marks: null }
        ],
        totalMarks: '-',
        averageMarks: '-',
        rank: '-',
        combination: 'PCM',
        form: '5'
      },
      {
        id: 'placeholder-2',
        studentName: 'Sample Student',
        sex: 'F',
        points: '-',
        division: '-',
        subjectResults: [
          // Add placeholder subject results to show structure
          { subject: { name: 'General Studies' }, marks: null },
          { subject: { name: 'History' }, marks: null },
          { subject: { name: 'Kiswahili' }, marks: null },
          { subject: { name: 'Literature' }, marks: null }
        ],
        totalMarks: '-',
        averageMarks: '-',
        rank: '-',
        combination: 'HKL',
        form: '6'
      }
    ],
    subjects: [
      { id: 'gs', name: 'General Studies' },
      { id: 'hist', name: 'History' },
      { id: 'phys', name: 'Physics' },
      { id: 'chem', name: 'Chemistry' },
      { id: 'kisw', name: 'Kiswahili' },
      { id: 'math', name: 'Advanced Mathematics' },
      { id: 'bio', name: 'Biology' },
      { id: 'geo', name: 'Geography' },
      { id: 'eng', name: 'English' },
      { id: 'bam', name: 'BAM' },
      { id: 'econ', name: 'Economics' },
      { id: 'lit', name: 'Literature' }
    ],
    divisionSummary: { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 },
    subjectPerformance: {},
    overallPerformance: { totalPassed: 0, examGpa: 'N/A' }
  };

  // If no data, update the error message to be more informative
  if (!processedData && !reportError) {
    setReportError(
      'No data available for this report. This could be because:\n' +
      '1. No marks have been entered for this class and exam\n' +
      '2. The class or exam may not exist\n' +
      '3. There may be an issue with the API connection\n\n' +
      'Showing placeholder structure for reference.'
    );
  }

  // Filter students based on selected form and combination
  const filteredStudents = reportData.students?.filter(student => {
    // Filter by form
    if (selectedForm !== 'all') {
      // Try different form fields
      const studentForm = student.form || student.className || student.class || '';
      const studentFormStr = typeof studentForm === 'string' ? studentForm :
                           (studentForm?.name || studentForm?.form || '');

      // Check for form match in different formats
      const formMatch =
        studentFormStr.includes(`Form ${selectedForm}`) ||
        studentFormStr.includes(`F${selectedForm}`) ||
        studentFormStr === selectedForm ||
        studentFormStr === `${selectedForm}` ||
        studentFormStr.toLowerCase().includes(`form ${selectedForm}`) ||
        studentFormStr.toLowerCase().includes(`f${selectedForm}`);

      if (!formMatch) return false;
    }

    // Filter by combination
    if (selectedCombination !== 'all') {
      // Try different combination fields
      const studentCombination =
        student.combination ||
        student.subjectCombination ||
        student.combination_code ||
        student.combinationCode ||
        '';

      const studentCombinationStr = typeof studentCombination === 'string' ? studentCombination :
                                  (studentCombination?.name || studentCombination?.code || '');

      // Check for combination match in different formats
      const combinationMatch =
        studentCombinationStr.includes(selectedCombination) ||
        studentCombinationStr.toLowerCase().includes(selectedCombination.toLowerCase());

      if (!combinationMatch) {
        // If no direct match, check if the student has subjects that match the combination
        const hasMatchingSubjects = checkStudentSubjectsForCombination(student, selectedCombination);
        if (!hasMatchingSubjects) return false;
      }
    }

    return true;
  }) || [];

  // Helper function to check if a student's subjects match a combination
  function checkStudentSubjectsForCombination(student, combination) {
    // Define subject patterns for common combinations
    const combinationPatterns = {
      'PCM': ['Physics', 'Chemistry', 'Mathematics', 'Advanced Mathematics'],
      'PCB': ['Physics', 'Chemistry', 'Biology'],
      'HKL': ['History', 'Kiswahili', 'Literature', 'English Literature'],
      'HGE': ['History', 'Geography', 'Economics'],
      'EGM': ['Economics', 'Geography', 'Mathematics', 'Advanced Mathematics']
    };

    // Get the pattern for the selected combination
    const pattern = combinationPatterns[combination];
    if (!pattern) return false;

    // Check if the student has subjects that match the pattern
    const studentSubjects = student.subjectResults || student.subjects || student.results || [];
    let matchCount = 0;

    for (const subject of studentSubjects) {
      const subjectName = subject.subject?.name || subject.subject || subject.name || '';
      if (pattern.some(patternSubject => subjectName.includes(patternSubject))) {
        matchCount++;
      }
    }

    // Student should have at least 2 subjects from the combination
    return matchCount >= 2;
  }

  // Calculate pagination
  const totalStudents = filteredStudents.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalStudents / studentsPerPage)); // At least 1 page
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = Math.min(startIndex + studentsPerPage, totalStudents);
  const currentStudents = filteredStudents.slice(startIndex, endIndex) || [];

  // Get all unique subjects from student combinations
  const allSubjects = new Set();

  // Debug the report data structure
  console.log('%cReport Data Structure Analysis', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
  console.log('Report Data:', reportData);
  console.log('Students:', reportData.students);

  // Log detailed structure of the first student if available
  if (reportData.students && reportData.students.length > 0) {
    const sampleStudent = reportData.students[0];
    console.log('Sample student keys:', Object.keys(sampleStudent));

    if (sampleStudent.subjectResults) {
      console.log('Sample student subjectResults:',
        Array.isArray(sampleStudent.subjectResults)
          ? `Array with ${sampleStudent.subjectResults.length} items`
          : typeof sampleStudent.subjectResults);

      if (Array.isArray(sampleStudent.subjectResults) && sampleStudent.subjectResults.length > 0) {
        console.log('Sample subjectResult item:', sampleStudent.subjectResults[0]);
      }
    }
  }

  // First, check if the API returned a list of subjects directly
  if (reportData.subjects && reportData.subjects.length > 0) {
    console.log('Found subjects directly in report data:', reportData.subjects);
    for (const subject of reportData.subjects) {
      if (subject.name) {
        allSubjects.add(subject.name);
      }
    }
  }

  // Then check for subjects in student results
  if (reportData.students && reportData.students.length > 0) {
    for (const student of reportData.students) {
      // Debug each student's subject data
      console.log(`Student ${student.studentName || student.id}:`, {
        subjectResults: student.subjectResults,
        subjects: student.subjects,
        results: student.results
      });

      // Handle different API response formats
      let studentSubjects = [];

      // Try to get subjects from different properties
      if (Array.isArray(student.subjectResults)) {
        studentSubjects = [...studentSubjects, ...student.subjectResults];
      }

      if (Array.isArray(student.subjects)) {
        studentSubjects = [...studentSubjects, ...student.subjects];
      }

      if (Array.isArray(student.results)) {
        studentSubjects = [...studentSubjects, ...student.results];
      }

      // Check if student has a 'results' property that's an object with subject names as keys
      if (student.results && typeof student.results === 'object' && !Array.isArray(student.results)) {
        for (const [key, value] of Object.entries(student.results)) {
          studentSubjects.push({
            subject: { name: key },
            marks: value
          });
        }
      }

      console.log('Student Subjects:', studentSubjects);

      // Check for subjects directly in the student object
      const commonSubjects = ['General Studies', 'History', 'Physics', 'Chemistry', 'Kiswahili', 'Advanced Mathematics',
       'Biology', 'Geography', 'English', 'BAM', 'Economics'];

      for (const subjectName of commonSubjects) {
        if (student[subjectName] !== undefined) {
          console.log(`Found subject ${subjectName} directly in student object:`, student[subjectName]);
          // Check if this subject is already in the studentSubjects array
          const exists = studentSubjects.some(s =>
            (s.subject?.name === subjectName) ||
            (s.name === subjectName) ||
            (s === subjectName) ||
            (s.subject === subjectName)
          );

          if (!exists) {
            studentSubjects.push({
              subject: { name: subjectName },
              marks: student[subjectName]
            });
          }
        }
      }

      // Check for subjects in the combination property
      if (student.combination && typeof student.combination === 'string') {
        // Extract subjects from combination code (e.g., PCM -> Physics, Chemistry, Mathematics)
        const combinationMap = {
          'P': 'Physics',
          'C': 'Chemistry',
          'M': 'Mathematics',
          'B': 'Biology',
          'G': 'Geography',
          'H': 'History',
          'K': 'Kiswahili',
          'L': 'Literature',
          'E': 'Economics'
        };

        for (const char of student.combination) {
          if (combinationMap[char]) {
            const subjectName = combinationMap[char];
            // Check if this subject is already in the studentSubjects array
            const exists = studentSubjects.some(s =>
              (s.subject?.name === subjectName) ||
              (s.name === subjectName) ||
              (s === subjectName) ||
              (s.subject === subjectName)
            );

            if (!exists) {
              studentSubjects.push({
                subject: { name: subjectName },
                marks: null // No marks available from combination code
              });
            }
          }
        }
      }

      for (const subject of studentSubjects) {
        console.log('Processing subject:', subject);

        // Different API formats use different structures
        if (subject.subject?.name) {
          console.log('Adding subject by subject.subject.name:', subject.subject.name);
          allSubjects.add(subject.subject.name);
        } else if (subject.subject) {
          console.log('Adding subject by subject.subject:', subject.subject);
          allSubjects.add(subject.subject);
        } else if (subject.name) {
          console.log('Adding subject by subject.name:', subject.name);
          allSubjects.add(subject.name);
        } else if (typeof subject === 'string') {
          console.log('Adding subject as string:', subject);
          allSubjects.add(subject);
        } else {
          console.log('Could not determine subject name from:', subject);
        }
      }
    }
  }

  console.log('All Subjects Found:', allSubjects);

  // If no subjects found, add placeholder subjects for A-Level
  if (allSubjects.size === 0) {
    console.warn('No subjects found in the data, adding placeholder subjects');

    // Add common A-Level subjects as placeholders
    const commonSubjects = [
      'General Studies',
      'History',
      'Physics',
      'Chemistry',
      'Kiswahili',
      'Advanced Mathematics',
      'Biology',
      'Geography',
      'English',
      'BAM',
      'Economics',
      'Literature'
    ];

    for (const subj of commonSubjects) {
      allSubjects.add(subj);
    }
  }

  // Add combination-specific subjects based on the selected combination filter
  if (selectedCombination !== 'all') {
    const combinationSubjects = {
      'PCM': ['Physics', 'Chemistry', 'Mathematics', 'Advanced Mathematics'],
      'PCB': ['Physics', 'Chemistry', 'Biology'],
      'HKL': ['History', 'Kiswahili', 'Literature', 'English Literature'],
      'HGE': ['History', 'Geography', 'Economics'],
      'EGM': ['Economics', 'Geography', 'Mathematics', 'Advanced Mathematics']
    };

    // Add the subjects for the selected combination if they don't already exist
    if (combinationSubjects[selectedCombination]) {
      for (const subj of combinationSubjects[selectedCombination]) {
        allSubjects.add(subj);
      }
    }
  }

  // Convert to array and sort alphabetically
  const uniqueSubjects = Array.from(allSubjects).sort();

  // Log the final list of subjects
  console.log('Final list of subjects to display:', uniqueSubjects);

  return (
    <Box id="enhanced-a-level-report-container" className="enhanced-a-level-class-report" sx={{ p: 2 }}>
      {errorAlert}
      {/* Report Header */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h5" align="center" gutterBottom>
          St. John Vianney Secondary School
        </Typography>
        <Typography variant="h4" align="center" gutterBottom>
          St. John Vianney School Management System
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          PO Box 123, Dar es Salaam, Tanzania
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          Tel: +255 123 456 789 | Email: info@stjohnvianney.edu.tz
        </Typography>
        <Typography variant="h5" align="center" sx={{ mt: 2, fontWeight: 'bold' }}>
          {typeof reportData.year === 'object' ? reportData.year.year || new Date().getFullYear() : reportData.year || new Date().getFullYear()} FORM FIVE EXAMINATION RESULTS
        </Typography>
        <Typography variant="body1" align="center" sx={{ mt: 1 }}>
          Total Students: {totalStudents}
        </Typography>
        <Typography variant="body1" align="center">
          Form: {selectedForm === 'all' ? 'All Forms' : `Form ${selectedForm}`}
        </Typography>
        <Typography variant="body1" align="center">
          Combination: {selectedCombination === 'all' ? 'All Combinations' : selectedCombination}
        </Typography>
        <Typography variant="body1" align="center">
          Date: {new Date().toLocaleDateString()}
        </Typography>
      </Paper>

      {/* Division Summary */}
      <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
        <Typography variant="body1" align="center" sx={{ fontWeight: 'bold' }}>
          DIV-I: {reportData.divisionSummary?.I || 0} |
          DIV-II: {reportData.divisionSummary?.II || 0} |
          DIV-III: {reportData.divisionSummary?.III || 0} |
          DIV-IV: {reportData.divisionSummary?.IV || 0} |
          DIV-0: {reportData.divisionSummary?.['0'] || 0}
        </Typography>
      </Paper>

      {/* Filtering Controls */}
      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Filter by Form</InputLabel>
              <Select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                label="Filter by Form"
              >
                <MenuItem value="all">All Forms</MenuItem>
                <MenuItem value="5">Form 5</MenuItem>
                <MenuItem value="6">Form 6</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Filter by Combination</InputLabel>
              <Select
                value={selectedCombination}
                onChange={(e) => setSelectedCombination(e.target.value)}
                label="Filter by Combination"
              >
                <MenuItem value="all">All Combinations</MenuItem>
                <MenuItem value="PCM">PCM</MenuItem>
                <MenuItem value="PCB">PCB</MenuItem>
                <MenuItem value="HKL">HKL</MenuItem>
                <MenuItem value="HGE">HGE</MenuItem>
                <MenuItem value="EGM">EGM</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadExcel}
          >
            Download Excel
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Grid>
        <Grid item xs />
        <Grid item>
          <Button
            variant={viewMode === 'individual' ? 'contained' : 'outlined'}
            onClick={() => handleViewModeChange('individual')}
            sx={{ mr: 1 }}
          >
            Individual Results
          </Button>
          <Button
            variant={viewMode === 'summary' ? 'contained' : 'outlined'}
            onClick={() => handleViewModeChange('summary')}
          >
            School Summary
          </Button>
        </Grid>
        <Grid item>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Students Per Page</InputLabel>
            <Select
              value={studentsPerPage}
              onChange={(e) => setStudentsPerPage(e.target.value)}
              label="Students Per Page"
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={15}>15</MenuItem>
              <MenuItem value={20}>20</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {viewMode === 'individual' ? (
        <>
          {/* Student Results Table */}
          <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 600, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: 3 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      backgroundColor: '#f5f5f5',
                      position: 'sticky',
                      left: 0,
                      zIndex: 2
                    }}
                  >
                    #
                  </TableCell>
                  <TableCell
                    onClick={() => handleSortChange('studentName')}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      backgroundColor: '#f5f5f5',
                      position: 'sticky',
                      left: '40px',
                      zIndex: 2,
                      minWidth: '200px'
                    }}
                  >
                    STUDENT NAME {sortField === 'studentName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>SEX</TableCell>
                  <TableCell
                    align="center"
                    onClick={() => handleSortChange('points')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    POINT {sortField === 'points' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell
                    align="center"
                    onClick={() => handleSortChange('division')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    DIVISION {sortField === 'division' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableCell>

                  {/* Subject Columns - All possible subjects */}
                  {uniqueSubjects.map((subjectName) => {
                    // Create a shorter display name for the column header
                    const displayName = subjectName.length > 10 ?
                      subjectName.split(' ').map(word => word.charAt(0)).join('') :
                      subjectName;

                    return (
                      <TableCell
                        key={subjectName}
                        align="center"
                        sx={{
                          fontWeight: 'bold',
                          backgroundColor: '#e3f2fd',
                          minWidth: '80px',
                          border: '1px solid #bbdefb',
                          '&:hover': {
                            backgroundColor: '#bbdefb',
                          }
                        }}
                        title={subjectName} // Show full name on hover
                      >
                        {displayName}
                        <Tooltip title={subjectName} placement="top">
                          <Box component="span" sx={{ display: 'inline-block', ml: 0.5, cursor: 'help', fontSize: '0.8rem' }}>ⓘ</Box>
                        </Tooltip>
                      </TableCell>
                    );
                  })}

                  {/* Summary Columns */}
                  <TableCell
                    align="center"
                    onClick={() => handleSortChange('totalMarks')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    TOTAL {sortField === 'totalMarks' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell
                    align="center"
                    onClick={() => handleSortChange('averageMarks')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    AVERAGE {sortField === 'averageMarks' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell
                    align="center"
                    onClick={() => handleSortChange('rank')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    RANK {sortField === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentStudents.length > 0 ? (
                  currentStudents.map((student, index) => {
                    // Check if this is a placeholder student (no real data)
                    const isPlaceholder = student.id?.startsWith('placeholder');

                    return (
                    <TableRow key={student.id || student.studentId || index} sx={isPlaceholder ? { opacity: 0.7, fontStyle: 'italic' } : {}}>
                      <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: '#f5f5f5', zIndex: 1 }}>{startIndex + index + 1}</TableCell>
                      <TableCell sx={{ position: 'sticky', left: '40px', backgroundColor: '#f5f5f5', zIndex: 1 }}>{student.studentName || `${student.firstName} ${student.lastName}`}</TableCell>
                      <TableCell>{student.sex || student.gender || '-'}</TableCell>
                      <TableCell align="center">{student.points || student.totalPoints || '-'}</TableCell>
                      <TableCell align="center">{student.division || '-'}</TableCell>

                      {/* Subject Marks - All possible subjects */}
                      {uniqueSubjects.map((subjectName) => {
                        // Find the subject result for this student
                        // This function is optimized to find subject results in any format
                        const findSubjectResult = (student, subjectName) => {
                          // Debug the subject search
                          console.log(`Looking for subject ${subjectName} for student ${student.studentName || student.id}`);

                          // STEP 1: Check in subjectResults array (normalized format)
                          if (Array.isArray(student.subjectResults)) {
                            const result = student.subjectResults.find(r => {
                              // Check for exact match in subject.name
                              if (r.subject?.name === subjectName) return true;

                              // Check for match in subject as string
                              if (r.subject === subjectName) return true;

                              // Check for match in name property
                              if (r.name === subjectName) return true;

                              // Check for partial match (case insensitive)
                              if (r.subject?.name && typeof r.subject.name === 'string' &&
                                  r.subject.name.toLowerCase().includes(subjectName.toLowerCase())) {
                                return true;
                              }

                              return false;
                            });

                            if (result) {
                              console.log('Found in subjectResults array:', result);
                              return result;
                            }
                          }

                          // STEP 2: Check in subjects array
                          if (Array.isArray(student.subjects)) {
                            const result = student.subjects.find(r => {
                              if (r.name === subjectName) return true;
                              if (r.subject?.name === subjectName) return true;
                              if (r.subject === subjectName) return true;
                              return false;
                            });

                            if (result) {
                              console.log('Found in subjects array:', result);
                              return result;
                            }
                          }

                          // STEP 3: Check in results array
                          if (Array.isArray(student.results)) {
                            const result = student.results.find(r => {
                              if (r.subject?.name === subjectName) return true;
                              if (r.subject === subjectName) return true;
                              if (r.name === subjectName) return true;
                              return false;
                            });

                            if (result) {
                              console.log('Found in results array:', result);
                              return result;
                            }
                          }

                          // STEP 4: Check if results is an object with subject names as keys
                          if (student.results && typeof student.results === 'object' && !Array.isArray(student.results)) {
                            if (student.results[subjectName] !== undefined) {
                              const result = {
                                subject: { name: subjectName },
                                marks: student.results[subjectName]
                              };
                              console.log('Found in results object:', result);
                              return result;
                            }
                          }

                          // STEP 5: Check if subject is directly in student object
                          if (student[subjectName] !== undefined) {
                            const result = {
                              subject: { name: subjectName },
                              marks: student[subjectName]
                            };
                            console.log('Found as direct property:', result);
                            return result;
                          }

                          // STEP 6: Try variations and abbreviations
                          // Define common variations and abbreviations
                          const variations = [
                            subjectName.toLowerCase(),
                            subjectName.toUpperCase(),
                            subjectName.replace(/\s+/g, ''),  // Remove spaces
                            subjectName.replace(/\s+/g, '_'),  // Replace spaces with underscores
                            subjectName.split(' ')[0]  // First word only
                          ];

                          // Add common abbreviations
                          const abbreviationMap = {
                            'General Studies': ['GS', 'GenStudies', 'G_Studies'],
                            'History': ['HIST', 'HST'],
                            'Physics': ['PHY', 'PHYS'],
                            'Chemistry': ['CHEM', 'CHM'],
                            'Kiswahili': ['KIS', 'KISW', 'SWA'],
                            'Advanced Mathematics': ['MATH', 'AMATH', 'ADV_MATH', 'AdvMath'],
                            'Biology': ['BIO', 'BIOL'],
                            'Geography': ['GEO', 'GEOG'],
                            'English': ['ENG', 'ENGL'],
                            'BAM': ['B.A.M', 'BookKeeping', 'Accounting'],
                            'Economics': ['ECON', 'ECO'],
                            'Literature': ['LIT', 'LITE']
                          };

                          if (abbreviationMap[subjectName]) {
                            variations.push(...abbreviationMap[subjectName]);
                          }

                          // Check all variations
                          for (const variation of variations) {
                            // Check as direct property
                            if (student[variation] !== undefined) {
                              const result = {
                                subject: { name: subjectName },
                                marks: student[variation]
                              };
                              console.log(`Found using variation ${variation} as direct property:`, result);
                              return result;
                            }

                            // Check in results object
                            if (student.results && typeof student.results === 'object' && !Array.isArray(student.results)) {
                              if (student.results[variation] !== undefined) {
                                const result = {
                                  subject: { name: subjectName },
                                  marks: student.results[variation]
                                };
                                console.log(`Found using variation ${variation} in results object:`, result);
                                return result;
                              }
                            }

                            // Check in subjectResults array with variation
                            if (Array.isArray(student.subjectResults)) {
                              const result = student.subjectResults.find(r => {
                                if (r.subject?.name === variation) return true;
                                if (r.subject === variation) return true;
                                if (r.name === variation) return true;
                                return false;
                              });

                              if (result) {
                                console.log(`Found in subjectResults using variation ${variation}:`, result);
                                return result;
                              }
                            }
                          }

                          // STEP 7: Check if subject is part of combination
                          if (student.combination && typeof student.combination === 'string') {
                            const combinationMap = {
                              'P': 'Physics',
                              'C': 'Chemistry',
                              'M': 'Mathematics',
                              'B': 'Biology',
                              'G': 'Geography',
                              'H': 'History',
                              'K': 'Kiswahili',
                              'L': 'Literature',
                              'E': 'Economics'
                            };

                            // Check if this subject is part of the combination
                            for (const [code, name] of Object.entries(combinationMap)) {
                              if (name === subjectName && student.combination.includes(code)) {
                                const result = {
                                  subject: { name: subjectName },
                                  marks: null,
                                  fromCombination: true
                                };
                                console.log(`Subject ${subjectName} found in combination ${student.combination}:`, result);
                                return result;
                              }
                            }
                          }

                          // Subject not found
                          console.log(`Subject ${subjectName} not found for student ${student.studentName || student.id}`);
                          return null;
                        };

                        // Find the subject result
                        const subjectResult = findSubjectResult(student, subjectName);

                        // Get the marks, handling missing values and different formats
                        const marks = subjectResult?.marks ||
                                    subjectResult?.marksObtained ||
                                    subjectResult?.grade ||
                                    (subjectResult?.present ? subjectResult.marks : '-');

                        console.log(`Final marks for ${subjectName}:`, marks);

                        return (
                          <TableCell
                            key={`${student.id || student._id || index}-${subjectName}`}
                            align="center"
                            sx={{
                              backgroundColor: marks ? '#e8f5e9' : '#f5f5f5',
                              border: '1px solid #c8e6c9',
                              fontWeight: marks ? 'bold' : 'normal',
                              color: marks ? (marks >= 50 ? '#2e7d32' : '#d32f2f') : '#757575'
                            }}
                          >
                            {marks === null || marks === undefined ? '-' : marks}
                          </TableCell>
                        );
                      })}

                      {/* Summary Columns */}
                      <TableCell align="center">{student.totalMarks || '-'}</TableCell>
                      <TableCell align="center">{student.averageMarks || '-'}</TableCell>
                      <TableCell align="center">{student.rank || '-'}</TableCell>
                    </TableRow>
                    );
                  })
                ) : (
                  // Show a placeholder row with all subject columns
                  <TableRow>
                    <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: '#f5f5f5', zIndex: 1 }}>1</TableCell>
                    <TableCell sx={{ position: 'sticky', left: '40px', backgroundColor: '#f5f5f5', zIndex: 1 }}>No Data Available</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell align="center">-</TableCell>
                    <TableCell align="center">-</TableCell>

                    {/* Show all subject columns with placeholders */}
                    {uniqueSubjects.map((subjectName) => (
                      <TableCell
                        key={`placeholder-${subjectName}`}
                        align="center"
                        sx={{
                          backgroundColor: '#f5f5f5',
                          border: '1px solid #c8e6c9',
                          color: '#757575'
                        }}
                      >
                        -
                      </TableCell>
                    ))}

                    <TableCell align="center">-</TableCell>
                    <TableCell align="center">-</TableCell>
                    <TableCell align="center">-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {/* Pagination Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Typography variant="body2">
              Page {currentPage} of {totalPages}
            </Typography>
          </Box>

          {/* Legend */}
          <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
            <Typography variant="subtitle2" gutterBottom>
              Legend:
            </Typography>
            <Grid container spacing={2}>
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#e3f2fd', border: '1px solid #bbdefb', mr: 1 }} />
                  <Typography variant="body2">Subject Column</Typography>
                </Box>
              </Grid>
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', mr: 1 }} />
                  <Typography variant="body2">Subject with Marks</Typography>
                </Box>
              </Grid>
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', mr: 1 }} />
                  <Typography variant="body2">No Marks Available</Typography>
                </Box>
              </Grid>
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 'bold', mr: 1 }}>50+</Typography>
                  <Typography variant="body2">Passing Mark</Typography>
                </Box>
              </Grid>
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 'bold', mr: 1 }}>Below 50</Typography>
                  <Typography variant="body2">Failing Mark</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </>
      ) : (
        <>
          {/* School Summary Report */}
          <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Overall Performance
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  Total Passed Candidates: {reportData.overallPerformance?.totalPassed || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  Examination GPA: {reportData.overallPerformance?.examGpa || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Division Summary Table */}
          <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Division Summary
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="center">REGISTERED</TableCell>
                    <TableCell align="center">ABSENT</TableCell>
                    <TableCell align="center">SAT</TableCell>
                    <TableCell align="center">DIV I</TableCell>
                    <TableCell align="center">DIV II</TableCell>
                    <TableCell align="center">DIV III</TableCell>
                    <TableCell align="center">DIV IV</TableCell>
                    <TableCell align="center">DIV 0</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell align="center">{totalStudents}</TableCell>
                    <TableCell align="center">0</TableCell>
                    <TableCell align="center">{totalStudents}</TableCell>
                    <TableCell align="center">{reportData.divisionSummary?.I || 0}</TableCell>
                    <TableCell align="center">{reportData.divisionSummary?.II || 0}</TableCell>
                    <TableCell align="center">{reportData.divisionSummary?.III || 0}</TableCell>
                    <TableCell align="center">{reportData.divisionSummary?.IV || 0}</TableCell>
                    <TableCell align="center">{reportData.divisionSummary?.['0'] || 0}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Subject-Wise Performance Summary */}
          <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Subject-Wise Performance Summary
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>SUBJECT NAME</TableCell>
                    <TableCell align="center">REG</TableCell>
                    <TableCell align="center">A</TableCell>
                    <TableCell align="center">B</TableCell>
                    <TableCell align="center">C</TableCell>
                    <TableCell align="center">D</TableCell>
                    <TableCell align="center">E</TableCell>
                    <TableCell align="center">S</TableCell>
                    <TableCell align="center">F</TableCell>
                    <TableCell align="center">PASS</TableCell>
                    <TableCell align="center">GPA</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.keys(reportData.subjectPerformance || {}).length > 0 ? (
                    Object.values(reportData.subjectPerformance).map((subject) => (
                      <TableRow key={subject.name}>
                        <TableCell>{subject.name}</TableCell>
                        <TableCell align="center">{subject.registered}</TableCell>
                        <TableCell align="center">{subject.grades.A}</TableCell>
                        <TableCell align="center">{subject.grades.B}</TableCell>
                        <TableCell align="center">{subject.grades.C}</TableCell>
                        <TableCell align="center">{subject.grades.D}</TableCell>
                        <TableCell align="center">{subject.grades.E}</TableCell>
                        <TableCell align="center">{subject.grades.S}</TableCell>
                        <TableCell align="center">{subject.grades.F}</TableCell>
                        <TableCell align="center">{subject.passed}</TableCell>
                        <TableCell align="center">{subject.gpa}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // If no subject performance data, show placeholder rows for common subjects
                    ['General Studies', 'Chemistry', 'Physics', 'Biology', 'Geography', 'Advanced Mathematics', 'History', 'English Language', 'Economics', 'Kiswahili', 'BAM'].map((subjectName) => (
                      <TableRow key={subjectName}>
                        <TableCell>{subjectName}</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">0</TableCell>
                        <TableCell align="center">N/A</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Approvals Section */}
      {showApprovals && (
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h6" gutterBottom>
            APPROVED BY
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">ACADEMIC TEACHER NAME: _______________________</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">SIGN: _______________________</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">HEAD OF SCHOOL NAME: _______________________</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">SIGN: _______________________</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

EnhancedALevelClassReport.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onDownload: PropTypes.func,
  onPrint: PropTypes.func
};

export default EnhancedALevelClassReport;
