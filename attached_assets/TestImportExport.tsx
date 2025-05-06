import React, { useState, useRef } from 'react';
import { TestWithNotes } from '../db/db';
import { 
  Download, 
  Upload, 
  Layers, 
  CheckCircle, 
  XCircle, 
  Info,
  AlertTriangle,
  Trash2,
  Database
} from 'lucide-react';
import { TestCategory, TestSubCategory, ImagingSubCategories } from '../types';
import TestMappingWizard from './TestMappingWizard';
import DuplicateTestModal from './DuplicateTestModal';
import { normalizeCategory, normalizeSubCategory } from '../utils/categoryUtils';
import { 
  getAllTests, 
  updateTest, 
  getTestById, 
  addTest, 
  getTestsBySubCategory,
  bulkDeleteTests
} from '../services/testService';

interface TestImportExportProps {
  isDarkMode: boolean;
  onTestsUpdated: () => void;
}

const TestImportExport: React.FC<TestImportExportProps> = ({ 
  isDarkMode,
  onTestsUpdated
}) => {
  const [importStatus, setImportStatus] = useState<{
    success: number;
    errors: number;
    message: string;
    details: string[];
  } | null>(null);
  const [bulkMappingStatus, setBulkMappingStatus] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{
    total: number;
    current: number;
    percentage: number;
    currentTest: string | null;
    phase: 'idle' | 'parsing' | 'mapping' | 'importing' | 'complete';
    message?: string;
  }>({
    total: 0,
    current: 0,
    percentage: 0,
    currentTest: null,
    phase: 'idle',
    message: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Field mapping state
  const [showMappingWizard, setShowMappingWizard] = useState(false);
  const [csvText, setCsvText] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [showDeleteSubcategoryConfirm, setShowDeleteSubcategoryConfirm] = useState<string | null>(null);
  
  // State for duplicate handling
  const [pendingImportTests, setPendingImportTests] = useState<TestWithNotes[]>([]);
  const [duplicates, setDuplicates] = useState<{
    byId: TestWithNotes[];
    byCptCode: TestWithNotes[];
    showModal: boolean;
    action: 'skip' | 'update' | 'decide-each';
  }>({
    byId: [],
    byCptCode: [],
    showModal: false,
    action: 'decide-each'
  });
  
  // Get default CSV header and template data
  const getCsvHeader = () => {
    return 'id,name,category,subCategory,cptCode,loincCode,snomedCode,description,notes';
  };
  
  const getCsvTemplateData = () => {
    // Example entries for each category
    const rows = [
      'complete-blood-count,Complete Blood Count,Laboratory,Hematology,85027,58410-2,,CBC test measures various components of blood,',
      'chest-xray-pa-lat,Chest X-ray PA and Lateral,Imaging Studies,Radiography,71046,,399208008,Standard two-view chest radiograph,',
      'echocardiogram,Echocardiogram Complete,Cardiovascular,Echocardiography,93306,,,Ultrasound examination of the heart,',
      'eeg-awake-drowsy,EEG Awake and Drowsy,Neurological,Electroencephalography,95819,,,Electroencephalogram recording in awake and drowsy states,',
      'pulmonary-function-test,Pulmonary Function Test,Pulmonary,Spirometry,94010,,,Measurement of breathing capacity and air flow,',
      'colonoscopy-diagnostic,Colonoscopy Diagnostic,Gastrointestinal,Endoscopy,45378,,,Endoscopic examination of the colon,'
    ];
    
    return [getCsvHeader(), ...rows].join('\n');
  };
  
  // Generate and download a CSV template
  const downloadCsvTemplate = () => {
    const csvContent = getCsvTemplateData();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'medtest_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Download all tests as CSV
  const exportAllTests = async () => {
    try {
      // Use server API instead of IndexedDB
      const tests = await getAllTests();
      
      if (tests.length === 0) {
        setImportStatus({
          success: 0,
          errors: 0,
          message: 'No tests to export',
          details: []
        });
        return;
      }
      
      // Convert tests to CSV rows
      const rows = tests.map(test => {
        return [
          test.id,
          `"${test.name.replace(/"/g, '""')}"`, // Escape quotes in the name
          test.category,
          test.subCategory || '',
          test.cptCode,
          test.loincCode || '',
          test.snomedCode || '',
          `"${(test.description || '').replace(/"/g, '""')}"`, // Escape quotes in the description
          `"${(test.notes || '').replace(/"/g, '""')}"` // Escape quotes in the notes
        ].join(',');
      });
      
      const csvContent = [getCsvHeader(), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'medtest_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setImportStatus({
        success: tests.length,
        errors: 0,
        message: `Successfully exported ${tests.length} tests to CSV.`,
        details: []
      });
    } catch (error) {
      console.error('Error exporting tests:', error);
      setImportStatus({
        success: 0,
        errors: 1,
        message: 'Failed to export tests.',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  };
  
  // Prepare CSV data for field mapping
  const prepareCsvForMapping = (csvText: string) => {
    try {
      const lines = csvText.split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file has insufficient data');
      }
      
      // Parse the header row
      const headers = parseCSVLine(lines[0]);
      setCsvHeaders(headers);
      
      // Parse the first few data rows for preview
      const previewRows: string[][] = [];
      for (let i = 1; i < Math.min(lines.length, 5); i++) {
        if (lines[i].trim()) {
          previewRows.push(parseCSVLine(lines[i]));
        }
      }
      setCsvPreviewRows(previewRows);
      
      // Show the mapping wizard
      setShowMappingWizard(true);
    } catch (error) {
      console.error('Error preparing CSV for mapping:', error);
      setImportStatus({
        success: 0,
        errors: 1,
        message: 'Failed to parse CSV file for mapping.',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  };
  
  // Handle file selection for import
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        setCsvText(text);
        
        // Prepare the CSV for mapping instead of immediately importing
        prepareCsvForMapping(text);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setImportStatus({
          success: 0,
          errors: 1,
          message: 'Failed to parse CSV file.',
          details: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    };
    reader.readAsText(file);
  };
  
  // Handle field mapping completion
  const handleMappingComplete = (mapping: Record<string, string>) => {
    setShowMappingWizard(false);
    
    // Now proceed with import using the mapping
    parseCsvAndImportTests(csvText, mapping);
  };
  
  // Process the actual import of tests
  const processImport = async (testsToImport: TestWithNotes[]): Promise<{
    success: number;
    errors: number;
    message: string;
    details: string[];
  }> => {
    let successCount = 0;
    let errorCount = 0;
    const errorDetails: string[] = [];
    
    // Update progress - we're now starting the import
    setImportProgress(prev => ({
      ...prev,
      phase: 'importing',
      message: 'Starting import process...',
      currentTest: null
    }));
    
    // Process each test
    for (let i = 0; i < testsToImport.length; i++) {
      const test = testsToImport[i];
      
      try {
        // Update progress
        const percentage = Math.round((i / testsToImport.length) * 100);
        setImportProgress(prev => ({
          ...prev,
          current: i,
          percentage,
          currentTest: test.name,
          message: `Importing test ${i + 1} of ${testsToImport.length}: ${test.name}`
        }));
        
        // Check if test already exists
        const existingTest = await getTestById(test.id);
        if (existingTest) {
          // Update existing test
          await updateTest(test);
          setImportProgress(prev => ({
            ...prev,
            message: `Updated existing test: ${test.name}`
          }));
        } else {
          // Add new test
          await addTest(test);
          setImportProgress(prev => ({
            ...prev,
            message: `Added new test: ${test.name}`
          }));
        }
        
        successCount++;
      } catch (error) {
        errorCount++;
        const errorMsg = `Test ${test.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errorDetails.push(errorMsg);
        
        // Update progress with error
        setImportProgress(prev => ({
          ...prev,
          message: `Error: ${errorMsg}`
        }));
      }
    }
    
    // Update progress - import complete
    setImportProgress(prev => ({
      ...prev,
      current: testsToImport.length,
      percentage: 100,
      phase: 'complete',
      message: `Import completed with ${successCount} tests imported and ${errorCount} errors.`
    }));
    
    // Set final status
    setImportStatus({
      success: successCount,
      errors: errorCount,
      message: `Import completed with ${successCount} tests imported and ${errorCount} errors.`,
      details: errorDetails
    });
    
    // Notify parent component
    onTestsUpdated();
    
    return {
      success: successCount,
      errors: errorCount,
      message: `Import completed with ${successCount} tests imported and ${errorCount} errors.`,
      details: errorDetails
    };
  };
  
  // Parse CSV and import tests with field mapping
  const parseCsvAndImportTests = async (csvText: string, fieldMapping: Record<string, string>): Promise<{
    success: number;
    errors: number;
    message: string;
    details: string[];
  }> => {
    // Set initial progress
    setImportProgress({
      total: 0,
      current: 0,
      percentage: 0,
      currentTest: null,
      phase: 'parsing',
      message: 'Parsing CSV file...'
    });
    
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      setImportProgress(prev => ({ ...prev, phase: 'idle' }));
      return {
        success: 0,
        errors: 1,
        message: 'CSV file has insufficient data.',
        details: ['The CSV file must have a header row and at least one data row.']
      };
    }
    
    // Update progress - we now know how many lines to process
    setImportProgress(prev => ({
      ...prev, 
      total: lines.length - 1,
      phase: 'mapping',
      message: `Preparing to import ${lines.length - 1} tests...`
    }));
    
    // Get the CSV headers
    const csvHeaders = parseCSVLine(lines[0]);
    
    // Map field indices using the field mapping
    const fieldIndices: Record<string, number> = {};
    Object.entries(fieldMapping).forEach(([targetField, sourceField]) => {
      if (sourceField) {
        const index = csvHeaders.indexOf(sourceField);
        if (index !== -1) {
          fieldIndices[targetField] = index;
        }
      }
    });
    
    // Check required fields - cptCode is no longer required
    const requiredFields = ['id', 'name', 'category'];
    const missingFields = requiredFields.filter(field => !(field in fieldIndices));
    
    if (missingFields.length > 0) {
      setImportProgress(prev => ({ ...prev, phase: 'idle' }));
      return {
        success: 0,
        errors: 1,
        message: 'Required fields are not mapped.',
        details: [`Missing required fields: ${missingFields.join(', ')}`]
      };
    }
    
    let errorCount = 0;
    const errorDetails: string[] = [];
    
    // Update progress - we're now starting the import
    setImportProgress(prev => ({
      ...prev,
      phase: 'mapping',
      message: 'Preparing tests for import...'
    }));
    
    // First pass: collect all tests to import and validate them
    const testsToImport: TestWithNotes[] = [];
    
    // Process data rows (skipping header)
    for (let i = 1; i < lines.length; i++) {
      // Skip empty lines
      if (!lines[i].trim()) continue;
      
      try {
        // Parse the line while handling quoted values that may contain commas
        const values = parseCSVLine(lines[i]);
        
        // Get test name and ID for progress reporting
        const testId = fieldIndices.id !== undefined ? values[fieldIndices.id].trim() : '';
        const testName = fieldIndices.name !== undefined ? values[fieldIndices.name].trim() : '';
        
        // Update progress
        const current = i - 1; // Adjust for header row
        const percentage = Math.round((current / (lines.length - 1)) * 100);
        setImportProgress(prev => ({
          ...prev,
          current,
          percentage,
          currentTest: testName || testId,
          message: `Parsing test ${current} of ${lines.length - 1}: ${testName || testId}`
        }));
        
        // Build the test object using field mapping
        const test: TestWithNotes = {
          id: testId,
          name: testName,
          category: fieldIndices.category !== undefined 
            ? normalizeCategory(values[fieldIndices.category].trim())
            : "Other", // Using a string instead of enum to avoid errors
          cptCode: fieldIndices.cptCode !== undefined ? values[fieldIndices.cptCode].trim() : '',
          notes: ''
        };
        
        // Add optional fields if they are mapped
        if (fieldIndices.subCategory !== undefined && values[fieldIndices.subCategory]) {
          test.subCategory = normalizeSubCategory(test.category, values[fieldIndices.subCategory].trim());
        }
        
        if (fieldIndices.loincCode !== undefined && values[fieldIndices.loincCode]) {
          test.loincCode = values[fieldIndices.loincCode].trim();
        }
        
        if (fieldIndices.snomedCode !== undefined && values[fieldIndices.snomedCode]) {
          test.snomedCode = values[fieldIndices.snomedCode].trim();
        }
        
        if (fieldIndices.description !== undefined && values[fieldIndices.description]) {
          test.description = values[fieldIndices.description].trim();
        }
        
        if (fieldIndices.notes !== undefined && values[fieldIndices.notes]) {
          test.notes = values[fieldIndices.notes].trim();
        }
        
        // Basic validation - cptCode is no longer required
        if (!test.id || !test.name || !test.category) {
          errorCount++;
          const errorMsg = `Line ${i + 1}: Missing required fields (id, name, category)`;
          errorDetails.push(errorMsg);
          
          // Update progress with error
          setImportProgress(prev => ({
            ...prev,
            message: `Error: ${errorMsg}`
          }));
          
          continue;
        }
        
        // Add the valid test to our collection
        testsToImport.push(test);
      } catch (error) {
        errorCount++;
        const errorMsg = `Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errorDetails.push(errorMsg);
        setImportProgress(prev => ({ ...prev, message: `Error: ${errorMsg}` }));
      }
    }
    
    // Check for duplicates
    setImportProgress(prev => ({
      ...prev,
      message: 'Checking for duplicate tests...'
    }));
    
    // Get all existing tests
    const existingTests = await getAllTests();
    
    // Find duplicates by ID and CPT code
    const duplicatesById: TestWithNotes[] = [];
    const duplicatesByCptCode: TestWithNotes[] = [];
    
    for (const test of testsToImport) {
      // Check for ID duplicates
      const existingTestById = existingTests.find(existing => existing.id === test.id);
      if (existingTestById) {
        duplicatesById.push({...test, existingTest: existingTestById});
      }
      
      // Check for CPT code duplicates (only if not already a duplicate by ID)
      if (!existingTestById && test.cptCode) {
        const existingTestByCpt = existingTests.find(
          existing => existing.cptCode === test.cptCode && existing.id !== test.id
        );
        if (existingTestByCpt) {
          duplicatesByCptCode.push({...test, existingTest: existingTestByCpt});
        }
      }
    }
    
    // If duplicates found, show the modal and wait for user decision
    if (duplicatesById.length > 0 || duplicatesByCptCode.length > 0) {
      setImportProgress(prev => ({
        ...prev,
        message: `Found ${duplicatesById.length} ID duplicates and ${duplicatesByCptCode.length} CPT code duplicates`
      }));
      
      // Store the tests to import for later processing
      setPendingImportTests(testsToImport);
      
      // Show duplicate modal
      setDuplicates({
        byId: duplicatesById,
        byCptCode: duplicatesByCptCode,
        showModal: true,
        action: 'decide-each'
      });
      
      // Wait for user action (we'll process the tests after user makes a decision)
      return {
        success: 0,
        errors: 0,
        message: 'Import paused: waiting for duplicate resolution',
        details: []
      };
    }
    
    // No duplicates found, proceed with import directly
    return await processImport(testsToImport);
  };
  
  // Helper function to parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        // If we encounter a double quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Two double quotes inside quoted field = escaped quote
          currentValue += '"';
          i++; // Skip the next quote
        } else {
          // Toggle the inQuotes flag
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // If we hit a comma and we're not in quotes, end the current value
        result.push(currentValue);
        currentValue = '';
      } else {
        // Add the character to the current value
        currentValue += char;
      }
    }
    
    // Don't forget the last value
    result.push(currentValue);
    return result;
  };
  
  // Clear subcategory in tests
  const clearSubCategory = async (subCategory: string) => {
    try {
      setBulkMappingStatus('Processing...');
      
      // Get all tests with the specific subcategory
      const testsToUpdate = await getTestsBySubCategory(subCategory);
      
      if (testsToUpdate.length === 0) {
        setBulkMappingStatus(`No tests found with subcategory "${subCategory}".`);
        return;
      }
      
      // Update each test to remove the subcategory
      let updatedCount = 0;
      for (const test of testsToUpdate) {
        test.subCategory = undefined;
        await updateTest(test);
        updatedCount++;
      }
      
      setBulkMappingStatus(`Successfully cleared subcategory "${subCategory}" from ${updatedCount} tests.`);
      onTestsUpdated();
    } catch (error) {
      console.error('Error clearing subcategory:', error);
      setBulkMappingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Delete all tests in a subcategory
  const deleteTestsBySubcategory = async (subCategory: string) => {
    try {
      setBulkMappingStatus('Processing...');
      
      // Get all tests to get a count before deletion
      const allTests = await getAllTests();
      const beforeCount = allTests.length;
      
      // Get all tests with the specified subcategory
      const testsToDelete = await getTestsBySubCategory(subCategory);
      
      if (testsToDelete.length === 0) {
        setBulkMappingStatus(`No tests found with subcategory "${subCategory}".`);
        setShowDeleteSubcategoryConfirm(null);
        return;
      }
      
      // Extract IDs
      const idsToDelete = testsToDelete.map(test => test.id);
      
      // Delete all tests with this subcategory
      await bulkDeleteTests(idsToDelete);
      
      // Get count after deletion to verify
      const updatedTests = await getAllTests();
      const afterCount = updatedTests.length;
      const deletedCount = beforeCount - afterCount;
      
      setBulkMappingStatus(`Successfully deleted ${deletedCount} tests in subcategory "${subCategory}".`);
      setShowDeleteSubcategoryConfirm(null);
      onTestsUpdated();
    } catch (error) {
      console.error('Error deleting tests by subcategory:', error);
      setBulkMappingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowDeleteSubcategoryConfirm(null);
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Update category mapping
  const performBulkCategoryMapping = async () => {
    try {
      setBulkMappingStatus('Processing...');
      
      // Get all tests
      const tests = await getAllTests();
      
      // Count of updated tests
      let updatedCount = 0;
      
      // Iterate through tests and update category/subcategory mappings
      for (const test of tests) {
        let updated = false;
        
        // Example mapping logic - this can be expanded as needed
        if (test.category === 'Imaging Studies') {
          // Make sure imaging tests have correct subcategories
          if (!test.subCategory || !Object.values(ImagingSubCategories).includes(test.subCategory)) {
            // Assign a default subcategory or use pattern matching to determine the right one
            let newSubCategory = ImagingSubCategories.RADIOGRAPHY;
            
            // Simple pattern matching to determine subcategory
            if (test.name.toLowerCase().includes('ct') || test.name.toLowerCase().includes('computed tomography')) {
              newSubCategory = ImagingSubCategories.CT;
            } else if (test.name.toLowerCase().includes('mri') || test.name.toLowerCase().includes('magnetic resonance')) {
              newSubCategory = ImagingSubCategories.MRI;
            } else if (test.name.toLowerCase().includes('ultrasound') || test.name.toLowerCase().includes('sonogram')) {
              newSubCategory = ImagingSubCategories.ULTRASOUND;
            } else if (test.name.toLowerCase().includes('mammogram') || test.name.toLowerCase().includes('mammography')) {
              newSubCategory = ImagingSubCategories.MAMMOGRAPHY;
            } else if (test.name.toLowerCase().includes('nuclear')) {
              newSubCategory = ImagingSubCategories.NUCLEAR;
            } else if (test.name.toLowerCase().includes('pet')) {
              newSubCategory = ImagingSubCategories.PET;
            } else if (test.name.toLowerCase().includes('fluoroscopy')) {
              newSubCategory = ImagingSubCategories.FLUOROSCOPY;
            } else if (test.name.toLowerCase().includes('dexa') || test.name.toLowerCase().includes('bone density')) {
              newSubCategory = ImagingSubCategories.DENSITOMETRY;
            } else if (test.name.toLowerCase().includes('angiogram') || test.name.toLowerCase().includes('angiography')) {
              newSubCategory = ImagingSubCategories.ANGIOGRAPHY;
            }
            
            test.subCategory = newSubCategory;
            updated = true;
          }
        } else if (test.category === TestCategory.LABORATORY) {
          // Ensure laboratory tests have valid subcategories
          if (!test.subCategory || !Object.values(TestSubCategory).includes(test.subCategory as TestSubCategory)) {
            // Assign a default subcategory
            test.subCategory = TestSubCategory.HEMATOLOGY;
            updated = true;
          }
        }
        
        // Update the test if changes were made
        if (updated) {
          await updateTest(test);
          updatedCount++;
        }
      }
      
      setBulkMappingStatus(`Successfully mapped ${updatedCount} tests to their correct categories and subcategories.`);
      onTestsUpdated();
    } catch (error) {
      console.error('Error mapping categories:', error);
      setBulkMappingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle duplicate test actions
  const handleSkipAllDuplicates = async () => {
    // Close the modal
    setDuplicates(prev => ({
      ...prev,
      showModal: false,
      action: 'skip'
    }));

    if (pendingImportTests.length === 0) return;

    // Get all duplicate IDs to skip
    const duplicateIds = [...duplicates.byId.map(d => d.id)];
    const duplicateCptCodes = [...duplicates.byCptCode.map(d => d.cptCode)];

    // Filter out tests with duplicate IDs or CPT codes
    const filteredTests = pendingImportTests.filter(test => {
      const isDuplicateId = duplicateIds.includes(test.id);
      const isDuplicateCpt = duplicateCptCodes.includes(test.cptCode);
      return !isDuplicateId && !isDuplicateCpt;
    });

    // Proceed with import of non-duplicate tests
    await processImport(filteredTests);
  };

  const handleUpdateAllDuplicates = async () => {
    // Close the modal
    setDuplicates(prev => ({
      ...prev,
      showModal: false,
      action: 'update'
    }));

    if (pendingImportTests.length === 0) return;

    // Process all tests, including duplicates (they will update existing tests)
    await processImport(pendingImportTests);
  };

  const handleDecideEachDuplicate = () => {
    // For now, we'll just treat it the same as update all
    // In a future implementation, we could create a more detailed interface for deciding each duplicate
    setDuplicates(prev => ({
      ...prev,
      showModal: false,
      action: 'update'
    }));
    
    if (pendingImportTests.length > 0) {
      processImport(pendingImportTests);
    }
  };

  const handleCloseDuplicateModal = () => {
    // Cancel the import
    setDuplicates({
      byId: [],
      byCptCode: [],
      showModal: false,
      action: 'decide-each'
    });
    
    // Reset the pending imports
    setPendingImportTests([]);
    
    // Update progress - import canceled
    setImportProgress(prev => ({
      ...prev,
      phase: 'idle',
      message: 'Import canceled by user.'
    }));
    
    // Set import status
    setImportStatus({
      success: 0,
      errors: 0,
      message: 'Import canceled by user.',
      details: []
    });
  };

  return (
    <div className={`mb-8 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
      {/* Duplicate Tests Modal */}
      <DuplicateTestModal
        isOpen={duplicates.showModal}
        onClose={handleCloseDuplicateModal}
        duplicatesById={duplicates.byId}
        duplicatesByCptCode={duplicates.byCptCode}
        onSkipAll={handleSkipAllDuplicates}
        onUpdateAll={handleUpdateAllDuplicates}
        onDecideEach={handleDecideEachDuplicate}
        isDarkMode={isDarkMode}
      />
      
      <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">CSV Import/Export</h2>
      
      <div className="mb-6">
        <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Import tests from a CSV file or export existing tests to CSV format. Use the template to ensure your CSV has the correct structure.
        </p>
        
        {/* Import Progress Bar */}
        {importProgress.phase !== 'idle' && (
          <div className={`mb-6 p-4 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} shadow-sm`}>
            <div className="flex justify-between items-center mb-2">
              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                {importProgress.phase === 'parsing' && 'Parsing CSV file...'}
                {importProgress.phase === 'mapping' && 'Mapping fields...'}
                {importProgress.phase === 'importing' && 'Importing tests...'}
                {importProgress.phase === 'complete' && 'Import complete!'}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                {importProgress.current} of {importProgress.total} tests
              </div>
            </div>
            
            <div className={`w-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2.5`}>
              <div 
                className={`h-2.5 rounded-full ${
                  importProgress.phase === 'parsing' ? 'bg-yellow-500' :
                  importProgress.phase === 'mapping' ? 'bg-blue-500' :
                  importProgress.phase === 'importing' ? 'bg-green-500' :
                  importProgress.phase === 'complete' ? 'bg-green-600' : 'bg-gray-500'
                }`} 
                style={{ width: `${importProgress.percentage}%` }}
              ></div>
            </div>
            
            <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {importProgress.message && (
                <div className="flex items-center gap-1">
                  {importProgress.phase === 'importing' && (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                  )}
                  {importProgress.message}
                </div>
              )}
              {importProgress.currentTest && importProgress.phase === 'importing' && (
                <div className="truncate mt-1">
                  Processing: <span className="font-semibold">{importProgress.currentTest}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`p-5 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md flex flex-col items-center justify-between h-full`}>
            <div className="flex flex-col items-center text-center">
              <Download className={`mb-3 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} size={36} />
              <h3 className="text-lg font-medium mb-2">Download Template</h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Get a CSV template with the correct column structure
              </p>
            </div>
            <button
              onClick={downloadCsvTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full"
            >
              Download Template
            </button>
          </div>
          
          <div className={`p-5 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md flex flex-col items-center justify-between h-full`}>
            <div className="flex flex-col items-center text-center">
              <Upload className={`mb-3 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`} size={36} />
              <h3 className="text-lg font-medium mb-2">Import Tests</h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Upload a CSV file to add or update tests
              </p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".csv" 
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={triggerFileInput}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-full"
            >
              Upload CSV
            </button>
          </div>
          
          <div className={`p-5 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md flex flex-col items-center justify-between h-full`}>
            <div className="flex flex-col items-center text-center">
              <Download className={`mb-3 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`} size={36} />
              <h3 className="text-lg font-medium mb-2">Export Tests to CSV</h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Download all tests as a standard CSV file
              </p>
            </div>
            <button
              onClick={exportAllTests}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors w-full"
            >
              Export CSV
            </button>
          </div>
          
          <div className={`p-5 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md flex flex-col items-center justify-between h-full`}>
            <div className="flex flex-col items-center text-center">
              <Database className={`mb-3 ${
                isDarkMode ? 'text-teal-400' : 'text-teal-600'
              }`} size={36} />
              <h3 className="text-lg font-medium mb-2">Export to FHIR</h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Export tests to FHIR-compliant JSON format
              </p>
            </div>
            <a
              href="/fhir-export"
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors w-full text-center"
            >
              FHIR Export Tool
            </a>
          </div>
        </div>
        
        {/* CSV Mapping Wizard */}
        {showMappingWizard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="max-w-4xl w-full max-h-[90vh] overflow-auto">
              <TestMappingWizard
                csvHeaders={csvHeaders}
                csvPreviewRows={csvPreviewRows}
                onComplete={handleMappingComplete}
                onCancel={() => setShowMappingWizard(false)}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}
        
        {importStatus && (
          <div className={`p-4 rounded-md mb-4 ${
            importStatus.errors > 0 
              ? (isDarkMode ? 'bg-red-900/50 text-red-100' : 'bg-red-100 text-red-800') 
              : (isDarkMode ? 'bg-green-900/50 text-green-100' : 'bg-green-100 text-green-800')
          }`}>
            <div className="flex items-start">
              {importStatus.errors > 0 ? (
                importStatus.success > 0 ? (
                  <AlertTriangle className="flex-shrink-0 mr-2 mt-0.5" size={18} />
                ) : (
                  <XCircle className="flex-shrink-0 mr-2 mt-0.5" size={18} />
                )
              ) : (
                <CheckCircle className="flex-shrink-0 mr-2 mt-0.5" size={18} />
              )}
              <div>
                <p className="font-medium">{importStatus.message}</p>
                {importStatus.details.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium mb-1">Errors:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {importStatus.details.map((detail, index) => (
                        <li key={index}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">Category Mapping</h2>
      
      <div className="mb-6">
        <div className={`p-5 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <div className="flex items-start mb-4">
            <Info className={`flex-shrink-0 mr-3 mt-1 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} size={20} />
            <div>
              <h3 className="text-lg font-medium mb-1">About Category Mapping</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                This tool helps ensure all tests are properly categorized. It will:
              </p>
              <ul className={`list-disc list-inside mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>Check all Imaging Studies have valid subcategories</li>
                <li>Intelligently map tests to appropriate subcategories based on their names</li>
                <li>Ensure Laboratory tests have valid subcategories</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={performBulkCategoryMapping}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center"
            >
              <Layers className="mr-2" size={18} />
              Map Categories
            </button>
            
            {bulkMappingStatus && (
              <p className={`text-sm ${
                bulkMappingStatus.includes('Error') 
                  ? (isDarkMode ? 'text-red-300' : 'text-red-600')
                  : (isDarkMode ? 'text-green-300' : 'text-green-600')
              }`}>
                {bulkMappingStatus}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">Subcategory Management</h2>
      
      <div className="mb-6">
        <div className={`p-5 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <div className="flex items-start mb-4">
            <Info className={`flex-shrink-0 mr-3 mt-1 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} size={20} />
            <div>
              <h3 className="text-lg font-medium mb-1">Subcategory Management</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                The following tools help you manage subcategories:
              </p>
              <ul className={`list-disc list-inside mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>Clear removes a subcategory from all tests, setting it to none</li>
                <li>Delete completely removes all tests with a specific subcategory</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="font-medium mb-2">Laboratory Test Subcategories</div>
              <div className="flex flex-wrap gap-2">
                {Object.values(TestSubCategory).map(subCategory => (
                  <div
                    key={subCategory}
                    className="flex items-center bg-opacity-10 bg-blue-500 rounded px-2 py-1"
                  >
                    <span className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      {subCategory}
                    </span>
                    <div className="flex items-center ml-2">
                      <button
                        onClick={() => clearSubCategory(subCategory)}
                        className={`text-xs px-2 py-1 rounded ${
                          isDarkMode 
                            ? 'bg-gray-700 text-gray-300 hover:bg-yellow-900/30 hover:text-yellow-200' 
                            : 'bg-gray-200 text-gray-700 hover:bg-yellow-100 hover:text-yellow-800'
                        }`}
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowDeleteSubcategoryConfirm(subCategory)}
                        className={`text-xs px-2 py-1 rounded ml-1 ${
                          isDarkMode 
                            ? 'bg-gray-700 text-gray-300 hover:bg-red-900/30 hover:text-red-200' 
                            : 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-800'
                        }`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">Imaging Subcategories</div>
              <div className="flex flex-wrap gap-2">
                {Object.values(ImagingSubCategories).map(subCategory => (
                  <div
                    key={subCategory}
                    className="flex items-center bg-opacity-10 bg-indigo-500 rounded px-2 py-1"
                  >
                    <span className={`text-sm ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                      {subCategory}
                    </span>
                    <div className="flex items-center ml-2">
                      <button
                        onClick={() => clearSubCategory(subCategory)}
                        className={`text-xs px-2 py-1 rounded ${
                          isDarkMode 
                            ? 'bg-gray-700 text-gray-300 hover:bg-yellow-900/30 hover:text-yellow-200' 
                            : 'bg-gray-200 text-gray-700 hover:bg-yellow-100 hover:text-yellow-800'
                        }`}
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowDeleteSubcategoryConfirm(subCategory)}
                        className={`text-xs px-2 py-1 rounded ml-1 ${
                          isDarkMode 
                            ? 'bg-gray-700 text-gray-300 hover:bg-red-900/30 hover:text-red-200' 
                            : 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-800'
                        }`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Subcategory Confirmation Modal */}
      {showDeleteSubcategoryConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-lg shadow-xl p-6 max-w-md mx-4`}>
            <div className="flex items-start mb-4">
              <AlertTriangle size={24} className="text-red-500 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold mb-2">Delete All Tests in Subcategory</h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                  Are you sure you want to delete ALL tests in the "{showDeleteSubcategoryConfirm}" subcategory?
                </p>
                <p className={`${isDarkMode ? 'text-red-300' : 'text-red-600'} text-sm`}>
                  This will permanently delete all tests and their IDs from this subcategory allowing you to reload them from scratch.
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteSubcategoryConfirm(null)}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteTestsBySubcategory(showDeleteSubcategoryConfirm)}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Delete Subcategory Tests
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestImportExport;