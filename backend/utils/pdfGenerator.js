const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * PDF Generator Utility
 * Generates PDF reports for assessments
 */
const generatePDF = async (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      // Create a write stream buffer
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Add school logo
      const logoPath = path.join(__dirname, '../public/images/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 50 });
      }

      // Add header
      doc.fontSize(20)
         .text('Assessment Report', 120, 50)
         .moveDown();

      // Add report metadata
      doc.fontSize(12)
         .text(`Total Students: ${reportData.totalStudents}`)
         .text(`Average Score: ${reportData.averageScore.toFixed(2)}%`)
         .text(`Pass Rate: ${reportData.passRate.toFixed(2)}%`)
         .moveDown();

      // Add statistics table
      doc.fontSize(14)
         .text('Statistics', { underline: true })
         .moveDown();

      const statsData = [
        ['Highest Score', `${reportData.highestScore.toFixed(2)}%`],
        ['Lowest Score', `${reportData.lowestScore.toFixed(2)}%`],
        ['Standard Deviation', reportData.standardDeviation.toFixed(2)]
      ];

      let yPos = doc.y;
      statsData.forEach(([label, value]) => {
        doc.fontSize(12)
           .text(label, 50, yPos)
           .text(value, 200, yPos);
        yPos += 20;
      });

      doc.moveDown(2);

      // Add grade distribution chart
      doc.fontSize(14)
         .text('Grade Distribution', { underline: true })
         .moveDown();

      // Calculate grade distribution
      const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      reportData.results.forEach(result => {
        grades[result.grade]++;
      });

      // Draw grade distribution bars
      const chartWidth = 400;
      const chartHeight = 150;
      const barSpacing = 40;
      let xPos = 50;

      Object.entries(grades).forEach(([grade, count]) => {
        const percentage = (count / reportData.totalStudents) * 100;
        const barHeight = (percentage / 100) * chartHeight;

        // Draw bar
        doc.rect(xPos, doc.y + chartHeight - barHeight, 30, barHeight)
           .fill('#1976d2');

        // Add label
        doc.fontSize(10)
           .text(grade, xPos + 10, doc.y + chartHeight + 10)
           .text(`${count}`, xPos + 10, doc.y + chartHeight + 25);

        xPos += barSpacing;
      });

      doc.moveDown(8);

      // Add results table
      doc.fontSize(14)
         .text('Detailed Results', { underline: true })
         .moveDown();

      // Table headers
      const tableTop = doc.y;
      const tableHeaders = ['Student Name', 'Reg. No.', 'Marks', 'Grade'];
      let currentX = 50;
      
      tableHeaders.forEach(header => {
        doc.fontSize(12)
           .text(header, currentX, tableTop, { width: 100 });
        currentX += 120;
      });

      doc.moveDown();

      // Table rows
      reportData.results.forEach((result, index) => {
        const rowY = doc.y;
        
        if (rowY > 700) { // Check if we need a new page
          doc.addPage();
          doc.y = 50; // Reset Y position on new page
        }

        doc.fontSize(10)
           .text(result.studentName, 50, doc.y, { width: 100 })
           .text(result.registrationNumber, 170, doc.y, { width: 100 })
           .text(`${result.marksObtained}/${result.maxMarks}`, 290, doc.y)
           .text(result.grade, 410, doc.y);

        doc.moveDown();
      });

      // Add footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        // Add page number
        doc.fontSize(10)
           .text(
             `Page ${i + 1} of ${pageCount}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           );

        // Add timestamp
        doc.fontSize(8)
           .text(
             `Generated on ${new Date().toLocaleString()}`,
             50,
             doc.page.height - 30,
             { align: 'center' }
           );
      }

      // Finalize the PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generatePDF;