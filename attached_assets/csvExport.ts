import { TestWithNotes } from "../db/db";

/**
 * Converts tests to CSV format
 * @param tests Array of tests to convert
 * @returns CSV string
 */
export function testsToCSV(tests: TestWithNotes[]): string {
  // Define headers based on test properties
  const headers = [
    'id',
    'name',
    'category',
    'subCategory',
    'cptCode',
    'loincCode',
    'snomedCode',
    'description',
    'notes'
  ];
  
  // Create CSV header row
  let csv = headers.join(',') + '\n';
  
  // Add each test as a row
  tests.forEach(test => {
    const row = headers.map(header => {
      // Get the value for this header
      const value = test[header as keyof TestWithNotes];
      
      // Format the value properly for CSV
      if (value === null || value === undefined) {
        return '';
      }
      
      // Handle strings with commas by enclosing in quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        // Escape quotes by doubling them and enclose in quotes
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    
    // Add the row to the CSV
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

/**
 * Generates a file download for the CSV data
 * @param csvContent CSV content as string
 * @param fileName Name to give the downloaded file
 */
export function downloadCSV(csvContent: string, fileName: string): void {
  // Create a blob with the CSV data
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create an object URL from the blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  
  // Append the link to the document
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports tests to a downloadable CSV file
 * @param tests Array of tests to export
 * @param fileName Name to give the downloaded file
 */
export function exportTestsToCSV(tests: TestWithNotes[], fileName: string = 'medirefs_tests.csv'): void {
  const csvContent = testsToCSV(tests);
  downloadCSV(csvContent, fileName);
}