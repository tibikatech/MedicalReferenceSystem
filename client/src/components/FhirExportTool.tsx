import React, { useState } from 'react';
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
import { Filter, FileCode, Download, CheckSquare, ArrowDown } from 'lucide-react';
import { downloadFhirExport, filterTestsByCategory, filterTestsBySubcategory } from '@/utils/fhirExporter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FhirExportToolProps {
  isOpen: boolean;
  onClose: () => void;
  tests: Test[];
  isDarkMode?: boolean;
}

export default function FhirExportTool({
  isOpen,
  onClose,
  tests,
  isDarkMode = false
}: FhirExportToolProps) {
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileName, setFileName] = useState('medirefs_fhir_export.json');
  
  // Get unique categories and subcategories from tests
  const categories = [...new Set(tests.map(test => test.category))];
  const subcategories = [...new Set(tests.map(test => test.subCategory).filter(Boolean))];
  
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
  
  // Handle export
  const handleExport = () => {
    const testsToExport = filteredTests.filter(test => selectedTests.has(test.id));
    downloadFhirExport(testsToExport, fileName);
    onClose();
  };
  
  // Get the count of selected tests
  const selectedCount = filteredTests.filter(test => selectedTests.has(test.id)).length;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-4xl ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}
      >
        <DialogHeader>
          <DialogTitle className={`text-xl ${isDarkMode ? 'text-white' : ''}`}>
            Export Tests to FHIR Format
          </DialogTitle>
          <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Select tests to export as FHIR ServiceRequest resources in a FHIR Bundle.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
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
                <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
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
            
            <TabsContent value="all" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {filteredTests.length === 0 ? (
                  <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No tests found matching your criteria.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredTests.map(test => (
                      <Card 
                        key={test.id}
                        className={`p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}
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
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="laboratory" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {filteredTests.length === 0 ? (
                  <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No laboratory tests found matching your criteria.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredTests.map(test => (
                      <Card 
                        key={test.id}
                        className={`p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}
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
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="imaging" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {filteredTests.length === 0 ? (
                  <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No imaging studies found matching your criteria.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredTests.map(test => (
                      <Card 
                        key={test.id}
                        className={`p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}
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
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
          
          {/* Export Settings */}
          <div className="space-y-4">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Export Settings
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file-name" className={isDarkMode ? 'text-gray-300' : ''}>
                  File Name
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="file-name"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
                  />
                  <FileCode className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className={isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : ''}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedCount === 0}
            className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : ''} ${selectedCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Download className="h-4 w-4 mr-2" />
            Export {selectedCount} Test{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}