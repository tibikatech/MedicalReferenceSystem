import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { dbStorage as storage } from "./storage-db";
import { errorHandler, createNotFoundError } from "./utils/error-handler";
import { VALID_CATEGORIES, generateTestId } from "./utils/medical-constants";
import fs from 'fs';
import path from 'path';
import legalRoutes from './legal-routes';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize the storage with test data
  await initializeTestData();
  
  // Get all tests
  app.get("/api/tests", async (req, res) => {
    try {
      const tests = await storage.getAllTests();
      res.json({ tests });
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ error: "Failed to fetch tests" });
    }
  });

  // Search tests - This must come BEFORE the wildcard routes to avoid conflicts
  app.get("/api/tests/search", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const tests = await storage.searchTests(q);
      
      if (tests.length === 0) {
        console.log(`No tests found for search query: ${q}`);
      } else {
        console.log(`Found ${tests.length} tests for search query: ${q}`);
      }
      
      res.json({ tests });
    } catch (error) {
      console.error(`Error searching tests:`, error);
      res.status(500).json({ error: "Failed to search tests" });
    }
  });

  // Get tests by category - This must come BEFORE the :id wildcard route
  app.get("/api/tests/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const tests = await storage.getTestsByCategory(category);
      res.json({ tests });
    } catch (error) {
      console.error(`Error fetching tests for category ${req.params.category}:`, error);
      res.status(500).json({ error: "Failed to fetch tests by category" });
    }
  });

  // Get tests by subcategory - This must come BEFORE the :id wildcard route
  app.get("/api/tests/subcategory/:subcategory", async (req, res) => {
    try {
      const { subcategory } = req.params;
      const tests = await storage.getTestsBySubCategory(subcategory);
      res.json({ tests });
    } catch (error) {
      console.error(`Error fetching tests for subcategory ${req.params.subcategory}:`, error);
      res.status(500).json({ error: "Failed to fetch tests by subcategory" });
    }
  });

  // Get test by ID - Most specific route should come LAST
  app.get("/api/tests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const test = await storage.getTestById(id);
      
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      
      res.json({ test });
    } catch (error) {
      console.error(`Error fetching test ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch test" });
    }
  });

  // Get test counts by category
  app.get("/api/test-count-by-category", async (req, res) => {
    try {
      const categories = await storage.getTestCountByCategory();
      res.json({ categories });
    } catch (error) {
      console.error("Error fetching test counts by category:", error);
      res.status(500).json({ error: "Failed to fetch test counts by category" });
    }
  });

  // Get test counts by subcategory
  app.get("/api/test-count-by-subcategory", async (req, res) => {
    try {
      const subcategories = await storage.getTestCountBySubCategory();
      res.json({ subcategories });
    } catch (error) {
      console.error("Error fetching test counts by subcategory:", error);
      res.status(500).json({ error: "Failed to fetch test counts by subcategory" });
    }
  });
  
  // Get test counts by subcategory filtered by category
  app.get("/api/test-count-by-subcategory/:category", async (req, res) => {
    try {
      const { category } = req.params;
      if (!category) {
        return res.status(400).json({ error: "Category parameter is required" });
      }
      
      // Get all subcategories first
      const allSubcategories = await storage.getTestCountBySubCategory();
      
      // Get tests for this category
      const tests = await storage.getTestsByCategory(category);
      
      // Extract unique subcategories from the tests in this category
      const categorySubcategories = new Set(tests.map(test => test.subCategory));
      
      // Filter subcategories that belong to this category
      const filteredSubcategories = allSubcategories.filter(sub => 
        categorySubcategories.has(sub.subCategory)
      );
      
      res.json({ subcategories: filteredSubcategories });
    } catch (error) {
      console.error(`Error fetching subcategories for category ${req.params.category}:`, error);
      res.status(500).json({ error: "Failed to fetch subcategories by category" });
    }
  });

  // Laboratory Tests endpoints
  app.get("/api/laboratory-tests", async (req, res, next) => {
    try {
      const tests = await storage.getLaboratoryTests();
      res.json({ tests });
    } catch (error) {
      next(error);
    }
  });
  
  // Imaging Studies endpoints
  app.get("/api/imaging-studies", async (req, res, next) => {
    try {
      const tests = await storage.getImagingStudies();
      res.json({ tests });
    } catch (error) {
      next(error);
    }
  });
  
  // Get specific laboratory test by ID
  app.get("/api/laboratory-tests/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const test = await storage.getTestById(id);
      
      if (!test) {
        throw createNotFoundError(`Laboratory test with ID ${id} not found`);
      }
      
      if (test.category !== "Laboratory Tests") {
        return res.status(400).json({ 
          error: {
            code: 'INVALID_CATEGORY',
            message: `Requested test with ID ${id} is not a laboratory test, it belongs to ${test.category} category`
          }
        });
      }
      
      res.json({ test });
    } catch (error) {
      next(error);
    }
  });
  
  // Get specific imaging study by ID
  app.get("/api/imaging-studies/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const test = await storage.getTestById(id);
      
      if (!test) {
        throw createNotFoundError(`Imaging study with ID ${id} not found`);
      }
      
      if (test.category !== "Imaging Studies") {
        return res.status(400).json({ 
          error: {
            code: 'INVALID_CATEGORY',
            message: `Requested test with ID ${id} is not an imaging study, it belongs to ${test.category} category`
          }
        });
      }
      
      res.json({ test });
    } catch (error) {
      next(error);
    }
  });
  
  // Update LOINC codes for laboratory tests
  app.post("/api/laboratory-tests/update-loinc-codes", async (req, res, next) => {
    try {
      const updatedCount = await storage.updateLoincCodes();
      
      res.json({ 
        success: true, 
        message: `Updated LOINC codes for ${updatedCount} laboratory tests`,
        updatedCount,
        timestamp: new Date()
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Update SNOMED codes for imaging studies
  app.post("/api/imaging-studies/update-snomed-codes", async (req, res, next) => {
    try {
      const updatedCount = await storage.updateSnomedCodes();
      
      res.json({ 
        success: true, 
        message: `Updated SNOMED codes for ${updatedCount} imaging studies`,
        updatedCount,
        timestamp: new Date()
      });
    } catch (error) {
      next(error);
    }
  });

  // Create a new test
  app.post("/api/tests", async (req, res, next) => {
    try {
      const testData = req.body;
      
      // Generate a unique ID for the test based on the category and subcategory
      const existingTests = await storage.getTestsByCategory(testData.category);
      let testCount = existingTests.length;
      
      // Use the imported generateTestId function to create a proper ID
      const testId = generateTestId(testData.category, testData.subCategory, testData.cptCode, testCount);
      
      // Create the test with the generated ID
      const newTest = await storage.insertTest({
        id: testId,
        ...testData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json({
        success: true,
        test: newTest
      });
    } catch (error) {
      console.error("Failed to create test:", error);
      next(error);
    }
  });

  // Update a test by ID
  app.patch("/api/tests/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Fetch the current test to verify it exists
      const existingTest = await storage.getTestById(id);
      if (!existingTest) {
        return res.status(404).json({ 
          error: {
            code: 'NOT_FOUND',
            message: `Test with ID ${id} not found`
          }
        });
      }
      
      // Check if we need to update the ID (if category, subcategory or cptCode changed)
      const categoryChanged = updateData.category && updateData.category !== existingTest.category;
      const subCategoryChanged = updateData.subCategory && updateData.subCategory !== existingTest.subCategory;
      const cptCodeChanged = updateData.cptCode && updateData.cptCode !== existingTest.cptCode;
      
      // If any of the ID components changed, generate a new ID
      if (categoryChanged || subCategoryChanged || cptCodeChanged) {
        // Get values to use for the new ID, using updated values or falling back to existing ones
        const category = updateData.category || existingTest.category;
        const subCategory = updateData.subCategory || existingTest.subCategory;
        const cptCode = updateData.cptCode || existingTest.cptCode;
        
        // Get tests count for the category to ensure uniqueness
        const categoryTests = await storage.getTestsByCategory(category);
        const testCount = categoryTests.length;
        
        // Generate a new ID based on the updated values
        const newId = generateTestId(category, subCategory, cptCode, testCount);
        
        // Add the new ID to the update data
        updateData.id = newId;
      }
      
      // Update the test
      const updatedTest = await storage.updateTest(id, updateData);
      if (!updatedTest) {
        return res.status(500).json({ 
          error: {
            code: 'UPDATE_FAILED',
            message: `Failed to update test with ID ${id}`
          }
        });
      }
      
      res.json({ 
        success: true,
        test: updatedTest
      });
    } catch (error) {
      next(error);
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date() });
  });
  
  // Register legal documentation routes
  app.use("/api", legalRoutes);

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to initialize test data from JSON files
async function initializeTestData() {
  try {
    // First check if we have a small dataset that should be replaced
    const existingTests = await storage.getAllTests();
    
    // Read the revised tests data
    let testsData;
    try {
      testsData = fs.readFileSync(
        path.resolve(process.cwd(), "attached_assets/tests_revised.json"), 
        'utf8'
      );
    } catch (err) {
      // If revised tests file doesn't exist, try the original file
      testsData = fs.readFileSync(
        path.resolve(process.cwd(), "attached_assets/tests.json"), 
        'utf8'
      );
    }

    // If we already have all the tests, return early
    const parsedTests = JSON.parse(testsData);
    const testsArray = Array.isArray(parsedTests) ? parsedTests : (parsedTests.tests || []);
    
    if (existingTests.length >= testsArray.length) {
      console.log(`✅ Database already contains ${existingTests.length} tests (out of ${testsArray.length} available)`);
      return;
    }
    
    // If we're here, we need to update or insert tests
    console.log(`🔄 Updating database with new test data. Current: ${existingTests.length}, New: ${testsArray.length}`);
    
    // First clear existing data if we have some but not all
    if (existingTests.length > 0) {
      // Delete all existing tests
      for (const test of existingTests) {
        await storage.deleteTest(test.id);
      }
      console.log(`🗑️ Cleared ${existingTests.length} existing tests for fresh import`);
    }
    
    // Add each test to storage
    let loadedCount = 0;
    for (const test of testsArray) {
      try {
        const now = new Date();
        await storage.insertTest({
          id: test.id,
          name: test.name,
          category: test.category,
          subCategory: test.sub_category || test.subCategory, // Handle both formats
          cptCode: test.cpt_code || test.cptCode || null, 
          loincCode: test.loinc_code || test.loincCode || null,
          snomedCode: test.snomed_code || test.snomedCode || null,
          description: test.description || null,
          notes: test.notes || "",
          createdAt: new Date(test.created_at || test.createdAt || now),
          updatedAt: new Date(test.updated_at || test.updatedAt || now)
        });
        loadedCount++;
      } catch (err) {
        console.error(`Error loading test ${test.id}:`, err);
      }
    }
    
    console.log(`✅ Loaded ${loadedCount} tests into database`);
  } catch (error) {
    console.error("Failed to initialize test data:", error);
  }
}
