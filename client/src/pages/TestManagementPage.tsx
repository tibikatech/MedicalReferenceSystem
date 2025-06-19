import React, { useState, useRef } from 'react';
import { Test } from '@shared/schema';
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  Download,
  Filter,
  FileUp,
  Database,
  ChevronDown,
  UploadCloud,
  FileDown,
  CheckSquare,
  Square,
  Search,
  ArrowRight,
  FileCode,
  ChevronLeft
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import TestMappingWizard from "@/components/TestMappingWizard";
import DuplicateTestModal from "@/components/DuplicateTestModal";
import FhirExportTool from "@/components/FhirExportTool";
import TestEditModal from "@/components/TestEditModal";
import TestAddModal from "@/components/TestAddModal";
import UploadProgressModal from "@/components/UploadProgressModal";
import CategoryMappingModal from "@/components/CategoryMappingModal";
import ExportToCsv from "@/components/ExportToCsv";
import { 
  parseCSV, 
  readCSVFile, 
  previewCSV, 
  exportTestsToCSV 
} from "@/utils/csvImportExport";
import { downloadFhirExport } from "@/utils/fhirExporter";
import { 
  ImportAuditService, 
  parseCSVWithValidation, 
  detectDuplicates, 
  validateTestData 
} from "@/lib/importAuditService";
import { useAuth } from "@/hooks/use-auth";

export default function TestManagementPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize audit service
  const auditService = useRef(new ImportAuditService());

  // CSV import related state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [showMappingWizard, setShowMappingWizard] = useState(false);
  const [duplicateTests, setDuplicateTests] = useState<{
    duplicatesById: Test[],
    duplicatesByCptCode: Test[]
  }>({
    duplicatesById: [],
    duplicatesByCptCode: []
  });
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  
  // Upload progress state
  const [uploadStatus, setUploadStatus] = useState<{
    state: 'idle' | 'processing' | 'validating' | 'uploading' | 'complete' | 'error';
    processed: number;
    total: number;
    successCount: number;
    errorCount: number;
    errors: string[];
  }>({
    state: 'idle',
    processed: 0,
    total: 0,
    successCount: 0,
    errorCount: 0,
    errors: []
  });
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  
  // FHIR export state
  const [showFhirExportTool, setShowFhirExportTool] = useState(false);
  
  // Test edit state
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Test add state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Test delete state
  const [deletingTest, setDeletingTest] = useState<Test | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Bulk delete state
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  
  // Category Mapping state
  const [showCategoryMappingModal, setShowCategoryMappingModal] = useState(false);

  // Get all tests
  const { data: tests, isLoading: testsLoading, isError: testsError } = useQuery({
    queryKey: ['/api/tests'],
  });

  // Get all categories with count
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/test-count-by-category'],
  });

  // Get all subcategories with count
  const { data: subcategoriesData, isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['/api/test-count-by-subcategory'],
  });

  // Check if a test matches the search query
  const testMatchesSearchQuery = (test: Test, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    return (
      test.name.toLowerCase().includes(lowerQuery) ||
      test.category.toLowerCase().includes(lowerQuery) ||
      test.subCategory?.toLowerCase().includes(lowerQuery) ||
      test.cptCode?.toLowerCase().includes(lowerQuery) ||
      test.loincCode?.toLowerCase().includes(lowerQuery) ||
      test.snomedCode?.toLowerCase().includes(lowerQuery) ||
      (test.description ? test.description.toLowerCase().includes(lowerQuery) : false) ||
      (test.notes ? test.notes.toLowerCase().includes(lowerQuery) : false)
    );
  };
  
  // Filter tests based on search query and category/subcategory selections
  const filteredTests = ((tests as any)?.tests || []).filter((test: Test) => {
    // Filter by category
    if (selectedCategory && test.category !== selectedCategory) {
      return false;
    }
    
    // Filter by subcategory
    if (selectedSubCategory && test.subCategory !== selectedSubCategory) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !testMatchesSearchQuery(test, searchQuery)) {
      return false;
    }
    
    return true;
  });

  // Update LOINC codes mutation
  const updateLoincCodesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/tests/update-loinc-codes', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to update LOINC codes');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "LOINC Codes Updated",
        description: `Successfully updated ${data.updatedCount} LOINC codes.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update LOINC codes: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update SNOMED codes mutation
  const updateSnomedCodesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/tests/update-snomed-codes', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to update SNOMED codes');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "SNOMED Codes Updated",
        description: `Successfully updated ${data.updatedCount} SNOMED codes.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update SNOMED codes: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update both LOINC and SNOMED codes
  const updateBothCodesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/tests/update-all-codes', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to update all codes');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Codes Updated",
        description: `Successfully updated ${data.loincUpdated} LOINC codes and ${data.snomedUpdated} SNOMED codes.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update codes: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Function to handle test selection
  const toggleTestSelection = (testId: string) => {
    const newSelectedTests = new Set(selectedTests);
    if (newSelectedTests.has(testId)) {
      newSelectedTests.delete(testId);
    } else {
      newSelectedTests.add(testId);
    }
    setSelectedTests(newSelectedTests);
  };

  // Toggle select all tests
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedTests(new Set());
    } else {
      setSelectedTests(new Set(filteredTests.map((test: Test) => test.id)));
    }
    setSelectAll(!selectAll);
  };

  // Handle CSV upload
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Process the uploaded CSV file with enhanced validation and audit logging
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      // Read and validate CSV content
      const csvContent = await readCSVFile(file);
      const validationResult = parseCSVWithValidation(csvContent);
      
      if (!validationResult.success) {
        toast({
          title: "CSV Validation Failed",
          description: `${validationResult.errors.length} validation errors found. Please check your file.`,
          variant: "destructive",
        });
        
        // Show detailed errors
        console.error('CSV Validation Errors:', validationResult.errors);
        return;
      }

      // Store the validated data for mapping
      setCsvFile(file);
      
      // Extract headers from the first successful row
      if (validationResult.data.length > 0) {
        setCsvHeaders(Object.keys(validationResult.data[0]));
        setCsvPreviewRows(validationResult.data.slice(0, 5).map(row => Object.values(row) as string[]));
      }
      
      // Show the mapping wizard
      setShowMappingWizard(true);
      
      toast({
        title: "CSV Validated Successfully",
        description: `File ${file.name} contains ${validationResult.data.length} valid test records.`,
      });
    } catch (error) {
      console.error('Error processing CSV:', error);
      toast({
        title: "CSV Processing Error",
        description: `Failed to process the file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
    
    // Reset the file input
    event.target.value = '';
  };
  
  // Handle mapping completion with enhanced audit logging
  const handleMappingComplete = async (mapping: Record<string, string>) => {
    setShowMappingWizard(false);
    
    if (!csvFile || !user) return;
    
    try {
      // Read and parse CSV with validation
      const csvContent = await readCSVFile(csvFile);
      const validationResult = parseCSVWithValidation(csvContent);
      
      if (!validationResult.success) {
        toast({
          title: "Import Failed",
          description: "CSV validation failed during import.",
          variant: "destructive",
        });
        return;
      }

      // Start audit session
      const sessionId = await auditService.current.startImportSession(
        csvFile.name,
        csvFile.size,
        validationResult.data.length,
        user.id
      );

      // Map CSV data to tests using the provided mapping
      const mappedTests = validationResult.data.map(row => {
        const test: Test = {
          id: mapping['id'] ? row[mapping['id']] || crypto.randomUUID() : crypto.randomUUID(),
          name: mapping['name'] ? row[mapping['name']] || '' : '',
          category: mapping['category'] ? row[mapping['category']] || '' : '',
          subCategory: mapping['subCategory'] ? row[mapping['subCategory']] || '' : '',
          cptCode: mapping['cptCode'] ? row[mapping['cptCode']] || null : null,
          loincCode: mapping['loincCode'] ? row[mapping['loincCode']] || null : null,
          snomedCode: mapping['snomedCode'] ? row[mapping['snomedCode']] || null : null,
          description: mapping['description'] ? row[mapping['description']] || null : null,
          notes: mapping['notes'] ? row[mapping['notes']] || null : null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return test;
      });
      
      // Get all existing tests for duplicate detection
      const allTests = (tests as any)?.tests || [];
      
      // Enhanced duplicate detection using the audit service
      const duplicateResult = detectDuplicates(mappedTests, allTests);
      
      // Show duplicates modal if there are any duplicates
      if (duplicateResult.duplicatesById.length > 0 || duplicateResult.duplicatesByCptCode.length > 0) {
        setDuplicateTests({
          duplicatesById: duplicateResult.duplicatesById as Test[],
          duplicatesByCptCode: duplicateResult.duplicatesByCptCode as Test[]
        });
        setShowDuplicatesModal(true);
      } else {
        // If no duplicates, proceed with import using audit logging
        await importTestsWithAudit(duplicateResult.uniqueTests as Test[], sessionId, validationResult.data);
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Import Error",
        description: `Failed to import the file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };
  
  // Handle duplicates resolution
  const handleSkipAllDuplicates = async () => {
    setShowDuplicatesModal(false);
    // Skip all duplicates by filtering them out
    if (!csvFile) return;
    
    try {
      // Read the CSV file
      const csvContent = await readCSVFile(csvFile);
      const parsedData = parseCSV(csvContent);
      
      // Get all test IDs to skip
      const skipIds = new Set([
        ...duplicateTests.duplicatesById.map(test => test.id),
        ...duplicateTests.duplicatesByCptCode.map(test => test.id)
      ]);
      
      // Filter out duplicates
      const testsToImport = parsedData
        .map(row => {
          const test: Test = {
            id: row.id || crypto.randomUUID(),
            name: row.name || '',
            category: row.category || '',
            subCategory: row.subCategory || '',
            cptCode: row.cptCode || null,
            loincCode: row.loincCode || null,
            snomedCode: row.snomedCode || null,
            description: row.description || null,
            notes: row.notes || null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          return test;
        })
        .filter(test => !skipIds.has(test.id));
      
      // Import the remaining tests
      await importTests(testsToImport);
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Import Error",
        description: `Failed to import the file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };
  
  // Handle updating all duplicates
  const handleUpdateAllDuplicates = async () => {
    setShowDuplicatesModal(false);
    if (!csvFile) return;
    
    try {
      // Read the CSV file
      const csvContent = await readCSVFile(csvFile);
      const parsedData = parseCSV(csvContent);
      
      // Map all tests including duplicates
      const testsToImport = parsedData.map(row => {
        const test: Test = {
          id: row.id || crypto.randomUUID(),
          name: row.name || '',
          category: row.category || '',
          subCategory: row.subCategory || '',
          cptCode: row.cptCode || null,
          loincCode: row.loincCode || null,
          snomedCode: row.snomedCode || null,
          description: row.description || null,
          notes: row.notes || null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return test;
      });
      
      // Import all tests (this will update existing ones)
      await importTests(testsToImport);
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Import Error",
        description: `Failed to import the file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Enhanced import function with comprehensive audit logging
  const importTestsWithAudit = async (testsToImport: Test[], sessionId: number, originalData: Record<string, any>[]) => {
    if (!user) return;

    try {
      // Reset upload status
      setUploadStatus({
        state: 'processing',
        processed: 0,
        total: testsToImport.length,
        successCount: 0,
        errorCount: 0,
        errors: []
      });

      // Show upload progress modal
      setShowUploadProgress(true);

      // Process data delay to show initial processing state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update status to validating
      setUploadStatus(prev => ({
        ...prev,
        state: 'validating',
      }));

      // Process validation delay to show validating state
      await new Promise(resolve => setTimeout(resolve, 800));

      // Track successful and failed imports
      let successCount = 0;
      let errorCount = 0;
      let duplicateCount = 0;
      const errors: string[] = [];

      // Update status to uploading
      setUploadStatus(prev => ({
        ...prev,
        state: 'uploading',
      }));

      // Import each test individually with detailed audit logging
      for (let i = 0; i < testsToImport.length; i++) {
        const test = testsToImport[i];
        const originalRow = originalData[i] || {};
        const startTime = Date.now();

        try {
          // Check if test exists (update) or is new (insert)
          const exists = (tests as any)?.tests.some((t: Test) => t.id === test.id);
          const operation = exists ? 'update' : 'insert';

          let response;
          if (exists) {
            // Update existing test
            response = await fetch(`/api/tests/${test.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(test),
            });
          } else {
            // Insert new test
            response = await fetch('/api/tests', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(test),
            });
          }

          const processingTime = Date.now() - startTime;

          if (response.ok) {
            successCount++;
            // Log successful operation
            await auditService.current.logTestProcessing(
              originalRow,
              operation,
              {
                success: true,
                testId: test.id,
              }
            );
          } else {
            errorCount++;
            const errorText = await response.text();
            const errorMessage = `Failed to ${operation} test ${test.id}: ${errorText}`;
            errors.push(errorMessage);

            // Log failed operation
            await auditService.current.logTestProcessing(
              originalRow,
              operation,
              {
                success: false,
                error: errorMessage,
              }
            );
          }
        } catch (error) {
          errorCount++;
          const errorMessage = `Error processing test ${test.id}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMessage);

          // Log error
          await auditService.current.logTestProcessing(
            originalRow,
            'error',
            {
              success: false,
              error: errorMessage,
            }
          );
        }

        // Update processed count
        setUploadStatus(prev => ({
          ...prev,
          processed: i + 1,
          successCount,
          errorCount,
          errors
        }));

        // Add a small delay between operations to show progress
        if (i < testsToImport.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Update final status
      setUploadStatus(prev => ({
        ...prev,
        state: 'complete',
        successCount,
        errorCount,
        errors
      }));

      // Finish audit session
      await auditService.current.finishImportSession(
        successCount,
        errorCount,
        duplicateCount,
        errors,
        `Imported ${successCount} tests successfully`
      );

      // Show completion toast
      if (errorCount > 0) {
        toast({
          title: `Import Completed with ${errorCount} errors`,
          description: `Successfully imported ${successCount} tests. Failed to import ${errorCount} tests.`,
          variant: successCount > 0 ? "default" : "destructive",
        });
        console.error("Import errors:", errors);
      } else {
        toast({
          title: "CSV Import Complete",
          description: `Successfully imported ${successCount} tests with full audit logging.`,
        });
      }

      // Keep the progress dialog open for a moment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Hide upload progress modal
      setShowUploadProgress(false);

      // Refresh the test list
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/test-count-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['/api/test-count-by-subcategory'] });

    } catch (error) {
      // Handle overall import error
      setUploadStatus({
        state: 'error',
        processed: 0,
        total: testsToImport.length,
        successCount: 0,
        errorCount: 1,
        errors: [`${error instanceof Error ? error.message : String(error)}`]
      });

      // Finish audit session with error
      if (sessionId) {
        await auditService.current.finishImportSession(
          0,
          1,
          0,
          [`Import session failed: ${error instanceof Error ? error.message : String(error)}`],
          'Import session failed due to system error'
        );
      }

      // Keep error displayed for a moment
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Hide upload progress modal
      setShowUploadProgress(false);

      toast({
        title: "Import Failed",
        description: `Error: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };
  
  // Import tests to database with progress tracking
  const importTests = async (testsToImport: Test[]) => {
    try {
      // Reset upload status
      setUploadStatus({
        state: 'processing',
        processed: 0,
        total: testsToImport.length,
        successCount: 0,
        errorCount: 0,
        errors: []
      });
      
      // Show upload progress modal
      setShowUploadProgress(true);
      
      // Process data delay to show initial processing state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update status to validating
      setUploadStatus(prev => ({
        ...prev,
        state: 'validating',
      }));
      
      // Process validation delay to show validating state
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Track successful and failed imports
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      // Update status to uploading
      setUploadStatus(prev => ({
        ...prev,
        state: 'uploading',
      }));
      
      // Import each test individually to handle errors better
      for (let i = 0; i < testsToImport.length; i++) {
        const test = testsToImport[i];
        try {
          // Check if test exists (update) or is new (insert)
          const exists = (tests as any)?.tests.some((t: Test) => t.id === test.id);
          
          if (exists) {
            // Update existing test
            const response = await fetch(`/api/tests/${test.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(test),
            });
            
            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
              const errorText = await response.text();
              errors.push(`Failed to update test ${test.id}: ${errorText}`);
            }
          } else {
            // Insert new test
            const response = await fetch('/api/tests', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(test),
            });
            
            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
              const errorText = await response.text();
              errors.push(`Failed to insert test ${test.id}: ${errorText}`);
            }
          }
        } catch (error) {
          errorCount++;
          errors.push(`Error processing test ${test.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        // Update processed count (with small async delay to show progress)
        setUploadStatus(prev => ({
          ...prev,
          processed: i + 1,
          successCount,
          errorCount,
          errors
        }));
        
        // Add a small delay between operations to show progress
        if (i < testsToImport.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // Update final status
      setUploadStatus(prev => ({
        ...prev,
        state: 'complete',
        successCount,
        errorCount,
        errors
      }));
      
      // Add a small delay before showing toast
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show toast with results
      if (errorCount > 0) {
        toast({
          title: `Import Completed with ${errorCount} errors`,
          description: `Successfully imported ${successCount} tests. Failed to import ${errorCount} tests.`,
          variant: successCount > 0 ? "default" : "destructive",
        });
        
        // Log errors to console for debugging
        console.error("Import errors:", errors);
      } else {
        toast({
          title: "CSV Import Complete",
          description: `Successfully imported ${successCount} tests.`,
        });
      }
      
      // Keep the progress dialog open for a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Hide upload progress modal
      setShowUploadProgress(false);
      
      // Refresh the test list
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      // Also refresh categories and subcategories counts
      queryClient.invalidateQueries({ queryKey: ['/api/test-count-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['/api/test-count-by-subcategory'] });
    } catch (error) {
      // Handle overall import error
      setUploadStatus({
        state: 'error',
        processed: 0,
        total: testsToImport.length,
        successCount: 0,
        errorCount: 1,
        errors: [`${error instanceof Error ? error.message : String(error)}`]
      });
      
      // Keep error displayed for a moment
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Hide upload progress modal
      setShowUploadProgress(false);
      
      toast({
        title: "Import Failed",
        description: `Error: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };
  
  // Handle opening the edit modal for a test
  const handleEditTest = (test: Test) => {
    setEditingTest(test);
    setIsEditModalOpen(true);
  };
  
  // Handle test delete
  const handleDeleteTest = (test: Test) => {
    setDeletingTest(test);
    setIsDeleteModalOpen(true);
  };
  
  // Confirm test deletion
  const confirmDeleteTest = async () => {
    if (!deletingTest) return;
    
    try {
      const response = await fetch(`/api/tests/${deletingTest.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete test');
      }
      
      // Close delete modal
      setIsDeleteModalOpen(false);
      setDeletingTest(null);
      
      // Invalidate queries to refresh the tests list
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      
      // Show success message
      toast({
        title: "Test Deleted",
        description: `${deletingTest.name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting test:', error);
      toast({
        title: "Error",
        description: `Failed to delete test: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedTests.size === 0) {
      toast({
        title: "No Tests Selected",
        description: "Please select tests to delete.",
        variant: "destructive",
      });
      return;
    }
    setIsBulkDeleteModalOpen(true);
  };

  // Confirm bulk deletion
  const confirmBulkDelete = async () => {
    if (selectedTests.size === 0) return;
    
    try {
      // Get the selected test names for the success message
      const selectedTestNames = filteredTests
        .filter((test: Test) => selectedTests.has(test.id))
        .map((test: Test) => test.name);
      
      // Create array of test IDs to delete
      const testIdsToDelete = Array.from(selectedTests);
      
      // Make the bulk delete API call
      const response = await fetch('/api/tests/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testIds: testIdsToDelete }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete tests');
      }
      
      const result = await response.json();
      
      // Close bulk delete modal
      setIsBulkDeleteModalOpen(false);
      
      // Clear selections
      setSelectedTests(new Set());
      setSelectAll(false);
      
      // Invalidate queries to refresh the tests list
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/test-count-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['/api/test-count-by-subcategory'] });
      
      // Show success message
      toast({
        title: "Tests Deleted",
        description: `Successfully deleted ${result.deletedCount} test${result.deletedCount !== 1 ? 's' : ''}.`,
      });
    } catch (error) {
      console.error('Error deleting tests:', error);
      toast({
        title: "Error",
        description: `Failed to delete tests: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };
  
  // Handle test update after editing
  const handleTestUpdate = (updatedTest: Test) => {
    // No need to manually update the state since 
    // TestEditModal already invalidates the cache
    toast({
      title: "Test Updated",
      description: `${updatedTest.name} has been updated successfully.`,
    });
  };

  // Download CSV template
  const downloadTemplate = () => {
    const header = "id,name,category,subCategory,cptCode,loincCode,snomedCode,description,notes";
    const sampleData = [
      "TTES-LAB-HMT-85027,Complete Blood Count,Laboratory Tests,Hematology,85027,58410-2,,CBC test measures various components of blood,",
      "TTES-IMG-XRG-71046,Chest X-ray PA and Lateral,Imaging Studies,Radiography,71046,,399208008,Standard two-view chest radiograph,"
    ].join('\n');
    
    const csvContent = `${header}\n${sampleData}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'medirefs_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export tests to CSV
  const exportTestsToCsv = () => {
    // Export all or selected tests
    const testsToExport = selectedTests.size > 0 
      ? filteredTests.filter((test: Test) => selectedTests.has(test.id))
      : filteredTests;
    
    if (testsToExport.length === 0) {
      toast({
        title: "No Tests Selected",
        description: "Please select tests to export or clear your filters.",
        variant: "destructive",
      });
      return;
    }
    
    // Generate CSV content
    const header = "id,name,category,subCategory,cptCode,loincCode,snomedCode,description,notes";
    const rows = testsToExport.map((test: Test) => {
      return [
        test.id,
        test.name,
        test.category,
        test.subCategory || '',
        test.cptCode || '',
        test.loincCode || '',
        test.snomedCode || '',
        test.description ? `"${test.description.replace(/"/g, '""')}"` : '',
        test.notes ? `"${test.notes.replace(/"/g, '""')}"` : ''
      ].join(',');
    }).join('\n');
    
    const csvContent = `${header}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'medirefs_tests.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV Exported",
      description: `Successfully exported ${testsToExport.length} tests to CSV.`,
    });
  };

  // Export to FHIR
  const exportToFhir = () => {
    // Select tests to export
    const testsToExport = selectedTests.size > 0 
      ? filteredTests.filter((test: Test) => selectedTests.has(test.id))
      : filteredTests;
    
    if (testsToExport.length === 0) {
      toast({
        title: "No Tests Selected",
        description: "Please select tests to export or clear your filters.",
        variant: "destructive",
      });
      return;
    }
    
    // Open the FHIR export tool
    setShowFhirExportTool(true);
  };
  
  // Handle individual decisions for duplicates
  const handleDecideEachDuplicate = () => {
    setShowDuplicatesModal(false);
    toast({
      title: "Not Implemented",
      description: "This feature would open a modal to decide each duplicate individually.",
    });
  };

  // Delete confirmation dialog component
  const DeleteConfirmDialog = () => {
    return (
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the test "{deletingTest?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-5">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingTest(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTest}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Bulk delete confirmation dialog component
  const BulkDeleteConfirmDialog = () => {
    const selectedTestNames = filteredTests
      .filter((test: Test) => selectedTests.has(test.id))
      .map((test: Test) => test.name);
    
    return (
      <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Bulk Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTests.size} selected test{selectedTests.size !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedTestNames.length <= 5 ? (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-2">Tests to be deleted:</p>
              <ul className="text-sm space-y-1">
                {selectedTestNames.map((name: string, index: number) => (
                  <li key={index} className="text-gray-800">• {name}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-2">Selected tests include:</p>
              <ul className="text-sm space-y-1">
                {selectedTestNames.slice(0, 3).map((name: string, index: number) => (
                  <li key={index} className="text-gray-800">• {name}</li>
                ))}
                <li className="text-gray-600 italic">... and {selectedTests.size - 3} more tests</li>
              </ul>
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-5">
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
            >
              Delete {selectedTests.size} Test{selectedTests.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <Header onSearch={() => {}} />
      
      <main className="flex-grow bg-gray-900 text-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back button and title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link href="/" className="text-blue-400 hover:text-blue-300 flex items-center mr-4">
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Home
              </Link>
              <h1 className="text-2xl font-bold text-white">Test Management</h1>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="bg-gray-600 text-gray-400 cursor-not-allowed"
                disabled={true}
                title="Coming soon: Feature to update LOINC codes"
              >
                Update LOINC Codes
              </Button>
              <Button 
                variant="outline" 
                className="bg-gray-600 text-gray-400 cursor-not-allowed"
                disabled={true}
                title="Coming soon: Feature to update SNOMED codes"
              >
                Update SNOMED Codes
              </Button>
              <Button 
                variant="outline" 
                className="bg-gray-600 text-gray-400 cursor-not-allowed"
                disabled={true}
                title="Coming soon: Feature to update both LOINC and SNOMED codes"
              >
                Update Both
              </Button>
              <Button 
                variant="outline" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setIsAddModalOpen(true)}
              >
                Add New Test
              </Button>
            </div>
          </div>

          <Tabs defaultValue="manage" className="w-full">
            <TabsList className="bg-gray-800 mb-6">
              <TabsTrigger value="manage" className="text-white data-[state=active]:bg-gray-700">
                Manage Tests
              </TabsTrigger>
              <TabsTrigger value="import-export" className="text-white data-[state=active]:bg-gray-700">
                Import/Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manage">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                    placeholder="Search tests by name, code, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Bulk actions bar - shows when tests are selected */}
              {selectedTests.size > 0 && (
                <div className="mb-4 bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-blue-300">
                        {selectedTests.size} test{selectedTests.size !== 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-400 border-blue-600 hover:bg-blue-900/30"
                        onClick={() => {
                          setSelectedTests(new Set());
                          setSelectAll(false);
                        }}
                      >
                        Clear Selection
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleBulkDelete}
                      >
                        Delete Selected ({selectedTests.size})
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-4 flex items-center">
                {/* Category filter dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-gray-800 text-white border-gray-700 mr-2"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter by Category
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                    {/* All Categories option */}
                    <DropdownMenuItem 
                      className={`${!selectedCategory ? 'bg-blue-800/30' : 'hover:bg-gray-700'}`}
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedSubCategory(null);
                      }}
                    >
                      All Categories
                    </DropdownMenuItem>
                    
                    {/* List all available categories */}
                    {(categoriesData as any)?.categories?.map((cat: { category: string, count: number }) => (
                      <DropdownMenuItem 
                        key={cat.category}
                        className={`${selectedCategory === cat.category ? 'bg-blue-800/30' : 'hover:bg-gray-700'}`}
                        onClick={() => {
                          setSelectedCategory(cat.category);
                          setSelectedSubCategory(null);
                        }}
                      >
                        {cat.category} ({cat.count})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Subcategory filter dropdown - Only shows when a category is selected */}
                {selectedCategory && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-gray-800 text-white border-gray-700 mr-2"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filter by Subcategory
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                      {/* All Subcategories option */}
                      <DropdownMenuItem 
                        className={`${!selectedSubCategory ? 'bg-blue-800/30' : 'hover:bg-gray-700'}`}
                        onClick={() => setSelectedSubCategory(null)}
                      >
                        All Subcategories
                      </DropdownMenuItem>
                      
                      {/* List all available subcategories for the selected category */}
                      {(subcategoriesData as any)?.subcategories
                        ?.filter((subCat: { subCategory: string, count: number }) => 
                          ((tests as any)?.tests || []).some((test: Test) => 
                            test.category === selectedCategory && test.subCategory === subCat.subCategory
                          )
                        )
                        .map((subCat: { subCategory: string, count: number }) => (
                          <DropdownMenuItem 
                            key={subCat.subCategory}
                            className={`${selectedSubCategory === subCat.subCategory ? 'bg-blue-800/30' : 'hover:bg-gray-700'}`}
                            onClick={() => setSelectedSubCategory(subCat.subCategory)}
                          >
                            {subCat.subCategory} ({subCat.count})
                          </DropdownMenuItem>
                        ))
                      }
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {/* Category filter badges */}
                <div className="flex flex-wrap gap-2">
                  {selectedCategory && (
                    <Badge className="bg-blue-600 text-white flex items-center gap-1">
                      {selectedCategory}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => {
                          setSelectedCategory(null);
                          setSelectedSubCategory(null);
                        }}
                      >
                        <AlertCircle className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  
                  {selectedSubCategory && (
                    <Badge className="bg-purple-600 text-white flex items-center gap-1">
                      {selectedSubCategory}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setSelectedSubCategory(null)}
                      >
                        <AlertCircle className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-800">
                    <TableRow>
                      <TableHead className="w-10 text-white">
                        <Checkbox 
                          checked={selectAll} 
                          onCheckedChange={toggleSelectAll}
                          className="border-gray-600"
                        />
                      </TableHead>
                      <TableHead className="text-white">Name</TableHead>
                      <TableHead className="text-white">Category</TableHead>
                      <TableHead className="text-white">CPT Code</TableHead>
                      <TableHead className="text-white">LOINC Code</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-400">
                          Loading tests...
                        </TableCell>
                      </TableRow>
                    ) : testsError ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-red-400">
                          Error loading tests. Please try again.
                        </TableCell>
                      </TableRow>
                    ) : filteredTests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-400">
                          No tests found. {searchQuery && "Try a different search query or "}
                          <Button variant="link" className="text-blue-400 p-0" onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory(null);
                            setSelectedSubCategory(null);
                          }}>
                            clear all filters
                          </Button>.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTests.map((test: Test) => (
                        <TableRow key={test.id} className="border-gray-700">
                          <TableCell>
                            <Checkbox 
                              checked={selectedTests.has(test.id)} 
                              onCheckedChange={() => toggleTestSelection(test.id)}
                              className="border-gray-600"
                            />
                          </TableCell>
                          <TableCell className="font-medium text-white">{test.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <Badge className="bg-blue-600 text-white mb-1 w-fit">
                                {test.category}
                              </Badge>
                              {test.subCategory && (
                                <Badge className="bg-gray-700 text-white w-fit">
                                  {test.subCategory}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{test.cptCode || "—"}</TableCell>
                          <TableCell>
                            {test.category === "Laboratory Tests" 
                              ? (test.loincCode || "—") 
                              : (test.snomedCode || "—")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-400 hover:text-blue-300"
                                onClick={() => handleEditTest(test)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-400 hover:text-red-300"
                                onClick={() => handleDeleteTest(test)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="import-export">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Download Template */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col items-center">
                  <Download className="h-12 w-12 text-blue-500 mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Download Template</h3>
                  <p className="text-sm text-gray-400 text-center mb-4">
                    Get a CSV template with the correct column structure
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={downloadTemplate}
                  >
                    Download Template
                  </Button>
                </div>
                
                {/* Import Tests */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col items-center">
                  <UploadCloud className="h-12 w-12 text-green-500 mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Import Tests</h3>
                  <p className="text-sm text-gray-400 text-center mb-4">
                    Upload a CSV file to add or update tests
                  </p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv" 
                    onChange={handleFileChange}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleFileUpload}
                  >
                    Upload CSV
                  </Button>
                </div>
                
                {/* Export to CSV with Category Filtering */}
                <ExportToCsv />
                
                {/* Export to FHIR */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col items-center">
                  <Database className="h-12 w-12 text-teal-500 mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Export to FHIR</h3>
                  <p className="text-sm text-gray-400 text-center mb-4">
                    Export tests to FHIR-compliant JSON format
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={exportToFhir}
                  >
                    FHIR Export Tool
                  </Button>
                </div>
              </div>
              
              {/* Category Mapping */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-4">
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-semibold">Category Mapping</h3>
                  <div className="bg-blue-900 text-blue-200 rounded-full p-1 ml-2">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                </div>
                
                <p className="text-gray-400 mb-4">
                  This tool helps ensure all tests are properly categorized. It will:
                </p>
                
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Check all Imaging Studies have valid subcategories</li>
                  <li>Intelligently map tests to appropriate subcategories based on their names</li>
                  <li>Ensure Laboratory tests have valid subcategories</li>
                </ul>
                
                <Button 
                  variant="outline" 
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => setShowCategoryMappingModal(true)}
                >
                  Map Categories
                </Button>
              </div>
              
              {/* Category Mapping Modal */}
              {showCategoryMappingModal && (
                <CategoryMappingModal 
                  isOpen={showCategoryMappingModal} 
                  onClose={() => setShowCategoryMappingModal(false)}
                  onComplete={() => {
                    setShowCategoryMappingModal(false);
                    queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
                    toast({
                      title: "Category Mapping Complete",
                      description: "All tests have been successfully mapped to appropriate categories and subcategories.",
                    });
                  }}
                />
              )}
              
              {/* CSV Mapping Preview */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4">Map Your CSV Fields</h3>
                <p className="text-gray-400 mb-4">
                  Match your CSV fields to the corresponding fields in the Medical Test Reference system.
                </p>
                
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <h4 className="text-md font-medium mb-2">Mapping Preview</h4>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Your CSV Headers</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <ArrowRight className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Medical Test Fields</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <div>
                      <div className="bg-gray-800 rounded p-2 text-sm">
                        id
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Sample values:
                        <div className="bg-gray-800 rounded text-xs p-1 mt-1">TTES-IMG-MRI-72070</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="w-full h-px bg-green-500"></div>
                    </div>
                    <div>
                      <div className="text-blue-400 text-sm">id <span className="text-red-400">*</span></div>
                      <div className="text-xs text-gray-500 mt-1">
                        Unique identifier for the test
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-900 bg-opacity-40 border border-green-700 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckSquare className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-green-300 font-medium">All required fields are mapped. Ready to proceed!</p>
                      <p className="text-green-400 text-sm">You can now proceed with the import process.</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
      
      {/* Mapping Wizard Modal */}
      {showMappingWizard && (
        <TestMappingWizard
          isOpen={showMappingWizard}
          onClose={() => setShowMappingWizard(false)}
          csvHeaders={csvHeaders}
          csvPreviewRows={csvPreviewRows}
          onComplete={handleMappingComplete}
          isDarkMode={true}
        />
      )}
      
      {/* Duplicates Modal */}
      {showDuplicatesModal && (
        <DuplicateTestModal
          isOpen={showDuplicatesModal}
          onClose={() => setShowDuplicatesModal(false)}
          duplicatesById={duplicateTests.duplicatesById}
          duplicatesByCptCode={duplicateTests.duplicatesByCptCode}
          onSkipAll={handleSkipAllDuplicates}
          onUpdateAll={handleUpdateAllDuplicates}
          onDecideEach={handleDecideEachDuplicate}
          isDarkMode={true}
        />
      )}
      
      {/* FHIR Export Tool */}
      {showFhirExportTool && (
        <FhirExportTool
          isOpen={showFhirExportTool}
          onClose={() => setShowFhirExportTool(false)}
          tests={selectedTests.size > 0 
            ? filteredTests.filter((test: Test) => selectedTests.has(test.id))
            : filteredTests
          }
          isDarkMode={true}
        />
      )}
      
      {/* Test Edit Modal */}
      {editingTest && (
        <TestEditModal
          test={editingTest}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleTestUpdate}
          isDarkMode={true}
        />
      )}
      
      {/* Test Add Modal */}
      <TestAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newTest) => {
          setIsAddModalOpen(false);
          toast({
            title: "Test Created",
            description: `Successfully created new test: ${newTest.name}`,
          });
          // Refresh the tests list
          queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
          queryClient.invalidateQueries({ queryKey: ['/api/test-count-by-category'] });
          queryClient.invalidateQueries({ queryKey: ['/api/test-count-by-subcategory'] });
        }}
        isDarkMode={true}
      />
      
      {/* Upload Progress Modal */}
      <UploadProgressModal
        isOpen={showUploadProgress}
        status={uploadStatus}
        isDarkMode={true}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog />
      
      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteConfirmDialog />
    </>
  );
}