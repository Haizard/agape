/**
 * Table Fitter Utility
 * This utility forces a table to fit on a single page when printing,
 * regardless of how many columns it has.
 */

/**
 * Calculates the optimal scale to fit a table on a single page
 * @param {HTMLElement} table - The table element to fit
 * @returns {number} - The optimal scale factor
 */
export const calculateOptimalScale = (table) => {
  if (!table) return 1;
  
  // Get the table dimensions
  const tableWidth = table.scrollWidth;
  const tableHeight = table.scrollHeight;
  
  // Get the page dimensions (A4 landscape)
  // A4 landscape is 297mm x 210mm
  // Convert to pixels (assuming 96 DPI)
  const pageWidth = 297 * 3.78; // 1122.66px
  const pageHeight = 210 * 3.78; // 793.8px
  
  // Calculate the scale factors
  const widthScale = pageWidth / tableWidth;
  const heightScale = pageHeight / tableHeight;
  
  // Use the smaller scale factor to ensure the table fits
  const scaleFactor = Math.min(widthScale, heightScale) * 0.9; // 90% of perfect fit for safety margin
  
  console.log(`Table dimensions: ${tableWidth}x${tableHeight}px`);
  console.log(`Page dimensions: ${pageWidth}x${pageHeight}px`);
  console.log(`Scale factors - Width: ${widthScale}, Height: ${heightScale}`);
  console.log(`Optimal scale factor: ${scaleFactor}`);
  
  return scaleFactor;
};

/**
 * Forces a table to fit on a single page when printing
 * @param {string} tableSelector - CSS selector for the table to fit
 */
export const fitTableToPage = (tableSelector = '.report-table') => {
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
  
  // Create HTML content for the print window
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Report</title>
        <style>
          @page {
            size: landscape;
            margin: 0;
          }
          
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          
          .print-container {
            width: 100%;
            height: 100%;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }
          
          table {
            border-collapse: collapse;
            font-size: 5pt;
            font-family: Arial, sans-serif;
            font-weight: bold;
            margin: 0;
            padding: 0;
          }
          
          th, td {
            border: 0.5pt solid #000;
            padding: 1pt;
            text-align: center;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
          
          /* Make student name column slightly wider */
          td:nth-child(2) {
            text-align: left;
          }
          
          /* Make all text ultra compact */
          * {
            letter-spacing: -0.5pt;
            word-spacing: -1pt;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${tableClone.outerHTML}
        </div>
        <script>
          // Auto-fit table when loaded
          window.onload = function() {
            const table = document.querySelector('table');
            const container = document.querySelector('.print-container');
            
            // Get the dimensions
            const tableWidth = table.offsetWidth;
            const tableHeight = table.offsetHeight;
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            
            console.log('Table dimensions:', tableWidth, 'x', tableHeight);
            console.log('Container dimensions:', containerWidth, 'x', containerHeight);
            
            // Calculate the scale factor
            const widthScale = containerWidth / tableWidth;
            const heightScale = containerHeight / tableHeight;
            const scale = Math.min(widthScale, heightScale) * 0.95; // 95% of perfect fit
            
            console.log('Scale factor:', scale);
            
            // Apply the scale
            table.style.transform = 'scale(' + scale + ')';
            table.style.transformOrigin = 'top left';
            
            // Adjust container to center the table
            container.style.justifyContent = 'flex-start';
            container.style.alignItems = 'flex-start';
            
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
 * Creates a button that fits a table to a single page when printing
 * @param {string} tableSelector - CSS selector for the table to fit
 * @returns {HTMLButtonElement} - The button element
 */
export const createFitTableButton = (tableSelector = '.report-table') => {
  const button = document.createElement('button');
  button.textContent = 'Fit Table to Page';
  button.className = 'fit-table-button';
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
    fitTableToPage(tableSelector);
  });
  
  return button;
};

export default {
  calculateOptimalScale,
  fitTableToPage,
  createFitTableButton
};
