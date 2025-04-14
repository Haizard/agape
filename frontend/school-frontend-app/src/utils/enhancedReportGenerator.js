import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate an enhanced PDF for a class result report
 * @param {Object} report - The normalized class result report
 * @param {string} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {jsPDF} - The generated PDF document
 */
export const generateEnhancedClassReportPDF = (report, educationLevel = 'O_LEVEL') => {
  // Create a new PDF document in landscape orientation
  const doc = new jsPDF('landscape');

  // Set default font
  doc.setFont('helvetica');

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`OPEN TEST RESULT - ${report.year || new Date().getFullYear()}`, doc.internal.pageSize.width / 2, 20, { align: 'center' });

  // Add class name
  doc.setFontSize(14);
  doc.text(`Class Name: ${report.className || 'Unknown'}`, 14, 30);

  // Add education level
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${educationLevel === 'O_LEVEL' ? 'O-Level' : 'A-Level'} Results`, 14, 40);

  // Get all subjects
  const subjects = report.subjects || [];

  // Prepare table headers
  const baseHeaders = ['#', 'STUDENT NAME', 'SEX'];
  const subjectHeaders = subjects.map(subject => subject.code || subject.name);
  const summaryHeaders = ['TOTAL', 'AVERAGE', 'DIVISION', 'POINTS', 'RANK'];
  const allHeaders = [...baseHeaders, ...subjectHeaders, ...summaryHeaders];

  // Prepare table data
  const tableData = [];

  // Process each student
  (report.students || []).forEach((student, index) => {
    const row = [
      index + 1,
      student.studentName || `${student.firstName} ${student.lastName}`,
      student.sex || student.gender || '-'
    ];

    // Add subject marks
    subjects.forEach(subject => {
      // Find the subject result for this student
      const subjectResult = student.subjects?.[subject.id] ||
                           student.subjectResults?.find(r => r.subjectId === subject.id) ||
                           student.results?.find(r => r.subject?.name === subject.name);

      // Get the marks, handling missing values
      const marks = subjectResult?.marks ||
                   subjectResult?.marksObtained ||
                   (subjectResult?.present ? subjectResult.marks : '-');

      row.push(marks === null || marks === undefined ? '-' : marks);
    });

    // Add summary columns
    row.push(
      student.totalMarks || '-',
      student.averageMarks || '-',
      student.division || '-',
      student.points || student.totalPoints || '-',
      student.rank || '-'
    );

    tableData.push(row);
  });

  // Add student results table
  doc.autoTable({
    head: [allHeaders],
    body: tableData,
    startY: 40,
    styles: { fontSize: 8, cellPadding: 1 },
    headStyles: { fillColor: [70, 70, 70], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10 }, // #
      1: { cellWidth: 40 }, // Student Name
      2: { cellWidth: 10 }, // Sex
    },
    didDrawPage: (data) => {
      // Add page number to footer
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(
        `Page ${pageNumber}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );

      // Add school name to footer
      doc.text(
        'St. John Vianney Secondary School',
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
  });

  // Calculate subject summary
  const subjectSummary = [];

  subjects.forEach(subject => {
    // Calculate grade distribution for this subject
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    let totalPoints = 0;
    let studentCount = 0;

    // Process each student's result for this subject
    (report.students || []).forEach(student => {
      const subjectResult = student.subjects?.[subject.id] ||
                           student.subjectResults?.find(r => r.subjectId === subject.id) ||
                           student.results?.find(r => r.subject?.name === subject.name);

      if (subjectResult && subjectResult.grade) {
        gradeDistribution[subjectResult.grade] = (gradeDistribution[subjectResult.grade] || 0) + 1;
        totalPoints += subjectResult.points || 0;
        studentCount++;
      }
    });

    // Calculate GPA (1-5 scale, A=1, F=5)
    const gpa = studentCount > 0 ?
      ((gradeDistribution.A * 1 + gradeDistribution.B * 2 + gradeDistribution.C * 3 +
        gradeDistribution.D * 4 + gradeDistribution.F * 5) / studentCount).toFixed(2) :
      '-';

    subjectSummary.push([
      subject.name,
      studentCount,
      gradeDistribution.A || 0,
      gradeDistribution.B || 0,
      gradeDistribution.C || 0,
      gradeDistribution.D || 0,
      gradeDistribution.F || 0,
      gpa
    ]);
  });

  // Add subject summary table
  doc.addPage();

  // Add title to new page
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject Summary', 14, 20);

  // Add subject summary table
  doc.autoTable({
    head: [['SUBJECT', 'NO OF STUDENTS', 'A', 'B', 'C', 'D', 'F', 'GPA']],
    body: subjectSummary,
    startY: 30,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [70, 70, 70], textColor: 255, fontStyle: 'bold' },
    didDrawPage: (data) => {
      // Add page number to footer
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(
        `Page ${pageNumber}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );

      // Add school name to footer
      doc.text(
        'St. John Vianney Secondary School',
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
  });

  // Add approvals section
  const finalY = doc.autoTable.previous.finalY + 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('APPROVED BY', 14, finalY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ACADEMIC TEACHER NAME : ___________________________', 14, finalY + 15);
  doc.text('SIGN: ___________________________', 14, finalY + 25);

  doc.text('HEAD OF SCHOOL NAME   : ___________________________', 150, finalY + 15);
  doc.text('SIGN: ___________________________', 150, finalY + 25);

  return doc;
};

/**
 * Generate an enhanced PDF for a student result report
 * @param {Object} report - The normalized student result report
 * @param {string} educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @returns {jsPDF} - The generated PDF document
 */
export const generateEnhancedStudentReportPDF = (report, educationLevel = 'O_LEVEL') => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Set default font
  doc.setFont('helvetica');

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`OPEN TEST RESULT - ${report.year || new Date().getFullYear()}`, doc.internal.pageSize.width / 2, 20, { align: 'center' });

  // Add student information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Student Name: ${report.studentDetails?.name || 'Unknown'}`, 14, 30);
  doc.text(`Class: ${report.studentDetails?.class || 'Unknown'}`, 14, 40);
  doc.text(`Roll Number: ${report.studentDetails?.rollNumber || 'Unknown'}`, 14, 50);
  doc.text(`Gender: ${report.studentDetails?.gender || 'Unknown'}`, 14, 60);

  // Prepare subject results table
  const subjectResults = report.subjectResults || report.results || [];

  const tableData = subjectResults.map((result, index) => [
    index + 1,
    result.subject?.name || result.subject,
    result.marks || result.marksObtained || '-',
    result.grade || '-',
    result.points || '-',
    result.remarks || '-'
  ]);

  // Add subject results table
  doc.autoTable({
    head: [['#', 'SUBJECT', 'MARKS', 'GRADE', 'POINTS', 'REMARKS']],
    body: tableData,
    startY: 70,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [70, 70, 70], textColor: 255, fontStyle: 'bold' },
    didDrawPage: (data) => {
      // Add page number to footer
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(
        `Page ${pageNumber}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );

      // Add school name to footer
      doc.text(
        'St. John Vianney Secondary School',
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
  });

  // Add summary
  const finalY = doc.autoTable.previous.finalY + 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', 14, finalY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Marks: ${report.summary?.totalMarks || '-'}`, 14, finalY + 10);
  doc.text(`Average: ${report.summary?.averageMarks || '-'}`, 14, finalY + 20);
  doc.text(`Division: ${report.summary?.division || '-'}`, 14, finalY + 30);
  doc.text(`Points: ${report.summary?.totalPoints || '-'}`, 14, finalY + 40);
  doc.text(`Rank: ${report.summary?.rank || '-'}`, 14, finalY + 50);

  // Add approvals section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('APPROVED BY', 14, finalY + 70);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ACADEMIC TEACHER NAME : ___________________________', 14, finalY + 85);
  doc.text('SIGN: ___________________________', 14, finalY + 95);

  doc.text('HEAD OF SCHOOL NAME   : ___________________________', 14, finalY + 115);
  doc.text('SIGN: ___________________________', 14, finalY + 125);

  return doc;
};

export default {
  generateEnhancedClassReportPDF,
  generateEnhancedStudentReportPDF
};
