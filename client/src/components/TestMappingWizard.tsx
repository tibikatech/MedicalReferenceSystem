import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  HelpCircle, 
  ArrowRight, 
  Check, 
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { Badge } from './ui/badge';

interface TestMappingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  csvHeaders: string[];
  csvPreviewRows: string[][];
  onComplete: (mapping: Record<string, string>) => void;
  isDarkMode?: boolean;
}

const TestMappingWizard: React.FC<TestMappingWizardProps> = ({
  isOpen,
  onClose,
  csvHeaders,
  csvPreviewRows,
  onComplete,
  isDarkMode = true
}) => {
  // Define the target fields that need mapping
  const targetFields = [
    {
      field: 'id',
      required: true,
      description: 'Unique identifier for the test',
      examples: ['TTES-LAB-HMT-85027', 'TTES-IMG-XRG-71046'],
      format: 'TTES-{CATEGORY}-{SUBCATEGORY}-{CPTCODE}'
    },
    {
      field: 'name',
      required: true,
      description: 'The name of the test',
      examples: ['Complete Blood Count', 'Chest X-ray PA and Lateral']
    },
    {
      field: 'category',
      required: true,
      description: 'Main category of the test',
      examples: ['Laboratory Tests', 'Imaging Studies']
    },
    {
      field: 'subCategory',
      required: false,
      description: 'Subcategory of the test',
      examples: ['Hematology', 'Radiography']
    },
    {
      field: 'cptCode',
      required: true,
      description: 'CPT code for the test',
      examples: ['85027', '71046']
    },
    {
      field: 'loincCode',
      required: false,
      description: 'LOINC code (mainly for Laboratory tests)',
      examples: ['58410-2', '']
    },
    {
      field: 'snomedCode',
      required: false,
      description: 'SNOMED CT code (mainly for Imaging tests)',
      examples: ['', '399208008']
    },
    {
      field: 'description',
      required: false,
      description: 'Description of the test',
      examples: ['CBC test measures various components of blood', 'Standard two-view chest radiograph']
    },
    {
      field: 'notes',
      required: false,
      description: 'Additional notes about the test',
      examples: ['', '']
    }
  ];

  // Special constant for null mapping
  const NULL_MAPPING = "__NULL__";

  // State for the current mapping
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  // State for validation status
  const [validationStatus, setValidationStatus] = useState<Record<string, boolean>>({});
  
  // State for auto-mapping status
  const [autoMappingStatus, setAutoMappingStatus] = useState<string | null>(null);

  // Automatically suggest mappings when component mounts
  useEffect(() => {
    if (isOpen && csvHeaders.length > 0) {
      suggestMappings();
    }
  }, [isOpen, csvHeaders]);

  // Check if a field is mapped
  const isFieldMapped = (fieldName: string): boolean => {
    return !!mapping[fieldName] && mapping[fieldName] !== NULL_MAPPING;
  };

  // Check if all required fields are mapped
  const areRequiredFieldsMapped = (): boolean => {
    return targetFields
      .filter(field => field.required)
      .every(field => isFieldMapped(field.field));
  };

  // Get suggested source field for a target field
  const getSuggestedSourceField = (targetField: string): string | null => {
    // If headers include the exact field name, suggest that
    const exactMatch = csvHeaders.find(
      header => header.toLowerCase() === targetField.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Look for headers that include the target field name
    const partialMatch = csvHeaders.find(
      header => header.toLowerCase().includes(targetField.toLowerCase())
    );
    if (partialMatch) return partialMatch;

    // For common field variations
    if (targetField === 'id') {
      const idVariations = csvHeaders.find(
        header => header.toLowerCase() === 'test_id' || 
                  header.toLowerCase() === 'testid' || 
                  header.toLowerCase() === 'test-id'
      );
      if (idVariations) return idVariations;
    }
    
    if (targetField === 'name') {
      const nameVariations = csvHeaders.find(
        header => header.toLowerCase() === 'test_name' || 
                  header.toLowerCase() === 'testname' || 
                  header.toLowerCase() === 'test-name'
      );
      if (nameVariations) return nameVariations;
    }
    
    if (targetField === 'category') {
      const categoryVariations = csvHeaders.find(
        header => header.toLowerCase() === 'test_category' || 
                  header.toLowerCase() === 'testcategory' || 
                  header.toLowerCase() === 'test-category'
      );
      if (categoryVariations) return categoryVariations;
    }
    
    if (targetField === 'subCategory') {
      const subCategoryVariations = csvHeaders.find(
        header => header.toLowerCase() === 'sub_category' || 
                  header.toLowerCase() === 'subcategory' || 
                  header.toLowerCase() === 'sub-category' ||
                  header.toLowerCase() === 'test_subcategory'
      );
      if (subCategoryVariations) return subCategoryVariations;
    }
    
    // Handle snake_case to camelCase conversion check (for API compatibility)
    if (targetField === 'cptCode') {
      const cptCodeVariations = csvHeaders.find(
        header => header.toLowerCase() === 'cpt_code' || 
                  header.toLowerCase() === 'cpt-code' ||
                  header.toLowerCase() === 'cpt'
      );
      if (cptCodeVariations) return cptCodeVariations;
    }
    
    if (targetField === 'loincCode') {
      const loincCodeVariations = csvHeaders.find(
        header => header.toLowerCase() === 'loinc_code' || 
                  header.toLowerCase() === 'loinc-code' ||
                  header.toLowerCase() === 'loinc'
      );
      if (loincCodeVariations) return loincCodeVariations;
    }
    
    if (targetField === 'snomedCode') {
      const snomedCodeVariations = csvHeaders.find(
        header => header.toLowerCase() === 'snomed_code' || 
                  header.toLowerCase() === 'snomed-code' ||
                  header.toLowerCase() === 'snomed'
      );
      if (snomedCodeVariations) return snomedCodeVariations;
    }

    return null;
  };

  // Suggest mappings automatically
  const suggestMappings = () => {
    setAutoMappingStatus('Auto-mapping fields...');
    const suggestedMapping: Record<string, string> = {};
    
    // Try to suggest mappings for each target field
    targetFields.forEach(({ field }) => {
      const suggestedSource = getSuggestedSourceField(field);
      if (suggestedSource) {
        suggestedMapping[field] = suggestedSource;
      }
    });
    
    setMapping(suggestedMapping);
    validateMappings(suggestedMapping);
    setAutoMappingStatus('Auto-mapping complete');
    
    // Clear status after a delay
    setTimeout(() => {
      setAutoMappingStatus(null);
    }, 3000);
  };

  // Handle mapping change
  const handleMappingChange = (targetField: string, sourceField: string) => {
    const newMapping = { ...mapping };
    
    if (sourceField === NULL_MAPPING) {
      // If selecting "Do not map", remove the mapping
      delete newMapping[targetField];
    } else {
      newMapping[targetField] = sourceField;
    }
    
    setMapping(newMapping);
    validateMappings(newMapping);
  };

  // Validate the mappings
  const validateMappings = (currentMapping: Record<string, string>) => {
    const newValidationStatus: Record<string, boolean> = {};
    
    // Check if required fields are mapped
    targetFields.forEach(({ field, required }) => {
      if (required) {
        newValidationStatus[field] = !!currentMapping[field];
      } else {
        // Non-required fields are always valid
        newValidationStatus[field] = true;
      }
    });
    
    setValidationStatus(newValidationStatus);
  };

  // Get sample values for a CSV header
  const getSampleValues = (headerName: string): string[] => {
    if (!csvPreviewRows || csvPreviewRows.length === 0) return ['No samples available'];
    
    const headerIndex = csvHeaders.indexOf(headerName);
    if (headerIndex === -1) return ['Column not found'];
    
    // Get up to 3 unique sample values
    const sampleValues = Array.from(new Set(
      csvPreviewRows
        .map(row => row[headerIndex])
        .filter(Boolean)
        .slice(0, 3)
    ));
    
    return sampleValues.length > 0 ? sampleValues : ['No data'];
  };

  // Handle completion
  const handleComplete = () => {
    if (areRequiredFieldsMapped()) {
      onComplete(mapping);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-400 flex items-center gap-2">
            Map Your CSV Fields
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full bg-blue-900 text-blue-300"
              onClick={suggestMappings}
            >
              <RotateCw className="h-3 w-3" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <p className="text-gray-400 mb-4">
          Match your CSV fields to the corresponding fields in the Medical Test Reference system.
          {autoMappingStatus && (
            <Badge className="ml-2 bg-blue-600">{autoMappingStatus}</Badge>
          )}
        </p>
        
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h4 className="text-md font-medium mb-4">Mapping Preview</h4>
          
          <div className="grid grid-cols-3 gap-4 mb-4 border-b border-gray-700 pb-2">
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Your CSV Headers</p>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-green-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Medical Test Fields</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {targetFields.map(({ field, required, description, examples }) => (
              <div key={field} className="grid grid-cols-3 gap-4 items-start">
                <div>
                  <Select
                    value={mapping[field] || ''}
                    onValueChange={(value) => handleMappingChange(field, value)}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select CSV column" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      <SelectItem value={NULL_MAPPING}>Do not map</SelectItem>
                      {csvHeaders.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {mapping[field] && mapping[field] !== NULL_MAPPING && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Sample values:</p>
                      <div className="space-y-1">
                        {getSampleValues(mapping[field]).map((sample, index) => (
                          <div key={index} className="bg-gray-700 rounded text-xs p-1 truncate">
                            {sample}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-center h-full">
                  {mapping[field] ? (
                    <div className="w-full h-px bg-green-500" />
                  ) : (
                    <div className="w-full h-px bg-gray-600" />
                  )}
                </div>
                
                <div>
                  <div className="flex items-center">
                    <span className={`text-${isFieldMapped(field) ? 'blue' : 'gray'}-400 text-sm`}>
                      {field} {required && <span className="text-red-400">*</span>}
                    </span>
                    {!isFieldMapped(field) && required && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
                    )}
                    <HelpCircle className="h-4 w-4 text-gray-500 ml-1" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{description}</p>
                  {examples && examples[0] && (
                    <div className="mt-1">
                      <p className="text-xs text-gray-500">Example: {examples[0]}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {areRequiredFieldsMapped() ? (
          <div className="bg-green-900 bg-opacity-40 border border-green-700 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <div>
                <p className="text-green-300 font-medium">All required fields are mapped. Ready to proceed!</p>
                <p className="text-green-400 text-sm">You can now proceed with the import process.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-900 bg-opacity-40 border border-yellow-700 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
              <div>
                <p className="text-yellow-300 font-medium">Some required fields are not mapped</p>
                <p className="text-yellow-400 text-sm">Please map all fields marked with an asterisk (*) to continue.</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={!areRequiredFieldsMapped()}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            Continue with Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestMappingWizard;