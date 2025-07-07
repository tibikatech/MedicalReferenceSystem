import { Test } from "@shared/schema";

export interface ExportOptions {
  exportFormat: 'standard' | 'consolidated' | 'legacy';
  groupByCptFamily: boolean;
  includeCptSuffixes: boolean;
  includeBaseCptCode: boolean;
}

export interface ConsolidatedCptFamily {
  baseCptCode: string;
  variations: Array<{
    suffix: string | null;
    testName: string;
    testId: string;
    category: string;
    subCategory: string;
    loincCode: string | null;
    snomedCode: string | null;
    description: string | null;
  }>;
  totalCount: number;
}

/**
 * Standard Export: Include both base CPT and suffix in separate columns
 */
export function generateStandardCSV(tests: Test[], options: ExportOptions): string {
  const headers = [
    'id',
    'name',
    'category',
    'subCategory',
    'cptCode',
    ...(options.includeBaseCptCode ? ['baseCptCode'] : []),
    ...(options.includeCptSuffixes ? ['cptSuffix'] : []),
    'loincCode',
    'snomedCode',
    'description',
    'notes'
  ];

  let csv = headers.join(',') + '\n';

  tests.forEach(test => {
    const row = headers.map(header => {
      const value = test[header as keyof Test];
      
      if (value === null || value === undefined) {
        return '';
      }
      
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    
    csv += row.join(',') + '\n';
  });

  return csv;
}

/**
 * Consolidated Export: Group tests by base CPT code with suffix variations listed
 */
export function generateConsolidatedCSV(tests: Test[]): string {
  const families = consolidateTestsByCptFamily(tests);
  
  const headers = [
    'baseCptCode',
    'familySize',
    'suffixVariations',
    'testNames',
    'testIds',
    'categories',
    'subCategories',
    'descriptions'
  ];

  let csv = headers.join(',') + '\n';

  families.forEach(family => {
    const suffixes = family.variations.map(v => v.suffix || 'none').join('|');
    const testNames = family.variations.map(v => v.testName).join('|');
    const testIds = family.variations.map(v => v.testId).join('|');
    const categories = [...new Set(family.variations.map(v => v.category))].join('|');
    const subCategories = [...new Set(family.variations.map(v => v.subCategory))].join('|');
    const descriptions = family.variations.map(v => v.description || '').join('|');

    const row = [
      family.baseCptCode,
      family.totalCount.toString(),
      `"${suffixes}"`,
      `"${testNames.replace(/"/g, '""')}"`,
      `"${testIds}"`,
      `"${categories}"`,
      `"${subCategories}"`,
      `"${descriptions.replace(/"/g, '""')}"`
    ];

    csv += row.join(',') + '\n';
  });

  return csv;
}

/**
 * Legacy Export: Current format for backward compatibility
 */
export function generateLegacyCSV(tests: Test[]): string {
  const headers = [
    'id',
    'name',
    'category',
    'subCategory',
    'cptCode',
    'loincCode',
    'snomedCode',
    'description',
    'notes'
  ];

  let csv = headers.join(',') + '\n';

  tests.forEach(test => {
    const row = headers.map(header => {
      const value = test[header as keyof Test];
      
      if (value === null || value === undefined) {
        return '';
      }
      
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    
    csv += row.join(',') + '\n';
  });

  return csv;
}

/**
 * Group tests by their base CPT code
 */
export function consolidateTestsByCptFamily(tests: Test[]): ConsolidatedCptFamily[] {
  const families = new Map<string, ConsolidatedCptFamily>();

  tests.forEach(test => {
    if (!test.baseCptCode) return;

    if (!families.has(test.baseCptCode)) {
      families.set(test.baseCptCode, {
        baseCptCode: test.baseCptCode,
        variations: [],
        totalCount: 0
      });
    }

    const family = families.get(test.baseCptCode)!;
    family.variations.push({
      suffix: test.cptSuffix,
      testName: test.name,
      testId: test.id,
      category: test.category,
      subCategory: test.subCategory,
      loincCode: test.loincCode,
      snomedCode: test.snomedCode,
      description: test.description
    });
    family.totalCount++;
  });

  // Sort families by base CPT code and sort variations within each family
  return Array.from(families.values())
    .map(family => ({
      ...family,
      variations: family.variations.sort((a, b) => {
        if (a.suffix === null && b.suffix !== null) return -1;
        if (a.suffix !== null && b.suffix === null) return 1;
        if (a.suffix === null && b.suffix === null) return 0;
        return a.suffix!.localeCompare(b.suffix!);
      })
    }))
    .sort((a, b) => a.baseCptCode.localeCompare(b.baseCptCode));
}

/**
 * Generate export preview statistics
 */
export function generateExportStats(tests: Test[], options: ExportOptions): {
  totalTests: number;
  uniqueBaseCptCodes: number;
  testsWithSuffixes: number;
  cptFamilies: number;
} {
  const uniqueBaseCodes = new Set(tests.filter(t => t.baseCptCode).map(t => t.baseCptCode));
  const testsWithSuffixes = tests.filter(t => t.cptSuffix).length;
  const families = consolidateTestsByCptFamily(tests);

  return {
    totalTests: tests.length,
    uniqueBaseCptCodes: uniqueBaseCodes.size,
    testsWithSuffixes,
    cptFamilies: families.length
  };
}