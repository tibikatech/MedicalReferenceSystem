import React, { useState, useEffect, useMemo } from 'react';
import { getAllTests } from '../services/testService';
import { TestCategory, TestSubCategory, ImagingSubCategories } from '../types';
import { 
  exportTestsToFhir, 
  filterTestsByCategory, 
  filterTestsBySubcategory 
} from '../utils/fhirExporter';
import { getSubcategoriesForCategory } from '../utils/categoryUtils';
import { Download, RefreshCw, CheckCircle } from 'lucide-react';

interface FhirExportToolProps {
  isDarkMode: boolean;
}

const FhirExportTool: React.FC<FhirExportToolProps> = ({ isDarkMode }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [prettyPrint, setPrettyPrint] = useState<boolean>(true);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [previewFhir, setPreviewFhir] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Get all available categories
  const categories = Object.values(TestCategory);
  
  // Get all available subcategories
  const allSubcategories = [
    ...Object.values(TestSubCategory),
    ...Object.values(ImagingSubCategories)
  ];
  
  // Filter subcategories based on selected categories
  const availableSubcategories = useMemo(() => {
    if (selectedCategories.length === 0) {
      return allSubcategories;
    }
    
    // Get all subcategories for the selected categories
    const subCategories = selectedCategories.flatMap(category => 
      getSubcategoriesForCategory(category)
    );
    
    // Return unique subcategories
    return [...new Set(subCategories)];
  }, [selectedCategories, allSubcategories]);
  
  // Update selected subcategories when selected categories change
  useEffect(() => {
    if (selectedCategories.length === 0) {
      // Don't filter when no categories are selected
      return;
    }
    
    // Get currently available subcategories based on selected categories
    const currentlyAvailable = selectedCategories.flatMap(category => 
      getSubcategoriesForCategory(category)
    );
    const uniqueAvailable = [...new Set(currentlyAvailable)];
    
    // Keep only the subcategories that are still available
    setSelectedSubcategories(prevSelected => 
      prevSelected.filter(sub => uniqueAvailable.includes(sub))
    );
  }, [selectedCategories]);
  
  // Handle category selection changes
  const handleCategoryChange = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  // Handle subcategory selection changes
  const handleSubcategoryChange = (subcategory: string) => {
    if (selectedSubcategories.includes(subcategory)) {
      setSelectedSubcategories(selectedSubcategories.filter(s => s !== subcategory));
    } else {
      setSelectedSubcategories([...selectedSubcategories, subcategory]);
    }
  };
  
  // Generate FHIR preview
  const generatePreview = async () => {
    setIsExporting(true);
    setExportStatus('Preparing FHIR data...');
    
    try {
      const allTests = await getAllTests();
      
      // Apply filters
      let filteredTests = allTests;
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
      
      // Get a preview with at most 3 tests
      const previewTests = filteredTests.slice(0, 3);
      const fhirJson = exportTestsToFhir(previewTests, true);
      
      setPreviewFhir(fhirJson);
      setExportStatus(`Ready to export ${filteredTests.length} tests. Preview shows ${previewTests.length} tests.`);
    } catch (error) {
      console.error('Error generating FHIR preview:', error);
      setExportStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPreviewFhir(null);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Export FHIR data to file
  const exportFhir = async () => {
    setIsExporting(true);
    setExportStatus('Exporting FHIR data...');
    
    try {
      const allTests = await getAllTests();
      
      // Apply filters
      let filteredTests = allTests;
      if (selectedCategories.length > 0) {
        filteredTests = filterTestsByCategory(filteredTests, selectedCategories);
      }
      if (selectedSubcategories.length > 0) {
        filteredTests = filterTestsBySubcategory(filteredTests, selectedSubcategories);
      }
      
      if (filteredTests.length === 0) {
        setExportStatus('No tests match the selected criteria.');
        setIsExporting(false);
        return;
      }
      
      const fhirJson = exportTestsToFhir(filteredTests, prettyPrint);
      
      // Create and download the file
      const blob = new Blob([fhirJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download', 
        `medirefs-fhir-export-${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportStatus(`Successfully exported ${filteredTests.length} tests to FHIR format.`);
    } catch (error) {
      console.error('Error exporting FHIR data:', error);
      setExportStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Select or deselect all categories
  const toggleAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...categories]);
    }
  };
  
  // Select or deselect all subcategories
  const toggleAllSubcategories = () => {
    if (selectedSubcategories.length === availableSubcategories.length) {
      setSelectedSubcategories([]);
    } else {
      setSelectedSubcategories([...availableSubcategories]);
    }
  };
  
  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-800';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const buttonClass = isDarkMode 
    ? 'bg-blue-700 hover:bg-blue-600 text-white' 
    : 'bg-blue-500 hover:bg-blue-600 text-white';
  const secondaryButtonClass = isDarkMode 
    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  const checkboxClass = isDarkMode 
    ? 'bg-gray-700 border-gray-600 text-blue-500' 
    : 'bg-white border-gray-300 text-blue-600';
  const codeClass = isDarkMode 
    ? 'bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-md' 
    : 'bg-gray-100 text-green-800 font-mono text-sm p-4 rounded-md';
  
  return (
    <div className={`mb-8 ${textClass}`}>
      <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
        FHIR Export Tool
      </h2>
      
      <div className={`p-6 rounded-lg ${bgClass} border ${borderClass} shadow-md mb-6`}>
        <h3 className="text-lg font-medium mb-4">Export Tests to FHIR Format</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Categories</h4>
              <button 
                onClick={toggleAllCategories}
                className={`text-xs px-2 py-1 rounded ${secondaryButtonClass}`}
              >
                {selectedCategories.length === categories.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md">
              {categories.map(category => (
                <div key={category} className="flex items-center">
                  <input 
                    type="checkbox"
                    id={`category-${category}`}
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className={`mr-2 h-4 w-4 rounded ${checkboxClass}`}
                  />
                  <label htmlFor={`category-${category}`} className="text-sm">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Subcategories</h4>
              <button 
                onClick={toggleAllSubcategories}
                className={`text-xs px-2 py-1 rounded ${secondaryButtonClass}`}
              >
                {selectedSubcategories.length === availableSubcategories.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md">
              {availableSubcategories.map((subcategory: string) => (
                <div key={subcategory} className="flex items-center">
                  <input 
                    type="checkbox"
                    id={`subcategory-${subcategory}`}
                    checked={selectedSubcategories.includes(subcategory)}
                    onChange={() => handleSubcategoryChange(subcategory)}
                    className={`mr-2 h-4 w-4 rounded ${checkboxClass}`}
                  />
                  <label htmlFor={`subcategory-${subcategory}`} className="text-sm">
                    {subcategory}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center mb-4">
          <input 
            type="checkbox"
            id="pretty-print"
            checked={prettyPrint}
            onChange={() => setPrettyPrint(!prettyPrint)}
            className={`mr-2 h-4 w-4 rounded ${checkboxClass}`}
          />
          <label htmlFor="pretty-print">
            Pretty-print JSON (more readable but larger file size)
          </label>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={generatePreview}
            disabled={isExporting}
            className={`px-4 py-2 rounded-md flex items-center ${secondaryButtonClass}`}
          >
            {isExporting ? (
              <RefreshCw className="mr-2 animate-spin" size={18} />
            ) : (
              <CheckCircle className="mr-2" size={18} />
            )}
            Generate Preview
          </button>
          
          <button
            onClick={exportFhir}
            disabled={isExporting}
            className={`px-4 py-2 rounded-md flex items-center ${buttonClass}`}
          >
            {isExporting ? (
              <RefreshCw className="mr-2 animate-spin" size={18} />
            ) : (
              <Download className="mr-2" size={18} />
            )}
            Export FHIR Data
          </button>
        </div>
        
        {exportStatus && (
          <div className={`mt-4 p-3 rounded-md ${
            exportStatus.includes('Error')
              ? (isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800')
              : (isDarkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800')
          }`}>
            {exportStatus}
          </div>
        )}
      </div>
      
      {previewFhir && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">FHIR Preview</h3>
          <pre className={`overflow-auto max-h-96 ${codeClass}`}>
            {previewFhir}
          </pre>
        </div>
      )}
      
      <div className={`p-6 rounded-lg ${bgClass} border ${borderClass} shadow-md`}>
        <h3 className="text-lg font-medium mb-2">About FHIR Export</h3>
        <p className="mb-2">
          This tool exports your test data to the FHIR (Fast Healthcare Interoperability Resources) format,
          which is a standard for exchanging healthcare information electronically.
        </p>
        <p className="mb-2">
          Each test is converted to a FHIR ServiceRequest resource with proper coding for CPT,
          LOINC, and SNOMED CT codes where available.
        </p>
        <p>
          The exported data can be used with any FHIR-compliant healthcare application or API.
        </p>
      </div>
    </div>
  );
};

export default FhirExportTool;