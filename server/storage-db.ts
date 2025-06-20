import { eq, like, or, desc, and } from 'drizzle-orm';
import { 
  tests, 
  type Test, 
  type InsertTest,
  users,
  type User,
  type InsertUser,
  importSessions,
  type ImportSession,
  type InsertImportSession,
  importAuditLogs,
  type ImportAuditLog,
  type InsertImportAuditLog
} from "@shared/schema";
import { db } from "./db";
import { IStorage } from './storage';
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from './db';

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
  }
  // Test methods
  async getAllTests(): Promise<Test[]> {
    return await db.select().from(tests);
  }

  async getTestById(id: string): Promise<Test | undefined> {
    const result = await db.select().from(tests).where(eq(tests.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getTestsByCategory(category: string): Promise<Test[]> {
    return await db
      .select()
      .from(tests)
      .where(eq(tests.category, category));
  }

  async getTestsBySubCategory(subCategory: string): Promise<Test[]> {
    return await db
      .select()
      .from(tests)
      .where(eq(tests.subCategory, subCategory));
  }

  async searchTests(query: string): Promise<Test[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(tests)
      .where(
        or(
          like(tests.name, lowerQuery),
          like(tests.description, lowerQuery),
          like(tests.cptCode, lowerQuery),
          like(tests.loincCode, lowerQuery),
          like(tests.snomedCode, lowerQuery)
        )
      );
  }

  async insertTest(test: InsertTest): Promise<Test> {
    const result = await db.insert(tests).values(test).returning();
    return result[0];
  }

  async updateTest(id: string, testUpdate: Partial<Test>): Promise<Test | undefined> {
    // Check if we're updating the id (primary key)
    if (testUpdate.id && testUpdate.id !== id) {
      // If changing the ID, we need to:
      // 1. Get the existing test's full data
      const existingTest = await this.getTestById(id);
      if (!existingTest) {
        return undefined;
      }

      // 2. Create a new record with the new ID and merged data
      const newTest: InsertTest = {
        ...existingTest,
        ...testUpdate,
        updatedAt: new Date(),
      };

      // 3. Insert the new record
      const insertResult = await db.insert(tests).values(newTest).returning();
      
      // 4. Delete the old record
      await db.delete(tests).where(eq(tests.id, id));
      
      return insertResult.length > 0 ? insertResult[0] : undefined;
    } else {
      // Regular update without changing ID
      const result = await db
        .update(tests)
        .set({ ...testUpdate, updatedAt: new Date() })
        .where(eq(tests.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : undefined;
    }
  }

  async deleteTest(id: string): Promise<boolean> {
    const result = await db
      .delete(tests)
      .where(eq(tests.id, id))
      .returning({ id: tests.id });
    
    return result.length > 0;
  }

  async getTestCountByCategory(): Promise<{ category: string; count: number }[]> {
    // For simplicity, we'll query all tests and count them in memory
    const allTests = await this.getAllTests();
    const categoryCounts = new Map<string, number>();
    
    allTests.forEach(test => {
      const currentCount = categoryCounts.get(test.category) || 0;
      categoryCounts.set(test.category, currentCount + 1);
    });
    
    return Array.from(categoryCounts.entries()).map(([category, count]) => ({
      category,
      count
    }));
  }

  async getTestCountBySubCategory(): Promise<{ subCategory: string; count: number }[]> {
    // For simplicity, we'll query all tests and count them in memory
    const allTests = await this.getAllTests();
    const subCategoryCounts = new Map<string, number>();
    
    allTests.forEach(test => {
      if (test.subCategory) {
        const currentCount = subCategoryCounts.get(test.subCategory) || 0;
        subCategoryCounts.set(test.subCategory, currentCount + 1);
      }
    });
    
    return Array.from(subCategoryCounts.entries()).map(([subCategory, count]) => ({
      subCategory,
      count
    }));
  }
  
  // Laboratory Tests and Imaging Studies methods
  async getLaboratoryTests(): Promise<Test[]> {
    return await db
      .select()
      .from(tests)
      .where(eq(tests.category, 'Laboratory Tests'));
  }
  
  async getImagingStudies(): Promise<Test[]> {
    return await db
      .select()
      .from(tests)
      .where(eq(tests.category, 'Imaging Studies'));
  }
  
  // Using centralized utilities for code lookup
  private findLoincCode(test: Test): string | null {
    try {
      // Import at runtime to avoid circular dependencies
      const { findLoincCode } = require('./utils/code-utils');
      return findLoincCode(test);
    } catch (error) {
      console.error(`Error finding LOINC code for test ${test.id}:`, error);
      return null;
    }
  }
  
  // Helper function to find SNOMED code for an imaging study
  private findSnomedCode(test: Test): string | null {
    try {
      // Import at runtime to avoid circular dependencies
      const { findSnomedCode } = require('./utils/code-utils');
      return findSnomedCode(test);
    } catch (error) {
      console.error(`Error finding SNOMED code for test ${test.id}:`, error);
      return null;
    }
  }
  
  async updateLoincCodes(): Promise<number> {
    let updatedCount = 0;
    const labTests = await this.getLaboratoryTests();
    
    for (const test of labTests) {
      if (!test.loincCode) {
        const loincCode = this.findLoincCode(test);
        if (loincCode) {
          await this.updateTest(test.id, { loincCode });
          updatedCount++;
          console.log(`Updated laboratory test "${test.name}" with LOINC code: ${loincCode}`);
        }
      }
    }
    
    return updatedCount;
  }
  
  async updateSnomedCodes(): Promise<number> {
    let updatedCount = 0;
    const imagingStudies = await this.getImagingStudies();
    
    for (const study of imagingStudies) {
      if (!study.snomedCode) {
        const snomedCode = this.findSnomedCode(study);
        if (snomedCode) {
          await this.updateTest(study.id, { snomedCode });
          updatedCount++;
          console.log(`Updated imaging study "${study.name}" with SNOMED code: ${snomedCode}`);
        }
      }
    }
    
    return updatedCount;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Import audit methods
  async createImportSession(session: InsertImportSession): Promise<ImportSession> {
    const result = await db.insert(importSessions).values(session).returning();
    return result[0];
  }

  async updateImportSession(id: number, updates: Partial<ImportSession>): Promise<ImportSession | undefined> {
    const result = await db
      .update(importSessions)
      .set({ ...updates, completedAt: new Date() })
      .where(eq(importSessions.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async getImportSessions(limit: number = 50): Promise<ImportSession[]> {
    return await db
      .select()
      .from(importSessions)
      .where(eq(importSessions.isReportable, true))
      .orderBy(desc(importSessions.startedAt))
      .limit(limit);
  }

  async getAllImportSessions(limit: number = 50): Promise<ImportSession[]> {
    return await db
      .select()
      .from(importSessions)
      .orderBy(desc(importSessions.startedAt))
      .limit(limit);
  }

  async getImportSessionById(id: number): Promise<ImportSession | undefined> {
    const result = await db.select().from(importSessions).where(eq(importSessions.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createImportAuditLog(log: InsertImportAuditLog): Promise<ImportAuditLog> {
    const result = await db.insert(importAuditLogs).values(log).returning();
    return result[0];
  }

  async getImportAuditLogs(sessionId: number): Promise<ImportAuditLog[]> {
    return await db
      .select()
      .from(importAuditLogs)
      .where(eq(importAuditLogs.sessionId, sessionId))
      .orderBy(desc(importAuditLogs.createdAt));
  }

  async getImportSessionsForUser(userId: number, limit: number = 20): Promise<ImportSession[]> {
    return await db
      .select()
      .from(importSessions)
      .where(and(eq(importSessions.userId, userId), eq(importSessions.isReportable, true)))
      .orderBy(desc(importSessions.startedAt))
      .limit(limit);
  }
}

export const dbStorage = new DatabaseStorage();