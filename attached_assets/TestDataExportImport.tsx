import React, { useState } from 'react';
import { db as clientDb } from '../db/db';
import { allTests } from '../data/allTests';
import { exportTestsToCSV } from '../utils/csvExport';
import { importTestsFromCSV } from '../utils/csvImport';
import { execute_sql } from '../utils/sqlUtils';

interface TestDataExportImportProps {
  isDarkMode: boolean;
  onTestsUpdated: () => void;
}

const TestDataExportImport: React.FC<TestDataExportImportProps> = ({ isDarkMode, onTestsUpdated }) => {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileSelected, setFileSelected] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const themeClass = isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800';
  const buttonClass = isDarkMode
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-blue-500 hover:bg-blue-600 text-white';

  /**
   * Export all data from IndexedDB to CSV
   */
  const handleExportData = async () => {
    try {
      setIsLoading(true);
      setStatus('Exporting data from IndexedDB...');
      
      // Get all tests from IndexedDB
      const tests = await clientDb.getAllTests();
      
      if (tests.length === 0) {
        setStatus('No tests found in IndexedDB to export.');
        setIsLoading(false);
        return;
      }
      
      // Export to CSV and trigger download
      exportTestsToCSV(tests, 'medirefs_tests_export.csv');
      
      setStatus(`Successfully exported ${tests.length} tests to CSV.`);
    } catch (error) {
      console.error('Export failed:', error);
      setStatus(`Export failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export default test data to CSV
   */
  const handleExportDefaultData = () => {
    try {
      setIsLoading(true);
      setStatus('Exporting default test data...');
      
      // Convert static test data to TestWithNotes format
      const testsWithNotes = allTests.map(test => ({
        ...test,
        notes: undefined
      }));
      
      // Export to CSV and trigger download
      exportTestsToCSV(testsWithNotes, 'medirefs_default_tests.csv');
      
      setStatus(`Successfully exported ${testsWithNotes.length} default tests to CSV.`);
    } catch (error) {
      console.error('Export default data failed:', error);
      setStatus(`Export default data failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle file selection for import
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setFileSelected(true);
      setStatus(`Selected file: ${files[0].name}`);
    } else {
      setSelectedFile(null);
      setFileSelected(false);
      setStatus('');
    }
  };

  /**
   * Import data from CSV to IndexedDB
   */
  const handleImportToIndexedDB = async () => {
    if (!selectedFile) {
      setStatus('Please select a file to import.');
      return;
    }
    
    try {
      setIsLoading(true);
      setStatus('Importing data to IndexedDB...');
      
      // Parse CSV and convert to tests
      const importedTests = await importTestsFromCSV(selectedFile);
      
      if (importedTests.length === 0) {
        setStatus('No valid test data found in the CSV file.');
        setIsLoading(false);
        return;
      }
      
      // Save each test to IndexedDB
      let importedCount = 0;
      
      for (const test of importedTests) {
        await clientDb.addTest(test);
        importedCount++;
      }
      
      setStatus(`Successfully imported ${importedCount} tests to IndexedDB.`);
      onTestsUpdated();
    } catch (error) {
      console.error('Import failed:', error);
      setStatus(`Import failed: ${error}`);
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
      setFileSelected(false);
      
      // Reset file input
      const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  /**
   * Import data from CSV directly to PostgreSQL using SQL
   */
  const handleImportToPostgreSQL = async () => {
    if (!selectedFile) {
      setStatus('Please select a file to import.');
      return;
    }
    
    try {
      setIsLoading(true);
      setStatus('Importing data to PostgreSQL...');
      
      // Parse CSV and convert to tests
      const importedTests = await importTestsFromCSV(selectedFile);
      
      if (importedTests.length === 0) {
        setStatus('No valid test data found in the CSV file.');
        setIsLoading(false);
        return;
      }
      
      // Create SQL statements for insertion
      let sqlStatements = '';
      
      for (const test of importedTests) {
        // Create an INSERT statement for each test
        const values = [
          `'${test.id}'`,
          `'${test.name.replace(/'/g, "''")}'`,
          `'${test.category.replace(/'/g, "''")}'`,
          test.subCategory ? `'${test.subCategory.replace(/'/g, "''")}'` : 'NULL',
          `'${test.cptCode.replace(/'/g, "''")}'`,
          test.loincCode ? `'${test.loincCode.replace(/'/g, "''")}'` : 'NULL',
          test.snomedCode ? `'${test.snomedCode.replace(/'/g, "''")}'` : 'NULL',
          test.description ? `'${test.description.replace(/'/g, "''")}'` : 'NULL',
          test.notes ? `'${test.notes.replace(/'/g, "''")}'` : 'NULL'
        ];
        
        sqlStatements += `INSERT INTO tests (id, name, category, sub_category, cpt_code, loinc_code, snomed_code, description, notes) 
        VALUES (${values.join(', ')});\n`;
      }
      
      // Execute SQL to insert tests
      await execute_sql(sqlStatements);
      
      setStatus(`SQL statements prepared for ${importedTests.length} tests. Please check database.`);
    } catch (error) {
      console.error('Import to PostgreSQL failed:', error);
      setStatus(`Import to PostgreSQL failed: ${error}`);
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
      setFileSelected(false);
      
      // Reset file input
      const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  /**
   * Clear IndexedDB database
   */
  const handleClearIndexedDB = async () => {
    if (!confirm('Are you sure you want to clear all data from IndexedDB? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      setStatus('Clearing IndexedDB data...');
      
      // Reset the database
      await clientDb.resetDatabase();
      
      setStatus('Successfully cleared all data from IndexedDB.');
      onTestsUpdated();
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
      setStatus(`Failed to clear IndexedDB: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Clear PostgreSQL database
   */
  const handleClearPostgreSQL = async () => {
    if (!confirm('Are you sure you want to clear all data from PostgreSQL? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      setStatus('Clearing PostgreSQL data...');
      
      // Execute SQL to truncate the tests table
      const sql = 'TRUNCATE TABLE tests CASCADE;';
      await execute_sql(sql);
      
      setStatus('Successfully cleared all data from PostgreSQL.');
    } catch (error) {
      console.error('Failed to clear PostgreSQL:', error);
      setStatus(`Failed to clear PostgreSQL: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-6 rounded-lg shadow-md ${themeClass}`}>
      <h2 className="text-xl font-bold mb-4">Test Data Export & Import</h2>
      
      <div className="mb-6">
        <p className="mb-2">Export your test data to CSV for backup or to migrate to PostgreSQL.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleExportData}
            className={`p-2 rounded ${buttonClass}`}
            disabled={isLoading}
          >
            Export Current Data to CSV
          </button>
          <button
            onClick={handleExportDefaultData}
            className={`p-2 rounded ${buttonClass}`}
            disabled={isLoading}
          >
            Export Default Test Data
          </button>
        </div>
        
        <hr className="my-6" />
        
        <h3 className="text-lg font-semibold mb-3">Import from CSV</h3>
        <p className="mb-4">Import test data from a CSV file into IndexedDB or PostgreSQL.</p>
        
        <div className="mb-4">
          <label htmlFor="csv-file-input" className="block mb-2">
            Select CSV file to import:
          </label>
          <input
            type="file"
            id="csv-file-input"
            accept=".csv"
            onChange={handleFileChange}
            className={`w-full p-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            disabled={isLoading}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleImportToIndexedDB}
            className={`p-2 rounded ${buttonClass}`}
            disabled={!fileSelected || isLoading}
          >
            Import to IndexedDB
          </button>
          <button
            onClick={handleImportToPostgreSQL}
            className={`p-2 rounded ${buttonClass}`}
            disabled={!fileSelected || isLoading}
          >
            Import to PostgreSQL
          </button>
        </div>
        
        <hr className="my-6" />
        
        <h3 className="text-lg font-semibold mb-3">Database Management</h3>
        <p className="mb-4 text-red-500 font-semibold">Warning: The following actions will permanently delete all data!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleClearIndexedDB}
            className={`p-2 rounded ${isDarkMode ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'} text-white`}
            disabled={isLoading}
          >
            Clear IndexedDB
          </button>
          <button
            onClick={handleClearPostgreSQL}
            className={`p-2 rounded ${isDarkMode ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'} text-white`}
            disabled={isLoading}
          >
            Clear PostgreSQL
          </button>
        </div>
      </div>
      
      {status && (
        <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className="font-semibold">Status:</p>
          <p>{status}</p>
        </div>
      )}
    </div>
  );
};

export default TestDataExportImport;