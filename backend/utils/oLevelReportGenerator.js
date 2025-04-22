const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { getLogoPath } = require('./logoHelper');

/**
 * Generate an O-LEVEL student result report PDF
 * @param {Object} report - The report data
 * @param {Object} res - Express response object
 */
const generateOLevelStudentReportPDF = (report, res) => {
  // Check if response is already sent
  if (res.headersSent) {
    console.error('Headers already sent, cannot generate PDF');
    return;
  }

  // Wrap the entire PDF generation process in a try-catch block
  try {
    // Create a new PDF document
    const doc = new PDFDocument({
      margin: 30,
      size: 'A4'
    });

    // Pipe the PDF to the response
    doc.pipe(res);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="o-level-student-report.pdf"`);

    // The rest of the PDF generation will be wrapped in this try block

  // Set font
  doc.font('Helvetica');

  // Add school header
  doc.fontSize(18).text('Evangelical Lutheran Church in Tanzania - Northern Diocese', { align: 'center' });
  doc.fontSize(20).text('Agape Lutheran Junior Seminary', { align: 'center' });
  doc.moveDown(0.5);

  // Add contact information
  doc.fontSize(12);
  doc.text('P.O.BOX 8882,\nMoshi, Tanzania.', 50, 60);

  // Add Lutheran Church logo
  try {
    // Skip logo for now due to format issues
    // const logoPath = getLogoPath();
    // if (logoPath) {
    //   doc.image(logoPath, 250, 60, { width: 50 });
    // }

    // Add a placeholder text instead
    doc.fontSize(12).text('LOGO', 250, 60, { width: 50, align: 'center' });
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
  }

  // Add right-side contact information
  doc.fontSize(12);
  doc.text('Mobile phone: 0759767735\nEmail: infoagapeseminary@gmail.com', 500, 60, { align: 'right' });

  // Add report title
  doc.fontSize(16).text('O-LEVEL STUDENT RESULT REPORT', { align: 'center' });
  doc.moveDown();

  // Add student information
  doc.fontSize(14);
  doc.text(`Name: ${report.studentDetails?.name || ''}`, 50);
  doc.text(`Class: ${report.studentDetails?.class || ''}`, 50);
  doc.text(`Roll Number: ${report.studentDetails?.rollNumber || ''}`, 50);
  doc.text(`Gender: ${report.studentDetails?.gender || ''}`, 50);

  // Add exam information
  doc.text(`Exam: ${report.examName || ''}`, 350, doc.y - 12 * 4);
  doc.text(`Academic Year: ${report.academicYear || ''}`, 350, doc.y + 12);
  doc.text(`Date: ${report.examDate || ''}`, 350, doc.y + 12);
  doc.moveDown(2);

  // Add subject results table
  const tableTop = doc.y;
  const tableLeft = 50;
  const colWidths = [200, 60, 60, 60, 120];
  const rowHeight = 25;

  // Draw table header
  doc.fontSize(14).font('Helvetica-Bold');
  doc.rect(tableLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), rowHeight).stroke();
  doc.text('Subject', tableLeft + 5, tableTop + 7);
  doc.text('Marks', tableLeft + colWidths[0] + 5, tableTop + 7);
  doc.text('Grade', tableLeft + colWidths[0] + colWidths[1] + 5, tableTop + 7);
  doc.text('Points', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableTop + 7);
  doc.text('Remarks', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, tableTop + 7);

  // Draw table rows
  doc.font('Helvetica');
  doc.fontSize(12);
  let currentY = tableTop + rowHeight;

  if (report.subjectResults) {
    for (const result of report.subjectResults) {
      doc.rect(tableLeft, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight).stroke();
      doc.text(result.subject || '', tableLeft + 5, currentY + 7);
      doc.text(result.marks?.toString() || '', tableLeft + colWidths[0] + 5, currentY + 7);
      doc.text(result.grade || '', tableLeft + colWidths[0] + colWidths[1] + 5, currentY + 7);
      doc.text(result.points?.toString() || '', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 7);
      doc.text(result.remarks || '', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, currentY + 7);
      currentY += rowHeight;
    }
  }

  // Add summary row
  doc.rect(tableLeft, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight).stroke();
  doc.font('Helvetica-Bold');
  doc.fontSize(14);
  doc.text('Total', tableLeft + 5, currentY + 7);
  doc.text(report.summary?.totalMarks?.toString() || '', tableLeft + colWidths[0] + 5, currentY + 7);
  doc.text('', tableLeft + colWidths[0] + colWidths[1] + 5, currentY + 7);
  doc.text(report.summary?.totalPoints?.toString() || '', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 7);
  doc.text('', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, currentY + 7);
  currentY += rowHeight * 1.5;

  // Add summary information
  doc.font('Helvetica-Bold');
  doc.fontSize(14);
  doc.text('Summary:', 50, currentY);
  currentY += 20;
  doc.font('Helvetica');
  doc.fontSize(12);
  doc.text(`Average Marks: ${report.summary?.averageMarks || ''}`, 50, currentY);
  doc.text(`Best 7 Points: ${report.summary?.bestSevenPoints || ''}`, 250, currentY);
  doc.text(`Division: ${report.summary?.division || ''}`, 450, currentY);
  currentY += 20;

  // Add grade distribution if available
  if (report.summary?.gradeDistribution) {
    currentY += 20;
    doc.font('Helvetica-Bold');
    doc.fontSize(14);
    doc.text('Grade Distribution:', 50, currentY);
    currentY += 20;
    doc.font('Helvetica');
    doc.fontSize(12);

    const dist = report.summary.gradeDistribution;
    const distTableTop = currentY;
    const distColWidth = 80;

    // Draw distribution table header
    doc.rect(tableLeft, distTableTop, distColWidth * 5, rowHeight).stroke();
    doc.text('Grade', tableLeft + 5, distTableTop + 7);
    doc.text('A', tableLeft + distColWidth + 5, distTableTop + 7);
    doc.text('B', tableLeft + distColWidth * 2 + 5, distTableTop + 7);
    doc.text('C', tableLeft + distColWidth * 3 + 5, distTableTop + 7);
    doc.text('D', tableLeft + distColWidth * 4 + 5, distTableTop + 7);

    // Draw distribution table row
    doc.rect(tableLeft, distTableTop + rowHeight, distColWidth * 5, rowHeight).stroke();
    doc.text('Count', tableLeft + 5, distTableTop + rowHeight + 7);
    doc.text(dist.A?.toString() || '0', tableLeft + distColWidth + 5, distTableTop + rowHeight + 7);
    doc.text(dist.B?.toString() || '0', tableLeft + distColWidth * 2 + 5, distTableTop + rowHeight + 7);
    doc.text(dist.C?.toString() || '0', tableLeft + distColWidth * 3 + 5, distTableTop + rowHeight + 7);
    doc.text(dist.D?.toString() || '0', tableLeft + distColWidth * 4 + 5, distTableTop + rowHeight + 7);
  }

  // Add signature section
  const signatureY = doc.page.height - 100;
  doc.text('_______________________', 50, signatureY);
  doc.text('Class Teacher', 50, signatureY + 15);

  doc.text('_______________________', 250, signatureY);
  doc.text('Academic Master', 250, signatureY + 15);

  doc.text('_______________________', 450, signatureY);
  doc.text('Head of School', 450, signatureY + 15);

  // Add division explanation
  doc.fontSize(8);
  doc.text(
    'O-LEVEL Division Guide: Division I: 7-14 points, Division II: 15-21 points, Division III: 22-25 points, Division IV: 26-32 points, Division 0: 33+ points',
    50,
    doc.page.height - 30,
    { align: 'center' }
  );

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);

    // If headers haven't been sent yet, send an error response
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Error generating PDF report',
        error: error.message
      });
    } else {
      // If headers have been sent, try to end the document
      try {
        if (doc) doc.end();
      } catch (endError) {
        console.error('Error ending PDF document:', endError);
      }
    }
  }
};

/**
 * Generate an O-LEVEL class result report PDF
 * @param {Object} report - The report data
 * @param {Object} res - Express response object
 */
const generateOLevelClassReportPDF = (report, res) => {
  // Check if response is already sent
  if (res.headersSent) {
    console.error('Headers already sent, cannot generate PDF');
    return;
  }

  // Wrap the entire PDF generation process in a try-catch block
  try {
    // Create a new PDF document
    const doc = new PDFDocument({
      margin: 30,
      size: 'A3',
      layout: 'landscape'
    });

    // Pipe the PDF to the response
    doc.pipe(res);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="o-level-class-report.pdf"`);

    // The rest of the PDF generation will be wrapped in this try block

  // Set font
  doc.font('Helvetica');

  // Add school header
  doc.fontSize(18).text('Evangelical Lutheran Church in Tanzania - Northern Diocese', { align: 'center' });
  doc.fontSize(20).text('Agape Lutheran Junior Seminary', { align: 'center' });
  doc.moveDown(0.5);

  // Add contact information
  doc.fontSize(12);
  doc.text('P.O.BOX 8882,\nMoshi, Tanzania.', 50, 60);

  // Add Lutheran Church logo
  try {
    // Skip logo for now due to format issues
    // const logoPath = getLogoPath();
    // if (logoPath) {
    //   doc.image(logoPath, 400, 60, { width: 50 });
    // }

    // Add a placeholder text instead
    doc.fontSize(12).text('LOGO', 400, 60, { width: 50, align: 'center' });
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
  }

  // Add right-side contact information
  doc.fontSize(12);
  doc.text('Mobile phone: 0759767735\nEmail: infoagapeseminary@gmail.com', 750, 60, { align: 'right' });

  // Add report title
  doc.fontSize(16).text('O-LEVEL CLASS RESULT REPORT', { align: 'center' });
  doc.fontSize(14).text(`Class: ${report.className || ''} ${report.section || ''}`, { align: 'center' });
  doc.fontSize(14).text(`Academic Year: ${report.academicYear || 'Unknown'}`, { align: 'center' });
  doc.fontSize(14).text(`Exam: ${report.examName || ''}`, { align: 'center' });
  doc.moveDown();

  // Get all subjects from the first student (assuming all students have the same subjects)
  const subjects = [];
  if (report.students && report.students.length > 0 && report.students[0].results) {
    for (const result of report.students[0].results) {
      if (result.subject?.name) {
        subjects.push(result.subject.name);
      } else if (typeof result.subject === 'string') {
        subjects.push(result.subject);
      }
    }
  }

  // Add results table
  const tableTop = 150;
  const tableHeaders = ['#', 'Student Name', 'Roll No.', 'Total Marks', 'Average', 'Points', 'Division', 'Rank'];

  // Sort students alphabetically for preview
  const students = [...(report.students || [])];
  students.sort((a, b) => a.name.localeCompare(b.name));

  // Draw table headers
  doc.font('Helvetica-Bold');
  doc.fontSize(12);

  // Calculate column widths
  const pageWidth = doc.page.width - 2 * doc.page.margins.left;
  const columnWidths = [
    pageWidth * 0.05, // #
    pageWidth * 0.25, // Student Name
    pageWidth * 0.10, // Roll No.
    pageWidth * 0.10, // Total Marks
    pageWidth * 0.10, // Average
    pageWidth * 0.10, // Points
    pageWidth * 0.10, // Division
    pageWidth * 0.10  // Rank
  ];

  // Draw table headers
  let xPos = doc.page.margins.left;
  for (let i = 0; i < tableHeaders.length; i++) {
    doc.text(tableHeaders[i], xPos, tableTop);
    xPos += columnWidths[i];
  }

  // Draw horizontal line
  doc.moveTo(doc.page.margins.left, tableTop + 15)
     .lineTo(doc.page.width - doc.page.margins.right, tableTop + 15)
     .stroke();

  // Draw table data
  doc.font('Helvetica');
  doc.fontSize(12);
  let yPos = tableTop + 25;

  // Calculate division distribution
  const divisions = {
    'I': 0,
    'II': 0,
    'III': 0,
    'IV': 0,
    '0': 0
  };

  for (let i = 0; i < students.length; i++) {
    const student = students[i];

    // Update division count
    if (student.division) {
      divisions[student.division] = (divisions[student.division] || 0) + 1;
    }

    // Draw row
    xPos = doc.page.margins.left;
    doc.text(i + 1, xPos, yPos); // #
    xPos += columnWidths[0];

    doc.text(student.name || '', xPos, yPos); // Student Name
    xPos += columnWidths[1];

    doc.text(student.rollNumber || '', xPos, yPos); // Roll No.
    xPos += columnWidths[2];

    doc.text(student.totalMarks || '0', xPos, yPos); // Total Marks
    xPos += columnWidths[3];

    doc.text(student.averageMarks || '0.00', xPos, yPos); // Average
    xPos += columnWidths[4];

    doc.text(student.totalPoints || '0', xPos, yPos); // Points
    xPos += columnWidths[5];

    doc.text(student.division || 'N/A', xPos, yPos); // Division
    xPos += columnWidths[6];

    doc.text(student.rank || 'N/A', xPos, yPos); // Rank

    // Move to next row
    yPos += 20;

    // Check if we need a new page
    if (yPos > doc.page.height - 100) {
      doc.addPage();
      yPos = doc.page.margins.top + 20;

      // Add headers to new page
      doc.font('Helvetica-Bold');
      xPos = doc.page.margins.left;
      for (let j = 0; j < tableHeaders.length; j++) {
        doc.text(tableHeaders[j], xPos, yPos - 15);
        xPos += columnWidths[j];
      }

      // Draw horizontal line
      doc.moveTo(doc.page.margins.left, yPos)
         .lineTo(doc.page.width - doc.page.margins.right, yPos)
         .stroke();

      doc.font('Helvetica');
      yPos += 10;
    }
  }

  // Add division distribution
  yPos += 20;
  doc.font('Helvetica-Bold');
  doc.fontSize(14);
  doc.text('Division Distribution:', doc.page.margins.left, yPos);
  yPos += 20;

  doc.font('Helvetica');
  doc.fontSize(12);
  let divisionText = '';
  for (const division in divisions) {
    const count = divisions[division];
    const percentage = report.students?.length ? (count / report.students.length * 100).toFixed(1) : 0;
    divisionText += `Division ${division}: ${count} (${percentage}%) `;
  }

  doc.text(divisionText, doc.page.margins.left, yPos);

  // Add class statistics
  yPos += 30;
  doc.font('Helvetica-Bold');
  doc.fontSize(14);
  doc.text('Class Statistics:', doc.page.margins.left, yPos);
  yPos += 20;
  doc.font('Helvetica');
  doc.fontSize(12);
  doc.text(`Total Students: ${report.students?.length || 0}`, doc.page.margins.left, yPos);
  doc.text(`Class Average: ${report.classAverage?.toFixed(2) || '0.00'}`, doc.page.margins.left + 200, yPos);

  // Add footer with O-LEVEL specific note
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    // Add page number
    doc.fontSize(8);
    doc.text(
      `Page ${i + 1} of ${pageCount}`,
      doc.page.margins.left,
      doc.page.height - 50,
      { align: 'center' }
    );

    // Add O-LEVEL specific note
    doc.fontSize(8);
    doc.text(
      'Note: O-LEVEL Division is calculated based on best 7 subjects. Division I: 7-14 points, Division II: 15-21 points, Division III: 22-25 points, Division IV: 26-32 points, Division 0: 33+ points',
      doc.page.margins.left,
      doc.page.height - 30,
      { align: 'center' }
    );
  }

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);

    // If headers haven't been sent yet, send an error response
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Error generating PDF report',
        error: error.message
      });
    } else {
      // If headers have been sent, try to end the document
      try {
        if (doc) doc.end();
      } catch (endError) {
        console.error('Error ending PDF document:', endError);
      }
    }
  }
};

module.exports = {
  generateOLevelStudentReportPDF,
  generateOLevelClassReportPDF
};
