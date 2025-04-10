const PDFDocument = require('pdfkit');

/**
 * Generate a student result report PDF
 * @param {Object} report - The report data
 * @param {Object} res - Express response object
 */
const generateStudentResultPDF = (report, res) => {
  // Create a new PDF document
  const doc = new PDFDocument({
    margin: 30,
    size: 'A4'
  });

  // Pipe the PDF to the response
  doc.pipe(res);

  // Set default font
  doc.font('Helvetica');

  // Add header
  doc.fontSize(16).text(`${report.examName.toUpperCase()} - ${new Date().getFullYear()}`, { align: 'center' });
  doc.moveDown(0.5);

  // Add school name
  doc.fontSize(14).text('St. John Vianney Secondary School', { align: 'center' });
  doc.fontSize(12).text('Student Result Report', { align: 'center' });
  doc.moveDown(1);

  // Add student information
  const studentDetails = report.studentDetails || {};
  const studentName = studentDetails.name || (report.student ? report.student.fullName : 'Unknown');
  const className = studentDetails.class || (report.class ? report.class.fullName : 'Unknown');
  const gender = studentDetails.gender || 'Unknown';

  doc.fontSize(12);
  doc.text(`Name: ${studentName}`, { continued: true });
  doc.text(`Class: ${className}`, { align: 'right' });

  doc.text(`Exam: ${report.examName}`, { continued: true });
  doc.text(`Term: ${report.exam ? report.exam.term : 'Term 1'}`, { align: 'right' });

  doc.moveDown(2);

  // Add subject results table
  doc.fontSize(14).text('Subject Results', { align: 'center' });
  doc.moveDown(1);

  // Calculate column widths
  const pageWidth = doc.page.width - 60; // Accounting for margins
  const subjectWidth = 150;
  const marksWidth = 80;
  const gradeWidth = 80;
  const pointsWidth = 80;
  const remarksWidth = pageWidth - subjectWidth - marksWidth - gradeWidth - pointsWidth;

  // Draw table header
  const tableTop = doc.y;
  doc.fontSize(10).font('Helvetica-Bold');

  doc.text('Subject', 30, tableTop, { width: subjectWidth });
  doc.text('Marks', 30 + subjectWidth, tableTop, { width: marksWidth, align: 'center' });
  doc.text('Grade', 30 + subjectWidth + marksWidth, tableTop, { width: gradeWidth, align: 'center' });
  doc.text('Points', 30 + subjectWidth + marksWidth + gradeWidth, tableTop, { width: pointsWidth, align: 'center' });
  doc.text('Remarks', 30 + subjectWidth + marksWidth + gradeWidth + pointsWidth, tableTop, { width: remarksWidth });

  // Draw horizontal line
  doc.moveTo(30, tableTop + 15).lineTo(doc.page.width - 30, tableTop + 15).stroke();

  // Reset font
  doc.font('Helvetica');

  // Get subject results
  const subjectResults = report.subjectResults || report.results || [];

  // Draw table rows
  let rowTop = tableTop + 20;

  subjectResults.forEach(result => {
    const subject = result.subject || 'Unknown';
    const marks = result.marks || result.marksObtained || 0;
    const grade = result.grade || '-';
    const points = result.points || 0;
    const remarks = result.remarks || '';

    doc.text(subject, 30, rowTop, { width: subjectWidth });
    doc.text(String(marks), 30 + subjectWidth, rowTop, { width: marksWidth, align: 'center' });
    doc.text(grade, 30 + subjectWidth + marksWidth, rowTop, { width: gradeWidth, align: 'center' });
    doc.text(String(points), 30 + subjectWidth + marksWidth + gradeWidth, rowTop, { width: pointsWidth, align: 'center' });
    doc.text(remarks, 30 + subjectWidth + marksWidth + gradeWidth + pointsWidth, rowTop, { width: remarksWidth });

    rowTop += 20;
  });

  // Draw horizontal line
  doc.moveTo(30, rowTop - 5).lineTo(doc.page.width - 30, rowTop - 5).stroke();

  // Add total row
  doc.font('Helvetica-Bold');
  doc.text('Total', 30, rowTop, { width: subjectWidth });

  const totalMarks = report.totalMarks || (report.summary ? report.summary.totalMarks : 0);
  const totalPoints = report.points || (report.summary ? report.summary.totalPoints : 0);

  doc.text(String(totalMarks), 30 + subjectWidth, rowTop, { width: marksWidth, align: 'center' });
  doc.text('', 30 + subjectWidth + marksWidth, rowTop, { width: gradeWidth, align: 'center' });
  doc.text(String(totalPoints), 30 + subjectWidth + marksWidth + gradeWidth, rowTop, { width: pointsWidth, align: 'center' });
  doc.text('Performance', 30 + subjectWidth + marksWidth + gradeWidth + pointsWidth, rowTop, { width: remarksWidth });

  // Draw horizontal line
  doc.moveTo(30, rowTop + 15).lineTo(doc.page.width - 30, rowTop + 15).stroke();

  // Add some space
  rowTop += 30;

  // Add summary section
  doc.fontSize(14).text('Performance Summary', { align: 'center' });
  doc.moveDown(1);

  // Get summary data
  const summary = report.summary || {};
  const averageMarks = summary.averageMarks || report.averageMarks || '0.00';
  const bestSevenPoints = summary.bestSevenPoints || report.bestSevenPoints || 0;
  const division = summary.division || report.division || 'N/A';
  const rank = summary.rank || report.rank || 'N/A';

  // Add division calculation explanation
  doc.fontSize(10).font('Helvetica-Bold').text('Division Calculation (Based on Best 7 Subjects)', { align: 'center' });
  doc.moveDown(0.5);

  // Create a table for division explanation
  const divisionExplanation = [
    ['Division', 'Points Range', 'Grade Points'],
    ['I', '7-14 points', 'A (75-100%) = 1 point'],
    ['II', '15-21 points', 'B (65-74%) = 2 points'],
    ['III', '22-25 points', 'C (50-64%) = 3 points'],
    ['IV', '26-32 points', 'D (30-49%) = 4 points'],
    ['0', '33-36 points', 'F (0-29%) = 5 points']
  ];

  // Draw division explanation table
  const divTableTop = doc.y;
  const divColWidths = [(pageWidth - 60) / 3, (pageWidth - 60) / 3, (pageWidth - 60) / 3];

  // Draw header
  doc.font('Helvetica-Bold');
  doc.text(divisionExplanation[0][0], 30, divTableTop, { width: divColWidths[0], align: 'center' });
  doc.text(divisionExplanation[0][1], 30 + divColWidths[0], divTableTop, { width: divColWidths[1], align: 'center' });
  doc.text(divisionExplanation[0][2], 30 + divColWidths[0] + divColWidths[1], divTableTop, { width: divColWidths[2], align: 'center' });

  // Draw rows
  doc.font('Helvetica');
  let divRowTop = divTableTop + 20;

  for (let i = 1; i < divisionExplanation.length; i++) {
    doc.text(divisionExplanation[i][0], 30, divRowTop, { width: divColWidths[0], align: 'center' });
    doc.text(divisionExplanation[i][1], 30 + divColWidths[0], divRowTop, { width: divColWidths[1], align: 'center' });
    doc.text(divisionExplanation[i][2], 30 + divColWidths[0] + divColWidths[1], divRowTop, { width: divColWidths[2], align: 'center' });
    divRowTop += 15;
  }

  doc.moveDown(2);

  // Draw summary table
  const summaryTop = doc.y;
  const summaryColWidth = (pageWidth - 60) / 2;

  doc.fontSize(10).font('Helvetica');

  doc.text(`Total Marks: ${totalMarks}`, 30, summaryTop, { width: summaryColWidth });
  doc.text(`Average Marks: ${averageMarks}%`, 30 + summaryColWidth, summaryTop, { width: summaryColWidth });

  doc.text(`Total Points: ${totalPoints}`, 30, summaryTop + 20, { width: summaryColWidth });
  doc.text(`Best Seven Points: ${bestSevenPoints}`, 30 + summaryColWidth, summaryTop + 20, { width: summaryColWidth });

  doc.text(`Division: ${division}`, 30, summaryTop + 40, { width: summaryColWidth });
  doc.text(`Rank: ${rank}`, 30 + summaryColWidth, summaryTop + 40, { width: summaryColWidth });

  // Add some space
  doc.moveDown(2);

  // Add approval section
  doc.fontSize(12).font('Helvetica-Bold').text('APPROVED BY', { align: 'left' });
  doc.moveDown(1);

  const approvalTop = doc.y;

  // Academic teacher approval
  doc.fontSize(10).font('Helvetica');
  doc.text('1. ACADEMIC TEACHER', 30, approvalTop);
  doc.text('NAME :', 150, approvalTop);
  doc.moveTo(200, approvalTop + 10).lineTo(400, approvalTop + 10).stroke();

  doc.text('SIGN :', 150, approvalTop + 20);
  doc.moveTo(200, approvalTop + 30).lineTo(400, approvalTop + 30).stroke();

  // Head of school approval
  doc.text('2. HEAD OF SCHOOL', 30, approvalTop + 40);
  doc.text('NAME :', 150, approvalTop + 40);
  doc.moveTo(200, approvalTop + 50).lineTo(400, approvalTop + 50).stroke();

  doc.text('SIGN :', 150, approvalTop + 60);
  doc.moveTo(200, approvalTop + 70).lineTo(400, approvalTop + 70).stroke();

  // Add footer
  doc.fontSize(8)
    .text(
      `Generated on ${new Date().toLocaleDateString()} - St. John Vianney Secondary School`,
      30,
      doc.page.height - 50,
      { align: 'center' }
    );

  // Finalize the PDF
  doc.end();
};

module.exports = {
  generateStudentResultPDF
};
