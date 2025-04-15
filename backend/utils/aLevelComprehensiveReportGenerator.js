const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Generate a comprehensive A-LEVEL student result report PDF
 * This report shows both Principal and Subsidiary subjects with all performance metrics
 * and provides empty templates when no results exist
 *
 * @param {Object} report - The report data
 * @param {Object} res - Express response object
 */
const generateALevelComprehensiveReportPDF = (report, res) => {
  // Check if response is already sent
  if (res.headersSent) {
    console.error('Headers already sent, cannot generate PDF');
    return;
  }
  // Create a new PDF document
  const doc = new PDFDocument({
    margin: 30,
    size: 'A4'
  });

  // Pipe the PDF to the response with error handling
  try {
    doc.pipe(res);
  } catch (error) {
    console.error('Error piping PDF to response:', error);
    // If there's an error, end the document to prevent further issues
    doc.end();
    return;
  }

  // Set font
  doc.font('Helvetica');

  // Add school header
  doc.fontSize(16).text('Evangelical Lutheran Church in Tanzania - Northern Diocese', { align: 'center' });
  doc.fontSize(18).text('Agape Lutheran Junior Seminary', { align: 'center' });
  doc.moveDown(0.5);

  // Add contact information
  doc.fontSize(10);
  doc.text('P.O.BOX 8882,\nMoshi, Tanzania.', 50, 60);
  doc.text('Tel: +255 27 2755088\nEmail: agapelutheran@elct.org', 400, 60, { align: 'right' });

  // Add report title
  doc.fontSize(14).text(`${report.formLevel === 5 ? 'Form 5' : report.formLevel === 6 ? 'Form 6' : 'A-Level'} Academic Report`, { align: 'center' });
  doc.fontSize(12).text(`${report.examName || 'Examination'}`, { align: 'center' });
  doc.fontSize(10).text(`Academic Year: ${report.academicYear || new Date().getFullYear()}`, { align: 'center' });
  doc.moveDown();

  // Add student information
  doc.fontSize(12).text('Student Information', { underline: true });
  doc.fontSize(10);
  doc.text(`Name: ${report.studentDetails?.name || 'N/A'}`);
  doc.text(`Roll Number: ${report.studentDetails?.rollNumber || 'N/A'}`);
  doc.text(`Class: ${report.studentDetails?.class || 'N/A'}`);
  doc.text(`Gender: ${report.studentDetails?.gender || 'N/A'}`);
  doc.text(`Subject Combination: ${report.studentDetails?.subjectCombination || 'N/A'}`);
  doc.moveDown();

  // Add principal subjects table
  doc.fontSize(12).text('Principal Subjects', { underline: true });
  doc.moveDown(0.5);

  // Define table layout
  const principalTableTop = doc.y;
  const principalTableLeft = 50;
  const principalColWidths = [40, 200, 60, 60, 60, 80];
  const principalRowHeight = 25;

  // Draw table headers
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Code', principalTableLeft, principalTableTop);
  doc.text('Subject', principalTableLeft + principalColWidths[0], principalTableTop);
  doc.text('Marks', principalTableLeft + principalColWidths[0] + principalColWidths[1], principalTableTop);
  doc.text('Grade', principalTableLeft + principalColWidths[0] + principalColWidths[1] + principalColWidths[2], principalTableTop);
  doc.text('Points', principalTableLeft + principalColWidths[0] + principalColWidths[1] + principalColWidths[2] + principalColWidths[3], principalTableTop);
  doc.text('Remarks', principalTableLeft + principalColWidths[0] + principalColWidths[1] + principalColWidths[2] + principalColWidths[3] + principalColWidths[4], principalTableTop);

  // Draw horizontal line
  doc.moveTo(principalTableLeft, principalTableTop + 15)
    .lineTo(principalTableLeft + principalColWidths.reduce((sum, width) => sum + width, 0), principalTableTop + 15)
    .stroke();

  // Draw principal subjects
  doc.font('Helvetica').fontSize(10);
  let principalRowTop = principalTableTop + 20;

  if (report.principalSubjects && report.principalSubjects.length > 0) {
    for (const subject of report.principalSubjects) {
      doc.text(subject.code || '-', principalTableLeft, principalRowTop);
      doc.text(subject.subject || '-', principalTableLeft + principalColWidths[0], principalRowTop);
      doc.text(subject.marks !== undefined && subject.marks !== null ? subject.marks.toString() : '-', principalTableLeft + principalColWidths[0] + principalColWidths[1], principalRowTop);
      doc.text(subject.grade || '-', principalTableLeft + principalColWidths[0] + principalColWidths[1] + principalColWidths[2], principalRowTop);
      doc.text(subject.points !== undefined && subject.points !== null ? subject.points.toString() : '-', principalTableLeft + principalColWidths[0] + principalColWidths[1] + principalColWidths[2] + principalColWidths[3], principalRowTop);
      doc.text(subject.remarks || '-', principalTableLeft + principalColWidths[0] + principalColWidths[1] + principalColWidths[2] + principalColWidths[3] + principalColWidths[4], principalRowTop);

      principalRowTop += principalRowHeight;
    }
  } else {
    doc.text('No principal subjects found', principalTableLeft, principalRowTop, { italic: true });
    principalRowTop += principalRowHeight;
  }

  doc.moveDown(2);

  // Add subsidiary subjects table
  doc.fontSize(12).text('Subsidiary Subjects', { underline: true });
  doc.moveDown(0.5);

  // Define table layout
  const subsidiaryTableTop = doc.y;
  const subsidiaryTableLeft = 50;
  const subsidiaryColWidths = [40, 200, 60, 60, 60, 80];
  const subsidiaryRowHeight = 25;

  // Draw table headers
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Code', subsidiaryTableLeft, subsidiaryTableTop);
  doc.text('Subject', subsidiaryTableLeft + subsidiaryColWidths[0], subsidiaryTableTop);
  doc.text('Marks', subsidiaryTableLeft + subsidiaryColWidths[0] + subsidiaryColWidths[1], subsidiaryTableTop);
  doc.text('Grade', subsidiaryTableLeft + subsidiaryColWidths[0] + subsidiaryColWidths[1] + subsidiaryColWidths[2], subsidiaryTableTop);
  doc.text('Points', subsidiaryTableLeft + subsidiaryColWidths[0] + subsidiaryColWidths[1] + subsidiaryColWidths[2] + subsidiaryColWidths[3], subsidiaryTableTop);
  doc.text('Remarks', subsidiaryTableLeft + subsidiaryColWidths[0] + subsidiaryColWidths[1] + subsidiaryColWidths[2] + subsidiaryColWidths[3] + subsidiaryColWidths[4], subsidiaryTableTop);

  // Draw horizontal line
  doc.moveTo(subsidiaryTableLeft, subsidiaryTableTop + 15)
    .lineTo(subsidiaryTableLeft + subsidiaryColWidths.reduce((sum, width) => sum + width, 0), subsidiaryTableTop + 15)
    .stroke();

  // Draw subsidiary subjects
  doc.font('Helvetica').fontSize(10);
  let subsidiaryRowTop = subsidiaryTableTop + 20;

  if (report.subsidiarySubjects && report.subsidiarySubjects.length > 0) {
    for (const subject of report.subsidiarySubjects) {
      doc.text(subject.code || '-', subsidiaryTableLeft, subsidiaryRowTop);
      doc.text(subject.subject || '-', subsidiaryTableLeft + subsidiaryColWidths[0], subsidiaryRowTop);
      doc.text(subject.marks !== undefined && subject.marks !== null ? subject.marks.toString() : '-', subsidiaryTableLeft + subsidiaryColWidths[0] + subsidiaryColWidths[1], subsidiaryRowTop);
      doc.text(subject.grade || '-', subsidiaryTableLeft + subsidiaryColWidths[0] + subsidiaryColWidths[1] + subsidiaryColWidths[2], subsidiaryRowTop);
      doc.text(subject.points !== undefined && subject.points !== null ? subject.points.toString() : '-', subsidiaryTableLeft + subsidiaryColWidths[0] + subsidiaryColWidths[1] + subsidiaryColWidths[2] + subsidiaryColWidths[3], subsidiaryRowTop);
      doc.text(subject.remarks || '-', subsidiaryTableLeft + subsidiaryColWidths[0] + subsidiaryColWidths[1] + subsidiaryColWidths[2] + subsidiaryColWidths[3] + subsidiaryColWidths[4], subsidiaryRowTop);

      subsidiaryRowTop += subsidiaryRowHeight;
    }
  } else {
    doc.text('No subsidiary subjects found', subsidiaryTableLeft, subsidiaryRowTop, { italic: true });
    subsidiaryRowTop += subsidiaryRowHeight;
  }

  doc.moveDown(2);

  // Check if we need to add a new page for the summary
  if (doc.y > 650) {
    doc.addPage();
  }

  // Add performance summary
  doc.fontSize(12).text('Performance Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);

  // Create a two-column layout for summary
  const summaryLeft = 50;
  const summaryMiddle = 300;
  const summaryTop = doc.y;

  doc.text('Total Marks:', summaryLeft, summaryTop);
  doc.text(report.summary?.totalMarks !== undefined && report.summary.totalMarks !== null ? report.summary.totalMarks.toString() : 'N/A', summaryLeft + 150, summaryTop);

  doc.text('Average Marks:', summaryLeft, summaryTop + 20);
  doc.text(report.summary?.averageMarks || 'N/A', summaryLeft + 150, summaryTop + 20);

  doc.text('Total Points:', summaryLeft, summaryTop + 40);
  doc.text(report.summary?.totalPoints !== undefined && report.summary.totalPoints !== null ? report.summary.totalPoints.toString() : 'N/A', summaryLeft + 150, summaryTop + 40);

  doc.text('Best 3 Principal Points:', summaryLeft, summaryTop + 60);
  doc.text(report.summary?.bestThreePoints !== undefined && report.summary.bestThreePoints !== null ? report.summary.bestThreePoints.toString() : 'N/A', summaryLeft + 150, summaryTop + 60);

  doc.text('Division:', summaryMiddle, summaryTop);
  doc.font('Helvetica-Bold').text(report.summary?.division || 'N/A', summaryMiddle + 150, summaryTop);
  doc.font('Helvetica');

  doc.text('Rank in Class:', summaryMiddle, summaryTop + 20);
  doc.text(`${report.summary?.rank || 'N/A'} of ${report.summary?.totalStudents || 'N/A'}`, summaryMiddle + 150, summaryTop + 20);

  doc.moveDown(4);

  // Add character assessment
  doc.fontSize(12).text('Character Assessment', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);

  const assessmentTop = doc.y;

  doc.text('Discipline:', summaryLeft, assessmentTop);
  doc.text(report.characterAssessment?.discipline || 'Not assessed', summaryLeft + 150, assessmentTop);

  doc.text('Attendance:', summaryLeft, assessmentTop + 20);
  doc.text(report.characterAssessment?.attendance || 'Not assessed', summaryLeft + 150, assessmentTop + 20);

  doc.text('Attitude:', summaryLeft, assessmentTop + 40);
  doc.text(report.characterAssessment?.attitude || 'Not assessed', summaryLeft + 150, assessmentTop + 40);

  doc.moveDown();
  doc.text('Comments:', summaryLeft);
  doc.moveDown(0.5);
  doc.text(report.characterAssessment?.comments || 'No comments provided.', { width: 500 });

  doc.moveDown(2);

  // Add signature section
  const signatureTop = doc.y;

  doc.text('_______________________', 50, signatureTop);
  doc.text('_______________________', 300, signatureTop);
  doc.text('Class Teacher', 50, signatureTop + 20);
  doc.text('Principal', 300, signatureTop + 20);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, signatureTop + 40);

  // Add footer with A-LEVEL specific note
  doc.fontSize(8);
  doc.text(
    'Note: A-LEVEL Division is calculated based on best 3 principal subjects. Division I: 3-9 points, Division II: 10-12 points, Division III: 13-17 points, Division IV: 18-19 points, Division V: 20-21 points',
    doc.page.margins.left,
    doc.page.height - 30,
    { align: 'center' }
  );

  // Finalize the PDF with error handling
  try {
    doc.end();
  } catch (error) {
    console.error('Error finalizing PDF:', error);
  }
};

module.exports = {
  generateALevelComprehensiveReportPDF
};
