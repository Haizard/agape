import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  ButtonGroup,
  Button,
  IconButton,
  Tooltip,
  Container,
  Link
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EditIcon from '@mui/icons-material/Edit';
// PDF generation libraries
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import useOLevelClassReport from '../../../hooks/useOLevelClassReport';
import { generateClassResultPDF } from '../../../utils/pdfGenerator';
import { forcePrint } from '../../../utils/printForcer';
import { fitTableToPage } from '../../../utils/tableFitter';
import { printTableInNewWindow } from '../../../utils/printRenderer';
import a4Renderer from '../../../utils/a4Renderer';
// Import forced print styles
import '../aLevel/PrintForcedStyles.css';
import '../PrintableTableStyles.css';

// Import enhanced components
import {
  AnimatedContainer,
  FadeIn,
  GradientButton,
  SectionContainer,
  SectionHeader,
  StyledTableContainer,
  StyledTableHead,
  StyledTableRow,
  StyledChip,
  StyledCard
} from '../../common';

/**
 * O-Level Class Report Component
 *
 * Displays a comprehensive class report for O-Level classes with student results,
 * statistics, and performance metrics.
 */
const OLevelClassReport = (props) => {
  // Get parameters from props or URL
  const paramsFromUrl = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const urlForceRefresh = queryParams.get('forceRefresh') === 'true';

  // Use props if provided, otherwise use URL parameters
  const classId = props.classId || paramsFromUrl.classId;
  const examId = props.examId || paramsFromUrl.examId;
  const formLevel = props.formLevel || paramsFromUrl.formLevel;
  const forceRefresh = props.forceRefresh || urlForceRefresh;

  console.log('OLevelClassReport initialized with:', {
    classId,
    examId,
    formLevel,
    forceRefresh,
    propsProvided: !!props.classId,
    urlParamsProvided: !!paramsFromUrl.classId
  });

  // State for active tab
  const [activeTab, setActiveTab] = useState(0);

  // Fetch report data using custom hook
  const {
    report,
    loading,
    error,
    isFromCache,
    refreshReport
  } = useOLevelClassReport({
    classId,
    examId,
    autoFetch: true,
    initialForceRefresh: forceRefresh
  });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle force print
  const handleForcePrint = () => {
    forcePrint('.report-table');
  };

  // Handle fit table to page
  const handleFitTable = () => {
    fitTableToPage('.report-table');
  };

  // Handle guaranteed print with all columns
  const handleGuaranteedPrint = () => {
    printTableInNewWindow('.report-table');
  };

  // Handle A4 paper print
  const handleA4Print = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Please allow pop-ups to print the report.');
      return;
    }

    // Get the main table
    const mainTable = document.querySelector('.report-table');
    if (!mainTable) {
      alert('Report table not found.');
      printWindow.close();
      return;
    }

    // Find the Result Summary section
    let resultSummarySection = null;
    const resultSummaryHeadings = document.querySelectorAll('h6, .MuiTypography-h6');
    for (const heading of resultSummaryHeadings) {
      if (heading.textContent.includes('RESULT SUMMARY')) {
        resultSummarySection = heading.closest('.MuiCard-root');
        break;
      }
    }

    // Find the Approval section
    let approvalSection = null;
    const approvalHeadings = document.querySelectorAll('h6, .MuiTypography-h6');
    for (const heading of approvalHeadings) {
      if (heading.textContent.includes('APPROVED BY')) {
        approvalSection = heading.closest('.MuiCard-root');
        break;
      }
    }

    // Create the HTML content for the print window
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>O-Level Class Report</title>
          <style>
            /* A4 paper dimensions */
            @page {
              size: 297mm 210mm landscape;
              margin: 10mm;
              scale: 0.95; /* Slightly scale down to ensure all content fits */
            }

            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              width: 297mm; /* Exact A4 width */
              overflow-x: hidden;
            }

            .container {
              width: 100%;
              max-width: 277mm; /* 297mm - 20mm margins */
              margin: 0 auto;
              overflow-x: visible; /* Ensure content doesn't get cut off */
              transform-origin: top left; /* For scaling */
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              page-break-inside: avoid;
              table-layout: fixed;
            }

            th, td {
              border: 1px solid #000;
              padding: 2px; /* Reduced padding */
              text-align: center;
              font-size: 9pt; /* Slightly smaller font */
              font-weight: bold;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              line-height: 1.1; /* Reduced line height */
            }

            table:not(.info-table) th {
              height: 100px; /* Reduced height for vertical headers */
              vertical-align: bottom;
              padding-bottom: 5px; /* Reduced padding */
            }

            /* Vertical headers */
            th .vertical-header {
              writing-mode: vertical-rl;
              transform: rotate(180deg);
              white-space: nowrap;
              display: inline-block;
              height: 90px; /* Reduced height for vertical headers */
              padding: 3px 0; /* Reduced padding */
              text-align: center;
              font-weight: bold;
              font-size: 9pt; /* Smaller font size */
            }

            /* Column width settings */
            table:not(.info-table) th:nth-child(1), table:not(.info-table) td:nth-child(1) { /* Rank column */
              width: 30px;
            }

            table:not(.info-table) th:nth-child(2), table:not(.info-table) td:nth-child(2) { /* Name column */
              width: 120px;
            }

            table:not(.info-table) td:nth-child(2) { /* Name column data */
              text-align: left;
            }

            table:not(.info-table) td { /* Data cells */
              height: 18px; /* Reduced height for data rows */
            }

            table:not(.info-table) th:nth-child(3), table:not(.info-table) td:nth-child(3) { /* Sex column */
              width: 30px;
            }

            table:not(.info-table) th:nth-child(4), table:not(.info-table) td:nth-child(4) { /* Points column */
              width: 40px;
            }

            table:not(.info-table) th:nth-child(5), table:not(.info-table) td:nth-child(5) { /* Division column */
              width: 40px;
            }

            /* Subject columns (all columns between 6th and last 3) */
            table:not(.info-table) th:nth-child(n+6):nth-child(-n+100),
            table:not(.info-table) td:nth-child(n+6):nth-child(-n+100) {
              width: 35px; /* Narrower width for subject columns */
            }

            /* Last three columns (Total, Average, Rank) */
            table:not(.info-table) th:nth-last-child(3), table:not(.info-table) td:nth-last-child(3),
            table:not(.info-table) th:nth-last-child(2), table:not(.info-table) td:nth-last-child(2),
            table:not(.info-table) th:nth-last-child(1), table:not(.info-table) td:nth-last-child(1) {
              width: 40px;
            }

            th {
              background-color: #f0f0f0;
            }

            .section-title {
              font-size: 14pt; /* Smaller font */
              font-weight: bold;
              text-align: center;
              margin: 10px 0 5px 0; /* Reduced margin */
            }

            .approval-section {
              margin-top: 15px; /* Reduced margin */
              page-break-inside: avoid;
            }

            .signature-line {
              border-top: 1px solid #000;
              width: 180px; /* Slightly narrower */
              display: inline-block;
              margin-top: 15px; /* Reduced margin */
            }

            .signature-container {
              margin-top: 10px; /* Reduced margin */
            }

            .signature-label {
              font-weight: bold;
              margin-top: 10px; /* Reduced margin */
              font-size: 10pt; /* Smaller font */
            }

            .signature-title {
              margin-top: 3px; /* Reduced margin */
              font-size: 10pt; /* Smaller font */
            }

            /* Report Header Styles */
            .report-header {
              margin-bottom: 10px; /* Reduced margin */
              page-break-inside: avoid;
            }

            .school-header {
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 8px; /* Reduced margin */
            }

            .logo-container {
              width: 60px; /* Smaller logo */
              height: 60px; /* Smaller logo */
              margin-right: 15px; /* Reduced margin */
            }

            .school-logo {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }

            .school-info {
              text-align: center;
            }

            .school-name {
              font-size: 16pt; /* Smaller font */
              font-weight: bold;
              margin: 0 0 3px 0; /* Reduced margin */
            }

            .school-address {
              font-size: 12pt; /* Smaller font */
              font-weight: bold;
              margin: 0 0 3px 0; /* Reduced margin */
            }

            .report-title {
              font-size: 14pt; /* Smaller font */
              font-weight: bold;
              margin: 5px 0; /* Reduced margin */
              text-decoration: underline;
            }

            .exam-info {
              margin-bottom: 8px; /* Reduced margin */
            }

            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px; /* Reduced margin */
            }

            .info-table th, .info-table td {
              border: 1px solid #000;
              padding: 3px 5px; /* Reduced padding */
              font-size: 10pt; /* Smaller font */
            }

            .info-table th {
              width: 20%;
              text-align: right;
              font-weight: bold;
              background-color: #f0f0f0;
            }

            .info-table td {
              width: 30%;
              text-align: left;
            }

            .result-summary {
              margin-top: 15px; /* Reduced margin */
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Report Header -->
            <div class="report-header">
              <div class="school-header">
                <div class="logo-container">
                  <img src="/images/school-logo.png" alt="School Logo" class="school-logo" onerror="this.style.display='none'" />
                </div>
                <div class="school-info">
                  <h1 class="school-name">AGAPE LUTHERAN JUNIOR SEMINARY</h1>
                  <h2 class="school-address">P.O. BOX 8882, MOSHI, TANZANIA</h2>
                  <h3 class="report-title">O-LEVEL CLASS EXAMINATION RESULTS</h3>
                </div>
              </div>
              <div class="exam-info">
                <table class="info-table">
                  <tr>
                    <th>CLASS:</th>
                    <td>${report?.className || 'Form 4'}</td>
                    <th>ACADEMIC YEAR:</th>
                    <td>${report?.academicYear || '2023'}</td>
                  </tr>
                  <tr>
                    <th>EXAMINATION:</th>
                    <td>${report?.examName || 'Final Examination'}</td>
                    <th>TERM:</th>
                    <td>${report?.term || 'Term 2'}</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Main Table -->
            ${mainTable ? mainTable.outerHTML.replace(/<th([^>]*)>([^<]*)<\/th>/g, '<th$1><div class="vertical-header">$2</div></th>') : '<p>No data available</p>'}

            <!-- Result Summary Section -->
            <div class="result-summary">
              <div class="section-title">RESULT SUMMARY</div>
              <table>
                <thead>
                  <tr>
                    <th rowspan="2">SUBJECT NAME</th>
                    <th rowspan="2">NO OF STUDENTS</th>
                    <th colspan="5">PERFORMANCE</th>
                    <th rowspan="2">GPA</th>
                  </tr>
                  <tr>
                    <th>A</th>
                    <th>B</th>
                    <th>C</th>
                    <th>D</th>
                    <th>F</th>
                  </tr>
                </thead>
                <tbody>
                  ${allSubjects.map(subject => {
                    // Calculate grade distribution for this subject
                    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
                    let totalPoints = 0;
                    let studentCount = 0;

                    // Process each student's result for this subject
                    report.students.forEach(student => {
                      const result = student.results.find(r => r.code === subject.code);
                      // Only include students who take this subject
                      if (result && result.studentTakesSubject !== false) {
                        if (result.grade && result.grade !== 'N/A') {
                          gradeDistribution[result.grade] = (gradeDistribution[result.grade] || 0) + 1;
                          totalPoints += result.points || 0;
                          studentCount++;
                        }
                      }
                    });

                    // Calculate GPA (1-5 scale, A=1, F=5)
                    const gpa = studentCount > 0 ?
                      ((gradeDistribution.A * 1 + gradeDistribution.B * 2 + gradeDistribution.C * 3 +
                        gradeDistribution.D * 4 + gradeDistribution.F * 5) / studentCount).toFixed(2) :
                      '-';

                    return `
                      <tr>
                        <td style="text-align: left; font-weight: bold;">${subject.name}</td>
                        <td>${studentCount}</td>
                        <td style="color: #4caf50; font-weight: bold;">${gradeDistribution.A || 0}</td>
                        <td style="color: #2196f3; font-weight: bold;">${gradeDistribution.B || 0}</td>
                        <td style="color: #ff9800; font-weight: bold;">${gradeDistribution.C || 0}</td>
                        <td style="color: #ff5722; font-weight: bold;">${gradeDistribution.D || 0}</td>
                        <td style="color: #f44336; font-weight: bold;">${gradeDistribution.F || 0}</td>
                        <td style="font-weight: bold;">${gpa}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Approval Section -->
            <div class="approval-section">
              <div class="section-title">APPROVED BY</div>
              <div style="display: flex; justify-content: space-between;">
                <div style="width: 45%;">
                  <div class="signature-label">1. ACADEMIC TEACHER NAME:</div>
                  <div class="signature-container">
                    <div class="signature-title">SIGN:</div>
                    <div class="signature-line"></div>
                  </div>
                </div>
                <div style="width: 45%;">
                  <div class="signature-label">2. HEAD OF SCHOOL:</div>
                  <div class="signature-container">
                    <div class="signature-title">SIGN:</div>
                    <div class="signature-line"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <script>
            // Auto-print when loaded
            window.onload = function() {
              // Get the main table (skip the info-table)
              const mainTable = document.querySelector('table:not(.info-table)');
              if (mainTable) {
                // Ensure all columns are visible
                const columnCount = mainTable.rows[0].cells.length;
                console.log('Column count:', columnCount);

                // Calculate optimal width for subject columns
                const fixedColumnsWidth = 280; // Width for fixed columns (rank, name, sex, points, div, total, avg, rank)
                const remainingWidth = (277 - fixedColumnsWidth);
                const subjectColumns = columnCount - 8; // Total columns minus fixed columns
                const subjectColumnWidth = Math.max(25, Math.floor(remainingWidth / subjectColumns));

                console.log('Subject column width:', subjectColumnWidth + 'px');

                // Apply calculated widths to subject columns
                const subjectCells = document.querySelectorAll('table:not(.info-table) th:nth-child(n+6):nth-child(-n+' + (columnCount-3) + ')');
                subjectCells.forEach(cell => {
                  cell.style.width = subjectColumnWidth + 'px';
                });

                // Ensure vertical headers are properly displayed
                const allHeaders = document.querySelectorAll('table:not(.info-table) th .vertical-header');
                allHeaders.forEach(header => {
                  // Make sure vertical headers have proper height
                  header.style.height = '90px';
                  header.style.display = 'inline-block';
                  header.style.writingMode = 'vertical-rl';
                  header.style.transform = 'rotate(180deg)';
                  header.style.whiteSpace = 'nowrap';
                  header.style.textAlign = 'center';
                  header.style.fontWeight = 'bold';
                  header.style.fontSize = '9pt';
                });
              }

              // Print after a short delay
              setTimeout(function() {
                window.print();
                window.addEventListener('afterprint', function() {
                  window.close();
                });
              }, 1000);
            };
          </script>
        </body>
      </html>
    `;

    // Write the HTML to the print window
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Handle PDF generation
  const handleGeneratePDF = async () => {
    if (!report) return;

    try {
      const doc = generateClassResultPDF(report);
      doc.save(`O-Level-Class-Report-${report.className}-${report.examName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to direct HTML to PDF conversion if the standard method fails
      handleDirectPDFDownload();
    }
  };

  // Direct HTML to PDF conversion as a fallback
  const handleDirectPDFDownload = async () => {
    if (!reportRef.current) return;

    try {
      // Show a loading message
      alert('Generating PDF, please wait...');

      // Create a new jsPDF instance
      const pdf = new jsPDF('landscape', 'mm', 'a4');

      // Get the report element
      const element = reportRef.current;

      // Convert the element to canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true
      });

      // Get the canvas dimensions
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 280; // A4 landscape width (210mm) with margins
      const pageHeight = 190; // A4 landscape height (297mm) with margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add the image to the PDF
      let heightLeft = imgHeight;
      let position = 10; // Initial position
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if the content is larger than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`O-Level-Class-Report-${report.className}-${report.examName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF directly:', error);
      alert('Failed to generate PDF. Please try again or use the Print option.');
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refreshReport();
  };

  // Handle download PDF (alias for handleGeneratePDF)
  const handleDownloadPDF = () => {
    handleGeneratePDF();
  };

  // Navigate back to selector
  const handleBack = () => {
    navigate('/results/o-level/class-reports');
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <AnimatedContainer animation="fadeIn" duration={0.5}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <SectionContainer sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '50vh',
            justifyContent: 'center'
          }}>
            <FadeIn>
              <CircularProgress
                size={60}
                thickness={4}
                sx={{ mb: 3 }}
                color="success"
              />
            </FadeIn>
            <FadeIn delay={0.2}>
              <Typography
                variant="h5"
                sx={{ mb: 1 }}
                className="gradient-text"
              >
                Loading O-Level Class Report
              </Typography>
            </FadeIn>
            <FadeIn delay={0.3}>
              <Typography variant="body1" color="text.secondary">
                Please wait while we generate the report...
              </Typography>
            </FadeIn>
          </SectionContainer>
        </Container>
      </AnimatedContainer>
    );
  }

  // If error, show error message
  if (error) {
    // Check if the error is related to no students found with force refresh
    const isNoStudentsError = error.message && (
      error.message.includes('No students found') ||
      error.message.includes('No real data found') ||
      error.message.includes('No data found') ||
      error.message.includes('No marks have been entered') ||
      error.message.includes('Frontend build not found')
    );

    return (
      <AnimatedContainer animation="fadeIn" duration={0.5}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <SectionContainer sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '30vh',
            justifyContent: 'center'
          }}>
            <FadeIn>
              <ErrorOutlineIcon color={isNoStudentsError ? "warning" : "error"} sx={{ fontSize: 60, mb: 2 }} />
            </FadeIn>
            <FadeIn delay={0.1}>
              <Typography
                variant="h5"
                sx={{ mb: 2 }}
                color={isNoStudentsError ? "warning" : "error"}
                className="gradient-text"
              >
                {isNoStudentsError ? "No Data Available" : "Error Loading Report"}
              </Typography>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Alert
                severity={isNoStudentsError ? "warning" : "error"}
                sx={{
                  mb: 3,
                  width: '100%',
                  maxWidth: 600,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                {isNoStudentsError ? (
                  <>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      No student data is available for this class and exam.
                    </Typography>
                    <Typography variant="body2">
                      This could be because:
                      <ul>
                        <li>No marks have been entered for this class and exam yet</li>
                        <li>You selected "Force real data" which prevents showing sample data</li>
                      </ul>
                    </Typography>
                  </>
                ) : (
                  <>Error loading report: {error.message || 'Unknown error'}</>
                )}
              </Alert>
            </FadeIn>
            <FadeIn delay={0.3}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <GradientButton
                  variant="contained"
                  color="success"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBack}
                >
                  Back to Report Selector
                </GradientButton>
                {isNoStudentsError && (
                  <GradientButton
                    variant="outlined"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={() => navigate('/results/o-level/bulk-marks-entry')}
                  >
                    Enter Marks
                  </GradientButton>
                )}
              </Box>
            </FadeIn>
          </SectionContainer>
        </Container>
      </AnimatedContainer>
    );
  }

  // If no report data, create an empty report structure to avoid rendering errors
  if (!report) {
    console.warn('No report data available in OLevelClassReport component, creating empty report structure');

    // Log additional debugging information
    console.log('OLevelClassReport state:', {
      loading,
      error: error ? { message: error.message, name: error.name } : null,
      isFromCache,
      hasReport: !!report,
      classId,
      examId
    });

    // Create a minimal empty report structure
    report = {
      classId,
      examId,
      className: 'Unknown Class',
      examName: 'Unknown Exam',
      academicYear: 'Unknown Academic Year',
      students: [],
      totalStudents: 0,
      classAverage: '0.00',
      divisionDistribution: { 'I': 0, 'II': 0, 'III': 0, 'IV': 0 },
      educationLevel: 'O_LEVEL',
      warning: 'No data available. This could be because no marks have been entered for this class and exam.',
      isEmpty: true // Flag to indicate this is an empty report
    };

    console.log('Created empty report structure:', report);
  }

  // If report has a warning, show it
  const hasWarning = report.warning || (report.students && report.students.length === 0);
  const warningMessage = report.warning || 'No student data available for this class and exam. Showing sample data.';

  // Check if we have partial data (some students have marks, some don't)
  const hasIncompleteStudentData = report.students && report.students.some(student =>
    student.results && student.results.some(result => result.marks && result.marks > 0) &&
    student.results && student.results.some(result => !result.marks || result.marks === 0)
  );

  // Add a warning for partial data
  if (hasIncompleteStudentData && !hasWarning) {
    report.warning = 'Some students have marks for some subjects but not all. The report shows real data where available.';
  }

  // Check if the report is using mock data
  const isMockData = report.mock === true || (report.warning && (
    report.warning.includes('sample data') ||
    report.warning.includes('mock data') ||
    report.warning.includes('fallback')
  ));

  // Explicitly override isMockData if mock is false
  if (report.mock === false) {
    console.log('Report explicitly marked as NOT mock data');
  }

  // Check if we have real data but it's empty or partial
  const hasRealData = report.students && report.students.length > 0;
  const hasPartialData = report.warning && (
    report.warning.includes('real-time data') ||
    report.warning.includes('marks are entered') ||
    report.warning.includes('partial data')
  );

  // Check if any students have results
  const studentsWithResults = report.students ? report.students.filter(student => student.hasResults) : [];
  const hasAnyStudentWithResults = studentsWithResults.length > 0;
  console.log(`Students with results: ${studentsWithResults.length} out of ${report.students?.length || 0}`);

  // Check if the report is completely empty
  const isEmpty = report.isEmpty === true || (!hasRealData && !isMockData) || (hasRealData && !hasAnyStudentWithResults);

  // Determine if we should show the empty state message
  const showEmptyState = isEmpty;

  // Add visual indicator for data state
  console.log('Report data state:', {
    hasRealData,
    hasPartialData,
    isMockData,
    isEmpty,
    showEmptyState,
    hasIncompleteStudentData,
    hasWarning,
    studentCount: report.students?.length || 0
  });


  // Get subjects from the report
  let allSubjects = [];

  // Log the full report structure for debugging
  console.log('Report structure:', {
    hasSubjects: !!report.subjects,
    subjectCount: report.subjects?.length || 0,
    hasStudents: !!report.students,
    studentCount: report.students?.length || 0,
    reportKeys: Object.keys(report)
  });

  // First try to use subjects from the report object (preferred)
  if (report.subjects && report.subjects.length > 0) {
    console.log('Using subjects directly from report object:', report.subjects);
    allSubjects = report.subjects.map(subject => ({
      name: subject.name,
      code: subject.code,
      isPrincipal: subject.isPrincipal || false,
      id: subject.id
    }));
    console.log(`Mapped ${allSubjects.length} subjects from report.subjects`);
  }
  // Fallback: extract subjects from student results
  else if (report.students && report.students.length > 0) {
    console.log('Extracting subjects from student results as fallback');
    const subjectSet = new Set();
    report.students.forEach(student => {
      if (student.results) {
        student.results.forEach(result => {
          if (!subjectSet.has(result.code)) {
            subjectSet.add(result.code);
            allSubjects.push({
              name: result.subject,
              code: result.code,
              isPrincipal: result.isPrincipal || false
            });
          }
        });
      }
    });
    console.log(`Extracted ${allSubjects.length} subjects from student results`);
  }

  // Sort subjects by name for consistent display
  allSubjects.sort((a, b) => a.name.localeCompare(b.name));

  console.log('All subjects for report:', allSubjects.map(s => `${s.name} (${s.code})`));

  return (
    <AnimatedContainer animation="fadeIn" duration={0.5}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, pb: 8 }}>
        {/* Non-printable controls */}
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            p: 2,
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.02)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
          className="no-print"
        >
          <GradientButton
            variant="outlined"
            color="success"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Reports
          </GradientButton>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <GradientButton
              variant="contained"
              color="success"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print
            </GradientButton>

            <GradientButton
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handleForcePrint}
              sx={{ backgroundColor: '#1b5e20', '&:hover': { backgroundColor: '#0d3c10' } }}
            >
              Force Print (No Cut-off)
            </GradientButton>

            <GradientButton
              variant="contained"
              color="secondary"
              startIcon={<PrintIcon />}
              onClick={handleFitTable}
              sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
            >
              Auto-Fit to Page
            </GradientButton>

            <GradientButton
              variant="contained"
              color="info"
              startIcon={<PrintIcon />}
              onClick={handleGuaranteedPrint}
              sx={{ backgroundColor: '#0288d1', '&:hover': { backgroundColor: '#01579b' } }}
            >
              Print All Columns
            </GradientButton>

            <GradientButton
              variant="contained"
              color="success"
              startIcon={<PrintIcon />}
              onClick={handleA4Print}
              sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}
            >
              Fill A4 Paper
            </GradientButton>

            <GradientButton
              variant="contained"
              color="secondary"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleGeneratePDF}
            >
              PDF
            </GradientButton>

            <GradientButton
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={refreshReport}
            >
              Refresh
            </GradientButton>
          </Box>
        </Box>

        {/* Cache indicator */}
        {isFromCache && (
          <FadeIn delay={0.1}>
            <Alert
              severity="info"
              sx={{
                mb: 2,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
              className="no-print"
            >
              This report is loaded from cache. Click refresh to get the latest data.
            </Alert>
          </FadeIn>
        )}

        {/* Warning indicator */}
        {hasWarning && (
          <FadeIn delay={0.2}>
            <Alert
              severity={isMockData ? "warning" : "info"}
              sx={{
                mb: 2,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                backgroundColor: isMockData ? undefined : '#e8f5e9'
              }}
              className="no-print"
            >
              <AlertTitle>{isMockData ? "Warning" : "Information"}</AlertTitle>
              {warningMessage}
              {isMockData && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    To see real data, please enter marks for this class and exam using the
                    <Link
                      component={RouterLink}
                      to="/results/o-level/bulk-marks-entry"
                      sx={{ mx: 1 }}
                    >
                      O-Level Bulk Marks Entry
                    </Link>
                    page.
                  </Typography>
                </Box>
              )}
              {!isMockData && report.warning && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    This report is showing real-time data from the database. It will automatically update as more marks are entered.
                  </Typography>
                </Box>
              )}
            </Alert>
          </FadeIn>
        )}

        {/* Mock data indicator */}
        {isMockData && (
          <FadeIn delay={0.3}>
            <Box
              sx={{
                mb: 2,
                p: 2,
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
                border: '1px dashed #dee2e6'
              }}
              className="no-print"
            >
              <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
                Sample Data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You are viewing sample data because no real marks have been entered for this class and exam.
                The report will automatically update with real data once marks are entered.
              </Typography>
              <Button
                component={RouterLink}
                to="/results/o-level/bulk-marks-entry"
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
                startIcon={<EditIcon />}
              >
                Enter Marks
              </Button>
            </Box>
          </FadeIn>
        )}

        {/* Report content */}
        <FadeIn delay={0.3}>
          <SectionContainer elevation={3} sx={{ p: 3, overflow: 'hidden' }} ref={reportRef}>
            {/* Report header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography
                variant="h4"
                gutterBottom
                className="gradient-text"
                color="success"
                sx={{ fontWeight: 'bold' }}
              >
                SCHOOL NAME
              </Typography>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 'bold',
                  letterSpacing: '1px'
                }}
              >
                O-LEVEL CLASS RESULT REPORT
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Academic Year: {report.academicYear || 'N/A'}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                <StyledChip label={`Class: ${report.className}`} color="success" />
                <StyledChip label={`Exam: ${report.examName}`} color="secondary" />
                <StyledChip label={`Total Students: ${report.totalStudents || 0}`} color="primary" />
                <StyledChip label={`Class Average: ${report.classAverage || '0.00'}`} color="info" />
                {report.mock === true && (
                  <StyledChip label="SAMPLE DATA" color="error" />
                )}
                {report.mock !== true && report.warning && (
                  <StyledChip label="REAL-TIME DATA" color="success" />
                )}
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Tabs for different views */}
            <Box
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTabs-indicator': {
                  backgroundColor: '#4caf50',
                  height: '3px',
                  borderRadius: '3px 3px 0 0'
                },
                '& .MuiTab-root': {
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: '#4caf50',
                    opacity: 0.8
                  },
                  '&.Mui-selected': {
                    color: '#4caf50'
                  }
                }
              }}
              className="no-print"
            >
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="report tabs">
                <Tab label="Results" id="tab-0" />
                <Tab label="Statistics" id="tab-1" />
              </Tabs>
            </Box>

            {/* Results Tab */}
            <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-0" sx={{ mt: 2 }}>
              {/* Empty state indicator */}
              {isEmpty && (
                <Alert
                  severity="info"
                  sx={{
                    mb: 3,
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    backgroundColor: '#e8f5e9'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    No Marks Available
                  </Typography>
                  <Typography variant="body1">
                    {report.students && report.students.length > 0 ? (
                      <>Students are assigned to this class, but no marks have been entered yet. The report will update automatically as marks are entered.</>
                    ) : (
                      <>No student data is available for this class and exam. This could be because no marks have been entered yet.</>
                    )}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      This is showing real-time data from the database. The report will automatically update as marks are entered.
                    </Typography>
                  </Box>
                  <Button
                    component={RouterLink}
                    to="/results/o-level/bulk-marks-entry"
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                    startIcon={<EditIcon />}
                  >
                    Enter Marks
                  </Button>
                </Alert>
              )}

              {/* Partial data indicator */}
              {hasPartialData && !isEmpty && (
                <Alert
                  severity="warning"
                  sx={{
                    mb: 3,
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Partial Data Available
                  </Typography>
                  <Typography variant="body1">
                    Some data is missing or incomplete. The report shows real data where available.
                  </Typography>
                </Alert>
              )}

              {/* Mock data indicator */}
              {isMockData && !isEmpty && (
                <Alert
                  severity="info"
                  sx={{
                    mb: 3,
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    backgroundColor: '#e3f2fd'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Sample Data
                  </Typography>
                  <Typography variant="body1">
                    You are viewing sample data because no real marks have been entered for this class and exam.
                    The report will automatically update with real data once marks are entered.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/results/o-level/bulk-marks-entry"
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                    startIcon={<EditIcon />}
                  >
                    Enter Marks
                  </Button>
                </Alert>
              )}

              {report.students && report.students.length > 0 ? (
                <>
                  <StyledTableContainer variant="outlined" sx={{ 
                    mt: 2,
                    '@media print': {
                      transform: 'scale(0.45)',
                      transformOrigin: 'top left',
                      margin: 0,
                      padding: 0,
                      border: 'none',
                      boxShadow: 'none',
                      pageBreakInside: 'avoid',
                      pageBreakAfter: 'avoid',
                      width: '210%'
                    }
                  }}>
                    <Table size="small" aria-label="o-level class results table" className="report-table printable-table" sx={{
                      tableLayout: 'fixed',
                      width: '100%',
                      borderCollapse: 'collapse',
                      '@media print': {
                        fontSize: '3.5pt',
                        border: 'none',
                        '& td, & th': {
                          border: '0.25pt solid #000',
                          padding: '0.25pt',
                          height: 'auto',
                          lineHeight: 1
                        }
                      }
                    }}>
                      <StyledTableHead>
                        <StyledTableRow sx={{ height: 'auto' }}>
                          <TableCell sx={{ 
                            fontWeight: 'bold', 
                            borderRight: '1px solid rgba(224, 224, 224, 1)', 
                            fontSize: '3.5pt',
                            padding: '0.25pt',
                            width: '8px',
                            minWidth: '8px',
                            maxWidth: '8px',
                            height: '30px'
                          }}>No.</TableCell>
                          <TableCell sx={{ 
                            fontWeight: 'bold', 
                            borderRight: '1px solid rgba(224, 224, 224, 1)', 
                            fontSize: '3.5pt',
                            padding: '0.25pt',
                            width: '30px',
                            minWidth: '30px',
                            maxWidth: '30px'
                          }}>Name</TableCell>
                          <TableCell sx={{ 
                            fontWeight: 'bold', 
                            borderRight: '1px solid rgba(224, 224, 224, 1)', 
                            fontSize: '3.5pt',
                            padding: '0.25pt',
                            width: '8px',
                            minWidth: '8px',
                            maxWidth: '8px'
                          }}>SEX</TableCell>
                          {allSubjects.map(subject => {
                            const displayName = subject.name || subject.code;
                            const truncatedName = displayName.length > 3 ? 
                              `${displayName.substring(0, 2)}..` : displayName;
                            
                            return (
                              <TableCell 
                                key={subject.code} 
                                align="center" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  borderRight: '1px solid rgba(224, 224, 224, 1)', 
                                  fontSize: '3.5pt',
                                  padding: '0.25pt',
                                  width: '10px',
                                  minWidth: '10px',
                                  maxWidth: '10px',
                                  height: '20px'
                                }}
                              >
                                <div style={{ 
                                  transform: 'rotate(-90deg)', 
                                  whiteSpace: 'nowrap',
                                  width: '8px',
                                  fontWeight: 700,
                                  fontSize: '3.5pt',
                                  marginTop: '10px',
                                  letterSpacing: '-0.1px'
                                }}>
                                  {truncatedName}
                                </div>
                              </TableCell>
                            );
                          })}
                          <TableCell align="center" sx={{ 
                            fontWeight: 'bold', 
                            borderRight: '1px solid rgba(224, 224, 224, 1)', 
                            fontSize: '3.5pt',
                            padding: '0.25pt',
                            width: '15px',
                            minWidth: '15px',
                            maxWidth: '15px'
                          }}>Total</TableCell>
                          <TableCell align="center" sx={{ 
                            fontWeight: 'bold', 
                            borderRight: '1px solid rgba(224, 224, 224, 1)', 
                            fontSize: '3.5pt',
                            padding: '0.25pt',
                            width: '15px',
                            minWidth: '15px',
                            maxWidth: '15px'
                          }}>Avg</TableCell>
                          <TableCell align="center" sx={{ 
                            fontWeight: 'bold', 
                            borderRight: '1px solid rgba(224, 224, 224, 1)', 
                            fontSize: '3.5pt',
                            padding: '0.25pt',
                            width: '10px',
                            minWidth: '10px',
                            maxWidth: '10px'
                          }}>Div</TableCell>
                          <TableCell align="center" sx={{ 
                            fontWeight: 'bold', 
                            borderRight: '1px solid rgba(224, 224, 224, 1)', 
                            fontSize: '3.5pt',
                            padding: '0.25pt',
                            width: '10px',
                            minWidth: '10px',
                            maxWidth: '10px'
                          }}>Pts</TableCell>
                          <TableCell align="center" sx={{ 
                            fontWeight: 'bold',
                            fontSize: '3.5pt',
                            padding: '0.25pt',
                            width: '10px',
                            minWidth: '10px',
                            maxWidth: '10px'
                          }}>Rank</TableCell>
                        </StyledTableRow>
                      </StyledTableHead>
                      <TableBody>
                        {report.students.map((student, index) => (
                          <StyledTableRow
                            key={student.id}
                            sx={{
                              height: 'auto',
                              '&:nth-of-type(even)': {
                                backgroundColor: '#f5f5f5'
                              }
                            }}
                          >
                            <TableCell sx={{ 
                              fontSize: '3.5pt',
                              padding: '0.25pt',
                              height: 'auto',
                              width: '8px'
                            }}>{index + 1}</TableCell>
                            <TableCell sx={{ 
                              fontSize: '3.5pt',
                              padding: '0.25pt',
                              height: 'auto',
                              width: '30px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>{student.name}</TableCell>
                            <TableCell sx={{ 
                              fontSize: '3.5pt',
                              padding: '0.25pt',
                              height: 'auto',
                              width: '8px'
                            }}>{student.gender || student.sex || '-'}</TableCell>
                            {allSubjects.map(subject => {
                              const result = student.results.find(r => r.code === subject.code);
                              const hasValidResult = result && result.marks > 0 && result.grade !== 'N/A';
                              const studentTakesSubject = result ? result.studentTakesSubject !== false : false;
                              
                              return (
                                <TableCell 
                                  key={`${student.id}-${subject.code}`} 
                                  align="center" 
                                  sx={{ 
                                    fontSize: '3.5pt',
                                    padding: '0.25pt',
                                    height: 'auto',
                                    width: '10px'
                                  }}
                                >
                                  {hasValidResult ? (
                                    <Box sx={{ 
                                      display: 'flex', 
                                      flexDirection: 'column', 
                                      alignItems: 'center',
                                      padding: 0,
                                      margin: 0
                                    }}>
                                      <Typography sx={{ 
                                        fontSize: '3.5pt',
                                        lineHeight: 1,
                                        margin: 0,
                                        padding: 0,
                                        fontWeight: 700
                                      }}>{result.marks}</Typography>
                                      <Typography sx={{
                                        fontSize: '3.5pt',
                                        lineHeight: 1,
                                        margin: 0,
                                        padding: 0,
                                        fontWeight: 700,
                                        color: result.grade === 'F' ? '#f44336' :
                                               result.grade === 'A' ? '#4caf50' :
                                               result.grade === 'B' ? '#2196f3' :
                                               result.grade === 'C' ? '#ff9800' :
                                               result.grade === 'D' ? '#ff5722' :
                                               'inherit'
                                      }}>{result.grade}</Typography>
                                    </Box>
                                  ) : (
                                    <Typography sx={{ 
                                      fontSize: '3.5pt',
                                      color: 'text.secondary'
                                    }}>
                                      {studentTakesSubject ? '-' : 'N/A'}
                                    </Typography>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell align="center" sx={{ 
                              fontSize: '3.5pt',
                              padding: '0.25pt',
                              height: 'auto',
                              width: '15px',
                              fontWeight: 700
                            }}>{student.totalMarks || '-'}</TableCell>
                            <TableCell align="center" sx={{ 
                              fontSize: '3.5pt',
                              padding: '0.25pt',
                              height: 'auto',
                              width: '15px',
                              fontWeight: 700
                            }}>{student.averageMarks || '-'}</TableCell>
                            <TableCell align="center" sx={{ 
                              fontSize: '3.5pt',
                              padding: '0.25pt',
                              height: 'auto',
                              width: '10px',
                              fontWeight: 700,
                              color: student.division === 'I' ? '#4caf50' :
                                     student.division === 'II' ? '#2196f3' :
                                     student.division === 'III' ? '#ff9800' :
                                     student.division === 'IV' ? '#f44336' :
                                     'inherit'
                            }}>{student.division || '-'}</TableCell>
                            <TableCell align="center" sx={{ 
                              fontSize: '3.5pt',
                              padding: '0.25pt',
                              height: 'auto',
                              width: '10px',
                              fontWeight: 700
                            }}>{student.bestSevenPoints || student.totalPoints || '-'}</TableCell>
                            <TableCell align="center" sx={{ 
                              fontSize: '3.5pt',
                              padding: '0.25pt',
                              height: 'auto',
                              width: '10px',
                              fontWeight: 700
                            }}>{student.rank || '-'}</TableCell>
                          </StyledTableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </StyledTableContainer>

                  {/* Result Summary Card */}
                  <StyledCard variant="outlined" sx={{ mt: 3 }}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 'bold',
                          color: '#4caf50',
                          display: 'flex',
                          alignItems: 'center',
                          '&::before': {
                            content: '""',
                            display: 'inline-block',
                            width: '4px',
                            height: '24px',
                            backgroundColor: '#4caf50',
                            marginRight: '8px',
                            borderRadius: '4px'
                          }
                        }}
                      >
                        RESULT SUMMARY
                      </Typography>
                      <StyledTableContainer>
                        <Table size="small">
                          <StyledTableHead>
                            <StyledTableRow>
                              <TableCell>SUBJECT NAME</TableCell>
                              <TableCell align="center">NO OF STUDENTS</TableCell>
                              <TableCell colSpan={6} align="center">PERFORMANCE</TableCell>
                              <TableCell align="center">GPA</TableCell>
                            </StyledTableRow>
                            <StyledTableRow>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell align="center">A</TableCell>
                              <TableCell align="center">B</TableCell>
                              <TableCell align="center">C</TableCell>
                              <TableCell align="center">D</TableCell>
                              <TableCell align="center">F</TableCell>
                              <TableCell></TableCell>
                            </StyledTableRow>
                          </StyledTableHead>
                          <TableBody>
                            {allSubjects.map(subject => {
                              // Calculate grade distribution for this subject
                              const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
                              let totalPoints = 0;
                              let studentCount = 0;

                              // Process each student's result for this subject
                              report.students.forEach(student => {
                                const result = student.results.find(r => r.code === subject.code);
                                // Only include students who take this subject
                                if (result && result.studentTakesSubject !== false) {
                                  if (result.grade && result.grade !== 'N/A') {
                                    gradeDistribution[result.grade] = (gradeDistribution[result.grade] || 0) + 1;
                                    totalPoints += result.points || 0;
                                    studentCount++;
                                  }
                                }
                              });

                              // Calculate GPA (1-5 scale, A=1, F=5)
                              const gpa = studentCount > 0 ?
                                ((gradeDistribution.A * 1 + gradeDistribution.B * 2 + gradeDistribution.C * 3 +
                                  gradeDistribution.D * 4 + gradeDistribution.F * 5) / studentCount).toFixed(2) :
                                '-';

                              return (
                                <StyledTableRow key={subject.code}>
                                  <TableCell sx={{ fontWeight: 'bold' }}>{subject.name}</TableCell>
                                  <TableCell align="center">{studentCount}</TableCell>
                                  <TableCell align="center" sx={{ color: '#4caf50', fontWeight: 'bold' }}>{gradeDistribution.A || 0}</TableCell>
                                  <TableCell align="center" sx={{ color: '#2196f3', fontWeight: 'bold' }}>{gradeDistribution.B || 0}</TableCell>
                                  <TableCell align="center" sx={{ color: '#ff9800', fontWeight: 'bold' }}>{gradeDistribution.C || 0}</TableCell>
                                  <TableCell align="center" sx={{ color: '#ff5722', fontWeight: 'bold' }}>{gradeDistribution.D || 0}</TableCell>
                                  <TableCell align="center" sx={{ color: '#f44336', fontWeight: 'bold' }}>{gradeDistribution.F || 0}</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{gpa}</TableCell>
                                </StyledTableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </StyledTableContainer>
                    </CardContent>
                  </StyledCard>

                  {/* Approval Section */}
                  <StyledCard variant="outlined" sx={{ mt: 3, mb: 3 }}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 'bold',
                          textAlign: 'center',
                          borderBottom: '1px solid #e0e0e0',
                          pb: 1
                        }}
                      >
                        APPROVED BY
                      </Typography>
                      <Box sx={{ mt: 3 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
                              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>1. ACADEMIC TEACHER NAME:</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                <Typography variant="body2" sx={{ mr: 2 }}>SIGN:</Typography>
                                <Box sx={{ borderBottom: '1px solid #000', width: '200px', height: '24px' }} />
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
                              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>2. HEAD OF SCHOOL:</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                <Typography variant="body2" sx={{ mr: 2 }}>SIGN:</Typography>
                                <Box sx={{ borderBottom: '1px solid #000', width: '200px', height: '24px' }} />
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </>
              ) : (
                <Alert
                  severity="info"
                  sx={{
                    mt: 2,
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  No student results available for this class and exam.
                </Alert>
              )}
            </Box>

            {/* Statistics Tab */}
            <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-1" sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Division Distribution */}
                <Grid item xs={12} md={6}>
                  <StyledCard variant="outlined">
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 'bold',
                          color: '#4caf50',
                          display: 'flex',
                          alignItems: 'center',
                          '&::before': {
                            content: '""',
                            display: 'inline-block',
                            width: '4px',
                            height: '24px',
                            backgroundColor: '#4caf50',
                            marginRight: '8px',
                            borderRadius: '4px'
                          }
                        }}
                      >
                        Division Distribution
                      </Typography>
                      <StyledTableContainer>
                        <Table size="small">
                          <StyledTableHead>
                            <StyledTableRow>
                              <TableCell>Division</TableCell>
                              <TableCell align="center">Count</TableCell>
                              <TableCell align="center">Percentage</TableCell>
                            </StyledTableRow>
                          </StyledTableHead>
                          <TableBody>
                            {report.divisionDistribution && Object.entries(report.divisionDistribution).map(([division, count]) => (
                              <StyledTableRow key={division}>
                                <TableCell sx={{
                                  fontWeight: 'bold',
                                  color: division === 'I' ? '#4caf50' :
                                         division === 'II' ? '#2196f3' :
                                         division === 'III' ? '#ff9800' :
                                         division === 'IV' ? '#f44336' :
                                         'text.primary'
                                }}>
                                  Division {division}
                                </TableCell>
                                <TableCell align="center">{count}</TableCell>
                                <TableCell align="center">
                                  {report.totalStudents ? ((count / report.totalStudents) * 100).toFixed(1) + '%' : '0%'}
                                </TableCell>
                              </StyledTableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </StyledTableContainer>
                    </CardContent>
                  </StyledCard>
                </Grid>

                {/* Subject Performance */}
                <Grid item xs={12} md={6}>
                  <StyledCard variant="outlined">
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 'bold',
                          color: '#4caf50',
                          display: 'flex',
                          alignItems: 'center',
                          '&::before': {
                            content: '""',
                            display: 'inline-block',
                            width: '4px',
                            height: '24px',
                            backgroundColor: '#4caf50',
                            marginRight: '8px',
                            borderRadius: '4px'
                          }
                        }}
                      >
                        Subject Performance
                      </Typography>
                      <StyledTableContainer>
                        <Table size="small">
                          <StyledTableHead>
                            <StyledTableRow>
                              <TableCell>Subject</TableCell>
                              <TableCell align="center">Average</TableCell>
                              <TableCell align="center">Highest</TableCell>
                              <TableCell align="center">Lowest</TableCell>
                            </StyledTableRow>
                          </StyledTableHead>
                          <TableBody>
                            {allSubjects.map(subject => {
                              // Calculate statistics for this subject
                              let total = 0;
                              let count = 0;
                              let highest = 0;
                              let lowest = 100;

                              report.students.forEach(student => {
                                const result = student.results.find(r => r.code === subject.code);
                                // Only include students who take this subject
                                if (result && result.studentTakesSubject !== false && result.marks !== undefined && result.marks > 0) {
                                  total += result.marks;
                                  count++;
                                  highest = Math.max(highest, result.marks);
                                  lowest = Math.min(lowest, result.marks);
                                }
                              });

                              const average = count > 0 ? (total / count).toFixed(1) : 'N/A';
                              const avgColor = average !== 'N/A' ?
                                (parseFloat(average) >= 70 ? '#4caf50' :
                                 parseFloat(average) >= 60 ? '#8bc34a' :
                                 parseFloat(average) >= 50 ? '#cddc39' :
                                 parseFloat(average) >= 40 ? '#ffeb3b' :
                                 parseFloat(average) >= 30 ? '#ffc107' :
                                 '#f44336') : 'inherit';

                              return (
                                <StyledTableRow key={subject.code}>
                                  <TableCell sx={{ fontWeight: 'bold' }}>{subject.name}</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 'bold', color: avgColor }}>{average}</TableCell>
                                  <TableCell align="center" sx={{ color: '#4caf50', fontWeight: 'bold' }}>{highest > 0 ? highest : 'N/A'}</TableCell>
                                  <TableCell align="center" sx={{ color: lowest < 40 ? '#f44336' : 'inherit', fontWeight: 'bold' }}>{lowest < 100 ? lowest : 'N/A'}</TableCell>
                                </StyledTableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </StyledTableContainer>
                    </CardContent>
                  </StyledCard>
                </Grid>
              </Grid>
            </Box>
          </SectionContainer>
        </FadeIn>
      </Box>
    </AnimatedContainer>
  );
};

export default OLevelClassReport;
