import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate a PDF for an O-Level student result report
 * @param {Object} report - The normalized student result report
 * @returns {jsPDF} - The generated PDF document
 */
export const generateOLevelStudentResultPDF = (report) => {
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
  doc.text('O-LEVEL STUDENT RESULT REPORT', 105, 55, { align: 'center' });
  doc.setFontSize(16); // Increased from 12
  doc.text(`Academic Year: ${report.academicYear || ''}`, 105, 65, { align: 'center' });

  // Add student information
  doc.setFontSize(16); // Increased from 12
  doc.text(`Name: ${report.student?.fullName || report.studentDetails?.name || ''}`, 20, 80);
  doc.text(`Class: ${report.class?.fullName || report.studentDetails?.class || ''}`, 20, 90);
  doc.text(`Roll Number: ${report.student?.rollNumber || report.studentDetails?.rollNumber || ''}`, 20, 100);
  doc.text(`Rank: ${report.rank || report.studentDetails?.rank || 'N/A'} of ${report.totalStudents || report.studentDetails?.totalStudents || 'N/A'}`, 20, 110);

  // Add exam information
  doc.text(`Exam: ${report.exam?.name || report.examName || ''}`, 140, 80);
  doc.text(`Term: ${report.exam?.term || ''}`, 140, 90);
  doc.text(`Gender: ${report.student?.gender || report.studentDetails?.gender || ''}`, 140, 100);

  // Add subject results table
  const tableData = [];

  // Use either results or subjectResults based on what's available
  const subjectResults = report.results || report.subjectResults || [];

  // Map the subject results to table rows
  for (const result of subjectResults) {
    const subjectName = result.subject?.name || result.subject || '';
    const marks = result.marks !== undefined ? result.marks : (result.marksObtained || 0);
    const grade = result.grade || '';
    const points = result.points !== undefined ? result.points : '';
    const remarks = result.remarks || '';

    tableData.push([subjectName, marks, grade, points, remarks]);
  }

  // Add total row
  const totalMarks = report.totalMarks !== undefined ? report.totalMarks :
                    (report.summary?.totalMarks !== undefined ? report.summary.totalMarks : 0);
  const totalPoints = report.points !== undefined ? report.points :
                     (report.summary?.totalPoints !== undefined ? report.summary.totalPoints : 0);
  const bestSevenPoints = report.bestSevenPoints !== undefined ? report.bestSevenPoints :
                         (report.summary?.bestSevenPoints !== undefined ? report.summary.bestSevenPoints : 0);

  // Calculate division based on best seven points (O-Level division system)
  const calculateDivision = (points) => {
    if (points >= 7 && points <= 14) return 'I';
    if (points >= 15 && points <= 21) return 'II';
    if (points >= 22 && points <= 25) return 'III';
    if (points >= 26 && points <= 32) return 'IV';
    return '0';
  };

  // Get division or calculate it if not provided
  const calculatedDivision = report.division || report.summary?.division || calculateDivision(bestSevenPoints);

  tableData.push([
    'Total',
    totalMarks,
    '',
    totalPoints,
    'Performance'
  ]);

  doc.autoTable({
    startY: 120,
    head: [['Subject', 'Marks', 'Grade', 'Points', 'Remarks']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 14 }, // Increased from default
    footStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 14 }, // Increased from default
    styles: { fontSize: 12, cellPadding: 3 }, // Increased from 10
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 'auto' }
    }
  });

  // Add summary information
  const finalY = doc.lastAutoTable.finalY + 10;

  // Get summary data
  const averageMarks = report.averageMarks !== undefined ? report.averageMarks :
                      (report.summary?.averageMarks !== undefined ? report.summary.averageMarks : 0);
  // Use the previously calculated bestSevenPoints
  const displayDivision = calculatedDivision || 'N/A';
  const rank = report.rank !== undefined ? report.rank :
              (report.summary?.rank !== undefined ? report.summary.rank : 'N/A');
  const totalStudents = report.totalStudents !== undefined ? report.totalStudents :
                       (report.summary?.totalStudents !== undefined ? report.summary.totalStudents : 'N/A');

  // Add RESULT SUMMARY header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RESULT SUMMARY', 105, finalY, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // Add summary table
  doc.autoTable({
    startY: finalY + 10,
    head: [['Average Marks', 'Best 7 Points', 'Division', 'Rank']],
    body: [[`${averageMarks}%`, bestSevenPoints, displayDivision, `${rank} of ${totalStudents}`]],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 14 }, // Increased from default
    styles: { fontSize: 12, cellPadding: 3 }, // Increased from 10
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' }
    }
  });

  // Add grade distribution
  const gradeDistribution = report.gradeDistribution || report.summary?.gradeDistribution;
  if (gradeDistribution) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Grade Distribution', 105, finalY + 70, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    const gradeData = Object.entries(gradeDistribution).map(([grade, count]) => [
      grade, count
    ]);

    doc.autoTable({
      startY: finalY + 75,
      head: [['Grade', 'Count']],
      body: gradeData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 12 },
      styles: { fontSize: 12, cellPadding: 3 },
      margin: { left: 50, right: 50 },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' }
      }
    });
  }

  // Add division explanation
  doc.setFontSize(10);
  doc.text('Division Guide:', 20, finalY + 120);
  doc.text('Division I: 7-14 points | Division II: 15-21 points | Division III: 22-25 points | Division IV: 26-32 points | Division 0: 33+ points', 20, finalY + 130);

  // Add approval section
  const approvalY = finalY + 150;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('APPROVED BY', 105, approvalY, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // Academic Teacher
  doc.setFontSize(12);
  doc.text('1. ACADEMIC TEACHER NAME:', 30, approvalY + 20);
  doc.text('SIGN:', 30, approvalY + 35);
  doc.line(60, approvalY + 35, 200, approvalY + 35); // Signature line

  // Head of School
  doc.text('2. HEAD OF SCHOOL:', 30, approvalY + 55);
  doc.text('SIGN:', 30, approvalY + 70);
  doc.line(60, approvalY + 70, 200, approvalY + 70); // Signature line

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);

    // Check if we need to add a new page for the approval section
    if (i === pageCount && approvalY + 90 > doc.internal.pageSize.height - 30) {
      doc.addPage();

      // Re-add the approval section on the new page
      const newApprovalY = 30;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('APPROVED BY', 105, newApprovalY, { align: 'center' });
      doc.setFont('helvetica', 'normal');

      // Academic Teacher
      doc.setFontSize(12);
      doc.text('1. ACADEMIC TEACHER NAME:', 30, newApprovalY + 20);
      doc.text('SIGN:', 30, newApprovalY + 35);
      doc.line(60, newApprovalY + 35, 200, newApprovalY + 35); // Signature line

      // Head of School
      doc.text('2. HEAD OF SCHOOL:', 30, newApprovalY + 55);
      doc.text('SIGN:', 30, newApprovalY + 70);
      doc.line(60, newApprovalY + 70, 200, newApprovalY + 70); // Signature line
    }

    // Add page number and footer text
    doc.setFontSize(10);
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 20,
      { align: 'center' }
    );
    doc.text(
      'Evangelical Lutheran Church in Tanzania - Northern Diocese',
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  return doc;
};

/**
 * Generate a PDF for an O-Level class result report
 * @param {Object} report - The normalized class result report
 * @returns {jsPDF} - The generated PDF document
 */
export const generateOLevelClassResultPDF = (report) => {
  // Create a new PDF document
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
    doc.setFontSize(14);
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
  doc.text('O-LEVEL CLASS RESULT REPORT', 150, 55, { align: 'center' });
  doc.setFontSize(16); // Increased from 12
  doc.text(`${report.className || ''} ${report.section || ''} - ${report.examName || ''}`, 150, 65, { align: 'center' });
  doc.text(`Academic Year: ${report.academicYear || ''}`, 150, 75, { align: 'center' });

  // Add summary information
  doc.setFontSize(16); // Increased from default
  doc.text(`Total Students: ${report.totalStudents || ''}`, 20, 90);
  doc.text(`Class Average: ${report.classAverage?.toFixed(2) || ''}%`, 100, 90);

  // Create table headers
  const headers = ['Rank', 'Student Name', 'Sex'];

  // Add subject headers
  if (report.subjects) {
    for (const subject of report.subjects) {
      headers.push(`${subject.name} (Marks)`);
      headers.push(`${subject.name} (Grade)`);
    }
  }

  // Add summary headers
  headers.push('Total', 'Average', 'Division', 'Points', 'Rank');

  // Create table data
  const tableData = [];

  if (report.students) {
    // Sort students by rank for downloaded reports
    const sortedStudents = [...report.students].sort((a, b) => {
      const rankA = Number.parseInt(a.rank, 10) || 0;
      const rankB = Number.parseInt(b.rank, 10) || 0;
      return rankA - rankB;
    });

    for (const student of sortedStudents) {
      const row = [
        student.rank || '',
        student.name || student.studentName || '',
        student.sex || ''
      ];

      // Add subject results
      if (report.subjects) {
        for (const subject of report.subjects) {
          const subjectResult = student.results?.find(
            result => result.subjectId === subject.id || result.subject === subject.name
          );

          if (subjectResult) {
            row.push(subjectResult.marks || subjectResult.marksObtained || '');
            row.push(subjectResult.grade || '');
          } else {
            row.push('-');
            row.push('-');
          }
        }
      }

      // Add summary data
      row.push(
        student.totalMarks || '',
        student.averageMarks || '',
        student.division || '',
        student.points || student.totalPoints || '',
        student.rank || ''
      );

      tableData.push(row);
    }
  }

  // INNOVATIVE APPROACH: Adaptive Single-Page Report for O-Level
  // Calculate optimal font size based on number of students and subjects
  const totalStudents = report.students?.length || 0;
  const totalSubjects = headers.length - 6; // Excluding #, Name, Roll No, Total, Average, Division
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

  // Add the results table with adaptive sizing
  doc.autoTable({
    startY: 100,
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
    margin: { top: 100, right: 2, bottom: 20, left: 2 }, // Minimal margins
    tableWidth: 'wrap', // Let table determine width based on content
    horizontalPageBreak: false, // NO horizontal page breaks
    pageBreak: 'avoid', // Avoid page breaks
    rowPageBreak: 'avoid', // Avoid breaking rows across pages
    columnStyles: {}, // Will be dynamically calculated
    didDrawPage: function(data) {
      // Draw header only once with scaled font sizes
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
      doc.text('O-LEVEL CLASS RESULT REPORT', 150, 55, { align: 'center' });
      doc.setFontSize(16 * scaleFactor);
      doc.text(`${report.className || ''} ${report.section || ''} - ${report.examName || ''}`, 150, 65, { align: 'center' });
      doc.text(`Academic Year: ${report.academicYear || ''}`, 150, 75, { align: 'center' });

      // Add summary information with scaled font
      doc.setFontSize(16 * scaleFactor);
      doc.text(`Total Students: ${report.totalStudents || ''}`, 20, 90);
      doc.text(`Class Average: ${report.classAverage?.toFixed(2) || ''}%`, 100, 90);

      // Check if this is the last page and we need to add the approval section
      // This ensures the approval section is always visible on the last page
      const totalPages = doc.internal.getNumberOfPages();
      if (data.pageNumber === totalPages) {
        // Check if we're close to the bottom of the page
        const currentY = data.cursor?.y || doc.lastAutoTable?.finalY || 0;
        const pageHeight = doc.internal.pageSize.height;

        // If we're too close to the bottom and there's not enough space for approval section
        if (currentY > pageHeight - 100) {
          // Add a new page for the approval section
          doc.addPage();

          // Re-add the header on the new page
          doc.setFontSize(20 * scaleFactor);
          doc.text('Evangelical Lutheran Church in Tanzania - Northern Diocese', 150, 15, { align: 'center' });
          doc.setFontSize(24 * scaleFactor);
          doc.text('Agape Lutheran Junior Seminary', 150, 25, { align: 'center' });

          // Add RESULT SUMMARY header on the new page
          doc.setFontSize(18 * scaleFactor);
          doc.setFont('helvetica', 'bold');
          doc.text('RESULT SUMMARY (Continued)', 150, 40, { align: 'center' });
          doc.setFont('helvetica', 'normal');
        }
      }

      // Add footer with scaled font
      doc.setFontSize(10 * scaleFactor);
      doc.text('Note: O-LEVEL Division is calculated based on best 7 subjects', 150, doc.internal.pageSize.height - 20, { align: 'center' });

      // Add page numbers - using the pageCount variable already declared above
      doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, 150, doc.internal.pageSize.height - 10, { align: 'center' });
    },
    willDrawCell: function(data) {
      // Adaptive cell styling based on content type and column position
      if (data.section === 'head') {
        // For subject headers, use smaller font to save space
        if (data.column.index > 2 && data.column.index < headers.length - 3) {
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
        if (data.column.index > 2 && data.column.index < headers.length - 3) {
          data.cell.styles.fontSize = subjectFontSize;
          data.cell.styles.cellWidth = 'wrap';
          data.cell.styles.minCellWidth = 12 * scaleFactor; // Even narrower
        }
        // For summary columns (total, average, division)
        else if (data.column.index >= headers.length - 3) {
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
      // For subject headers, optimize text to save horizontal space
      if (data.section === 'head' && data.column.index > 2 && data.column.index < headers.length - 3) {
        const subject = data.cell.raw;
        // Store original text and prepare for optimal display
        data.cell.text = subject;
        data.cell.styles.halign = 'center';
        data.cell.styles.valign = 'middle';
        data.cell.styles.cellWidth = 'wrap';
      }
    }
  });

  // Add division distribution with adaptive scaling
  const finalY = doc.lastAutoTable.finalY + (10 * scaleFactor);

  // Calculate division distribution
  const divisions = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 };

  if (report.students) {
    for (const student of report.students) {
      const div = student.division || '';
      if (div && divisions[div] !== undefined) {
        divisions[div]++;
      }
    }
  }

  const divisionData = Object.entries(divisions).map(([division, count]) => [
    `Division ${division}`,
    count,
    report.students?.length ? `${(count / report.students.length * 100).toFixed(1)}%` : '0%'
  ]);

  doc.autoTable({
    startY: finalY + (5 * scaleFactor),
    head: [['Division', 'Count', 'Percentage']],
    body: divisionData,
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
      fontSize: 14 * scaleFactor,
      cellPadding: 5 * scaleFactor,
      halign: 'center'
    },
    margin: { left: 100 * scaleFactor, right: 100 * scaleFactor },
  });

  // Add RESULT SUMMARY section
  const summaryY = doc.lastAutoTable.finalY + (20 * scaleFactor);

  // Add RESULT SUMMARY header
  doc.setFontSize(18 * scaleFactor);
  doc.setFont('helvetica', 'bold');
  doc.text('RESULT SUMMARY', 150, summaryY, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // Create subject performance table
  const subjectHeaders = ['SUBJECT NAME', 'NO OF STUDENTS', 'PERFORMANCE', '', '', '', '', 'GPA'];
  const subjectSubHeaders = ['', '', 'A', 'B', 'C', 'D', 'F', ''];

  // Prepare subject performance data
  const subjectData = [];

  // Get subjects from the report
  const subjects = report.subjects || [];

  // For each subject, calculate grade distribution and GPA
  for (const subject of subjects) {
    // Initialize grade counts
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    let totalStudents = 0;
    let totalPoints = 0;

    // Count grades for this subject
    if (report.students) {
      for (const student of report.students) {
        const subjectResult = student.results?.find(
          result => result.subjectId === subject.id || result.subject === subject.name
        );

        if (subjectResult && subjectResult.grade) {
          totalStudents++;
          const grade = subjectResult.grade;
          if (gradeDistribution[grade] !== undefined) {
            gradeDistribution[grade]++;
          }

          // Calculate points for GPA
          const points = {
            'A': 1, 'B': 2, 'C': 3, 'D': 4, 'F': 5
          }[grade] || 0;

          if (points > 0) {
            totalPoints += points;
          }
        }
      }
    }

    // Calculate GPA
    const gpa = totalStudents > 0 ? (totalPoints / totalStudents).toFixed(2) : '-';

    // Add row for this subject
    subjectData.push([
      subject.name,
      totalStudents,
      gradeDistribution.A,
      gradeDistribution.B,
      gradeDistribution.C,
      gradeDistribution.D,
      gradeDistribution.F,
      gpa
    ]);
  }

  // Add subject performance table
  doc.autoTable({
    startY: summaryY + (10 * scaleFactor),
    head: [subjectHeaders, subjectSubHeaders],
    body: subjectData,
    theme: 'grid',
    headStyles: {
      fillColor: [46, 125, 50],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 14 * scaleFactor,
      cellPadding: 3 * scaleFactor,
      halign: 'center',
      valign: 'middle'
    },
    styles: {
      fontSize: 12 * scaleFactor,
      cellPadding: 3 * scaleFactor,
      halign: 'center',
      fontWeight: 'bold'
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 60 * scaleFactor }, // Subject name
      1: { halign: 'center' }, // No of students
      2: { halign: 'center' }, // A
      3: { halign: 'center' }, // B
      4: { halign: 'center' }, // C
      5: { halign: 'center' }, // D
      6: { halign: 'center' }, // F
      7: { halign: 'center' }  // GPA
    },
    margin: { left: 20 * scaleFactor, right: 20 * scaleFactor },
  });

  // Add APPROVED BY section
  const approvalY = doc.lastAutoTable.finalY + (20 * scaleFactor);

  // Add APPROVED BY header
  doc.setFontSize(16 * scaleFactor);
  doc.setFont('helvetica', 'bold');
  doc.text('APPROVED BY', 150, approvalY, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // Academic Teacher
  doc.setFontSize(12 * scaleFactor);
  doc.text('1. ACADEMIC TEACHER NAME:', 50, approvalY + (15 * scaleFactor));
  doc.text('SIGN:', 50, approvalY + (25 * scaleFactor));
  doc.line(80, approvalY + (25 * scaleFactor), 200, approvalY + (25 * scaleFactor)); // Signature line

  // Head of School
  doc.text('2. HEAD OF SCHOOL:', 50, approvalY + (40 * scaleFactor));
  doc.text('SIGN:', 50, approvalY + (50 * scaleFactor));
  doc.line(80, approvalY + (50 * scaleFactor), 200, approvalY + (50 * scaleFactor)); // Signature line

  // Footer is now handled in the didDrawPage function of the main table
  // to ensure it appears on every page consistently

  return doc;
};

export default {
  generateOLevelStudentResultPDF,
  generateOLevelClassResultPDF
};
