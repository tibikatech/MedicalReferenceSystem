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
  
  // Helper function to find LOINC code for a laboratory test
  private findLoincCode(test: Test): string | null {
    // This is a simplified implementation - in a real application,
    // this would likely involve calling an external LOINC API or 
    // looking up in a more comprehensive local database
    
    // For the purpose of this implementation, we'll use a simple mapping based on test name
    const loincMappings: Record<string, string> = {
      'Complete Blood Count (CBC)': '58410-2',
      'Comprehensive Metabolic Panel': '24323-8',
      'Liver Function Tests': '1991-9',
      'Kidney Function Tests': '2160-0',
      'Hemoglobin A1c (HbA1c)': '4544-3'
      // In a real app, this would be much more extensive
    };
    
    return loincMappings[test.name] || test.loincCode || null;
  }
  
  // Helper function to find SNOMED code for an imaging study
  private findSnomedCode(test: Test): string | null {
    // This is a simplified implementation - in a real application,
    // this would likely involve calling an external SNOMED CT API or
    // looking up in a more comprehensive local database
    
    // For the purpose of this implementation, we'll use a simple mapping based on test name
    const snomedMappings: Record<string, string> = {
      'Chest X-ray': '399208008',
      'Abdominal Ultrasound': '241551004',
      'CT Scan of Brain': '303653007',
      'MRI of Knee': '429530000',
      'PET Scan': '310128004'
      // In a real app, this would be much more extensive
    };
    
    return snomedMappings[test.name] || test.snomedCode || null;
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
}

export const dbStorage = new DatabaseStorage();