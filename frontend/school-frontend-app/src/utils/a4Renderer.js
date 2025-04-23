/**
 * A4 Paper Renderer
 *
 * This utility provides functions to render tables to fit exactly on A4 paper
 * with no wasted space and all columns visible.
 */

/**
 * Calculates optimal column widths based on content type and available space
 * @param {HTMLTableElement} table - The table element
 * @returns {Object} - Object with column widths as percentages
 */
const calculateOptimalColumnWidths = (table) => {
  if (!table) return {};

  // Get all rows and count columns
  const rows = table.querySelectorAll('tr');
  if (rows.length === 0) return {};

  const headerRow = rows[0];
  const columnCount = headerRow.children.length;

  // Calculate base widths based on content type
  const columnWidths = {};

  // Allocate fixed percentages for special columns
  // Rank columns (first and last)
  columnWidths[0] = 3; // First column (rank)
  columnWidths[columnCount - 1] = 3; // Last column (rank)

  // Student name column (second column)
  columnWidths[1] = 12;

  // Sex column (third column)
  columnWidths[2] = 2.5;

  // Points column (fourth column)
  columnWidths[3] = 3;

  // Division column (fifth column)
  columnWidths[4] = 3;

  // Total and average columns (third and second from end)
  columnWidths[columnCount - 3] = 4;
  columnWidths[columnCount - 2] = 4;

  // Calculate total fixed percentage
  const fixedColumns = [0, 1, 2, 3, 4, columnCount - 3, columnCount - 2, columnCount - 1];
  const fixedPercentage = fixedColumns.reduce((sum, colIndex) => sum + (columnWidths[colIndex] || 0), 0);

  // Calculate remaining percentage for subject columns
  const remainingPercentage = 100 - fixedPercentage;
  const subjectColumnCount = columnCount - fixedColumns.length;

  if (subjectColumnCount > 0) {
    const percentPerSubjectColumn = remainingPercentage / subjectColumnCount;

    // Assign equal percentage to each subject column
    for (let i = 5; i < columnCount - 3; i++) {
      columnWidths[i] = percentPerSubjectColumn;
    }
  }

  console.log('Column widths (%):', columnWidths);
  return columnWidths;
};

/**
 * Prints a full class report to fit exactly on A4 paper
 * @param {string} tableSelector - CSS selector for the table to print
 * @param {boolean} fullReport - Whether to print the full report with all sections
 * @param {boolean} useDirectContent - Whether to use the selector's content directly without looking for report sections
 */
const printTableOnA4 = (tableSelector = '.report-table', fullReport = true, useDirectContent = false) => {
  // Get the table element
  const table = document.querySelector(tableSelector);

  if (!table) {
    console.error('Table not found:', tableSelector);
    return;
  }

  // Open a new window
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (!printWindow) {
    alert('Please allow pop-ups to print the table.');
    return;
  }

  // Clone the table
  const tableClone = table.cloneNode(true);
  tableClone.classList.add('printable-table');

  // If fullReport is true, get all report sections
  let reportContent = '';
  if (fullReport) {
    // If useDirectContent is true, use the selector's content directly
    if (useDirectContent) {
      // Use the container directly - it should already have all the sections we need
      const container = document.querySelector(tableSelector);
      if (container) {
        // Just use the entire container's HTML
        reportContent = container.innerHTML;
      }
    } else {
      // Get the report container - check for both A-level and O-level containers
      const reportContainer = document.getElementById('a-level-class-report-container') ||
                             document.getElementById('o-level-class-report-container') ||
                             document.querySelector('.report-container');

      if (reportContainer) {
        // Clone the report container
        const reportClone = reportContainer.cloneNode(true);

        // Remove non-printable elements
        const nonPrintableElements = reportClone.querySelectorAll('.no-print');
        nonPrintableElements.forEach(element => element.remove());

        // Get only the report sections we want
        const headerSection = reportClone.querySelector('.report-header');
        const resultsTable = reportClone.querySelector('.report-table')?.closest('.report-section') ||
                            reportClone.querySelector('.report-table')?.closest('div');

        // Look for Result Summary section
        const resultSummary = Array.from(reportClone.querySelectorAll('h6, .MuiTypography-h6'))
          .find(el => el.textContent.includes('RESULT SUMMARY'))?.closest('.MuiCard-root') ||
          Array.from(reportClone.querySelectorAll('.section-title'))
          .find(el => el.textContent.includes('Result Summary'))?.closest('.report-section');

        // Look for Approval section
        const approvalSection = Array.from(reportClone.querySelectorAll('h6, .MuiTypography-h6'))
          .find(el => el.textContent.includes('APPROVED BY'))?.closest('.MuiCard-root');

        // Look for other performance sections
        const overallPerformance = Array.from(reportClone.querySelectorAll('.section-title'))
          .find(el => el.textContent.includes('Overall Performance'))?.closest('.report-section');
        const examPerformance = Array.from(reportClone.querySelectorAll('.section-title'))
          .find(el => el.textContent.includes('Examination Performance'))?.closest('.report-section');
        const subjectPerformance = Array.from(reportClone.querySelectorAll('.section-title'))
          .find(el => el.textContent.includes('Subject Performance'))?.closest('.report-section');

        // Combine the sections
        reportContent = `
          ${headerSection ? headerSection.outerHTML : ''}
          ${resultsTable ? resultsTable.outerHTML : ''}
          ${resultSummary ? resultSummary.outerHTML : ''}
          ${approvalSection ? approvalSection.outerHTML : ''}
          ${overallPerformance ? overallPerformance.outerHTML : ''}
          ${examPerformance ? examPerformance.outerHTML : ''}
          ${subjectPerformance ? subjectPerformance.outerHTML : ''}
        `;
      }
    }
  }

  // Calculate optimal column widths
  const columnWidths = calculateOptimalColumnWidths(tableClone);

  // Create HTML content for the print window - EXACT A4 APPROACH
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Report</title>
        <style>
          /* EXACT A4 PAPER DIMENSIONS */
          @page {
            size: 297mm 210mm landscape; /* Exact A4 dimensions */
            margin: 5mm; /* Small margins for better printing */
          }

          /* Reset all margins and paddings */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          /* Force body to exact A4 width but allow height to expand */
          html, body {
            width: 297mm;
            height: auto; /* Allow height to expand for multiple pages */
            overflow: visible; /* Allow content to flow to multiple pages */
            display: block;
            background-color: white;
          }

          /* Container takes full A4 size */
          .print-container {
            width: 297mm;
            height: auto; /* Allow container to expand for full report */
            position: relative; /* Changed from absolute to allow natural flow */
            margin: 0 auto;
            overflow: visible; /* Changed from hidden to show all content */
          }

          /* Report section styling */
          .report-section, .MuiCard-root {
            width: 100%;
            margin-bottom: 10mm;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Result Summary and Approval sections */
          .MuiCard-root {
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 10px;
            margin-top: 10mm;
          }

          /* Typography for section headers */
          .MuiTypography-h6 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 10px;
            text-align: center;
          }

          /* Table styling for Result Summary */
          .MuiTableContainer-root table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5mm;
          }

          .MuiTableContainer-root th,
          .MuiTableContainer-root td {
            border: 0.5pt solid #000;
            padding: 2pt;
            text-align: center;
            font-weight: bold;
          }

          /* Report header styling */
          .report-header {
            width: 100%;
            text-align: center;
            margin-bottom: 5mm;
          }

          /* Table fills entire A4 paper */
          .printable-table {
            width: 297mm;
            height: 210mm;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10pt;
            font-family: Arial, sans-serif;
            font-weight: bold;
            border: 0.5pt solid #000;
          }

          /* Cell styling */
          .printable-table th,
          .printable-table td {
            border: 0.5pt solid #000;
            padding: 2pt;
            text-align: center;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            font-weight: bold;
          }

          /* Student name column */
          .printable-table td:nth-child(2) {
            text-align: left;
            padding-left: 3pt;
          }

          /* Headers */
          .printable-table th {
            background-color: #f0f0f0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Apply calculated column widths */
          ${Object.entries(columnWidths).map(([colIndex, width]) => `
          .printable-table th:nth-child(${parseInt(colIndex) + 1}),
          .printable-table td:nth-child(${parseInt(colIndex) + 1}) {
            width: ${width}%;
          }`).join('')}
        </style>
      </head>
      <body>
        <div class="print-container">
          ${fullReport && reportContent ? reportContent : tableClone.outerHTML}
        </div>
        <script>
          // Auto-print when loaded
          window.onload = function() {
            // Force table to fill entire A4 paper
            const table = document.querySelector('.printable-table');
            const container = document.querySelector('.print-container');
            const reportSections = document.querySelectorAll('.report-section');

            if (table && container) {
              // Ensure table fills entire A4 paper
              table.style.width = '297mm';
              table.style.height = '210mm';

              // Log dimensions for debugging
              console.log('A4 paper: 297mm x 210mm');
              console.log('Table dimensions:', table.offsetWidth + 'px', 'x', table.offsetHeight + 'px');
            }

            // If we have report sections, style them for printing
            if (reportSections.length > 0) {
              reportSections.forEach(section => {
                section.style.pageBreakInside = 'avoid';
                section.style.marginBottom = '10mm';

                // Style tables within sections
                const sectionTables = section.querySelectorAll('table');
                sectionTables.forEach(sectionTable => {
                  sectionTable.style.width = '100%';
                  sectionTable.style.borderCollapse = 'collapse';
                  sectionTable.style.fontSize = '10pt';
                  sectionTable.style.fontFamily = 'Arial, sans-serif';
                  sectionTable.style.fontWeight = 'bold';
                  sectionTable.style.border = '0.5pt solid #000';

                  // Style cells
                  const cells = sectionTable.querySelectorAll('th, td');
                  cells.forEach(cell => {
                    cell.style.border = '0.5pt solid #000';
                    cell.style.padding = '2pt';
                    cell.style.textAlign = 'center';
                  });
                });
              });
            }

            // Style Result Summary and Approval sections
            // Find sections by looking for their headings and then getting the parent card
            let resultSummarySection, approvalSection;

            // Find all headings
            const allHeadings = document.querySelectorAll('.MuiTypography-h6, h6');
            allHeadings.forEach(heading => {
              if (heading.textContent.includes('RESULT SUMMARY')) {
                resultSummarySection = heading.closest('.MuiCard-root');
              } else if (heading.textContent.includes('APPROVED BY')) {
                approvalSection = heading.closest('.MuiCard-root');
              }
            });

            // Apply styles to Material-UI components
            const muiCards = document.querySelectorAll('.MuiCard-root');
            muiCards.forEach(card => {
              card.style.pageBreakInside = 'avoid';
              card.style.marginBottom = '10mm';
              card.style.border = '1px solid #e0e0e0';
              card.style.borderRadius = '4px';
              card.style.padding = '10px';

              // Style tables within cards
              const cardTables = card.querySelectorAll('table');
              cardTables.forEach(table => {
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';
                table.style.fontSize = '10pt';
                table.style.fontFamily = 'Arial, sans-serif';
                table.style.fontWeight = 'bold';
                table.style.border = '0.5pt solid #000';

                // Style cells
                const cells = table.querySelectorAll('th, td');
                cells.forEach(cell => {
                  cell.style.border = '0.5pt solid #000';
                  cell.style.padding = '2pt';
                  cell.style.textAlign = 'center';
                });
              });

              // Style headings
              const headings = card.querySelectorAll('.MuiTypography-h6');
              headings.forEach(heading => {
                heading.style.fontSize = '16pt';
                heading.style.fontWeight = 'bold';
                heading.style.marginBottom = '10px';
                heading.style.textAlign = 'center';
              });
            });

            // Print after a short delay
            setTimeout(function() {
              window.print();
              window.addEventListener('afterprint', function() {
                window.close();
              });
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  // Write the HTML to the print window
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

// Export the function
const a4Renderer = {
  printTableOnA4
};

export default a4Renderer;
