import React, { useState, useEffect, useMemo } from 'react';
import { getAllTests } from '@/services/testService';
import { TestCategory, TestSubCategory, ImagingSubCategories, Test } from '@/types';
import { 
  exportTestsToFhir, 
  filterTestsByCategory, 
  filterTestsBySubcategory,
  createFhirBundle,
  testToFhirServiceRequest
} from '@/utils/fhirExporter';
import { getSubcategoriesForCategory } from '@/utils/categoryUtils';
import { 
  Download, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle,
  Info,
  Search,
  FileText,
  Layers,
  BarChart4,
  Package,
  Save,
  HelpCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface EnhancedFhirExportToolProps {
  isOpen: boolean;
  onClose: () => void;
  tests: Test[];
  isDarkMode?: boolean;
}

// FHIR Export Format Options
enum ExportFormat {
  INDIVIDUAL_RESOURCES = 'individual',
  BUNDLE = 'bundle'
}

const EnhancedFhirExportTool: React.FC<EnhancedFhirExportToolProps> = ({ 
  isOpen, 
  onClose, 
  tests, 
  isDarkMode = false 
}) => {
  // Active tab state
  const [activeTab, setActiveTab] = useState('select');
  
  // Selection state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [subcategorySearch, setSubcategorySearch] = useState('');
  
  // Export configuration state
  const [prettyPrint, setPrettyPrint] = useState<boolean>(true);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.BUNDLE);
  const [fileName, setFileName] = useState<string>(`medirefs-fhir-export-${new Date().toISOString().split('T')[0]}`);
  
  // Export process state
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [previewFhir, setPreviewFhir] = useState<string | null>(null);
  const [previewExplanation, setPreviewExplanation] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  
  // Get all available categories
  const categories = Object.values(TestCategory);
  
  // Get all available subcategories
  const allSubcategories = [
    ...Object.values(TestSubCategory),
    ...Object.values(ImagingSubCategories)
  ];
  
  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categories;
    return categories.filter(category => 
      category.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);
  
  // Filter subcategories based on selected categories and search
  const availableSubcategories = useMemo(() => {
    // First, filter by selected categories if any
    let subcategories = selectedCategories.length > 0
      ? selectedCategories.flatMap(category => getSubcategoriesForCategory(category))
      : allSubcategories;
    
    // Then filter by search term if any
    if (subcategorySearch) {
      subcategories = subcategories.filter(subcategory => 
        subcategory.toLowerCase().includes(subcategorySearch.toLowerCase())
      );
    }
    
    // Return unique subcategories
    return [...new Set(subcategories)];
  }, [selectedCategories, allSubcategories, subcategorySearch]);
  
  // Update selected subcategories when selected categories change
  useEffect(() => {
    if (selectedCategories.length === 0) {
      // Don't filter when no categories are selected
      return;
    }
    
    // Get currently available subcategories based on selected categories
    const currentlyAvailable = selectedCategories.flatMap(category => 
      getSubcategoriesForCategory(category)
    );
    const uniqueAvailable = [...new Set(currentlyAvailable)];
    
    // Keep only the subcategories that are still available
    setSelectedSubcategories(prevSelected => 
      prevSelected.filter(sub => uniqueAvailable.includes(sub))
    );
  }, [selectedCategories]);
  
  // Calculate filtered tests based on current selections
  const filteredTests = useMemo(() => {
    let filtered = tests;
    
    if (selectedCategories.length > 0) {
      filtered = filterTestsByCategory(filtered, selectedCategories);
    }
    
    if (selectedSubcategories.length > 0) {
      filtered = filterTestsBySubcategory(filtered, selectedSubcategories);
    }
    
    return filtered;
  }, [tests, selectedCategories, selectedSubcategories]);
  
  // Count tests per category
  const testCountByCategory = useMemo(() => {
    const countMap = new Map<string, number>();
    
    categories.forEach(category => {
      const count = tests.filter(test => test.category === category).length;
      countMap.set(category, count);
    });
    
    return countMap;
  }, [tests, categories]);
  
  // Count tests per subcategory
  const testCountBySubcategory = useMemo(() => {
    const countMap = new Map<string, number>();
    
    allSubcategories.forEach(subcategory => {
      const count = tests.filter(test => test.subCategory === subcategory).length;
      countMap.set(subcategory, count);
    });
    
    return countMap;
  }, [tests, allSubcategories]);
  
  // Calculate total selected tests count
  const selectedTestsCount = useMemo(() => {
    return filteredTests.length;
  }, [filteredTests]);
  
  // Handle category selection changes
  const handleCategoryChange = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  // Handle subcategory selection changes
  const handleSubcategoryChange = (subcategory: string) => {
    if (selectedSubcategories.includes(subcategory)) {
      setSelectedSubcategories(selectedSubcategories.filter(s => s !== subcategory));
    } else {
      setSelectedSubcategories([...selectedSubcategories, subcategory]);
    }
  };
  
  // Select or deselect all categories
  const toggleAllCategories = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...filteredCategories]);
    }
  };
  
  // Select or deselect all subcategories
  const toggleAllSubcategories = () => {
    if (selectedSubcategories.length === availableSubcategories.length) {
      setSelectedSubcategories([]);
    } else {
      setSelectedSubcategories([...availableSubcategories]);
    }
  };
  
  // Generate FHIR preview
  const generatePreview = async () => {
    setIsExporting(true);
    setExportStatus('Preparing FHIR data preview...');
    setExportProgress(30);
    
    try {
      if (filteredTests.length === 0) {
        setPreviewFhir(null);
        setExportStatus('No tests match the selected criteria.');
        setExportProgress(0);
        setIsExporting(false);
        return;
      }
      
      // Get a preview with at most 3 tests
      const previewTests = filteredTests.slice(0, 3);
      
      // Generate FHIR data based on selected format
      let fhirJson: string;
      
      if (exportFormat === ExportFormat.BUNDLE) {
        fhirJson = createFhirBundle(previewTests);
        setPreviewExplanation(
          "This preview shows a FHIR Bundle containing ServiceRequest resources. " +
          "A Bundle is a collection of resources that can be exchanged as a single unit. " +
          "Each ServiceRequest represents a medical test with its associated codes and metadata."
        );
      } else {
        fhirJson = exportTestsToFhir(previewTests, true);
        setPreviewExplanation(
          "This preview shows individual FHIR ServiceRequest resources. " +
          "Each ServiceRequest represents a medical test with its associated codes (CPT, LOINC, SNOMED) " +
          "and other metadata such as category and notes."
        );
      }
      
      setExportProgress(70);
      setPreviewFhir(fhirJson);
      setExportStatus(`Ready to export ${filteredTests.length} tests. Preview shows ${previewTests.length} tests.`);
      setExportProgress(100);
      
      // Switch to preview tab
      setActiveTab('preview');
    } catch (error) {
      console.error('Error generating FHIR preview:', error);
      setExportStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPreviewFhir(null);
      setExportProgress(0);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Export FHIR data to file
  const exportFhir = async () => {
    setIsExporting(true);
    setExportStatus('Exporting FHIR data...');
    setExportProgress(20);
    
    try {
      if (filteredTests.length === 0) {
        setExportStatus('No tests match the selected criteria.');
        setExportProgress(0);
        setIsExporting(false);
        return;
      }
      
      setExportProgress(40);
      
      // Generate FHIR data based on selected format
      let fhirJson: string;
      
      if (exportFormat === ExportFormat.BUNDLE) {
        fhirJson = createFhirBundle(filteredTests);
      } else {
        fhirJson = exportTestsToFhir(filteredTests, prettyPrint);
      }
      
      setExportProgress(70);
      
      // Create and download the file
      const blob = new Blob([fhirJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileName}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportProgress(100);
      setExportStatus(`Successfully exported ${filteredTests.length} tests to FHIR format.`);
      
      // Switch to export complete tab
      setActiveTab('export');
    } catch (error) {
      console.error('Error exporting FHIR data:', error);
      setExportStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setExportProgress(0);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Move to preview step after validation of selection
  const proceedToPreview = () => {
    if (filteredTests.length === 0) {
      setExportStatus('Please select at least one category or subcategory that contains tests.');
      return;
    }
    
    generatePreview();
  };
  
  // Reset the export tool
  const resetExport = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setPreviewFhir(null);
    setExportStatus(null);
    setActiveTab('select');
    setExportProgress(0);
  };
  
  // Color scheme classes based on dark mode
  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-800';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const primaryButtonClass = isDarkMode 
    ? 'bg-blue-700 hover:bg-blue-600 text-white' 
    : 'bg-blue-500 hover:bg-blue-600 text-white';
  const secondaryButtonClass = isDarkMode 
    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  const checkboxClass = isDarkMode 
    ? 'bg-gray-700 border-gray-600 text-blue-500' 
    : 'bg-white border-gray-300 text-blue-600';
  const codeClass = isDarkMode 
    ? 'bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-md' 
    : 'bg-gray-100 text-green-800 font-mono text-sm p-4 rounded-md';
  const infoClass = isDarkMode ? 'text-blue-400' : 'text-blue-600';
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`max-w-5xl w-full max-h-[90vh] overflow-auto ${bgClass} ${textClass} p-6 rounded-lg shadow-lg`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
            FHIR Export Tool
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="mb-6 w-full grid grid-cols-3">
            <TabsTrigger value="select" disabled={isExporting}>
              <div className="flex items-center">
                <span className="flex items-center justify-center w-6 h-6 rounded-full mr-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">1</span>
                Select Data
              </div>
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!previewFhir || isExporting}>
              <div className="flex items-center">
                <span className="flex items-center justify-center w-6 h-6 rounded-full mr-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">2</span>
                Preview FHIR
              </div>
            </TabsTrigger>
            <TabsTrigger value="export" disabled={!previewFhir || isExporting}>
              <div className="flex items-center">
                <span className="flex items-center justify-center w-6 h-6 rounded-full mr-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">3</span>
                Export
              </div>
            </TabsTrigger>
          </TabsList>
          
          {/* STEP 1: DATA SELECTION TAB */}
          <TabsContent value="select" className="space-y-6">
            {/* Summary Section */}
            <div className={`p-4 rounded-lg border ${borderClass} ${bgClass}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-1">Test Selection</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select categories and subcategories to include in your FHIR export
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{tests.length}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{selectedTestsCount}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Selected</div>
                  </div>
                  <div>
                    <Badge variant={selectedTestsCount > 0 ? "default" : "destructive"}>
                      {selectedTestsCount > 0 
                        ? `${Math.round((selectedTestsCount / tests.length) * 100)}% Selected` 
                        : "No Tests Selected"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Categories and Subcategories Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Categories */}
              <div className={`p-4 rounded-lg border ${borderClass} ${bgClass}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Categories</h4>
                  <button 
                    onClick={toggleAllCategories}
                    className={`text-xs px-2 py-1 rounded ${secondaryButtonClass}`}
                  >
                    {selectedCategories.length === filteredCategories.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div className="mb-3 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <div className="space-y-1 max-h-64 overflow-y-auto rounded-md border p-2">
                  {filteredCategories.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 p-2">
                      No categories match your search
                    </p>
                  ) : (
                    filteredCategories.map(category => (
                      <div key={category} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <div className="flex items-center">
                          <input 
                            type="checkbox"
                            id={`category-${category}`}
                            checked={selectedCategories.includes(category)}
                            onChange={() => handleCategoryChange(category)}
                            className={`mr-2 h-4 w-4 rounded ${checkboxClass}`}
                          />
                          <label htmlFor={`category-${category}`} className="text-sm">
                            {category}
                          </label>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="ml-2">
                                {testCountByCategory.get(category) || 0}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{testCountByCategory.get(category) || 0} tests in this category</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Subcategories */}
              <div className={`p-4 rounded-lg border ${borderClass} ${bgClass}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Subcategories</h4>
                  <button 
                    onClick={toggleAllSubcategories}
                    className={`text-xs px-2 py-1 rounded ${secondaryButtonClass}`}
                  >
                    {selectedSubcategories.length === availableSubcategories.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div className="mb-3 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    placeholder="Search subcategories..."
                    value={subcategorySearch}
                    onChange={(e) => setSubcategorySearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <div className="space-y-1 max-h-64 overflow-y-auto rounded-md border p-2">
                  {availableSubcategories.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 p-2">
                      {selectedCategories.length === 0 
                        ? 'Select categories to see available subcategories' 
                        : 'No subcategories match your criteria'}
                    </p>
                  ) : (
                    availableSubcategories.map(subcategory => (
                      <div key={subcategory} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <div className="flex items-center">
                          <input 
                            type="checkbox"
                            id={`subcategory-${subcategory}`}
                            checked={selectedSubcategories.includes(subcategory)}
                            onChange={() => handleSubcategoryChange(subcategory)}
                            className={`mr-2 h-4 w-4 rounded ${checkboxClass}`}
                          />
                          <label htmlFor={`subcategory-${subcategory}`} className="text-sm">
                            {subcategory}
                          </label>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="ml-2">
                                {testCountBySubcategory.get(subcategory) || 0}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{testCountBySubcategory.get(subcategory) || 0} tests in this subcategory</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Export format options */}
            <div className={`p-4 rounded-lg border ${borderClass} ${bgClass}`}>
              <h4 className="font-medium mb-4">Export Options</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">FHIR Format</label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="format-bundle"
                        name="export-format"
                        value={ExportFormat.BUNDLE}
                        checked={exportFormat === ExportFormat.BUNDLE}
                        onChange={() => setExportFormat(ExportFormat.BUNDLE)}
                        className={`mr-2 h-4 w-4 ${checkboxClass}`}
                      />
                      <label htmlFor="format-bundle" className="flex items-center">
                        <span>FHIR Bundle</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className={`ml-1 h-4 w-4 ${infoClass}`} />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">A FHIR Bundle is a collection of resources that can be exchanged as a single unit.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="format-resources"
                        name="export-format"
                        value={ExportFormat.INDIVIDUAL_RESOURCES}
                        checked={exportFormat === ExportFormat.INDIVIDUAL_RESOURCES}
                        onChange={() => setExportFormat(ExportFormat.INDIVIDUAL_RESOURCES)}
                        className={`mr-2 h-4 w-4 ${checkboxClass}`}
                      />
                      <label htmlFor="format-resources" className="flex items-center">
                        <span>Individual Resources</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className={`ml-1 h-4 w-4 ${infoClass}`} />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Export individual ServiceRequest resources as a JSON array.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">File Options</label>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="file-name" className="text-sm">File Name</label>
                      <Input
                        id="file-name"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="Enter file name without extension"
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input 
                        type="checkbox"
                        id="pretty-print"
                        checked={prettyPrint}
                        onChange={() => setPrettyPrint(!prettyPrint)}
                        className={`mr-2 h-4 w-4 rounded ${checkboxClass}`}
                      />
                      <label htmlFor="pretty-print" className="text-sm">
                        Pretty-print JSON (readable but larger file size)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end mt-6">
              <button
                onClick={proceedToPreview}
                disabled={isExporting || selectedTestsCount === 0}
                className={`px-4 py-2 rounded-md flex items-center ${primaryButtonClass} ${
                  (isExporting || selectedTestsCount === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isExporting ? (
                  <RefreshCw className="mr-2 animate-spin" size={18} />
                ) : (
                  <ChevronRight className="mr-2" size={18} />
                )}
                Next: Preview FHIR Data
              </button>
            </div>
            
            {exportStatus && (
              <div className={`mt-4 p-3 rounded-md ${
                exportStatus.includes('Error')
                  ? (isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800')
                  : (isDarkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800')
              }`}>
                {exportStatus}
              </div>
            )}
          </TabsContent>
          
          {/* STEP 2: PREVIEW TAB */}
          <TabsContent value="preview" className="space-y-6">
            {/* Export progress */}
            {isExporting && (
              <div className="mb-4">
                <p className="text-sm mb-2">{exportStatus}</p>
                <Progress value={exportProgress} className="h-2" />
              </div>
            )}
            
            {/* Preview Header */}
            <div className={`p-4 rounded-lg border ${borderClass} ${bgClass}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-1">FHIR Data Preview</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Preview of the FHIR data generated from your selected tests
                  </p>
                </div>
                <div className="flex items-center">
                  <Badge className="mr-2">
                    {exportFormat === ExportFormat.BUNDLE ? 'FHIR Bundle' : 'ServiceRequest Resources'}
                  </Badge>
                  <Badge variant="outline">
                    {selectedTestsCount} Tests Selected
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className={`p-4 rounded-lg border ${borderClass} ${bgClass}`}>
                  <h4 className="font-medium mb-4 flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    FHIR Preview
                    <Badge variant="outline" className="ml-2">
                      {previewFhir ? 'Showing first 3 tests' : 'No preview available'}
                    </Badge>
                  </h4>
                  
                  {previewFhir ? (
                    <pre className={`overflow-auto max-h-[400px] ${codeClass}`}>
                      {previewFhir}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
                      <p>Generate a preview to see FHIR data</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <div className={`p-4 rounded-lg border ${borderClass} ${bgClass}`}>
                  <h4 className="font-medium mb-4 flex items-center">
                    <HelpCircle className="mr-2 h-5 w-5" />
                    FHIR Resource Guide
                  </h4>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="resource-type">
                      <AccordionTrigger className="text-sm font-medium">
                        About ServiceRequest
                      </AccordionTrigger>
                      <AccordionContent className="text-xs space-y-2">
                        <p>
                          The ServiceRequest resource in FHIR represents a request for a procedure or 
                          diagnostic test to be performed.
                        </p>
                        <p>
                          In MediRefs, we map laboratory tests, imaging studies, and other medical 
                          procedures to ServiceRequest resources.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="data-mapping">
                      <AccordionTrigger className="text-sm font-medium">
                        Data Mapping
                      </AccordionTrigger>
                      <AccordionContent className="text-xs">
                        <ul className="space-y-1">
                          <li>• <strong>ID</strong>: Mapped to resource.id</li>
                          <li>• <strong>Name</strong>: Mapped to code.text and coding.display</li>
                          <li>• <strong>Category</strong>: Mapped to category.text</li>
                          <li>• <strong>Subcategory</strong>: Mapped to subcategory.text</li>
                          <li>• <strong>CPT Code</strong>: Mapped to code.coding with system = 'http://www.ama-assn.org/go/cpt'</li>
                          <li>• <strong>LOINC Code</strong>: Mapped to code.coding with system = 'http://loinc.org'</li>
                          <li>• <strong>SNOMED Code</strong>: Mapped to code.coding with system = 'http://snomed.info/sct'</li>
                          <li>• <strong>Notes/Description</strong>: Mapped to note.text</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="format-info">
                      <AccordionTrigger className="text-sm font-medium">
                        FHIR Format Types
                      </AccordionTrigger>
                      <AccordionContent className="text-xs space-y-2">
                        <p>
                          <strong>FHIR Bundle</strong>: A collection of resources wrapped in a Bundle 
                          resource. This is useful for exchanging multiple resources in a single 
                          transaction or message.
                        </p>
                        <p>
                          <strong>Individual Resources</strong>: A JSON array of individual 
                          ServiceRequest resources without a Bundle wrapper. This format is simpler 
                          but less compliant with FHIR exchange protocols.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="usage-info">
                      <AccordionTrigger className="text-sm font-medium">
                        How to Use FHIR Data
                      </AccordionTrigger>
                      <AccordionContent className="text-xs space-y-2">
                        <p>
                          The exported FHIR data can be:
                        </p>
                        <ul className="space-y-1">
                          <li>• Imported into FHIR-compliant Electronic Health Record (EHR) systems</li>
                          <li>• Used with FHIR-based API services</li>
                          <li>• Processed by healthcare integration engines</li>
                          <li>• Used for interoperability testing</li>
                          <li>• Shared with other healthcare providers or systems</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  {previewExplanation && (
                    <div className={`mt-4 p-3 rounded-md text-xs ${
                      isDarkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800'
                    }`}>
                      <div className="flex items-start">
                        <Info className="mr-2 shrink-0 h-4 w-4" />
                        <div>{previewExplanation}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setActiveTab('select')}
                disabled={isExporting}
                className={`px-4 py-2 rounded-md flex items-center ${secondaryButtonClass}`}
              >
                <ChevronLeft className="mr-2" size={18} />
                Back to Selection
              </button>
              
              <button
                onClick={exportFhir}
                disabled={isExporting}
                className={`px-4 py-2 rounded-md flex items-center ${primaryButtonClass}`}
              >
                {isExporting ? (
                  <RefreshCw className="mr-2 animate-spin" size={18} />
                ) : (
                  <Download className="mr-2" size={18} />
                )}
                Export FHIR Data
              </button>
            </div>
            
            {exportStatus && (
              <div className={`mt-4 p-3 rounded-md ${
                exportStatus.includes('Error')
                  ? (isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800')
                  : (isDarkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800')
              }`}>
                {exportStatus}
              </div>
            )}
          </TabsContent>
          
          {/* STEP 3: EXPORT COMPLETE TAB */}
          <TabsContent value="export" className="space-y-6">
            <div className={`p-6 rounded-lg border ${borderClass} ${bgClass} text-center`}>
              <div className="flex flex-col items-center space-y-4">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-green-900/40' : 'bg-green-100'
                }`}>
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                
                <h3 className="text-xl font-semibold">Export Complete!</h3>
                
                <p className="text-gray-500 dark:text-gray-400">
                  Your FHIR data has been successfully exported as {fileName}.json
                </p>
                
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-md text-sm w-full max-w-md flex items-center justify-between">
                  <span className="truncate">{fileName}.json</span>
                  <Badge>{selectedTestsCount} Tests</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mt-4">
                  <button
                    onClick={resetExport}
                    className={`px-4 py-2 rounded-md flex items-center justify-center ${secondaryButtonClass}`}
                  >
                    Create Another Export
                  </button>
                  
                  <button
                    onClick={onClose}
                    className={`px-4 py-2 rounded-md flex items-center justify-center ${primaryButtonClass}`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
            
            <div className={`p-6 rounded-lg border ${borderClass} ${bgClass}`}>
              <h3 className="text-lg font-medium mb-4">What's Next?</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center p-4 border border-dashed rounded-lg">
                  <Package className={`mb-3 ${infoClass}`} size={24} />
                  <h4 className="font-medium mb-1">Import to FHIR Server</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use your exported data with any FHIR-compliant server or EHR system
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center p-4 border border-dashed rounded-lg">
                  <Layers className={`mb-3 ${infoClass}`} size={24} />
                  <h4 className="font-medium mb-1">Data Integration</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Integrate with healthcare systems or analytics platforms
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center p-4 border border-dashed rounded-lg">
                  <BarChart4 className={`mb-3 ${infoClass}`} size={24} />
                  <h4 className="font-medium mb-1">Analysis & Reporting</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use standardized FHIR data for clinical analytics and reporting
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedFhirExportTool;