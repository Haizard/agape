const PDFDocument = require('pdfkit');

/**
 * Generate an A-LEVEL student result report PDF
 * @param {Object} report - The report data
 * @param {Object} res - Express response object
 */
const generateALevelStudentReportPDF = (report, res) => {
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
    res.setHeader('Content-Disposition', `inline; filename="a-level-student-report.pdf"`);

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

  // Add Lutheran Church logo placeholder
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
  doc.text('Mobile phone: 0759767735\nEmail: infoagapeseminary@gmail.com', 400, 60, { align: 'right' });

  // Add report title
  doc.fontSize(16).text('A-LEVEL STUDENT RESULT REPORT', { align: 'center' });
  doc.fontSize(14).text(`Academic Year: ${report.academicYear || 'Unknown'}`, { align: 'center' });
  doc.moveDown();

  // Add student information
  doc.fontSize(14);
  doc.text(`Name: ${report.studentDetails?.name || report.student?.fullName || ''}`, 50, 120);
  doc.text(`Class: ${report.studentDetails?.class || report.class?.fullName || ''}`, 50, 140);
  doc.text(`Roll Number: ${report.studentDetails?.rollNumber || ''}`, 50, 160);
  doc.text(`Rank: ${report.studentDetails?.rank || report.summary?.rank || 'N/A'} of ${report.studentDetails?.totalStudents || report.summary?.totalStudents || 'N/A'}`, 50, 180);
  doc.text(`Gender: ${report.studentDetails?.gender || ''}`, 300, 120);
  doc.text(`Exam: ${report.examName || report.exam?.name || ''}`, 300, 140);
  doc.text(`Date: ${report.examDate || ''}`, 300, 160);
  doc.moveDown(2);

  // Add results table
  const tableTop = 200;
  const tableHeaders = ['Subject', 'Marks', 'Grade', 'Points', 'Remarks'];
  const tableData = [];

  // Add subject results
  const subjectResults = report.subjectResults || report.results || [];

  // Identify principal and subsidiary subjects
  const principalSubjects = [];
  const subsidiarySubjects = [];

  for (const result of subjectResults) {
    // In A-Level, we need to identify principal subjects
    // Use the isPrincipal flag from the result object
    // This flag should be set during marks entry
    const isPrincipal = result.isPrincipal === true;

    // Add to the appropriate array based on isPrincipal flag
    if (isPrincipal) {
      principalSubjects.push(result);
    } else {
      subsidiarySubjects.push(result);
    }
  }

  // Ensure we have at least 3 principal subjects for proper division calculation
  if (principalSubjects.length < 3 && subjectResults.length >= 3) {
    console.warn(`Warning: Only ${principalSubjects.length} principal subjects found. A-Level requires at least 3 principal subjects for proper division calculation.`);

    // If we don't have enough principal subjects, mark the top subjects as principal
    // Sort by marks (descending)
    const sortedResults = [...subjectResults].filter(r => !principalSubjects.includes(r))
      .sort((a, b) =>
        (b.marksObtained !== undefined ? b.marksObtained : (b.marks || 0)) -
        (a.marksObtained !== undefined ? a.marksObtained : (a.marks || 0))
      );

    // Take enough subjects to reach 3 principal subjects
    const neededSubjects = 3 - principalSubjects.length;
    for (let i = 0; i < Math.min(neededSubjects, sortedResults.length); i++) {
      sortedResults[i].isPrincipal = true;
      principalSubjects.push(sortedResults[i]);
      // Remove from subsidiary if it was there
      const subIndex = subsidiarySubjects.findIndex(s => s === sortedResults[i]);
      if (subIndex !== -1) {
        subsidiarySubjects.splice(subIndex, 1);
      }
      console.log(`Marking subject ${sortedResults[i].subject} as principal (marks: ${sortedResults[i].marksObtained || sortedResults[i].marks || 0})`);
    }
  }

  // Add to table data
  for (const result of subjectResults) {
    // Check if this result is now in the principal subjects array
    const isPrincipal = principalSubjects.includes(result);

    tableData.push([
      result.subject + (isPrincipal ? ' (P)' : ' (S)'),
      result.marksObtained !== undefined ? result.marksObtained : (result.marks || 0),
      result.grade || '',
      result.points || 0,
      result.remarks || ''
    ]);
  }

  // Draw table headers
  doc.font('Helvetica-Bold');
  doc.fontSize(12);

  // Calculate column widths
  const pageWidth = doc.page.width - 2 * doc.page.margins.left;
  const columnWidths = [
    pageWidth * 0.35, // Subject
    pageWidth * 0.15, // Marks
    pageWidth * 0.15, // Grade
    pageWidth * 0.15, // Points
    pageWidth * 0.20  // Remarks
  ];

  let xPos = doc.page.margins.left;
  for (let i = 0; i < tableHeaders.length; i++) {
    doc.text(tableHeaders[i], xPos, tableTop, { width: columnWidths[i], align: 'left' });
    xPos += columnWidths[i];
  }

  // Draw horizontal line
  doc.moveTo(doc.page.margins.left, tableTop + 20)
     .lineTo(doc.page.width - doc.page.margins.right, tableTop + 20)
     .stroke();

  // Draw table data
  doc.font('Helvetica');
  doc.fontSize(12);
  let yPos = tableTop + 30;

  for (const row of tableData) {
    xPos = doc.page.margins.left;
    for (let i = 0; i < row.length; i++) {
      doc.text(row[i].toString(), xPos, yPos, { width: columnWidths[i], align: 'left' });
      xPos += columnWidths[i];
    }
    yPos += 20;
  }

  // Draw horizontal line
  doc.moveTo(doc.page.margins.left, yPos)
     .lineTo(doc.page.width - doc.page.margins.right, yPos)
     .stroke();

  // Add summary
  yPos += 20;
  doc.font('Helvetica-Bold').fontSize(14).text('SUMMARY', doc.page.margins.left, yPos);
  yPos += 20;

  const summary = report.summary || {};
  const totalMarks = summary.totalMarks || report.totalMarks || 0;
  const averageMarks = summary.averageMarks || report.averageMarks || 0;
  const totalPoints = summary.totalPoints || report.points || 0;
  const bestThreePoints = summary.bestThreePoints || report.bestThreePoints || 0;
  const division = summary.division || report.division || '';

  doc.font('Helvetica').fontSize(12);
  doc.text(`Total Marks: ${totalMarks}`, doc.page.margins.left, yPos);
  doc.text(`Average Marks: ${averageMarks}`, doc.page.margins.left, yPos + 20);
  doc.text(`Total Points: ${totalPoints}`, doc.page.margins.left, yPos + 40);
  doc.text(`Principal Subjects Points: ${bestThreePoints}`, doc.page.margins.left + 200, yPos);
  doc.text(`Division: ${division}`, doc.page.margins.left + 200, yPos + 20);
  doc.text(`Rank: ${summary.rank || report.studentDetails?.rank || 'N/A'} of ${summary.totalStudents || report.studentDetails?.totalStudents || 'N/A'}`, doc.page.margins.left + 200, yPos + 40);

  // Add A-LEVEL specific information
  yPos += 80;
  doc.font('Helvetica-Bold').fontSize(14).text('PRINCIPAL SUBJECTS', doc.page.margins.left, yPos);
  yPos += 20;

  doc.font('Helvetica').fontSize(12);
  const principalText = principalSubjects.length > 0
    ? principalSubjects.map(s => `${s.subject}: ${s.grade} (${s.points})`).join(', ')
    : 'None';
  doc.text(principalText, doc.page.margins.left, yPos);

  yPos += 30;
  doc.font('Helvetica-Bold').fontSize(14).text('SUBSIDIARY SUBJECTS', doc.page.margins.left, yPos);
  yPos += 20;

  doc.font('Helvetica').fontSize(12);
  const subsidiaryText = subsidiarySubjects.length > 0
    ? subsidiarySubjects.map(s => `${s.subject}: ${s.grade} (${s.points})`).join(', ')
    : 'None';
  doc.text(subsidiaryText, doc.page.margins.left, yPos);

  // Add character assessment
  yPos += 40;
  doc.font('Helvetica-Bold').fontSize(14).text('CHARACTER ASSESSMENT', doc.page.margins.left, yPos);
  yPos += 20;

  // Create a table for character assessment
  const characterAssessment = report.characterAssessment || {};

  doc.font('Helvetica').fontSize(12);
  doc.text(`Punctuality: ${characterAssessment.punctuality || 'Good'}`, doc.page.margins.left, yPos);
  doc.text(`Discipline: ${characterAssessment.discipline || 'Good'}`, doc.page.margins.left + 200, yPos);

  doc.text(`Respect: ${characterAssessment.respect || 'Good'}`, doc.page.margins.left, yPos + 20);
  doc.text(`Leadership: ${characterAssessment.leadership || 'Good'}`, doc.page.margins.left + 200, yPos + 20);

  doc.text(`Participation: ${characterAssessment.participation || 'Good'}`, doc.page.margins.left, yPos + 40);
  doc.text(`Overall: ${characterAssessment.overallAssessment || 'Good'}`, doc.page.margins.left + 200, yPos + 40);

  yPos += 70;
  doc.font('Helvetica-Bold').fontSize(14).text('TEACHER COMMENTS', doc.page.margins.left, yPos);
  yPos += 20;

  doc.font('Helvetica').fontSize(12);
  doc.text(characterAssessment.comments || 'No comments available', doc.page.margins.left, yPos, {
    width: 500,
    align: 'left'
  });

  // Add grade distribution if available
  if (summary.gradeDistribution) {
    yPos += 40;
    doc.font('Helvetica-Bold').fontSize(14).text('GRADE DISTRIBUTION', doc.page.margins.left, yPos);
    yPos += 20;

    doc.font('Helvetica').fontSize(12);
    const gradeDistribution = summary.gradeDistribution;
    let gradeText = '';
    for (const grade in gradeDistribution) {
      gradeText += `${grade}: ${gradeDistribution[grade]} `;
    }
    doc.text(gradeText, doc.page.margins.left, yPos);
  }

  // Add footer
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

    // Add signature lines
    if (i === pageCount - 1) {
      const signatureY = doc.page.height - 100;

      doc.fontSize(10);
      doc.text('Class Teacher: ____________________', doc.page.margins.left, signatureY);
      doc.text('Principal: ____________________', doc.page.width / 2, signatureY);

      doc.text('Date: ____________________', doc.page.margins.left, signatureY + 20);
      doc.text('Date: ____________________', doc.page.width / 2, signatureY + 20);

      // Add A-LEVEL specific note
      doc.fontSize(8);
      doc.text(
        'Note: A-LEVEL Division is calculated based on best 3 principal subjects. Division I: 3-9 points, Division II: 10-12 points, Division III: 13-17 points, Division IV: 18-19 points, Division V: 20-21 points',
        doc.page.margins.left,
        doc.page.height - 30,
        { align: 'center' }
      );
    }
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

/**
 * Generate an A-LEVEL class result report PDF
 * @param {Object} report - The report data
 * @param {Object} res - Express response object
 */
const generateALevelClassReportPDF = (report, res) => {
  // Check if response is already sent
  if (res.headersSent) {
    console.error('Headers already sent, cannot generate PDF');
    return;
  }
  // Create a new PDF document
  const doc = new PDFDocument({
    margin: 20,
    size: 'A3',
    layout: 'landscape',
    autoFirstPage: true,
    bufferPages: true
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
  doc.fontSize(18).text('Evangelical Lutheran Church in Tanzania - Northern Diocese', { align: 'center' });
  doc.fontSize(20).text('Agape Lutheran Junior Seminary', { align: 'center' });
  doc.moveDown(0.5);

  // Add contact information
  doc.fontSize(12);
  doc.text('P.O.BOX 8882,\nMoshi, Tanzania.', 50, 60);

  // Add Lutheran Church logo placeholder
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
  doc.fontSize(16).text('A-LEVEL CLASS RESULT REPORT', { align: 'center' });
  doc.fontSize(14).text(`Class: ${report.className || ''} ${report.section || ''}`, { align: 'center' });
  doc.fontSize(14).text(`Academic Year: ${report.academicYear || 'Unknown'}`, { align: 'center' });
  doc.fontSize(14).text(`Exam: ${report.examName || ''}`, { align: 'center' });
  doc.moveDown();

  // Get all subjects from the first student (assuming all students have the same subjects)
  const subjects = [];
  const principalSubjects = [];

  if (report.students && report.students.length > 0 && report.students[0].results) {
    for (const result of report.students[0].results) {
      let subjectName = '';
      if (result.subject?.name) {
        subjectName = result.subject.name;
      } else if (typeof result.subject === 'string') {
        subjectName = result.subject;
      }

      if (subjectName) {
        subjects.push(subjectName);

        // Identify principal subjects (placeholder logic)
        if (result.isPrincipal) {
          principalSubjects.push(subjectName);
        }
      }
    }
  }

  // Create table headers
  const tableHeaders = ['#', 'Name', 'Roll No.'];
  tableHeaders.push(...subjects);
  tableHeaders.push('Total', 'Average', 'Points', 'Best 3', 'Division', 'Rank');

  // Calculate column widths
  const pageWidth = doc.page.width - 2 * doc.page.margins.left;
  const fixedColumnWidth = pageWidth * 0.04; // For #, Roll No., Total, Average, Points, Best 3, Division, Rank
  const nameColumnWidth = pageWidth * 0.12; // For Name

  // Calculate remaining width for subject columns
  const remainingWidth = pageWidth - (fixedColumnWidth * 8) - nameColumnWidth;
  // Ensure minimum width for subject columns
  const subjectColumnWidth = subjects.length > 0 ?
    Math.max(40, remainingWidth / subjects.length) : 0;

  // Draw table headers
  doc.font('Helvetica-Bold');
  doc.fontSize(16);

  let xPos = doc.page.margins.left;
  let yPos = 150;

  // Draw # header
  doc.text('#', xPos, yPos, { width: fixedColumnWidth, align: 'center' });
  xPos += fixedColumnWidth;

  // Draw Name header
  doc.text('Name', xPos, yPos, { width: nameColumnWidth, align: 'left' });
  xPos += nameColumnWidth;

  // Draw Roll No. header
  doc.text('Roll No.', xPos, yPos, { width: fixedColumnWidth, align: 'center' });
  xPos += fixedColumnWidth;

  // Draw subject headers
  for (const subject of subjects) {
    // Mark principal subjects with (P)
    const headerText = principalSubjects.includes(subject) ? `${subject} (P)` : subject;
    doc.text(headerText, xPos, yPos, { width: subjectColumnWidth, align: 'center' });
    xPos += subjectColumnWidth;
  }

  // Draw remaining headers
  const remainingHeaders = ['Total', 'Average', 'Points', 'Best 3', 'Division', 'Rank'];
  for (const header of remainingHeaders) {
    doc.text(header, xPos, yPos, { width: fixedColumnWidth, align: 'center' });
    xPos += fixedColumnWidth;
  }

  // Draw horizontal line
  doc.moveTo(doc.page.margins.left, yPos + 20)
     .lineTo(doc.page.width - doc.page.margins.right, yPos + 20)
     .stroke();

  // Draw student data
  doc.font('Helvetica');
  doc.fontSize(16);
  yPos += 30;

  // Process each student
  if (report.students) {
    for (let i = 0; i < report.students.length; i++) {
      const student = report.students[i];

      // Check if we need to add a new page
      if (yPos > doc.page.height - 50) {
        // Add a note that the report continues on the next page
        doc.font('Helvetica-Italic');
        doc.fontSize(10);
        doc.text('(Continued on next page...)', doc.page.width / 2, doc.page.height - 40, { align: 'center' });

        // Add a new page
        doc.addPage();
        yPos = 50;

        // Redraw headers on new page
        doc.font('Helvetica-Bold');
        doc.fontSize(16);
        xPos = doc.page.margins.left;

        // Draw # header
        doc.text('#', xPos, yPos, { width: fixedColumnWidth, align: 'center' });
        xPos += fixedColumnWidth;

        // Draw Name header
        doc.text('Name', xPos, yPos, { width: nameColumnWidth, align: 'left' });
        xPos += nameColumnWidth;

        // Draw Roll No. header
        doc.text('Roll No.', xPos, yPos, { width: fixedColumnWidth, align: 'center' });
        xPos += fixedColumnWidth;

        // Draw subject headers
        for (const subject of subjects) {
          const headerText = principalSubjects.includes(subject) ? `${subject} (P)` : subject;
          doc.text(headerText, xPos, yPos, { width: subjectColumnWidth, align: 'center' });
          xPos += subjectColumnWidth;
        }

        // Draw remaining headers
        for (const header of remainingHeaders) {
          doc.text(header, xPos, yPos, { width: fixedColumnWidth, align: 'center' });
          xPos += fixedColumnWidth;
        }

        // Draw horizontal line
        doc.moveTo(doc.page.margins.left, yPos + 20)
           .lineTo(doc.page.width - doc.page.margins.right, yPos + 20)
           .stroke();

        doc.font('Helvetica');
        doc.fontSize(16);
        yPos += 30;
      }

      // Start drawing student row
      xPos = doc.page.margins.left;

      // Draw student number
      doc.text((i + 1).toString(), xPos, yPos, { width: fixedColumnWidth, align: 'center' });
      xPos += fixedColumnWidth;

      // Draw student name
      doc.text(student.name, xPos, yPos, { width: nameColumnWidth, align: 'left' });
      xPos += nameColumnWidth;

      // Draw student roll number
      doc.text(student.rollNumber || '', xPos, yPos, { width: fixedColumnWidth, align: 'center' });
      xPos += fixedColumnWidth;

      // Draw subject marks
      const studentResults = student.results || [];
      const subjectMarks = {};

      // Create a map of subject name to marks
      for (const result of studentResults) {
        let subjectName = '';
        if (result.subject?.name) {
          subjectName = result.subject.name;
        } else if (typeof result.subject === 'string') {
          subjectName = result.subject;
        }

        if (subjectName) {
          subjectMarks[subjectName] = {
            marks: result.marksObtained !== undefined ? result.marksObtained : (result.marks || 0),
            grade: result.grade || ''
          };
        }
      }

      // Draw marks for each subject
      for (const subject of subjects) {
        const markInfo = subjectMarks[subject] || { marks: '-', grade: '-' };
        doc.text(`${markInfo.marks} (${markInfo.grade})`, xPos, yPos, { width: subjectColumnWidth, align: 'center' });
        xPos += subjectColumnWidth;
      }

      // Draw total marks
      doc.text(student.totalMarks?.toString() || '0', xPos, yPos, { width: fixedColumnWidth, align: 'center' });
      xPos += fixedColumnWidth;

      // Draw average marks
      doc.text(student.averageMarks?.toString() || '0.00', xPos, yPos, { width: fixedColumnWidth, align: 'center' });
      xPos += fixedColumnWidth;

      // Draw total points
      doc.text(student.totalPoints?.toString() || '0', xPos, yPos, { width: fixedColumnWidth, align: 'center' });
      xPos += fixedColumnWidth;

      // Draw best three points (for A-Level)
      doc.text(student.bestThreePoints?.toString() || '0', xPos, yPos, { width: fixedColumnWidth, align: 'center' });
      xPos += fixedColumnWidth;

      // Draw division
      doc.text(student.division?.toString() || '-', xPos, yPos, { width: fixedColumnWidth, align: 'center' });
      xPos += fixedColumnWidth;

      // Draw rank
      doc.text(student.rank?.toString() || '-', xPos, yPos, { width: fixedColumnWidth, align: 'center' });

      yPos += 20;
    }
  }

  // Draw horizontal line
  doc.moveTo(doc.page.margins.left, yPos)
     .lineTo(doc.page.width - doc.page.margins.right, yPos)
     .stroke();

  // Add class summary
  yPos += 30;
  doc.font('Helvetica-Bold').fontSize(18).text('CLASS SUMMARY', doc.page.margins.left, yPos);
  yPos += 20;

  doc.font('Helvetica').fontSize(16);

  // Calculate division distribution
  const divisions = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, 'V': 0 };
  if (report.students) {
    for (const student of report.students) {
      const division = student.division?.replace('Division ', '') || '0';
      if (divisions[division] !== undefined) {
        divisions[division]++;
      }
    }
  }

  // Draw division distribution
  doc.text('Division Distribution:', doc.page.margins.left, yPos);
  yPos += 20;

  let divisionText = '';
  for (const division in divisions) {
    const count = divisions[division];
    const percentage = report.students?.length ? (count / report.students.length * 100).toFixed(1) : 0;
    divisionText += `Division ${division}: ${count} (${percentage}%) `;
  }

  doc.text(divisionText, doc.page.margins.left, yPos);

  // Add class statistics
  yPos += 30;
  doc.text(`Total Students: ${report.students?.length || 0}`, doc.page.margins.left, yPos);
  doc.text(`Class Average: ${report.classAverage?.toFixed(2) || '0.00'}`, doc.page.margins.left + 200, yPos);

  // Add principal subjects information
  yPos += 30;
  doc.font('Helvetica-Bold').fontSize(18).text('PRINCIPAL SUBJECTS', doc.page.margins.left, yPos);
  yPos += 20;

  doc.font('Helvetica').fontSize(16);
  const principalSubjectsText = principalSubjects.length > 0
    ? principalSubjects.join(', ')
    : 'None defined';
  doc.text(principalSubjectsText, doc.page.margins.left, yPos);

  // Add footer with A-LEVEL specific note
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    // Add page number
    doc.fontSize(12);
    doc.text(
      `Page ${i + 1} of ${pageCount}`,
      doc.page.margins.left,
      doc.page.height - 50,
      { align: 'center' }
    );

    // Add A-LEVEL specific note
    doc.fontSize(12);
    doc.text(
      'Note: A-LEVEL Division is calculated based on best 3 principal subjects. Division I: 3-9 points, Division II: 10-12 points, Division III: 13-17 points, Division IV: 18-19 points, Division V: 20-21 points',
      doc.page.margins.left,
      doc.page.height - 30,
      { align: 'center' }
    );
  }

  // Finalize the PDF with error handling
  try {
    doc.end();
  } catch (error) {
    console.error('Error finalizing PDF:', error);
  }
};

module.exports = {
  generateALevelStudentReportPDF,
  generateALevelClassReportPDF
};
