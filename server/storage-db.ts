import { eq, like, or } from 'drizzle-orm';
import { 
  tests, 
  type Test, 
  type InsertTest,
  users,
  type User,
  type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
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
    const result = await db
      .update(tests)
      .set({ ...testUpdate, updatedAt: new Date() })
      .where(eq(tests.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
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
}

export const dbStorage = new DatabaseStorage();