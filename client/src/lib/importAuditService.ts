import { Test } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export interface ImportSessionData {
  userId: number;
  filename: string;
  fileSize: number;
  totalTests: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  validationErrors: string[] | null;
  importStatus: 'completed' | 'failed' | 'partial';
  notes?: string;
}

export interface ImportAuditLogData {
  sessionId: number;
  testId?: string;
  originalTestId?: string;
  operation: 'insert' | 'update' | 'skip' | 'error';
  status: 'success' | 'failed' | 'duplicate' | 'validation_error';
  errorMessage?: string;
  validationErrors?: Record<string, string>;
  originalData?: Record<string, any>;
  processedData?: Record<string, any>;
  duplicateReason?: string;
  processingTime?: number;
}

export class ImportAuditService {
  private sessionId: number | null = null;
  private startTime: number = 0;
  private logs: ImportAuditLogData[] = [];

  async startImportSession(filename: string, fileSize: number, totalTests: number, userId: number): Promise<number> {
    this.startTime = Date.now();
    this.logs = [];

    const sessionData: ImportSessionData = {
      userId,
      filename,
      fileSize,
      totalTests,
      successCount: 0,
      errorCount: 0,
      duplicateCount: 0,
      validationErrors: null,
      importStatus: 'completed' // Will be updated based on results
    };

    try {
      const response = await fetch('/api/import-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create import session');
      }

      const result = await response.json();
      this.sessionId = result.session.id;
      return this.sessionId;
    } catch (error) {
      console.error('Error creating import session:', error);
      throw error;
    }
  }

  async logTestProcessing(
    originalData: Record<string, any>,
    operation: 'insert' | 'update' | 'skip' | 'error',
    result: { 
      success: boolean; 
      testId?: string; 
      error?: string; 
      validationErrors?: Record<string, string>;
      duplicateReason?: string;
    }
  ) {
    if (!this.sessionId) {
      console.error('No active import session');
      return;
    }

    const processingTime = Date.now() - this.startTime;
    
    const logData: ImportAuditLogData = {
      sessionId: this.sessionId,
      testId: result.testId,
      originalTestId: originalData.id || originalData.testId,
      operation,
      status: result.success ? 'success' : 
              result.duplicateReason ? 'duplicate' : 
              result.validationErrors ? 'validation_error' : 'failed',
      errorMessage: result.error,
      validationErrors: result.validationErrors,
      originalData,
      processedData: result.success ? { 
        id: result.testId,
        operation,
        timestamp: new Date().toISOString()
      } : null,
      duplicateReason: result.duplicateReason,
      processingTime
    };

    // Store log for batch processing
    this.logs.push(logData);

    // Send individual log to server
    try {
      await fetch('/api/import-audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }

  async finishImportSession(
    successCount: number, 
    errorCount: number, 
    duplicateCount: number, 
    validationErrors: string[] = [],
    notes?: string
  ) {
    if (!this.sessionId) {
      console.error('No active import session to finish');
      return;
    }

    const importStatus: 'completed' | 'failed' | 'partial' = 
      errorCount === 0 ? 'completed' :
      successCount === 0 ? 'failed' : 'partial';

    const updates = {
      successCount,
      errorCount,
      duplicateCount,
      validationErrors: validationErrors.length > 0 ? validationErrors : null,
      importStatus,
      notes
    };

    try {
      await fetch(`/api/import-sessions/${this.sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      // Reset session
      this.sessionId = null;
      this.logs = [];
    } catch (error) {
      console.error('Error updating import session:', error);
      throw error;
    }
  }

  getSessionId(): number | null {
    return this.sessionId;
  }

  getLogs(): ImportAuditLogData[] {
    return [...this.logs];
  }
}

// Validation helper functions
export const validateTestData = (testData: Record<string, any>): { 
  isValid: boolean; 
  errors: Record<string, string> 
} => {
  const errors: Record<string, string> = {};

  // Required fields validation
  if (!testData.name || !testData.name.trim()) {
    errors.name = 'Test name is required';
  }

  if (!testData.category || !testData.category.trim()) {
    errors.category = 'Category is required';
  }

  if (!testData.subCategory || !testData.subCategory.trim()) {
    errors.subCategory = 'Subcategory is required';
  }

  // CPT code validation (if provided)
  if (testData.cptCode && !/^\d{5}$/.test(testData.cptCode)) {
    errors.cptCode = 'CPT code must be 5 digits';
  }

  // LOINC code validation (if provided)
  if (testData.loincCode && !/^\d+-\d+$/.test(testData.loincCode)) {
    errors.loincCode = 'LOINC code must be in format XXXXX-X';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// CSV parsing with enhanced error handling
export const parseCSVWithValidation = (csvContent: string): {
  success: boolean;
  data: Record<string, any>[];
  errors: string[];
} => {
  const errors: string[] = [];
  const data: Record<string, any>[] = [];

  try {
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return {
        success: false,
        data: [],
        errors: ['CSV file must contain at least a header row and one data row']
      };
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Validate required headers
    const requiredHeaders = ['name', 'category', 'subCategory'];
    const missingHeaders = requiredHeaders.filter(req => 
      !headers.some(h => h.toLowerCase() === req.toLowerCase())
    );
    
    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validate row data
        const validation = validateTestData(row);
        if (!validation.isValid) {
          errors.push(`Row ${i}: ${Object.values(validation.errors).join(', ')}`);
        } else {
          data.push(row);
        }
      } catch (error) {
        errors.push(`Error parsing row ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      data,
      errors
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
};

// Enhanced duplicate detection
export const detectDuplicates = (
  importData: Record<string, any>[], 
  existingTests: Test[]
): {
  duplicatesById: Record<string, any>[];
  duplicatesByCptCode: Record<string, any>[];
  uniqueTests: Record<string, any>[];
} => {
  const duplicatesById: Record<string, any>[] = [];
  const duplicatesByCptCode: Record<string, any>[] = [];
  const uniqueTests: Record<string, any>[] = [];

  const existingIds = new Set(existingTests.map(t => t.id));
  const existingCptCodes = new Set(existingTests.map(t => t.cptCode).filter(Boolean));

  for (const testData of importData) {
    let isDuplicate = false;

    // Check for ID duplicates
    if (testData.id && existingIds.has(testData.id)) {
      duplicatesById.push(testData);
      isDuplicate = true;
    }

    // Check for CPT code duplicates
    if (testData.cptCode && existingCptCodes.has(testData.cptCode)) {
      duplicatesByCptCode.push(testData);
      isDuplicate = true;
    }

    if (!isDuplicate) {
      uniqueTests.push(testData);
    }
  }

  return {
    duplicatesById,
    duplicatesByCptCode,
    uniqueTests
  };
};