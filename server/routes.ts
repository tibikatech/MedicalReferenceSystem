import type { Express } from "express";
import { createServer, type Server } from "http";
import { dbStorage as storage } from "./storage-db";
import fs from 'fs';
import path from 'path';

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

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date() });
  });

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
