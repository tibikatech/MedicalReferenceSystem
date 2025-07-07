import React, { useState } from 'react';
import { Test } from '@shared/schema';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  MoreHorizontal,
  Trash2, 
  Edit, 
  Download, 
  Copy,
  Archive,
  Tag,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CptFamily } from './CptFamilyFilter';
import CptFamilyExportModal from './CptFamilyExportModal';

interface BulkOperationsPanelProps {
  selectedFamilies: string[];
  selectedTests: string[];
  allTests: Test[];
  onClearSelection: () => void;
}

export function BulkOperationsPanel({
  selectedFamilies,
  selectedTests,
  allTests,
  onClearSelection
}: BulkOperationsPanelProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get selected tests from families and individual selections
  const getSelectedTestsData = (): Test[] => {
    const familyTests = allTests.filter(test => 
      test.baseCptCode && selectedFamilies.includes(test.baseCptCode)
    );
    const individualTests = allTests.filter(test => 
      selectedTests.includes(test.id)
    );
    
    // Combine and deduplicate
    const allSelectedTests = [...familyTests, ...individualTests];
    const uniqueTests = allSelectedTests.filter((test, index, self) => 
      index === self.findIndex(t => t.id === test.id)
    );
    
    return uniqueTests;
  };

  const selectedTestsData = getSelectedTestsData();

  // Get statistics
  const getSelectionStats = () => {
    const tests = selectedTestsData;
    const uniqueBaseCodes = new Set(tests.map(t => t.baseCptCode).filter(Boolean));
    const testsWithSuffixes = tests.filter(t => t.cptSuffix).length;
    const categories = new Set(tests.map(t => t.category));
    
    return {
      totalTests: tests.length,
      uniqueBaseCodes: uniqueBaseCodes.size,
      testsWithSuffixes,
      categories: categories.size
    };
  };

  const stats = getSelectionStats();

  // Bulk delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (testIds: string[]) => {
      const deletePromises = testIds.map(id =>
        fetch(`/api/tests/${id}`, { method: 'DELETE' })
      );
      const results = await Promise.allSettled(deletePromises);
      
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        throw new Error(`Failed to delete ${failed} tests`);
      }
      
      return results.length;
    },
    onSuccess: (deletedCount) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/test-count-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['/api/test-count-by-subcategory'] });
      
      toast({
        title: "Bulk Deletion Successful",
        description: `Successfully deleted ${deletedCount} tests.`,
      });
      
      onClearSelection();
    },
    onError: (error) => {
      toast({
        title: "Bulk Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete tests",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const testIds = selectedTestsData.map(test => test.id);
    deleteMutation.mutate(testIds);
  };

  const handleBulkExport = () => {
    setShowExportModal(true);
  };

  const handleCopyIds = () => {
    const ids = selectedTestsData.map(test => test.id).join('\n');
    navigator.clipboard.writeText(ids);
    
    toast({
      title: "IDs Copied",
      description: `Copied ${selectedTestsData.length} test IDs to clipboard.`,
    });
  };

  const generateCSV = (tests: Test[]): string => {
    const headers = ['id', 'name', 'category', 'subCategory', 'cptCode', 'baseCptCode', 'cptSuffix', 'loincCode', 'snomedCode', 'description'];
    const csvRows = tests.map(test => 
      headers.map(header => {
        const value = test[header as keyof Test] || '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );
    
    return [headers.join(','), ...csvRows].join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (selectedFamilies.length === 0 && selectedTests.length === 0) {
    return null;
  }

  return (
    <Card className="border-dashed border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MoreHorizontal className="h-5 w-5" />
              Bulk Operations
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage selected tests and CPT families
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearSelection}
            className="h-8"
          >
            Clear Selection
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Selection Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalTests}</div>
            <div className="text-xs text-muted-foreground">Total Tests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{selectedFamilies.length}</div>
            <div className="text-xs text-muted-foreground">CPT Families</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.testsWithSuffixes}</div>
            <div className="text-xs text-muted-foreground">With Suffixes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.categories}</div>
            <div className="text-xs text-muted-foreground">Categories</div>
          </div>
        </div>

        {/* Selection Details */}
        <div className="space-y-2">
          {selectedFamilies.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Selected CPT Families:</div>
              <div className="flex flex-wrap gap-1">
                {selectedFamilies.map(family => (
                  <Badge key={family} variant="secondary" className="text-xs">
                    CPT {family}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {selectedTests.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Individual Tests Selected:</div>
              <Badge variant="outline" className="text-xs">
                {selectedTests.length} individual test{selectedTests.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        <Separator />

        {/* Bulk Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBulkExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyIds}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy IDs
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            disabled
            className="flex items-center gap-2 opacity-50"
          >
            <Edit className="h-4 w-4" />
            Bulk Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirm Bulk Deletion
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    You are about to permanently delete <strong>{stats.totalTests} tests</strong>:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{selectedFamilies.length} CPT families</li>
                    <li>{selectedTests.length} individual tests</li>
                    <li>{stats.categories} different categories</li>
                  </ul>
                  <p className="text-destructive font-medium">
                    This action cannot be undone. All associated data will be permanently removed.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleBulkDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete {stats.totalTests} Tests
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>

      {/* Enhanced Export Modal */}
      <CptFamilyExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        selectedTests={selectedTestsData}
        selectedFamilies={selectedFamilies}
      />
    </Card>
  );
}

export default BulkOperationsPanel;