import { 
  tests, 
  type Test, 
  type InsertTest,
  users,
  type User,
  type InsertUser
} from "@shared/schema";

export interface IStorage {
  // Test methods
  getAllTests(): Promise<Test[]>;
  getTestById(id: string): Promise<Test | undefined>;
  getTestsByCategory(category: string): Promise<Test[]>;
  getTestsBySubCategory(subCategory: string): Promise<Test[]>;
  searchTests(query: string): Promise<Test[]>;
  insertTest(test: InsertTest): Promise<Test>;
  updateTest(id: string, test: Partial<Test>): Promise<Test | undefined>;
  deleteTest(id: string): Promise<boolean>;
  
  // Category and SubCategory counts
  getTestCountByCategory(): Promise<{ category: string; count: number }[]>;
  getTestCountBySubCategory(): Promise<{ subCategory: string; count: number }[]>;
  
  // User methods (from template)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private tests: Map<string, Test>;
  private users: Map<number, User>;
  private currentUserId: number;

  constructor() {
    this.tests = new Map();
    this.users = new Map();
    this.currentUserId = 1;
    
    // Initialize with pre-loaded test data if needed
  }

  // Test methods
  async getAllTests(): Promise<Test[]> {
    return Array.from(this.tests.values());
  }

  async getTestById(id: string): Promise<Test | undefined> {
    return this.tests.get(id);
  }

  async getTestsByCategory(category: string): Promise<Test[]> {
    return Array.from(this.tests.values()).filter(test => 
      test.category.toLowerCase() === category.toLowerCase()
    );
  }

  async getTestsBySubCategory(subCategory: string): Promise<Test[]> {
    return Array.from(this.tests.values()).filter(test => 
      test.subCategory.toLowerCase() === subCategory.toLowerCase()
    );
  }

  async searchTests(query: string): Promise<Test[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tests.values()).filter(test => 
      test.name.toLowerCase().includes(lowerQuery) ||
      test.description?.toLowerCase().includes(lowerQuery) ||
      test.cptCode?.toLowerCase().includes(lowerQuery) ||
      test.loincCode?.toLowerCase().includes(lowerQuery) ||
      test.snomedCode?.toLowerCase().includes(lowerQuery)
    );
  }

  async insertTest(test: InsertTest): Promise<Test> {
    // Ensure the test has an ID
    if (!test.id) {
      throw new Error("Test ID is required");
    }
    
    const newTest: Test = {
      id: test.id,
      name: test.name,
      category: test.category,
      subCategory: test.subCategory,
      cptCode: test.cptCode ?? null,
      loincCode: test.loincCode ?? null,
      snomedCode: test.snomedCode ?? null,
      description: test.description ?? null,
      notes: test.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.tests.set(test.id, newTest);
    return newTest;
  }

  async updateTest(id: string, testUpdate: Partial<Test>): Promise<Test | undefined> {
    const existingTest = this.tests.get(id);
    
    if (!existingTest) {
      return undefined;
    }
    
    // Ensure all nullable fields are properly typed
    const updatedTest: Test = {
      id: existingTest.id,
      name: testUpdate.name ?? existingTest.name,
      category: testUpdate.category ?? existingTest.category,
      subCategory: testUpdate.subCategory ?? existingTest.subCategory,
      cptCode: testUpdate.cptCode !== undefined ? testUpdate.cptCode : existingTest.cptCode,
      loincCode: testUpdate.loincCode !== undefined ? testUpdate.loincCode : existingTest.loincCode,
      snomedCode: testUpdate.snomedCode !== undefined ? testUpdate.snomedCode : existingTest.snomedCode,
      description: testUpdate.description !== undefined ? testUpdate.description : existingTest.description,
      notes: testUpdate.notes !== undefined ? testUpdate.notes : existingTest.notes,
      createdAt: existingTest.createdAt,
      updatedAt: new Date()
    };
    
    this.tests.set(id, updatedTest);
    return updatedTest;
  }

  async deleteTest(id: string): Promise<boolean> {
    return this.tests.delete(id);
  }

  async getTestCountByCategory(): Promise<{ category: string; count: number }[]> {
    const categoryCounts = new Map<string, number>();
    
    Array.from(this.tests.values()).forEach(test => {
      const currentCount = categoryCounts.get(test.category) || 0;
      categoryCounts.set(test.category, currentCount + 1);
    });
    
    return Array.from(categoryCounts.entries()).map(([category, count]) => ({
      category,
      count
    }));
  }

  async getTestCountBySubCategory(): Promise<{ subCategory: string; count: number }[]> {
    const subCategoryCounts = new Map<string, number>();
    
    Array.from(this.tests.values()).forEach(test => {
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

  // User methods (from template)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
