import { useState, useEffect } from "react";
import Header from "@/components/Header";
import CategorySidebar from "@/components/CategorySidebar";
import TestsGrid from "@/components/TestsGrid";
import Footer from "@/components/Footer";
import TestDetailModal from "@/components/TestDetailModal";
import { useTestData } from "@/hooks/useTestData";
import { Test } from "@/types";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { 
    tests, 
    categories, 
    subcategories, 
    isLoading, 
    isError 
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

  return (
    <>
      <Header onSearch={setSearchQuery} />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero section */}
          <div className="hero mb-8 bg-white p-6 rounded-lg border border-gray-100">
            <h1 className="hero-title text-2xl font-bold text-gray-800">
              Medical Test Reference
            </h1>
            <p className="text-gray-600 mt-2 mb-3">
              Your comprehensive guide to laboratory tests, imaging studies, and medical procedures.
            </p>
            <span className="tests-count inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              {tests ? tests.length : 0} tests available
            </span>
            
            <div className="hero-actions mt-4 flex space-x-3">
              <button className="hero-btn bg-primary hover:opacity-90 text-white px-4 py-2 rounded inline-flex items-center transition-all">
                <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Manage Tests
              </button>
              <button className="hero-btn bg-purple-600 hover:opacity-90 text-white px-4 py-2 rounded inline-flex items-center transition-all">
                Database Migration
              </button>
            </div>
          </div>

          {/* Content with sidebar */}
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
        </div>
      </main>
      
      <Footer />
      
      {selectedTest && (
        <TestDetailModal 
          test={selectedTest}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
