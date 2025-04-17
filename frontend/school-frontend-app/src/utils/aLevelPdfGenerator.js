import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatALevelDivision, formatALevelGrade, getALevelGradeRemarks } from './resultDataStructures';

/**
 * Generate a PDF for an A-Level student result report
 * @param {Object} report - The normalized student result report
 * @returns {jsPDF} - The generated PDF document
 */
export const generateALevelStudentResultPDF = (report) => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Add school header
  doc.setFontSize(16);
  doc.text('Evangelical Lutheran Church in Tanzania - Northern Diocese', 105, 15, { align: 'center' });
  doc.setFontSize(18);
  doc.text('Agape Lutheran Junior Seminary', 105, 25, { align: 'center' });

  // Add contact information
  doc.setFontSize(10);
  doc.text('P.O.BOX 8882,\nMoshi, Tanzania.', 20, 35);

  // Add Lutheran Church logo
  const logoUrl = `${window.location.origin}/images/lutheran_logo.png`;
  try {
    doc.addImage(logoUrl, 'PNG', 85, 30, 30, 30);
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
  }

  // Add right-side contact information
  doc.setFontSize(10);
  doc.text('Mobile phone: 0759767735\nEmail: infoagapeseminary@gmail.com', 170, 35, { align: 'right' });

  // Add report title
  doc.setFontSize(14);
  doc.text('A-LEVEL STUDENT RESULT REPORT', 105, 55, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Academic Year: ${report.academicYear || 'Unknown'}`, 105, 65, { align: 'center' });

  // Add student information
  doc.setFontSize(12);
  doc.text(`Name: ${report.studentDetails?.name || report.student?.fullName || ''}`, 20, 80);
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
  doc.setFontSize(14);
  doc.text('Principal Subjects', 20, 120);

  if (principalSubjects.length > 0) {
    doc.autoTable({
      startY: 125,
      head: [['Subject', 'Marks', 'Grade', 'Points', 'Remarks']],
      body: principalSubjects.map(result => [
        result.subject,
        result.marks || result.marksObtained || 0,
        result.grade || '',
        result.points || 0,
        result.remarks || ''
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 }
    });
  } else {
    doc.text('No principal subjects found', 20, 100);
  }

  // Add subsidiary subjects table
  const subsidiaryStartY = doc.autoTable.previous.finalY + 15 || 120;
  doc.setFontSize(14);
  doc.text('Subsidiary Subjects', 20, subsidiaryStartY);

  if (subsidiarySubjects.length > 0) {
    doc.autoTable({
      startY: subsidiaryStartY + 5,
      head: [['Subject', 'Marks', 'Grade', 'Points', 'Remarks']],
      body: subsidiarySubjects.map(result => [
        result.subject,
        result.marks || result.marksObtained || 0,
        result.grade || '',
        result.points || 0,
        result.remarks || ''
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 }
    });
  } else {
    doc.text('No subsidiary subjects found', 20, subsidiaryStartY + 10);
  }

  // Add summary
  const summaryStartY = doc.autoTable.previous.finalY + 15 || 150;
  doc.setFontSize(14);
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
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 }
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
  doc.setFontSize(16);
  doc.text('Evangelical Lutheran Church in Tanzania - Northern Diocese', 150, 15, { align: 'center' });
  doc.setFontSize(18);
  doc.text('Agape Lutheran Junior Seminary', 150, 25, { align: 'center' });

  // Add contact information
  doc.setFontSize(10);
  doc.text('P.O.BOX 8882,\nMoshi, Tanzania.', 20, 35);

  // Add Lutheran Church logo
  const logoUrl = `${window.location.origin}/images/lutheran_logo.png`;
  try {
    doc.addImage(logoUrl, 'PNG', 135, 30, 30, 30);
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
  }

  // Add right-side contact information
  doc.setFontSize(10);
  doc.text('Mobile phone: 0759767735\nEmail: infoagapeseminary@gmail.com', 280, 35, { align: 'right' });

  // Add report title
  doc.setFontSize(14);
  doc.text('A-LEVEL CLASS RESULT REPORT', 150, 55, { align: 'center' });
  doc.setFontSize(12);
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
      row.push(result ? `${result.marks} (${result.grade})` : '-');
    });

    // Add subsidiary subject marks
    subsidiarySubjects.forEach(subject => {
      const result = student.results.find(r => r.subject === subject);
      row.push(result ? `${result.marks} (${result.grade})` : '-');
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

  // Add student results table
  doc.autoTable({
    startY: 65,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 10 }, // #
      1: { cellWidth: 40 }, // Name
      2: { cellWidth: 20 }, // Roll No.
    }
  });

  // Add class summary
  const summaryStartY = doc.autoTable.previous.finalY + 15 || 180;
  doc.setFontSize(14);
  doc.text('Class Summary', 20, summaryStartY);

  // Extract class summary data
  const classAverage = report.classAverage || 0;
  const totalStudents = report.totalStudents || students.length;

  // Add class summary table
  doc.autoTable({
    startY: summaryStartY + 5,
    head: [['Total Students', 'Class Average']],
    body: [[totalStudents, `${classAverage.toFixed(2)}%`]],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 40 }
    }
  });

  // Add A-Level division guide
  const guideStartY = doc.autoTable.previous.finalY + 15 || 210;
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

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Page ${i} of ${pageCount}`, 150, 200, { align: 'center' });
    doc.text('Note: A-LEVEL Division is calculated based on best 3 principal subjects', 150, 205, { align: 'center' });
  }

  return doc;
};

export default {
  generateALevelStudentResultPDF,
  generateALevelClassResultPDF
};
