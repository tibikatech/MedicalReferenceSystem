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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Download, Filter, CheckSquare, X, RefreshCw, BarChart3, FileText, Layers } from 'lucide-react';
import { VALID_CATEGORIES, VALID_SUBCATEGORIES } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  generateStandardCSV, 
  generateConsolidatedCSV, 
  generateLegacyCSV, 
  generateExportStats,
  type ExportOptions 
} from '@/utils/exportFormats';

interface CsvExportToolProps {
  isOpen: boolean;
  onClose: () => void;
}

const CsvExportTool: React.FC<CsvExportToolProps> = ({ isOpen, onClose }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    exportFormat: 'standard',
    groupByCptFamily: false,
    includeCptSuffixes: true,
    includeBaseCptCode: true
  });
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
      setExportOptions({
        exportFormat: 'standard',
        groupByCptFamily: false,
        includeCptSuffixes: true,
        includeBaseCptCode: true
      });
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

  // Calculate export statistics
  const exportStats = useMemo(() => {
    return generateExportStats(filteredTests, exportOptions);
  }, [filteredTests, exportOptions]);

  // Generate filename based on export options
  const generateFilename = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const formatSuffix = exportOptions.exportFormat === 'consolidated' ? '_consolidated' : 
                        exportOptions.exportFormat === 'legacy' ? '_legacy' : '_standard';
    return `medirefs_tests_${timestamp}${formatSuffix}.csv`;
  };

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
      // Generate CSV content based on selected format
      let csvContent: string;
      switch (exportOptions.exportFormat) {
        case 'consolidated':
          csvContent = generateConsolidatedCSV(filteredTests);
          break;
        case 'legacy':
          csvContent = generateLegacyCSV(filteredTests);
          break;
        case 'standard':
        default:
          csvContent = generateStandardCSV(filteredTests, exportOptions);
          break;
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', generateFilename());
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      const exportMessage = exportOptions.exportFormat === 'consolidated' 
        ? `Successfully exported ${exportStats.cptFamilies} CPT families containing ${filteredTests.length} tests.`
        : `Successfully exported ${filteredTests.length} tests to CSV.`;
      
      toast({
        title: "CSV Exported",
        description: exportMessage,
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

        {/* Export Format Selection */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Export Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={exportOptions.exportFormat} 
              onValueChange={(value: 'standard' | 'consolidated' | 'legacy') => 
                setExportOptions(prev => ({ ...prev, exportFormat: value }))
              }
              className="grid md:grid-cols-3 gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard" className="font-medium">Standard Format</Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  Individual tests with separate CPT base code and suffix columns
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="consolidated" id="consolidated" />
                  <Label htmlFor="consolidated" className="font-medium">Consolidated Format</Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  Grouped by CPT families with all variations listed together
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="legacy" id="legacy" />
                  <Label htmlFor="legacy" className="font-medium">Legacy Format</Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  Original format for backward compatibility
                </p>
              </div>
            </RadioGroup>

            {/* Export Options */}
            {exportOptions.exportFormat === 'standard' && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Export Options
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeBaseCptCode"
                      checked={exportOptions.includeBaseCptCode}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeBaseCptCode: checked as boolean }))
                      }
                    />
                    <Label htmlFor="includeBaseCptCode" className="text-sm">
                      Include Base CPT Code column
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeCptSuffixes"
                      checked={exportOptions.includeCptSuffixes}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeCptSuffixes: checked as boolean }))
                      }
                    />
                    <Label htmlFor="includeCptSuffixes" className="text-sm">
                      Include CPT Suffix column
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Enhanced Export Preview */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Export Preview
              <Badge variant="outline" className="ml-auto">
                {isLoading ? "Loading..." : `${filteredTests.length} tests`}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Export Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{exportStats.totalTests}</div>
                <div className="text-xs text-muted-foreground">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{exportStats.uniqueBaseCptCodes}</div>
                <div className="text-xs text-muted-foreground">Unique CPT Codes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{exportStats.testsWithSuffixes}</div>
                <div className="text-xs text-muted-foreground">With Suffixes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{exportStats.cptFamilies}</div>
                <div className="text-xs text-muted-foreground">CPT Families</div>
              </div>
            </div>

            {/* Format-specific preview info */}
            {exportOptions.exportFormat === 'consolidated' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg mb-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Consolidated Format:</strong> Will export {exportStats.cptFamilies} CPT family groups 
                  containing {exportStats.totalTests} individual test variations.
                </p>
              </div>
            )}

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
          </CardContent>
        </Card>

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