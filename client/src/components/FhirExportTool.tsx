import React, { useState, useEffect, useMemo } from 'react';
import { Test } from '@shared/schema';
import { 
  createFhirBundle, 
  filterTestsByCategory, 
  filterTestsBySubcategory 
} from '@/utils/fhirExporter';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  DownloadCloud, 
  RotateCw, 
  CheckCircle,
  Code,
  Database,
  RefreshCw
} from 'lucide-react';

interface FhirExportToolProps {
  isOpen: boolean;
  onClose: () => void;
  tests: Test[];
  isDarkMode?: boolean;
}

const FhirExportTool: React.FC<FhirExportToolProps> = ({ 
  isOpen,
  onClose,
  tests,
  isDarkMode = true
}) => {
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [prettyPrint, setPrettyPrint] = useState<boolean>(true);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [previewFhir, setPreviewFhir] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Get all unique categories from tests
  const categories = useMemo(() => {
    return [...new Set(tests.map(test => test.category))];
  }, [tests]);
  
  // Get all unique subcategories from tests
  const allSubcategories = useMemo(() => {
    return [...new Set(tests.map(test => test.subCategory).filter(Boolean) as string[])];
  }, [tests]);
  
  // Filter subcategories based on selected categories
  const availableSubcategories = useMemo(() => {
    if (selectedCategories.length === 0) {
      return allSubcategories;
    }
    
    // Get subcategories for the selected categories
    return tests
      .filter(test => selectedCategories.includes(test.category))
      .map(test => test.subCategory)
      .filter(Boolean) as string[];
  }, [selectedCategories, tests, allSubcategories]);
  
  // Update selected subcategories when selected categories change
  useEffect(() => {
    if (selectedCategories.length === 0) {
      // Don't filter when no categories are selected
      return;
    }
    
    // Filter out subcategories that don't belong to selected categories
    setSelectedSubcategories(prev => 
      prev.filter(sub => availableSubcategories.includes(sub))
    );
  }, [selectedCategories, availableSubcategories]);
  
  // Handle category selection changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };
  
  // Handle subcategory selection changes
  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategories(prev => {
      if (prev.includes(subcategory)) {
        return prev.filter(s => s !== subcategory);
      } else {
        return [...prev, subcategory];
      }
    });
  };
  
  // Generate FHIR preview
  const generatePreview = async () => {
    setIsExporting(true);
    setExportStatus('Preparing FHIR data...');
    
    try {
      // Apply filters
      let filteredTests = [...tests];
      
      if (selectedCategories.length > 0) {
        filteredTests = filterTestsByCategory(filteredTests, selectedCategories);
      }
      
      if (selectedSubcategories.length > 0) {
        filteredTests = filterTestsBySubcategory(filteredTests, selectedSubcategories);
      }
      
      if (filteredTests.length === 0) {
        setPreviewFhir(null);
        setExportStatus('No tests match the selected criteria.');
        setIsExporting(false);
        return;
      }
      
      // Generate FHIR bundle
      const fhirData = createFhirBundle(filteredTests);
      setPreviewFhir(fhirData);
      setExportStatus(`Ready to export ${filteredTests.length} tests to FHIR format.`);
    } catch (error) {
      console.error('Error generating FHIR preview:', error);
      setExportStatus('Error generating FHIR preview. Please try again.');
      setPreviewFhir(null);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle export
  const handleExport = () => {
    if (!previewFhir) {
      toast({
        title: "Error",
        description: "No FHIR data to export. Please generate a preview first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create a blob and download
      const blob = new Blob([previewFhir], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'medirefs_fhir_export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "FHIR data has been exported successfully.",
      });
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error exporting FHIR data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export FHIR data. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-teal-500" />
            FHIR Export Tool
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Export medical tests as FHIR-compliant ServiceRequest resources
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="space-y-4 col-span-1">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Badge className="bg-blue-600 mr-2">Step 1</Badge>
                Filter Tests
              </h3>
              
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Categories</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {categories.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => handleCategoryChange(category)}
                        />
                        <label
                          htmlFor={`category-${category}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Subcategories</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableSubcategories.map(subcategory => (
                      <div key={subcategory} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subcategory-${subcategory}`}
                          checked={selectedSubcategories.includes(subcategory)}
                          onCheckedChange={() => handleSubcategoryChange(subcategory)}
                          disabled={selectedCategories.length > 0 && !availableSubcategories.includes(subcategory)}
                        />
                        <label
                          htmlFor={`subcategory-${subcategory}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {subcategory}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Badge className="bg-blue-600 mr-2">Step 2</Badge>
                Options
              </h3>
              
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pretty-print"
                    checked={prettyPrint}
                    onCheckedChange={(checked) => setPrettyPrint(checked as boolean)}
                  />
                  <label
                    htmlFor="pretty-print"
                    className="text-sm font-medium leading-none"
                  >
                    Pretty Print JSON
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Badge className="bg-blue-600 mr-2">Step 3</Badge>
                Generate & Export
              </h3>
              
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={generatePreview}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Preview
                    </>
                  )}
                </Button>
                
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleExport}
                  disabled={!previewFhir || isExporting}
                >
                  <DownloadCloud className="h-4 w-4 mr-2" />
                  Export FHIR
                </Button>
                
                {exportStatus && (
                  <div className={`text-xs p-2 rounded ${
                    exportStatus.includes('Error') 
                      ? 'bg-red-900 bg-opacity-50 text-red-300' 
                      : 'bg-green-900 bg-opacity-50 text-green-300'
                  }`}>
                    {exportStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-span-2">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Badge className="bg-teal-600 mr-2">Preview</Badge>
              FHIR Output
            </h3>
            
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-2 h-[500px] relative">
              {previewFhir ? (
                <Textarea
                  className="h-full font-mono text-sm bg-gray-900 border-none resize-none"
                  value={previewFhir}
                  readOnly
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Code className="h-12 w-12 mb-2" />
                  <p className="text-center max-w-md">
                    {isExporting 
                      ? 'Generating FHIR preview...' 
                      : 'Select filters and click "Generate Preview" to see FHIR output here.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FhirExportTool;