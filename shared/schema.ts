import { pgTable, text, serial, timestamp, varchar, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Test schema
export const tests = pgTable("tests", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(),
  subCategory: varchar("subCategory").notNull(),
  cptCode: varchar("cptCode"),
  loincCode: varchar("loincCode"),
  snomedCode: varchar("snomedCode"),
  description: text("description"),
  notes: text("notes"),
  dataSource: varchar("dataSource").default("MANUAL"), // Track data origin: JSON_IMPORT, CSV_IMPORT, MANUAL, API_IMPORT
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const insertTestSchema = createInsertSchema(tests);
export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

// Bookmark schema (if needed for future implementation)
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: serial("userId").notNull(),
  testId: varchar("testId").notNull().references(() => tests.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ id: true });
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

// User schema (from the template, keeping for potential authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Regulatory documents
export const regulatoryDocuments = pgTable("regulatory_documents", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  country: varchar("country").notNull(), // Kenya, Nigeria, South Africa, etc.
  region: varchar("region"), // East Africa, West Africa, etc.
  documentType: varchar("document_type").notNull(), // "Regulation", "Guideline", "Standard", etc.
  summary: text("summary"),
  fullText: text("full_text"),
  url: varchar("url"),
  effectiveDate: timestamp("effective_date"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertRegulatoryDocumentSchema = createInsertSchema(regulatoryDocuments).omit({ id: true });
export type InsertRegulatoryDocument = z.infer<typeof insertRegulatoryDocumentSchema>;
export type RegulatoryDocument = typeof regulatoryDocuments.$inferSelect;

// Vendors for marketplace
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  vendorName: varchar("vendor_name").notNull(),
  country: varchar("country").notNull(),
  region: varchar("region"),
  vendorType: varchar("vendor_type"), // "Manufacturer", "Distributor", "Service Provider"
  productCategories: text("product_categories").array(), // Categories of products
  contactInformation: json("contact_information"),
  website: varchar("website"),
  certifications: text("certifications").array(),
  servicesOffered: text("services_offered").array(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true });
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// Products (for the vendor marketplace)
export const products = pgTable("products", {
  id: varchar("id").primaryKey(),
  vendorId: serial("vendor_id").references(() => vendors.id),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(),
  subCategory: varchar("sub_category"),
  description: text("description"),
  specifications: json("specifications"), // Technical specs as JSON
  regulatoryApprovals: text("regulatory_approvals").array(), // List of approvals
  availableCountries: text("available_countries").array(), // Countries where available
  price: json("price"), // Price information as JSON (allows for diff currencies)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products);
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Product codes mapping
export const productCodes = pgTable("product_codes", {
  id: serial("id").primaryKey(),
  productId: varchar("product_id").notNull().references(() => products.id),
  codeSystem: varchar("code_system").notNull(), // "UN", "EU", "US-FDA", "China-NMPA", etc.
  code: varchar("code").notNull(),
  description: text("description"),
  lastVerified: timestamp("last_verified").defaultNow(),
});

export const insertProductCodeSchema = createInsertSchema(productCodes).omit({ id: true });
export type InsertProductCode = z.infer<typeof insertProductCodeSchema>;
export type ProductCode = typeof productCodes.$inferSelect;

// Referral facilities 
export const referralFacilities = pgTable("referral_facilities", {
  id: serial("id").primaryKey(),
  facilityName: varchar("facility_name").notNull(),
  country: varchar("country").notNull(),
  region: varchar("region"),
  facilityType: varchar("facility_type"), // "Hospital", "Lab", "Clinic", etc.
  specializationAreas: text("specialization_areas").array(), // Array of specialties
  contactInformation: json("contact_information"), // Contact details as JSON
  testCapabilities: text("test_capabilities").array(), // Tests they can perform
  referralGuidelines: text("referral_guidelines"), // Guidelines for making referrals
  accreditations: text("accreditations").array(), // Accreditation information
});

export const insertReferralFacilitySchema = createInsertSchema(referralFacilities).omit({ id: true });
export type InsertReferralFacility = z.infer<typeof insertReferralFacilitySchema>;
export type ReferralFacility = typeof referralFacilities.$inferSelect;

// Import session tracking for audit reports
export const importSessions = pgTable("import_sessions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().references(() => users.id),
  filename: varchar("filename").notNull(),
  fileSize: serial("file_size"), // in bytes
  totalTests: serial("total_tests").notNull(),
  successCount: serial("success_count").notNull(),
  errorCount: serial("error_count").notNull(),
  duplicateCount: serial("duplicate_count").notNull(),
  validationErrors: json("validation_errors"), // Array of validation error messages
  importStatus: varchar("import_status").notNull(), // 'completed', 'failed', 'partial'
  isReportable: boolean("is_reportable").default(false), // Only true when tests were actually added
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"), // Optional notes about the import
});

export const insertImportSessionSchema = createInsertSchema(importSessions).omit({ id: true });
export type InsertImportSession = z.infer<typeof insertImportSessionSchema>;
export type ImportSession = typeof importSessions.$inferSelect;

// Detailed audit log for each test in an import session
export const importAuditLogs = pgTable("import_audit_logs", {
  id: serial("id").primaryKey(),
  sessionId: serial("session_id").notNull().references(() => importSessions.id),
  testId: varchar("test_id"), // May be null if test creation failed
  originalTestId: varchar("original_test_id"), // ID from CSV file
  operation: varchar("operation").notNull(), // 'insert', 'update', 'skip', 'error'
  status: varchar("status").notNull(), // 'success', 'failed', 'duplicate', 'validation_error'
  errorMessage: text("error_message"), // Error details if failed
  validationErrors: json("validation_errors"), // Field-specific validation errors
  originalData: json("original_data"), // The raw CSV row data
  processedData: json("processed_data"), // The processed test data
  duplicateReason: varchar("duplicate_reason"), // 'id_exists', 'cpt_code_exists'
  processingTime: serial("processing_time"), // Time in ms to process this test
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertImportAuditLogSchema = createInsertSchema(importAuditLogs).omit({ id: true });
export type InsertImportAuditLog = z.infer<typeof insertImportAuditLogSchema>;
export type ImportAuditLog = typeof importAuditLogs.$inferSelect;
