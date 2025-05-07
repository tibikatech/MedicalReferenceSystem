import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRight, Check, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface TestMappingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  csvHeaders: string[];
  csvPreviewRows: string[][];
  onComplete: (mapping: Record<string, string>) => void;
  isDarkMode?: boolean;
}

export default function TestMappingWizard({
  isOpen,
  onClose,
  csvHeaders,
  csvPreviewRows,
  onComplete,
  isDarkMode = false
}: TestMappingWizardProps) {
  // Required fields in our application
  const requiredFields = ['name', 'category'];
  
  // All available fields in our app
  const appFields = [
    { id: 'id', label: 'ID', description: 'Unique identifier for the test' },
    { id: 'name', label: 'Name', description: 'Test name', required: true },
    { id: 'category', label: 'Category', description: 'Main category (Lab Tests or Imaging Studies)', required: true },
    { id: 'subCategory', label: 'Subcategory', description: 'Specific subcategory' },
    { id: 'cptCode', label: 'CPT Code', description: 'Current Procedural Terminology code' },
    { id: 'loincCode', label: 'LOINC Code', description: 'Logical Observation Identifiers Names and Codes' },
    { id: 'snomedCode', label: 'SNOMED Code', description: 'Systematized Nomenclature of Medicine code' },
    { id: 'description', label: 'Description', description: 'Full test description' },
    { id: 'notes', label: 'Notes', description: 'Additional notes about the test' }
  ];
  
  // State for field mapping
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Get categories and subcategories for mapping alignment
  const { data: categoriesData } = useQuery<{ categories: Array<{ category: string, count: number }> }>({
    queryKey: ['/api/test-count-by-category'],
    enabled: isOpen,
  });

  const { data: subcategoriesData } = useQuery<{ subcategories: Array<{ subCategory: string, count: number }> }>({
    queryKey: ['/api/test-count-by-subcategory'],
    enabled: isOpen,
  });
  
  // Automatic mapping if CSV headers match our field names
  useEffect(() => {
    const initialMapping: Record<string, string> = {};
    
    csvHeaders.forEach(header => {
      // Check if header matches any app field directly or with case insensitive matching
      const headerLower = header.toLowerCase();
      
      // First try exact match
      const exactMatch = appFields.find(field => field.id === header);
      if (exactMatch) {
        initialMapping[exactMatch.id] = header;
        return;
      }
      
      // Then try case-insensitive, whitespace-free match
      const lowerCaseMatch = appFields.find(
        field => field.id.toLowerCase() === headerLower ||
                field.id.toLowerCase().replace(/[_\s]/g, '') === headerLower.replace(/[_\s]/g, '')
      );
      
      if (lowerCaseMatch) {
        initialMapping[lowerCaseMatch.id] = header;
        return;
      }
      
      // Try fuzzy matching
      const fuzzyMatch = appFields.find(
        field => headerLower.includes(field.id.toLowerCase()) ||
                field.id.toLowerCase().includes(headerLower)
      );
      
      if (fuzzyMatch && !initialMapping[fuzzyMatch.id]) {
        initialMapping[fuzzyMatch.id] = header;
      }
    });
    
    // Apply smarter initial mapping
    if (csvPreviewRows.length > 0) {
      // Look at the first row of data to make better guesses about category and subcategory
      const firstRow = csvPreviewRows[0];
      csvHeaders.forEach((header, index) => {
        const value = firstRow[index];
        if (value) {
          const valueLower = value.toLowerCase();
          
          // Check for known categories in our system
          if (categoriesData?.categories && !initialMapping['category']) {
            const categories = categoriesData.categories.map((c) => c.category.toLowerCase());
            if (categories.includes(valueLower)) {
              initialMapping['category'] = header;
            }
          }
          
          // Check for known subcategories in our system
          if (subcategoriesData?.subcategories && !initialMapping['subCategory']) {
            const subcategories = subcategoriesData.subcategories.map((sc) => sc.subCategory.toLowerCase());
            if (subcategories.includes(valueLower)) {
              initialMapping['subCategory'] = header;
            }
          }
        }
      });
    }
    
    setMapping(initialMapping);
  }, [csvHeaders, csvPreviewRows, categoriesData, subcategoriesData]);
  
  // Check if all required fields are mapped
  const areRequiredFieldsMapped = requiredFields.every(field => mapping[field]);
  
  // Handle field mapping change
  const handleFieldMappingChange = (appField: string, csvHeader: string) => {
    // If "__none__" is selected, don't map this field
    if (csvHeader === "__none__") {
      const updatedMapping = { ...mapping };
      // Remove this field from mapping if it exists
      delete updatedMapping[appField];
      setMapping(updatedMapping);
    } else {
      setMapping(prev => ({
        ...prev,
        [appField]: csvHeader
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = () => {
    onComplete(mapping);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-4xl ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}
      >
        <DialogHeader>
          <DialogTitle className={`text-xl ${isDarkMode ? 'text-white' : ''}`}>
            Map CSV Columns to Test Fields
          </DialogTitle>
          <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Please map each field from your CSV file to the corresponding field in our system.
            Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Preview of CSV data */}
          <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50'} p-3 rounded-lg`}>
            <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              CSV Preview (First {csvPreviewRows.length} rows)
            </h3>
            <div className="overflow-x-auto max-h-32 scrollbar-thin">
              <Table className={`${isDarkMode ? 'bg-gray-800' : ''} w-full table-fixed`}>
                <TableHeader className={isDarkMode ? 'bg-gray-700' : ''}>
                  <TableRow>
                    {csvHeaders.map((header, index) => (
                      <TableHead 
                        key={index} 
                        className={`${isDarkMode ? 'text-gray-300 border-gray-700' : ''} py-1 text-xs whitespace-nowrap`}
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvPreviewRows.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className={isDarkMode ? 'border-gray-700' : ''}>
                      {row.map((cell, cellIndex) => (
                        <TableCell 
                          key={cellIndex}
                          className={`${isDarkMode ? 'text-gray-300 border-gray-700' : ''} py-1 text-xs truncate`}
                        >
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
          
          {/* Field mapping section */}
          <div className="space-y-4">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Field Mapping
            </h3>
            
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {appFields.map(field => (
                <div key={field.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <label 
                        htmlFor={`field-${field.id}`} 
                        className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {mapping[field.id] ? (
                        <Badge className={`ml-2 ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                          <Check className="h-3 w-3 mr-1" />
                          Mapped
                        </Badge>
                      ) : field.required ? (
                        <Badge className={`ml-2 ${isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'}`}>
                          <X className="h-3 w-3 mr-1" />
                          Required
                        </Badge>
                      ) : (
                        <Badge className={`ml-2 ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                          Optional
                        </Badge>
                      )}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {field.description}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Select
                      value={mapping[field.id] || '__none__'}
                      onValueChange={(value) => handleFieldMappingChange(field.id, value)}
                    >
                      <SelectTrigger 
                        id={`field-${field.id}`}
                        className={`w-full ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
                      >
                        <SelectValue placeholder="Select a column" />
                      </SelectTrigger>
                      <SelectContent className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}>
                        <SelectItem value="__none__">-- Don't map --</SelectItem>
                        {csvHeaders.map(header => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
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
            onClick={handleSubmit}
            disabled={!areRequiredFieldsMapped}
            className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : ''} ${!areRequiredFieldsMapped ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Complete Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}