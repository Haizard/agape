const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const Result = require('../models/Result');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');

/**
 * Simple controller to generate a test PDF
 * This is useful for testing if PDF generation works at all
 */
exports.generateTestPDF = (req, res) => {
  try {
    // Create a new PDF document
    const doc = new PDFDocument();
    
    // Set the response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=test.pdf');
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add content to the PDF
    doc.fontSize(25).text('Test PDF Document', 100, 100);
    doc.fontSize(12).text('This is a test PDF document.', 100, 150);
    doc.fontSize(12).text(`Generated at: ${new Date().toLocaleString()}`, 100, 180);
    
    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating test PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};

/**
 * Generate a simple student result PDF with minimal database queries
 * This is useful when the full PDF generation is failing
 */
exports.generateSimpleStudentPDF = async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    
    // Create a new PDF document
    const doc = new PDFDocument();
    
    // Set the response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=simple_student_result_${studentId}_${examId}.pdf`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add content to the PDF
    doc.fontSize(25).text('St. John Vianney Secondary School', { align: 'center' });
    doc.fontSize(18).text('Student Result Report (Simple)', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Student ID: ${studentId}`);
    doc.fontSize(12).text(`Exam ID: ${examId}`);
    doc.fontSize(12).text(`Generated at: ${new Date().toLocaleString()}`);
    doc.moveDown();
    
    // Try to fetch minimal student and exam info
    try {
      const student = await Student.findById(studentId).select('firstName lastName rollNumber').lean();
      if (student) {
        doc.fontSize(14).text(`Student: ${student.firstName} ${student.lastName}`);
        doc.fontSize(12).text(`Roll Number: ${student.rollNumber || 'N/A'}`);
      }
    } catch (err) {
      doc.fontSize(12).text(`Error fetching student: ${err.message}`);
    }
    
    try {
      const exam = await Exam.findById(examId).select('name term academicYear').lean();
      if (exam) {
        doc.fontSize(14).text(`Exam: ${exam.name}`);
        doc.fontSize(12).text(`Term: ${exam.term || 'N/A'}`);
        doc.fontSize(12).text(`Academic Year: ${exam.academicYear || 'N/A'}`);
      }
    } catch (err) {
      doc.fontSize(12).text(`Error fetching exam: ${err.message}`);
    }
    
    doc.moveDown();
    doc.fontSize(14).text('Results', { underline: true });
    
    // Try to fetch results
    try {
      const results = await Result.find({ 
        studentId: studentId,
        examId: examId
      }).populate('subjectId').lean();
      
      if (results && results.length > 0) {
        // Draw a simple table
        const tableTop = doc.y + 20;
        const tableLeft = 50;
        const colWidth = 100;
        
        // Table headers
        doc.fontSize(12).text('Subject', tableLeft, tableTop);
        doc.text('Marks', tableLeft + colWidth, tableTop);
        doc.text('Grade', tableLeft + colWidth * 2, tableTop);
        doc.text('Remarks', tableLeft + colWidth * 3, tableTop);
        
        doc.moveTo(tableLeft, tableTop - 5)
          .lineTo(tableLeft + colWidth * 4, tableTop - 5)
          .stroke();
        
        doc.moveTo(tableLeft, tableTop + 15)
          .lineTo(tableLeft + colWidth * 4, tableTop + 15)
          .stroke();
        
        // Table rows
        let rowTop = tableTop + 20;
        
        results.forEach(result => {
          const subjectName = result.subjectId ? result.subjectId.name : 'Unknown Subject';
          doc.text(subjectName, tableLeft, rowTop);
          doc.text(String(result.marksObtained || 'N/A'), tableLeft + colWidth, rowTop);
          doc.text(result.grade || 'N/A', tableLeft + colWidth * 2, rowTop);
          doc.text(result.comment || '', tableLeft + colWidth * 3, rowTop);
          
          rowTop += 20;
        });
        
        doc.moveTo(tableLeft, rowTop - 5)
          .lineTo(tableLeft + colWidth * 4, rowTop - 5)
          .stroke();
      } else {
        doc.text('No results found for this student and exam.');
      }
    } catch (err) {
      doc.fontSize(12).text(`Error fetching results: ${err.message}`);
    }
    
    // Add footer
    doc.fontSize(10)
      .text(
        'This is a simplified report for testing purposes.',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    
    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating simple student PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};

/**
 * Generate a simple class result PDF with minimal database queries
 * This is useful when the full PDF generation is failing
 */
exports.generateSimpleClassPDF = async (req, res) => {
  try {
    const { classId, examId } = req.params;
    
    // Create a new PDF document
    const doc = new PDFDocument({ layout: 'landscape' });
    
    // Set the response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=simple_class_result_${classId}_${examId}.pdf`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add content to the PDF
    doc.fontSize(25).text('St. John Vianney Secondary School', { align: 'center' });
    doc.fontSize(18).text('Class Result Report (Simple)', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Class ID: ${classId}`);
    doc.fontSize(12).text(`Exam ID: ${examId}`);
    doc.fontSize(12).text(`Generated at: ${new Date().toLocaleString()}`);
    doc.moveDown();
    
    // Try to fetch minimal class and exam info
    try {
      const classObj = await Class.findById(classId).select('name section').lean();
      if (classObj) {
        doc.fontSize(14).text(`Class: ${classObj.name} ${classObj.section || ''}`);
      }
    } catch (err) {
      doc.fontSize(12).text(`Error fetching class: ${err.message}`);
    }
    
    try {
      const exam = await Exam.findById(examId).select('name term academicYear').lean();
      if (exam) {
        doc.fontSize(14).text(`Exam: ${exam.name}`);
        doc.fontSize(12).text(`Term: ${exam.term || 'N/A'}`);
        doc.fontSize(12).text(`Academic Year: ${exam.academicYear || 'N/A'}`);
      }
    } catch (err) {
      doc.fontSize(12).text(`Error fetching exam: ${err.message}`);
    }
    
    doc.moveDown();
    doc.fontSize(14).text('Student Results', { underline: true });
    
    // Try to fetch students in the class
    try {
      const students = await Student.find({ class: classId }).select('firstName lastName rollNumber').lean();
      
      if (students && students.length > 0) {
        doc.fontSize(12).text(`Total Students: ${students.length}`);
        doc.moveDown();
        
        // Draw a simple table
        const tableTop = doc.y + 20;
        const tableLeft = 50;
        const colWidth = 120;
        
        // Table headers
        doc.fontSize(12).text('Student Name', tableLeft, tableTop);
        doc.text('Roll Number', tableLeft + colWidth, tableTop);
        doc.text('Total Marks', tableLeft + colWidth * 2, tableTop);
        doc.text('Average', tableLeft + colWidth * 3, tableTop);
        doc.text('Grade', tableLeft + colWidth * 4, tableTop);
        
        doc.moveTo(tableLeft, tableTop - 5)
          .lineTo(tableLeft + colWidth * 5, tableTop - 5)
          .stroke();
        
        doc.moveTo(tableLeft, tableTop + 15)
          .lineTo(tableLeft + colWidth * 5, tableTop + 15)
          .stroke();
        
        // Table rows
        let rowTop = tableTop + 20;
        
        // Process each student
        for (const student of students) {
          try {
            const results = await Result.find({ 
              studentId: student._id,
              examId: examId
            }).lean();
            
            if (results && results.length > 0) {
              // Calculate total and average
              let totalMarks = 0;
              results.forEach(result => {
                totalMarks += (result.marksObtained || 0);
              });
              
              const average = results.length > 0 ? totalMarks / results.length : 0;
              
              // Determine grade (simplified)
              let grade = 'F';
              if (average >= 90) grade = 'A';
              else if (average >= 80) grade = 'B';
              else if (average >= 70) grade = 'C';
              else if (average >= 60) grade = 'D';
              
              // Draw the row
              doc.text(`${student.firstName} ${student.lastName}`, tableLeft, rowTop);
              doc.text(student.rollNumber || 'N/A', tableLeft + colWidth, rowTop);
              doc.text(String(totalMarks), tableLeft + colWidth * 2, rowTop);
              doc.text(average.toFixed(2), tableLeft + colWidth * 3, rowTop);
              doc.text(grade, tableLeft + colWidth * 4, rowTop);
            } else {
              // No results for this student
              doc.text(`${student.firstName} ${student.lastName}`, tableLeft, rowTop);
              doc.text(student.rollNumber || 'N/A', tableLeft + colWidth, rowTop);
              doc.text('No results', tableLeft + colWidth * 2, rowTop, { colspan: 3 });
            }
            
            rowTop += 20;
            
            // Add a new page if we're near the bottom
            if (rowTop > doc.page.height - 50) {
              doc.addPage({ layout: 'landscape' });
              rowTop = 50;
            }
          } catch (err) {
            doc.text(`${student.firstName} ${student.lastName}`, tableLeft, rowTop);
            doc.text(student.rollNumber || 'N/A', tableLeft + colWidth, rowTop);
            doc.text(`Error: ${err.message}`, tableLeft + colWidth * 2, rowTop, { colspan: 3 });
            rowTop += 20;
          }
        }
        
        doc.moveTo(tableLeft, rowTop - 5)
          .lineTo(tableLeft + colWidth * 5, rowTop - 5)
          .stroke();
      } else {
        doc.text('No students found in this class.');
      }
    } catch (err) {
      doc.fontSize(12).text(`Error fetching students: ${err.message}`);
    }
    
    // Add footer
    doc.fontSize(10)
      .text(
        'This is a simplified report for testing purposes.',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    
    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating simple class PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};

module.exports = exports;
