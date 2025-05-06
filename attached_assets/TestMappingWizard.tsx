import React, { useState, useEffect } from 'react';
import { Check, X, ArrowRight, RefreshCw, AlertTriangle, HelpCircle } from 'lucide-react';

interface TestMappingWizardProps {
  csvHeaders: string[];
  csvPreviewRows: string[][];
  onComplete: (mapping: Record<string, string>) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

const TestMappingWizard: React.FC<TestMappingWizardProps> = ({
  csvHeaders,
  csvPreviewRows,
  onComplete,
  onCancel,
  isDarkMode
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
      examples: ['Laboratory', 'Imaging Studies']
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
    suggestMappings();
  }, []);

  // Check if a field is mapped
  const isFieldMapped = (fieldName: string): boolean => {
    return !!mapping[fieldName];
  };

  // Check if all required fields are mapped
  const areRequiredFieldsMapped = (): boolean => {
    return targetFields
      .filter(field => field.required)
      .every(field => isFieldMapped(field.field) && mapping[field.field] !== NULL_MAPPING);
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

    // Special cases
    switch (targetField) {
      case 'id':
        return csvHeaders.find(h => 
          h.toLowerCase().includes('id') || 
          h.toLowerCase().includes('code') || 
          h.toLowerCase().includes('identifier')
        ) || null;
      case 'name':
        return csvHeaders.find(h => 
          h.toLowerCase().includes('name') || 
          h.toLowerCase().includes('test') || 
          h.toLowerCase().includes('procedure')
        ) || null;
      case 'category':
        return csvHeaders.find(h => 
          h.toLowerCase().includes('category') || 
          h.toLowerCase().includes('type') || 
          h.toLowerCase().includes('group')
        ) || null;
      case 'subCategory':
        return csvHeaders.find(h => 
          h.toLowerCase().includes('sub') || 
          h.toLowerCase().includes('subtype') || 
          h.toLowerCase().includes('subgroup') ||
          h.toLowerCase().includes('sub-category')
        ) || null;
      case 'cptCode':
        return csvHeaders.find(h => 
          h.toLowerCase().includes('cpt') || 
          h.toLowerCase().includes('procedure code')
        ) || null;
      case 'loincCode':
        return csvHeaders.find(h => 
          h.toLowerCase().includes('loinc')
        ) || null;
      case 'snomedCode':
        return csvHeaders.find(h => 
          h.toLowerCase().includes('snomed') || 
          h.toLowerCase().includes('ct code')
        ) || null;
      case 'description':
        return csvHeaders.find(h => 
          h.toLowerCase().includes('desc') || 
          h.toLowerCase().includes('about') || 
          h.toLowerCase().includes('detail')
        ) || null;
      case 'notes':
        return csvHeaders.find(h => 
          h.toLowerCase().includes('note') || 
          h.toLowerCase().includes('comment') || 
          h.toLowerCase().includes('additional')
        ) || null;
      default:
        return null;
    }
  };

  // Auto-suggest mappings based on header names
  const suggestMappings = () => {
    setAutoMappingStatus('Processing...');
    
    const newMapping: Record<string, string> = {};
    const newValidationStatus: Record<string, boolean> = {};

    // For each target field, try to find a matching source field
    targetFields.forEach(targetField => {
      const suggestedField = getSuggestedSourceField(targetField.field);
      if (suggestedField) {
        newMapping[targetField.field] = suggestedField;
        newValidationStatus[targetField.field] = true;
      }
    });

    setMapping(newMapping);
    setValidationStatus(newValidationStatus);
    setAutoMappingStatus('Auto-mapping complete');
    
    // Clear the status after 3 seconds
    setTimeout(() => {
      setAutoMappingStatus(null);
    }, 3000);
  };

  // Handle mapping change
  const handleMappingChange = (targetField: string, sourceField: string) => {
    setMapping(prev => ({
      ...prev,
      [targetField]: sourceField
    }));

    // Validate the mapping
    validateMapping(targetField, sourceField);
  };

  // Validate a mapping
  const validateMapping = (targetField: string, sourceField: string) => {
    // For non-required fields, if mapped as null, consider as valid
    const isRequired = targetFields.find(f => f.field === targetField)?.required;
    
    let isValid = false;
    if (sourceField === NULL_MAPPING) {
      // If field is required, NULL_MAPPING is invalid
      // If field is not required, NULL_MAPPING is valid
      isValid = !isRequired;
    } else {
      // For all other mappings, just check if there's a value
      isValid = sourceField !== '';
    }
    
    setValidationStatus(prev => ({
      ...prev,
      [targetField]: isValid
    }));
  };

  // Get the sample values for a source field
  const getSampleValues = (sourceField: string): string[] => {
    if (!sourceField || sourceField === NULL_MAPPING) return [];
    
    const sourceIndex = csvHeaders.indexOf(sourceField);
    if (sourceIndex === -1) return [];
    
    return csvPreviewRows.map(row => row[sourceIndex] || '').filter(Boolean).slice(0, 3);
  };

  // Complete the mapping process
  const completeMappingSetup = () => {
    if (areRequiredFieldsMapped()) {
      // Convert NULL_MAPPING to empty string before passing to parent
      const processedMapping = Object.entries(mapping).reduce((acc, [key, value]) => {
        acc[key] = value === NULL_MAPPING ? '' : value;
        return acc;
      }, {} as Record<string, string>);
      
      onComplete(processedMapping);
    }
  };

  // Get CSS classes for the mapping line
  const getMappingLineClasses = (targetField: string): string => {
    const baseClasses = "flex-grow border-t-2 mx-2";
    
    if (!isFieldMapped(targetField)) {
      return `${baseClasses} ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} border-dashed`;
    }
    
    if (validationStatus[targetField]) {
      return `${baseClasses} ${isDarkMode ? 'border-green-500' : 'border-green-600'}`;
    }
    
    return `${baseClasses} ${isDarkMode ? 'border-red-500' : 'border-red-600'}`;
  };

  return (
    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
          Map Your CSV Fields
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={suggestMappings}
            className={`px-3 py-1 rounded-md text-sm flex items-center ${
              isDarkMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            <RefreshCw size={14} className="mr-1" />
            Auto-Map Fields
          </button>
          <button
            onClick={onCancel}
            className={`p-1 rounded-full ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {autoMappingStatus && (
        <div className={`mb-4 p-3 rounded-md text-sm ${
          isDarkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800'
        }`}>
          {autoMappingStatus}
        </div>
      )}
      
      <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Match your CSV fields to the corresponding fields in the Medical Test Reference system.
      </p>
      
      <div className="mb-6">
        <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Mapping Preview
        </h3>
        <div className={`p-4 rounded-md ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} overflow-x-auto`}>
          <div className="flex items-center mb-2">
            <div className="w-1/3 font-medium">Your CSV Headers</div>
            <div className="w-1/3 text-center">Mapping</div>
            <div className="w-1/3 font-medium">Medical Test Fields</div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {targetFields.map(field => (
              <div key={field.field} className="flex items-center">
                <div className="w-1/3">
                  <select
                    value={mapping[field.field] || ''}
                    onChange={(e) => handleMappingChange(field.field, e.target.value)}
                    className={`w-full px-3 py-2 rounded-md border ${
                      !isFieldMapped(field.field) && field.required
                        ? (isDarkMode ? 'border-red-600 bg-red-900/20' : 'border-red-300 bg-red-50')
                        : isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                    }`}
                  >
                    <option value="">-- Select CSV Field --</option>
                    {!field.required && (
                      <option value={NULL_MAPPING}>Map as null</option>
                    )}
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                  
                  {mapping[field.field] === NULL_MAPPING && (
                    <div className="mt-1">
                      <p className={`text-xs ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        This field will be set to null/undefined
                      </p>
                    </div>
                  )}
                  
                  {isFieldMapped(field.field) && mapping[field.field] !== NULL_MAPPING && (
                    <div className="mt-1">
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sample values:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {getSampleValues(mapping[field.field]).map((sample, idx) => (
                          <span 
                            key={idx}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}
                          >
                            {sample.length > 20 ? `${sample.substring(0, 20)}...` : sample}
                          </span>
                        ))}
                        {getSampleValues(mapping[field.field]).length === 0 && (
                          <span className={`text-xs italic ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            No sample data
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="w-1/3 flex items-center justify-center">
                  <div className={getMappingLineClasses(field.field)}></div>
                  <ArrowRight className={`${
                    isFieldMapped(field.field)
                      ? validationStatus[field.field]
                        ? 'text-green-500'
                        : 'text-red-500'
                      : isDarkMode ? 'text-gray-600' : 'text-gray-400'
                  }`} size={20} />
                  <div className={getMappingLineClasses(field.field)}></div>
                </div>
                
                <div className="w-1/3">
                  <div className="flex items-center">
                    <span className={`font-medium ${field.required ? 'text-blue-500 dark:text-blue-400' : ''}`}>
                      {field.field}
                    </span>
                    {field.required && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                    <div className="relative group ml-2">
                      <HelpCircle size={14} className={`cursor-help ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <div className={`absolute left-0 bottom-full mb-2 w-60 p-2 rounded-md text-xs 
                        transform -translate-x-1/4 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10
                        ${isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'}
                      `}>
                        <p className="mb-1">{field.description}</p>
                        {field.examples.length > 0 && (
                          <p>
                            <strong>Example:</strong> {field.examples[0]}
                          </p>
                        )}
                        {field.format && (
                          <p>
                            <strong>Format:</strong> {field.format}
                          </p>
                        )}
                        {!field.required && (
                          <p className="mt-1 italic">
                            This field can be mapped as null
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {field.description}
                    {field.field === 'loincCode' && (
                      <span className="ml-1 italic">(Used for Laboratory tests)</span>
                    )}
                    {field.field === 'snomedCode' && (
                      <span className="ml-1 italic">(Used for Imaging tests)</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className={`p-4 rounded-md mb-6 ${
        !areRequiredFieldsMapped()
          ? (isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-800')
          : (isDarkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-50 text-green-800')
      }`}>
        <div className="flex items-start">
          {!areRequiredFieldsMapped() ? (
            <AlertTriangle className="flex-shrink-0 mr-2 mt-0.5" size={16} />
          ) : (
            <Check className="flex-shrink-0 mr-2 mt-0.5" size={16} />
          )}
          <div>
            <p className="text-sm font-medium">
              {!areRequiredFieldsMapped()
                ? 'Please map all required fields to continue'
                : 'All required fields are mapped. Ready to proceed!'}
            </p>
            <p className="text-xs mt-1">
              {!areRequiredFieldsMapped()
                ? 'Required fields are marked with an asterisk (*)'
                : 'You can now proceed with the import process.'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className={`px-4 py-2 rounded-md transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          Cancel
        </button>
        <button
          onClick={completeMappingSetup}
          disabled={!areRequiredFieldsMapped()}
          className={`px-4 py-2 rounded-md transition-colors flex items-center ${
            !areRequiredFieldsMapped()
              ? (isDarkMode ? 'bg-blue-900/50 text-blue-300 cursor-not-allowed' : 'bg-blue-300 text-blue-800 cursor-not-allowed')
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Check size={16} className="mr-1" />
          Continue with Import
        </button>
      </div>
    </div>
  );
};

export default TestMappingWizard;