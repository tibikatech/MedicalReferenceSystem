import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Filter, RefreshCw, FlaskRound as Flask, Dna, FileText, Database, CheckSquare, Square, AlertTriangle, Search } from 'lucide-react';
import { db, TestWithNotes } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import TestForm from './TestForm';
import { TestCategory, TestSubCategory } from '../types';
import { updateSnomedCodes } from '../scripts/updateSnomedCodes';
import { updateToxicologyLoincCodes, updateGeneticsLoincCodes, updateToxicologyAndGeneticsLoincCodes } from '../scripts/updateLoincCodes';
import TestImportExport from './TestImportExport';
import LucideIcon from './LucideIcon';

interface TestManagementProps {
  isDarkMode: boolean;
  onTestsUpdated: () => void;
}

const TestManagement: React.FC<TestManagementProps> = ({ 
  isDarkMode,
  onTestsUpdated
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<TestWithNotes | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [isUpdatingSnomedCodes, setIsUpdatingSnomedCodes] = useState(false);
  const [isUpdatingLoincCodes, setIsUpdatingLoincCodes] = useState(false);
  const [activeTab, setActiveTab] = useState<'manage' | 'import-export'>('manage');
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showDeleteSubcategoryConfirm, setShowDeleteSubcategoryConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Use Dexie React Hooks to get live data
  const tests = useLiveQuery(() => {
    if (selectedSubCategory) {
      return db.getTestsBySubCategory(selectedSubCategory);
    } else if (selectedCategory) {
      return db.getTestsByCategory(selectedCategory);
    } else {
      return db.getAllTests();
    }
  }, [selectedCategory, selectedSubCategory]);

  const filteredTests = useLiveQuery(() => {
    if (!tests) return [];
    
    if (!searchQuery.trim()) return tests;
    
    const query = searchQuery.toLowerCase().trim();
    return tests.filter(test => 
      test.name.toLowerCase().includes(query) ||
      test.cptCode.includes(query) ||
      (test.description && test.description.toLowerCase().includes(query)) ||
      (test.loincCode && test.loincCode.toLowerCase().includes(query)) ||
      (test.snomedCode && test.snomedCode.toLowerCase().includes(query))
    );
  }, [tests, searchQuery]);

  const categories = useLiveQuery(() => {
    return db.tests.orderBy('category').uniqueKeys();
  });
  
  // Get subcategories based on the selected category
  const subCategories = useLiveQuery(() => {
    if (!selectedCategory) return [];
    
    return db.tests
      .where('category')
      .equals(selectedCategory)
      .toArray()
      .then(tests => [...new Set(tests.map(test => test.subCategory))].filter(Boolean) as string[]);
  }, [selectedCategory]);

  // Get test counts by category
  const testCounts = useLiveQuery(() => {
    return db.getTestCountByCategory();
  }) as Record<string, number> | undefined;
  
  // Get test counts by subcategory
  const subCategoryCounts = useLiveQuery(() => {
    return db.getTestCountBySubCategory();
  }) as Record<string, number> | undefined;

  // Reset selected tests when filtered tests change
  useEffect(() => {
    if (selectAll) {
      const newSelectedTests = new Set<string>();
      filteredTests?.forEach(test => newSelectedTests.add(test.id));
      setSelectedTests(newSelectedTests);
    } else {
      // Keep only the selected tests that are still in the filtered list
      const newSelectedTests = new Set<string>();
      selectedTests.forEach(id => {
        if (filteredTests?.some(test => test.id === id)) {
          newSelectedTests.add(id);
        }
      });
      setSelectedTests(newSelectedTests);
    }
  }, [filteredTests, selectAll]);

  useEffect(() => {
    // Notify parent component when tests are updated
    if (tests) {
      onTestsUpdated();
    }
  }, [tests, onTestsUpdated]);

  const handleAddTest = () => {
    setEditingTest(null);
    setShowForm(true);
  };

  const handleEditTest = (test: TestWithNotes) => {
    setEditingTest(test);
    setShowForm(true);
  };

  const handleSaveTest = async (test: TestWithNotes) => {
    try {
      if (editingTest) {
        await db.updateTest(test);
      } else {
        await db.addTest(test);
      }
      setShowForm(false);
      setEditingTest(null);
    } catch (error) {
      console.error('Error saving test:', error);
    }
  };

  const handleDeleteTest = async (id: string) => {
    try {
      await db.deleteTest(id);
      setShowDeleteConfirm(null);
      
      // Remove from selected tests if it was selected
      if (selectedTests.has(id)) {
        const newSelectedTests = new Set(selectedTests);
        newSelectedTests.delete(id);
        setSelectedTests(newSelectedTests);
      }
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };
  
  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedTests).map(id => db.deleteTest(id));
      await Promise.all(deletePromises);
      setSelectedTests(new Set());
      setSelectAll(false);
      setShowBulkDeleteConfirm(false);
      setUpdateMessage(`Successfully deleted ${selectedTests.size} tests.`);
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setUpdateMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error performing bulk delete:', error);
      setUpdateMessage('Error deleting tests. Please try again.');
    }
  };
  
  const handleDeleteSubcategory = async (subCategory: string) => {
    try {
      // Get all tests with the specified subcategory
      const testsToDelete = await db.getTestsBySubCategory(subCategory);
      
      if (testsToDelete.length === 0) {
        setUpdateMessage(`No tests found with subcategory "${subCategory}".`);
        setShowDeleteSubcategoryConfirm(null);
        return;
      }
      
      // Extract IDs
      const idsToDelete = testsToDelete.map(test => test.id);
      
      // Delete all tests with this subcategory
      await db.bulkDeleteTests(idsToDelete);
      
      setUpdateMessage(`Successfully deleted all ${testsToDelete.length} tests in subcategory "${subCategory}".`);
      setShowDeleteSubcategoryConfirm(null);
      
      // Reset selection if the current subcategory was deleted
      if (selectedSubCategory === subCategory) {
        setSelectedSubCategory(null);
      }
      
      // Clear the message after 4 seconds
      setTimeout(() => {
        setUpdateMessage(null);
      }, 4000);
    } catch (error) {
      console.error('Error deleting subcategory tests:', error);
      setUpdateMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowDeleteSubcategoryConfirm(null);
    }
  };
  
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedSubCategory(null);
    setSelectedTests(new Set());
    setSelectAll(false);
  };
  
  const handleSubCategoryChange = (subCategory: string | null) => {
    setSelectedSubCategory(subCategory);
    setSelectedTests(new Set());
    setSelectAll(false);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedTests(new Set());
    setSelectAll(false);
  };

  const handleUpdateSnomedCodes = async () => {
    setIsUpdatingSnomedCodes(true);
    setUpdateMessage(null);
    
    try {
      const updatedCount = await updateSnomedCodes();
      
      if (updatedCount > 0) {
        setUpdateMessage(`Successfully updated ${updatedCount} imaging ${updatedCount === 1 ? 'test' : 'tests'} with SNOMED codes.`);
      } else {
        setUpdateMessage('No tests needed updating. All imaging tests already have SNOMED codes.');
      }
    } catch (error) {
      console.error('Failed to update SNOMED codes:', error);
      setUpdateMessage('Error updating SNOMED codes. Check the console for details.');
    } finally {
      setIsUpdatingSnomedCodes(false);
    }
  };

  const handleUpdateLoincCodes = async (type: 'toxicology' | 'genetics' | 'both') => {
    setIsUpdatingLoincCodes(true);
    setUpdateMessage(null);
    
    try {
      let updatedCount = 0;
      
      if (type === 'toxicology') {
        updatedCount = await updateToxicologyLoincCodes();
        if (updatedCount > 0) {
          setUpdateMessage(`Successfully updated ${updatedCount} Toxicology ${updatedCount === 1 ? 'test' : 'tests'} with LOINC codes.`);
        } else {
          setUpdateMessage('No Toxicology tests needed updating. All already have LOINC codes.');
        }
      } else if (type === 'genetics') {
        updatedCount = await updateGeneticsLoincCodes();
        if (updatedCount > 0) {
          setUpdateMessage(`Successfully updated ${updatedCount} Genetic Testing ${updatedCount === 1 ? 'test' : 'tests'} with LOINC codes.`);
        } else {
          setUpdateMessage('No Genetic Testing tests needed updating. All already have LOINC codes.');
        }
      } else if (type === 'both') {
        updatedCount = await updateToxicologyAndGeneticsLoincCodes();
        if (updatedCount > 0) {
          setUpdateMessage(`Successfully updated ${updatedCount} Toxicology and Genetic Testing ${updatedCount === 1 ? 'test' : 'tests'} with LOINC codes.`);
        } else {
          setUpdateMessage('No tests needed updating. All Toxicology and Genetic Testing tests already have LOINC codes.');
        }
      }
    } catch (error) {
      console.error('Failed to update LOINC codes:', error);
      setUpdateMessage('Error updating LOINC codes. Check the console for details.');
    } finally {
      setIsUpdatingLoincCodes(false);
    }
  };
  
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedTests(new Set());
    } else if (filteredTests) {
      const newSelectedTests = new Set<string>();
      filteredTests.forEach(test => newSelectedTests.add(test.id));
      setSelectedTests(newSelectedTests);
    }
    setSelectAll(!selectAll);
  };
  
  const toggleSelectTest = (testId: string) => {
    const newSelectedTests = new Set(selectedTests);
    if (newSelectedTests.has(testId)) {
      newSelectedTests.delete(testId);
    } else {
      newSelectedTests.add(testId);
    }
    setSelectedTests(newSelectedTests);
    
    // Update selectAll state
    if (filteredTests) {
      setSelectAll(newSelectedTests.size === filteredTests.length);
    }
  };
  
  const handleClearSubCategory = async () => {
    if (!selectedSubCategory) return;
    
    try {
      // Get all tests with the selected subcategory
      const testsToUpdate = await db.getTestsBySubCategory(selectedSubCategory);
      
      // Update each test to remove the subcategory
      const updatePromises = testsToUpdate.map(test => {
        const updatedTest = { ...test, subCategory: undefined };
        return db.updateTest(updatedTest);
      });
      
      await Promise.all(updatePromises);
      setUpdateMessage(`Successfully cleared subcategory "${selectedSubCategory}" from ${testsToUpdate.length} tests.`);
      
      // Reset the subcategory selection
      setSelectedSubCategory(null);
    } catch (error) {
      console.error('Error clearing subcategory:', error);
      setUpdateMessage('Error clearing subcategory. Check the console for details.');
    }
  };
  
  const renderSubCategoryFilters = () => {
    if (!subCategories || subCategories.length === 0) return null;
    
    return (
      <div className="mt-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {selectedCategory} Subcategories
          </h3>
          <div className="flex gap-2">
            {selectedSubCategory && (
              <>
                <button
                  onClick={handleClearSubCategory}
                  className={`text-xs px-2 py-1 rounded ${
                    isDarkMode ? 'text-blue-300 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  Clear Subcategory
                </button>
                <button
                  onClick={() => setShowDeleteSubcategoryConfirm(selectedSubCategory)}
                  className={`text-xs px-2 py-1 rounded ${
                    isDarkMode ? 'text-red-300 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-100'
                  }`}
                >
                  Delete Tests
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSubCategoryChange(null)}
            className={`px-2 py-1 text-xs rounded-full transition-colors duration-200 ${
              selectedSubCategory === null
                ? 'bg-blue-500 text-white'
                : isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All {selectedCategory}
          </button>
          
          {subCategories.map((subCategory) => subCategory && (
            <button
              key={subCategory as string}
              onClick={() => handleSubCategoryChange(subCategory as string)}
              className={`px-2 py-1 text-xs rounded-full transition-colors duration-200 ${
                selectedSubCategory === subCategory
                  ? 'bg-blue-500 text-white'
                  : isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {subCategory} ({subCategoryCounts?.[subCategory as string] || 0})
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  const renderBulkActions = () => {
    if (selectedTests.size === 0) return null;
    
    return (
      <div className={`mb-4 p-3 rounded-md ${
        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {selectedTests.size} {selectedTests.size === 1 ? 'test' : 'tests'} selected
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTests(new Set())}
              className={`px-3 py-1 text-sm rounded ${
                isDarkMode 
                  ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Clear Selection
            </button>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
            >
              <Trash2 size={14} />
              Delete Selected
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`mb-8 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400">Test Management</h2>
        <div className="flex gap-2">
          {activeTab === 'manage' && selectedCategory === TestCategory.IMAGING && (
            <button
              onClick={handleUpdateSnomedCodes}
              disabled={isUpdatingSnomedCodes}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1 ${
                isUpdatingSnomedCodes
                  ? (isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-300 text-gray-500')
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <RefreshCw size={16} className={isUpdatingSnomedCodes ? 'animate-spin' : ''} />
              Update SNOMED Codes
            </button>
          )}
          
          {activeTab === 'manage' && (selectedCategory === TestCategory.LABORATORY || selectedCategory === null) && 
           (selectedSubCategory === TestSubCategory.TOXICOLOGY || 
            selectedSubCategory === TestSubCategory.GENETICS || 
            selectedSubCategory === null) && (
            <div className="flex gap-2">
              {(selectedSubCategory === TestSubCategory.TOXICOLOGY || selectedSubCategory === null) && (
                <button
                  onClick={() => handleUpdateLoincCodes('toxicology')}
                  disabled={isUpdatingLoincCodes}
                  className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1 ${
                    isUpdatingLoincCodes
                      ? (isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-300 text-gray-500')
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <Flask size={16} className={isUpdatingLoincCodes ? 'animate-spin' : ''} />
                  Update LOINC Codes
                </button>
              )}
              
              {(selectedSubCategory === TestSubCategory.GENETICS || selectedSubCategory === null) && (
                <button
                  onClick={handleUpdateSnomedCodes}
                  disabled={isUpdatingSnomedCodes}
                  className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1 ${
                    isUpdatingSnomedCodes
                      ? (isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-300 text-gray-500')
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <Dna size={16} className={isUpdatingSnomedCodes ? 'animate-spin' : ''} />
                  Update SNOMED Codes
                </button>
              )}
              
              {selectedSubCategory === null && (
                <button
                  onClick={() => handleUpdateLoincCodes('both')}
                  disabled={isUpdatingLoincCodes}
                  className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1 ${
                    isUpdatingLoincCodes
                      ? (isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-300 text-gray-500')
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  <LucideIcon icon={RefreshCw} size={16} className={isUpdatingLoincCodes ? 'animate-spin' : ''} />
                  Update Both
                </button>
              )}
            </div>
          )}
          
          {activeTab === 'manage' && (
            <button
              onClick={handleAddTest}
              className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <PlusCircle size={16} />
              Add New Test
            </button>
          )}
        </div>
      </div>

      {updateMessage && activeTab === 'manage' && (
        <div className={`p-3 rounded-md mb-4 ${
          updateMessage.includes('Error') 
            ? (isDarkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800')
            : (isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800')
        }`}>
          <p className="text-sm">{updateMessage}</p>
        </div>
      )}

      {/* Management Tabs */}
      <div className="flex border-b mb-6 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
            activeTab === 'manage'
              ? (isDarkMode ? 'text-white border-b-2 border-blue-500' : 'text-blue-600 border-b-2 border-blue-500')
              : (isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800')
          }`}
        >
          <Database size={16} />
          Manage Tests
        </button>
        <button
          onClick={() => setActiveTab('import-export')}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
            activeTab === 'import-export'
              ? (isDarkMode ? 'text-white border-b-2 border-blue-500' : 'text-blue-600 border-b-2 border-blue-500')
              : (isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800')
          }`}
        >
          <FileText size={16} />
          Import/Export
        </button>
      </div>

      {activeTab === 'manage' && (
        <>
          {/* Search Box */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tests by name, code, or description..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={`w-full px-4 py-2 pl-10 rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-700'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="mb-4">
            <h3 className={`text-md font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <Filter size={16} className="inline mr-2" />
              Filter by Category
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors duration-200 ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white'
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All ({testCounts ? Object.values(testCounts).reduce((sum, val) => sum + val, 0) : 0})
              </button>
              
              {categories?.map((category) => (
                <button
                  key={category as string}
                  onClick={() => handleCategoryChange(category as string)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors duration-200 ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {String(category)} ({testCounts?.[category as string] || 0})
                </button>
              ))}
            </div>
            
            {/* Subcategory filters */}
            {selectedCategory && renderSubCategoryFilters()}
          </div>

          {/* Bulk Actions */}
          {renderBulkActions()}

          {/* Test Form */}
          {showForm && (
            <div className="mb-6">
              <TestForm
                test={editingTest || undefined}
                onSave={handleSaveTest}
                onCancel={() => {
                  setShowForm(false);
                  setEditingTest(null);
                }}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {/* Tests Table */}
          <div className={`overflow-x-auto rounded-lg border ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <table className={`min-w-full divide-y ${
              isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className="w-10 px-3 py-3">
                    <div className="flex items-center justify-center">
                      <button 
                        onClick={toggleSelectAll}
                        className="focus:outline-none"
                        aria-label={selectAll ? "Deselect all" : "Select all"}
                      >
                        {selectAll ? (
                          <CheckSquare size={18} className="text-blue-500" />
                        ) : (
                          <Square size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                        )}
                      </button>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    CPT Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    {selectedCategory === TestCategory.IMAGING ? 'SNOMED Code' : 'LOINC Code'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
              }`}>
                {filteredTests && filteredTests.length > 0 ? (
                  filteredTests.map(test => (
                    <tr 
                      key={test.id} 
                      className={`${
                        isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                      } ${selectedTests.has(test.id) ? (isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50') : ''}`}
                    >
                      <td className="px-3 py-4">
                        <div className="flex items-center justify-center">
                          <button 
                            onClick={() => toggleSelectTest(test.id)}
                            className="focus:outline-none"
                            aria-label={selectedTests.has(test.id) ? `Deselect ${test.name}` : `Select ${test.name}`}
                          >
                            {selectedTests.has(test.id) ? (
                              <CheckSquare size={18} className="text-blue-500" />
                            ) : (
                              <Square size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{test.name}</div>
                        {test.notes && (
                          <div className={`text-xs mt-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Has notes
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm">{test.category}</span>
                        {test.subCategory && (
                          <span className={`block text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {test.subCategory}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">
                          {test.cptCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {test.category === TestCategory.IMAGING && test.snomedCode ? (
                          <span className="font-mono text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded">
                            {test.snomedCode}
                          </span>
                        ) : test.loincCode ? (
                          <span className="font-mono text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded">
                            {test.loincCode}
                          </span>
                        ) : (
                          <span className={`text-xs italic ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditTest(test)}
                            className={`p-1.5 rounded-md ${
                              isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                            aria-label={`Edit ${test.name}`}
                          >
                            <Edit size={16} />
                          </button>
                          
                          {showDeleteConfirm === test.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteTest(test.id)}
                                className="p-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className={`p-1.5 rounded-md ${
                                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowDeleteConfirm(test.id)}
                              className={`p-1.5 rounded-md ${
                                isDarkMode ? 'text-red-400 hover:bg-red-900 hover:text-red-300' : 'text-red-500 hover:bg-red-100'
                              }`}
                              aria-label={`Delete ${test.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td 
                      colSpan={6} 
                      className={`px-6 py-8 text-center ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {filteredTests?.length === 0 ? (
                        searchQuery ? (
                          <>No tests match your search criteria. <button 
                            onClick={() => setSearchQuery('')}
                            className="text-blue-500 hover:underline"
                          >
                            Clear search
                          </button></>
                        ) : selectedCategory ? (
                          <>No tests found in the {selectedCategory} category. <button 
                            onClick={handleAddTest}
                            className="text-blue-500 hover:underline"
                          >
                            Add one?
                          </button></>
                        ) : (
                          <>No tests found. <button 
                            onClick={handleAddTest}
                            className="text-blue-500 hover:underline"
                          >
                            Add your first test
                          </button></>
                        )
                      ) : (
                        'Loading tests...'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Bulk Delete Confirmation Modal */}
          {showBulkDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-lg shadow-xl p-6 max-w-md mx-4`}>
                <div className="flex items-start mb-4">
                  <AlertTriangle size={24} className="text-red-500 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold mb-2">Confirm Bulk Deletion</h3>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Are you sure you want to delete {selectedTests.size} selected {selectedTests.size === 1 ? 'test' : 'tests'}? 
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowBulkDeleteConfirm(false)}
                    className={`px-4 py-2 rounded-md ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete {selectedTests.size} {selectedTests.size === 1 ? 'Test' : 'Tests'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Delete Subcategory Confirmation Modal */}
          {showDeleteSubcategoryConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-lg shadow-xl p-6 max-w-md mx-4`}>
                <div className="flex items-start mb-4">
                  <LucideIcon icon={AlertTriangle} size={24} className="text-red-500 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold mb-2">Delete All Tests in Subcategory</h3>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      Are you sure you want to delete ALL tests in the "{showDeleteSubcategoryConfirm}" subcategory?
                    </p>
                    <p className={`${isDarkMode ? 'text-red-300' : 'text-red-600'} text-sm`}>
                      This will permanently delete all tests and their IDs from this subcategory allowing you to reload them from scratch.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteSubcategoryConfirm(null)}
                    className={`px-4 py-2 rounded-md ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteSubcategory(showDeleteSubcategoryConfirm)}
                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete Subcategory Tests
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'import-export' && (
        <TestImportExport 
          isDarkMode={isDarkMode}
          onTestsUpdated={onTestsUpdated}
        />
      )}
    </div>
  );
};

export default TestManagement;