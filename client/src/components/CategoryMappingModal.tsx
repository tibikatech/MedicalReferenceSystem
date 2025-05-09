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
  GASTRO: 'Gastrointestinal Tests',
  SPECIALTY: 'Specialty-Specific Tests',
  FUNCTIONAL: 'Functional Tests'
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

const CardioSubCategories = {
  ECG: 'Electrocardiography',
  ECHO: 'Echocardiography',
  STRESS: 'Stress Testing',
  CATH: 'Cardiac Catheterization',
  EP: 'Electrophysiology Studies',
  VASCULAR: 'Vascular Studies'
};

const NeuroSubCategories = {
  EEG: 'Electroencephalography (EEG)',
  EMG: 'Electromyography (EMG)',
  NCS: 'Nerve Conduction Studies',
  EVOKED: 'Evoked Potentials',
  SLEEP: 'Sleep Studies'
};

const PulmonarySubCategories = {
  PFT: 'Pulmonary Function Tests',
  BRONCH: 'Bronchoscopy',
  ABG: 'Arterial Blood Gas Analysis'
};

const GastroSubCategories = {
  ENDO: 'Endoscopic Procedures',
  MANOMETRY: 'Manometry',
  BREATH: 'Breath Tests',
  MOTILITY: 'Motility Studies'
};

const SpecialtySubCategories = {
  OBGYN: 'Women\'s Health/OB-GYN',
  OPHTH: 'Ophthalmology',
  AUDIO: 'Audiology',
  DERM: 'Dermatology',
  ALLERGY: 'Allergology'
};

const FunctionalSubCategories = {
  EXERCISE: 'Exercise Tests',
  SWALLOW: 'Swallowing Studies',
  BALANCE: 'Balance Testing'
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
  includeCardiology: boolean;
  includeNeurology: boolean;
  includePulmonary: boolean;
  includeGastro: boolean;
  includeSpecialty: boolean;
  includeFunctional: boolean;
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
    includeCardiology: false,
    includeNeurology: false,
    includePulmonary: false, 
    includeGastro: false,
    includeSpecialty: false,
    includeFunctional: false,
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
        
        // For Cardiovascular Tests
        if (mappingConfig.includeCardiology && test.category === TestCategory.CARDIOLOGY) {
          return !test.subCategory || !Object.values(CardioSubCategories).includes(test.subCategory);
        }
        
        // For Neurological Tests
        if (mappingConfig.includeNeurology && test.category === TestCategory.NEUROLOGY) {
          return !test.subCategory || !Object.values(NeuroSubCategories).includes(test.subCategory);
        }
        
        // For Pulmonary Tests
        if (mappingConfig.includePulmonary && test.category === TestCategory.PULMONARY) {
          return !test.subCategory || !Object.values(PulmonarySubCategories).includes(test.subCategory);
        }
        
        // For Gastrointestinal Tests
        if (mappingConfig.includeGastro && test.category === TestCategory.GASTRO) {
          return !test.subCategory || !Object.values(GastroSubCategories).includes(test.subCategory);
        }
        
        // For Specialty Tests
        if (mappingConfig.includeSpecialty && test.category === TestCategory.SPECIALTY) {
          return !test.subCategory || !Object.values(SpecialtySubCategories).includes(test.subCategory);
        }
        
        // For Functional Tests
        if (mappingConfig.includeFunctional && test.category === TestCategory.FUNCTIONAL) {
          return !test.subCategory || !Object.values(FunctionalSubCategories).includes(test.subCategory);
        }
        
        return false;
      });
      
      setTestsToMap(needsMappingTests);
    }
  }, [
    testsData, 
    mappingConfig.includeImaging, 
    mappingConfig.includeLaboratory,
    mappingConfig.includeCardiology,
    mappingConfig.includeNeurology,
    mappingConfig.includePulmonary,
    mappingConfig.includeGastro,
    mappingConfig.includeSpecialty,
    mappingConfig.includeFunctional
  ]);
  
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
      } else if (testName.includes('ultrasound') || testName.includes('sonogram') || 
                (testName.includes('echo') && !testName.includes('echocardiogram'))) {
        return ImagingSubCategories.ULTRASOUND;
      } else if (testName.includes('mammogram') || testName.includes('mammography') || testName.includes('breast imaging')) {
        return ImagingSubCategories.MAMMOGRAPHY;
      } else if (testName.includes('nuclear') && !testName.includes('pet')) {
        return ImagingSubCategories.NUCLEAR;
      } else if (testName.includes('pet') || testName.includes('positron emission')) {
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
      if (testName.includes('hemato') || testName.includes('blood count') || testName.includes('cbc') || 
          testName.includes('hemoglobin') || testName.includes('platelet')) {
        return LabSubCategories.HEMATOLOGY;
      } else if (testName.includes('chem') || testName.includes('electrolyte') || testName.includes('glucose') || 
                testName.includes('sodium') || testName.includes('potassium') || testName.includes('chloride')) {
        return LabSubCategories.CHEMISTRY;
      } else if (testName.includes('micro') || testName.includes('culture') || testName.includes('bacter') || 
                testName.includes('fungal') || testName.includes('virus') || testName.includes('parasite')) {
        return LabSubCategories.MICROBIOLOGY;
      } else if (testName.includes('immun') || testName.includes('serology') || testName.includes('antibody') || 
                testName.includes('antigen') || testName.includes('complement')) {
        return LabSubCategories.IMMUNOLOGY;
      } else if (testName.includes('molecul') || testName.includes('dna') || testName.includes('rna') || 
                testName.includes('pcr') || testName.includes('sequencing')) {
        return LabSubCategories.MOLECULAR;
      } else if (testName.includes('tox') || testName.includes('drug screen') || testName.includes('alcohol') || 
                testName.includes('substance')) {
        return LabSubCategories.TOXICOLOGY;
      } else if (testName.includes('urin') || testName.includes('ua ') || 
                testName.includes('urine')) {
        return LabSubCategories.URINALYSIS;
      } else if (testName.includes('endocrin') || testName.includes('hormone') || testName.includes('thyroid') || 
                testName.includes('cortisol') || testName.includes('insulin')) {
        return LabSubCategories.ENDOCRINOLOGY;
      } else if (testName.includes('genetic') || testName.includes('gene') || testName.includes('chromosome') || 
                testName.includes('karyotype') || testName.includes('mutation')) {
        return LabSubCategories.GENETICS;
      } else if (testName.includes('tumor') || testName.includes('cancer') || testName.includes('marker') || 
                testName.includes('oncology') || testName.includes('ca-')) {
        return LabSubCategories.TUMOR_MARKERS;
      }
      
      // If no match found and not using strict matching, use a default
      if (!mappingConfig.useStrictMatching) {
        return LabSubCategories.CHEMISTRY; // Default subcategory for Laboratory
      }
    }
    else if (test.category === TestCategory.CARDIOLOGY) {
      // Pattern matching for cardiology subcategories
      if (testName.includes('ecg') || testName.includes('ekg') || testName.includes('electrocard')) {
        return CardioSubCategories.ECG;
      } else if (testName.includes('echocardiogram') || testName.includes('echocardiography')) {
        return CardioSubCategories.ECHO;
      } else if (testName.includes('stress test') || testName.includes('exercise test') || 
                 testName.includes('treadmill') || testName.includes('stress echo')) {
        return CardioSubCategories.STRESS;
      } else if (testName.includes('cath') || testName.includes('angioplasty') || 
                 testName.includes('coronary')) {
        return CardioSubCategories.CATH;
      } else if (testName.includes('electrophysiology') || testName.includes('ep study')) {
        return CardioSubCategories.EP;
      } else if (testName.includes('vascular') || testName.includes('doppler') || 
                testName.includes('venous') || testName.includes('arterial')) {
        return CardioSubCategories.VASCULAR;
      }
      
      // If no match found and not using strict matching, use a default
      if (!mappingConfig.useStrictMatching) {
        return CardioSubCategories.ECG; // Default subcategory for Cardiology
      }
    }
    else if (test.category === TestCategory.NEUROLOGY) {
      // Pattern matching for neurology subcategories
      if (testName.includes('eeg') || testName.includes('electroencephalogram') || 
          testName.includes('brain wave')) {
        return NeuroSubCategories.EEG;
      } else if (testName.includes('emg') || testName.includes('electromyography') || 
                testName.includes('muscle test')) {
        return NeuroSubCategories.EMG;
      } else if (testName.includes('nerve conduction') || testName.includes('ncs')) {
        return NeuroSubCategories.NCS;
      } else if (testName.includes('evoked potential') || testName.includes('visual evoked') || 
                testName.includes('auditory evoked') || testName.includes('somatosensory')) {
        return NeuroSubCategories.EVOKED;
      } else if (testName.includes('sleep study') || testName.includes('polysomnography') || 
                testName.includes('sleep apnea')) {
        return NeuroSubCategories.SLEEP;
      }
      
      // If no match found and not using strict matching, use a default
      if (!mappingConfig.useStrictMatching) {
        return NeuroSubCategories.EEG; // Default subcategory for Neurology
      }
    }
    else if (test.category === TestCategory.PULMONARY) {
      // Pattern matching for pulmonary subcategories
      if (testName.includes('pulmonary function') || testName.includes('pft') || 
          testName.includes('spirometry') || testName.includes('lung function')) {
        return PulmonarySubCategories.PFT;
      } else if (testName.includes('bronchoscopy') || testName.includes('bronchial')) {
        return PulmonarySubCategories.BRONCH;
      } else if (testName.includes('abg') || testName.includes('arterial blood gas') || 
                testName.includes('blood gas')) {
        return PulmonarySubCategories.ABG;
      }
      
      // If no match found and not using strict matching, use a default
      if (!mappingConfig.useStrictMatching) {
        return PulmonarySubCategories.PFT; // Default subcategory for Pulmonary
      }
    }
    else if (test.category === TestCategory.GASTRO) {
      // Pattern matching for gastro subcategories
      if (testName.includes('endoscopy') || testName.includes('colonoscopy') || 
          testName.includes('egd') || testName.includes('gastroscopy')) {
        return GastroSubCategories.ENDO;
      } else if (testName.includes('manometry') || testName.includes('pressure measurement')) {
        return GastroSubCategories.MANOMETRY;
      } else if (testName.includes('breath test') || testName.includes('hydrogen') || 
                testName.includes('h. pylori')) {
        return GastroSubCategories.BREATH;
      } else if (testName.includes('motility') || testName.includes('transit study')) {
        return GastroSubCategories.MOTILITY;
      }
      
      // If no match found and not using strict matching, use a default
      if (!mappingConfig.useStrictMatching) {
        return GastroSubCategories.ENDO; // Default subcategory for Gastro
      }
    }
    else if (test.category === TestCategory.SPECIALTY) {
      // Pattern matching for specialty subcategories
      if (testName.includes('obstetric') || testName.includes('gynecologic') || 
          testName.includes('obgyn') || testName.includes('pap') || testName.includes('pelvic')) {
        return SpecialtySubCategories.OBGYN;
      } else if (testName.includes('eye') || testName.includes('vision') || 
                testName.includes('retina') || testName.includes('ophthalm')) {
        return SpecialtySubCategories.OPHTH;
      } else if (testName.includes('audio') || testName.includes('hearing') || 
                testName.includes('tympanometry')) {
        return SpecialtySubCategories.AUDIO;
      } else if (testName.includes('skin') || testName.includes('dermatology') || 
                testName.includes('biopsy')) {
        return SpecialtySubCategories.DERM;
      } else if (testName.includes('allerg') || testName.includes('patch test') || 
                testName.includes('sensitivity')) {
        return SpecialtySubCategories.ALLERGY;
      }
      
      // If no match found and not using strict matching, use a default
      if (!mappingConfig.useStrictMatching) {
        return SpecialtySubCategories.DERM; // Default subcategory for Specialty
      }
    }
    else if (test.category === TestCategory.FUNCTIONAL) {
      // Pattern matching for functional subcategories
      if (testName.includes('exercise') || testName.includes('fitness')) {
        return FunctionalSubCategories.EXERCISE;
      } else if (testName.includes('swallow') || testName.includes('deglutition')) {
        return FunctionalSubCategories.SWALLOW;
      } else if (testName.includes('balance') || testName.includes('posturography') || 
                testName.includes('vestibular')) {
        return FunctionalSubCategories.BALANCE;
      }
      
      // If no match found and not using strict matching, use a default
      if (!mappingConfig.useStrictMatching) {
        return FunctionalSubCategories.EXERCISE; // Default subcategory for Functional
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
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center space-x-2">
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
                      id="includeCardiology" 
                      checked={mappingConfig.includeCardiology}
                      onChange={e => setMappingConfig({ ...mappingConfig, includeCardiology: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
                    />
                    <label htmlFor="includeCardiology">Include Cardiovascular Tests</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="includeNeurology" 
                      checked={mappingConfig.includeNeurology}
                      onChange={e => setMappingConfig({ ...mappingConfig, includeNeurology: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
                    />
                    <label htmlFor="includeNeurology">Include Neurological Tests</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="includePulmonary" 
                      checked={mappingConfig.includePulmonary}
                      onChange={e => setMappingConfig({ ...mappingConfig, includePulmonary: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
                    />
                    <label htmlFor="includePulmonary">Include Pulmonary Tests</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="includeGastro" 
                      checked={mappingConfig.includeGastro}
                      onChange={e => setMappingConfig({ ...mappingConfig, includeGastro: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
                    />
                    <label htmlFor="includeGastro">Include Gastrointestinal Tests</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="includeSpecialty" 
                      checked={mappingConfig.includeSpecialty}
                      onChange={e => setMappingConfig({ ...mappingConfig, includeSpecialty: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
                    />
                    <label htmlFor="includeSpecialty">Include Specialty Tests</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="includeFunctional" 
                      checked={mappingConfig.includeFunctional}
                      onChange={e => setMappingConfig({ ...mappingConfig, includeFunctional: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
                    />
                    <label htmlFor="includeFunctional">Include Functional Tests</label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-4 border-t pt-4">
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