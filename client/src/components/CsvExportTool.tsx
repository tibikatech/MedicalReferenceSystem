import React, { useState, useEffect, useMemo } from 'react';
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
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Download, Filter, CheckSquare, X, RefreshCw } from 'lucide-react';
import { VALID_CATEGORIES, VALID_SUBCATEGORIES } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface CsvExportToolProps {
  isOpen: boolean;
  onClose: () => void;
}

const CsvExportTool: React.FC<CsvExportToolProps> = ({ isOpen, onClose }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Fetch all tests
  const { data: testsData, isLoading } = useQuery({
    queryKey: ['/api/tests'],
    enabled: isOpen
  });

  // Reset selections when modal is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedCategories([]);
      setSelectedSubcategories([]);
      setIsExporting(false);
    }
  }, [isOpen]);

  // Update available subcategories when categories change
  useEffect(() => {
    if (selectedCategories.length === 0) {
      setSelectedSubcategories([]);
      return;
    }

    // Keep only subcategories that belong to selected categories
    const availableSubcats = selectedCategories.flatMap(
      category => VALID_SUBCATEGORIES[category] || []
    );
    
    // Filter selected subcategories to only those available
    setSelectedSubcategories(prev => 
      prev.filter(subcat => availableSubcats.includes(subcat))
    );
  }, [selectedCategories]);

  // Get all available subcategories based on selected categories
  const availableSubcategories = useMemo(() => {
    if (selectedCategories.length === 0) {
      return [];
    }
    return selectedCategories.flatMap(category => VALID_SUBCATEGORIES[category] || []);
  }, [selectedCategories]);

  // Handle category selection
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Handle subcategory selection
  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategories(prev => {
      if (prev.includes(subcategory)) {
        return prev.filter(s => s !== subcategory);
      } else {
        return [...prev, subcategory];
      }
    });
  };

  // Select/deselect all categories
  const toggleAllCategories = () => {
    if (selectedCategories.length === Object.keys(VALID_CATEGORIES).length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(Object.keys(VALID_SUBCATEGORIES));
    }
  };

  // Select/deselect all subcategories
  const toggleAllSubcategories = () => {
    if (selectedSubcategories.length === availableSubcategories.length) {
      setSelectedSubcategories([]);
    } else {
      setSelectedSubcategories([...availableSubcategories]);
    }
  };

  // Filter tests based on selected categories and subcategories
  const filteredTests = useMemo(() => {
    const allTests = (testsData as any)?.tests || [];
    
    if ((!allTests.length || allTests.length === 0) || 
        (!selectedCategories.length && !selectedSubcategories.length)) {
      return allTests;
    }

    return allTests.filter((test: Test) => {
      // If categories are selected, test must be in one of them
      const categoryMatch = selectedCategories.length === 0 || 
        selectedCategories.includes(test.category);
      
      // If subcategories are selected, test must be in one of them
      const subcategoryMatch = selectedSubcategories.length === 0 || 
        (test.subCategory && selectedSubcategories.includes(test.subCategory));
      
      // Both conditions must be true
      return categoryMatch && subcategoryMatch;
    });
  }, [testsData, selectedCategories, selectedSubcategories]);

  // Export to CSV
  const handleExport = () => {
    if (!filteredTests.length) {
      toast({
        title: "No Tests Selected",
        description: "Please select categories or subcategories that contain tests.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      // Generate CSV content
      const header = "id,name,category,subCategory,cptCode,loincCode,snomedCode,description,notes";
      const rows = filteredTests.map((test: Test) => {
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
      
      // Create filename based on selected categories
      let filename = 'medirefs_tests';
      if (selectedCategories.length === 1) {
        filename = `medirefs_${selectedCategories[0].toLowerCase().replace(/\s+/g, '_')}`;
      } else if (selectedCategories.length > 1) {
        filename = 'medirefs_filtered_tests';
      }
      
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "CSV Exported",
        description: `Successfully exported ${filteredTests.length} tests to CSV.`,
      });

      // Close the modal after export
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting the tests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Tests to CSV</DialogTitle>
          <DialogDescription>
            Select categories and subcategories to filter tests for export to CSV format.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 my-6">
          {/* Categories */}
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Categories</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleAllCategories} 
                className="h-7 px-2 text-xs"
              >
                {selectedCategories.length === Object.keys(VALID_SUBCATEGORIES).length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <Separator className="my-2" />
            <ScrollArea className="h-[200px] pr-4">
              {Object.keys(VALID_SUBCATEGORIES).map((category) => (
                <div key={category} className="flex items-center space-x-2 py-1">
                  <Checkbox 
                    id={`category-${category}`}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryChange(category)}
                  />
                  <Label 
                    htmlFor={`category-${category}`}
                    className="cursor-pointer text-sm flex-grow"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </ScrollArea>
          </Card>

          {/* Subcategories - only shown when at least one category is selected */}
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Subcategories</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleAllSubcategories} 
                disabled={!selectedCategories.length}
                className="h-7 px-2 text-xs"
              >
                {selectedSubcategories.length === availableSubcategories.length && availableSubcategories.length > 0 
                  ? 'Deselect All' 
                  : 'Select All'
                }
              </Button>
            </div>
            <Separator className="my-2" />
            <ScrollArea className="h-[200px] pr-4">
              {selectedCategories.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2">
                  Select a category to see available subcategories
                </p>
              ) : availableSubcategories.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2">
                  No subcategories available for the selected categories
                </p>
              ) : (
                availableSubcategories.map((subcategory) => (
                  <div key={subcategory} className="flex items-center space-x-2 py-1">
                    <Checkbox 
                      id={`subcategory-${subcategory}`}
                      checked={selectedSubcategories.includes(subcategory)}
                      onCheckedChange={() => handleSubcategoryChange(subcategory)}
                    />
                    <Label 
                      htmlFor={`subcategory-${subcategory}`}
                      className="cursor-pointer text-sm flex-grow"
                    >
                      {subcategory}
                    </Label>
                  </div>
                ))
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* Preview of filtered tests */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Export Preview</h3>
            <Badge variant="outline" className="px-2 py-0.5">
              {isLoading ? "Loading..." : `${filteredTests.length} tests`}
            </Badge>
          </div>
          
          <Card className="p-4 bg-muted/50">
            {selectedCategories.length === 0 && selectedSubcategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">All tests will be exported. Select categories or subcategories to filter.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedCategories.map(cat => (
                    <Badge key={cat} variant="secondary" className="flex items-center gap-1">
                      {cat}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleCategoryChange(cat)} />
                    </Badge>
                  ))}
                  {selectedSubcategories.map(subcat => (
                    <Badge key={subcat} variant="outline" className="flex items-center gap-1">
                      {subcat}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleSubcategoryChange(subcat)} />
                    </Badge>
                  ))}
                </div>
                <p className="text-sm">
                  {filteredTests.length === 0 ? (
                    <span className="text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      No tests match the selected filters
                    </span>
                  ) : (
                    `${filteredTests.length} tests will be exported to CSV`
                  )}
                </p>
              </>
            )}
          </Card>
        </div>

        <DialogFooter className="flex sm:justify-between">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || filteredTests.length === 0}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export to CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CsvExportTool;