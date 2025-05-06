import { TestWithNotes } from "../db/db";

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
export function csvToTests(csvData: Record<string, string>[]): TestWithNotes[] {
  return csvData.map(row => {
    const test: TestWithNotes = {
      id: row.id || crypto.randomUUID(),
      name: row.name || '',
      category: row.category || '',
      cptCode: row.cptCode || '',
      description: row.description || undefined,
      notes: row.notes || undefined,
    };
    
    // Add optional fields if they exist
    if (row.subCategory) test.subCategory = row.subCategory;
    if (row.loincCode) test.loincCode = row.loincCode;
    if (row.snomedCode) test.snomedCode = row.snomedCode;
    
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
export async function importTestsFromCSV(file: File): Promise<TestWithNotes[]> {
  try {
    const csvContent = await readCSVFile(file);
    const parsedData = parseCSV(csvContent);
    return csvToTests(parsedData);
  } catch (error) {
    console.error('Error importing tests from CSV:', error);
    throw error;
  }
}