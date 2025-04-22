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
  // Create a new PDF document with landscape orientation for better content fitting
  const doc = new PDFDocument({
    margin: 40,  // Increased margins for better readability
    size: 'A4',
    layout: 'landscape'  // Use landscape orientation to fit more content horizontally
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

  // Add school header - centered and properly spaced for landscape orientation
  doc.fontSize(16).text('Evangelical Lutheran Church in Tanzania - Northern Diocese', { align: 'center' });
  doc.fontSize(18).text('Agape Lutheran Junior Seminary', { align: 'center' });
  doc.moveDown(0.5);

  // Add contact information - adjusted for landscape orientation
  doc.fontSize(10);
  doc.text('P.O.BOX 8882,\nMoshi, Tanzania.', 60, 60);
  doc.text('Tel: +255 27 2755088\nEmail: agapelutheran@elct.org', doc.page.width - 60, 60, { align: 'right' });

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

  // Define table layout - adjusted for landscape orientation with better spacing
  const principalTableTop = doc.y;
  const principalTableLeft = 60;

  // Calculate column widths based on page width for better fit
  const tableWidth = doc.page.width - 120; // 60px margin on each side
  const principalColWidths = [
    tableWidth * 0.08,  // Code (8%)
    tableWidth * 0.35,  // Subject (35%)
    tableWidth * 0.12,  // Marks (12%)
    tableWidth * 0.12,  // Grade (12%)
    tableWidth * 0.12,  // Points (12%)
    tableWidth * 0.21   // Remarks (21%)
  ];
  const principalRowHeight = 25;

  // Draw table headers
  doc.font('Helvetica-Bold').fontSize(10);
  let xPos = principalTableLeft;

  // Draw each header at the calculated position
  doc.text('Code', xPos, principalTableTop);
  xPos += principalColWidths[0];

  doc.text('Subject', xPos, principalTableTop);
  xPos += principalColWidths[1];

  doc.text('Marks', xPos, principalTableTop);
  xPos += principalColWidths[2];

  doc.text('Grade', xPos, principalTableTop);
  xPos += principalColWidths[3];

  doc.text('Points', xPos, principalTableTop);
  xPos += principalColWidths[4];

  doc.text('Remarks', xPos, principalTableTop);

  // Draw horizontal line
  doc.moveTo(principalTableLeft, principalTableTop + 15)
    .lineTo(principalTableLeft + principalColWidths.reduce((sum, width) => sum + width, 0), principalTableTop + 15)
    .stroke();

  // Draw principal subjects
  doc.font('Helvetica').fontSize(10);
  let principalRowTop = principalTableTop + 20;

  if (report.principalSubjects && report.principalSubjects.length > 0) {
    for (const subject of report.principalSubjects) {
      // Reset xPos for each row
      xPos = principalTableLeft;

      // Draw each cell at the calculated position
      doc.text(subject.code || '-', xPos, principalRowTop);
      xPos += principalColWidths[0];

      doc.text(subject.subject || '-', xPos, principalRowTop);
      xPos += principalColWidths[1];

      doc.text(subject.marks !== undefined && subject.marks !== null ? subject.marks.toString() : '-', xPos, principalRowTop);
      xPos += principalColWidths[2];

      doc.text(subject.grade || '-', xPos, principalRowTop);
      xPos += principalColWidths[3];

      doc.text(subject.points !== undefined && subject.points !== null ? subject.points.toString() : '-', xPos, principalRowTop);
      xPos += principalColWidths[4];

      doc.text(subject.remarks || '-', xPos, principalRowTop);

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

  // Define table layout - using the same layout as principal subjects for consistency
  const subsidiaryTableTop = doc.y;
  const subsidiaryTableLeft = 60;
  // Reuse the same column widths as principal subjects
  const subsidiaryColWidths = principalColWidths;
  const subsidiaryRowHeight = 25;

  // Draw table headers
  doc.font('Helvetica-Bold').fontSize(10);
  xPos = subsidiaryTableLeft;

  // Draw each header at the calculated position
  doc.text('Code', xPos, subsidiaryTableTop);
  xPos += subsidiaryColWidths[0];

  doc.text('Subject', xPos, subsidiaryTableTop);
  xPos += subsidiaryColWidths[1];

  doc.text('Marks', xPos, subsidiaryTableTop);
  xPos += subsidiaryColWidths[2];

  doc.text('Grade', xPos, subsidiaryTableTop);
  xPos += subsidiaryColWidths[3];

  doc.text('Points', xPos, subsidiaryTableTop);
  xPos += subsidiaryColWidths[4];

  doc.text('Remarks', xPos, subsidiaryTableTop);

  // Draw horizontal line
  doc.moveTo(subsidiaryTableLeft, subsidiaryTableTop + 15)
    .lineTo(subsidiaryTableLeft + subsidiaryColWidths.reduce((sum, width) => sum + width, 0), subsidiaryTableTop + 15)
    .stroke();

  // Draw subsidiary subjects
  doc.font('Helvetica').fontSize(10);
  let subsidiaryRowTop = subsidiaryTableTop + 20;

  if (report.subsidiarySubjects && report.subsidiarySubjects.length > 0) {
    for (const subject of report.subsidiarySubjects) {
      // Reset xPos for each row
      xPos = subsidiaryTableLeft;

      // Draw each cell at the calculated position
      doc.text(subject.code || '-', xPos, subsidiaryRowTop);
      xPos += subsidiaryColWidths[0];

      doc.text(subject.subject || '-', xPos, subsidiaryRowTop);
      xPos += subsidiaryColWidths[1];

      doc.text(subject.marks !== undefined && subject.marks !== null ? subject.marks.toString() : '-', xPos, subsidiaryRowTop);
      xPos += subsidiaryColWidths[2];

      doc.text(subject.grade || '-', xPos, subsidiaryRowTop);
      xPos += subsidiaryColWidths[3];

      doc.text(subject.points !== undefined && subject.points !== null ? subject.points.toString() : '-', xPos, subsidiaryRowTop);
      xPos += subsidiaryColWidths[4];

      doc.text(subject.remarks || '-', xPos, subsidiaryRowTop);

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

  // Create a three-column layout for summary to better utilize landscape orientation
  const summaryLeft = 60;
  const summaryMiddle = doc.page.width / 3 + 30;
  const summaryRight = (doc.page.width * 2 / 3) + 30;
  const summaryTop = doc.y;

  // First column
  doc.text('Total Marks:', summaryLeft, summaryTop);
  doc.text(report.summary?.totalMarks !== undefined && report.summary.totalMarks !== null ? report.summary.totalMarks.toString() : 'N/A', summaryLeft + 150, summaryTop);

  doc.text('Average Marks:', summaryLeft, summaryTop + 20);
  doc.text(report.summary?.averageMarks || 'N/A', summaryLeft + 150, summaryTop + 20);

  // Second column
  doc.text('Total Points:', summaryMiddle, summaryTop);
  doc.text(report.summary?.totalPoints !== undefined && report.summary.totalPoints !== null ? report.summary.totalPoints.toString() : 'N/A', summaryMiddle + 150, summaryTop);

  doc.text('Best 3 Principal Points:', summaryMiddle, summaryTop + 20);
  doc.text(report.summary?.bestThreePoints !== undefined && report.summary.bestThreePoints !== null ? report.summary.bestThreePoints.toString() : 'N/A', summaryMiddle + 150, summaryTop + 20);

  // Third column
  doc.text('Division:', summaryRight, summaryTop);
  doc.font('Helvetica-Bold').text(report.summary?.division || 'N/A', summaryRight + 100, summaryTop);
  doc.font('Helvetica');

  doc.text('Rank in Class:', summaryRight, summaryTop + 20);
  doc.text(`${report.summary?.rank || 'N/A'} of ${report.summary?.totalStudents || 'N/A'}`, summaryRight + 100, summaryTop + 20);

  doc.moveDown(4);

  // Add character assessment
  doc.fontSize(12).text('Character Assessment', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);

  const assessmentTop = doc.y;

  // Create a three-column layout for character assessment
  doc.text('Discipline:', summaryLeft, assessmentTop);
  doc.text(report.characterAssessment?.discipline || 'Not assessed', summaryLeft + 120, assessmentTop);

  doc.text('Attendance:', summaryMiddle, assessmentTop);
  doc.text(report.characterAssessment?.attendance || 'Not assessed', summaryMiddle + 120, assessmentTop);

  doc.text('Attitude:', summaryRight, assessmentTop);
  doc.text(report.characterAssessment?.attitude || 'Not assessed', summaryRight + 120, assessmentTop);

  doc.moveDown(2);
  doc.text('Comments:', summaryLeft);
  doc.moveDown(0.5);
  // Increase width to use more of the landscape page
  doc.text(report.characterAssessment?.comments || 'No comments provided.', { width: doc.page.width - 120 });

  doc.moveDown(2);

  // Add signature section - adjusted for landscape orientation
  const signatureTop = doc.y;

  doc.text('_______________________', summaryLeft, signatureTop);
  doc.text('_______________________', summaryRight, signatureTop);
  doc.text('Class Teacher', summaryLeft, signatureTop + 20);
  doc.text('Principal', summaryRight, signatureTop + 20);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, summaryLeft, signatureTop + 40);

  // Add footer with A-LEVEL specific note
  doc.fontSize(9);  // Slightly larger font for better readability
  doc.text(
    'Note: A-LEVEL Division is calculated based on best 3 principal subjects. Division I: 3-9 points, Division II: 10-12 points, Division III: 13-17 points, Division IV: 18-19 points, Division V: 20-21 points',
    doc.page.margins.left,
    doc.page.height - 30,
    { align: 'center', width: doc.page.width - 80 }  // Set width to prevent text from going off page
  );

  // Add page number
  doc.fontSize(9);
  doc.text(
    `Page 1 of 1 | Generated on: ${new Date().toLocaleDateString()}`,
    doc.page.margins.left,
    doc.page.height - 15,
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
