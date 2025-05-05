import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
    // Read tests.json
    const testsData = fs.readFileSync(
      path.resolve(process.cwd(), "attached_assets/tests.json"), 
      'utf8'
    );
    const parsedTests = JSON.parse(testsData);
    
    // Add each test to storage, converting snake_case to camelCase
    for (const test of parsedTests.tests) {
      await storage.insertTest({
        id: test.id,
        name: test.name,
        category: test.category,
        subCategory: test.sub_category,
        cptCode: test.cpt_code,
        loincCode: test.loinc_code,
        snomedCode: test.snomed_code,
        description: test.description,
        notes: test.notes,
        createdAt: new Date(test.created_at),
        updatedAt: new Date(test.updated_at)
      });
    }
    
    console.log(`✅ Loaded ${parsedTests.tests.length} tests into storage`);
  } catch (error) {
    console.error("Failed to initialize test data:", error);
  }
}
