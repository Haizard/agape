/**
 * Print Renderer Utility
 *
 * This utility ensures that all table columns are visible when printing,
 * with no horizontal pagination or hidden content.
 */

/**
 * Prepares a table for printing by ensuring all columns are visible
 * @param {string} tableSelector - CSS selector for the table to print
 */
export const prepareTableForPrint = (tableSelector = '.report-table') => {
  // Get the table element
  const table = document.querySelector(tableSelector);

  if (!table) {
    console.error('Table not found:', tableSelector);
    return;
  }

  // Add the printable-table class to the table
  table.classList.add('printable-table');

  // Count the number of columns
  const headerRow = table.querySelector('tr');
  const columnCount = headerRow ? headerRow.children.length : 0;

  console.log(`Table has ${columnCount} columns`);

  // Calculate the optimal scale factor based on column count
  let scaleFactor = 1;
  if (columnCount > 25) {
    scaleFactor = 0.5; // Ultra small for many columns
  } else if (columnCount > 20) {
    scaleFactor = 0.6; // Very small for lots of columns
  } else if (columnCount > 15) {
    scaleFactor = 0.7; // Small for medium columns
  } else if (columnCount > 10) {
    scaleFactor = 0.8; // Normal for few columns
  }

  console.log(`Using scale factor: ${scaleFactor}`);

  // Create a container for scaling
  const container = document.createElement('div');
  container.className = 'print-scaling-container';
  container.style.transform = `scale(${scaleFactor})`;

  // Clone the table to avoid modifying the original
  const tableClone = table.cloneNode(true);

  // Replace the original table with the container
  table.parentNode.insertBefore(container, table);
  container.appendChild(tableClone);
  table.style.display = 'none';

  return {
    originalTable: table,
    container: container,
    tableClone: tableClone,
    scaleFactor: scaleFactor
  };
};

/**
 * Restores the original table after printing
 * @param {Object} printContext - The context returned by prepareTableForPrint
 */
export const restoreTableAfterPrint = (printContext) => {
  if (!printContext || !printContext.originalTable || !printContext.container) {
    console.error('Invalid print context');
    return;
  }

  // Restore the original table
  printContext.originalTable.style.display = '';
  printContext.container.parentNode.removeChild(printContext.container);
};

/**
 * Prints a table with all columns visible
 * @param {string} tableSelector - CSS selector for the table to print
 */
export const printTableWithAllColumns = (tableSelector = '.report-table') => {
  // Prepare the table for printing
  const printContext = prepareTableForPrint(tableSelector);

  if (!printContext) {
    return;
  }

  // Add a listener for the afterprint event
  window.addEventListener('afterprint', () => {
    // Restore the original table after printing
    restoreTableAfterPrint(printContext);
  }, { once: true });

  // Print the page
  window.print();
};

/**
 * Calculates optimal column widths based on content type and available space
 * @param {HTMLTableElement} table - The table element
 * @param {number} totalWidth - Total available width in pixels
 * @returns {Object} - Object with column widths as percentages
 */
const calculateOptimalColumnWidths = (table, totalWidth) => {
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
 * Creates a new window with only the table and prints it
 * @param {string} tableSelector - CSS selector for the table to print
 */
export const printTableInNewWindow = (tableSelector = '.report-table') => {
  // Get the table element
  const table = document.querySelector(tableSelector);

  if (!table) {
    console.error('Table not found:', tableSelector);
    return;
  }

  // Create a new window
  const printWindow = window.open('', '_blank', 'width=1200,height=800');

  if (!printWindow) {
    alert('Please allow pop-ups to print the report');
    return;
  }

  // Count the number of columns
  const headerRow = table.querySelector('tr');
  const columnCount = headerRow ? headerRow.children.length : 0;

  // Calculate the optimal scale factor based on column count
  let scaleFactor = 1;
  if (columnCount > 25) {
    scaleFactor = 0.5; // Ultra small for many columns
  } else if (columnCount > 20) {
    scaleFactor = 0.6; // Very small for lots of columns
  } else if (columnCount > 15) {
    scaleFactor = 0.7; // Small for medium columns
  } else if (columnCount > 10) {
    scaleFactor = 0.8; // Normal for few columns
  }

  // Clone the table
  const tableClone = table.cloneNode(true);
  tableClone.classList.add('printable-table');

  // Calculate optimal column widths
  const columnWidths = calculateOptimalColumnWidths(tableClone, 1122); // A4 landscape width in pixels

  // Get all stylesheets from the current document
  const styleSheets = Array.from(document.styleSheets);
  let styles = '';

  // Extract styles from all stylesheets
  styleSheets.forEach(sheet => {
    try {
      const rules = sheet.cssRules || sheet.rules;
      if (rules) {
        for (let i = 0; i < rules.length; i++) {
          styles += rules[i].cssText;
        }
      }
    } catch (e) {
      console.warn('Cannot access stylesheet', e);
    }
  });

  // Create HTML content for the print window
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Report</title>
        <style>${styles}</style>
        <style>
          @page {
            size: landscape;
            margin: 0.2cm; /* Minimal margins to maximize usable space */
          }

          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
            /* Force full page size */
            min-width: 100%;
            min-height: 100%;
          }

          .print-container {
            width: calc(100% - 0.4cm); /* Account for minimal margins */
            height: calc(100% - 0.4cm); /* Account for minimal margins */
            max-width: calc(100% - 0.4cm);
            max-height: calc(100% - 0.4cm);
            min-width: calc(100% - 0.4cm); /* Force minimum size */
            min-height: calc(100% - 0.4cm); /* Force minimum size */
            overflow: visible;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            box-sizing: border-box;
          }

          .printable-table {
            border-collapse: collapse;
            table-layout: fixed;
            width: 100%;
            height: 100%; /* Fill entire height */
            min-width: 100%; /* Force minimum width */
            min-height: 100%; /* Force minimum height */
            font-size: 9pt; /* Larger font size for better readability */
            font-family: Arial, sans-serif;
            font-weight: bold;
            margin: 0 auto; /* Center the table */
            border: 1pt solid #000; /* Add outer border */
            box-sizing: border-box;
          }

          .printable-table th,
          .printable-table td {
            border: 0.5pt solid #000;
            padding: 2pt; /* Increased padding */
            text-align: center;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            line-height: 1.2; /* Improved line height */
          }

          /* Make student name column left-aligned and slightly wider */
          .printable-table td:nth-child(2) {
            text-align: left;
            padding-left: 3pt;
          }

          /* Make headers bold with background */
          .printable-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }

          /* Apply calculated column widths */
          ${Object.entries(columnWidths).map(([colIndex, width]) => `
          .printable-table th:nth-child(${parseInt(colIndex) + 1}),
          .printable-table td:nth-child(${parseInt(colIndex) + 1}) {
            width: ${width}% !important;
          }`).join('')}

          .print-scaling-container {
            transform-origin: center center; /* Scale from center */
            transform: scale(${scaleFactor});
            width: 100%;
            height: 100%;
            min-width: 100%; /* Force minimum width */
            min-height: 100%; /* Force minimum height */
            margin: 0 auto; /* Center the container */
            display: flex;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="print-scaling-container">
            ${tableClone.outerHTML}
          </div>
        </div>
        <script>
          // Auto-print when loaded
          window.onload = function() {
            // Calculate the optimal scale factor based on table width and height
            const table = document.querySelector('.printable-table');
            const container = document.querySelector('.print-container');

            if (table && container) {
              // EXACT A4 PAPER DIMENSIONS
              // A4 paper in landscape: 297mm × 210mm
              // Convert to points (1 pt = 0.352778 mm)
              const A4_WIDTH_PT = 841.89; // 297mm in points
              const A4_HEIGHT_PT = 595.28; // 210mm in points

              // Convert to pixels for screen (assuming 96 DPI, 1 inch = 72 points)
              // 96 DPI / 72 points per inch = 1.33333 pixels per point
              const PX_PER_PT = 96 / 72;
              const A4_WIDTH_PX = A4_WIDTH_PT * PX_PER_PT; // ~1123px
              const A4_HEIGHT_PX = A4_HEIGHT_PT * PX_PER_PT; // ~794px

              // Account for minimal margins (0.2cm = 5.67pt = ~7.6px on each side)
              const MARGIN_PT = 5.67; // 0.2cm in points
              const MARGIN_PX = MARGIN_PT * PX_PER_PT; // ~7.6px

              // Calculate available space (accounting for margins on all sides)
              const availableWidth = A4_WIDTH_PX - (2 * MARGIN_PX);
              const availableHeight = A4_HEIGHT_PX - (2 * MARGIN_PX);

              // Get actual table dimensions
              const tableWidth = table.scrollWidth;
              const tableHeight = table.scrollHeight;

              console.log('A4 dimensions (pt):', A4_WIDTH_PT, 'x', A4_HEIGHT_PT);
              console.log('A4 dimensions (px):', A4_WIDTH_PX, 'x', A4_HEIGHT_PX);
              console.log('Available space (px):', availableWidth, 'x', availableHeight);
              console.log('Table dimensions (px):', tableWidth, 'x', tableHeight);

              // Calculate precise scale factors
              const widthScale = availableWidth / tableWidth;
              const heightScale = availableHeight / tableHeight;

              console.log('Scale factors - Width:', widthScale, 'Height:', heightScale);

              // MAXIMIZE USAGE: Use the smaller scale factor but with a higher safety factor
              // to ensure we use as much of the page as possible
              const newScale = Math.min(widthScale, heightScale) * 0.995;

              // Apply the scale and center the table
              document.querySelector('.print-scaling-container').style.transform = 'scale(' + newScale + ')';
              document.querySelector('.print-scaling-container').style.transformOrigin = 'center center';
              console.log('Auto-adjusted scale to: ' + newScale);

              // Center the table on the page
              document.querySelector('.print-container').style.display = 'flex';
              document.querySelector('.print-container').style.justifyContent = 'center';
              document.querySelector('.print-container').style.alignItems = 'center';
            }

            // Small delay to ensure styles are applied
            setTimeout(function() {
              window.print();
              // Close the window after printing (or after print dialog is closed)
              window.addEventListener('afterprint', function() {
                window.close();
              });
            }, 1000);
          };
        </script>
      </body>
    </html>
  `;

  // Write the HTML to the new window
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Creates a button that prints a table with all columns visible
 * @param {string} tableSelector - CSS selector for the table to print
 * @returns {HTMLButtonElement} - The button element
 */
export const createPrintButton = (tableSelector = '.report-table') => {
  const button = document.createElement('button');
  button.textContent = 'Print All Columns';
  button.className = 'print-all-columns-button';
  button.style.cssText = `
    background-color: #1976d2;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    margin: 10px 0;
    font-size: 16px;
  `;

  button.addEventListener('click', () => {
    printTableInNewWindow(tableSelector);
  });

  return button;
};

export default {
  prepareTableForPrint,
  restoreTableAfterPrint,
  printTableWithAllColumns,
  printTableInNewWindow,
  createPrintButton
};
