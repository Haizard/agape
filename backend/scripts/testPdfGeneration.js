const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Result = require('../models/Result');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority';
console.log('Using MongoDB URI:', MONGODB_URI);

// Helper function to get remarks based on grade
function getRemarks(grade) {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Satisfactory';
    case 'F': return 'Fail';
    default: return 'N/A';
  }
}

async function generateStudentResultPDF() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get the student
    const studentId = '67ee9fcefc46e8d35a4b66fb'; // Khadija Kileo
    const student = await Student.findById(studentId);
    if (!student) {
      console.log(`Student not found with ID: ${studentId}`);
      return;
    }
    console.log(`Found student: ${student.firstName} ${student.lastName}`);

    // Get the class
    const classId = student.class;
    const studentClass = await Class.findById(classId);
    if (!studentClass) {
      console.log(`Class not found with ID: ${classId}`);
      return;
    }
    console.log(`Found class: ${studentClass.name}`);

    // Get the exam
    const examId = '67eeab8e963c1a1685e8d859'; // Default Exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      console.log(`Exam not found with ID: ${examId}`);
      return;
    }
    console.log(`Found exam: ${exam.name}`);

    // Fetch the results
    console.log('Fetching results with studentId:', studentId, 'and examId:', examId);
    const results = await Result.find({
      $or: [
        { studentId: studentId, examId: examId },
        { student: studentId, exam: examId }
      ]
    }).populate('subjectId').populate('subject');

    console.log('Results found:', results.length);
    if (results.length > 0) {
      console.log('Sample result:', JSON.stringify(results[0], null, 2));
    }

    if (results.length === 0) {
      console.log('No results found for this student and exam');
      return;
    }

    // Calculate total marks and average
    let totalMarks = 0;
    let totalPoints = 0;
    const gradeDistribution = {};

    results.forEach(result => {
      // Use marksObtained instead of marks
      const marks = result.marksObtained || 0;
      totalMarks += marks;
      totalPoints += result.points || 0;

      // Count grades for distribution
      const grade = result.grade || 'F';
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    const averageMarks = totalMarks / results.length;

    // Calculate best seven subjects (lowest points = best grades)
    const sortedResults = [...results].sort((a, b) => (a.points || 5) - (b.points || 5));
    const bestSevenResults = sortedResults.slice(0, 7);
    const bestSevenPoints = bestSevenResults.reduce((sum, result) => sum + (result.points || 5), 0);

    // Determine division based on best seven points
    let division;
    if (bestSevenPoints >= 7 && bestSevenPoints <= 14) {
      division = 'I';
    } else if (bestSevenPoints >= 15 && bestSevenPoints <= 21) {
      division = 'II';
    } else if (bestSevenPoints >= 22 && bestSevenPoints <= 25) {
      division = 'III';
    } else if (bestSevenPoints >= 26 && bestSevenPoints <= 32) {
      division = 'IV';
    } else {
      division = '0';
    }

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    const outputPath = path.join(__dirname, 'student_result.pdf');
    doc.pipe(fs.createWriteStream(outputPath));

    // Add school header
    doc.fontSize(18).text('St. John Vianney Secondary School', { align: 'center' });
    doc.fontSize(14).text('Student Result Report', { align: 'center' });
    doc.fontSize(12).text(`Academic Year: 2023-2024`, { align: 'center' });
    doc.moveDown();

    // Add student information
    doc.fontSize(12).text(`Name: ${student.firstName} ${student.lastName}`, { continued: true });
    doc.text(`Class: ${studentClass.name} ${studentClass.section || ''}`, { align: 'right' });
    doc.text(`Exam: ${exam.name}`, { continued: true });
    doc.text(`Term: Term 1`, { align: 'right' });
    doc.moveDown(2);

    // Add subject results table
    doc.fontSize(14).text('Subject Results', { align: 'center' });
    doc.moveDown();

    // Table headers
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidth = (doc.page.width - 100) / 5;

    doc.fontSize(10).text('Subject', tableLeft, tableTop);
    doc.text('Marks', tableLeft + colWidth, tableTop, { width: colWidth, align: 'center' });
    doc.text('Grade', tableLeft + colWidth * 2, tableTop, { width: colWidth, align: 'center' });
    doc.text('Points', tableLeft + colWidth * 3, tableTop, { width: colWidth, align: 'center' });
    doc.text('Remarks', tableLeft + colWidth * 4, tableTop);

    doc.moveTo(tableLeft, tableTop - 5)
      .lineTo(tableLeft + colWidth * 5, tableTop - 5)
      .stroke();

    doc.moveTo(tableLeft, tableTop + 15)
      .lineTo(tableLeft + colWidth * 5, tableTop + 15)
      .stroke();

    // Table rows
    let rowTop = tableTop + 20;

    results.forEach(result => {
      // Get the subject name
      const subject = result.subject || result.subjectId;
      const subjectName = subject ? subject.name : 'Unknown Subject';
      
      // Get the marks, grade, and points with fallbacks
      const marks = result.marksObtained !== undefined ? result.marksObtained : 0;
      const grade = result.grade || 'F';
      const points = result.points !== undefined ? result.points : 5;
      
      // Get remarks or calculate based on grade
      const remarks = result.remarks || getRemarks(grade);
      
      // Draw the row
      doc.text(subjectName, tableLeft, rowTop);
      doc.text(String(marks), tableLeft + colWidth, rowTop, { width: colWidth, align: 'center' });
      doc.text(grade, tableLeft + colWidth * 2, rowTop, { width: colWidth, align: 'center' });
      doc.text(String(points), tableLeft + colWidth * 3, rowTop, { width: colWidth, align: 'center' });
      doc.text(remarks, tableLeft + colWidth * 4, rowTop);

      rowTop += 20;

      // Add a new page if we're near the bottom
      if (rowTop > doc.page.height - 100) {
        doc.addPage();
        rowTop = 50;
      }
    });

    // Add total row
    doc.moveTo(tableLeft, rowTop - 5)
      .lineTo(tableLeft + colWidth * 5, rowTop - 5)
      .stroke();

    doc.fontSize(10).text('Total', tableLeft, rowTop, { bold: true });
    doc.text(String(totalMarks), tableLeft + colWidth, rowTop, { width: colWidth, align: 'center', bold: true });
    doc.text('', tableLeft + colWidth * 2, rowTop, { width: colWidth, align: 'center' });
    doc.text(String(totalPoints), tableLeft + colWidth * 3, rowTop, { width: colWidth, align: 'center', bold: true });
    doc.text('Performance', tableLeft + colWidth * 4, rowTop);

    doc.moveTo(tableLeft, rowTop + 15)
      .lineTo(tableLeft + colWidth * 5, rowTop + 15)
      .stroke();

    rowTop += 30;

    // Add summary information
    doc.fontSize(14).text('Performance Summary', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text(`Total Marks: ${totalMarks}`, { continued: true });
    doc.text(`Average Marks: ${averageMarks.toFixed(2)}%`, { align: 'right' });
    doc.text(`Total Points: ${totalPoints}`, { continued: true });
    doc.text(`Best Seven Points: ${bestSevenPoints}`, { align: 'right' });
    doc.text(`Division: ${division}`, { continued: true });
    doc.text(`Rank: N/A`, { align: 'right' });
    doc.moveDown(2);

    // Add grade distribution
    doc.fontSize(14).text('Grade Distribution', { align: 'center' });
    doc.moveDown();

    // Create a simple table for grade distribution
    const grades = ['A', 'B', 'C', 'D', 'F'];
    const distTableTop = doc.y;
    const distTableLeft = (doc.page.width - 200) / 2;
    const distColWidth = 100;

    doc.fontSize(10).text('Grade', distTableLeft, distTableTop);
    doc.text('Count', distTableLeft + distColWidth, distTableTop);

    doc.moveTo(distTableLeft, distTableTop - 5)
      .lineTo(distTableLeft + distColWidth * 2, distTableTop - 5)
      .stroke();

    doc.moveTo(distTableLeft, distTableTop + 15)
      .lineTo(distTableLeft + distColWidth * 2, distTableTop + 15)
      .stroke();

    let distRowTop = distTableTop + 20;

    grades.forEach(grade => {
      const count = gradeDistribution[grade] || 0;
      doc.text(grade, distTableLeft, distRowTop);
      doc.text(String(count), distTableLeft + distColWidth, distRowTop);
      distRowTop += 20;
    });

    // Add footer
    doc.fontSize(8)
      .text(
        `Generated on ${new Date().toLocaleDateString()} - St. John Vianney Secondary School`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

    // Finalize the PDF
    doc.end();
    console.log(`PDF generated at: ${outputPath}`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
generateStudentResultPDF();
