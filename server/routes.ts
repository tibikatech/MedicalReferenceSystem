import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { dbStorage as storage } from "./storage-db";
import { errorHandler, createNotFoundError } from "./utils/error-handler";
import { VALID_CATEGORIES, generateTestId } from "./utils/medical-constants";
import fs from 'fs';
import path from 'path';
import legalRoutes from './legal-routes';
import { setupAuth } from './auth';

import { createDefaultAdmin } from "./utils/init-admin";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize the storage with test data
  await initializeTestData();
  
  // Setup authentication
  setupAuth(app);
  
  // Create default admin user
  await createDefaultAdmin();
  
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
  
  // Bulk delete tests - MUST come before the :id route
  app.delete("/api/tests/bulk-delete", async (req, res) => {
    try {
      const { testIds } = req.body;
      
      // Validate request body
      if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
        return res.status(400).json({ error: "testIds array is required and cannot be empty" });
      }
      
      // Validate that all testIds are strings
      if (!testIds.every(id => typeof id === 'string')) {
        return res.status(400).json({ error: "All test IDs must be strings" });
      }
      
      let deletedCount = 0;
      const failedDeletions: string[] = [];
      const testNames: string[] = [];
      
      // First, get all test names for progress tracking
      for (const testId of testIds) {
        try {
          const test = await storage.getTestById(testId);
          testNames.push(test ? test.name : `Unknown (${testId})`);
        } catch (error) {
          testNames.push(`Unknown (${testId})`);
        }
      }
      
      // Delete each test
      for (let i = 0; i < testIds.length; i++) {
        const testId = testIds[i];
        const testName = testNames[i];
        
        try {
          // Check if test exists
          const test = await storage.getTestById(testId);
          if (!test) {
            failedDeletions.push(`Test "${testName}" not found`);
            continue;
          }
          
          // Delete the test
          const deleted = await storage.deleteTest(testId);
          if (deleted) {
            deletedCount++;
          } else {
            failedDeletions.push(`Failed to delete test "${testName}"`);
          }
        } catch (error) {
          failedDeletions.push(`Error deleting test "${testName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Return results
      if (failedDeletions.length > 0) {
        return res.status(207).json({ 
          deletedCount,
          failedCount: failedDeletions.length,
          errors: failedDeletions,
          message: `Successfully deleted ${deletedCount} tests, ${failedDeletions.length} failed`
        });
      } else {
        return res.json({ 
          deletedCount,
          message: `Successfully deleted ${deletedCount} tests`
        });
      }
    } catch (error) {
      console.error("Error in bulk delete:", error);
      res.status(500).json({ error: "Failed to bulk delete tests" });
    }
  });

  // Delete test by ID - MUST come after bulk-delete route
  app.delete("/api/tests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if test exists
      const test = await storage.getTestById(id);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      
      // Delete the test
      const deleted = await storage.deleteTest(id);
      if (deleted) {
        return res.json({ success: true, message: `Test deleted successfully` });
      } else {
        return res.status(500).json({ error: "Failed to delete test" });
      }
    } catch (error) {
      console.error(`Error deleting test ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete test" });
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
      
      // Determine data source based on request headers or default to CSV_IMPORT for imports
      const dataSource = req.headers['x-import-source'] === 'csv' ? 'CSV_IMPORT' : 
                        req.headers['x-import-source'] === 'api' ? 'API_IMPORT' : 'MANUAL';
      
      // Create the test with the generated ID and data source tracking
      const newTest = await storage.insertTest({
        id: testId,
        ...testData,
        dataSource,
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
      
      // If the client has already sent an updated ID, use that
      if (updateData.id && updateData.id !== id) {
        console.log(`Using client-provided ID: ${updateData.id} (was: ${id})`);
      } 
      // Otherwise check if we need to generate a new ID (if category, subcategory or cptCode changed)
      else {
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
          console.log(`Generated new ID: ${newId} (was: ${id})`);
        }
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

  // Data source statistics endpoint for monitoring import sources
  app.get("/api/data-source-stats", async (req, res, next) => {
    try {
      const stats = await storage.getDataSourceStatistics();
      res.json({ 
        stats,
        protectionSettings: {
          jsonImportAllowed: process.env.ALLOW_JSON_IMPORT !== 'false',
          forceOverrideRequired: process.env.FORCE_JSON_OVERRIDE === 'true',
          protectionThreshold: 50
        },
        timestamp: new Date()
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Import audit reporting routes
  app.get("/api/import-sessions", async (req, res, next) => {
    try {
      const { limit = 50 } = req.query;
      const sessions = await storage.getImportSessions(Number(limit));
      res.json({ sessions });
    } catch (error) {
      next(error);
    }
  });

  // Admin route to view all import sessions (including non-reportable ones)
  app.get("/api/import-sessions/all", async (req, res, next) => {
    try {
      const { limit = 50 } = req.query;
      const sessions = await storage.getAllImportSessions(Number(limit));
      res.json({ sessions });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/import-sessions/:id", async (req, res, next) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getImportSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Import session not found" });
      }
      
      const auditLogs = await storage.getImportAuditLogs(sessionId);
      res.json({ session, auditLogs });
    } catch (error) {
      next(error);
    }
  });

  // CPT duplicates analysis endpoint
  app.get("/api/cpt-duplicates", async (req, res, next) => {
    try {
      const duplicates = await storage.getCptDuplicates();
      res.json({ duplicates });
    } catch (error) {
      next(error);
    }
  });

  // CPT families analysis endpoint
  app.get("/api/cpt-families", async (req, res, next) => {
    try {
      const families = await storage.getCptFamilies();
      res.json({ families });
    } catch (error) {
      next(error);
    }
  });

  // Data source statistics endpoint
  app.get("/api/data-source-stats", async (req, res, next) => {
    try {
      const statistics = await storage.getDataSourceStatistics();
      res.json({ statistics });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/import-sessions/user/:userId", async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const { limit = 20 } = req.query;
      const sessions = await storage.getImportSessionsForUser(userId, Number(limit));
      res.json({ sessions });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/import-sessions", async (req, res, next) => {
    try {
      const sessionData = req.body;
      const session = await storage.createImportSession(sessionData);
      res.json({ session });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/import-sessions/:id", async (req, res, next) => {
    try {
      const sessionId = parseInt(req.params.id);
      const updates = req.body;
      const session = await storage.updateImportSession(sessionId, updates);
      
      if (!session) {
        return res.status(404).json({ error: "Import session not found" });
      }
      
      res.json({ session });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/import-audit-logs", async (req, res, next) => {
    try {
      const logData = req.body;
      const log = await storage.createImportAuditLog(logData);
      res.json({ log });
    } catch (error) {
      next(error);
    }
  });

  // Register legal documentation routes
  app.use("/api", legalRoutes);

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to initialize test data from JSON files with protective safeguards
async function initializeTestData() {
  try {
    // CRITICAL PROTECTION #1: Environment variable control
    const allowJsonImport = process.env.ALLOW_JSON_IMPORT !== 'false';
    if (!allowJsonImport) {
      console.log(`🛡️ JSON import disabled by ALLOW_JSON_IMPORT environment variable`);
      return;
    }

    // CRITICAL PROTECTION #2: Database state protection
    const existingTests = await storage.getAllTests();
    const PROTECTION_THRESHOLD = 50; // Don't overwrite if we have substantial data
    
    if (existingTests.length >= PROTECTION_THRESHOLD) {
      console.log(`🛡️ Database protection active: ${existingTests.length} tests exist (>=${PROTECTION_THRESHOLD}). Skipping JSON import to preserve CSV-imported data.`);
      console.log(`   To force JSON import, set ALLOW_JSON_IMPORT=true and FORCE_JSON_OVERRIDE=true`);
      return;
    }

    // CRITICAL PROTECTION #3: Force override check for substantial databases
    if (existingTests.length > 0 && process.env.FORCE_JSON_OVERRIDE !== 'true') {
      console.log(`🛡️ Existing ${existingTests.length} tests found. Set FORCE_JSON_OVERRIDE=true to override.`);
      return;
    }
    
    // Read the revised tests data
    let testsData;
    try {
      testsData = fs.readFileSync(
        path.resolve(process.cwd(), "attached_assets/tests_revised.json"), 
        'utf8'
      );
    } catch (err) {
      // If revised tests file doesn't exist, try the original file
      try {
        testsData = fs.readFileSync(
          path.resolve(process.cwd(), "attached_assets/tests.json"), 
          'utf8'
        );
      } catch (secondErr) {
        console.log(`ℹ️ No JSON test files found. Database will remain unchanged.`);
        return;
      }
    }

    // Parse and validate JSON data
    const parsedTests = JSON.parse(testsData);
    const testsArray = Array.isArray(parsedTests) ? parsedTests : (parsedTests.tests || []);
    
    if (testsArray.length === 0) {
      console.log(`ℹ️ No tests found in JSON file. Database will remain unchanged.`);
      return;
    }
    
    // PROTECTION #4: Data source tracking and backup warning
    if (existingTests.length > 0) {
      console.log(`⚠️ WARNING: About to replace ${existingTests.length} existing tests with ${testsArray.length} JSON tests`);
      console.log(`   This action will delete existing data. Continuing in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Delete existing tests but preserve their audit trail
      for (const test of existingTests) {
        await storage.deleteTest(test.id);
      }
      console.log(`🗑️ Cleared ${existingTests.length} existing tests for JSON import`);
    }
    
    // Add each test to storage with JSON_IMPORT data source
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
          dataSource: "JSON_IMPORT", // Track data source
          createdAt: new Date(test.created_at || test.createdAt || now),
          updatedAt: new Date(test.updated_at || test.updatedAt || now)
        });
        loadedCount++;
      } catch (err) {
        console.error(`Error loading test ${test.id}:`, err);
      }
    }
    
    console.log(`✅ Loaded ${loadedCount} tests from JSON with data source tracking`);
  } catch (error) {
    console.error("Failed to initialize test data:", error);
  }
}
