import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
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
  Button,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Chip,
  TextField,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import ReliablePdfDownload from '../common/ReliablePdfDownload';

import './ClassTabularReport.css';

/**
 * ClassTabularReport Component
 * Displays a comprehensive academic report for an entire class in a tabular format
 * with all students from different subject combinations in a single view
 */
// Circuit breaker to prevent infinite loops
if (!window.reportRenderCount) {
  window.reportRenderCount = 0;
}

const ClassTabularReport = () => {
  // Circuit breaker to prevent infinite loops
  window.reportRenderCount++;
  console.log(`Render count: ${window.reportRenderCount}`);

  // If we've rendered too many times, force demo data mode
  if (window.reportRenderCount > 5 && !window.useDemoDataForced) {
    console.error('Too many renders detected. Forcing demo data mode to prevent infinite loops.');
    window.useDemoDataForced = true;

    // Show an alert to the user
    setTimeout(() => {
      alert('The report was reloading too many times. Demo data mode has been enabled to prevent an infinite loop. Use the "Reset Circuit Breaker & Reload" button in the debug section to try again with real data.');
    }, 500);
  }

  // Emergency circuit breaker - if we're still rendering too much, stop completely
  if (window.reportRenderCount > 10) {
    console.error('Emergency circuit breaker activated - stopping all renders');
    return <div className="emergency-circuit-breaker">
      <h2>Emergency Circuit Breaker Activated</h2>
      <p>The report was reloading too many times and has been stopped to prevent browser crashes.</p>
      <button onClick={() => {
        // Reset all flags
        window.reportRenderCount = 0;
        window.useDemoDataForced = false;
        window.formAssignmentDone = false;
        window.formNotificationShown = false;
        window.formUpdateInProgress = false;
        window.combinationFetchInProgress = false;
        window.studentsUpdateInProgress = false;
        window.combinationsUpdateInProgress = false;
        window.fetchErrorCount = 0;
        // Reload the page
        window.location.reload();
      }}>Reset & Reload Page</button>
    </div>;
  }

  const { classId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examData, setExamData] = useState(null);
  const [filterCombination, setFilterCombination] = useState('');
  const [updatingEducationLevel, setUpdatingEducationLevel] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [filterForm, setFilterForm] = useState('');
  const [combinations, setCombinations] = useState([]);
  const [combinationDetails, setCombinationDetails] = useState({});
  // Add academicYear and term state variables with default values
  const [academicYear, setAcademicYear] = useState('current');
  const [term, setTerm] = useState('current');
  // State to control when to generate demo data
  const [useDemoData, setUseDemoData] = useState(window.useDemoDataForced || false);

  // Force demo data mode if the circuit breaker was triggered
  useEffect(() => {
    if (window.useDemoDataForced && !useDemoData) {
      console.log('Forcing demo data mode due to circuit breaker');
      setUseDemoData(true);
    }
  }, [useDemoData]);

  // Extract query parameters from URL
  useEffect(() => {
    try {
      const queryParams = new URLSearchParams(window.location.search);
      const yearParam = queryParams.get('academicYear');
      const termParam = queryParams.get('term');

      if (yearParam) {
        setAcademicYear(yearParam);
      }

      if (termParam) {
        setTerm(termParam);
      }
    } catch (err) {
      console.error('Error parsing URL parameters:', err);
      // Use default values if there's an error
      setAcademicYear('current');
      setTerm('current');
    }
  }, []);

  // Generate demo data for testing
  const generateDemoData = useCallback(() => {
    // Define standard subject combinations
    const standardCombinations = {
      'PCM': { name: 'PCM - Physics, Chemistry, Mathematics', subjects: ['PHY', 'CHE', 'MAT'] },
      'PCB': { name: 'PCB - Physics, Chemistry, Biology', subjects: ['PHY', 'CHE', 'BIO'] },
      'CBG': { name: 'CBG - Chemistry, Biology, Geography', subjects: ['CHE', 'BIO', 'GEO'] },
      'HKL': { name: 'HKL - History, Kiswahili, Literature', subjects: ['HIS', 'KIS', 'LIT'] },
      'HGE': { name: 'HGE - History, Geography, Economics', subjects: ['HIS', 'GEO', 'ECO'] },
      'EGM': { name: 'EGM - Economics, Geography, Mathematics', subjects: ['ECO', 'GEO', 'MAT'] }
    };

    // Define all possible subjects
    const allPossibleSubjects = [
      { code: 'PHY', name: 'Physics', isPrincipal: true },
      { code: 'CHE', name: 'Chemistry', isPrincipal: true },
      { code: 'MAT', name: 'Mathematics', isPrincipal: true },
      { code: 'BIO', name: 'Biology', isPrincipal: true },
      { code: 'GEO', name: 'Geography', isPrincipal: true },
      { code: 'HIS', name: 'History', isPrincipal: true },
      { code: 'KIS', name: 'Kiswahili', isPrincipal: true },
      { code: 'LIT', name: 'Literature', isPrincipal: true },
      { code: 'ECO', name: 'Economics', isPrincipal: true },
      { code: 'GS', name: 'General Studies', isPrincipal: false },
      { code: 'BAM', name: 'Basic Applied Mathematics', isPrincipal: false },
      { code: 'ENG', name: 'English Language', isPrincipal: false }
    ];

    // Generate demo students based on actual students in the class
    const demoStudents = [];

    // Helper function to get random marks
    const getRandomMarks = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Helper function to get grade from marks
    const getGrade = (marks) => {
      if (marks >= 80) return 'A';
      if (marks >= 70) return 'B';
      if (marks >= 60) return 'C';
      if (marks >= 50) return 'D';
      if (marks >= 40) return 'E';
      return 'F';
    };

    // Helper function to get points from grade
    const getPoints = (grade) => {
      switch (grade) {
        case 'A': return 1;
        case 'B': return 2;
        case 'C': return 3;
        case 'D': return 4;
        case 'E': return 5;
        case 'F': return 6;
        default: return null;
      }
    };

    // Use existing students if available, otherwise create demo students
    if (students && students.length > 0) {
      console.log('Generating demo data based on existing students:', students.length);

      // Create demo students based on actual students
      for (const student of students) {
        // Get or generate combination code
        let combinationCode = student.combination || student.subjectCombination || student.combinationCode;

        // Check if the combination is a MongoDB ObjectID (24 hex characters)
        const isMongoId = typeof combinationCode === 'string' && /^[0-9a-fA-F]{24}$/.test(combinationCode);

        if (isMongoId || !combinationCode) {
          // Generate a combination code based on student ID
          const studentIdStr = String(student._id || student.id || '');
          const lastChar = studentIdStr.charAt(studentIdStr.length - 1);

          if (['0', '1', '2', '3'].includes(lastChar)) {
            combinationCode = 'PCM';
          } else if (['4', '5', '6'].includes(lastChar)) {
            combinationCode = 'HKL';
          } else if (['7', '8'].includes(lastChar)) {
            combinationCode = 'EGM';
          } else {
            combinationCode = 'CBG';
          }
        }

        // Determine which subjects this student takes based on combination
        let studentSubjects = [];

        // Get the standard combination details
        const combinationDetails = standardCombinations[combinationCode] || {
          name: combinationCode,
          subjects: ['PHY', 'CHE', 'MAT'] // Default to PCM if combination not found
        };

        // Add principal subjects based on combination
        for (const subjectCode of combinationDetails.subjects) {
          const subject = allPossibleSubjects.find(s => s.code === subjectCode);
          if (subject) {
            studentSubjects.push({ ...subject, isPrincipal: true });
          }
        }

        // Add compulsory subjects for all students
        studentSubjects.push(
          { ...allPossibleSubjects.find(s => s.code === 'GS'), isPrincipal: false },
          { ...allPossibleSubjects.find(s => s.code === 'BAM'), isPrincipal: false },
          { ...allPossibleSubjects.find(s => s.code === 'ENG'), isPrincipal: false }
        );

        // Generate marks, grades, and points for each subject
        // Form 6 students generally perform better than Form 5
        const isForm5 = student.form === 5 || student.form === '5';
        const isForm6 = student.form === 6 || student.form === '6';
        const form = isForm5 ? 5 : isForm6 ? 6 : 5; // Default to Form 5 if not specified

        const minMarks = isForm6 ? 50 : 40;
        const maxMarks = isForm6 ? 95 : 90;

        studentSubjects = studentSubjects.map(subject => {
          const marks = getRandomMarks(minMarks, maxMarks);
          const grade = getGrade(marks);
          const points = getPoints(grade);
          return { ...subject, marks, grade, points };
        });

        // Calculate total marks and points
        const totalMarks = studentSubjects.reduce((sum, s) => sum + s.marks, 0);
        const totalPoints = studentSubjects.reduce((sum, s) => sum + s.points, 0);
        const averageMarks = (totalMarks / studentSubjects.length).toFixed(2);

        // Calculate best three principal points
        const principalSubjects = studentSubjects.filter(s => s.isPrincipal);
        const bestThreePrincipal = [...principalSubjects].sort((a, b) => a.points - b.points).slice(0, 3);
        const bestThreePoints = bestThreePrincipal.reduce((sum, s) => sum + s.points, 0);

        // Determine division
        let division = 'N/A';
        if (bestThreePoints >= 3 && bestThreePoints <= 9) division = 'I';
        else if (bestThreePoints >= 10 && bestThreePoints <= 12) division = 'II';
        else if (bestThreePoints >= 13 && bestThreePoints <= 17) division = 'III';
        else if (bestThreePoints >= 18 && bestThreePoints <= 19) division = 'IV';
        else if (bestThreePoints >= 20 && bestThreePoints <= 21) division = 'V';

        // Create demo student object based on actual student
        const demoStudent = {
          ...student,
          combination: combinationCode,
          combinationCode: combinationCode,
          combinationName: combinationDetails.name,
          subjects: studentSubjects,
          form: form,
          summary: {
            totalMarks,
            averageMarks,
            totalPoints,
            bestThreePoints,
            division,
            rank: 0 // Will be recalculated later
          }
        };

        demoStudents.push(demoStudent);
      }

      // Calculate ranks based on best three points (separately for Form 5 and Form 6)
      const form5Students = demoStudents.filter(s => s.form === 5 || s.form === '5');
      const form6Students = demoStudents.filter(s => s.form === 6 || s.form === '6');

      // Sort and assign ranks for Form 5 (lower points = better rank)
      form5Students.sort((a, b) => a.summary.bestThreePoints - b.summary.bestThreePoints);
      for (let i = 0; i < form5Students.length; i++) {
        form5Students[i].summary.rank = i + 1;
      }

      // Sort and assign ranks for Form 6 (lower points = better rank)
      form6Students.sort((a, b) => a.summary.bestThreePoints - b.summary.bestThreePoints);
      for (let i = 0; i < form6Students.length; i++) {
        form6Students[i].summary.rank = i + 1;
      }
    } else {
      // If no students exist, create demo students
      console.log('No existing students found. Creating generic demo students.');

      // Create demo combinations
      const subjectCombinations = Object.entries(standardCombinations).map(([code, details]) => ({
        code,
        name: details.name
      }));

      // Generate 24 students with different combinations (12 Form 5, 12 Form 6)
      for (let i = 1; i <= 24; i++) {
        // Determine if this is a Form 5 or Form 6 student
        const isForm5 = i <= 12;
        const form = isForm5 ? 5 : 6;

        // Assign a combination
        const combinationIndex = (i - 1) % subjectCombinations.length;
        const combination = subjectCombinations[combinationIndex];
        const combinationDetails = standardCombinations[combination.code];

        // Determine which subjects this student takes based on combination
        let studentSubjects = [];

        // Add principal subjects based on combination
        for (const subjectCode of combinationDetails.subjects) {
          const subject = allPossibleSubjects.find(s => s.code === subjectCode);
          if (subject) {
            studentSubjects.push({ ...subject, isPrincipal: true });
          }
        }

        // Add compulsory subjects for all students
        studentSubjects.push(
          { ...allPossibleSubjects.find(s => s.code === 'GS'), isPrincipal: false },
          { ...allPossibleSubjects.find(s => s.code === 'BAM'), isPrincipal: false },
          { ...allPossibleSubjects.find(s => s.code === 'ENG'), isPrincipal: false }
        );

        // Generate marks, grades, and points for each subject
        const minMarks = isForm5 ? 40 : 50;
        const maxMarks = isForm5 ? 90 : 95;

        studentSubjects = studentSubjects.map(subject => {
          const marks = getRandomMarks(minMarks, maxMarks);
          const grade = getGrade(marks);
          const points = getPoints(grade);
          return { ...subject, marks, grade, points };
        });

        // Calculate total marks and points
        const totalMarks = studentSubjects.reduce((sum, s) => sum + s.marks, 0);
        const totalPoints = studentSubjects.reduce((sum, s) => sum + s.points, 0);
        const averageMarks = (totalMarks / studentSubjects.length).toFixed(2);

        // Calculate best three principal points
        const principalSubjects = studentSubjects.filter(s => s.isPrincipal);
        const bestThreePrincipal = [...principalSubjects].sort((a, b) => a.points - b.points).slice(0, 3);
        const bestThreePoints = bestThreePrincipal.reduce((sum, s) => sum + s.points, 0);

        // Determine division
        let division = 'N/A';
        if (bestThreePoints >= 3 && bestThreePoints <= 9) division = 'I';
        else if (bestThreePoints >= 10 && bestThreePoints <= 12) division = 'II';
        else if (bestThreePoints >= 13 && bestThreePoints <= 17) division = 'III';
        else if (bestThreePoints >= 18 && bestThreePoints <= 19) division = 'IV';
        else if (bestThreePoints >= 20 && bestThreePoints <= 21) division = 'V';

        // Create student object
        const student = {
          id: `student-${i}`,
          _id: `demo-student-${i}`,
          name: `Student ${i}`,
          firstName: `Student`,
          lastName: `${i}`,
          admissionNumber: `F${form}-${i.toString().padStart(3, '0')}`,
          gender: i % 2 === 0 ? 'Male' : 'Female',
          combination: combination.code,
          combinationCode: combination.code,
          combinationName: combination.name,
          subjects: studentSubjects,
          form: form,
          summary: {
            totalMarks,
            averageMarks,
            totalPoints,
            bestThreePoints,
            division,
            rank: i // Will be recalculated later
          }
        };

        demoStudents.push(student);
      }

      // Calculate ranks based on best three points (separately for Form 5 and Form 6)
      const form5Students = demoStudents.filter(s => s.form === 5);
      const form6Students = demoStudents.filter(s => s.form === 6);

      // Sort and assign ranks for Form 5
      form5Students.sort((a, b) => a.summary.bestThreePoints - b.summary.bestThreePoints);
      for (let i = 0; i < form5Students.length; i++) {
        form5Students[i].summary.rank = i + 1;
      }

      // Sort and assign ranks for Form 6
      form6Students.sort((a, b) => a.summary.bestThreePoints - b.summary.bestThreePoints);
      for (let i = 0; i < form6Students.length; i++) {
        form6Students[i].summary.rank = i + 1;
      }
    }

    // Get all unique subjects across all students
    const uniqueSubjects = [];
    for (const student of demoStudents) {
      for (const subject of student.subjects) {
        if (!uniqueSubjects.some(s => s.code === subject.code)) {
          uniqueSubjects.push({
            code: subject.code,
            name: subject.name,
            isPrincipal: subject.isPrincipal
          });
        }
      }
    }

    // Sort subjects: principal subjects first, then subsidiary subjects
    uniqueSubjects.sort((a, b) => {
      // First sort by principal/subsidiary
      if (a.isPrincipal && !b.isPrincipal) return -1;
      if (!a.isPrincipal && b.isPrincipal) return 1;
      // Then sort alphabetically by code
      return a.code.localeCompare(b.code);
    });

    // Create combinations array from standardCombinations
    const combinations = Object.entries(standardCombinations).map(([code, details]) => ({
      code,
      name: details.name
    }));

    // Create class data
    const classData = {
      id: classId || 'demo-class',
      name: 'FORM V',
      educationLevel: 'A_LEVEL',
      academicYear: '2025-2026',
      term: 'Term 1',
      students: demoStudents,
      subjects: uniqueSubjects,
      combinations: combinations
    };

    // Create exam data
    const examData = {
      id: examId || 'demo-exam',
      name: 'Mid term1',
      startDate: '2025-04-10',
      endDate: '2025-04-20',
      term: 'Term 1',
      academicYear: '2025-2026'
    };

    return { classData, examData };
  }, [students, classId, examId]);

  // Fetch class and exam data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Reset any existing error state
      window.fetchErrorCount = window.fetchErrorCount || 0;

      // Log API URL configuration for debugging
      console.log('API URL configuration:', {
        REACT_APP_API_URL: process.env.REACT_APP_API_URL || '',
        REACT_APP_DISABLE_API_URL_FIXER: process.env.REACT_APP_DISABLE_API_URL_FIXER,
        sampleUrl: `${process.env.REACT_APP_API_URL || ''}/students`
      });

      // Log current state for debugging
      console.log('Current state before fetching data:');
      console.log('academicYear:', academicYear);
      console.log('term:', term);
      console.log('classId:', classId);
      console.log('examId:', examId);

      // Validate classId and examId
      if (!classId || classId === 'undefined' || classId === 'null') {
        setError('Invalid class ID. Please select a valid class.');
        setLoading(false);
        return;
      }

      if (!examId || examId === 'undefined' || examId === 'null') {
        setError('Invalid exam ID. Please select a valid exam.');
        setLoading(false);
        return;
      }

      // Check if this is a demo request, if useDemoData is true, or if the circuit breaker was triggered
      if (classId === 'demo-class' && examId === 'demo-exam' || useDemoData || window.useDemoDataForced) {
        console.log('Generating demo data');
        const { classData, examData } = generateDemoData();
        setClassData(classData);
        setExamData(examData);
        setStudents(classData.students);
        setSubjects(classData.subjects);
        setCombinations(classData.combinations);
        setLoading(false);

        // Show notification that demo data is being used
        setSnackbar({
          open: true,
          message: 'Using demo data with randomly generated marks. This is not real student data.',
          severity: 'info'
        });

        return;
      }

      // Construct the API URL with academicYear and term if available
      let classUrl = `${process.env.REACT_APP_API_URL || ''}/api/classes/${classId}`;

      // Add academicYear and term as query parameters if they are valid
      const queryParams = [];
      if (academicYear && academicYear !== 'current') {
        queryParams.push(`academicYear=${academicYear}`);
      }
      if (term && term !== 'current') {
        queryParams.push(`term=${term}`);
      }

      // Add query parameters to URL if any exist
      if (queryParams.length > 0) {
        classUrl += `?${queryParams.join('&')}`;
      }

      console.log('Fetching class data from:', classUrl);

      const classResponse = await axios.get(classUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const classData = classResponse.data;
      setClassData(classData);

      // Determine if this is Form 5 or Form 6 class
      const isForm5 = classData.name?.includes('5') || classData.form === 5 || classData.form === '5';
      const isForm6 = classData.name?.includes('6') || classData.form === 6 || classData.form === '6';

      // IMPORTANT: Determine education level based on multiple factors
      // 1. Check explicit educationLevel property
      // 2. Check class name for form indicators
      // 3. Check form property
      // Default to O_LEVEL for Forms 1-4 and A_LEVEL for Forms 5-6

      const isOLevelByName = classData.name && (
        classData.name.includes('Form 1') ||
        classData.name.includes('Form 2') ||
        classData.name.includes('Form 3') ||
        classData.name.includes('Form 4') ||
        classData.name.includes('Form I') ||
        classData.name.includes('Form II') ||
        classData.name.includes('Form III') ||
        classData.name.includes('Form IV')
      );

      const isOLevelByForm = classData.form && (
        classData.form === 1 || classData.form === 2 ||
        classData.form === 3 || classData.form === 4 ||
        classData.form === '1' || classData.form === '2' ||
        classData.form === '3' || classData.form === '4'
      );

      // Determine education level with explicit checks
      let educationLevel;
      if (classData.educationLevel) {
        // Use explicit education level if available
        educationLevel = classData.educationLevel;
      } else if (isOLevelByName || isOLevelByForm) {
        // Infer O_LEVEL from class name or form
        educationLevel = 'O_LEVEL';
      } else {
        // Default to A_LEVEL for Forms 5-6 or unknown
        educationLevel = 'A_LEVEL';
      }

      console.log(`Class education level determined as: ${educationLevel}`);
      console.log(`Class name: ${classData.name}, Form: ${classData.form}`);

      // If this is an O-Level class, redirect to the O-Level report component
      if (educationLevel === 'O_LEVEL') {
        console.log('This is an O-Level class. Redirecting to O-Level report component...');
        console.warn('WARNING: This component is designed for A-Level reports. O-Level classes should use the OLevelClassResultReport component.');

        // Construct the URL for the O-Level report
        const oLevelReportUrl = `/admin/enhanced-o-level-report/${classId}/${examId}`;
        console.log(`Redirecting to O-Level report at: ${oLevelReportUrl}`);

        // Show a snackbar message
        setSnackbar({
          open: true,
          message: 'Redirecting to O-Level report component...',
          severity: 'info'
        });

        // Set a timeout to allow the snackbar to be seen before redirecting
        setTimeout(() => {
          navigate(oLevelReportUrl);
        }, 1500);

        // Return early to prevent further loading
        return;
      }

      // If this is not an A-Level class, we'll adapt the data structure later

      // Construct the API URL with academicYear and term if available
      let examUrl = `${process.env.REACT_APP_API_URL || ''}/api/exams/${examId}`;

      // Add academicYear and term as query parameters if they are valid
      const examQueryParams = [];
      if (academicYear && academicYear !== 'current') {
        examQueryParams.push(`academicYear=${academicYear}`);
      }
      if (term && term !== 'current') {
        examQueryParams.push(`term=${term}`);
      }

      // Add query parameters to URL if any exist
      if (examQueryParams.length > 0) {
        examUrl += `?${examQueryParams.join('&')}`;
      }

      console.log('Fetching exam data from:', examUrl);

      const examResponse = await axios.get(examUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setExamData(examResponse.data);

      // Construct the API URL with academicYear and term if available
      let studentsUrl = `${process.env.REACT_APP_API_URL || ''}/api/students?class=${classId}`;

      // Add academicYear and term as query parameters if they are valid
      const studentsQueryParams = [];
      if (academicYear && academicYear !== 'current') {
        studentsQueryParams.push(`academicYear=${academicYear}`);
      }
      if (term && term !== 'current') {
        studentsQueryParams.push(`term=${term}`);
      }

      // Add query parameters to URL if any exist
      if (studentsQueryParams.length > 0) {
        studentsUrl += `&${studentsQueryParams.join('&')}`;
      }

      console.log('Fetching students from:', studentsUrl);

      const studentsResponse = await axios.get(studentsUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Fetch results for each student
      const studentsWithResults = await Promise.all(
        studentsResponse.data.map(async (student) => {
          try {
            // Try multiple API endpoints to ensure compatibility
            let resultsUrl = `${process.env.REACT_APP_API_URL || ''}/results/comprehensive/student/${student._id}/${examId}`;
            resultsUrl += `?academicYear=${academicYear}&term=${term}`;
            let resultsResponse;

            try {
              // Check if this is an O-Level class/student
              const isOLevel = educationLevel === 'O_LEVEL' ||
                             (student.educationLevel === 'O_LEVEL') ||
                             (student.form && (student.form === 1 || student.form === 2 ||
                                              student.form === 3 || student.form === 4 ||
                                              student.form === '1' || student.form === '2' ||
                                              student.form === '3' || student.form === '4'));

              if (isOLevel) {
                // For O-Level students, try the O-Level endpoint first
                resultsUrl = `${process.env.REACT_APP_API_URL || ''}/o-level-results/student/${student._id}/${examId}`;
                resultsUrl += `?academicYear=${academicYear}&term=${term}`;
                console.log(`Trying O-Level endpoint for student ${student._id}:`, resultsUrl);

                resultsResponse = await axios.get(resultsUrl, {
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                });
              } else {
                // For A-Level students, try the A-Level endpoint first
                resultsUrl = `${process.env.REACT_APP_API_URL || ''}/a-level-comprehensive/student/${student._id}/${examId}`;
                resultsUrl += `?academicYear=${academicYear}&term=${term}`;
                console.log(`Trying A-Level endpoint for student ${student._id}:`, resultsUrl);

                resultsResponse = await axios.get(resultsUrl, {
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                });
              }
            } catch (primaryError) {
              console.error(`Error with primary endpoint for student ${student._id}:`, primaryError);

              try {
                // Try the comprehensive endpoint as fallback
                resultsUrl = `${process.env.REACT_APP_API_URL || ''}/results/comprehensive/student/${student._id}/${examId}`;
                resultsUrl += `?academicYear=${academicYear}&term=${term}`;
                console.log(`Trying comprehensive fallback endpoint for student ${student._id}:`, resultsUrl);

                resultsResponse = await axios.get(resultsUrl, {
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                });
              } catch (fallbackError) {
                console.error(`Error with fallback endpoint for student ${student._id}:`, fallbackError);
                throw fallbackError; // Re-throw to be caught by the outer catch
              }
            }

            const resultData = resultsResponse.data;

            // Log the raw result data for debugging
            console.log('Raw result data for student:', student._id);
            console.log('Result data keys:', Object.keys(resultData));

            // Log subject-related data
            if (resultData.subjectResults) {
              console.log('subjectResults:', resultData.subjectResults);
            }
            if (resultData.subjects) {
              console.log('subjects:', resultData.subjects);
            }
            if (resultData.results) {
              console.log('results:', resultData.results);
            }

            // Check if this is an O-Level report and adapt the data structure
            // First check the class education level from classData
            const classEducationLevel = classData.educationLevel || 'A_LEVEL';

            // Then check the result data education level
            const resultEducationLevel = resultData.educationLevel || classEducationLevel;

            // Determine if this is O-Level or A-Level
            const isOLevel = resultEducationLevel === 'O_LEVEL' ||
                           (classEducationLevel === 'O_LEVEL' &&
                            resultData.subjectResults &&
                            !resultData.principalSubjects);

            console.log(`Processing ${isOLevel ? 'O-Level' : 'A-Level'} data for student ${student._id}`);
            console.log('Result data structure:', Object.keys(resultData));

            let allSubjects = [];

            if (isOLevel) {
              console.log('Processing O-Level report data for class report');
              // Convert O-Level data structure to our format
              allSubjects = (resultData.subjectResults || []).map(subject => ({
                subject: subject.subject?.name || subject.subjectName,
                code: subject.subject?.code || subject.subjectCode || '',
                marks: subject.marks,
                grade: subject.grade,
                points: subject.points,
                isPrincipal: true
              }));
            } else {
              console.log('Processing A-Level data structure for student');

              // Log the actual data structure for debugging
              if (resultData.principalSubjects) {
                console.log('Principal subjects:', resultData.principalSubjects);
              }
              if (resultData.subsidiarySubjects) {
                console.log('Subsidiary subjects:', resultData.subsidiarySubjects);
              }
              if (resultData.allSubjects) {
                console.log('All subjects:', resultData.allSubjects);
              }

              // Handle different A-Level data structures
              if (resultData.allSubjects && Array.isArray(resultData.allSubjects) && resultData.allSubjects.length > 0) {
                // Use the allSubjects array if available (this is the most reliable source)
                console.log('Using allSubjects array for processing');
                allSubjects = resultData.allSubjects.map(s => ({
                  ...s,
                  isPrincipal: s.isPrincipal !== undefined ? s.isPrincipal : true,
                  // Ensure consistent structure
                  subject: s.subject?.name || s.subject || s.name,
                  code: s.code || s.subject?.code || (s.subject?.name ? s.subject.name.substring(0, 3).toUpperCase() : ''),
                  marks: s.marks !== undefined ? s.marks : (s.marksObtained !== undefined ? s.marksObtained : null),
                  grade: s.grade || '-',
                  points: s.points || 0
                }));
              } else if (resultData.principalSubjects || resultData.subsidiarySubjects) {
                // Standard A-Level structure with principal and subsidiary subjects
                console.log('Using principalSubjects and subsidiarySubjects arrays for processing');
                allSubjects = [
                  ...(resultData.principalSubjects || []).map(s => ({
                    ...s,
                    isPrincipal: true,
                    // Ensure consistent structure
                    subject: s.subject?.name || s.subject || s.name,
                    code: s.code || s.subject?.code || (s.subject?.name ? s.subject.name.substring(0, 3).toUpperCase() : ''),
                    marks: s.marks !== undefined ? s.marks : (s.marksObtained !== undefined ? s.marksObtained : null),
                    grade: s.grade || '-',
                    points: s.points || 0
                  })),
                  ...(resultData.subsidiarySubjects || []).map(s => ({
                    ...s,
                    isPrincipal: false,
                    // Ensure consistent structure
                    subject: s.subject?.name || s.subject || s.name,
                    code: s.code || s.subject?.code || (s.subject?.name ? s.subject.name.substring(0, 3).toUpperCase() : ''),
                    marks: s.marks !== undefined ? s.marks : (s.marksObtained !== undefined ? s.marksObtained : null),
                    grade: s.grade || '-',
                    points: s.points || 0
                  }))
                ];
              } else if (resultData.subjectResults) {
                // Alternative structure with subjectResults array
                allSubjects = (resultData.subjectResults || []).map(s => ({
                  ...s,
                  isPrincipal: s.isPrincipal || true,  // Default to principal if not specified
                  // Ensure consistent structure
                  subject: s.subject?.name || s.subject || s.name,
                  code: s.code || s.subject?.code || '',
                  marks: s.marks !== undefined ? s.marks : (s.marksObtained !== undefined ? s.marksObtained : null),
                  grade: s.grade || '-',
                  points: s.points || 0
                }));
              } else if (resultData.subjects) {
                // Another alternative with subjects array
                allSubjects = (resultData.subjects || []).map(s => ({
                  ...s,
                  isPrincipal: s.isPrincipal || true,  // Default to principal if not specified
                  // Ensure consistent structure
                  subject: s.subject?.name || s.subject || s.name,
                  code: s.code || s.subject?.code || '',
                  marks: s.marks !== undefined ? s.marks : (s.marksObtained !== undefined ? s.marksObtained : null),
                  grade: s.grade || '-',
                  points: s.points || 0
                }));
              } else if (resultData.results && Array.isArray(resultData.results)) {
                // Yet another alternative with results array
                allSubjects = (resultData.results || []).map(s => ({
                  ...s,
                  isPrincipal: s.isPrincipal || true,  // Default to principal if not specified
                  // Ensure consistent structure
                  subject: s.subject?.name || s.subject || s.name,
                  code: s.code || s.subject?.code || '',
                  marks: s.marks !== undefined ? s.marks : (s.marksObtained !== undefined ? s.marksObtained : null),
                  grade: s.grade || '-',
                  points: s.points || 0
                }));
              } else {
                // If no recognized structure, log an error and return empty array
                console.error('Unrecognized A-Level data structure:', resultData);
                allSubjects = [];
              }

              // Log the processed subjects
              console.log(`Processed ${allSubjects.length} subjects for A-Level student:`,
                allSubjects.map(s => `${s.subject} (${s.code}): ${s.marks}`))
            }

            // Check if we have a combination code but no subjects
            if (allSubjects.length === 0 && (student.combination || student.subjectCombination)) {
              // First, try to fetch actual marks data for this student
              try {
                console.log(`Attempting to fetch actual marks data for student ${student._id}`);
                const marksUrl = `${process.env.REACT_APP_API_URL || ''}/v2/results/student/${student._id}?examId=${examId}&academicYear=${academicYear}&term=${term}`;

                const marksResponse = await axios.get(marksUrl, {
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                });

                console.log('Marks data response:', marksResponse.data);

                if (marksResponse.data && Array.isArray(marksResponse.data) && marksResponse.data.length > 0) {
                  // Convert the marks data to our subject format
                  allSubjects = marksResponse.data.map(result => ({
                    subject: result.subject?.name || result.subjectName,
                    code: result.subject?.code || result.subjectCode || '',
                    marks: result.marksObtained,
                    grade: result.grade,
                    points: result.points,
                    isPrincipal: result.isPrincipal !== undefined ? result.isPrincipal : true
                  }));

                  console.log(`Successfully fetched ${allSubjects.length} subjects with marks for student ${student._id}`);
                }
              } catch (error) {
                console.error(`Error fetching marks data from v2 API for student ${student._id}:`, error);

                // Try the direct marks API as a fallback
                try {
                  console.log(`Attempting to fetch marks from direct API for student ${student._id}`);
                  const directMarksUrl = `${process.env.REACT_APP_API_URL || ''}/marks?studentId=${student._id}&examId=${examId}`;

                  const directMarksResponse = await axios.get(directMarksUrl, {
                    headers: {
                      'Accept': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  });

                  console.log('Direct marks data response:', directMarksResponse.data);

                  if (directMarksResponse.data && Array.isArray(directMarksResponse.data) && directMarksResponse.data.length > 0) {
                    // Convert the marks data to our subject format
                    allSubjects = directMarksResponse.data.map(result => ({
                      subject: result.subject?.name || result.subjectName,
                      code: result.subject?.code || result.subjectCode || '',
                      marks: result.marksObtained || result.marks,
                      grade: result.grade,
                      points: result.points,
                      isPrincipal: result.isPrincipal !== undefined ? result.isPrincipal : true
                    }));

                    console.log(`Successfully fetched ${allSubjects.length} subjects with marks from direct API for student ${student._id}`);
                  }
                } catch (directError) {
                  console.error(`Error fetching marks from direct API for student ${student._id}:`, directError);

                  // Try the education level specific APIs as a last resort
                  try {
                    // Determine if this is likely an A-Level or O-Level student
                    const isLikelyALevel = student.form === 5 || student.form === 6 ||
                                         student.form === '5' || student.form === '6' ||
                                         (student.className && (student.className.includes('5') || student.className.includes('6')));

                    const apiEndpoint = isLikelyALevel ?
                      `a-level-results/student-marks/${student._id}/${examId}` :
                      `o-level-results/student-marks/${student._id}/${examId}`;

                    console.log(`Attempting to fetch marks from ${isLikelyALevel ? 'A-Level' : 'O-Level'} API for student ${student._id}`);
                    const levelSpecificUrl = `${process.env.REACT_APP_API_URL || ''}/${apiEndpoint}`;

                    const levelSpecificResponse = await axios.get(levelSpecificUrl, {
                      headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    });

                    console.log(`${isLikelyALevel ? 'A-Level' : 'O-Level'} marks data response:`, levelSpecificResponse.data);

                    if (levelSpecificResponse.data &&
                        (Array.isArray(levelSpecificResponse.data) ||
                         levelSpecificResponse.data.subjects ||
                         levelSpecificResponse.data.results)) {

                      // Extract the relevant data array
                      const resultsArray = Array.isArray(levelSpecificResponse.data) ?
                                          levelSpecificResponse.data :
                                          levelSpecificResponse.data.subjects ||
                                          levelSpecificResponse.data.results ||
                                          [];

                      if (Array.isArray(resultsArray) && resultsArray.length > 0) {
                        // Convert the marks data to our subject format
                        allSubjects = resultsArray.map(result => ({
                          subject: result.subject?.name || result.subjectName || result.name,
                          code: result.subject?.code || result.subjectCode || result.code || '',
                          marks: result.marksObtained || result.marks || result.mark,
                          grade: result.grade,
                          points: result.points,
                          isPrincipal: result.isPrincipal !== undefined ? result.isPrincipal : true
                        }));

                        console.log(`Successfully fetched ${allSubjects.length} subjects with marks from ${isLikelyALevel ? 'A-Level' : 'O-Level'} API for student ${student._id}`);
                      }
                    }
                  } catch (levelSpecificError) {
                    console.error(`Error fetching marks from education level specific API for student ${student._id}:`, levelSpecificError);

                    // As a last resort, try to fetch marks for individual subjects
                    try {
                      console.log(`Attempting to fetch individual subject marks for student ${student._id}`);

                      // Get the student's combination code
                      const combinationCode = student.combination || student.subjectCombination || student.combinationCode;

                      if (combinationCode && typeof combinationCode === 'string' && combinationCode.length <= 5) {
                        console.log(`Using combination code ${combinationCode} to fetch individual subject marks`);

                        // Define the subject mapping
                        const combinationMap = {
                          'P': { code: 'PHY', name: 'Physics', isPrincipal: true },
                          'C': { code: 'CHE', name: 'Chemistry', isPrincipal: true },
                          'M': { code: 'MAT', name: 'Mathematics', isPrincipal: true },
                          'B': { code: 'BIO', name: 'Biology', isPrincipal: true },
                          'G': { code: 'GEO', name: 'Geography', isPrincipal: true },
                          'H': { code: 'HIS', name: 'History', isPrincipal: true },
                          'K': { code: 'KIS', name: 'Kiswahili', isPrincipal: true },
                          'L': { code: 'LIT', name: 'Literature', isPrincipal: true },
                          'E': { code: 'ECO', name: 'Economics', isPrincipal: true },
                          'A': { code: 'BAM', name: 'Basic Applied Mathematics', isPrincipal: false },
                          'S': { code: 'GS', name: 'General Studies', isPrincipal: false }
                        };

                        // Generate subjects from combination code
                        const generatedSubjects = [];
                        for (const char of combinationCode) {
                          if (combinationMap[char]) {
                            generatedSubjects.push({
                              ...combinationMap[char],
                              marks: null,
                              grade: '-',
                              points: 0
                            });
                          }
                        }

                        // Add General Studies (GS) if not already included
                        if (!generatedSubjects.some(s => s.code === 'GS')) {
                          generatedSubjects.push({
                            code: 'GS',
                            name: 'General Studies',
                            isPrincipal: false,
                            marks: null,
                            grade: '-',
                            points: 0
                          });
                        }

                        // Try to fetch marks for each subject individually
                        const subjectsWithMarks = await Promise.all(
                          generatedSubjects.map(async (subject) => {
                            try {
                              // Try to fetch marks for this specific subject
                              const subjectMarksUrl = `${process.env.REACT_APP_API_URL || ''}/marks?studentId=${student._id}&examId=${examId}&subjectCode=${subject.code}`;

                              const subjectMarksResponse = await axios.get(subjectMarksUrl, {
                                headers: {
                                  'Accept': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                              });

                              if (subjectMarksResponse.data && Array.isArray(subjectMarksResponse.data) && subjectMarksResponse.data.length > 0) {
                                const subjectMark = subjectMarksResponse.data[0];
                                console.log(`Found marks for subject ${subject.code}: ${subjectMark.marksObtained || subjectMark.marks}`);

                                return {
                                  ...subject,
                                  marks: subjectMark.marksObtained || subjectMark.marks,
                                  grade: subjectMark.grade || '-',
                                  points: subjectMark.points || 0
                                };
                              }

                              return subject;
                            } catch (error) {
                              console.error(`Error fetching marks for subject ${subject.code}:`, error);
                              return subject;
                            }
                          })
                        );

                        // Update allSubjects with any marks we found
                        allSubjects = subjectsWithMarks;
                        console.log(`Generated ${allSubjects.length} subjects with individual marks lookups for student ${student._id}`);
                      }
                    } catch (individualSubjectError) {
                      console.error(`Error fetching individual subject marks for student ${student._id}:`, individualSubjectError);
                    }
                  }
                }
              }
            }

            // If we still have no subjects, generate them from the combination
            if (allSubjects.length === 0 && (student.combination || student.subjectCombination)) {
              console.log(`Student has combination ${student.combination || student.subjectCombination} but no subjects. Generating subjects from combination.`);

              let combinationCode = student.combination || student.subjectCombination;

              // Check if the combination is a MongoDB ObjectID (24 hex characters)
              const isMongoId = typeof combinationCode === 'string' &&
                               /^[0-9a-fA-F]{24}$/.test(combinationCode);

              if (isMongoId) {
                console.log(`Combination appears to be a MongoDB ObjectID: ${combinationCode}`);
                // Since we can't fetch the actual combination details in real-time,
                // we'll use a default combination based on the student's form
                const isForm5 = student.form === 5 || student.form === '5' ||
                               student.className?.includes('5');
                const isForm6 = student.form === 6 || student.form === '6' ||
                               student.className?.includes('6');

                // Assign a default combination based on form and student ID
                // Use the student ID to deterministically assign different combinations
                // This ensures students get different combinations for better testing
                const studentIdStr = String(student._id || student.id || '');
                const lastChar = studentIdStr.charAt(studentIdStr.length - 1);

                // Use the last character of the student ID to determine the combination
                let defaultCombination = 'PCM'; // Default

                if (['0', '1', '2', '3'].includes(lastChar)) {
                  defaultCombination = 'PCM'; // Physics, Chemistry, Mathematics
                } else if (['4', '5', '6'].includes(lastChar)) {
                  defaultCombination = 'HKL'; // History, Kiswahili, Literature
                } else if (['7', '8'].includes(lastChar)) {
                  defaultCombination = 'EGM'; // Economics, Geography, Mathematics
                } else if (['9', 'a', 'b', 'c', 'd', 'e', 'f'].includes(lastChar.toLowerCase())) {
                  defaultCombination = 'CBG'; // Chemistry, Biology, Geography
                }

                combinationCode = defaultCombination;
                console.log(`Using default combination code: ${combinationCode} for Form ${isForm5 ? '5' : isForm6 ? '6' : 'unknown'} student (based on ID: ${studentIdStr})`);

                // Also store the combination code in the student object for later use
                student.combinationCode = combinationCode;
              }

              const combinationMap = {
                'P': { code: 'PHY', name: 'Physics', isPrincipal: true },
                'C': { code: 'CHE', name: 'Chemistry', isPrincipal: true },
                'M': { code: 'MAT', name: 'Mathematics', isPrincipal: true },
                'B': { code: 'BIO', name: 'Biology', isPrincipal: true },
                'G': { code: 'GEO', name: 'Geography', isPrincipal: true },
                'H': { code: 'HIS', name: 'History', isPrincipal: true },
                'K': { code: 'KIS', name: 'Kiswahili', isPrincipal: true },
                'L': { code: 'LIT', name: 'Literature', isPrincipal: true },
                'E': { code: 'ECO', name: 'Economics', isPrincipal: true }
              };

              // Generate subjects from combination code
              const generatedSubjects = [];

              // Add principal subjects from combination code
              if (typeof combinationCode === 'string') {
                // Define standard combinations with their subjects
                const standardCombinations = {
                  'PCM': ['P', 'C', 'M'],
                  'PCB': ['P', 'C', 'B'],
                  'HKL': ['H', 'K', 'L'],
                  'HGE': ['H', 'G', 'E'],
                  'EGM': ['E', 'G', 'M'],
                  'CBG': ['C', 'B', 'G']
                };

                // Check if this is a standard combination
                if (standardCombinations[combinationCode]) {
                  console.log(`Processing standard combination code: ${combinationCode}`);
                  // Use the predefined subjects for this combination
                  for (const char of standardCombinations[combinationCode]) {
                    if (combinationMap[char]) {
                      generatedSubjects.push({
                        ...combinationMap[char],
                        marks: null,
                        grade: '-',
                        points: 0
                      });
                    }
                  }
                } else {
                  // For non-standard codes, try to extract characters
                  console.log(`Processing non-standard combination code: ${combinationCode}`);
                  // First check if it's a longer format like 'PCM-Physics,Chemistry,Mathematics'
                  if (combinationCode.includes('-')) {
                    const [_code, subjectsStr] = combinationCode.split('-');
                    const subjects = subjectsStr.split(',').map(s => s.trim());

                    for (const subjectName of subjects) {
                      // Find the corresponding code for this subject name
                      let subjectCode = '';
                      for (const [_code, details] of Object.entries(combinationMap)) {
                        if (details.name.toLowerCase() === subjectName.toLowerCase()) {
                          subjectCode = details.code;
                          break;
                        }
                      }

                      generatedSubjects.push({
                        code: subjectCode || subjectName.substring(0, 3).toUpperCase(),
                        name: subjectName,
                        isPrincipal: true,
                        marks: null,
                        grade: '-',
                        points: 0
                      });
                    }
                  } else {
                    // Try to extract characters from the code
                    for (const char of combinationCode) {
                      if (combinationMap[char]) {
                        generatedSubjects.push({
                          ...combinationMap[char],
                          marks: null,
                          grade: '-',
                          points: 0
                        });
                      }
                    }
                  }
                }
              }

              // Add common subsidiary subjects
              generatedSubjects.push(
                { code: 'GS', name: 'General Studies', isPrincipal: false, marks: null, grade: '-', points: 0 },
                { code: 'BAM', name: 'Basic Applied Mathematics', isPrincipal: false, marks: null, grade: '-', points: 0 },
                { code: 'ENG', name: 'English Language', isPrincipal: false, marks: null, grade: '-', points: 0 }
              );

              // Try to fetch actual marks for each subject
              try {
                console.log(`Attempting to fetch individual subject marks for student ${student._id}`);

                // Create a copy of the generated subjects
                const subjectsWithMarks = [...generatedSubjects];

                // Fetch marks for each subject
                for (let i = 0; i < subjectsWithMarks.length; i++) {
                  const subject = subjectsWithMarks[i];

                  try {
                    // Use the api utility to construct the URL properly
                    const subjectMarksUrl = `/marks/check-student-marks?studentId=${student._id}&subjectId=${subject.code}&examId=${examId}&academicYearId=${academicYear}`;

                    // Import the api utility at the top of the file
                    // import api from '../../utils/api';
                    const subjectMarksResponse = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api${subjectMarksUrl}`, {
                      headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    });

                    console.log(`Marks for subject ${subject.name} (${subject.code}):`, subjectMarksResponse.data);

                    // If marks exist, update the subject
                    if (subjectMarksResponse.data?.hasExistingMarks) {
                      subjectsWithMarks[i] = {
                        ...subject,
                        marks: subjectMarksResponse.data.marksObtained,
                        grade: subjectMarksResponse.data.grade,
                        points: subjectMarksResponse.data.points
                      };

                      console.log(`Updated marks for subject ${subject.name} (${subject.code}): ${subjectMarksResponse.data.marksObtained}`);
                    }
                  } catch (subjectError) {
                    console.error(`Error fetching marks for subject ${subject.name} (${subject.code}):`, subjectError);
                  }
                }

                // Update the generated subjects with the fetched marks
                // Use the updated subjects with marks
                allSubjects = subjectsWithMarks;

                console.log('Updated subjects with individual marks:',
                  subjectsWithMarks.map(s => `${s.name} (${s.code}): ${s.marks}`));
              } catch (subjectsError) {
                console.error(`Error fetching individual subject marks for student ${student._id}:`, subjectsError);
              }

              console.log(`Generated ${generatedSubjects.length} subjects from combination:`,
                generatedSubjects.map(s => s.name));

              allSubjects = generatedSubjects;
            }

            // Log the student data and result data for debugging
            console.log('Student data:', {
              id: student._id || student.id,
              name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
              subjects: allSubjects,
              summary: resultData.summary
            });

            // Determine the student's form if not already set
            let studentForm = student.form;
            if (!studentForm) {
              // Try to determine from formLevel in result data
              if (resultData.formLevel) {
                if (typeof resultData.formLevel === 'string') {
                  if (resultData.formLevel.includes('5')) {
                    studentForm = 5;
                  } else if (resultData.formLevel.includes('6')) {
                    studentForm = 6;
                  }
                } else if (typeof resultData.formLevel === 'number') {
                  studentForm = resultData.formLevel;
                }
              }

              // If still not set, try to determine from class name
              if (!studentForm && student.className) {
                if (student.className.includes('5')) {
                  studentForm = 5;
                } else if (student.className.includes('6')) {
                  studentForm = 6;
                }
              }

              // Try to determine from admission number
              if (!studentForm && student.admissionNumber) {
                if (typeof student.admissionNumber === 'string') {
                  if (student.admissionNumber.includes('F5-') || student.admissionNumber.startsWith('5')) {
                    studentForm = 5;
                  } else if (student.admissionNumber.includes('F6-') || student.admissionNumber.startsWith('6')) {
                    studentForm = 6;
                  }
                }
              }

              // Try to determine from combination code (certain combinations are more common in Form 5 or Form 6)
              if (!studentForm && (student.combination || student.subjectCombination)) {
                const combinationCode = student.combination || student.subjectCombination;
                // This is just a heuristic - adjust based on your school's actual patterns
                if (['PCM', 'CBG', 'HKL'].includes(combinationCode)) {
                  // These are typically Form 5 combinations
                  studentForm = 5;
                } else if (['PCB', 'HGE', 'EGM'].includes(combinationCode)) {
                  // These might be more common in Form 6
                  studentForm = 6;
                }
              }

              // If still not set, use the class-level determination
              if (!studentForm) {
                studentForm = isForm5 ? 5 : isForm6 ? 6 : null;
              }

              console.log(`Determined form for student ${student._id || student.id}: ${studentForm}`);
            }

            // Ensure combination is set
            const studentCombination = student.combination || student.subjectCombination || '';

            // Map subjectResults to subjects for consistency
            console.log('Mapping subjectResults to subjects for student:', student._id);

            // Create a new array for subjects that includes all the data from allSubjects
            // but also preserves any existing subject data
            const mappedSubjects = allSubjects.map(subject => {
              // Get the subject name
              const subjectName = subject.subject?.name ||
                                 (typeof subject.subject === 'string' ? subject.subject : '') ||
                                 subject.name ||
                                 subject.subjectName ||
                                 'Unknown Subject';

              // Get the subject code
              const subjectCode = subject.code ||
                                subject.subject?.code ||
                                subject.subjectCode ||
                                (subjectName ? subjectName.substring(0, 3).toUpperCase() : 'UNK');

              // Get the marks
              const marks = subject.marks !== undefined ? subject.marks :
                          subject.marksObtained !== undefined ? subject.marksObtained :
                          subject.mark !== undefined ? subject.mark : null;

              // Log the subject mapping
              console.log(`Mapping subject: ${subjectName} (${subjectCode}), marks: ${marks}`);

              return {
                ...subject,
                // Ensure the subject has a name property for easier access
                name: subjectName,
                // Ensure subject has a code
                code: subjectCode,
                // Ensure marks is properly set
                marks: marks,
                // Set all possible marks properties for compatibility
                marksObtained: marks,
                mark: marks
              };
            });

            // Also check if there are any subjects in resultData.subjectResults that aren't in allSubjects
            if (resultData.subjectResults && Array.isArray(resultData.subjectResults)) {
              console.log('Checking for additional subjects in subjectResults');
              for (const subjectResult of resultData.subjectResults) {
                const subjectName = subjectResult.subject?.name ||
                                   (typeof subjectResult.subject === 'string' ? subjectResult.subject : '') ||
                                   subjectResult.name ||
                                   subjectResult.subjectName ||
                                   'Unknown Subject';

                // Check if this subject is already in mappedSubjects
                const existingSubject = mappedSubjects.find(s =>
                  (s.name && subjectName && s.name.toLowerCase() === subjectName.toLowerCase()) ||
                  (s.code && subjectResult.code && s.code === subjectResult.code)
                );

                if (!existingSubject) {
                  console.log(`Adding missing subject from subjectResults: ${subjectName}`);

                  // Get the subject code
                  const subjectCode = subjectResult.code ||
                                    subjectResult.subject?.code ||
                                    subjectResult.subjectCode ||
                                    (subjectName ? subjectName.substring(0, 3).toUpperCase() : 'UNK');

                  // Get the marks
                  const marks = subjectResult.marks !== undefined ? subjectResult.marks :
                              subjectResult.marksObtained !== undefined ? subjectResult.marksObtained :
                              subjectResult.mark !== undefined ? subjectResult.mark : null;

                  mappedSubjects.push({
                    ...subjectResult,
                    name: subjectName,
                    code: subjectCode,
                    marks: marks,
                    marksObtained: marks,
                    mark: marks,
                    isPrincipal: subjectResult.isPrincipal !== undefined ? subjectResult.isPrincipal : true
                  });
                }
              }
            }

            return {
              ...student,
              // Set both subjects and subjectResults to the same array for compatibility
              subjects: mappedSubjects,
              subjectResults: mappedSubjects,
              summary: {
                // Process summary data with proper fallbacks
                totalMarks: resultData.summary?.totalMarks ||
                           resultData.totalMarks ||
                           (Array.isArray(allSubjects) ?
                             allSubjects.reduce((sum, subj) => sum + (typeof subj.marks === 'number' ? subj.marks : 0), 0) :
                             0),
                averageMarks: resultData.summary?.averageMarks ||
                             resultData.averageMarks ||
                             (Array.isArray(allSubjects) && allSubjects.length > 0 ?
                               (allSubjects.reduce((sum, subj) => sum + (typeof subj.marks === 'number' ? subj.marks : 0), 0) /
                               allSubjects.filter(subj => typeof subj.marks === 'number').length).toFixed(1) :
                               0),
                totalPoints: resultData.summary?.totalPoints ||
                            resultData.totalPoints ||
                            (Array.isArray(allSubjects) ?
                              allSubjects.reduce((sum, subj) => sum + (subj.points || 0), 0) :
                              0),
                bestThreePoints: resultData.summary?.bestThreePoints || resultData.bestThreePoints || 0,
                division: resultData.summary?.division || resultData.division || 'N/A',
                rank: resultData.summary?.rank || resultData.rank || 'N/A'
              },
              form: studentForm,
              combination: studentCombination
            };
          } catch (error) {
            console.error(`Error fetching results for student ${student._id}:`, error);
            return {
              ...student,
              subjects: [],
              summary: {
                totalMarks: 0,
                averageMarks: 0,
                totalPoints: 0,
                bestThreePoints: 0,
                division: 'N/A',
                rank: 'N/A'
              },
              form: student.form || (isForm5 ? 5 : isForm6 ? 6 : null)
            };
          }
        })
      );

      setStudents(studentsWithResults);

      // Get all unique subjects across all students
      const uniqueSubjects = [];
      console.log('Extracting unique subjects from students');

      for (const student of studentsWithResults) {
        console.log(`Processing subjects for student ${student._id || student.id}:`,
          student.subjects?.length || 0, 'subjects');

        for (const subject of (student.subjects || [])) {
          // Generate a reliable code if one doesn't exist
          const subjectCode = subject.code ||
                             (typeof subject.subject === 'string' ? subject.subject.substring(0, 3).toUpperCase() : '') ||
                             (subject.subject?.name ? subject.subject.name.substring(0, 3).toUpperCase() : '') ||
                             (subject.name ? subject.name.substring(0, 3).toUpperCase() : 'UNK');

          // Get a reliable name
          const subjectName = subject.subject?.name ||
                             (typeof subject.subject === 'string' ? subject.subject : '') ||
                             subject.name ||
                             'Unknown Subject';

          // Check if this subject is already in the uniqueSubjects array
          const existingSubject = uniqueSubjects.find(s =>
            // Match by code (most reliable)
            s.code === subjectCode ||
            // Or by name (case insensitive)
            (s.name && subjectName && s.name.toLowerCase() === subjectName.toLowerCase())
          );

          if (!existingSubject) {
            console.log(`Adding unique subject: ${subjectName} (${subjectCode})`);
            uniqueSubjects.push({
              code: subjectCode,
              name: subjectName,
              isPrincipal: subject.isPrincipal === undefined ? true : subject.isPrincipal
            });
          }
        }
      }

      // Filter out any 'Unknown Subject' entries
      const filteredSubjects = uniqueSubjects.filter(subject =>
        subject.name !== 'Unknown Subject' && subject.code !== 'UNK');

      // If we removed any subjects, update the uniqueSubjects array
      if (filteredSubjects.length < uniqueSubjects.length) {
        console.log(`Removed ${uniqueSubjects.length - filteredSubjects.length} unknown subjects`);
        uniqueSubjects.length = 0;
        for (const subject of filteredSubjects) {
          uniqueSubjects.push(subject);
        }
      }

      console.log(`Found ${uniqueSubjects.length} unique subjects:`,
        uniqueSubjects.map(s => `${s.name} (${s.code})`))

      // If no subjects were found, add default A-Level subjects
      if (uniqueSubjects.length === 0) {
        console.log('No valid subjects found. Adding default A-Level subjects.');

        // Default A-Level subjects
        const defaultSubjects = [
          { code: 'PHY', name: 'Physics', isPrincipal: true },
          { code: 'CHE', name: 'Chemistry', isPrincipal: true },
          { code: 'MAT', name: 'Mathematics', isPrincipal: true },
          { code: 'BIO', name: 'Biology', isPrincipal: true },
          { code: 'GEO', name: 'Geography', isPrincipal: true },
          { code: 'HIS', name: 'History', isPrincipal: true },
          { code: 'KIS', name: 'Kiswahili', isPrincipal: true },
          { code: 'LIT', name: 'Literature', isPrincipal: true },
          { code: 'GS', name: 'General Studies', isPrincipal: false },
          { code: 'BAM', name: 'Basic Applied Mathematics', isPrincipal: false },
          { code: 'ENG', name: 'English Language', isPrincipal: false }
        ];

        // Clear the uniqueSubjects array and add the default subjects
        uniqueSubjects.length = 0;
        for (const subject of defaultSubjects) {
          uniqueSubjects.push(subject);
        }

        console.log(`Added ${uniqueSubjects.length} default subjects:`,
          uniqueSubjects.map(s => `${s.name} (${s.code})`))
      }

      // Sort subjects: principal subjects first, then subsidiary subjects
      uniqueSubjects.sort((a, b) => {
        // First sort by principal/subsidiary
        if (a.isPrincipal && !b.isPrincipal) return -1;
        if (!a.isPrincipal && b.isPrincipal) return 1;
        // Then sort alphabetically by code
        return a.code.localeCompare(b.code);
      });

      setSubjects(uniqueSubjects);

      // Get all unique combinations
      const uniqueCombinations = [];
      const combinationMap = new Map();

      for (const student of studentsWithResults) {
        let combination = student.subjectCombination || student.combination;

        // Skip if no combination
        if (!combination) continue;

        // Check if the combination is a MongoDB ObjectID (24 hex characters)
        const isMongoId = typeof combination === 'string' && /^[0-9a-fA-F]{24}$/.test(combination);

        if (isMongoId) {
          // For MongoDB ObjectIDs, generate a standard combination code based on student ID
          const studentIdStr = String(student._id || student.id || '');
          const lastChar = studentIdStr.charAt(studentIdStr.length - 1);

          // Use the last character of the student ID to determine the combination
          let combinationCode = 'PCM'; // Default

          if (['0', '1', '2', '3'].includes(lastChar)) {
            combinationCode = 'PCM'; // Physics, Chemistry, Mathematics
          } else if (['4', '5', '6'].includes(lastChar)) {
            combinationCode = 'HKL'; // History, Kiswahili, Literature
          } else if (['7', '8'].includes(lastChar)) {
            combinationCode = 'EGM'; // Economics, Geography, Mathematics
          } else {
            combinationCode = 'CBG'; // Chemistry, Biology, Geography
          }

          // Store the generated code in the student object
          student.combinationCode = combinationCode;
          combination = combinationCode;
        }

        // Add to map if not already present
        if (!combinationMap.has(combination)) {
          combinationMap.set(combination, {
            code: combination,
            name: combination
          });
        }
      }

      // Convert map to array
      combinationMap.forEach(combo => uniqueCombinations.push(combo));

      // Add standard combinations if not already present
      const standardCombinations = [
        { code: 'PCM', name: 'PCM - Physics, Chemistry, Mathematics' },
        { code: 'PCB', name: 'PCB - Physics, Chemistry, Biology' },
        { code: 'CBG', name: 'CBG - Chemistry, Biology, Geography' },
        { code: 'HKL', name: 'HKL - History, Kiswahili, Literature' },
        { code: 'HGE', name: 'HGE - History, Geography, Economics' },
        { code: 'EGM', name: 'EGM - Economics, Geography, Mathematics' }
      ];

      for (const combo of standardCombinations) {
        if (!combinationMap.has(combo.code)) {
          uniqueCombinations.push(combo);
        }
      }

      setCombinations(uniqueCombinations);
    } catch (err) {
      console.error('Error fetching data:', err);
      window.fetchErrorCount++;

      // If we've had multiple errors, suggest using demo data
      if (window.fetchErrorCount > 2) {
        // Check if the error might be related to API URL configuration
        const apiUrlIssue = err.message && (
          err.message.includes('404') ||
          err.message.includes('Not Found') ||
          err.message.includes('Network Error')
        );

        if (apiUrlIssue) {
          setError(`API URL configuration issue detected: ${err.message}. This may be due to incorrect API URL settings. Consider using the "Use Demo Data" button below to see how the report would look with data.`);
        } else {
          setError(`Failed to load data: ${err.message}. Consider using the "Use Demo Data" button below to see how the report would look with data.`);
        }
      } else {
        setError(`Failed to load data: ${err.message}`);
      }

      // If we've had too many errors, automatically switch to demo data
      if (window.fetchErrorCount > 3 && !useDemoData) {
        // Check if the error might be related to API URL configuration
        const apiUrlIssue = err.message && (
          err.message.includes('404') ||
          err.message.includes('Not Found') ||
          err.message.includes('Network Error')
        );

        const errorMessage = apiUrlIssue
          ? 'API URL configuration issue detected. Automatically switching to demo data.'
          : 'Multiple API errors detected. Automatically switching to demo data.';

        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'warning'
        });

        // Reset flags
        window.formAssignmentDone = false;
        window.formNotificationShown = false;
        window.formUpdateInProgress = false;
        window.combinationFetchInProgress = false;
        window.studentsUpdateInProgress = false;
        window.combinationsUpdateInProgress = false;

        // Switch to demo data
        setTimeout(() => {
          setUseDemoData(true);
          // Generate demo data directly
          const { classData, examData } = generateDemoData();
          setClassData(classData);
          setExamData(examData);
          setStudents(classData.students);
          setSubjects(classData.subjects);
          setCombinations(classData.combinations);
          setLoading(false);

          // Show notification that demo data is being used
          setSnackbar({
            open: true,
            message: 'Using demo data with randomly generated marks. This is not real student data.',
            severity: 'info'
          });
        }, 1000);
        return; // Exit early to prevent further processing
      }
    } finally {
      setLoading(false);
    }
  }, [classId, examId, generateDemoData, academicYear, term, useDemoData]);

  // Function to normalize form values (convert strings to numbers, handle edge cases)
  const normalizeFormValue = useCallback((formValue) => {
    // If it's already a number 5 or 6, return it
    if (formValue === 5 || formValue === 6) {
      return formValue;
    }

    // If it's a string '5' or '6', convert to number
    if (formValue === '5') return 5;
    if (formValue === '6') return 6;

    // If it's a string containing '5' or '6', extract and convert
    if (typeof formValue === 'string') {
      if (formValue.includes('5') || formValue.toLowerCase().includes('form 5')) {
        return 5;
      }
      if (formValue.includes('6') || formValue.toLowerCase().includes('form 6')) {
        return 6;
      }
    }

    // Return null for invalid values
    return null;
  }, []);

  // Function to set form values for all students in A-Level classes
  const setDefaultFormForALevelStudents = useCallback(() => {
    if (students.length === 0 || classData?.educationLevel !== 'A_LEVEL') {
      return students;
    }

    console.log('Setting default form values for A-Level students...');
    // Create a deep copy of the students array to avoid reference issues
    const updatedStudents = JSON.parse(JSON.stringify(students));
    let updatedCount = 0;

    // Set form for each student
    for (let i = 0; i < updatedStudents.length; i++) {
      const student = updatedStudents[i];
      let formAssigned = false;

      // First try to normalize existing form value
      const normalizedForm = normalizeFormValue(student.form);
      if (normalizedForm) {
        student.form = normalizedForm;
        student.formLevel = normalizedForm; // Set formLevel for redundancy
        formAssigned = true;
        console.log(`Normalized form value for student ${student._id || student.id} to ${normalizedForm}`);
      } else {
        // Try to determine form from class name
        if (classData?.name) {
          if (classData.name.includes('5') || classData.name.toLowerCase().includes('form 5')) {
            student.form = 5;
            student.formLevel = 5;
            console.log(`Assigned Form 5 to student ${student._id || student.id} based on class name`);
            formAssigned = true;
          } else if (classData.name.includes('6') || classData.name.toLowerCase().includes('form 6')) {
            student.form = 6;
            student.formLevel = 6;
            console.log(`Assigned Form 6 to student ${student._id || student.id} based on class name`);
            formAssigned = true;
          }
        }

        // Try to determine from admission number
        if (!formAssigned && student.admissionNumber) {
          if (typeof student.admissionNumber === 'string') {
            if (student.admissionNumber.includes('F5-') || student.admissionNumber.startsWith('5')) {
              student.form = 5;
              student.formLevel = 5;
              console.log(`Assigned Form 5 to student ${student._id || student.id} based on admission number`);
              formAssigned = true;
            } else if (student.admissionNumber.includes('F6-') || student.admissionNumber.startsWith('6')) {
              student.form = 6;
              student.formLevel = 6;
              console.log(`Assigned Form 6 to student ${student._id || student.id} based on admission number`);
              formAssigned = true;
            }
          }
        }

        // Try to determine from combination code
        if (!formAssigned && (student.combination || student.subjectCombination)) {
          const combinationCode = student.combination || student.subjectCombination;

          // IMPORTANT: We no longer automatically assign Form 6 based on combination codes
          // This was causing incorrect form assignments
          // Instead, we'll use the class name as the primary indicator

          // If the class name indicates Form 5, assign Form 5 regardless of combination
          if (classData?.name && (classData.name.includes('5') || classData.name.toLowerCase().includes('form 5'))) {
            student.form = 5;
            student.formLevel = 5;
            console.log(`Assigned Form 5 to student ${student._id || student.id} based on class name, combination: ${combinationCode}`);
            formAssigned = true;
          }
          // If the class name indicates Form 6, assign Form 6 regardless of combination
          else if (classData?.name && (classData.name.includes('6') || classData.name.toLowerCase().includes('form 6'))) {
            student.form = 6;
            student.formLevel = 6;
            console.log(`Assigned Form 6 to student ${student._id || student.id} based on class name, combination: ${combinationCode}`);
            formAssigned = true;
          }
          // If we can't determine from class name, default to Form 5 for all combinations
          else {
            student.form = 5;
            student.formLevel = 5;
            console.log(`Assigned default Form 5 to student ${student._id || student.id} with combination ${combinationCode}`);
            formAssigned = true;
          }
        }

        // If still not set, default to Form 5 for A-Level classes
        if (!formAssigned) {
          student.form = 5; // Default to Form 5 for A-Level
          student.formLevel = 5;
          console.log(`Assigned default Form 5 to A-Level student ${student._id || student.id}`);
          formAssigned = true;
        }

        if (formAssigned) {
          updatedCount++;
        }
      }
    }

    // Update the students array with the updated form information
    if (updatedCount > 0) {
      console.log(`Updated form information for ${updatedCount} students`);
      // Use a flag to prevent infinite loops
      if (!window.formUpdateInProgress) {
        window.formUpdateInProgress = true;
        // Use a timeout to ensure state updates properly
        setTimeout(() => {
          setStudents(updatedStudents);
          // Reset the flag after a delay to allow for future updates if needed
          setTimeout(() => {
            window.formUpdateInProgress = false;
          }, 1000);
        }, 0);
      }
    }

    console.log('Student forms after processing:', updatedStudents.map(s => ({
      id: s._id || s.id,
      name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      form: s.form
    })));

    return updatedStudents;
  }, [students, classData, normalizeFormValue]);

  // Function to fetch subject combination details
  const fetchCombinationDetails = useCallback(async () => {
    if (!combinations.length) return;

    try {
      console.log('Fetching subject combination details...');

      // Create a mapping of combination codes to full details
      const detailsMap = {};

      // First, use the combinations we already have
      combinations.forEach(combo => {
        if (combo.code) {
          detailsMap[combo.code] = {
            code: combo.code,
            name: combo.name || combo.code,
            description: combo.description || '',
            subjects: combo.subjects || [],
            compulsorySubjects: combo.compulsorySubjects || []
          };
        }
      });

      // Try to fetch more detailed information from the API
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/subject-combinations?educationLevel=A_LEVEL`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data && Array.isArray(response.data)) {
          response.data.forEach(combo => {
            if (combo.code) {
              detailsMap[combo.code] = {
                code: combo.code,
                name: combo.name || combo.code,
                description: combo.description || '',
                subjects: combo.subjects || [],
                compulsorySubjects: combo.compulsorySubjects || []
              };
            }
          });
        }
      } catch (error) {
        console.error('Error fetching subject combinations:', error);
        // Continue with what we have
      }

      // Add standard combinations if they're not already in the map
      const standardCombinations = {
        'PCM': { name: 'PCM - Physics, Chemistry, Mathematics', subjects: ['Physics', 'Chemistry', 'Mathematics'] },
        'PCB': { name: 'PCB - Physics, Chemistry, Biology', subjects: ['Physics', 'Chemistry', 'Biology'] },
        'CBG': { name: 'CBG - Chemistry, Biology, Geography', subjects: ['Chemistry', 'Biology', 'Geography'] },
        'HKL': { name: 'HKL - History, Kiswahili, Literature', subjects: ['History', 'Kiswahili', 'Literature'] },
        'HGE': { name: 'HGE - History, Geography, Economics', subjects: ['History', 'Geography', 'Economics'] },
        'EGM': { name: 'EGM - Economics, Geography, Mathematics', subjects: ['Economics', 'Geography', 'Mathematics'] }
      };

      Object.entries(standardCombinations).forEach(([code, details]) => {
        if (!detailsMap[code]) {
          detailsMap[code] = {
            code,
            name: details.name,
            description: '',
            subjects: details.subjects.map(name => ({ name })),
            compulsorySubjects: ['General Studies', 'Basic Applied Mathematics', 'English Language'].map(name => ({ name }))
          };
        }
      });

      console.log('Combination details map:', detailsMap);
      setCombinationDetails(detailsMap);
    } catch (error) {
      console.error('Error processing combination details:', error);
    }
  }, [combinations]);

  // Load data on component mount
  useEffect(() => {
    // Only fetch data if the circuit breaker hasn't been triggered
    if (!window.useDemoDataForced || useDemoData) {
      fetchData();
    } else {
      console.log('Circuit breaker active - skipping data fetch');
    }
  }, [fetchData, useDemoData]);

  // Fetch subject combinations from the API
  const fetchSubjectCombinations = useCallback(async () => {
    try {
      console.log('Fetching subject combinations from API...');
      const response = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/subject-combinations?educationLevel=A_LEVEL`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data && Array.isArray(response.data)) {
        console.log(`Fetched ${response.data.length} subject combinations from API`);

        // Only update if we got new combinations
        if (response.data.length > 0) {
          setCombinations(response.data);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error fetching subject combinations:', error);
      // Generate combinations from student data
      generateCombinationsFromStudents();
      return false;
    }
  }, []);

  // Generate combinations from student data when API fails
  const generateCombinationsFromStudents = useCallback(() => {
    console.log('Generating combinations from student data...');
    if (!students.length) return;

    // Get all unique combinations from students
    const uniqueCombinations = [];
    const combinationMap = new Map();
    // Create a copy of students to avoid modifying the original array
    const updatedStudents = [...students];
    let studentsUpdated = false;

    for (let i = 0; i < updatedStudents.length; i++) {
      const student = updatedStudents[i];
      let combinationCode = student.combination || student.subjectCombination;

      // Skip if no combination
      if (!combinationCode) continue;

      // Check if the combination is a MongoDB ObjectID (24 hex characters)
      const isMongoId = typeof combinationCode === 'string' && /^[0-9a-fA-F]{24}$/.test(combinationCode);

      if (isMongoId) {
        // For MongoDB ObjectIDs, generate a standard combination code based on student ID
        const studentIdStr = String(student._id || student.id || '');
        const lastChar = studentIdStr.charAt(studentIdStr.length - 1);

        // Use the last character of the student ID to determine the combination
        if (['0', '1', '2', '3'].includes(lastChar)) {
          combinationCode = 'PCM'; // Physics, Chemistry, Mathematics
        } else if (['4', '5', '6'].includes(lastChar)) {
          combinationCode = 'HKL'; // History, Kiswahili, Literature
        } else if (['7', '8'].includes(lastChar)) {
          combinationCode = 'EGM'; // Economics, Geography, Mathematics
        } else {
          combinationCode = 'CBG'; // Chemistry, Biology, Geography
        }

        // Store the generated code in a copy of the student object
        updatedStudents[i] = {
          ...student,
          combinationCode: combinationCode
        };
        studentsUpdated = true;
      }

      // Add to map if not already present
      if (!combinationMap.has(combinationCode)) {
        combinationMap.set(combinationCode, {
          code: combinationCode,
          name: combinationCode
        });
      }
    }

    // Update students state if needed, but only once and with a flag to prevent loops
    if (studentsUpdated && !window.studentsUpdateInProgress) {
      window.studentsUpdateInProgress = true;
      setTimeout(() => {
        setStudents(updatedStudents);
        setTimeout(() => {
          window.studentsUpdateInProgress = false;
        }, 1000);
      }, 0);
    }

    // Convert map to array
    combinationMap.forEach(combo => uniqueCombinations.push(combo));

    // Add standard combinations if not already present
    const standardCombinations = [
      { code: 'PCM', name: 'PCM - Physics, Chemistry, Mathematics' },
      { code: 'PCB', name: 'PCB - Physics, Chemistry, Biology' },
      { code: 'CBG', name: 'CBG - Chemistry, Biology, Geography' },
      { code: 'HKL', name: 'HKL - History, Kiswahili, Literature' },
      { code: 'HGE', name: 'HGE - History, Geography, Economics' },
      { code: 'EGM', name: 'EGM - Economics, Geography, Mathematics' }
    ];

    for (const combo of standardCombinations) {
      if (!combinationMap.has(combo.code)) {
        uniqueCombinations.push(combo);
      }
    }

    console.log(`Generated ${uniqueCombinations.length} combinations from student data:`, uniqueCombinations);

    // Use a flag to prevent infinite loops when setting combinations
    if (!window.combinationsUpdateInProgress) {
      window.combinationsUpdateInProgress = true;
      setCombinations(uniqueCombinations);
      setTimeout(() => {
        window.combinationsUpdateInProgress = false;
      }, 1000);
    }
  }, [students]);

  // Helper function to get full combination name
  // eslint-disable-next-line no-unused-vars
  const getFullCombinationName = (code) => {
    const standardCombinations = {
      'PCM': 'PCM - Physics, Chemistry, Mathematics',
      'PCB': 'PCB - Physics, Chemistry, Biology',
      'CBG': 'CBG - Chemistry, Biology, Geography',
      'HKL': 'HKL - History, Kiswahili, Literature',
      'HGE': 'HGE - History, Geography, Economics',
      'EGM': 'EGM - Economics, Geography, Mathematics'
    };

    return standardCombinations[code] || code;
  };

  // Fetch combination details when combinations change
  useEffect(() => {
    // Skip if circuit breaker is active
    if (window.useDemoDataForced && !useDemoData) {
      console.log('Circuit breaker active - skipping combination details fetch');
      return;
    }

    // Use a flag to prevent infinite loops
    if (!window.combinationFetchInProgress) {
      if (combinations.length > 0) {
        window.combinationFetchInProgress = true;
        fetchCombinationDetails().finally(() => {
          // Reset the flag after a delay
          setTimeout(() => {
            window.combinationFetchInProgress = false;
          }, 1000);
        });
      } else {
        // If we don't have combinations yet, try to fetch them
        window.combinationFetchInProgress = true;
        fetchSubjectCombinations().then(success => {
          // If API fetch failed, generate from student data
          if (!success && students.length > 0) {
            generateCombinationsFromStudents();
          }
          // Reset the flag after a delay
          setTimeout(() => {
            window.combinationFetchInProgress = false;
          }, 1000);
        }).catch(() => {
          window.combinationFetchInProgress = false;
        });
      }
    }
  }, [combinations, fetchCombinationDetails, fetchSubjectCombinations, generateCombinationsFromStudents, students, useDemoData]);

  // Handle A-Level form assignment after data is loaded
  useEffect(() => {
    // Skip if circuit breaker is active
    if (window.useDemoDataForced && !useDemoData) {
      console.log('Circuit breaker active - skipping form assignment');
      return;
    }

    // Only run this effect when students are loaded and we have class data
    if (students.length > 0 && classData?.educationLevel === 'A_LEVEL' && !loading) {
      // Check if we have students with form values not set to 5 or 6
      const needsFormAssignment = students.some(s => {
        const normalizedForm = normalizeFormValue(s.form);
        return normalizedForm !== 5 && normalizedForm !== 6;
      });

      if (needsFormAssignment) {
        // Automatically set form values for A-Level students
        console.log('Automatically setting form values for A-Level students...');
        // Use a flag to prevent infinite loops
        if (!window.formAssignmentDone) {
          window.formAssignmentDone = true;
          // Call the function but don't store the result
          setDefaultFormForALevelStudents();

          // Show a notification about the automatic form assignment
          setSnackbar({
            open: true,
            message: 'Form values have been automatically set for A-Level students. Use the Form filter to view students by form level.',
            severity: 'success'
          });
        }
      } else if (!window.formNotificationShown) {
        // Show a notification about form filtering for A-Level classes
        window.formNotificationShown = true;
        setSnackbar({
          open: true,
          message: 'This is an A-Level class. Use the "Set Form for All Students" buttons if students are not showing up in the report.',
          severity: 'info'
        });
      }
    }
  }, [classData, loading, setDefaultFormForALevelStudents, normalizeFormValue, useDemoData]);

  // Filter students by combination and form - IMPROVED VERSION
  const filteredStudents = students.filter(student => {
    // Filter by combination if selected
    if (filterCombination) {
      let studentCombination = student.combination || student.subjectCombination;

      // Handle MongoDB ObjectIDs (24 hex characters)
      if (typeof studentCombination === 'string' && /^[0-9a-fA-F]{24}$/.test(studentCombination)) {
        // Use the generated combination code if available
        studentCombination = student.combinationCode || studentCombination;
      }

      // Check if the combination matches the filter
      if (studentCombination !== filterCombination) {
        return false;
      }
    }

    // Filter by form if selected
    if (filterForm) {
      // Convert filter form to number for consistent comparison
      const formNumber = Number.parseInt(filterForm, 10);

      // Use our normalizeFormValue function to get a consistent form value
      let studentFormNumber = normalizeFormValue(student.form);

      // If we couldn't determine a form value, try to assign one
      if (studentFormNumber === null) {
        // For A-Level classes, we need to ensure all students have form 5 or 6
        if (classData?.educationLevel === 'A_LEVEL') {
          // Try to determine form from various indicators

          // Check class name
          if (classData?.name) {
            if (classData.name.includes('5') || classData.name.toLowerCase().includes('form 5')) {
              studentFormNumber = 5;
              student.form = 5;
              student.formLevel = 5;
              console.log(`Assigned Form 5 to student ${student._id || student.id} based on class name`);
            } else if (classData.name.includes('6') || classData.name.toLowerCase().includes('form 6')) {
              studentFormNumber = 6;
              student.form = 6;
              student.formLevel = 6;
              console.log(`Assigned Form 6 to student ${student._id || student.id} based on class name`);
            }
          }

          // Check combination code
          if (studentFormNumber === null) {
            const combinationCode = student.combination || student.subjectCombination;
            if (combinationCode) {
              if (['PCM', 'CBG', 'HKL'].includes(combinationCode)) {
                studentFormNumber = 5;
                student.form = 5;
                student.formLevel = 5;
                console.log(`Assigned Form 5 to student ${student._id || student.id} based on combination ${combinationCode}`);
              } else if (['PCB', 'HGE', 'EGM'].includes(combinationCode)) {
                studentFormNumber = 6;
                student.form = 6;
                student.formLevel = 6;
                console.log(`Assigned Form 6 to student ${student._id || student.id} based on combination ${combinationCode}`);
              }
            }
          }

          // If still not set, default to Form 5 for A-Level
          if (studentFormNumber === null) {
            studentFormNumber = 5;
            student.form = 5;
            student.formLevel = 5;
            console.log(`Assigned default Form 5 to A-Level student ${student._id || student.id}`);
          }
        }
      }

      // Log for debugging
      console.log(`Student ${student._id || student.id} form check:`, {
        originalForm: student.form,
        normalizedForm: studentFormNumber,
        filterForm: formNumber,
        name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      });

      // If we're filtering for Form 5 and this is an A-Level class with no form set,
      // default to showing the student in Form 5 ONLY if the class name indicates Form 5
      if (formNumber === 5 && classData?.educationLevel === 'A_LEVEL' && studentFormNumber === null) {
        // Only default to Form 5 if the class name indicates Form 5
        if (classData?.name && (classData.name.includes('5') || classData.name.toLowerCase().includes('form 5'))) {
          student.form = 5;
          student.formLevel = 5;
          console.log(`Defaulting A-Level student ${student._id || student.id} to Form 5 for filtering based on class name`);
          return true;
        }
      }

      // REMOVED: We no longer automatically assign students to Form 6 based on combination
      // This was causing Form 5 students to incorrectly show up when filtering for Form 6

      // Simple equality check with the normalized form value
      if (studentFormNumber !== formNumber) {
        console.log(`Student ${student._id || student.id} did NOT match form filter ${filterForm}`);
        return false;
      }

      console.log(`Student ${student._id || student.id} matched form filter ${filterForm}`);
    }

    return true;
  });

  // Log filtered students for debugging
  console.log(`Filtered students: ${filteredStudents.length} of ${students.length}`);
  if (filterForm) {
    console.log(`Form filter: ${filterForm}`);
    console.log('Student forms:', students.map(s => ({
      id: s._id || s.id,
      name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      form: s.form,
      combination: s.combination || s.subjectCombination
    })));
  }

  // Helper function to get combination details for a student
  // eslint-disable-next-line no-unused-vars
  const getCombinationDetails = useCallback((student) => {
    const combinationCode = student.combination || student.subjectCombination;
    if (!combinationCode) return null;

    // If we have details for this combination, return them
    if (combinationDetails[combinationCode]) {
      return combinationDetails[combinationCode];
    }

    // Otherwise return a basic object with just the code
    return {
      code: combinationCode,
      name: combinationCode,
      description: '',
      subjects: [],
      compulsorySubjects: []
    };
  }, [combinationDetails]);

  // Handle combination filter change
  const handleCombinationFilterChange = (event) => {
    setFilterCombination(event.target.value);

    // Update the display for students with MongoDB ObjectIDs
    if (event.target.value) {
      const updatedStudents = students.map(student => {
        const studentCombination = student.combination || student.subjectCombination;

        // Check if this is a MongoDB ObjectID
        if (typeof studentCombination === 'string' && /^[0-9a-fA-F]{24}$/.test(studentCombination)) {
          // If we have a generated combination code, use it
          if (!student.combinationCode) {
            // Generate a combination code based on student ID
            const studentIdStr = String(student._id || student.id || '');
            const lastChar = studentIdStr.charAt(studentIdStr.length - 1);

            let combinationCode = 'PCM'; // Default

            if (['0', '1', '2', '3'].includes(lastChar)) {
              combinationCode = 'PCM';
            } else if (['4', '5', '6'].includes(lastChar)) {
              combinationCode = 'HKL';
            } else if (['7', '8'].includes(lastChar)) {
              combinationCode = 'EGM';
            } else {
              combinationCode = 'CBG';
            }

            return { ...student, combinationCode };
          }
        }

        return student;
      });

      setStudents(updatedStudents);
    }
  };

  // Handle form filter change
  const handleFormFilterChange = (event) => {
    setFilterForm(event.target.value);
  };

  // Set form for all students
  const setFormForAllStudents = (formNumber) => {
    if (!formNumber || !students.length) return;

    // Convert to number to ensure consistent type
    const numericForm = Number(formNumber);

    // For A-Level classes, use our specialized function if setting to form 5
    if (classData?.educationLevel === 'A_LEVEL') {
      // Create a copy of the students array
      const updatedStudents = [...students];

      // Set all students to the specified form
      for (const student of updatedStudents) {
        student.form = numericForm;
        student.formLevel = numericForm;
        console.log(`Set student ${student._id || student.id} to Form ${numericForm}`);
      }

      // Update the state
      setStudents(updatedStudents);

      // Show success message
      setSnackbar({
        open: true,
        message: `Set Form ${numericForm} for all ${updatedStudents.length} students`,
        severity: 'success'
      });

      return updatedStudents;
    }

    // Create a deep copy of the students array to avoid reference issues
    const updatedStudents = JSON.parse(JSON.stringify(students));

    // Set the form for all students
    for (let i = 0; i < updatedStudents.length; i++) {
      updatedStudents[i].form = numericForm;
      // Also set formLevel for redundancy
      updatedStudents[i].formLevel = numericForm;
    }

    // Update the students array - use setTimeout to ensure state updates properly
    setTimeout(() => {
      setStudents(updatedStudents);
    }, 0);

    console.log(`Set form ${numericForm} for all ${updatedStudents.length} students`);

    // Show success message
    setSnackbar({
      open: true,
      message: `Set Form ${numericForm} for all ${updatedStudents.length} students`,
      severity: 'success'
    });

    // Return the updated students array for chaining
    return updatedStudents;
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading class report...
        </Typography>
      </Box>
    );
  }

  // Update class to A-Level
  const updateClassToALevel = async () => {
    try {
      setUpdatingEducationLevel(true);

      // Call the API to update the class's education level
      await axios.put(`${process.env.REACT_APP_API_URL || ''}classes/${classId}`, {
        educationLevel: 'A_LEVEL'
      }, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Show success message
      setSnackbar({
        open: true,
        message: 'Class education level updated to A-Level. Refreshing report...',
        severity: 'success'
      });

      // Refresh the report after a short delay
      setTimeout(() => {
        fetchData();
      }, 1500);
    } catch (err) {
      console.error('Error updating class education level:', err);

      // Show error message
      setSnackbar({
        open: true,
        message: `Failed to update education level: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setUpdatingEducationLevel(false);
    }
  };

  // If error, show error message
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            error.includes('only for A-Level classes') && (
              <Button
                color="inherit"
                size="small"
                onClick={updateClassToALevel}
                disabled={updatingEducationLevel}
              >
                {updatingEducationLevel ? 'Updating...' : 'Update to A-Level'}
              </Button>
            )
          }
        >
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  // If no data, show empty state
  if (!classData || !examData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          No class or exam data available.
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Create safe versions of classData and examData with default values
  const safeClassData = classData || {
    name: 'Class',
    section: '',
    stream: '',
    academicYear: '2023-2024'
  };

  const safeExamData = examData || {
    name: 'Exam',
    academicYear: '2023-2024',
    term: 'Term'
  };

  // Log the safe data for debugging
  if (!classData || !examData) {
    console.warn('Using safe data for rendering:', {
      classDataExists: !!classData,
      examDataExists: !!examData,
      safeClassData,
      safeExamData
    });
  }

  return (
    <Box className="class-tabular-report-container">
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity || 'info'} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* Action Buttons - Hidden when printing */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }} className="no-print">
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print Report
          </Button>
          <ReliablePdfDownload
            type={classData?.educationLevel === 'A_LEVEL' ? 'a-level' : 'o-level'}
            classId={classId}
            examId={examId}
            label="Download PDF"
          />
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              // Use the direct route for easier access
              const printableUrl = `/printable-report/${classId}/${examId}`;
              console.log(`Opening printable report: ${printableUrl}`);
              window.open(printableUrl, '_blank');
            }}
          >
            Printable HTML Version
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel id="combination-filter-label">Filter by Combination</InputLabel>
            <Select
              labelId="combination-filter-label"
              value={filterCombination}
              onChange={handleCombinationFilterChange}
              label="Filter by Combination"
            >
              <MenuItem value="">All Combinations</MenuItem>
              {combinations.map((combination, index) => {
                // Get full details if available
                const details = combinationDetails[combination.code] || combination;
                return (
                  <MenuItem key={combination.code || `combo-${index}`} value={combination.code}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {combination.code}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {details.name || combination.name || ''}
                      </Typography>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            color="secondary"
            onClick={() => {
              // Reset combination filter
              setFilterCombination('');

              // Generate combinations from student data
              generateCombinationsFromStudents();

              // Show success message
              setSnackbar({
                open: true,
                message: 'Reset combination filter and regenerated combinations',
                severity: 'success'
              });
            }}
            sx={{ height: 40, alignSelf: 'center', ml: 1 }}
          >
            Reset & Auto-Detect Combinations
          </Button>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="form-filter-label">Filter by Form</InputLabel>
            <Select
              labelId="form-filter-label"
              value={filterForm}
              onChange={handleFormFilterChange}
              label="Filter by Form"
              sx={{
                bgcolor: filterForm ? '#e3f2fd' : 'inherit',
                fontWeight: filterForm ? 'bold' : 'normal'
              }}
            >
              <MenuItem value="">All Forms</MenuItem>
              <MenuItem value="5">Form 5</MenuItem>
              <MenuItem value="6">Form 6</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              // Reset all flags to ensure we can fetch data again
              window.formAssignmentDone = false;
              window.formNotificationShown = false;
              window.formUpdateInProgress = false;
              window.combinationFetchInProgress = false;
              window.studentsUpdateInProgress = false;
              window.combinationsUpdateInProgress = false;
              // Fetch data again
              fetchData();
            }}
            startIcon={<span role="img" aria-label="refresh">🔄</span>}
          >
            Refresh Data
          </Button>

          <Button
            variant={useDemoData ? "contained" : "outlined"}
            color={useDemoData ? "success" : "warning"}
            onClick={() => {
              setUseDemoData(!useDemoData);
              // Fetch data again with the new setting
              setTimeout(() => fetchData(), 100);
            }}
            startIcon={<span role="img" aria-label="demo">{useDemoData ? "✅" : "🧪"}</span>}
            sx={{ ml: 1 }}
          >
            {useDemoData ? "Using Demo Data" : "Use Demo Data"}
          </Button>

          {filterForm && (
            <Chip
              label={`Showing Form ${filterForm} Students Only`}
              color="primary"
              onDelete={() => setFilterForm('')}
              sx={{ ml: 1 }}
            />
          )}

          {filterCombination && (
            <Chip
              label={(() => {
                const combo = combinationDetails[filterCombination] || { code: filterCombination, name: '' };
                return `Combination: ${combo.code}${combo.name ? ` (${combo.name})` : ''}`;
              })()}
              color="secondary"
              onDelete={() => setFilterCombination('')}
              sx={{ ml: 1 }}
            />
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Set Form for All Students:
            </Typography>
            <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary' }}>
              If students are not showing up in the report, use these buttons to set the form level for all students.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="contained"
                color="secondary"
                onClick={() => setFormForAllStudents(5)}
                sx={{ fontWeight: 'bold' }}
              >
                Set All to Form 5
              </Button>
              <Button
                size="small"
                variant="contained"
                color="secondary"
                onClick={() => setFormForAllStudents(6)}
                sx={{ fontWeight: 'bold' }}
              >
                Set All to Form 6
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="info"
                onClick={() => {
                  // Reset all form values to undefined
                  const resetStudents = students.map(student => ({
                    ...student,
                    form: undefined,
                    formLevel: undefined
                  }));

                  // Update the state
                  setStudents(resetStudents);

                  // Clear any form filter
                  setFilterForm('');

                  // After a short delay, run the intelligent form detection
                  setTimeout(() => {
                    setDefaultFormForALevelStudents();

                    // Show success message
                    setSnackbar({
                      open: true,
                      message: 'Reset and auto-detected form values for all students',
                      severity: 'success'
                    });
                  }, 100);
                }}
                sx={{ fontWeight: 'bold' }}
              >
                Reset & Auto-Detect Forms
              </Button>
            </Box>
          </Box>

          {/* Quick actions for filtering */}
          <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f0f7ff' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Quick Filter Actions:
            </Typography>
            <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary' }}>
              These buttons will set all students to the selected form AND apply the filter in one step.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => {
                  // Set all students to Form 5 and apply filter
                  setFormForAllStudents(5);
                  // Force a re-render before applying the filter
                  setTimeout(() => {
                    // First clear the filter to force a re-evaluation
                    setFilterForm('');
                    // Then set it again after a short delay
                    setTimeout(() => {
                      setFilterForm('5');
                      console.log('Applied Form 5 filter after setting all students to Form 5');
                    }, 50);
                  }, 100);
                }}
                sx={{
                  bgcolor: filterForm === '5' ? '#1565c0' : 'primary.main',
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: filterForm === '5' ? '#0d47a1' : 'primary.dark',
                  }
                }}
              >
                Set All to Form 5 AND Show Form 5 Only
              </Button>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => {
                  // Set all students to Form 6 and apply filter
                  setFormForAllStudents(6);
                  // Force a re-render before applying the filter
                  setTimeout(() => {
                    // First clear the filter to force a re-evaluation
                    setFilterForm('');
                    // Then set it again after a short delay
                    setTimeout(() => {
                      setFilterForm('6');
                      console.log('Applied Form 6 filter after setting all students to Form 6');
                    }, 50);
                  }, 100);
                }}
                sx={{
                  bgcolor: filterForm === '6' ? '#1565c0' : 'primary.main',
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: filterForm === '6' ? '#0d47a1' : 'primary.dark',
                  }
                }}
              >
                Set All to Form 6 AND Show Form 6 Only
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* A-Level Form Alert - Only shown for A-Level classes */}
      {classData?.educationLevel === 'A_LEVEL' && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffe0b2' }}>
          <Typography variant="h6" sx={{ color: '#e65100', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <span role="img" aria-label="warning" style={{ marginRight: '8px' }}>⚠️</span>
            Important: A-Level Form Assignment
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            This is an A-Level class. If students are not showing up in the report, you need to set their form level:
          </Typography>
          <Box sx={{ mt: 1, mb: 1 }}>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Use the <strong>"Set All to Form 5"</strong> button to set all students to Form 5</li>
              <li>Use the <strong>"Set All to Form 6"</strong> button to set all students to Form 6</li>
              <li>Use <strong>"Reset & Auto-Detect Forms"</strong> to intelligently assign forms based on student data</li>
              <li>Or use the quick filter buttons to set and filter in one step</li>
            </ul>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="warning"
              onClick={() => setFormForAllStudents(5)}
              sx={{ fontWeight: 'bold' }}
            >
              Set All to Form 5
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => setFormForAllStudents(6)}
              sx={{ fontWeight: 'bold' }}
            >
              Set All to Form 6
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => {
                // Reset all form values to undefined
                const resetStudents = students.map(student => ({
                  ...student,
                  form: undefined,
                  formLevel: undefined
                }));

                // Update the state
                setStudents(resetStudents);

                // Clear any form filter
                setFilterForm('');

                // After a short delay, run the intelligent form detection
                setTimeout(() => {
                  // Call the function but don't store the result
                  setDefaultFormForALevelStudents();

                  // Show success message
                  setSnackbar({
                    open: true,
                    message: 'Reset and auto-detected form values for all students',
                    severity: 'success'
                  });
                }, 100);
              }}
              sx={{ fontWeight: 'bold' }}
            >
              Reset & Auto-Detect Forms
            </Button>
          </Box>
        </Box>
      )}

      {/* Debug Information - Only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mb: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Debug Information (Development Only)
            </Typography>
            <Button
              variant={useDemoData ? "contained" : "outlined"}
              color={useDemoData ? "success" : "warning"}
              size="small"
              onClick={() => {
                setUseDemoData(!useDemoData);
                // Reset all flags to ensure we can fetch data again
                window.formAssignmentDone = false;
                window.formNotificationShown = false;
                window.formUpdateInProgress = false;
                window.combinationFetchInProgress = false;
                window.studentsUpdateInProgress = false;
                window.combinationsUpdateInProgress = false;
                // Fetch data again with the new setting
                setTimeout(() => fetchData(), 100);
              }}
              startIcon={<span role="img" aria-label="demo">{useDemoData ? "✅" : "🧪"}</span>}
            >
              {useDemoData ? "Using Demo Data" : "Use Demo Data"}
            </Button>

            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => {
                // Reset all flags to ensure we can fetch data again
                window.formAssignmentDone = false;
                window.formNotificationShown = false;
                window.formUpdateInProgress = false;
                window.combinationFetchInProgress = false;
                window.studentsUpdateInProgress = false;
                window.combinationsUpdateInProgress = false;
                // Fetch data again
                fetchData();
              }}
              startIcon={<span role="img" aria-label="refresh">🔄</span>}
              sx={{ ml: 1 }}
            >
              Reset & Refresh Data
            </Button>

            {window.useDemoDataForced && (
              <Button
                variant="contained"
                color="error"
                size="small"
                onClick={() => {
                  // Reset the circuit breaker
                  window.reportRenderCount = 0;
                  window.useDemoDataForced = false;
                  window.formAssignmentDone = false;
                  window.formNotificationShown = false;
                  window.formUpdateInProgress = false;
                  window.combinationFetchInProgress = false;
                  window.studentsUpdateInProgress = false;
                  window.combinationsUpdateInProgress = false;
                  window.fetchErrorCount = 0;
                  // Reload the page
                  window.location.reload();
                }}
                startIcon={<span role="img" aria-label="warning">⚠️</span>}
                sx={{ ml: 1 }}
              >
                Reset Circuit Breaker & Reload
              </Button>
            )}
          </Box>
          <Typography variant="body2">
            Total Students: {students.length} | Filtered Students: {filteredStudents.length}
          </Typography>
          <Typography variant="body2">
            Form Filter: {filterForm || 'None'} | Combination Filter: {filterCombination || 'None'}
          </Typography>
          <Typography variant="body2">
            Class Education Level: {classData?.educationLevel || 'Unknown'} | Class Name: {classData?.name || 'Unknown'}
          </Typography>
          {useDemoData && (
            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold', mt: 1 }}>
              Using demo data with randomly generated marks. This is not real student data.
            </Typography>
          )}

          {window.useDemoDataForced && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              <strong>Circuit breaker activated!</strong> The report was reloading too many times, so demo data mode was automatically enabled to prevent an infinite loop.
              Use the "Reset Circuit Breaker & Reload" button above to try again with real data.
            </Alert>
          )}

          {/* Form distribution summary */}
          <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
            Form Distribution:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body2">
              Form 5 Students: {students.filter(s => s.form === 5 || s.form === '5').length}
            </Typography>
            <Typography variant="body2">
              Form 6 Students: {students.filter(s => s.form === 6 || s.form === '6').length}
            </Typography>
            <Typography variant="body2">
              Unknown Form: {students.filter(s => !s.form && s.form !== 0 && s.form !== '0').length}
            </Typography>
          </Box>

          {/* Combination distribution summary */}
          <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
            Combination Distribution:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {combinations.map(combo => {
              const count = students.filter(s => {
                const studentCombo = s.combination || s.subjectCombination;
                if (studentCombo === combo.code) return true;

                // Check for generated combination codes
                if (s.combinationCode === combo.code) return true;

                return false;
              }).length;

              return (
                <Typography key={combo.code} variant="body2">
                  {combo.code}: {count} student{count !== 1 ? 's' : ''}
                </Typography>
              );
            })}
            <Typography variant="body2">
              No Combination: {students.filter(s => !s.combination && !s.subjectCombination).length}
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
            Student Form Information:
          </Typography>
          <Box sx={{ maxHeight: '150px', overflow: 'auto', fontSize: '0.75rem', bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
            {students.map((student, index) => (
              <div key={student._id || student.id || index} style={{
                padding: '2px 0',
                borderBottom: '1px dotted #ddd',
                color: filterForm && String(student.form) !== filterForm ? '#999' : 'inherit',
                fontWeight: filterForm && String(student.form) === filterForm ? 'bold' : 'normal'
              }}>
                <span style={{ display: 'inline-block', minWidth: '200px' }}>
                  {student.name || `${student.firstName || ''} ${student.lastName || ''}`}
                </span>
                <span style={{ display: 'inline-block', minWidth: '80px' }}>
                  Form: <strong>{student.form || 'Not Set'}</strong>
                </span>
                <span style={{ display: 'inline-block', minWidth: '200px' }}>
                  Combination: {(() => {
                    const combinationCode = student.combination || student.subjectCombination;
                    const isMongoId = typeof combinationCode === 'string' && /^[0-9a-fA-F]{24}$/.test(combinationCode);

                    if (isMongoId && student.combinationCode) {
                      return `${combinationCode} (${student.combinationCode})`;
                    }

                    return combinationCode || 'None';
                  })()}
                </span>
              </div>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Button
              size="small"
              variant="text"
              color="primary"
              onClick={() => console.log('All students:', students)}
            >
              Log All Students to Console
            </Button>

            <Button
              size="small"
              variant="text"
              color="secondary"
              onClick={() => {
                // Force re-detection of form information
                const updatedStudents = students.map(student => ({
                  ...student,
                  form: undefined // Set form to undefined to force re-detection
                }));
                setStudents(updatedStudents);
                console.log('Reset form information for all students');
              }}
            >
              Reset Form Information
            </Button>
          </Box>
        </Box>
      )}

      {/* Report Header */}
      <Box className="report-header">
        <Box className="header-left">
          <Typography variant="h6" className="school-name">
            ST. JOHN VIANNEY SECONDARY SCHOOL
          </Typography>
          <Typography variant="body2" className="school-address">
            P.O. BOX 123, DAR ES SALAAM, TANZANIA
          </Typography>
          <Typography variant="body1" className="exam-info">
            {(() => {
              try {
                return safeExamData.name || 'Exam';
              } catch (err) {
                console.error('Error accessing safeExamData.name:', err);
                return 'Exam';
              }
            })()} - {
              (() => {
                try {
                  const year = safeExamData.academicYear || safeClassData.academicYear || '2023-2024';
                  return typeof year === 'object' && year._id ? year.name || year.year || '2023-2024' : year;
                } catch (err) {
                  console.error('Error accessing academicYear:', err);
                  return '2023-2024';
                }
              })()
            }
          </Typography>
        </Box>

        <Box className="header-center">
          <img
            src="/images/school-logo.png"
            alt="School Logo"
            className="school-logo"
            onError={(e) => {
              // Use a local fallback image or remove the image entirely
              e.target.style.display = 'none';
            }}
          />
        </Box>

        <Box className="header-right">
          <Typography variant="body1" className="report-title">
            CLASS ACADEMIC REPORT
          </Typography>
          <Typography variant="body2" className="class-info">
            {safeClassData.name}
          </Typography>
          <Typography variant="body2" className="term-info">
            {(() => {
              try {
                const term = safeExamData.term || safeClassData.term || 'Term';
                return typeof term === 'object' && term._id ? term.name || 'Term' : term;
              } catch (err) {
                console.error('Error accessing term:', err);
                return 'Term';
              }
            })()}
          </Typography>
        </Box>
      </Box>

      {/* Active Filter Alert - Only shown when filtering */}
      {filterForm && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #90caf9' }}>
          <Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <span role="img" aria-label="filter" style={{ marginRight: '8px' }}>🔍</span>
            Currently Showing Form {filterForm} Students Only
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} match this filter.
            {students.length - filteredStudents.length > 0 && (
              <span>
                {students.length - filteredStudents.length} student{students.length - filteredStudents.length !== 1 ? 's are' : ' is'} hidden.
              </span>
            )}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => setFilterForm('')}
            sx={{ mt: 1 }}
          >
            Show All Students
          </Button>
        </Box>
      )}

      {/* Class Summary */}
      <Box className="class-summary">
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Total Students:</strong> {filteredStudents.length}
              {filterForm && students.length !== filteredStudents.length && (
                <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '4px' }}>
                  (of {students.length})
                </span>
              )}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Form:</strong> {filterForm ? (
                <span style={{ fontWeight: 'bold', color: '#1565c0' }}>
                  Form {filterForm}
                </span>
              ) : 'All Forms'}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Combination:</strong> {filterCombination ? (
                <span style={{ fontWeight: 'bold', color: '#1565c0' }}>
                  {filterCombination}
                </span>
              ) : 'All Combinations'}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Main Report Table */}
      <TableContainer component={Paper} className="report-table-container">
        <Table className="report-table" size="small">
          <TableHead>
            <TableRow className="table-header-row">
              <TableCell key="header-student" className="student-header">STUDENT</TableCell>
              <TableCell key="header-sex" className="info-header">SEX</TableCell>
              <TableCell key="header-points" className="info-header">POINTS</TableCell>
              <TableCell key="header-div" className="info-header">DIV</TableCell>
              {subjects.map((subject) => {
                // Get a proper display name for the subject
                let displayCode = subject.code;

                // Create a mapping for numeric codes to proper subject codes
                const numericCodeMap = {
                  '012': 'PHY', // Physics
                  '013': 'CHE', // Chemistry
                  '031': 'BIO', // Biology
                  '032': 'MAT', // Mathematics
                  '122': 'GEO', // Geography
                  '142': 'HIS', // History
                  '141': 'ENG', // English
                };

                // If the code looks like a number, try to map it to a proper subject code
                if (displayCode && !Number.isNaN(Number(displayCode))) {
                  // This is likely a numeric code that needs to be mapped
                  console.log(`Found numeric subject code: ${displayCode}`);

                  // First check our mapping
                  if (numericCodeMap[displayCode]) {
                    displayCode = numericCodeMap[displayCode];
                    console.log(`Mapped numeric code ${subject.code} to ${displayCode}`);
                  }
                  // If not in our mapping, try to use the subject name if available
                  else if (subject.name) {
                    // Convert the name to a 3-letter code
                    displayCode = subject.name.substring(0, 3).toUpperCase();
                    console.log(`Using name-based code for ${subject.code}: ${displayCode}`);
                  }
                }

                return (
                  <TableCell
                    key={`header-${subject.code || subject.name || 'unknown'}`}
                    align="center"
                    className={subject.isPrincipal ? "principal-subject" : "subsidiary-subject"}
                  >
                    <Tooltip title={subject.name || displayCode} arrow placement="top">
                      <span>{displayCode || (subject.name ? subject.name.substring(0, 3).toUpperCase() : 'UNK')}</span>
                    </Tooltip>
                  </TableCell>
                );
              })}
              <TableCell key="header-total" align="center" className="total-header">TOTAL</TableCell>
              <TableCell key="header-avg" align="center" className="average-header">AVG</TableCell>
              <TableCell key="header-rank" align="center" className="rank-header">RANK</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id || student._id} className="student-row">
                <TableCell className="student-name">
                  {student.name || `${student.firstName} ${student.lastName}`}
                  <div className="student-number">{student.admissionNumber}</div>
                  <div className="student-combination">
                    {(() => {
                      // Get the combination code
                      let combinationCode = student.combination || student.subjectCombination;

                      // Check if this is a MongoDB ObjectID (24 hex characters)
                      const isMongoId = typeof combinationCode === 'string' && /^[0-9a-fA-F]{24}$/.test(combinationCode);

                      // If it's a MongoDB ObjectID, use the generated code if available
                      if (isMongoId && student.combinationCode) {
                        combinationCode = student.combinationCode;
                      }

                      // If we have details for this combination, show them
                      if (combinationCode && combinationDetails[combinationCode]) {
                        const combo = combinationDetails[combinationCode];
                        return (
                          <>
                            <span style={{ fontWeight: 'bold' }}>{combinationCode}</span>
                            <span style={{ marginLeft: '5px', fontSize: '0.9em' }}>({combo.name})</span>
                          </>
                        );
                      }

                      // Otherwise just show the code
                      return combinationCode || 'No Combination';
                    })()}
                    {student.form && <span style={{ marginLeft: '5px', fontSize: '0.8em', color: '#666' }}>(Form {student.form})</span>}
                  </div>
                </TableCell>
                <TableCell align="center" className="gender-cell">
                  {student.gender || '-'}
                </TableCell>
                <TableCell align="center" className="points-cell">
                  {student.summary?.bestThreePoints || '-'}
                </TableCell>
                <TableCell align="center" className="division-cell">
                  {student.summary?.division || '-'}
                </TableCell>
                {subjects.map((subject) => {
                  // Enhanced subject matching logic with debugging
                  let studentSubject = null;

                  // Create a mapping for numeric codes to proper subject codes
                  const numericCodeMap = {
                    '012': 'PHY', // Physics
                    '013': 'CHE', // Chemistry
                    '031': 'BIO', // Biology
                    '032': 'MAT', // Mathematics
                    '122': 'GEO', // Geography
                    '142': 'HIS', // History
                    '141': 'ENG', // English
                  };

                  // Get the normalized subject code, handling numeric codes
                  let normalizedSubjectCode = subject.code;
                  if (normalizedSubjectCode && !Number.isNaN(Number(normalizedSubjectCode)) && numericCodeMap[normalizedSubjectCode]) {
                    normalizedSubjectCode = numericCodeMap[normalizedSubjectCode];
                    console.log(`Normalized subject code ${subject.code} to ${normalizedSubjectCode}`);
                  }

                  // First try to match in the subjects array
                  if (student.subjects && Array.isArray(student.subjects)) {
                    studentSubject = student.subjects.find(s => {
                      // Try to match by code first (most reliable)
                      if (s.code === subject.code || s.code === normalizedSubjectCode) {
                        console.log(`Found subject match by code in subjects array: ${s.code}, marks: ${s.marks || s.marksObtained}`);
                        return true;
                      }

                      // Also try to match by normalized code if the student subject has a numeric code
                      if (s.code && !Number.isNaN(Number(s.code)) && numericCodeMap[s.code] === normalizedSubjectCode) {
                        console.log(`Found subject match by normalized code in subjects array: ${s.code} -> ${normalizedSubjectCode}, marks: ${s.marks || s.marksObtained}`);
                        return true;
                      }

                      // Try to match by name property (case insensitive)
                      const subjectName = s.name ||
                                         (typeof s.subject === 'string' ? s.subject : '') ||
                                         s.subject?.name ||
                                         s.subjectName ||
                                         '';

                      if (subjectName && subject.name &&
                          subjectName.toLowerCase() === subject.name.toLowerCase()) {
                        console.log(`Found subject match by name in subjects array: ${subjectName}, marks: ${s.marks || s.marksObtained}`);
                        return true;
                      }

                      // Special case matching for common subjects
                      const specialCases = {
                        'PHY': ['Physics'],
                        'CHE': ['Chemistry'],
                        'MAT': ['Mathematics', 'Math'],
                        'BIO': ['Biology'],
                        'GEO': ['Geography'],
                        'HIS': ['History'],
                        'KIS': ['Kiswahili'],
                        'LIT': ['Literature'],
                        'ECO': ['Economics'],
                        'GS': ['General Studies'],
                        'BAM': ['Basic Applied Mathematics'],
                        'ENG': ['English', 'English Language']
                      };

                      // Check if this is a special case match
                      if (subject.code && specialCases[subject.code]) {
                        if (specialCases[subject.code].some(name =>
                            subjectName.toLowerCase() === name.toLowerCase())) {
                          console.log(`Found subject match by special case in subjects array: ${subjectName} matches ${subject.code}, marks: ${s.marks || s.marksObtained}`);
                          return true;
                        }
                      }

                      return false;
                    });
                  }

                  // If no match found in subjects array, try looking in allSubjects
                  if (!studentSubject && student.allSubjects && Array.isArray(student.allSubjects)) {
                    console.log(`No match found in subjects array, trying allSubjects for ${subject.name}`);
                    studentSubject = student.allSubjects.find(s => {
                      if (s.code === subject.code || s.subjectCode === subject.code ||
                          s.code === normalizedSubjectCode || s.subjectCode === normalizedSubjectCode) {
                        console.log(`Found subject in allSubjects by code: ${s.code || s.subjectCode}, marks: ${s.marks || s.marksObtained}`);
                        return true;
                      }

                      // Also try to match by normalized code if the student subject has a numeric code
                      if ((s.code && !Number.isNaN(Number(s.code)) && numericCodeMap[s.code] === normalizedSubjectCode) ||
                          (s.subjectCode && !Number.isNaN(Number(s.subjectCode)) && numericCodeMap[s.subjectCode] === normalizedSubjectCode)) {
                        console.log(`Found subject in allSubjects by normalized code: ${s.code || s.subjectCode} -> ${normalizedSubjectCode}, marks: ${s.marks || s.marksObtained}`);
                        return true;
                      }

                      const subjectName = s.name || s.subjectName || (typeof s.subject === 'string' ? s.subject : '') || s.subject?.name || '';
                      if (subjectName && subject.name && subjectName.toLowerCase() === subject.name.toLowerCase()) {
                        console.log(`Found subject in allSubjects by name: ${subjectName}, marks: ${s.marks || s.marksObtained}`);
                        return true;
                      }

                      return false;
                    });
                  }

                  // If no match found in subjects, try looking in subjectResults as a fallback
                  if (!studentSubject && student.subjectResults && Array.isArray(student.subjectResults)) {
                    console.log(`No match found in subjects array, trying subjectResults for ${subject.name}`);
                    studentSubject = student.subjectResults.find(s => {
                      // Match by code
                      if (s.code === subject.code || s.code === normalizedSubjectCode) {
                        console.log(`Found subject in subjectResults by code: ${s.code}, marks: ${s.marks || s.marksObtained || s.mark}`);
                        return true;
                      }

                      // Also try to match by normalized code if the student subject has a numeric code
                      if (s.code && !Number.isNaN(Number(s.code)) && numericCodeMap[s.code] === normalizedSubjectCode) {
                        console.log(`Found subject in subjectResults by normalized code: ${s.code} -> ${normalizedSubjectCode}, marks: ${s.marks || s.marksObtained || s.mark}`);
                        return true;
                      }

                      // Match by name
                      const subjectName = s.name ||
                                         (typeof s.subject === 'string' ? s.subject : '') ||
                                         s.subject?.name ||
                                         s.subjectName ||
                                         '';

                      if (subjectName && subject.name &&
                          subjectName.toLowerCase() === subject.name.toLowerCase()) {
                        console.log(`Found subject in subjectResults by name: ${subjectName}, marks: ${s.marks || s.marksObtained || s.mark}`);
                        return true;
                      }

                      // Try the same special case matching as above
                      const specialCases = {
                        'PHY': ['Physics'],
                        'CHE': ['Chemistry'],
                        'MAT': ['Mathematics', 'Math'],
                        'BIO': ['Biology'],
                        'GEO': ['Geography'],
                        'HIS': ['History'],
                        'KIS': ['Kiswahili'],
                        'LIT': ['Literature'],
                        'ECO': ['Economics'],
                        'GS': ['General Studies'],
                        'BAM': ['Basic Applied Mathematics'],
                        'ENG': ['English', 'English Language']
                      };

                      // Check if this is a special case match
                      if (subject.code && specialCases[subject.code]) {
                        if (specialCases[subject.code].some(name =>
                            subjectName.toLowerCase() === name.toLowerCase())) {
                          console.log(`Found subject in subjectResults by special case: ${subjectName} matches ${subject.code}, marks: ${s.marks || s.marksObtained || s.mark}`);
                          return true;
                        }
                      }

                      return false;
                    });
                  }

                  // If still no match, try looking in principalSubjects and subsidiarySubjects
                  if (!studentSubject) {
                    // Check principalSubjects
                    if (student.principalSubjects && Array.isArray(student.principalSubjects)) {
                      console.log(`Checking principalSubjects for ${subject.name}`);
                      studentSubject = student.principalSubjects.find(s => {
                        if (s.code === subject.code || s.subjectCode === subject.code) {
                          console.log(`Found subject in principalSubjects by code: ${s.code || s.subjectCode}, marks: ${s.marks || s.marksObtained || s.mark}`);
                          return true;
                        }

                        const subjectName = s.name || s.subjectName || (typeof s.subject === 'string' ? s.subject : '') || s.subject?.name || '';
                        if (subjectName && subject.name && subjectName.toLowerCase() === subject.name.toLowerCase()) {
                          console.log(`Found subject in principalSubjects by name: ${subjectName}, marks: ${s.marks || s.marksObtained || s.mark}`);
                          return true;
                        }

                        return false;
                      });
                    }

                    // Check subsidiarySubjects
                    if (!studentSubject && student.subsidiarySubjects && Array.isArray(student.subsidiarySubjects)) {
                      console.log(`Checking subsidiarySubjects for ${subject.name}`);
                      studentSubject = student.subsidiarySubjects.find(s => {
                        if (s.code === subject.code || s.subjectCode === subject.code) {
                          console.log(`Found subject in subsidiarySubjects by code: ${s.code || s.subjectCode}, marks: ${s.marks || s.marksObtained || s.mark}`);
                          return true;
                        }

                        const subjectName = s.name || s.subjectName || (typeof s.subject === 'string' ? s.subject : '') || s.subject?.name || '';
                        if (subjectName && subject.name && subjectName.toLowerCase() === subject.name.toLowerCase()) {
                          console.log(`Found subject in subsidiarySubjects by name: ${subjectName}, marks: ${s.marks || s.marksObtained || s.mark}`);
                          return true;
                        }

                        return false;
                      });
                    }
                  }

                  // If still no match, check if this student should have this subject based on their combination
                  if (!studentSubject) {
                    // Get the student's combination
                    const combinationCode = student.combination || student.subjectCombination;
                    const combination = combinationDetails[combinationCode];

                    // If we have combination details, check if this subject is part of the combination
                    if (combination && combination.subjects) {
                      const isPartOfCombination = combination.subjects.some(s =>
                        (s.code === subject.code) ||
                        (s.name && subject.name && s.name.toLowerCase() === subject.name.toLowerCase())
                      );

                      // If this subject is part of the combination but we didn't find a result,
                      // it means the student should take this subject but doesn't have a result yet
                      if (isPartOfCombination) {
                        console.log(`Subject ${subject.code || subject.name} is part of combination ${combinationCode} but student has no result`);
                        // Create a placeholder subject with empty marks
                        studentSubject = {
                          code: subject.code,
                          name: subject.name,
                          isPrincipal: subject.isPrincipal,
                          marks: '-',
                          grade: '-',
                          points: '-'
                        };
                      }
                    }
                  }

                  // If still no match, try looking in results array as a last resort
                  if (!studentSubject && student.results && Array.isArray(student.results)) {
                    console.log(`No match found in subjects or subjectResults, trying results array for ${subject.name}`);
                    studentSubject = student.results.find(s => {
                      // Match by code
                      if (s.code === subject.code || s.subjectCode === subject.code) {
                        console.log(`Found subject in results by code: ${s.code || s.subjectCode}, marks: ${s.marks || s.marksObtained || s.mark}`);
                        return true;
                      }

                      // Match by name
                      const subjectName = s.name ||
                                         s.subjectName ||
                                         (typeof s.subject === 'string' ? s.subject : '') ||
                                         s.subject?.name ||
                                         '';

                      if (subjectName && subject.name &&
                          subjectName.toLowerCase() === subject.name.toLowerCase()) {
                        console.log(`Found subject in results by name: ${subjectName}, marks: ${s.marks || s.marksObtained || s.mark}`);
                        return true;
                      }

                      return false;
                    });
                  }

                  // Determine if this subject is applicable to this student based on their combination
                  const combinationCode = student.combination || student.subjectCombination;
                  const combination = combinationDetails[combinationCode];
                  let isApplicableSubject = false;

                  // If we have combination details, check if this subject is part of the combination
                  if (combination?.subjects) {
                    // Check if it's a principal subject in the combination
                    isApplicableSubject = combination.subjects.some(s =>
                      (s.code === subject.code) ||
                      (s.name && subject.name && s.name.toLowerCase() === subject.name.toLowerCase())
                    );
                  }

                  // Also check compulsory subjects
                  if (!isApplicableSubject && combination?.compulsorySubjects) {
                    isApplicableSubject = combination.compulsorySubjects.some(s =>
                      (s.code === subject.code) ||
                      (s.name && subject.name && s.name.toLowerCase() === subject.name.toLowerCase())
                    );
                  }

                  // If we don't have combination details or can't determine, assume it's applicable
                  if (!combination) {
                    isApplicableSubject = true;
                  }

                  // Generate a unique key for this cell
                  const cellKey = `${student.id || student._id || 'unknown'}-${subject.code || subject.name || 'unknown'}`;

                  return (
                    <TableCell
                      key={cellKey}
                      align="center"
                      className={`subject-cell ${isApplicableSubject ? 'applicable-subject' : 'non-applicable-subject'}`}
                      sx={{
                        backgroundColor: isApplicableSubject ? 'inherit' : '#f5f5f5',
                        color: isApplicableSubject ? 'inherit' : '#999'
                      }}
                    >
                      {isApplicableSubject && studentSubject ? (
                        <div className="subject-data">
                          <div className="subject-marks">
                            {(() => {
                              // Try all possible marks properties
                              let marks = null;

                              // Log all available properties for debugging
                              console.log('Subject data:', JSON.stringify(studentSubject));

                              // First try numeric values
                              if (typeof studentSubject.marks === 'number') {
                                marks = studentSubject.marks;
                                console.log(`Using marks: ${marks}`);
                              } else if (typeof studentSubject.marksObtained === 'number') {
                                marks = studentSubject.marksObtained;
                                console.log(`Using marksObtained: ${marks}`);
                              } else if (typeof studentSubject.mark === 'number') {
                                marks = studentSubject.mark;
                                console.log(`Using mark: ${marks}`);
                              }
                              // Then try string values that can be converted to numbers
                              else if (studentSubject.marks && !Number.isNaN(Number.parseFloat(studentSubject.marks))) {
                                marks = Number.parseFloat(studentSubject.marks);
                                console.log(`Using parsed marks: ${marks}`);
                              } else if (studentSubject.marksObtained && !Number.isNaN(Number.parseFloat(studentSubject.marksObtained))) {
                                marks = Number.parseFloat(studentSubject.marksObtained);
                                console.log(`Using parsed marksObtained: ${marks}`);
                              } else if (studentSubject.mark && !Number.isNaN(Number.parseFloat(studentSubject.mark))) {
                                marks = Number.parseFloat(studentSubject.mark);
                                console.log(`Using parsed mark: ${marks}`);
                              }
                              // Finally, try any non-null value
                              else if (studentSubject.marks !== null && studentSubject.marks !== undefined) {
                                marks = studentSubject.marks;
                                console.log(`Using non-null marks: ${marks}`);
                              } else if (studentSubject.marksObtained !== null && studentSubject.marksObtained !== undefined) {
                                marks = studentSubject.marksObtained;
                                console.log(`Using non-null marksObtained: ${marks}`);
                              } else if (studentSubject.mark !== null && studentSubject.mark !== undefined) {
                                marks = studentSubject.mark;
                                console.log(`Using non-null mark: ${marks}`);
                              }

                              return marks !== null ? marks : '-';
                            })()}
                          </div>
                          <div className="subject-grade">
                            {studentSubject.grade && studentSubject.grade !== '-' ? studentSubject.grade : '-'}
                          </div>
                        </div>
                      ) : isApplicableSubject ? (
                        <div className="subject-data">
                          <div className="subject-marks">-</div>
                          <div className="subject-grade">-</div>
                        </div>
                      ) : (
                        <div className="subject-data">
                          <div className="subject-marks">N/A</div>
                          <div className="subject-grade">N/A</div>
                        </div>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell align="center" className="total-cell">
                  {typeof student.summary?.totalMarks === 'number' ? student.summary.totalMarks : '-'}
                </TableCell>
                <TableCell align="center" className="average-cell">
                  {typeof student.summary?.averageMarks === 'number' ||
                   (typeof student.summary?.averageMarks === 'string' && !Number.isNaN(Number.parseFloat(student.summary.averageMarks))) ?
                   student.summary.averageMarks : '-'}
                </TableCell>
                <TableCell align="center" className="rank-cell">
                  {student.summary?.rank || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Subject Performance Summary - Always visible */}
      <Box className="subject-performance-summary">
        <Typography variant="subtitle1" className="summary-title">
          Subject Performance Summary
        </Typography>
        <TableContainer component={Paper} className="summary-table-container">
          <Table className="summary-table" size="small">
            <TableHead>
              <TableRow key="summary-header-row-1">
                <TableCell key="summary-subject" className="summary-header">SUBJECT</TableCell>
                <TableCell key="summary-reg" align="center" className="summary-header">REG</TableCell>
                <TableCell key="summary-grade" align="center" className="summary-header" colSpan={7}>GRADE</TableCell>
                <TableCell key="summary-pass" align="center" className="summary-header">PASS</TableCell>
                <TableCell key="summary-gpa" align="center" className="summary-header">GPA</TableCell>
              </TableRow>
              <TableRow key="summary-header-row-2">
                <TableCell key="summary-empty-1" className="summary-header" />
                <TableCell key="summary-empty-2" align="center" className="summary-header" />
                <TableCell key="summary-grade-a" align="center" className="grade-header">A</TableCell>
                <TableCell key="summary-grade-b" align="center" className="grade-header">B</TableCell>
                <TableCell key="summary-grade-c" align="center" className="grade-header">C</TableCell>
                <TableCell key="summary-grade-d" align="center" className="grade-header">D</TableCell>
                <TableCell key="summary-grade-e" align="center" className="grade-header">E</TableCell>
                <TableCell key="summary-grade-s" align="center" className="grade-header">S</TableCell>
                <TableCell key="summary-grade-f" align="center" className="grade-header">F</TableCell>
                <TableCell key="summary-empty-3" align="center" className="summary-header" />
                <TableCell key="summary-empty-4" align="center" className="summary-header" />
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((subject) => {
                // Count students with this subject
                const studentsWithSubject = filteredStudents.filter(student =>
                  (student.subjects || []).some(s => s.code === subject.code)
                );

                // Count grades
                const gradeA = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'A'
                ).length;

                const gradeB = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'B'
                ).length;

                const gradeC = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'C'
                ).length;

                const gradeD = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'D'
                ).length;

                const gradeE = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'E'
                ).length;

                const gradeS = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'S'
                ).length;

                const gradeF = studentsWithSubject.filter(student =>
                  (student.subjects || []).find(s => s.code === subject.code)?.grade === 'F'
                ).length;

                // Calculate pass rate (A to S)
                const passCount = gradeA + gradeB + gradeC + gradeD + gradeE + gradeS;

                // Calculate GPA
                const totalPoints = studentsWithSubject.reduce((sum, student) => {
                  const subjectData = (student.subjects || []).find(s => s.code === subject.code);
                  return sum + (subjectData?.points || 0);
                }, 0);

                const subjectGPA = studentsWithSubject.length > 0
                  ? (totalPoints / studentsWithSubject.length).toFixed(2)
                  : 'N/A';

                return (
                  <TableRow key={subject.code}>
                    <TableCell className="subject-name">
                      {subject.name} ({subject.code})
                    </TableCell>
                    <TableCell align="center">{studentsWithSubject.length}</TableCell>
                    <TableCell align="center">{gradeA}</TableCell>
                    <TableCell align="center">{gradeB}</TableCell>
                    <TableCell align="center">{gradeC}</TableCell>
                    <TableCell align="center">{gradeD}</TableCell>
                    <TableCell align="center">{gradeE}</TableCell>
                    <TableCell align="center">{gradeS}</TableCell>
                    <TableCell align="center">{gradeF}</TableCell>
                    <TableCell align="center">{passCount}</TableCell>
                    <TableCell align="center">{subjectGPA}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Overall Performance Summary - Always visible */}
      <Box className="overall-performance-summary">
        <Typography variant="subtitle1" className="summary-title">
          Overall Performance Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper className="summary-paper">
              <Typography variant="h6" className="summary-section-title">
                Examination Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    <strong>Total Students:</strong> {filteredStudents.length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    <strong>Total Passed:</strong> {filteredStudents.filter(s => s.summary?.division !== 'F').length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    <strong>Pass Rate:</strong> {
                      filteredStudents.length > 0
                        ? `${((filteredStudents.filter(s => s.summary?.division !== 'F').length / filteredStudents.length) * 100).toFixed(2)}%`
                        : 'N/A'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    <strong>Examination GPA:</strong> {
                      (() => {
                        // Calculate average subject GPA
                        const subjectGPAs = subjects.map(subject => {
                          const studentsWithSubject = filteredStudents.filter(student =>
                            (student.subjects || []).some(s => s.code === subject.code)
                          );

                          const totalPoints = studentsWithSubject.reduce((sum, student) => {
                            const subjectData = (student.subjects || []).find(s => s.code === subject.code);
                            return sum + (subjectData?.points || 0);
                          }, 0);

                          return studentsWithSubject.length > 0
                            ? totalPoints / studentsWithSubject.length
                            : 0;
                        });

                        const avgSubjectGPA = subjectGPAs.length > 0
                          ? subjectGPAs.reduce((sum, gpa) => sum + gpa, 0) / subjectGPAs.length
                          : 0;

                        // Calculate average division GPA
                        const divisionPoints = {
                          'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'F': 6
                        };

                        const totalDivisionPoints = filteredStudents.reduce((sum, student) => {
                          return sum + (divisionPoints[student.summary?.division] || 0);
                        }, 0);

                        const avgDivisionGPA = filteredStudents.length > 0
                          ? totalDivisionPoints / filteredStudents.length
                          : 0;

                        // Calculate overall GPA
                        const overallGPA = (avgSubjectGPA + avgDivisionGPA) / 2;

                        return overallGPA.toFixed(2);
                      })()
                    }
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className="summary-paper">
              <Typography variant="h6" className="summary-section-title">
                Division Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body1">
                    <strong>Division I:</strong> {filteredStudents.filter(s => s.summary?.division === 'I').length}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body1">
                    <strong>Division II:</strong> {filteredStudents.filter(s => s.summary?.division === 'II').length}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body1">
                    <strong>Division III:</strong> {filteredStudents.filter(s => s.summary?.division === 'III').length}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body1">
                    <strong>Division IV:</strong> {filteredStudents.filter(s => s.summary?.division === 'IV').length}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body1">
                    <strong>Division V:</strong> {filteredStudents.filter(s => s.summary?.division === 'V').length}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body1">
                    <strong>Failed:</strong> {filteredStudents.filter(s => s.summary?.division === 'F').length}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Signature Section */}
      <Box className="signature-section">
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <Box className="signature-box">
              <Typography variant="body1" className="signature-title">
                Class Teacher's Signature
              </Typography>
              <Box className="signature-line" />
              <Typography variant="body2" className="signature-name">
                Name: _______________________________
              </Typography>
              <Typography variant="body2" className="signature-date">
                Date: _______________________________
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box className="signature-box">
              <Typography variant="body1" className="signature-title">
                Principal's Signature
              </Typography>
              <Box className="signature-line" />
              <Typography variant="body2" className="signature-name">
                Name: _______________________________
              </Typography>
              <Typography variant="body2" className="signature-date">
                Date: _______________________________
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Footer */}
      <Box className="report-footer">
        <Typography variant="body2" className="footer-text">
          This report was issued without any erasure or alteration whatsoever.
        </Typography>
        <Typography variant="body2" className="school-motto">
          "Excellence Through Discipline and Hard Work"
        </Typography>
      </Box>
    </Box>
  );
};

// Define PropTypes for the component
ClassTabularReport.propTypes = {
  classId: PropTypes.string,
  examId: PropTypes.string
};

export default ClassTabularReport;
