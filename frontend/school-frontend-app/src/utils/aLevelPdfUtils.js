/**
 * A-Level PDF Utilities
 * 
 * These utilities help ensure consistent PDF generation for A-Level results
 * without changing existing component structure or logic.
 */

import { formatGrade, formatDivision, getGradeRemarks } from './aLevelFormatUtils';

/**
 * Add A-Level division guide to PDF
 * @param {Object} doc - jsPDF document
 * @param {number} startY - Starting Y position
 * @returns {number} - New Y position after adding the guide
 */
export const addDivisionGuide = (doc, startY = 200) => {
  // Add title
  doc.setFontSize(12);
  doc.text('A-Level Division Guide', 14, startY);
  
  // Add division guide table
  doc.autoTable({
    startY: startY + 5,
    head: [['Division', 'Points Range', 'Grade Points']],
    body: [
      ['Division I', '3-9 points', 'A (80-100%) = 1 point\nB (70-79%) = 2 points\nC (60-69%) = 3 points\nD (50-59%) = 4 points\nE (40-49%) = 5 points\nS (35-39%) = 6 points\nF (0-34%) = 7 points'],
      ['Division II', '10-12 points', ''],
      ['Division III', '13-17 points', ''],
      ['Division IV', '18-19 points', ''],
      ['Division 0', '20+ points', '']
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 40 },
      2: { cellWidth: 'auto' }
    }
  });
  
  // Return the new Y position
  return doc.lastAutoTable.finalY + 10;
};

/**
 * Format A-Level subject result for PDF
 * @param {Object} result - Subject result object
 * @returns {Object} - Formatted result for PDF
 */
export const formatSubjectResultForPdf = (result) => {
  if (!result) return null;
  
  const grade = formatGrade(result.grade);
  
  return {
    subject: result.subject || result.name || '-',
    code: result.code || '-',
    marks: result.marksObtained || result.marks || '-',
    grade,
    points: result.points || '-',
    remarks: result.remarks || getGradeRemarks(grade),
    isPrincipal: !!result.isPrincipal
  };
};

/**
 * Format A-Level result summary for PDF
 * @param {Object} summary - Result summary object
 * @returns {Object} - Formatted summary for PDF
 */
export const formatSummaryForPdf = (summary) => {
  if (!summary) return {};
  
  return {
    totalMarks: summary.totalMarks || 0,
    averageMarks: typeof summary.averageMarks === 'number' 
      ? summary.averageMarks.toFixed(2) 
      : summary.averageMarks || '0.00',
    totalPoints: summary.totalPoints || 0,
    bestThreePoints: summary.bestThreePoints || 0,
    division: formatDivision(summary.division),
    rank: summary.rank || '-',
    totalStudents: summary.totalStudents || 0
  };
};

export default {
  addDivisionGuide,
  formatSubjectResultForPdf,
  formatSummaryForPdf
};
