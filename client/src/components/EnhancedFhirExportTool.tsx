import React, { useState, useEffect } from 'react';
import { Test } from '@shared/schema';
import { 
  testToFhirServiceRequest, 
  createFhirBundle, 
  exportTestsToFhir, 
  getExportStatistics, 
  downloadFhirExport, 
  filterTestsByCategory, 
  filterTestsBySubcategory 
} from '@/utils/fhirExporter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Filter, 
  FileCode, 
  Download, 
  CheckSquare, 
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  Info,
  RefreshCw,
  CheckCircle,
  FileJson,
  HelpCircle,
  PlusCircle,
  Package,
  Layers,
  BarChart4,
  Microscope,
  Monitor
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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

enum ExportFormat {
  INDIVIDUAL_RESOURCES = 'individual',
  BUNDLE = 'bundle'
}

enum ExportMode {
  CLINICAL_WORKFLOW = 'clinical_workflow',  // ServiceRequest + ImagingStudy (enhanced)
  SIMPLIFIED = 'simplified',                // ServiceRequest only (legacy)
  CONSOLIDATED = 'consolidated'             // Single combined resource (new)
}

export default function EnhancedFhirExportTool({
  isOpen,
  onClose,
  tests,
  isDarkMode = false
}: EnhancedFhirExportToolProps) {
  // Active step state
  const [activeStep, setActiveStep] = useState<string>("select");
  
  // Selection state
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  
  // Export configuration state
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.BUNDLE);
  const [prettyPrint, setPrettyPrint] = useState<boolean>(true);
  const [useDualResourceExport, setUseDualResourceExport] = useState<boolean>(true);
  const [exportMode, setExportMode] = useState<ExportMode>(ExportMode.CLINICAL_WORKFLOW);
  
  // Phase 4: Smart Defaults - Context-aware recommendations
  const getRecommendedExportMode = (): ExportMode => {
    const imagingCount = tests.filter(test => test.category === "Imaging Studies").length;
    const labCount = tests.filter(test => test.category === "Laboratory Tests").length;
    
    // If mostly imaging studies, recommend clinical workflow
    if (imagingCount > labCount) {
      return ExportMode.CLINICAL_WORKFLOW;
    }
    
    // If mostly lab tests, simplified mode is fine
    if (labCount > imagingCount * 2) {
      return ExportMode.SIMPLIFIED;
    }
    
    // Default to clinical workflow for mixed or balanced datasets
    return ExportMode.CLINICAL_WORKFLOW;
  };
  
  const getExportModeRecommendation = (): string => {
    const imagingCount = tests.filter(test => test.category === "Imaging Studies").length;
    const labCount = tests.filter(test => test.category === "Laboratory Tests").length;
    
    if (imagingCount > labCount) {
      return "Clinical Workflow Mode recommended for imaging-heavy datasets to maintain FHIR R4 compliance.";
    }
    
    if (labCount > imagingCount * 2) {
      return "Simplified Mode suitable for lab-focused datasets where execution tracking isn't critical.";
    }
    
    return "Clinical Workflow Mode recommended for balanced datasets to ensure full interoperability.";
  };
  const [fileName, setFileName] = useState(`medirefs-fhir-export-${new Date().toISOString().split('T')[0]}`);
  
  // Preview state
  const [previewJson, setPreviewJson] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<boolean>(false);
  
  // Export process state
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Get unique categories and subcategories from tests
  const categories = [...new Set(tests.map(test => test.category))];
  const subcategories = [...new Set(tests.map(test => test.subCategory).filter(Boolean))];
  
  // Calculate category counts
  const categoryCountMap: Map<string, number> = new Map();
  categories.forEach(category => {
    const count = tests.filter(test => test.category === category).length;
    categoryCountMap.set(category, count);
  });
  
  // Calculate subcategory counts
  const subcategoryCountMap: Map<string, number> = new Map();
  subcategories.forEach(subcategory => {
    const count = tests.filter(test => test.subCategory === subcategory).length;
    subcategoryCountMap.set(subcategory, count);
  });
  
  // Filter tests based on selected tab and search query
  const filteredTests = tests.filter(test => {
    // Filter by tab selection
    if (selectedTab === "laboratory" && test.category !== "Laboratory Tests") {
      return false;
    }
    if (selectedTab === "imaging" && test.category !== "Imaging Studies") {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !testMatchesSearchQuery(test, searchQuery)) {
      return false;
    }
    
    // Filter by category
    if (categoryFilter && test.category !== categoryFilter) {
      return false;
    }
    
    // Filter by subcategory
    if (subcategoryFilter && test.subCategory !== subcategoryFilter) {
      return false;
    }
    
    return true;
  });
  
  // Sync export mode with dual resource toggle 
  useEffect(() => {
    if (exportMode === ExportMode.CLINICAL_WORKFLOW && !useDualResourceExport) {
      setUseDualResourceExport(true);
    } else if (exportMode !== ExportMode.CLINICAL_WORKFLOW && useDualResourceExport) {
      setUseDualResourceExport(false);
    }
  }, [exportMode, useDualResourceExport]);

  // Check if a test matches the search query
  const testMatchesSearchQuery = (test: Test, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    return (
      test.name.toLowerCase().includes(lowerQuery) ||
      test.category.toLowerCase().includes(lowerQuery) ||
      (test.subCategory?.toLowerCase().includes(lowerQuery) || false) ||
      (test.cptCode?.toLowerCase().includes(lowerQuery) || false) ||
      (test.loincCode?.toLowerCase().includes(lowerQuery) || false) ||
      (test.snomedCode?.toLowerCase().includes(lowerQuery) || false)
    );
  };
  
  // Handle select all change
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedTests(new Set(filteredTests.map(test => test.id)));
    } else {
      setSelectedTests(new Set());
    }
  };
  
  // Handle individual test selection
  const handleTestSelectionChange = (testId: string, checked: boolean) => {
    const newSelectedTests = new Set(selectedTests);
    if (checked) {
      newSelectedTests.add(testId);
    } else {
      newSelectedTests.delete(testId);
    }
    setSelectedTests(newSelectedTests);
    
    // Update selectAll state based on whether all filtered tests are selected
    setSelectAll(
      filteredTests.length > 0 &&
      filteredTests.every(test => newSelectedTests.has(test.id))
    );
  };
  
  // Generate FHIR preview - uses the actual FHIR utilities from utils/fhirExporter.ts
  const generatePreview = () => {
    if (selectedCount === 0) {
      setExportStatus("Please select at least one test to preview");
      return;
    }
    
    setIsGeneratingPreview(true);
    setExportProgress(30);
    
    // Use a try/catch block to handle any errors safely
    try {
      // Get the selected tests for preview (up to 3)
      const testsToPreview = filteredTests
        .filter(test => selectedTests.has(test.id))
        .slice(0, 3); // Take up to 3 tests for preview
      
      // Create a preview of the FHIR data
      let previewContent = '';
      
      // Use the enhanced FHIR export utility with dual resource support
      previewContent = exportTestsToFhir(testsToPreview, true, useDualResourceExport);
      
      // Update the UI state
      setPreviewJson(previewContent);
      setExportProgress(100);
      setActiveStep("preview");
    } catch (error) {
      console.error("Error generating preview:", error);
      setExportStatus(`Error generating preview: ${error instanceof Error ? error.message : "Unknown error"}`);
      setExportProgress(0);
    } finally {
      setIsGeneratingPreview(false);
    }
  };
  
  // Handle export using the downloadFhirExport utility
  const handleExport = () => {
    // Validate that we have tests to export
    if (selectedCount === 0) {
      setExportStatus("Please select at least one test to export");
      return;
    }
    
    // Set UI state to exporting
    setIsExporting(true);
    setExportProgress(25);
    
    // Use try/catch to safely handle any errors
    try {
      // Get the selected tests for export
      const testsToExport = filteredTests.filter(test => selectedTests.has(test.id));
      setExportProgress(50);
      
      // Use the enhanced downloadFhirExport utility with dual resource support
      downloadFhirExport(testsToExport, fileName, useDualResourceExport);
      
      // Update UI state to complete
      setExportProgress(100);
      setActiveStep("complete");
    } catch (error) {
      // Handle any errors during export
      console.error("Error exporting FHIR data:", error);
      setExportStatus(`Error exporting: ${error instanceof Error ? error.message : "Unknown error"}`);
      setExportProgress(0);
    } finally {
      // Always clean up even if there's an error
      setIsExporting(false);
    }
  };
  
  // Reset and start a new export
  const handleStartNew = () => {
    setActiveStep("select");
    setSelectedTests(new Set());
    setSelectAll(false);
    setSelectedTab("all");
    setCategoryFilter('');
    setSubcategoryFilter('');
    setSearchQuery('');
    setPreviewJson(null);
    setExportStatus(null);
    setExportProgress(0);
  };
  
  // Get the count of selected tests
  const selectedCount = filteredTests.filter(test => selectedTests.has(test.id)).length;

  // Get filtered categories based on search
  const filteredCategories = categoryFilter 
    ? categories.filter(c => c === categoryFilter)
    : categories.filter(c => !categoryFilter && c.toLowerCase().includes(searchQuery.toLowerCase()));
  
  // Get filtered subcategories based on search and category filter
  const filteredSubcategories = subcategoryFilter
    ? subcategories.filter(s => s === subcategoryFilter)
    : subcategories.filter(s => {
        if (subcategoryFilter) return false;
        if (categoryFilter) {
          const testsInCategory = tests.filter(t => t.category === categoryFilter);
          return testsInCategory.some(t => t.subCategory === s);
        }
        return s.toLowerCase().includes(searchQuery.toLowerCase());
      });
  
  // UI style classes based on dark mode
  const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const cardClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const secondaryBgClass = isDarkMode ? 'bg-gray-800' : 'bg-gray-50';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-800';
  const mutedTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const jsonBgClass = isDarkMode ? 'bg-gray-950' : 'bg-gray-100';
  const jsonTextClass = isDarkMode ? 'text-green-400' : 'text-green-800';
  const primaryBtnClass = isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : '';
  const secondaryBtnClass = isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : '';
  const highlightClass = isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-5xl ${bgClass} ${textClass} max-h-[90vh] overflow-y-auto`}
      >
        <DialogHeader>
          <DialogTitle className={`text-xl ${isDarkMode ? 'text-white' : ''}`}>
            Export Tests to FHIR Format
          </DialogTitle>
          <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Convert your medical test data to standardized FHIR resources for healthcare interoperability.
          </DialogDescription>
        </DialogHeader>
        
        {/* Step indicator */}
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <div 
              className={`flex items-center justify-center w-8 h-8 ${
                activeStep === "select" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              } rounded-full`}
            >
              1
            </div>
            <div className={`flex-1 h-1 ${activeStep === "select" ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}></div>
            <div 
              className={`flex items-center justify-center w-8 h-8 ${
                activeStep === "preview" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              } rounded-full`}
            >
              2
            </div>
            <div className={`flex-1 h-1 ${activeStep === "complete" ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}></div>
            <div 
              className={`flex items-center justify-center w-8 h-8 ${
                activeStep === "complete" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              } rounded-full`}
            >
              3
            </div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className={activeStep === "select" ? "text-blue-600 dark:text-blue-400 font-medium" : mutedTextClass}>Select Tests</span>
            <span className={activeStep === "preview" ? "text-blue-600 dark:text-blue-400 font-medium" : mutedTextClass}>Preview</span>
            <span className={activeStep === "complete" ? "text-blue-600 dark:text-blue-400 font-medium" : mutedTextClass}>Export</span>
          </div>
        </div>
        
        {/* Progress indicator during processing */}
        {(isGeneratingPreview || isExporting) && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className={mutedTextClass}>
                {isGeneratingPreview ? "Generating preview..." : "Exporting FHIR data..."}
              </span>
              <span className={mutedTextClass}>{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
          </div>
        )}
        
        {/* STEP 1: SELECT */}
        {activeStep === "select" && (
          <div className="space-y-6 py-2">
            {/* Test selection summary with enhanced FHIR statistics */}
            <div className={`p-4 rounded-lg border ${borderClass}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Test Selection & FHIR Resource Preview</h3>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Select which tests to include in your FHIR export
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <span className="text-xl font-semibold">{tests.length}</span>
                    <p className={`text-xs ${mutedTextClass}`}>Total Tests</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">{selectedCount}</span>
                    <p className={`text-xs ${mutedTextClass}`}>Selected</p>
                  </div>
                  {selectedCount > 0 && (() => {
                    const selectedTestsData = filteredTests.filter(test => selectedTests.has(test.id));
                    const stats = getExportStatistics(selectedTestsData);
                    return (
                      <>
                        <div className="text-center">
                          <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                            {useDualResourceExport ? stats.totalResources : stats.serviceRequests}
                          </span>
                          <p className={`text-xs ${mutedTextClass}`}>FHIR Resources</p>
                        </div>
                        {useDualResourceExport && stats.imagingStudyResources > 0 && (
                          <div className="text-center">
                            <span className="text-lg font-medium text-purple-600 dark:text-purple-400">
                              {stats.imagingStudyResources}
                            </span>
                            <p className={`text-xs ${mutedTextClass}`}>ImagingStudy</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              {selectedCount > 0 && useDualResourceExport && (() => {
                const selectedTestsData = filteredTests.filter(test => selectedTests.has(test.id));
                const stats = getExportStatistics(selectedTestsData);
                return (
                  <div className={`mt-3 pt-3 border-t ${borderClass}`}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                      <div>
                        <span className="text-sm font-medium">{stats.serviceRequests}</span>
                        <p className={`text-xs ${mutedTextClass}`}>ServiceRequest</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{stats.imagingStudyResources}</span>
                        <p className={`text-xs ${mutedTextClass}`}>ImagingStudy</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{stats.labTests}</span>
                        <p className={`text-xs ${mutedTextClass}`}>Lab Tests</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{stats.imagingStudies}</span>
                        <p className={`text-xs ${mutedTextClass}`}>Imaging Studies</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <Tabs defaultValue="all" onValueChange={setSelectedTab}>
              <div className="flex items-center space-x-4 mb-4">
                <TabsList className={isDarkMode ? 'bg-gray-800' : ''}>
                  <TabsTrigger 
                    value="all"
                    className={isDarkMode ? 'data-[state=active]:bg-gray-700 text-white' : ''}
                  >
                    All Tests
                  </TabsTrigger>
                  <TabsTrigger 
                    value="laboratory"
                    className={isDarkMode ? 'data-[state=active]:bg-gray-700 text-white' : ''}
                  >
                    Laboratory Tests
                  </TabsTrigger>
                  <TabsTrigger 
                    value="imaging"
                    className={isDarkMode ? 'data-[state=active]:bg-gray-700 text-white' : ''}
                  >
                    Imaging Studies
                  </TabsTrigger>
                </TabsList>
                
                <div className="relative flex-1">
                  <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${mutedTextClass}`} />
                  <Input
                    className={`pl-10 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
                    placeholder="Search tests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mb-4 flex items-center">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAllChange}
                    className={isDarkMode ? 'border-gray-600' : ''}
                  />
                  <Label 
                    htmlFor="select-all"
                    className={isDarkMode ? 'text-gray-300' : ''}
                  >
                    Select All
                  </Label>
                </div>
                
                <div className="ml-4">
                  <Badge className={isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}>
                    {selectedCount} selected
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Categories filter panel */}
                <Card className={`p-3 ${cardClass} col-span-1`}>
                  <h3 className="font-medium mb-2 flex items-center">
                    Categories
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-2 text-blue-600 dark:text-blue-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Categories are clickable - click to filter by category</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h3>
                  <div className="space-y-2">
                    {categoryFilter && (
                      <div className="mb-2">
                        <Badge 
                          className="flex items-center cursor-pointer"
                          onClick={() => setCategoryFilter('')}
                        >
                          {categoryFilter} <span className="ml-1">×</span>
                        </Badge>
                      </div>
                    )}
                    <ScrollArea className="h-[200px] pr-3">
                      {filteredCategories.map(category => (
                        <div 
                          key={category}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer
                            border border-gray-600 hover:bg-blue-800/30 transition-colors
                            ${categoryFilter === category ? 'bg-blue-800/50 border-blue-500' : ''}
                          `}
                          onClick={() => setCategoryFilter(categoryFilter === category ? '' : category)}
                        >
                          <span className="text-sm flex items-center">
                            {category}
                            {/* Visual indicator that it's clickable */}
                            <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0">
                              <PlusCircle className="h-3 w-3" />
                            </Button>
                          </span>
                          <Badge variant="outline" className={categoryFilter === category ? 'bg-blue-800/50 border-blue-500' : ''}>
                            {categoryCountMap.get(category) || 0}
                          </Badge>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </Card>
                
                {/* Subcategories filter panel */}
                <Card className={`p-3 ${cardClass} col-span-1`}>
                  <h3 className="font-medium mb-2 flex items-center">
                    Subcategories
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-2 text-blue-600 dark:text-blue-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Subcategories are clickable - click to filter by subcategory</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h3>
                  <div className="space-y-2">
                    {subcategoryFilter && (
                      <div className="mb-2">
                        <Badge 
                          className="flex items-center cursor-pointer"
                          onClick={() => setSubcategoryFilter('')}
                        >
                          {subcategoryFilter} <span className="ml-1">×</span>
                        </Badge>
                      </div>
                    )}
                    <ScrollArea className="h-[200px] pr-3">
                      {filteredSubcategories.map(subcategory => (
                        <div 
                          key={subcategory}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer
                            border border-gray-600 hover:bg-blue-800/30 transition-colors
                            ${subcategoryFilter === subcategory ? 'bg-blue-800/50 border-blue-500' : ''}
                          `}
                          onClick={() => setSubcategoryFilter(subcategoryFilter === subcategory ? '' : subcategory)}
                        >
                          <span className="text-sm flex items-center">
                            {subcategory}
                            {/* Visual indicator that it's clickable */}
                            <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0">
                              <PlusCircle className="h-3 w-3" />
                            </Button>
                          </span>
                          <Badge variant="outline" className={subcategoryFilter === subcategory ? 'bg-blue-800/50 border-blue-500' : ''}>
                            {subcategoryCountMap.get(subcategory) || 0}
                          </Badge>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </Card>
                
                {/* Test selection stats */}
                <Card className={`p-3 ${cardClass} col-span-1`}>
                  <h3 className="font-medium mb-2">Export Format</h3>
                  <div className="space-y-4">
                    <RadioGroup 
                      defaultValue={ExportFormat.BUNDLE} 
                      onValueChange={(value) => setExportFormat(value as ExportFormat)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={ExportFormat.BUNDLE} id="format-bundle" />
                        <div>
                          <Label htmlFor="format-bundle" className="font-medium">FHIR Bundle</Label>
                          <p className={`text-xs ${mutedTextClass}`}>Group tests in a collection</p>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">A FHIR Bundle is a container for a collection of resources. This is the recommended format for interoperability.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={ExportFormat.INDIVIDUAL_RESOURCES} id="format-individual" />
                        <div>
                          <Label htmlFor="format-individual" className="font-medium">Individual Resources</Label>
                          <p className={`text-xs ${mutedTextClass}`}>Export as separate resources</p>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Exports tests as individual ServiceRequest resources without a Bundle wrapper.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </RadioGroup>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="pretty-print" 
                        checked={prettyPrint} 
                        onCheckedChange={(checked) => setPrettyPrint(!!checked)}
                        className={isDarkMode ? 'border-gray-600' : ''}
                      />
                      <div>
                        <Label htmlFor="pretty-print" className="font-medium">Pretty-print JSON</Label>
                        <p className={`text-xs ${mutedTextClass}`}>More readable but larger file size</p>
                      </div>
                    </div>
                    
                    {/* Export Mode Selection - Phase 2 & 4 Implementation */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium text-sm">Export Mode</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">{getExportModeRecommendation()}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      {/* Smart Recommendations - Phase 4 */}
                      {getRecommendedExportMode() !== exportMode && (
                        <div className={`p-3 rounded-md border ${isDarkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                          <div className="flex items-start space-x-2">
                            <Info className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400" />
                            <div className="flex-1">
                              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">Smart Recommendation</p>
                              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                {getExportModeRecommendation()}
                              </p>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2 h-6 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50"
                                onClick={() => setExportMode(getRecommendedExportMode())}
                              >
                                Use Recommended Mode
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      <RadioGroup 
                        value={exportMode} 
                        onValueChange={(value) => {
                          setExportMode(value as ExportMode);
                          // Sync with dual resource export toggle
                          setUseDualResourceExport(value === ExportMode.CLINICAL_WORKFLOW);
                        }}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-3 p-3 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                          <RadioGroupItem value={ExportMode.CLINICAL_WORKFLOW} id="mode-clinical" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="mode-clinical" className="font-medium text-green-800 dark:text-green-300">
                              Clinical Workflow Mode
                              <Badge variant="outline" className="ml-2 text-xs bg-green-100 dark:bg-green-800">Recommended</Badge>
                            </Label>
                            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                              Full FHIR R4 compliance: ServiceRequest (order) + ImagingStudy (results) for imaging studies. 
                              Represents complete healthcare workflow from order to execution.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3 p-3 rounded-md border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                          <RadioGroupItem value={ExportMode.SIMPLIFIED} id="mode-simplified" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="mode-simplified" className="font-medium text-orange-800 dark:text-orange-300">
                              Simplified Mode
                              <Badge variant="outline" className="ml-2 text-xs">Legacy</Badge>
                            </Label>
                            <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                              ServiceRequest resources only. Simpler structure but not fully FHIR R4 compliant for imaging workflows.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3 p-3 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                          <RadioGroupItem value={ExportMode.CONSOLIDATED} id="mode-consolidated" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="mode-consolidated" className="font-medium text-blue-800 dark:text-blue-300">
                              Consolidated Mode
                              <Badge variant="outline" className="ml-2 text-xs">Coming Soon</Badge>
                            </Label>
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                              Single resource combining order and execution details. Less compliant but simpler for basic analytics.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div>
                      <Label htmlFor="file-name" className="mb-1 font-medium">File name</Label>
                      <div className="flex items-center">
                        <Input
                          id="file-name"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
                        />
                        <span className={`ml-2 ${mutedTextClass}`}>.json</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              
              <TabsContent value="all" className="mt-0">
                <Card className={cardClass}>
                  <ScrollArea className="h-[300px]">
                    {filteredTests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-4">
                        <p className={`text-center ${mutedTextClass}`}>
                          No tests found matching your criteria.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 space-y-3">
                        {filteredTests.map(test => (
                          <div 
                            key={test.id}
                            className={`p-3 rounded-lg border ${borderClass} hover:${secondaryBgClass}`}
                          >
                            <div className="flex items-start">
                              <div className="pt-0.5">
                                <Checkbox 
                                  id={`test-${test.id}`}
                                  checked={selectedTests.has(test.id)}
                                  onCheckedChange={(checked) => handleTestSelectionChange(test.id, !!checked)}
                                  className={isDarkMode ? 'border-gray-600' : ''}
                                />
                              </div>
                              <div className="ml-3 flex-1">
                                <Label 
                                  htmlFor={`test-${test.id}`}
                                  className={`font-medium ${isDarkMode ? 'text-white' : ''}`}
                                >
                                  {test.name}
                                </Label>
                                <div className="flex flex-wrap mt-1 gap-2">
                                  <Badge className={isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}>
                                    {test.category}
                                  </Badge>
                                  {test.subCategory && (
                                    <Badge className={isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}>
                                      {test.subCategory}
                                    </Badge>
                                  )}
                                  {test.cptCode && (
                                    <Badge className={isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800'}>
                                      CPT: {test.cptCode}
                                    </Badge>
                                  )}
                                  {test.loincCode && (
                                    <Badge className={isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}>
                                      LOINC: {test.loincCode}
                                    </Badge>
                                  )}
                                  {test.snomedCode && (
                                    <Badge className={isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}>
                                      SNOMED: {test.snomedCode}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              </TabsContent>
              
              <TabsContent value="laboratory" className="mt-0">
                <Card className={cardClass}>
                  <ScrollArea className="h-[300px]">
                    {filteredTests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-4">
                        <p className={`text-center ${mutedTextClass}`}>
                          No laboratory tests found matching your criteria.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 space-y-3">
                        {filteredTests.map(test => (
                          <div 
                            key={test.id}
                            className={`p-3 rounded-lg border ${borderClass} hover:${secondaryBgClass}`}
                          >
                            <div className="flex items-start">
                              <div className="pt-0.5">
                                <Checkbox 
                                  id={`lab-${test.id}`}
                                  checked={selectedTests.has(test.id)}
                                  onCheckedChange={(checked) => handleTestSelectionChange(test.id, !!checked)}
                                  className={isDarkMode ? 'border-gray-600' : ''}
                                />
                              </div>
                              <div className="ml-3 flex-1">
                                <Label 
                                  htmlFor={`lab-${test.id}`}
                                  className={`font-medium ${isDarkMode ? 'text-white' : ''}`}
                                >
                                  {test.name}
                                </Label>
                                <div className="flex flex-wrap mt-1 gap-2">
                                  <Badge className={isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}>
                                    {test.category}
                                  </Badge>
                                  {test.subCategory && (
                                    <Badge className={isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}>
                                      {test.subCategory}
                                    </Badge>
                                  )}
                                  {test.cptCode && (
                                    <Badge className={isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800'}>
                                      CPT: {test.cptCode}
                                    </Badge>
                                  )}
                                  {test.loincCode && (
                                    <Badge className={isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}>
                                      LOINC: {test.loincCode}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              </TabsContent>
              
              <TabsContent value="imaging" className="mt-0">
                <Card className={cardClass}>
                  <ScrollArea className="h-[300px]">
                    {filteredTests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-4">
                        <p className={`text-center ${mutedTextClass}`}>
                          No imaging studies found matching your criteria.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 space-y-3">
                        {filteredTests.map(test => (
                          <div 
                            key={test.id}
                            className={`p-3 rounded-lg border ${borderClass} hover:${secondaryBgClass}`}
                          >
                            <div className="flex items-start">
                              <div className="pt-0.5">
                                <Checkbox 
                                  id={`img-${test.id}`}
                                  checked={selectedTests.has(test.id)}
                                  onCheckedChange={(checked) => handleTestSelectionChange(test.id, !!checked)}
                                  className={isDarkMode ? 'border-gray-600' : ''}
                                />
                              </div>
                              <div className="ml-3 flex-1">
                                <Label 
                                  htmlFor={`img-${test.id}`}
                                  className={`font-medium ${isDarkMode ? 'text-white' : ''}`}
                                >
                                  {test.name}
                                </Label>
                                <div className="flex flex-wrap mt-1 gap-2">
                                  <Badge className={isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}>
                                    {test.category}
                                  </Badge>
                                  {test.subCategory && (
                                    <Badge className={isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}>
                                      {test.subCategory}
                                    </Badge>
                                  )}
                                  {test.cptCode && (
                                    <Badge className={isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800'}>
                                      CPT: {test.cptCode}
                                    </Badge>
                                  )}
                                  {test.snomedCode && (
                                    <Badge className={isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}>
                                      SNOMED: {test.snomedCode}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* STEP 2: PREVIEW */}
        {activeStep === "preview" && (
          <div className="space-y-6 py-2">
            {/* Resource Type Planning Section */}
            <div className={`p-4 rounded-lg border ${borderClass}`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-medium">FHIR Resource Planning</h3>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Review what FHIR resources will be generated for your selected tests
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={exportFormat === ExportFormat.BUNDLE ? "default" : "outline"}>
                    {exportFormat === ExportFormat.BUNDLE ? "FHIR Bundle" : "Individual Resources"}
                  </Badge>
                  <Badge>
                    {selectedCount} Tests Selected
                  </Badge>
                </div>
              </div>
              
              {selectedCount > 0 && (() => {
                const selectedTestsData = filteredTests.filter(test => selectedTests.has(test.id));
                const stats = getExportStatistics(selectedTestsData);
                const imagingTests = selectedTestsData.filter(test => test.category === "Imaging Studies");
                const labTests = selectedTestsData.filter(test => test.category !== "Imaging Studies");
                
                return (
                  <div className="space-y-4">
                    {/* Resource Generation Summary */}
                    <div className={`p-3 rounded-md ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                      <h4 className="font-medium mb-2 flex items-center">
                        <Layers className="mr-2 h-4 w-4" />
                        Resource Generation Plan
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {stats.serviceRequests}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">ServiceRequest</div>
                          <div className="text-xs text-gray-500">All tests get this</div>
                        </div>
                        
                        {useDualResourceExport && (
                          <div className="text-center">
                            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                              {stats.imagingStudyResources}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">ImagingStudy</div>
                            <div className="text-xs text-gray-500">Imaging studies only</div>
                          </div>
                        )}
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                            {useDualResourceExport ? stats.totalResources : stats.serviceRequests}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Total Resources</div>
                          <div className="text-xs text-gray-500">Final export count</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                            {exportFormat === ExportFormat.BUNDLE ? '1' : (useDualResourceExport ? stats.totalResources : stats.serviceRequests)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {exportFormat === ExportFormat.BUNDLE ? 'Bundle' : 'Files'}
                          </div>
                          <div className="text-xs text-gray-500">Output structure</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Test Type Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Laboratory Tests */}
                      {labTests.length > 0 && (
                        <div className={`p-3 rounded-md border ${borderClass}`}>
                          <h5 className="font-medium mb-2 flex items-center">
                            <Microscope className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                            Laboratory Tests ({labTests.length})
                          </h5>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Resource Type:</span>
                              <Badge variant="outline" className="text-xs">ServiceRequest only</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Total Resources:</span>
                              <span className="font-medium">{labTests.length}</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Each lab test becomes one ServiceRequest resource representing the test order.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Imaging Studies */}
                      {imagingTests.length > 0 && (
                        <div className={`p-3 rounded-md border ${borderClass}`}>
                          <h5 className="font-medium mb-2 flex items-center">
                            <Monitor className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                            Imaging Studies ({imagingTests.length})
                          </h5>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Resource Type:</span>
                              <Badge variant="outline" className="text-xs">
                                {useDualResourceExport ? 'ServiceRequest + ImagingStudy' : 'ServiceRequest only'}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Total Resources:</span>
                              <span className="font-medium">
                                {useDualResourceExport ? imagingTests.length * 2 : imagingTests.length}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {exportMode === ExportMode.CLINICAL_WORKFLOW 
                                ? 'Each imaging study creates two linked resources: ServiceRequest (doctor\'s order) + ImagingStudy (execution results).'
                                : exportMode === ExportMode.SIMPLIFIED
                                ? 'Each imaging study creates one ServiceRequest resource only (legacy mode - not fully FHIR R4 compliant).'
                                : 'Each imaging study creates one combined resource (coming soon).'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Healthcare Workflow Diagram - Enhanced for Phase 3 */}
                    {imagingTests.length > 0 && (
                      <div className={`p-4 rounded-md border ${
                        exportMode === ExportMode.CLINICAL_WORKFLOW 
                          ? 'bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' 
                          : exportMode === ExportMode.SIMPLIFIED 
                          ? 'bg-orange-900/20 border-orange-200 dark:border-orange-800'
                          : 'bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}>
                        <h6 className={`font-medium mb-3 flex items-center ${
                          exportMode === ExportMode.CLINICAL_WORKFLOW 
                            ? 'text-indigo-800 dark:text-indigo-300' 
                            : exportMode === ExportMode.SIMPLIFIED 
                            ? 'text-orange-800 dark:text-orange-300'
                            : 'text-blue-800 dark:text-blue-300'
                        }`}>
                          <ArrowDown className="h-4 w-4 mr-2" />
                          {exportMode === ExportMode.CLINICAL_WORKFLOW 
                            ? 'Clinical Workflow: Order → Execution → Results'
                            : exportMode === ExportMode.SIMPLIFIED
                            ? 'Simplified Export: Order Only'
                            : 'Consolidated Export: Combined Resource (Coming Soon)'}
                        </h6>
                        
                        {exportMode === ExportMode.CLINICAL_WORKFLOW && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div className="text-sm">
                                <span className="font-medium text-blue-700 dark:text-blue-300">ServiceRequest</span>
                                <span className={`ml-2 ${mutedTextClass}`}>(status: "completed")</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">Doctor orders imaging study</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <div className="text-sm">
                                <span className="font-medium text-purple-700 dark:text-purple-300">ImagingStudy</span>
                                <span className={`ml-2 ${mutedTextClass}`}>(status: "available")</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">Study performed, results ready</span>
                            </div>
                            <div className={`mt-3 p-2 rounded ${isDarkMode ? 'bg-indigo-800/30' : 'bg-indigo-100'}`}>
                              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                <strong>Resource Naming:</strong> ServiceRequest IDs end with "-order", ImagingStudy IDs end with "-study"
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {exportMode === ExportMode.SIMPLIFIED && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <div className="text-sm">
                                <span className="font-medium text-orange-700 dark:text-orange-300">ServiceRequest</span>
                                <span className={`ml-2 ${mutedTextClass}`}>(status: "active")</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">Order only (no execution tracking)</span>
                            </div>
                            <div className={`mt-3 p-2 rounded ${isDarkMode ? 'bg-orange-800/30' : 'bg-orange-100'}`}>
                              <p className="text-xs text-orange-700 dark:text-orange-300">
                                <strong>Legacy Mode:</strong> Uses original test ID without suffixes
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {exportMode === ExportMode.CONSOLIDATED && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div className="text-sm">
                                <span className="font-medium text-blue-700 dark:text-blue-300">CombinedRequest</span>
                                <span className={`ml-2 ${mutedTextClass}`}>(custom format)</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">Order + execution in single resource</span>
                            </div>
                            <div className={`mt-3 p-2 rounded ${isDarkMode ? 'bg-blue-800/30' : 'bg-blue-100'}`}>
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                <strong>Coming Soon:</strong> Combined resource for simplified analytics
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* FHIR Compliance Notice */}
                    {imagingTests.length > 0 && (
                      <div className={`p-3 rounded-md ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'} border border-green-200 dark:border-green-800`}>
                        <div className="flex items-start">
                          <Info className="h-4 w-4 mr-2 mt-0.5 text-green-600 dark:text-green-400" />
                          <div>
                            <h6 className="font-medium text-green-800 dark:text-green-300">FHIR R4 Compliance</h6>
                            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                              {useDualResourceExport 
                                ? 'Enhanced export mode creates both ServiceRequest (order) and ImagingStudy (results) resources for imaging studies, representing the complete healthcare workflow from order placement to result availability.'
                                : 'Legacy export mode creates only ServiceRequest resources. Enable Enhanced FHIR Export for full R4 compliance with imaging workflows.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* FHIR JSON Preview */}
              <div className="lg:col-span-2">
                <Card className={`p-3 ${cardClass}`}>
                  <h3 className="font-medium mb-2 flex items-center">
                    <FileJson className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                    FHIR JSON Preview
                    <Badge variant="outline" className="ml-2">
                      Showing first 3 tests
                    </Badge>
                  </h3>
                  
                  <ScrollArea className={`h-[400px] ${jsonBgClass} p-4 rounded-md font-mono text-sm ${jsonTextClass}`}>
                    {previewJson ? (
                      <pre>{previewJson}</pre>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className={mutedTextClass}>No preview available</p>
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              </div>
              
              {/* FHIR Resource Guide */}
              <div className="lg:col-span-1">
                <Card className={`p-3 ${cardClass}`}>
                  <h3 className="font-medium mb-3 flex items-center">
                    <HelpCircle className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                    FHIR Resource Guide
                  </h3>
                  
                  <Accordion type="single" collapsible>
                    <AccordionItem value="resource-explanation">
                      <AccordionTrigger className="text-sm">
                        Understanding Dual Resources
                      </AccordionTrigger>
                      <AccordionContent className={`text-sm ${mutedTextClass}`}>
                        <div className="space-y-3">
                          <div>
                            <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">ServiceRequest (The Order)</p>
                            <ul className="text-xs space-y-1 ml-3">
                              <li>• Represents the doctor's order for a test/procedure</li>
                              <li>• Status "completed" = the order was fulfilled</li>
                              <li>• Intent "original-order" = initial physician request</li>
                              <li>• All tests get this resource</li>
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-purple-700 dark:text-purple-300 mb-1">ImagingStudy (The Results)</p>
                            <ul className="text-xs space-y-1 ml-3">
                              <li>• Represents the execution and results of imaging</li>
                              <li>• Status "available" = study results are ready</li>
                              <li>• Contains technical details (modality, body site)</li>
                              <li>• Only imaging studies get this resource</li>
                            </ul>
                          </div>
                          <div className={`p-2 rounded-md ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                            <p className="text-xs font-medium">Why two resources for imaging?</p>
                            <p className="text-xs mt-1">Healthcare workflows require tracking both the order (what was requested) and the execution (what was performed). Lab tests typically only need the order since the result is the lab value itself.</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="resource-relationships">
                      <AccordionTrigger className="text-sm">
                        Resource Relationships
                      </AccordionTrigger>
                      <AccordionContent className={`text-sm ${mutedTextClass}`}>
                        <div className="space-y-2">
                          <div>
                            <p className="font-medium mb-1">Cross-References</p>
                            <ul className="text-xs space-y-1 ml-3">
                              <li>• ServiceRequest → <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">supportingInfo</code> → points to ImagingStudy</li>
                              <li>• ImagingStudy → <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">basedOn</code> → points back to ServiceRequest</li>
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Naming Convention</p>
                            <ul className="text-xs space-y-1 ml-3">
                              <li>• ServiceRequest: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">TTES-IMG-FLU-76080a-order</code></li>
                              <li>• ImagingStudy: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">TTES-IMG-FLU-76080a-study</code></li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="export-modes">
                      <AccordionTrigger className="text-sm">
                        Export Mode Guide
                      </AccordionTrigger>
                      <AccordionContent className={`text-sm ${mutedTextClass}`}>
                        <div className="space-y-3">
                          <div>
                            <p className="font-medium text-green-700 dark:text-green-300 mb-1">
                              🏥 Clinical Workflow Mode (Recommended)
                            </p>
                            <ul className="text-xs space-y-1 ml-3">
                              <li>• Full FHIR R4 compliance for healthcare systems</li>
                              <li>• Imaging studies get dual resources (ServiceRequest + ImagingStudy)</li>
                              <li>• Represents complete order-to-results workflow</li>
                              <li>• Ideal for EHR integration and healthcare interoperability</li>
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-orange-700 dark:text-orange-300 mb-1">
                              🔧 Simplified Mode (Legacy)
                            </p>
                            <ul className="text-xs space-y-1 ml-3">
                              <li>• ServiceRequest resources only</li>
                              <li>• Smaller file sizes and simpler structure</li>
                              <li>• Good for data analysis and research</li>
                              <li>• Missing imaging execution details</li>
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                              🔄 Consolidated Mode (Coming Soon)
                            </p>
                            <ul className="text-xs space-y-1 ml-3">
                              <li>• Single resource combining order + execution</li>
                              <li>• Simplified for basic analytics use cases</li>
                              <li>• Custom format (not standard FHIR)</li>
                              <li>• Best for internal reporting systems</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="coding-systems">
                      <AccordionTrigger className="text-sm">
                        Coding Systems
                      </AccordionTrigger>
                      <AccordionContent className={`text-sm ${mutedTextClass}`}>
                        <ul className="space-y-2">
                          <li>
                            <strong>CPT:</strong> Current Procedural Terminology
                            <p className="text-xs">Used for medical procedures and services</p>
                          </li>
                          <li>
                            <strong>LOINC:</strong> Logical Observation Identifiers Names and Codes
                            <p className="text-xs">Used primarily for laboratory tests</p>
                          </li>
                          <li>
                            <strong>SNOMED CT:</strong> Systematized Nomenclature of Medicine
                            <p className="text-xs">Used for clinical terms, including imaging studies</p>
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="fhir-bundle">
                      <AccordionTrigger className="text-sm">
                        FHIR Bundle Explained
                      </AccordionTrigger>
                      <AccordionContent className={`text-sm ${mutedTextClass}`}>
                        <p className="mb-2">
                          A <strong>FHIR Bundle</strong> is a container that groups multiple resources together.
                        </p>
                        <p className="mb-2">
                          The bundle format makes it easier to exchange multiple resources in a single transaction.
                        </p>
                        <p>
                          MediRefs uses a "collection" bundle type, which is a simple grouping of resources.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="data-mapping">
                      <AccordionTrigger className="text-sm">
                        Data Mapping
                      </AccordionTrigger>
                      <AccordionContent className={`text-sm ${mutedTextClass}`}>
                        <ul className="space-y-1">
                          <li>• <strong>Test ID</strong> → resource.id</li>
                          <li>• <strong>Test Name</strong> → code.text</li>
                          <li>• <strong>Category</strong> → category[0].coding[0].display</li>
                          <li>• <strong>CPT Code</strong> → code.coding (system: CPT)</li>
                          <li>• <strong>LOINC Code</strong> → code.coding (system: LOINC)</li>
                          <li>• <strong>SNOMED Code</strong> → code.coding (system: SNOMED CT)</li>
                          <li>• <strong>Description</strong> → note[].text (authorString: "Description")</li>
                          <li>• <strong>Notes</strong> → note[].text (authorString: "Notes")</li>
                        </ul>
                        <div className={`mt-3 p-2 rounded-md ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                          <p className="text-xs">
                            <strong>Note:</strong> Description and Notes are stored as separate entries in the FHIR note array with authorString identifiers for easy parsing.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <div className={`mt-4 p-3 rounded-md ${highlightClass}`}>
                    <div className="flex">
                      <Info className="h-5 w-5 mr-2 shrink-0 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm">
                        {exportFormat === ExportFormat.BUNDLE 
                          ? "This preview shows a FHIR Bundle containing ServiceRequest resources for your selected tests. FHIR Bundles are commonly used for healthcare data exchange."
                          : "This preview shows individual ServiceRequest resources for your selected tests. Each resource represents a medical test with standard coding."}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
        
        {/* STEP 3: EXPORT COMPLETE */}
        {activeStep === "complete" && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center text-center">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-green-900/40' : 'bg-green-100'
              } mb-4`}>
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">Export Complete!</h3>
              <p className={`${mutedTextClass} max-w-md mx-auto mb-6`}>
                Your FHIR data has been successfully exported as {fileName}.json containing {selectedCount} tests.
              </p>
              
              <div className={`flex items-center justify-between p-3 rounded-md border ${borderClass} mb-8 w-full max-w-md mx-auto`}>
                <div className="flex items-center">
                  <FileJson className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
                  <span className="truncate max-w-[200px]">{fileName}.json</span>
                </div>
                <Badge>{selectedCount} Tests</Badge>
              </div>
              
              <h3 className="text-lg font-semibold mb-4">What's Next?</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg border ${borderClass} flex flex-col items-center text-center`}>
                  <Package className="h-8 w-8 mb-2 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-medium mb-1">Import to FHIR Server</h4>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Use with any FHIR-compliant system
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg border ${borderClass} flex flex-col items-center text-center`}>
                  <Layers className="h-8 w-8 mb-2 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-medium mb-1">Data Integration</h4>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Connect with healthcare systems
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg border ${borderClass} flex flex-col items-center text-center`}>
                  <BarChart4 className="h-8 w-8 mb-2 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-medium mb-1">Analytics & Reporting</h4>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Use for clinical data analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Status message */}
        {exportStatus && (
          <div className={`mt-4 p-3 rounded-md ${
            exportStatus.includes('Error')
              ? (isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800')
              : (isDarkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800')
          }`}>
            {exportStatus}
          </div>
        )}

        {/* Footer buttons based on current step */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {activeStep === "select" && (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className={secondaryBtnClass}
              >
                Cancel
              </Button>
              <Button
                onClick={generatePreview}
                disabled={selectedCount === 0 || isGeneratingPreview}
                className={`py-6 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium shadow-lg ${
                  (selectedCount === 0 || isGeneratingPreview) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isGeneratingPreview ? (
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <ChevronRight className="h-5 w-5 mr-2" />
                )}
                Preview FHIR Data {selectedCount > 0 ? `(${selectedCount} tests)` : ''}
              </Button>
            </>
          )}
          
          {activeStep === "preview" && (
            <>
              <Button
                variant="outline"
                onClick={() => setActiveStep("select")}
                className={secondaryBtnClass}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className={primaryBtnClass}
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export {selectedCount} Test{selectedCount !== 1 ? 's' : ''}
              </Button>
            </>
          )}
          
          {activeStep === "complete" && (
            <>
              <Button
                variant="outline"
                onClick={handleStartNew}
                className={secondaryBtnClass}
              >
                Create Another Export
              </Button>
              <Button
                onClick={onClose}
                className={primaryBtnClass}
              >
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}