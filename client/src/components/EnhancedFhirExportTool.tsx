import React, { useState, useEffect } from 'react';
import { Test } from '@shared/schema';
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
  Package,
  Layers,
  BarChart4
} from 'lucide-react';
import { downloadFhirExport, filterTestsByCategory, filterTestsBySubcategory } from '@/utils/fhirExporter';
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
  
  // Generate FHIR preview
  const generatePreview = () => {
    if (selectedCount === 0) {
      setExportStatus("Please select at least one test to preview");
      return;
    }
    
    setIsGeneratingPreview(true);
    setExportProgress(30);
    
    setTimeout(() => {
      try {
        const testsToPreview = filteredTests
          .filter(test => selectedTests.has(test.id))
          .slice(0, 3); // Take up to 3 tests for preview
        
        let previewContent = '';
        
        if (exportFormat === ExportFormat.BUNDLE) {
          // Sample Bundle format for preview
          previewContent = JSON.stringify({
            resourceType: "Bundle",
            type: "collection",
            entry: testsToPreview.map(test => ({
              resource: {
                resourceType: "ServiceRequest",
                id: test.id,
                status: "active",
                intent: "order",
                code: {
                  coding: [
                    {
                      system: "http://www.ama-assn.org/go/cpt",
                      code: test.cptCode || "",
                      display: test.name
                    }
                  ],
                  text: test.name
                },
                category: [
                  {
                    coding: [
                      {
                        system: "http://terminology.hl7.org/CodeSystem/service-category",
                        code: test.category === "Laboratory Tests" ? "LAB" : "RAD",
                        display: test.category
                      }
                    ]
                  }
                ]
              }
            }))
          }, null, 2);
        } else {
          // Sample individual resources format for preview
          previewContent = JSON.stringify(testsToPreview.map(test => ({
            resourceType: "ServiceRequest",
            id: test.id,
            status: "active",
            intent: "order",
            code: {
              coding: [
                {
                  system: "http://www.ama-assn.org/go/cpt",
                  code: test.cptCode || "",
                  display: test.name
                }
              ],
              text: test.name
            },
            category: [
              {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/service-category",
                    code: test.category === "Laboratory Tests" ? "LAB" : "RAD",
                    display: test.category
                  }
                ]
              }
            ]
          })), null, 2);
        }
        
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
    }, 500); // Simulate processing time
  };
  
  // Handle export
  const handleExport = () => {
    if (selectedCount === 0) {
      setExportStatus("Please select at least one test to export");
      return;
    }
    
    setIsExporting(true);
    setExportProgress(25);
    
    setTimeout(() => {
      try {
        const testsToExport = filteredTests.filter(test => selectedTests.has(test.id));
        setExportProgress(50);
        
        downloadFhirExport(testsToExport, fileName);
        setExportProgress(100);
        setActiveStep("complete");
      } catch (error) {
        console.error("Error exporting FHIR data:", error);
        setExportStatus(`Error exporting: ${error instanceof Error ? error.message : "Unknown error"}`);
        setExportProgress(0);
      } finally {
        setIsExporting(false);
      }
    }, 800); // Simulate processing time
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
        className={`max-w-5xl ${bgClass} ${textClass}`}
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
            {/* Test selection summary */}
            <div className={`p-4 rounded-lg border ${borderClass}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Test Selection</h3>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Select which tests to include in your FHIR export
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <span className="text-xl font-semibold">{tests.length}</span>
                    <p className={`text-xs ${mutedTextClass}`}>Total</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">{selectedCount}</span>
                    <p className={`text-xs ${mutedTextClass}`}>Selected</p>
                  </div>
                </div>
              </div>
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
                  <h3 className="font-medium mb-2">Categories</h3>
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
                          className={`flex items-center justify-between p-2 rounded cursor-pointer hover:${secondaryBgClass} ${
                            categoryFilter === category ? highlightClass : ''
                          }`}
                          onClick={() => setCategoryFilter(categoryFilter === category ? '' : category)}
                        >
                          <span className="text-sm">{category}</span>
                          <Badge variant="outline">
                            {categoryCountMap.get(category) || 0}
                          </Badge>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </Card>
                
                {/* Subcategories filter panel */}
                <Card className={`p-3 ${cardClass} col-span-1`}>
                  <h3 className="font-medium mb-2">Subcategories</h3>
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
                          className={`flex items-center justify-between p-2 rounded cursor-pointer hover:${secondaryBgClass} ${
                            subcategoryFilter === subcategory ? highlightClass : ''
                          }`}
                          onClick={() => setSubcategoryFilter(subcategoryFilter === subcategory ? '' : subcategory)}
                        >
                          <span className="text-sm">{subcategory}</span>
                          <Badge variant="outline">
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
            <div className={`p-4 rounded-lg border ${borderClass}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">FHIR Preview</h3>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Preview how your tests will look in FHIR format
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
                        About ServiceRequest
                      </AccordionTrigger>
                      <AccordionContent className={`text-sm ${mutedTextClass}`}>
                        <p className="mb-2">
                          In FHIR, a <strong>ServiceRequest</strong> represents a request for a procedure, 
                          diagnostic test, or other healthcare service to be performed.
                        </p>
                        <p>
                          MediRefs exports each test as a ServiceRequest resource with standard medical coding.
                        </p>
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
                          <li>• <strong>Notes</strong> → note[0].text</li>
                        </ul>
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
                className={`${primaryBtnClass} ${
                  (selectedCount === 0 || isGeneratingPreview) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isGeneratingPreview ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                Preview FHIR Data
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