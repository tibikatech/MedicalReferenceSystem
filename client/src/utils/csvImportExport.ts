import { Test } from '@shared/schema';

/**
 * Converts tests to CSV format
 * @param tests Array of tests to convert
 * @returns CSV string
 */
export function testsToCSV(tests: Test[]): string {
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
      const value = test[header as keyof Test];
      
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
 * Parse a CSV string into an array of objects
 * @param csvString CSV content as string
 * @returns Array of objects where keys are column headers
 */
export function parseCSV(csvString: string): Record<string, string>[] {
  // Split the CSV into rows
  const rows = csvString.split('\n');
  
  // Extract headers from the first row
  const headers = rows[0].split(',');
  
  // Initialize result array
  const result: Record<string, string>[] = [];
  
  // Process each row (skip header row)
  for (let i = 1; i < rows.length; i++) {
    // Skip empty rows
    if (!rows[i].trim()) continue;
    
    const row = rows[i];
    const values: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    // Parse the CSV row considering quoted values
    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      
      if (char === '"') {
        // Handle quotes - if we see double quotes inside quoted string, it's an escaped quote
        if (j + 1 < row.length && row[j + 1] === '"') {
          currentValue += '"';
          j++; // Skip the next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(currentValue);
        currentValue = '';
      } else {
        // Add character to current value
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue);
    
    // Create object with header keys
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] || '';
    }
    
    result.push(obj);
  }
  
  return result;
}

/**
 * Converts CSV data to test objects
 * @param csvData Array of objects parsed from CSV
 * @returns Array of Test objects
 */
export function csvToTests(csvData: Record<string, string>[]): Test[] {
  return csvData.map(row => {
    const test: Test = {
      id: row.id || crypto.randomUUID(),
      name: row.name || '',
      category: row.category || '',
      cptCode: row.cptCode || null,
      description: row.description || null,
      notes: row.notes || null,
      loincCode: row.loincCode || null,
      snomedCode: row.snomedCode || null,
      subCategory: row.subCategory || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return test;
  });
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
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(reader.error);
    };
    
    reader.readAsText(file);
  });
}

/**
 * Imports tests from a CSV file
 * @param file CSV file to import
 * @returns Promise resolving to array of imported tests
 */
export async function importTestsFromCSV(file: File): Promise<Test[]> {
  try {
    const csvContent = await readCSVFile(file);
    const parsedData = parseCSV(csvContent);
    return csvToTests(parsedData);
  } catch (error) {
    console.error('Error importing tests from CSV:', error);
    throw error;
  }
}

/**
 * Extracts CSV headers and a preview of rows from a CSV file
 * @param file CSV file to preview
 * @param previewRowCount Number of rows to preview
 * @returns Promise resolving to headers and preview rows
 */
export async function previewCSV(file: File, previewRowCount = 5): Promise<{
  headers: string[],
  previewRows: string[][]
}> {
  try {
    const csvContent = await readCSVFile(file);
    const rows = csvContent.split('\n');
    
    if (rows.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    const headers = rows[0].split(',');
    const previewRows: string[][] = [];
    
    // Extract preview rows (skip header row)
    for (let i = 1; i < Math.min(rows.length, previewRowCount + 1); i++) {
      if (!rows[i].trim()) continue;
      
      const values: string[] = [];
      let inQuotes = false;
      let currentValue = '';
      
      // Parse the CSV row considering quoted values
      for (let j = 0; j < rows[i].length; j++) {
        const char = rows[i][j];
        
        if (char === '"') {
          // Handle quotes - if we see double quotes inside quoted string, it's an escaped quote
          if (j + 1 < rows[i].length && rows[i][j + 1] === '"') {
            currentValue += '"';
            j++; // Skip the next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // End of value
          values.push(currentValue);
          currentValue = '';
        } else {
          // Add character to current value
          currentValue += char;
        }
      }
      
      // Add the last value
      values.push(currentValue);
      previewRows.push(values);
    }
    
    return { headers, previewRows };
  } catch (error) {
    console.error('Error previewing CSV:', error);
    throw error;
  }
}

/**
 * Check if a test is duplicated in the existing tests
 * @param test Test to check
 * @param existingTests Array of existing tests
 * @returns Object containing duplication status
 */
export function checkForDuplicateTest(test: Test, existingTests: Test[]): {
  isDuplicate: boolean;
  duplicateById: boolean;
  duplicateByCptCode: boolean;
  existingTest: Test | null;
} {
  // Check for ID duplication
  const duplicateById = existingTests.some(existingTest => existingTest.id === test.id);
  
  // Check for CPT code duplication (only if CPT code is present)
  const duplicateByCptCode = test.cptCode 
    ? existingTests.some(existingTest => 
        existingTest.cptCode === test.cptCode && existingTest.id !== test.id
      )
    : false;
  
  const isDuplicate = duplicateById || duplicateByCptCode;
  
  // Find the existing test that this duplicates
  const existingTest = isDuplicate 
    ? existingTests.find(existing => 
        existing.id === test.id || (test.cptCode && existing.cptCode === test.cptCode)
      ) || null
    : null;
  
  return {
    isDuplicate,
    duplicateById,
    duplicateByCptCode,
    existingTest
  };
}

/**
 * Downloads a CSV file
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