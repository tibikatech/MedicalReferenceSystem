import { useState, useEffect } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import CategorySidebar from "@/components/CategorySidebar";
import TestsGrid from "@/components/TestsGrid";
import Footer from "@/components/Footer";
import TestDetailModal from "@/components/TestDetailModal";
import FhirExportTool from "@/components/FhirExportTool";
import CptFamilyFilter from "@/components/CptFamilyFilter";
import BulkOperationsPanel from "@/components/BulkOperationsPanel";
import CptFamilyTestsDisplay from "@/components/CptFamilyTestsDisplay";
import { useTestData } from "@/hooks/useTestData";
import { Test } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  List, 
  Users, 
  Grid 
} from 'lucide-react';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFhirExportTool, setShowFhirExportTool] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'cpt-families'>('standard');
  
  // CPT Family filtering state
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  
  const { toast } = useToast();

  const { 
    tests, 
    categories, 
    subcategories, 
    isLoading, 
    isError,
    refetch
  } = useTestData(selectedCategory, selectedSubCategory, searchQuery);

  // Effect to handle search query parameter updates
  useEffect(() => {
    // Reset category and subcategory filters when searching
    if (searchQuery) {
      setSelectedCategory(null);
      setSelectedSubCategory(null);
    }
  }, [searchQuery]);

  // Handle category selection
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedSubCategory(null);
  };

  // Handle subcategory selection
  const handleSubCategorySelect = (subcategory: string | null) => {
    setSelectedSubCategory(subcategory);
    // If deselecting (clearing) a subcategory, keep the current category
    // If selecting a subcategory, don't modify the category as the UI will show
    // only subcategories that belong to the selected category
  };

  // Handle test selection for detailed view
  const handleTestSelect = (test: Test) => {
    setSelectedTest(test);
    setIsModalOpen(true);
  };

  // Close the test detail modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle test updates
  const handleTestEdit = (updatedTest: Test) => {
    // Update the selected test
    setSelectedTest(updatedTest);

    // Refresh the test list data - will happen automatically via the cache invalidation
    // No need to call refetch() as it's handled via the queryClient.invalidateQueries in TestEditModal

    // Show success toast
    toast({
      title: "Test updated successfully",
      description: `${updatedTest.name} has been updated.`,
      variant: "default",
    });
  };

  // Handle opening the FHIR export tool
  const handleFhirExportClick = () => {
    // Open the FHIR export modal directly
    setShowFhirExportTool(true);
  };

  // Handle clearing selections
  const handleClearSelections = () => {
    setSelectedFamilies([]);
    setSelectedTestIds([]);
  };

  // Handle view mode change - clear selections when switching
  const handleViewModeChange = (mode: 'standard' | 'cpt-families') => {
    setViewMode(mode);
    handleClearSelections();
    // Also reset traditional filters when switching to CPT families view
    if (mode === 'cpt-families') {
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      setSearchQuery("");
    }
  };

  return (
    <>
      <Header onSearch={setSearchQuery} />

      <main className="flex-grow bg-gray-900 text-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">
              Medical Test Reference
            </h1>
            <span className="inline-block mt-2 px-3 py-1 bg-gray-800 text-white rounded-full text-sm">
              {tests ? tests.length : 0} tests available
            </span>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/manage" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
                <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Manage Tests
              </Link>
              <Link href="/import-reports" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
                <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                Import Reports
              </Link>
              <button 
                disabled
                className="bg-gray-500 cursor-not-allowed text-gray-300 px-4 py-2 rounded-md font-medium"
              >
                <svg className="w-5 h-5 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Manage Products
              </button>
              <button 
                onClick={handleFhirExportClick}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Export to FHIR
              </button>
              <Link href="/fhir-wiki" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium">
                FHIR Resources & Wiki
              </Link>
              <Link href="/legal-documentation" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium">
                Legal & Documentation
              </Link>
            </div>
          </div>

          {/* View Mode Tabs */}
          <Tabs 
            value={viewMode} 
            onValueChange={handleViewModeChange}
            className="w-full mb-6"
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 mb-6">
              <TabsTrigger 
                value="standard" 
                className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
              >
                <Grid className="h-4 w-4" />
                Standard View
              </TabsTrigger>
              <TabsTrigger 
                value="cpt-families" 
                className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4" />
                CPT Families View
              </TabsTrigger>
            </TabsList>

            {/* Standard View */}
            <TabsContent value="standard" className="mt-0">
              <div className="flex flex-col md:flex-row">
                <CategorySidebar 
                  categories={categories}
                  subcategories={subcategories}
                  selectedCategory={selectedCategory}
                  selectedSubCategory={selectedSubCategory}
                  onCategorySelect={handleCategorySelect}
                  onSubCategorySelect={handleSubCategorySelect}
                />

                <TestsGrid 
                  tests={tests}
                  isLoading={isLoading}
                  isError={isError}
                  onTestSelect={handleTestSelect}
                />
              </div>
            </TabsContent>

            {/* CPT Families View */}
            <TabsContent value="cpt-families" className="mt-0">
              <div className="space-y-6">
                {/* Bulk Operations Panel */}
                <BulkOperationsPanel
                  selectedFamilies={selectedFamilies}
                  selectedTests={selectedTestIds}
                  allTests={tests || []}
                  onClearSelection={handleClearSelections}
                />

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* CPT Family Filter - Left Side */}
                  <div className="lg:col-span-1">
                    <CptFamilyFilter
                      tests={tests || []}
                      selectedFamilies={selectedFamilies}
                      onFamilySelectionChange={setSelectedFamilies}
                      selectedTests={selectedTestIds}
                      onTestSelectionChange={setSelectedTestIds}
                    />
                  </div>

                  {/* Test Results - Right Side */}
                  <div className="lg:col-span-2">
                    <CptFamilyTestsDisplay
                      tests={tests || []}
                      selectedFamilies={selectedFamilies}
                      selectedTests={selectedTestIds}
                      onTestSelect={handleTestSelect}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {selectedTest && (
        <TestDetailModal 
          test={selectedTest}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onEdit={handleTestEdit}
          isDarkMode={true}
        />
      )}

      {/* FHIR Export Modal */}
      {showFhirExportTool && (
        <FhirExportTool
          isOpen={showFhirExportTool}
          onClose={() => setShowFhirExportTool(false)}
          tests={tests || []}
          isDarkMode={true}
        />
      )}
    </>
  );
}