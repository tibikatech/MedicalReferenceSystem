import React, { useState, useRef } from 'react';
import { Test } from '@shared/schema';
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
  FileCode
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import TestMappingWizard from "@/components/TestMappingWizard";
import DuplicateTestModal from "@/components/DuplicateTestModal";
import FhirExportTool from "@/components/FhirExportTool";
import TestEditModal from "@/components/TestEditModal";
import { 
  parseCSV, 
  readCSVFile, 
  previewCSV, 
  exportTestsToCSV 
} from "@/utils/csvImportExport";
import { downloadFhirExport } from "@/utils/fhirExporter";

export default function TestManagementPage() {
  const { toast } = useToast();
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  // FHIR export state
  const [showFhirExportTool, setShowFhirExportTool] = useState(false);
  
  // Test edit state
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  // Process the uploaded CSV file
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Preview the CSV file
      const { headers, previewRows } = await previewCSV(file, 5);
      
      // Store the data for the mapping wizard
      setCsvFile(file);
      setCsvHeaders(headers);
      setCsvPreviewRows(previewRows);
      
      // Show the mapping wizard
      setShowMappingWizard(true);
      
      toast({
        title: "CSV Uploaded",
        description: `File ${file.name} uploaded. Please map the columns.`,
      });
    } catch (error) {
      console.error('Error previewing CSV:', error);
      toast({
        title: "CSV Error",
        description: `Failed to read the file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
    
    // Reset the file input
    event.target.value = '';
  };
  
  // Handle mapping completion
  const handleMappingComplete = async (mapping: Record<string, string>) => {
    // Close the mapping wizard
    setShowMappingWizard(false);
    
    if (!csvFile) return;
    
    try {
      // Read the CSV file
      const csvContent = await readCSVFile(csvFile);
      const parsedData = parseCSV(csvContent);
      
      // Map CSV data to tests based on the mapping
      const importedTests = parsedData.map(row => {
        const test: Test = {
          id: mapping['id'] ? row[mapping['id']] : crypto.randomUUID(),
          name: mapping['name'] ? row[mapping['name']] : '',
          category: mapping['category'] ? row[mapping['category']] : '',
          subCategory: mapping['subCategory'] ? row[mapping['subCategory']] : '',
          cptCode: mapping['cptCode'] ? row[mapping['cptCode']] : null,
          loincCode: mapping['loincCode'] ? row[mapping['loincCode']] : null,
          snomedCode: mapping['snomedCode'] ? row[mapping['snomedCode']] : null,
          description: mapping['description'] ? row[mapping['description']] : null,
          notes: mapping['notes'] ? row[mapping['notes']] : null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return test;
      });
      
      // Check for duplicates
      const duplicatesById: Test[] = [];
      const duplicatesByCptCode: Test[] = [];
      
      // Get all existing tests
      const allTests = (tests as any)?.tests || [];
      
      // Check each imported test for duplicates
      importedTests.forEach(test => {
        // Check for ID duplication
        if (allTests.some((existingTest: Test) => existingTest.id === test.id)) {
          duplicatesById.push(test);
        }
        
        // Check for CPT code duplication (only if CPT code is present)
        if (test.cptCode && allTests.some(
          (existingTest: Test) => existingTest.cptCode === test.cptCode && existingTest.id !== test.id
        )) {
          duplicatesByCptCode.push(test);
        }
      });
      
      // Show duplicates modal if there are any duplicates
      if (duplicatesById.length > 0 || duplicatesByCptCode.length > 0) {
        setDuplicateTests({
          duplicatesById,
          duplicatesByCptCode
        });
        setShowDuplicatesModal(true);
      } else {
        // If no duplicates, proceed with import
        await importTests(importedTests);
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
  
  // Handle update all duplicates
  const handleUpdateAllDuplicates = async () => {
    setShowDuplicatesModal(false);
    
    if (!csvFile) return;
    
    try {
      // Read the CSV file
      const csvContent = await readCSVFile(csvFile);
      const parsedData = parseCSV(csvContent);
      
      // Convert to tests
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
      
      // Import all tests (will update duplicates)
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
  
  // Mock import function (would be an API call in a real app)
  const importTests = async (testsToImport: Test[]) => {
    // In a real app, this would be an API call
    toast({
      title: "CSV Import Complete",
      description: `Successfully imported ${testsToImport.length} tests.`,
    });
    
    // Refresh the test list
    queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
  };
  
  // Handle opening the edit modal for a test
  const handleEditTest = (test: Test) => {
    setEditingTest(test);
    setIsEditModalOpen(true);
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

  return (
    <>
      <Header onSearch={() => {}} />
      
      <main className="flex-grow bg-gray-900 text-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Test Management</h1>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => updateLoincCodesMutation.mutate()}
                disabled={updateLoincCodesMutation.isPending}
              >
                {updateLoincCodesMutation.isPending ? 'Updating...' : 'Update LOINC Codes'}
              </Button>
              <Button 
                variant="outline" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => updateSnomedCodesMutation.mutate()}
                disabled={updateSnomedCodesMutation.isPending}
              >
                {updateSnomedCodesMutation.isPending ? 'Updating...' : 'Update SNOMED Codes'}
              </Button>
              <Button 
                variant="outline" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => updateBothCodesMutation.mutate()}
                disabled={updateBothCodesMutation.isPending}
              >
                {updateBothCodesMutation.isPending ? 'Updating...' : 'Update Both'}
              </Button>
              <Button 
                variant="outline" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
                
                {/* Export to CSV */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col items-center">
                  <FileDown className="h-12 w-12 text-purple-500 mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Export Tests to CSV</h3>
                  <p className="text-sm text-gray-400 text-center mb-4">
                    Download all tests as a standard CSV file
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={exportTestsToCsv}
                  >
                    Export CSV
                  </Button>
                </div>
                
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
                >
                  Map Categories
                </Button>
              </div>
              
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
    </>
  );
}