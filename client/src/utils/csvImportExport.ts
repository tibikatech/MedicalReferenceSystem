import { Test } from '@shared/schema';

/**
 * Parse a CSV string into an array of objects
 * @param csvString CSV content as string
 * @returns Array of objects where keys are column headers
 */
export function parseCSV(csvString: string): Record<string, string>[] {
  // Split by newline and handle different newline characters
  const lines = csvString.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
  
  // Get headers from first line
  const headers = lines[0].split(',').map(header => header.trim());
  
  // Parse each line into an object
  return lines.slice(1).map(line => {
    // Handle commas within quoted fields
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Don't forget the last value
    values.push(currentValue);
    
    // Create an object with the headers as keys
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index] || '';
      return obj;
    }, {} as Record<string, string>);
  });
}

/**
 * Preview the first n rows of a CSV file
 * @param file CSV file to preview
 * @param maxRows Maximum number of rows to preview
 */
export async function previewCSV(file: File, maxRows: number = 5): Promise<{
  headers: string[];
  previewRows: string[][];
}> {
  const text = await readCSVFile(file);
  const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }
  
  // Simple split for preview purposes
  const headers = lines[0].split(',').map(header => header.trim());
  const previewRows = lines
    .slice(1, maxRows + 1)
    .map(line => line.split(',').map(cell => cell.trim()));
  
  return { headers, previewRows };
}

/**
 * Reads a CSV file and returns the content as a string
 * @param file File object to read
 * @returns Promise resolving to the file content as string
 */
export function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target) {
        resolve(event.target.result as string);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
}

/**
 * Convert array of objects to CSV format
 * @param data Array of objects to convert
 * @returns CSV string
 */
export function objectsToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');
  
  const rows = data.map(obj => {
    return headers.map(header => {
      const value = obj[header] === null || obj[header] === undefined ? '' : obj[header];
      // Quote values that contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [headerRow, ...rows].join('\n');
}

/**
 * Convert tests to CSV format
 * @param tests Array of tests to convert
 * @returns CSV string
 */
export function testsToCSV(tests: Test[]): string {
  // Convert tests to plain objects
  const data = tests.map(test => ({
    id: test.id,
    name: test.name,
    category: test.category,
    subCategory: test.subCategory,
    cptCode: test.cptCode,
    loincCode: test.loincCode,
    snomedCode: test.snomedCode,
    description: test.description,
    notes: test.notes
  }));
  
  return objectsToCSV(data);
}

/**
 * Download data as CSV file
 * @param csvContent CSV content as string
 * @param fileName Name for the downloaded file
 */
export function downloadCSV(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export tests to a downloadable CSV file
 * @param tests Array of tests to export
 * @param fileName Name for the downloaded file
 */
export function exportTestsToCSV(tests: Test[], fileName: string = 'medirefs_tests.csv'): void {
  const csvContent = testsToCSV(tests);
  downloadCSV(csvContent, fileName);
}