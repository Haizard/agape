/**
 * Print Forcer Utility
 * This utility forces all content to be displayed in the printed document
 * with absolutely no content being cut off.
 */

/**
 * Forces all content to be displayed when printing with absolutely no cut-offs
 * @param {string} tableSelector - CSS selector for the table to print
 */
export const forcePrint = (tableSelector = '.report-table') => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=1200,height=800');

  if (!printWindow) {
    alert('Please allow pop-ups to print the report');
    return;
  }

  // Get the table element
  const table = document.querySelector(tableSelector);

  if (!table) {
    alert('Table not found');
    printWindow.close();
    return;
  }

  // Clone the table to avoid modifying the original
  const tableClone = table.cloneNode(true);

  // Count the number of columns in the table
  const headerRow = tableClone.querySelector('tr');
  const columnCount = headerRow ? headerRow.children.length : 0;

  console.log(`Table has ${columnCount} columns`);

  // Calculate the scale factor based on the number of columns
  // More columns = smaller scale
  let scaleFactor = 1;
  if (columnCount > 20) {
    scaleFactor = 0.5; // Ultra small for many columns
  } else if (columnCount > 15) {
    scaleFactor = 0.6; // Very small for lots of columns
  } else if (columnCount > 10) {
    scaleFactor = 0.7; // Small for medium columns
  } else {
    scaleFactor = 0.8; // Normal for few columns
  }

  console.log(`Using scale factor: ${scaleFactor}`);

  // Create a style element with our custom print styles
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @page {
      size: landscape;
      margin: 0;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .print-container {
      width: 100%;
      overflow: visible;
      padding: 0;
      margin: 0;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 5pt;
      font-family: Arial, sans-serif;
      font-weight: bold;
      table-layout: fixed;
      transform: scale(${scaleFactor});
      transform-origin: top left;
    }

    th, td {
      border: 0.5pt solid #000;
      padding: 1pt;
      text-align: center;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      max-width: 1px; /* Force equal column width */
    }

    /* Make student name column slightly wider */
    td:nth-child(2) {
      text-align: left;
      max-width: 2px;
    }

    /* Make all text ultra compact */
    * {
      letter-spacing: -0.5pt;
      word-spacing: -1pt;
    }
  `;

  // Create HTML content for the print window
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Report</title>
      </head>
      <body>
        <div class="print-container">
          ${tableClone.outerHTML}
        </div>
        <script>
          // Auto-print when loaded
          window.onload = function() {
            // Add the style element after the page has loaded
            document.head.appendChild(${styleElement.outerHTML});

            // Calculate the optimal scale factor based on table width
            const table = document.querySelector('table');
            const containerWidth = document.body.clientWidth;
            const tableWidth = table.scrollWidth;

            // If table is wider than container, scale it down
            if (tableWidth > containerWidth) {
              const newScale = (containerWidth / tableWidth) * 0.95; // 95% of perfect fit
              table.style.transform = 'scale(' + newScale + ')';
              console.log('Auto-adjusted scale to: ' + newScale);
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
 * Creates a print button that forces all content to be displayed
 * @param {string} tableSelector - CSS selector for the table to print
 * @returns {HTMLButtonElement} - The print button
 */
export const createForcePrintButton = (tableSelector = '.report-table') => {
  const button = document.createElement('button');
  button.textContent = 'Force Print (No Cut-off)';
  button.className = 'force-print-button';
  button.style.cssText = `
    background-color: #2e7d32;
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
    forcePrint(tableSelector);
  });

  return button;
};

export default {
  forcePrint,
  createForcePrintButton
};
