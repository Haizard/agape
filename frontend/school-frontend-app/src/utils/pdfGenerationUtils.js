/**
 * PDF Generation Utilities
 *
 * Provides utility functions for generating PDF reports
 * using jsPDF and html2canvas.
 */
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate a PDF from a DOM element
 * @param {HTMLElement} element - The DOM element to convert to PDF
 * @param {Object} options - PDF generation options
 * @param {string} options.filename - The filename for the PDF
 * @param {string} options.orientation - The orientation of the PDF ('portrait' or 'landscape')
 * @param {string} options.format - The format of the PDF ('a4', 'letter', etc.)
 * @param {number} options.quality - The quality of the PDF (0.0 to 1.0)
 * @param {number} options.scale - The scale of the PDF (1.0 is normal)
 * @returns {Promise<void>} - A promise that resolves when the PDF is generated
 */
export const generatePdfFromElement = async (element, options = {}) => {
  const {
    filename = 'report.pdf',
    orientation = 'portrait',
    format = 'a4',
    quality = 1.0,
    scale = 2
  } = options;

  try {
    // Create a new jsPDF instance
    const pdf = new jsPDF(orientation, 'mm', format);

    // Get the width and height of the PDF
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Convert the element to a canvas
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      logging: false,
      allowTaint: true
    });

    // Get the canvas data URL
    const imgData = canvas.toDataURL('image/jpeg', quality);

    // Calculate the number of pages
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const pageHeight = pdfWidth / ratio;
    const totalPages = Math.ceil(imgHeight * (pdfWidth / imgWidth) / pdfHeight);

    // Add each page to the PDF
    let heightLeft = imgHeight;
    let position = 0;

    for (let i = 0; i < totalPages; i++) {
      // Add a new page if it's not the first page
      if (i > 0) {
        pdf.addPage();
      }

      // Calculate the height to use for this page
      const heightForThisPage = Math.min(pdfHeight, pageHeight);

      // Add the image to the PDF
      pdf.addImage(
        imgData,
        'JPEG',
        0,
        position,
        pdfWidth,
        heightForThisPage
      );

      // Update the position and height left
      heightLeft -= pdfHeight;
      position -= pdfHeight;
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Generate an A-Level result report PDF
 * @param {Object} report - The report data
 * @returns {Promise<void>} - A promise that resolves when the PDF is generated
 */
export const generateALevelReportPdf = async (report) => {
  try {
    // Get the report container element
    const element = document.getElementById('a-level-report-container');

    if (!element) {
      throw new Error('Report container element not found');
    }

    // Generate a filename based on the report data
    const studentName = report.studentDetails?.name || 'Unknown';
    const examName = report.examName || 'Unknown';
    const filename = `${studentName} - ${examName} Report.pdf`;

    // Generate the PDF
    await generatePdfFromElement(element, {
      filename,
      orientation: 'portrait',
      format: 'a4',
      quality: 1.0,
      scale: 2
    });

    return true;
  } catch (error) {
    console.error('Error generating A-Level report PDF:', error);
    throw error;
  }
};

/**
 * Generate an A-Level class report PDF
 * @param {Object} report - The class report data
 * @returns {Promise<void>} - A promise that resolves when the PDF is generated
 */
export const generateALevelClassReportPdf = async (report) => {
  try {
    // Get the report container element
    const element = document.getElementById('a-level-class-report-container');

    if (!element) {
      throw new Error('Report container element not found');
    }

    // Generate a filename based on the report data
    const className = report.className || 'Unknown';
    const examName = report.examName || 'Unknown';
    const formLevel = report.formLevel ? `-Form${report.formLevel}` : '';
    const filename = `${className}${formLevel} - ${examName} Class Report.pdf`;

    // Generate the PDF
    await generatePdfFromElement(element, {
      filename,
      orientation: 'landscape',
      format: 'a3',
      quality: 1.0,
      scale: 2
    });

    return true;
  } catch (error) {
    console.error('Error generating A-Level class report PDF:', error);
    throw error;
  }
};

// Export all utilities
const pdfGenerationUtils = {
  generatePdfFromElement,
  generateALevelReportPdf,
  generateALevelClassReportPdf
};

export default pdfGenerationUtils;
