import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database } from 'lucide-react';
import EnhancedFhirExportTool from '@/components/EnhancedFhirExportTool';
import { Test } from '@/types';
import { useTheme } from 'next-themes';

export default function FhirExportPage() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [showExportTool, setShowExportTool] = useState(false);
  
  // Fetch all tests
  const { data: tests, isLoading, error } = useQuery({
    queryKey: ['/api/tests'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-md">
          <h3 className="font-semibold">Error Loading Tests</h3>
          <p>There was a problem loading the test data. Please try again later.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-400 mb-6">
        FHIR Data Export
      </h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 mb-8 text-center">
        <div className="flex flex-col items-center max-w-3xl mx-auto">
          <Database className="h-20 w-20 text-teal-500 dark:text-teal-400 mb-6" />
          
          <h2 className="text-2xl font-semibold mb-4">Export Medical Test Data to FHIR Format</h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
            Convert your medical test database to standardized FHIR resources for healthcare interoperability.
          </p>
          
          <div className="space-y-6 text-left w-full mb-8">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <span className="flex items-center justify-center w-6 h-6 rounded-full mr-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">1</span>
                Select Your Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Choose which test categories and subcategories to include in your export.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <span className="flex items-center justify-center w-6 h-6 rounded-full mr-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">2</span>
                Preview FHIR Format
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                See a sample of how your data will look in FHIR format before exporting.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <span className="flex items-center justify-center w-6 h-6 rounded-full mr-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">3</span>
                Export & Download
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Generate and download your FHIR-formatted data as a JSON file.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowExportTool(true)}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium text-lg transition-colors flex items-center justify-center"
          >
            Start FHIR Export
          </button>
          
          {showExportTool && (
            <EnhancedFhirExportTool
              isOpen={showExportTool}
              onClose={() => setShowExportTool(false)}
              tests={tests?.tests || []}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
        <h2 className="text-xl font-semibold mb-4">About FHIR (Fast Healthcare Interoperability Resources)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium text-lg mb-2">What is FHIR?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              FHIR is a standard for healthcare data exchange, developed by HL7. It uses modern web technologies 
              to make healthcare information available quickly, easily, and securely across different systems.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              FHIR provides a way to represent and exchange healthcare data in a structured format that can be 
              understood by any system that implements the FHIR standard.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-2">How MediRefs Uses FHIR</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              MediRefs converts your medical test data into <strong>ServiceRequest</strong> resources, 
              which are used to represent orders for procedures and diagnostic tests in the FHIR specification.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Each test is mapped to a ServiceRequest that includes its category, CPT code, LOINC code (for laboratory tests), 
              SNOMED code (for imaging studies), and other relevant information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}