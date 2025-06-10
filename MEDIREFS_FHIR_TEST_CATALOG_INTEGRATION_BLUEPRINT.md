
# MediRefs FHIR Test Catalog Integration Blueprint
## Comprehensive Implementation Guide for Existing Applications

### Executive Summary

This blueprint provides a complete guide for extracting and integrating the FHIR-compliant test catalog functionality from the MediRefs application into your existing TypeScript/React application. The implementation includes 121+ medical tests with full FHIR R4 ServiceRequest mapping, advanced export capabilities, and multi-user profile support.

## Table of Contents

1. [Core Architecture Components](#core-architecture-components)
2. [Essential File Structure](#essential-file-structure)
3. [Database Schema](#database-schema)
4. [TypeScript Interfaces](#typescript-interfaces)
5. [FHIR Export System](#fhir-export-system)
6. [Test Data Model](#test-data-model)
7. [User Profile Integration](#user-profile-integration)
8. [Step-by-Step Integration Guide](#step-by-step-integration-guide)
9. [Testing & Validation](#testing--validation)

---

## Core Architecture Components

### Technology Stack Requirements
```typescript
// Package Dependencies
{
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "@tanstack/react-query": "^4.0.0",
  "drizzle-orm": "^0.28.0",
  "postgres": "^3.3.0",
  "express": "^4.18.0",
  "tsx": "^3.12.0"
}
```

### Key Features to Extract
- **Test Catalog Management**: 121+ medical tests across 8 categories
- **FHIR R4 Compliance**: ServiceRequest resource mapping
- **Multi-Format Export**: CSV and FHIR JSON exports
- **User Role Support**: Patient, Doctor, Facility, App Originator
- **Advanced Search & Filtering**: Category and subcategory-based
- **Coding System Integration**: CPT, LOINC, SNOMED CT codes

---

## Essential File Structure

Create the following directory structure in your target project:

```
your-project/
├── src/
│   ├── types/
│   │   └── fhir-test-catalog.ts
│   ├── utils/
│   │   ├── fhirExporter.ts
│   │   ├── csvImportExport.ts
│   │   └── medical-constants.ts
│   ├── components/
│   │   ├── test-catalog/
│   │   │   ├── TestCatalogGrid.tsx
│   │   │   ├── TestDetailModal.tsx
│   │   │   ├── FhirExportTool.tsx
│   │   │   ├── CategorySidebar.tsx
│   │   │   └── SearchBar.tsx
│   │   └── ui/ (shadcn/ui components)
│   ├── hooks/
│   │   └── useTestData.ts
│   └── data/
│       └── test-catalog.json
├── server/
│   ├── utils/
│   │   └── medical-constants.ts
│   ├── routes/
│   │   └── test-catalog.ts
│   └── schema/
│       └── test-catalog-schema.ts
└── docs/
    └── FHIR_INTEGRATION_GUIDE.md
```

---

## Database Schema

### PostgreSQL Tables (Using Drizzle ORM)

```typescript
// server/schema/test-catalog-schema.ts
import { pgTable, text, timestamp, varchar, index } from 'drizzle-orm/pg-core';

export const tests = pgTable('tests', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  subCategory: text('sub_category').notNull(),
  cptCode: varchar('cpt_code', { length: 10 }),
  loincCode: varchar('loinc_code', { length: 20 }),
  snomedCode: varchar('snomed_code', { length: 20 }),
  description: text('description'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  categoryIdx: index('category_idx').on(table.category),
  subCategoryIdx: index('sub_category_idx').on(table.subCategory),
  cptIdx: index('cpt_idx').on(table.cptCode),
  nameIdx: index('name_idx').on(table.name)
}));

export const userProfiles = pgTable('user_profiles', {
  id: varchar('id', { length: 50 }).primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 20 }).notNull(), // 'patient', 'doctor', 'facility', 'app_originator'
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  facilityName: varchar('facility_name', { length: 255 }),
  specialization: varchar('specialization', { length: 100 }),
  licenseNumber: varchar('license_number', { length: 50 }),
  verified: varchar('verified', { length: 10 }).default('false'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

---

## TypeScript Interfaces

### Core Type Definitions

```typescript
// src/types/fhir-test-catalog.ts

export interface Test {
  id: string;                    // Format: TTES-{CATEGORY}-{SUBCATEGORY}-{CPTCODE}
  name: string;                  // Human-readable test name
  category: string;              // Primary categorization
  subCategory: string;           // Secondary categorization
  cptCode?: string;              // CPT procedure code
  loincCode?: string;            // LOINC observation code (primarily for Lab tests)
  snomedCode?: string;           // SNOMED CT clinical term (primarily for Imaging)
  description?: string;          // Detailed test description
  notes?: string;                // Additional clinical notes
  createdAt?: Date;              // Record creation timestamp
  updatedAt?: Date;              // Last modification timestamp
}

export interface TestWithNotes extends Test {
  notes: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface SubcategoryCount {
  subCategory: string;
  count: number;
}

export interface TestCatalogState {
  tests: Test[];
  filteredTests: Test[];
  categories: CategoryCount[];
  subcategories: SubcategoryCount[];
  selectedTest: Test | null;
  selectedCategory: string | null;
  selectedSubCategory: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'patient' | 'doctor' | 'facility' | 'app_originator';
  firstName?: string;
  lastName?: string;
  facilityName?: string;
  specialization?: string;
  licenseNumber?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// FHIR Resource Types
export interface FhirServiceRequest {
  resourceType: 'ServiceRequest';
  id: string;
  status: 'active' | 'completed' | 'entered-in-error';
  intent: 'order' | 'original-order' | 'plan';
  category: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  }>;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  subject?: {
    reference: string;
  };
  note?: Array<{
    text: string;
  }>;
}

export interface FhirBundle {
  resourceType: 'Bundle';
  type: 'collection';
  entry: Array<{
    resource: FhirServiceRequest;
  }>;
}
```

---

## FHIR Export System

### Core FHIR Export Utilities

```typescript
// src/utils/fhirExporter.ts

import { Test, TestWithNotes, FhirServiceRequest, FhirBundle } from '../types/fhir-test-catalog';

enum ResourceType {
  ServiceRequest = 'ServiceRequest'
}

enum FhirStatus {
  Completed = 'completed',
  Active = 'active'
}

enum FhirIntent {
  OriginalOrder = 'original-order',
  Order = 'order'
}

/**
 * Convert a test to a FHIR ServiceRequest resource
 */
export function testToFhirServiceRequest(test: Test | TestWithNotes): FhirServiceRequest {
  const serviceRequest: FhirServiceRequest = {
    resourceType: ResourceType.ServiceRequest,
    id: test.id,
    status: FhirStatus.Active,
    intent: FhirIntent.Order,
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/service-category",
            code: test.category === "Laboratory Tests" ? "LAB" : 
                  test.category === "Imaging Studies" ? "RAD" : "OTHER",
            display: test.category
          }
        ],
        text: test.category
      }
    ],
    code: {
      coding: [
        {
          system: "http://www.ama-assn.org/go/cpt",
          code: test.cptCode || "",
          display: test.name
        }
      ],
      text: test.name
    }
  };
  
  // Add LOINC code if present (typically for lab tests)
  if (test.loincCode) {
    serviceRequest.code.coding.push({
      system: "http://loinc.org",
      code: test.loincCode,
      display: test.name
    });
  }
  
  // Add SNOMED code if present (typically for imaging studies)
  if (test.snomedCode) {
    serviceRequest.code.coding.push({
      system: "http://snomed.info/sct",
      code: test.snomedCode,
      display: test.name
    });
  }
  
  // Add notes if present
  if (test.notes) {
    serviceRequest.note = [
      {
        text: test.notes
      }
    ];
  }
  
  return serviceRequest;
}

/**
 * Convert multiple tests to FHIR ServiceRequest resources
 */
export function testsToFhirServiceRequests(tests: Array<Test | TestWithNotes>): FhirServiceRequest[] {
  return tests.map(test => testToFhirServiceRequest(test));
}

/**
 * Create a FHIR Bundle containing multiple resources
 */
export function createFhirBundle(tests: Array<Test | TestWithNotes>): FhirBundle {
  const resources = testsToFhirServiceRequests(tests);
  
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: resources.map(resource => ({ resource }))
  };
}

/**
 * Export tests to a FHIR JSON string
 */
export function exportTestsToFhir(tests: Array<Test | TestWithNotes>, prettyPrint: boolean = true): string {
  const bundle = createFhirBundle(tests);
  return JSON.stringify(bundle, null, prettyPrint ? 2 : 0);
}

/**
 * Download FHIR export as JSON file
 */
export function downloadFhirExport(tests: Array<Test | TestWithNotes>, fileName: string = 'fhir_test_catalog.json'): void {
  const jsonContent = exportTestsToFhir(tests);
  
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Filter tests by category before exporting
 */
export function filterTestsByCategory(
  tests: Array<Test | TestWithNotes>,
  categories: string[]
): Array<Test | TestWithNotes> {
  if (!categories.length) return tests;
  return tests.filter(test => categories.includes(test.category));
}

/**
 * Filter tests by subcategory before exporting
 */
export function filterTestsBySubcategory(
  tests: Array<Test | TestWithNotes>,
  subcategories: string[]
): Array<Test | TestWithNotes> {
  if (!subcategories.length) return tests;
  return tests.filter(test => test.subCategory && subcategories.includes(test.subCategory));
}
```

---

## Test Data Model

### Medical Constants and ID Generation

```typescript
// src/utils/medical-constants.ts

export const VALID_CATEGORIES = {
  'Laboratory Tests': 'Laboratory Tests',
  'Imaging Studies': 'Imaging Studies',
  'Cardiovascular Tests': 'Cardiovascular Tests',
  'Neurological Tests': 'Neurological Tests',
  'Pulmonary Tests': 'Pulmonary Tests',
  'Gastrointestinal Tests': 'Gastrointestinal Tests',
  'Specialty-Specific Tests': 'Specialty-Specific Tests',
  'Functional Tests': 'Functional Tests',
};

// Category to prefix mapping for test IDs
const CATEGORY_PREFIXES: Record<string, string> = {
  'Laboratory Tests': 'LAB',
  'Imaging Studies': 'IMG',
  'Cardiovascular Tests': 'CVS',
  'Neurological Tests': 'NEU',
  'Pulmonary Tests': 'PUL',
  'Gastrointestinal Tests': 'GAS',
  'Specialty-Specific Tests': 'SPC',
  'Functional Tests': 'FNC',
};

// Subcategory to prefix mapping
const SUBCATEGORY_PREFIXES: Record<string, Record<string, string>> = {
  'Laboratory Tests': {
    'Clinical Chemistry': 'CHE',
    'Hematology': 'HEM',
    'Immunology/Serology': 'IMM',
    'Molecular Diagnostics': 'MOL',
    'Microbiology': 'MIC',
    'Toxicology': 'TOX',
    'Urinalysis': 'URI',
    'Endocrinology': 'END',
    'Genetic Testing': 'GEN',
    'Tumor Markers': 'TUM',
  },
  'Imaging Studies': {
    'Radiography (X-rays)': 'XRA',
    'Computed Tomography (CT)': 'CT',
    'Magnetic Resonance Imaging (MRI)': 'MRI',
    'Ultrasound': 'ULT',
    'Nuclear Medicine': 'NUC',
    'Positron Emission Tomography (PET)': 'PET',
    'Fluoroscopy': 'FLU',
    'Mammography': 'MAM',
    'Bone Densitometry': 'BON',
  },
  // ... additional categories
};

/**
 * Generates a unique test ID based on category, subcategory, and CPT code
 * Format: TTES-{CAT}-{SUB}-{CPTCODE}
 */
export function generateTestId(
  category: string, 
  subcategory: string, 
  cptCode?: string, 
  counter?: number
): string {
  const catPrefix = CATEGORY_PREFIXES[category] || 'UNK';
  const subPrefix = 
    subcategory && SUBCATEGORY_PREFIXES[category] ? 
      SUBCATEGORY_PREFIXES[category][subcategory] || 'UNK' : 
      'UNK';
  
  let suffix: string;
  if (cptCode && cptCode.trim() !== '') {
    suffix = cptCode.length > 5 ? cptCode.substring(0, 5) : cptCode;
  } else {
    const randomNum = Math.floor(10000 + (counter || 0) + Math.random() * 90000);
    suffix = randomNum.toString();
  }
  
  return `TTES-${catPrefix}-${subPrefix}-${suffix}`;
}
```

---

## User Profile Integration

### Multi-Role User System

```typescript
// src/types/user-profiles.ts

export interface PatientProfile extends UserProfile {
  role: 'patient';
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
}

export interface DoctorProfile extends UserProfile {
  role: 'doctor';
  medicalLicenseNumber: string;
  specialization: string;
  boardCertifications: string[];
  practiceName?: string;
  practiceAddress?: string;
  acceptedInsurance?: string[];
  yearsOfExperience?: number;
  education?: {
    medicalSchool: string;
    residency: string;
    fellowship?: string;
  };
}

export interface FacilityProfile extends UserProfile {
  role: 'facility';
  facilityType: 'hospital' | 'clinic' | 'laboratory' | 'imaging_center' | 'urgent_care';
  accreditation: string[];
  serviceCapabilities: {
    laboratoryServices: boolean;
    imagingServices: boolean;
    specialtyServices: string[];
  };
  operatingHours: {
    monday: { open: string; close: string; };
    tuesday: { open: string; close: string; };
    wednesday: { open: string; close: string; };
    thursday: { open: string; close: string; };
    friday: { open: string; close: string; };
    saturday?: { open: string; close: string; };
    sunday?: { open: string; close: string; };
  };
  contactInfo: {
    mainPhone: string;
    emergencyPhone?: string;
    faxNumber?: string;
  };
}

export interface AppOriginatorProfile extends UserProfile {
  role: 'app_originator';
  adminLevel: 'super_admin' | 'admin' | 'moderator';
  permissions: {
    userManagement: boolean;
    systemConfiguration: boolean;
    dataExport: boolean;
    testCatalogManagement: boolean;
    complianceOversight: boolean;
  };
  lastLoginAt?: Date;
  securityClearance: 'level_1' | 'level_2' | 'level_3';
}
```

---

## Step-by-Step Integration Guide

### Phase 1: Core Setup (Day 1-2)

1. **Install Dependencies**
```bash
npm install @tanstack/react-query drizzle-orm postgres
npm install -D drizzle-kit
```

2. **Copy Essential Files**
- Copy all TypeScript interfaces from `src/types/fhir-test-catalog.ts`
- Copy FHIR export utilities from `src/utils/fhirExporter.ts`
- Copy medical constants from `src/utils/medical-constants.ts`

3. **Set Up Database Schema**
- Create migration files using the schema definitions above
- Run database migrations
- Import the test catalog data (121 tests)

### Phase 2: Core Components (Day 3-5)

4. **Implement Test Catalog Components**
```typescript
// Basic test grid component structure
export function TestCatalogGrid({ tests, onTestSelect }: {
  tests: Test[];
  onTestSelect: (test: Test) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tests.map(test => (
        <TestCard 
          key={test.id} 
          test={test} 
          onClick={() => onTestSelect(test)} 
        />
      ))}
    </div>
  );
}
```

5. **Add Search and Filter Functionality**
```typescript
// Search hook implementation
export function useTestSearch(tests: Test[], searchQuery: string, selectedCategory?: string) {
  return useMemo(() => {
    return tests.filter(test => {
      const matchesQuery = !searchQuery || 
        test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || test.category === selectedCategory;
      
      return matchesQuery && matchesCategory;
    });
  }, [tests, searchQuery, selectedCategory]);
}
```

### Phase 3: FHIR Export Integration (Day 6-7)

6. **Implement FHIR Export Tool**
```typescript
// FHIR Export Component
export function FhirExportTool({ tests }: { tests: Test[] }) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);

  const handleExport = () => {
    const filteredTests = selectedCategories.length > 0 
      ? filterTestsByCategory(tests, selectedCategories)
      : selectedTests;
    
    downloadFhirExport(filteredTests, 'test_catalog_fhir_export.json');
  };

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">FHIR Export Tool</h3>
      {/* Category selection UI */}
      {/* Test selection UI */}
      <button onClick={handleExport} className="bg-blue-500 text-white px-4 py-2 rounded">
        Export to FHIR
      </button>
    </div>
  );
}
```

### Phase 4: User Profile Integration (Day 8-10)

7. **Implement Role-Based Access Control**
```typescript
// Role-based permissions
export function useUserPermissions(user: UserProfile) {
  return useMemo(() => {
    switch (user.role) {
      case 'patient':
        return {
          canViewTests: true,
          canOrderTests: true,
          canExportData: false,
          canManageTests: false
        };
      case 'doctor':
        return {
          canViewTests: true,
          canOrderTests: true,
          canExportData: true,
          canManageTests: false
        };
      case 'facility':
        return {
          canViewTests: true,
          canOrderTests: true,
          canExportData: true,
          canManageTests: true
        };
      case 'app_originator':
        return {
          canViewTests: true,
          canOrderTests: true,
          canExportData: true,
          canManageTests: true
        };
      default:
        return {
          canViewTests: false,
          canOrderTests: false,
          canExportData: false,
          canManageTests: false
        };
    }
  }, [user.role]);
}
```

### Phase 5: API Integration (Day 11-12)

8. **Implement Server Routes**
```typescript
// server/routes/test-catalog.ts
import { Router } from 'express';
import { eq, like, and } from 'drizzle-orm';
import { tests } from '../schema/test-catalog-schema';

const router = Router();

// Get all tests with filtering
router.get('/tests', async (req, res) => {
  const { category, subcategory, search } = req.query;
  
  let query = db.select().from(tests);
  
  const conditions = [];
  if (category) conditions.push(eq(tests.category, category as string));
  if (subcategory) conditions.push(eq(tests.subCategory, subcategory as string));
  if (search) conditions.push(like(tests.name, `%${search}%`));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  const result = await query;
  res.json({ tests: result });
});

// Get test by ID
router.get('/tests/:id', async (req, res) => {
  const test = await db.select().from(tests).where(eq(tests.id, req.params.id));
  if (test.length === 0) {
    return res.status(404).json({ error: 'Test not found' });
  }
  res.json({ test: test[0] });
});

export default router;
```

---

## Testing & Validation

### Unit Tests

```typescript
// tests/fhir-export.test.ts
import { testToFhirServiceRequest, createFhirBundle } from '../src/utils/fhirExporter';
import { Test } from '../src/types/fhir-test-catalog';

describe('FHIR Export', () => {
  const mockTest: Test = {
    id: 'TTES-LAB-CHE-83100',
    name: 'Basic Metabolic Panel',
    category: 'Laboratory Tests',
    subCategory: 'Clinical Chemistry',
    cptCode: '83100',
    loincCode: '59020-7',
    description: 'Evaluates electrolytes, kidney function, and blood sugar levels.'
  };

  test('converts test to FHIR ServiceRequest', () => {
    const fhirResource = testToFhirServiceRequest(mockTest);
    
    expect(fhirResource.resourceType).toBe('ServiceRequest');
    expect(fhirResource.id).toBe(mockTest.id);
    expect(fhirResource.code.text).toBe(mockTest.name);
    expect(fhirResource.category[0].coding[0].code).toBe('LAB');
  });

  test('creates FHIR bundle from multiple tests', () => {
    const bundle = createFhirBundle([mockTest]);
    
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('collection');
    expect(bundle.entry).toHaveLength(1);
  });
});
```

### Integration Checklist

- [ ] Database schema migrated successfully
- [ ] Test data imported (121 tests)
- [ ] User profiles system integrated
- [ ] FHIR export functionality working
- [ ] CSV import/export working
- [ ] Search and filtering operational
- [ ] Role-based permissions implemented
- [ ] API endpoints functioning
- [ ] Frontend components rendering
- [ ] Export/download features working

---

## Production Considerations

### Performance Optimization
- Implement database indexing for category and subcategory searches
- Add pagination for large test catalogs
- Implement caching for frequently accessed test data
- Optimize FHIR export for large datasets

### Security & Compliance
- Implement proper authentication and authorization
- Ensure HIPAA compliance for user data
- Add audit logging for all data access
- Implement rate limiting on API endpoints

### Scalability
- Design for horizontal scaling
- Implement proper error handling and logging
- Add monitoring and alerting
- Plan for data backup and recovery

---

## Conclusion

This blueprint provides a complete roadmap for integrating the MediRefs FHIR test catalog functionality into your existing application. The modular design allows for gradual implementation while maintaining existing functionality.

Key benefits of this integration:
- **FHIR R4 Compliance**: Standards-based healthcare interoperability
- **Comprehensive Test Coverage**: 121+ medical tests across all specialties
- **Multi-Role Support**: Patient, doctor, facility, and admin user types
- **Advanced Export Capabilities**: FHIR and CSV formats
- **Production-Ready**: Enterprise-grade architecture and security

For additional support or customization requirements, refer to the original MediRefs codebase and the FHIR R4 specification documentation.
