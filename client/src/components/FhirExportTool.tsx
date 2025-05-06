import { useState } from "react";
import { Test } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckedState } from "@radix-ui/react-checkbox";
import { downloadFhirExport, filterTestsByCategory, filterTestsBySubcategory } from "@/utils/fhirExporter";

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
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [prettyPrint, setPrettyPrint] = useState(true);
  const [bundleType, setBundleType] = useState<string>("collection");
  
  // Get unique categories and subcategories from tests
  const categories = [...new Set(tests.map(test => test.category))];
  const subcategories = [
    ...new Set(
      tests
        .filter(test => !selectedCategory || test.category === selectedCategory)
        .filter(test => test.subCategory)
        .map(test => test.subCategory)
    )
  ].filter(Boolean) as string[];
  
  // Handle select all change
  const handleSelectAllChange = (checked: CheckedState) => {
    setSelectAll(!!checked);
    if (checked) {
      setSelectedTests(new Set(filteredTests.map(test => test.id)));
    } else {
      setSelectedTests(new Set());
    }
  };
  
  // Handle test selection
  const handleTestSelectionChange = (testId: string, checked: CheckedState) => {
    const newSelectedTests = new Set(selectedTests);
    if (checked) {
      newSelectedTests.add(testId);
    } else {
      newSelectedTests.delete(testId);
    }
    setSelectedTests(newSelectedTests);
  };
  
  // Filter tests based on category and subcategory
  const filteredTests = tests
    .filter(test => !selectedCategory || test.category === selectedCategory)
    .filter(test => !selectedSubCategory || test.subCategory === selectedSubCategory);
  
  // Export selected tests
  const handleExport = () => {
    // Get selected tests or all filtered tests if none selected
    const testsToExport = selectedTests.size > 0
      ? filteredTests.filter(test => selectedTests.has(test.id))
      : filteredTests;
    
    // Generate file name
    const categorySuffix = selectedCategory ? `_${selectedCategory.replace(/\s+/g, '_')}` : '';
    const subcategorySuffix = selectedSubCategory ? `_${selectedSubCategory.replace(/\s+/g, '_')}` : '';
    const fileName = `medirefs_fhir_export${categorySuffix}${subcategorySuffix}.json`;
    
    // Download the file
    downloadFhirExport(testsToExport, fileName);
    
    // Close the dialog
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl ${isDarkMode ? 'bg-gray-800 text-white' : ''}`}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? 'text-white' : ''}>
            Export to FHIR
          </DialogTitle>
          <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Export selected tests to FHIR-compliant JSON format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category filter */}
            <div>
              <Label htmlFor="category" className={`mb-2 block ${isDarkMode ? 'text-gray-300' : ''}`}>
                Filter by Category
              </Label>
              <Select 
                value={selectedCategory || ""} 
                onValueChange={(value) => {
                  setSelectedCategory(value || null);
                  setSelectedSubCategory(null);
                  setSelectedTests(new Set());
                  setSelectAll(false);
                }}
              >
                <SelectTrigger id="category" className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Subcategory filter */}
            <div>
              <Label htmlFor="subcategory" className={`mb-2 block ${isDarkMode ? 'text-gray-300' : ''}`}>
                Filter by Subcategory
              </Label>
              <Select 
                value={selectedSubCategory || ""} 
                onValueChange={(value) => {
                  setSelectedSubCategory(value || null);
                  setSelectedTests(new Set());
                  setSelectAll(false);
                }}
                disabled={!selectedCategory || subcategories.length === 0}
              >
                <SelectTrigger id="subcategory" className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectValue placeholder={selectedCategory ? "All Subcategories" : "Select a Category First"} />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectItem value="">All Subcategories</SelectItem>
                  {subcategories.map(subcategory => (
                    <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Test selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className={isDarkMode ? 'text-gray-300' : ''}>
                Select Tests to Export
              </Label>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="select-all" 
                  checked={selectAll}
                  onCheckedChange={handleSelectAllChange}
                  className={isDarkMode ? 'border-gray-600' : ''}
                />
                <Label htmlFor="select-all" className={isDarkMode ? 'text-gray-300' : ''}>
                  Select All ({filteredTests.length})
                </Label>
              </div>
            </div>
            
            <div className={`rounded-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-2 max-h-60 overflow-auto`}>
              {filteredTests.length === 0 ? (
                <div className={`py-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No tests match the selected filters
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTests.map(test => (
                    <div 
                      key={test.id}
                      className={`flex items-center gap-2 p-2 rounded-md ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox 
                        id={`test-${test.id}`}
                        checked={selectedTests.has(test.id)}
                        onCheckedChange={(checked) => handleTestSelectionChange(test.id, checked)}
                        className={isDarkMode ? 'border-gray-600' : ''}
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={`test-${test.id}`}
                          className={`font-medium ${isDarkMode ? 'text-white' : ''}`}
                        >
                          {test.name}
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Badge className={isDarkMode ? 'bg-gray-700 text-white' : ''}>
                            {test.category}
                          </Badge>
                          {test.subCategory && (
                            <Badge variant="outline" className={isDarkMode ? 'text-gray-300 border-gray-600' : ''}>
                              {test.subCategory}
                            </Badge>
                          )}
                          {test.cptCode && (
                            <Badge variant="outline" className={`${isDarkMode ? 'text-blue-400 border-blue-400/30' : 'text-blue-700 border-blue-200'}`}>
                              CPT: {test.cptCode}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Export options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="pretty-print" 
                checked={prettyPrint}
                onCheckedChange={(checked) => setPrettyPrint(!!checked)}
                className={isDarkMode ? 'border-gray-600' : ''}
              />
              <Label htmlFor="pretty-print" className={isDarkMode ? 'text-gray-300' : ''}>
                Pretty Print JSON (human-readable)
              </Label>
            </div>
            
            <div>
              <Label htmlFor="bundle-type" className={`mb-2 block ${isDarkMode ? 'text-gray-300' : ''}`}>
                FHIR Bundle Type
              </Label>
              <Select 
                value={bundleType} 
                onValueChange={(value) => setBundleType(value)}
              >
                <SelectTrigger id="bundle-type" className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectValue placeholder="Collection" />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectItem value="collection">Collection</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="transaction">Transaction</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Export summary */}
          <div className={`p-4 rounded-md ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : ''}`}>
              Export Summary
            </h3>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {selectedTests.size > 0 
                ? `Exporting ${selectedTests.size} selected tests to FHIR format` 
                : `Exporting all ${filteredTests.length} filtered tests to FHIR format`}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className={isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : ''}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={filteredTests.length === 0}
            className={isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
          >
            Export to FHIR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}