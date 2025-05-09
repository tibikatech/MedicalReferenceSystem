import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Test } from '@shared/schema';
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  AlertTriangle, 
  Info, 
  Layers, 
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define category and subcategory constants
// In a production app, these would be imported from a shared constants file
const TestCategory = {
  LABORATORY: 'Laboratory Tests',
  IMAGING: 'Imaging Studies',
  CARDIOLOGY: 'Cardiovascular Tests',
  NEUROLOGY: 'Neurological Tests',
  PULMONARY: 'Pulmonary Tests',
  GASTRO: 'Gastrointestinal Tests'
};

const ImagingSubCategories = {
  RADIOGRAPHY: 'Radiography (X-rays)',
  CT: 'Computed Tomography (CT)',
  MRI: 'Magnetic Resonance Imaging (MRI)',
  ULTRASOUND: 'Ultrasound',
  NUCLEAR: 'Nuclear Medicine',
  PET: 'Positron Emission Tomography (PET)',
  FLUOROSCOPY: 'Fluoroscopy',
  MAMMOGRAPHY: 'Mammography',
  DENSITOMETRY: 'Bone Densitometry',
  ANGIOGRAPHY: 'Angiography'
};

const LabSubCategories = {
  CHEMISTRY: 'Clinical Chemistry',
  HEMATOLOGY: 'Hematology',
  IMMUNOLOGY: 'Immunology/Serology',
  MOLECULAR: 'Molecular Diagnostics',
  MICROBIOLOGY: 'Microbiology',
  TOXICOLOGY: 'Toxicology',
  URINALYSIS: 'Urinalysis',
  ENDOCRINOLOGY: 'Endocrinology',
  GENETICS: 'Genetic Testing',
  TUMOR_MARKERS: 'Tumor Markers'
};

interface CategoryMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface MappingStatus {
  state: 'idle' | 'processing' | 'complete' | 'error';
  processed: number;
  total: number;
  updated: number;
  errors: string[];
  message: string;
}

interface MappingConfig {
  includeImaging: boolean;
  includeLaboratory: boolean;
  useStrictMatching: boolean;
}

const CategoryMappingModal: React.FC<CategoryMappingModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('configure');
  const [mappingStatus, setMappingStatus] = useState<MappingStatus>({
    state: 'idle',
    processed: 0,
    total: 0,
    updated: 0,
    errors: [],
    message: ''
  });
  const [mappingConfig, setMappingConfig] = useState<MappingConfig>({
    includeImaging: true,
    includeLaboratory: true,
    useStrictMatching: false
  });
  const [testsToMap, setTestsToMap] = useState<Test[]>([]);
  
  // Get all tests
  const { data: testsData, isLoading } = useQuery({
    queryKey: ['/api/tests'],
  });
  
  // Get tests that need mapping
  useEffect(() => {
    if (testsData) {
      const tests = ((testsData as any)?.tests || []) as Test[];
      const needsMappingTests = tests.filter(test => {
        // For Imaging Studies
        if (mappingConfig.includeImaging && test.category === TestCategory.IMAGING) {
          return !test.subCategory || !Object.values(ImagingSubCategories).includes(test.subCategory);
        }
        
        // For Laboratory Tests
        if (mappingConfig.includeLaboratory && test.category === TestCategory.LABORATORY) {
          return !test.subCategory || !Object.values(LabSubCategories).includes(test.subCategory);
        }
        
        return false;
      });
      
      setTestsToMap(needsMappingTests);
    }
  }, [testsData, mappingConfig.includeImaging, mappingConfig.includeLaboratory]);
  
  // Update test mutation
  const updateTestMutation = useMutation({
    mutationFn: async (test: Test) => {
      const response = await fetch(`/api/tests/${test.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update test ${test.id}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // No need to show individual success toasts as we'll show a summary at the end
    },
    onError: (error, variables) => {
      setMappingStatus(prev => ({
        ...prev,
        errors: [...prev.errors, `Failed to update test ${variables.id}: ${error.message}`]
      }));
    }
  });
  
  // Function to determine subcategory based on test name
  const determineSubcategory = (test: Test): string | null => {
    const testName = test.name.toLowerCase();
    
    if (test.category === TestCategory.IMAGING) {
      // Pattern matching for imaging subcategories
      if (testName.includes('ct') || testName.includes('computed tomography')) {
        return ImagingSubCategories.CT;
      } else if (testName.includes('mri') || testName.includes('magnetic resonance')) {
        return ImagingSubCategories.MRI;
      } else if (testName.includes('ultrasound') || testName.includes('sonogram') || testName.includes('echo')) {
        return ImagingSubCategories.ULTRASOUND;
      } else if (testName.includes('mammogram') || testName.includes('mammography') || testName.includes('breast imaging')) {
        return ImagingSubCategories.MAMMOGRAPHY;
      } else if (testName.includes('nuclear')) {
        return ImagingSubCategories.NUCLEAR;
      } else if (testName.includes('pet')) {
        return ImagingSubCategories.PET;
      } else if (testName.includes('fluoroscop')) {
        return ImagingSubCategories.FLUOROSCOPY;
      } else if (testName.includes('dexa') || testName.includes('bone density')) {
        return ImagingSubCategories.DENSITOMETRY;
      } else if (testName.includes('angiogram') || testName.includes('angiography')) {
        return ImagingSubCategories.ANGIOGRAPHY;
      } else if (testName.includes('x-ray') || testName.includes('xray') || testName.includes('radiogra')) {
        return ImagingSubCategories.RADIOGRAPHY;
      }
      
      // If no match found and not using strict matching, use a default
      if (!mappingConfig.useStrictMatching) {
        return ImagingSubCategories.RADIOGRAPHY; // Default subcategory for Imaging
      }
    } 
    else if (test.category === TestCategory.LABORATORY) {
      // Pattern matching for laboratory subcategories
      if (testName.includes('hemato') || testName.includes('blood count') || testName.includes('cbc')) {
        return LabSubCategories.HEMATOLOGY;
      } else if (testName.includes('chem') || testName.includes('electrolyte') || testName.includes('glucose')) {
        return LabSubCategories.CHEMISTRY;
      } else if (testName.includes('micro') || testName.includes('culture') || testName.includes('bacter')) {
        return LabSubCategories.MICROBIOLOGY;
      } else if (testName.includes('immun') || testName.includes('serology') || testName.includes('antibody')) {
        return LabSubCategories.IMMUNOLOGY;
      } else if (testName.includes('molecul') || testName.includes('dna') || testName.includes('rna') || testName.includes('pcr')) {
        return LabSubCategories.MOLECULAR;
      } else if (testName.includes('tox') || testName.includes('drug screen') || testName.includes('alcohol')) {
        return LabSubCategories.TOXICOLOGY;
      } else if (testName.includes('urin') || testName.includes('ua ')) {
        return LabSubCategories.URINALYSIS;
      } else if (testName.includes('endocrin') || testName.includes('hormone') || testName.includes('thyroid')) {
        return LabSubCategories.ENDOCRINOLOGY;
      } else if (testName.includes('genetic') || testName.includes('gene') || testName.includes('chromosome')) {
        return LabSubCategories.GENETICS;
      } else if (testName.includes('tumor') || testName.includes('cancer') || testName.includes('marker')) {
        return LabSubCategories.TUMOR_MARKERS;
      }
      
      // If no match found and not using strict matching, use a default
      if (!mappingConfig.useStrictMatching) {
        return LabSubCategories.CHEMISTRY; // Default subcategory for Laboratory
      }
    }
    
    return null; // If no match and strict matching enabled
  };
  
  // Start the mapping process
  const startMapping = async () => {
    // Switch to the progress tab
    setActiveTab('progress');
    
    // Reset mapping status
    setMappingStatus({
      state: 'processing',
      processed: 0,
      total: testsToMap.length,
      updated: 0,
      errors: [],
      message: 'Processing tests...'
    });
    
    // Process each test
    let updatedCount = 0;
    
    for (let i = 0; i < testsToMap.length; i++) {
      const test = testsToMap[i];
      const newSubCategory = determineSubcategory(test);
      
      // Update the test if a valid subcategory was determined
      if (newSubCategory) {
        try {
          const updatedTest = { ...test, subCategory: newSubCategory };
          await updateTestMutation.mutateAsync(updatedTest);
          updatedCount++;
        } catch (error) {
          // Error handling is done in the mutation's onError callback
        }
      }
      
      // Update progress
      setMappingStatus(prev => ({
        ...prev,
        processed: i + 1,
        updated: updatedCount,
        message: `Processed ${i + 1} of ${testsToMap.length} tests...`
      }));
    }
    
    // Complete the mapping process
    setMappingStatus(prev => ({
      ...prev,
      state: 'complete',
      message: `Completed mapping ${updatedCount} tests out of ${testsToMap.length}`
    }));
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
    
    // Show completion toast
    toast({
      title: "Category Mapping Complete",
      description: `Successfully mapped ${updatedCount} tests to appropriate subcategories.`,
    });
    
    // Switch to results tab
    setActiveTab('results');
  };
  
  // Handle dialog close
  const handleClose = () => {
    if (mappingStatus.state === 'processing') {
      // Confirm if the user wants to cancel the operation
      if (window.confirm('Mapping is in progress. Are you sure you want to cancel?')) {
        onClose();
      }
    } else {
      onClose();
      
      // Call onComplete if the mapping was completed
      if (mappingStatus.state === 'complete') {
        onComplete();
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Layers className="h-5 w-5 mr-2" />
            Category Mapping
          </DialogTitle>
          <DialogDescription>
            Map tests to appropriate categories and subcategories automatically
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="configure" value={activeTab} className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="configure" disabled={mappingStatus.state === 'processing'}>
              Configure
            </TabsTrigger>
            <TabsTrigger value="progress" disabled={mappingStatus.state === 'idle'}>
              Progress
            </TabsTrigger>
            <TabsTrigger value="results" disabled={mappingStatus.state !== 'complete'}>
              Results
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="configure" className="py-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Configuration Options</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose which test categories to include in the mapping process
                </p>
                
                <div className="flex items-center space-x-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="includeImaging" 
                    checked={mappingConfig.includeImaging}
                    onChange={e => setMappingConfig({ ...mappingConfig, includeImaging: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
                  />
                  <label htmlFor="includeImaging">Include Imaging Studies</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="includeLaboratory" 
                    checked={mappingConfig.includeLaboratory}
                    onChange={e => setMappingConfig({ ...mappingConfig, includeLaboratory: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
                  />
                  <label htmlFor="includeLaboratory">Include Laboratory Tests</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="useStrictMatching" 
                    checked={mappingConfig.useStrictMatching}
                    onChange={e => setMappingConfig({ ...mappingConfig, useStrictMatching: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
                  />
                  <label htmlFor="useStrictMatching">Use strict matching (only map tests with clear matches)</label>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Tests to Map</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {isLoading ? "Loading..." : `${testsToMap.length} tests will be mapped based on your criteria`}
                </p>
                
                {testsToMap.length === 0 && !isLoading && (
                  <div className="flex items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>No tests found that need mapping with the current criteria.</span>
                  </div>
                )}
                
                {testsToMap.length > 0 && (
                  <div className="h-40 overflow-y-auto border rounded-md p-2">
                    <div className="space-y-1">
                      {testsToMap.slice(0, 100).map(test => (
                        <div key={test.id} className="flex items-center justify-between text-sm py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                          <span>{test.name}</span>
                          <Badge variant="outline">{test.category}</Badge>
                        </div>
                      ))}
                      {testsToMap.length > 100 && (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-1">
                          ...and {testsToMap.length - 100} more tests
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="progress" className="py-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Mapping Progress</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {mappingStatus.message}
                </p>
                
                <div className="space-y-2">
                  <Progress 
                    value={mappingStatus.total > 0 ? (mappingStatus.processed / mappingStatus.total) * 100 : 0} 
                    className="h-2 w-full"
                  />
                  
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{`${mappingStatus.processed} of ${mappingStatus.total} processed`}</span>
                    <span>{`${mappingStatus.updated} tests updated`}</span>
                  </div>
                </div>
              </div>
              
              {mappingStatus.errors.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-red-500 dark:text-red-400">Errors</h3>
                  <div className="mt-2 h-32 overflow-y-auto border border-red-200 dark:border-red-900/50 rounded-md p-2 bg-red-50 dark:bg-red-900/20">
                    <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-300">
                      {mappingStatus.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="py-4">
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-medium text-green-700 dark:text-green-300">Mapping Complete</h3>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Successfully mapped {mappingStatus.updated} tests out of {mappingStatus.total}.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">Processed Tests</h4>
                  <p className="text-3xl font-bold">{mappingStatus.processed}</p>
                </div>
                
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">Updated Tests</h4>
                  <p className="text-3xl font-bold">{mappingStatus.updated}</p>
                </div>
              </div>
              
              {mappingStatus.errors.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-red-500 dark:text-red-400">Errors Encountered</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {mappingStatus.errors.length} errors occurred during the mapping process.
                  </p>
                  
                  <div className="mt-2 max-h-32 overflow-y-auto border border-red-200 dark:border-red-900/50 rounded-md p-2 bg-red-50 dark:bg-red-900/20">
                    <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-300">
                      {mappingStatus.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          {activeTab === 'configure' && (
            <Button 
              onClick={startMapping}
              disabled={testsToMap.length === 0 || mappingStatus.state === 'processing'}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Start Mapping
            </Button>
          )}
          
          {activeTab === 'progress' && mappingStatus.state === 'processing' && (
            <Button disabled className="bg-gray-400 text-white">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Mapping in Progress...
            </Button>
          )}
          
          {mappingStatus.state === 'complete' && (
            <Button 
              onClick={handleClose}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryMappingModal;