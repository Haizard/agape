import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatALevelDivision, formatALevelGrade, getALevelGradeRemarks } from './resultDataStructures';
import { formatALevelStudentName } from './a-level-student-utils';

/**
 * Generate a PDF for an A-Level student result report
 * @param {Object} report - The normalized student result report
 * @returns {jsPDF} - The generated PDF document
 */
export const generateALevelStudentResultPDF = (report) => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Add school header
  doc.setFontSize(20); // Increased from 16
  doc.text('Evangelical Lutheran Church in Tanzania - Northern Diocese', 105, 15, { align: 'center' });
  doc.setFontSize(24); // Increased from 18
  doc.text('Agape Lutheran Junior Seminary', 105, 25, { align: 'center' });

  // Add contact information
  doc.setFontSize(12); // Increased from 10
  doc.text('P.O.BOX 8882,\nMoshi, Tanzania.', 20, 35);

  // Add school logo
  const logoUrl = `${window.location.origin}/images/logo.JPG`;
  try {
    doc.addImage(logoUrl, 'JPEG', 85, 30, 30, 30);
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
    // Fallback to text if image fails
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AGAPE', 105, 40, { align: 'center' });
    doc.text('LUTHERAN', 105, 47, { align: 'center' });
    doc.text('SEMINARY', 105, 54, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }

  // Add right-side contact information
  doc.setFontSize(12); // Increased from 10
  doc.text('Mobile phone: 0759767735\nEmail: infoagapeseminary@gmail.com', 170, 35, { align: 'right' });

  // Add report title
  doc.setFontSize(20); // Increased from 14
  doc.text('A-LEVEL STUDENT RESULT REPORT', 105, 55, { align: 'center' });
  doc.setFontSize(16); // Increased from 12
  doc.text(`Academic Year: ${report.academicYear || 'Unknown'}`, 105, 65, { align: 'center' });

  // Add student information
  doc.setFontSize(16); // Increased from 12
  doc.text(`Name: ${formatALevelStudentName(report)}`, 20, 80);
  doc.text(`Class: ${report.studentDetails?.class || report.class?.fullName || ''}`, 20, 90);
  doc.text(`Roll Number: ${report.studentDetails?.rollNumber || ''}`, 20, 100);
  doc.text(`Rank: ${report.studentDetails?.rank || report.summary?.rank || 'N/A'} of ${report.studentDetails?.totalStudents || report.summary?.totalStudents || 'N/A'}`, 20, 110);
  doc.text(`Gender: ${report.studentDetails?.gender || ''}`, 140, 80);
  doc.text(`Exam: ${report.examName || report.exam?.name || ''}`, 140, 90);
  doc.text(`Date: ${report.examDate || ''}`, 140, 100);

  // Prepare subject results data
  const subjectResults = report.subjectResults || report.results || [];

  // Separate principal and subsidiary subjects
  const principalSubjects = subjectResults.filter(result => result.isPrincipal);
  const subsidiarySubjects = subjectResults.filter(result => !result.isPrincipal);

  // Add principal subjects table
  doc.setFontSize(18); // Increased from 14
  doc.text('Principal Subjects', 20, 120);

  if (principalSubjects.length > 0) {
    doc.autoTable({
      startY: 125,
      head: [['Subject', 'Marks', 'Grade', 'Points', 'Remarks']],
      body: principalSubjects.map(result => {
        // Try all possible property names for marks
        const marks = result.marks || result.marksObtained || result.score || 0;
        return [
          result.subject,
          marks,
          result.grade || '',
          result.points || 0,
          result.remarks || ''
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 14 }, // Increased from default
      styles: { fontSize: 12 }, // Increased from 10
      columnStyles: {
        0: { cellWidth: 60 }, // Subject - wider column
        1: { cellWidth: 30, halign: 'center' }, // Marks
        2: { cellWidth: 30, halign: 'center' }, // Grade
        3: { cellWidth: 30, halign: 'center' }, // Points
        4: { cellWidth: 'auto' } // Remarks
      }
    });
  } else {
    doc.text('No principal subjects found', 20, 100);
  }

  // Add subsidiary subjects table
  const subsidiaryStartY = doc.autoTable.previous.finalY + 15 || 120;
  doc.setFontSize(18); // Increased from 14
  doc.text('Subsidiary Subjects', 20, subsidiaryStartY);

  if (subsidiarySubjects.length > 0) {
    doc.autoTable({
      startY: subsidiaryStartY + 5,
      head: [['Subject', 'Marks', 'Grade', 'Points', 'Remarks']],
      body: subsidiarySubjects.map(result => {
        // Try all possible property names for marks
        const marks = result.marks || result.marksObtained || result.score || 0;
        return [
          result.subject,
          marks,
          result.grade || '',
          result.points || 0,
          result.remarks || ''
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 14 }, // Increased from default
      styles: { fontSize: 12 }, // Increased from 10
      columnStyles: {
        0: { cellWidth: 60 }, // Subject - wider column
        1: { cellWidth: 30, halign: 'center' }, // Marks
        2: { cellWidth: 30, halign: 'center' }, // Grade
        3: { cellWidth: 30, halign: 'center' }, // Points
        4: { cellWidth: 'auto' } // Remarks
      }
    });
  } else {
    doc.text('No subsidiary subjects found', 20, subsidiaryStartY + 10);
  }

  // Add summary
  const summaryStartY = doc.autoTable.previous.finalY + 15 || 150;
  doc.setFontSize(18); // Increased from 14
  doc.text('Performance Summary', 20, summaryStartY);

  // Extract summary data
  const totalMarks = report.summary?.totalMarks || report.totalMarks || 0;
  const averageMarks = report.summary?.averageMarks || report.averageMarks || '0.00';
  const totalPoints = report.summary?.totalPoints || report.points || 0;
  const bestThreePoints = report.summary?.bestThreePoints || report.bestThreePoints || 0;
  const division = report.summary?.division || report.division || 'N/A';
  const rank = report.summary?.rank || 'N/A';

  // Add summary table
  doc.autoTable({
    startY: summaryStartY + 5,
    head: [['Total Marks', 'Average Marks', 'Total Points', 'Best 3 Points', 'Division', 'Rank']],
    body: [[totalMarks, `${averageMarks}%`, totalPoints, bestThreePoints, division, rank]],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 14 }, // Increased from default
    styles: { fontSize: 12 }, // Increased from 10
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' }
    }
  });

  // Add grade distribution
  const distributionStartY = doc.autoTable.previous.finalY + 15 || 180;
  doc.setFontSize(14);
  doc.text('Grade Distribution', 20, distributionStartY);

  // Extract grade distribution data
  const gradeDistribution = report.gradeDistribution || {
    A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0
  };

  // Add grade distribution table
  doc.autoTable({
    startY: distributionStartY + 5,
    head: [['A', 'B', 'C', 'D', 'E', 'S', 'F']],
    body: [[
      gradeDistribution.A || 0,
      gradeDistribution.B || 0,
      gradeDistribution.C || 0,
      gradeDistribution.D || 0,
      gradeDistribution.E || 0,
      gradeDistribution.S || 0,
      gradeDistribution.F || 0
    ]],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 }
  });

  // Add character assessment
  const characterStartY = doc.autoTable.previous.finalY + 15 || 210;
  doc.setFontSize(14);
  doc.text('Character Assessment', 20, characterStartY);

  // Extract character assessment data
  const characterAssessment = report.characterAssessment || {};

  // Add character assessment table
  doc.autoTable({
    startY: characterStartY + 5,
    head: [['Trait', 'Rating', 'Trait', 'Rating']],
    body: [
      ['Punctuality', characterAssessment.punctuality || 'Good', 'Discipline', characterAssessment.discipline || 'Good'],
      ['Respect', characterAssessment.respect || 'Good', 'Leadership', characterAssessment.leadership || 'Good'],
      ['Participation', characterAssessment.participation || 'Good', 'Overall', characterAssessment.overallAssessment || 'Good']
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 }
  });

  // Add comments
  const commentsStartY = doc.autoTable.previous.finalY + 10;
  doc.setFontSize(12);
  doc.text('Teacher Comments:', 20, commentsStartY);
  doc.setFontSize(10);

  // Split comments into multiple lines if needed
  const comments = characterAssessment.comments || 'No comments available';
  const textLines = doc.splitTextToSize(comments, 170);
  doc.text(textLines, 20, commentsStartY + 10);

  // Add A-Level division guide
  const guideStartY = commentsStartY + 20 + (textLines.length * 5);
  doc.setFontSize(14);
  doc.text('A-Level Division Guide', 20, guideStartY);

  // Add division guide table
  doc.autoTable({
    startY: guideStartY + 5,
    head: [['Division', 'Points Range', 'Grade Points']],
    body: [
      ['Division I', '3-9 points', 'A (80-100%) = 1 point\nB (70-79%) = 2 points\nC (60-69%) = 3 points\nD (50-59%) = 4 points\nE (40-49%) = 5 points\nS (35-39%) = 6 points\nF (0-34%) = 7 points'],
      ['Division II', '10-12 points', ''],
      ['Division III', '13-17 points', ''],
      ['Division IV', '18-19 points', ''],
      ['Division V', '20-21 points', '']
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 40 },
      2: { cellWidth: 'auto' }
    }
  });

  // Add approval section
  const approvalStartY = doc.autoTable.previous.finalY + 15 || 240;
  doc.setFontSize(14);
  doc.text('Approved By', 20, approvalStartY);

  // Add teacher signature
  doc.setFontSize(12);
  doc.text('TEACHER', 20, approvalStartY + 10);
  doc.text(`NAME: ${report.teacher?.name || 'N/A'}`, 20, approvalStartY + 20);
  doc.text('SIGN: ___________________', 20, approvalStartY + 30);

  // Add head of school signature
  doc.text('HEAD OF SCHOOL', 120, approvalStartY + 10);
  doc.text(`NAME: ${report.headOfSchool?.name || 'N/A'}`, 120, approvalStartY + 20);
  doc.text('SIGN: ___________________', 120, approvalStartY + 30);

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('AGAPE LUTHERAN JUNIOR SEMINARY', 105, 290, { align: 'center' });
  }

  return doc;
};

/**
 * Generate a PDF for an A-Level class result report
 * @param {Object} report - The normalized class result report
 * @returns {jsPDF} - The generated PDF document
 */
export const generateALevelClassResultPDF = (report) => {
  // Create a new PDF document in landscape orientation
  const doc = new jsPDF('landscape');

  // Add school header
  doc.setFontSize(20); // Increased from 16
  doc.text('Evangelical Lutheran Church in Tanzania - Northern Diocese', 150, 15, { align: 'center' });
  doc.setFontSize(24); // Increased from 18
  doc.text('Agape Lutheran Junior Seminary', 150, 25, { align: 'center' });

  // Add contact information
  doc.setFontSize(12); // Increased from 10
  doc.text('P.O.BOX 8882,\nMoshi, Tanzania.', 20, 35);

  // Add school logo
  const logoUrl = `${window.location.origin}/images/logo.JPG`;
  try {
    doc.addImage(logoUrl, 'JPEG', 135, 30, 30, 30);
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
    // Fallback to text if image fails
    doc.setFontSize(16); // Increased from 14
    doc.setFont('helvetica', 'bold');
    doc.text('AGAPE', 150, 40, { align: 'center' });
    doc.text('LUTHERAN', 150, 47, { align: 'center' });
    doc.text('SEMINARY', 150, 54, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }

  // Add right-side contact information
  doc.setFontSize(12); // Increased from 10
  doc.text('Mobile phone: 0759767735\nEmail: infoagapeseminary@gmail.com', 280, 35, { align: 'right' });

  // Add report title
  doc.setFontSize(20); // Increased from 14
  doc.text('A-LEVEL CLASS RESULT REPORT', 150, 55, { align: 'center' });
  doc.setFontSize(16); // Increased from 12
  doc.text(`Class: ${report.className || ''} ${report.section || ''}`, 150, 65, { align: 'center' });
  doc.text(`Academic Year: ${report.academicYear || 'Unknown'}`, 150, 75, { align: 'center' });
  doc.text(`Exam: ${report.examName || ''}`, 150, 85, { align: 'center' });

  // Prepare student results data
  let students = report.students || [];

  if (students.length === 0) {
    doc.setFontSize(12);
    doc.text('No student results found', 150, 70, { align: 'center' });
    return doc;
  }

  // Sort students by rank for the PDF (descending order of performance)
  students = [...students].sort((a, b) => {
    // If rank is not available, sort by average marks
    if (!a.rank || !b.rank) {
      return parseFloat(b.averageMarks || 0) - parseFloat(a.averageMarks || 0);
    }
    return parseInt(a.rank || 0) - parseInt(b.rank || 0);
  });

  // Get all subjects from the first student (assuming all students have the same subjects)
  const firstStudent = students[0];
  const allSubjects = firstStudent.results || [];

  // Separate principal and subsidiary subjects
  const principalSubjects = allSubjects.filter(result => result.isPrincipal).map(result => result.subject);
  const subsidiarySubjects = allSubjects.filter(result => !result.isPrincipal).map(result => result.subject);

  // Prepare table headers
  const headers = ['#', 'Name', 'Roll No.'];

  // Add principal subject headers
  principalSubjects.forEach(subject => {
    headers.push(`${subject} (P)`);
  });

  // Add subsidiary subject headers
  subsidiarySubjects.forEach(subject => {
    headers.push(subject);
  });

  // Add summary headers
  headers.push('Total', 'Average', 'Points', 'Best 3', 'Division', 'Rank');

  // Prepare table data
  const tableData = students.map((student, index) => {
    const row = [
      index + 1,
      student.name,
      student.rollNumber
    ];

    // Add principal subject marks
    principalSubjects.forEach(subject => {
      const result = student.results.find(r => r.subject === subject);
      if (result) {
        // Try all possible property names for marks
        const marks = result.marks || result.marksObtained || result.score || 0;
        row.push(`${marks} (${result.grade})`);
      } else {
        row.push('-');
      }
    });

    // Add subsidiary subject marks
    subsidiarySubjects.forEach(subject => {
      const result = student.results.find(r => r.subject === subject);
      if (result) {
        // Try all possible property names for marks
        const marks = result.marks || result.marksObtained || result.score || 0;
        row.push(`${marks} (${result.grade})`);
      } else {
        row.push('-');
      }
    });

    // Add summary data
    row.push(
      student.totalMarks || 0,
      student.averageMarks || '0.00',
      student.totalPoints || 0,
      student.bestThreePoints || 0,
      student.division || 'N/A',
      student.rank || 'N/A'
    );

    return row;
  });

  // INNOVATIVE APPROACH: Adaptive Single-Page Report
  // Calculate optimal font size based on number of students and subjects
  const totalStudents = students.length;
  const totalSubjects = principalSubjects.length + subsidiarySubjects.length;
  const totalColumns = headers.length;

  // Dynamic scaling factors based on content amount
  const baseFontSize = 16; // Start with ideal font size
  let scaleFactor = 1.0;

  // Adjust scale factor based on content volume
  if (totalStudents > 20 || totalColumns > 15) {
    // More content needs smaller scale
    scaleFactor = 0.7;
  } else if (totalStudents > 15 || totalColumns > 12) {
    scaleFactor = 0.8;
  } else if (totalStudents > 10 || totalColumns > 10) {
    scaleFactor = 0.9;
  }

  // Calculate font sizes based on scale factor
  const headerFontSize = Math.max(Math.round(baseFontSize * scaleFactor), 10);
  const contentFontSize = Math.max(Math.round((baseFontSize - 2) * scaleFactor), 8);
  const subjectFontSize = Math.max(Math.round((baseFontSize - 4) * scaleFactor), 7);

  // Calculate optimal cell padding based on scale factor
  const cellPadding = Math.max(Math.round(4 * scaleFactor), 1);

  // Calculate optimal column widths based on scale factor
  // Make name column extremely narrow to save space
  const nameColumnWidth = Math.max(Math.round(20 * scaleFactor), 12); // Even narrower
  const rollColumnWidth = Math.max(Math.round(12 * scaleFactor), 6); // Even narrower
  const numColumnWidth = Math.max(Math.round(6 * scaleFactor), 4); // Even narrower

  // Add student results table with adaptive sizing
  doc.autoTable({
    startY: 95, // Space for header
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [46, 125, 50],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: headerFontSize,
      cellPadding: cellPadding,
      valign: 'middle',
      halign: 'center',
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    styles: {
      fontSize: contentFontSize,
      cellPadding: cellPadding,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      overflow: 'linebreak',
      cellWidth: 'wrap',
      fontStyle: 'bold', // Increase font weight for all content
      font: 'helvetica', // Use a more compact font
      fontWeight: 700, // Maximum font weight for better readability
      textColor: [0, 0, 0] // Ensure black text for better contrast
    },
    columnStyles: {
      0: { cellWidth: numColumnWidth, halign: 'center' }, // #
      1: {
        cellWidth: nameColumnWidth,
        halign: 'left',
        cellPadding: 1, // Minimal padding for name column
        overflow: 'ellipsize', // Truncate with ellipsis if too long
        minCellWidth: 12 // Ensure minimum width
      }, // Name
      2: { cellWidth: rollColumnWidth, halign: 'center' }, // Roll No.
    },
    // CRITICAL: Ensure all content fits on one page
    margin: { top: 95, right: 2, bottom: 20, left: 2 }, // Minimal margins
    tableWidth: 'wrap', // Let table determine width based on content
    horizontalPageBreak: false, // NO horizontal page breaks
    pageBreak: 'avoid', // Avoid page breaks
    rowPageBreak: 'avoid', // Avoid breaking rows across pages
    columnStyles: {}, // Will be dynamically calculated
    didDrawPage: function(data) {
      // Draw header only once
      doc.setFontSize(20 * scaleFactor);
      doc.text('Evangelical Lutheran Church in Tanzania - Northern Diocese', 150, 15, { align: 'center' });
      doc.setFontSize(24 * scaleFactor);
      doc.text('Agape Lutheran Junior Seminary', 150, 25, { align: 'center' });

      // Add contact information with scaled font
      doc.setFontSize(12 * scaleFactor);
      doc.text('P.O.BOX 8882,\nMoshi, Tanzania.', 20, 35);
      doc.text('Mobile phone: 0759767735\nEmail: infoagapeseminary@gmail.com', 280, 35, { align: 'right' });

      // Add report title with scaled font
      doc.setFontSize(18 * scaleFactor);
      doc.text('A-LEVEL CLASS RESULT REPORT', 150, 55, { align: 'center' });
      doc.setFontSize(16 * scaleFactor);
      doc.text(`Class: ${report.className || ''} ${report.section || ''}`, 150, 65, { align: 'center' });
      doc.text(`Academic Year: ${report.academicYear || 'Unknown'}`, 150, 75, { align: 'center' });
      doc.text(`Exam: ${report.examName || ''}`, 150, 85, { align: 'center' });

      // Add footer with scaled font
      doc.setFontSize(10 * scaleFactor);
      doc.text('Note: A-LEVEL Division is calculated based on best 3 principal subjects', 150, doc.internal.pageSize.height - 10, { align: 'center' });
    },
    willDrawCell: function(data) {
      // Adaptive cell styling based on content type and column position
      if (data.section === 'head') {
        // For subject headers, use vertical text to save space
        if (data.column.index > 2 && data.column.index < headers.length - 5) {
          data.cell.styles.fontSize = subjectFontSize;
          data.cell.styles.cellWidth = 'wrap';
          data.cell.styles.minCellWidth = 12 * scaleFactor; // Even narrower
          data.cell.styles.cellPadding = 1; // Minimal padding
          data.cell.styles.overflow = 'linebreak'; // Break lines if needed
        }
      }
      if (data.section === 'body') {
        // For all cells, ensure content stays within cell
        data.cell.styles.overflow = 'ellipsize'; // Use ellipsis for overflow
        data.cell.styles.cellPadding = 1; // Minimal padding for all cells

        // For subject marks and grades
        if (data.column.index > 2 && data.column.index < headers.length - 5) {
          data.cell.styles.fontSize = subjectFontSize;
          data.cell.styles.cellWidth = 'wrap';
          data.cell.styles.minCellWidth = 12 * scaleFactor; // Even narrower
        }
        // For summary columns (total, average, points, etc.)
        else if (data.column.index >= headers.length - 5) {
          data.cell.styles.fontSize = contentFontSize;
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontWeight = 700;
          // Make division column narrower
          if (data.column.raw === 'Division' || data.column.raw.includes('Division')) {
            data.cell.styles.cellWidth = Math.max(Math.round(20 * scaleFactor), 12); // Even narrower
          }
        }
        // For student name column
        else if (data.column.index === 1) {
          // Ensure student name is truncated if too long
          data.cell.styles.overflow = 'ellipsize';
          data.cell.styles.cellWidth = nameColumnWidth;
          data.cell.styles.minCellWidth = 12; // Minimum width
          data.cell.styles.maxCellWidth = nameColumnWidth; // Maximum width
        }
      }
    },
    // Handle table creation complete
    didParseCell: function(data) {
      // For subject headers, rotate text to save horizontal space
      if (data.section === 'head' && data.column.index > 2 && data.column.index < headers.length - 5) {
        const subject = data.cell.raw;
        // Store original text and prepare for rotation
        data.cell.text = subject;
        data.cell.styles.halign = 'center';
        data.cell.styles.valign = 'middle';
        data.cell.styles.cellWidth = 'wrap';
      }
    }
  });

  // Add class summary with adaptive scaling
  const summaryStartY = doc.autoTable.previous.finalY + (15 * scaleFactor) || 180;
  doc.setFontSize(18 * scaleFactor);
  doc.text('Class Summary', 20, summaryStartY);

  // Extract class summary data
  const classAverage = report.classAverage || 0;

  // Add class summary table with adaptive scaling
  doc.autoTable({
    startY: summaryStartY + (5 * scaleFactor),
    head: [['Total Students', 'Class Average']],
    body: [[totalStudents, `${classAverage.toFixed(2)}%`]],
    theme: 'grid',
    headStyles: {
      fillColor: [46, 125, 50],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 16 * scaleFactor,
      cellPadding: 5 * scaleFactor,
      halign: 'center'
    },
    styles: {
      fontSize: 16 * scaleFactor,
      cellPadding: 5 * scaleFactor,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 80 * scaleFactor }, // Scaled width
      1: { cellWidth: 80 * scaleFactor } // Scaled width
    },
    margin: { left: 20, right: 20 }
  });

  // Add A-Level division guide with adaptive scaling
  const guideStartY = doc.autoTable.previous.finalY + (15 * scaleFactor) || 210;
  doc.setFontSize(18 * scaleFactor);
  doc.text('A-Level Division Guide', 20, guideStartY);

  // Simplify the division guide for smaller reports
  let divisionGuideBody;
  if (scaleFactor < 0.8) {
    // Simplified version for very small scale factors
    divisionGuideBody = [
      ['Division I', '3-9', 'A=1, B=2, C=3, D=4, E=5, S=6, F=7'],
      ['Division II', '10-12', ''],
      ['Division III', '13-17', ''],
      ['Division IV', '18-19', ''],
      ['Division V', '20-21', '']
    ];
  } else {
    // Full version for larger scale factors
    divisionGuideBody = [
      ['Division I', '3-9 points', 'A (80-100%) = 1 point\nB (70-79%) = 2 points\nC (60-69%) = 3 points\nD (50-59%) = 4 points\nE (40-49%) = 5 points\nS (35-39%) = 6 points\nF (0-34%) = 7 points'],
      ['Division II', '10-12 points', ''],
      ['Division III', '13-17 points', ''],
      ['Division IV', '18-19 points', ''],
      ['Division V', '20-21 points', '']
    ];
  }

  // Add division guide table with adaptive scaling
  doc.autoTable({
    startY: guideStartY + (5 * scaleFactor),
    head: [['Division', 'Points Range', 'Grade Points']],
    body: divisionGuideBody,
    theme: 'grid',
    headStyles: {
      fillColor: [46, 125, 50],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 14 * scaleFactor,
      cellPadding: 3 * scaleFactor,
      halign: 'center'
    },
    styles: {
      fontSize: 12 * scaleFactor,
      cellPadding: 3 * scaleFactor
    },
    columnStyles: {
      0: { cellWidth: 60 * scaleFactor, halign: 'center' }, // Scaled width
      1: { cellWidth: 60 * scaleFactor, halign: 'center' }, // Scaled width
      2: { cellWidth: 'auto', fontSize: 10 * scaleFactor } // Scaled font for explanation
    },
    margin: { left: 10, right: 10 }
  });

  // Footer is now handled in the didDrawPage function of the main table
  // to ensure it appears on every page consistently

  return doc;
};

export default {
  generateALevelStudentResultPDF,
  generateALevelClassResultPDF
};
