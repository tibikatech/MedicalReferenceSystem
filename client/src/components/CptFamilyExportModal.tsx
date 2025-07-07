import React, { useState, useMemo } from 'react';
import { Test } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Download, 
  RefreshCw, 
  Filter,
  BarChart3,
  FileText,
  TestTube,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ExportOptions, generateStandardCSV, generateConsolidatedCSV, generateLegacyCSV } from '@/utils/exportFormats';

interface CptFamilyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTests: Test[];
  selectedFamilies: string[];
}

export function CptFamilyExportModal({
  isOpen,
  onClose,
  selectedTests,
  selectedFamilies
}: CptFamilyExportModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'standard' | 'consolidated' | 'legacy'>('standard');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Get unique categories from selected tests
  const availableCategories = useMemo(() => {
    const categories = new Set(selectedTests.map(test => test.category));
    return Array.from(categories).sort();
  }, [selectedTests]);

  // Filter tests by selected categories
  const filteredTests = useMemo(() => {
    if (selectedCategories.length === 0) {
      return selectedTests;
    }
    return selectedTests.filter(test => selectedCategories.includes(test.category));
  }, [selectedTests, selectedCategories]);

  // Get export statistics
  const exportStats = useMemo(() => {
    const uniqueBaseCodes = new Set(filteredTests.map(t => t.baseCptCode).filter(Boolean));
    const testsWithSuffixes = filteredTests.filter(t => t.cptSuffix).length;
    const categories = new Set(filteredTests.map(t => t.category));
    const subcategories = new Set(filteredTests.map(t => t.subCategory).filter(Boolean));

    return {
      totalTests: filteredTests.length,
      uniqueBaseCodes: uniqueBaseCodes.size,
      testsWithSuffixes,
      categories: categories.size,
      subcategories: subcategories.size
    };
  }, [filteredTests]);

  // Handle category selection
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Select all categories
  const selectAllCategories = () => {
    setSelectedCategories(availableCategories);
  };

  // Clear category selection
  const clearCategorySelection = () => {
    setSelectedCategories([]);
  };

  // Generate filename
  const generateFilename = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const categoryFilter = selectedCategories.length > 0 
      ? `_${selectedCategories.length}cats` 
      : '_allcats';
    const formatSuffix = exportFormat === 'consolidated' ? '_consolidated' : 
                        exportFormat === 'legacy' ? '_legacy' : '_standard';
    return `cpt_families_${timestamp}${categoryFilter}${formatSuffix}.csv`;
  };

  // Export to CSV
  const handleExport = async () => {
    if (filteredTests.length === 0) {
      toast({
        title: "No Tests to Export",
        description: "Please select at least one category that contains tests.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      let csvContent: string;
      const exportOptions: ExportOptions = {
        exportFormat,
        groupByCptFamily: true,
        includeCptSuffixes: true,
        includeBaseCptCode: true
      };

      switch (exportFormat) {
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

      // Download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', generateFilename());
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const exportMessage = exportFormat === 'consolidated' 
        ? `Successfully exported ${exportStats.uniqueBaseCodes} CPT families containing ${filteredTests.length} tests.`
        : `Successfully exported ${filteredTests.length} tests from selected CPT families.`;

      toast({
        title: "Export Successful",
        description: exportMessage,
      });

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('Laboratory')) return <TestTube className="h-4 w-4" />;
    if (category.includes('Imaging')) return <Eye className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export CPT Families to CSV
          </DialogTitle>
          <DialogDescription>
            Stratify your selected CPT families by medical categories before exporting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selection Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{selectedTests.length}</div>
              <div className="text-xs text-muted-foreground">Selected Tests</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{selectedFamilies.length}</div>
              <div className="text-xs text-muted-foreground">CPT Families</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{availableCategories.length}</div>
              <div className="text-xs text-muted-foreground">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{exportStats.testsWithSuffixes}</div>
              <div className="text-xs text-muted-foreground">With Suffixes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{exportStats.uniqueBaseCodes}</div>
              <div className="text-xs text-muted-foreground">Base Codes</div>
            </div>
          </div>

          {/* Export Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'standard' | 'consolidated' | 'legacy') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select export format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Format (Individual Tests)</SelectItem>
                <SelectItem value="consolidated">Consolidated Format (CPT Families Grouped)</SelectItem>
                <SelectItem value="legacy">Legacy Format (Backward Compatible)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {exportFormat === 'consolidated' && "Groups tests by CPT families with variations listed together"}
              {exportFormat === 'standard' && "Individual test rows with separate base CPT and suffix columns"}
              {exportFormat === 'legacy' && "Original format for backward compatibility"}
            </p>
          </div>

          <Separator />

          {/* Category Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter by Categories
              </Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllCategories}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearCategorySelection}>
                  Clear
                </Button>
              </div>
            </div>

            <ScrollArea className="h-32 border rounded-md p-3">
              <div className="space-y-2">
                {availableCategories.map((category) => {
                  const categoryTests = selectedTests.filter(t => t.category === category);
                  return (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <Label 
                        htmlFor={category} 
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                      >
                        {getCategoryIcon(category)}
                        <span className="flex-1">{category}</span>
                        <Badge variant="secondary" className="text-xs">
                          {categoryTests.length}
                        </Badge>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {selectedCategories.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Filtering by: {selectedCategories.join(', ')}
              </div>
            )}
          </div>

          {/* Export Preview */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">Export Preview</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="font-medium text-blue-600">{exportStats.totalTests}</div>
                <div className="text-muted-foreground">Tests to Export</div>
              </div>
              <div>
                <div className="font-medium text-green-600">{exportStats.uniqueBaseCodes}</div>
                <div className="text-muted-foreground">CPT Families</div>
              </div>
              <div>
                <div className="font-medium text-purple-600">{exportStats.categories}</div>
                <div className="text-muted-foreground">Categories</div>
              </div>
              <div>
                <div className="font-medium text-orange-600">{exportStats.subcategories}</div>
                <div className="text-muted-foreground">Subcategories</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Filename: {generateFilename()}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
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
                Export {exportStats.totalTests} Tests
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CptFamilyExportModal;