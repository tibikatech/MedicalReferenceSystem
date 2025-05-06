import { Test, TestWithNotes } from '../types';

// Coding system URIs
const CODING_SYSTEMS = {
  CPT: 'http://www.ama-assn.org/go/cpt',
  LOINC: 'http://loinc.org',
  SNOMED: 'http://snomed.info/sct'
};

// FHIR Resource Types
enum ResourceType {
  ServiceRequest = 'ServiceRequest'
}

// FHIR Status types
enum FhirStatus {
  Completed = 'completed'
}

// FHIR Intent types
enum FhirIntent {
  OriginalOrder = 'original-order'
}

// Interface for a FHIR ServiceRequest resource
interface FhirServiceRequest {
  resourceType: ResourceType;
  id: string;
  status: FhirStatus;
  intent: FhirIntent;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  category: Array<{
    text: string;
  }>;
  subcategory?: Array<{
    text: string;
  }>;
  note?: Array<{
    text: string;
  }>;
}

/**
 * Convert a MediRefs test to a FHIR ServiceRequest resource
 * @param test The test to convert
 * @returns FHIR ServiceRequest representation of the test
 */
export function testToFhirServiceRequest(test: Test | TestWithNotes): FhirServiceRequest {
  // Initialize coding array with CPT code (required)
  const coding = [{
    system: CODING_SYSTEMS.CPT,
    code: test.cptCode,
    display: test.name
  }];
  
  // Add LOINC code if available
  if (test.loincCode) {
    coding.push({
      system: CODING_SYSTEMS.LOINC,
      code: test.loincCode,
      display: test.name
    });
  }
  
  // Add SNOMED code if available
  if (test.snomedCode) {
    coding.push({
      system: CODING_SYSTEMS.SNOMED,
      code: test.snomedCode,
      display: test.name
    });
  }
  
  // Build the FHIR resource
  const serviceRequest: FhirServiceRequest = {
    resourceType: ResourceType.ServiceRequest,
    id: test.id,
    status: FhirStatus.Completed,
    intent: FhirIntent.OriginalOrder,
    code: {
      coding,
      text: test.name
    },
    category: [{
      text: test.category
    }]
  };
  
  // Add subcategory if available
  if (test.subCategory) {
    serviceRequest.subcategory = [{
      text: test.subCategory
    }];
  }
  
  // Add notes if available
  const hasNotes = (test as TestWithNotes).notes || test.description;
  if (hasNotes) {
    serviceRequest.note = [{
      text: (test as TestWithNotes).notes || test.description || ''
    }];
  }
  
  return serviceRequest;
}

/**
 * Convert multiple MediRefs tests to FHIR ServiceRequest resources
 * @param tests The tests to convert
 * @returns Array of FHIR ServiceRequest resources
 */
export function testsToFhirServiceRequests(tests: Array<Test | TestWithNotes>): FhirServiceRequest[] {
  return tests.map(test => testToFhirServiceRequest(test));
}

/**
 * Creates a complete FHIR bundle containing multiple resources
 * @param tests The tests to include in the bundle
 * @returns FHIR Bundle JSON string
 */
export function createFhirBundle(tests: Array<Test | TestWithNotes>): string {
  const resources = testsToFhirServiceRequests(tests);
  
  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: resources.map(resource => ({
      resource
    }))
  };
  
  return JSON.stringify(bundle, null, 2);
}

/**
 * Export MediRefs tests to a FHIR JSON file
 * @param tests Tests to export
 * @param prettyPrint Whether to format the JSON for readability
 * @returns FHIR-compliant JSON string
 */
export function exportTestsToFhir(tests: Array<Test | TestWithNotes>, prettyPrint: boolean = true): string {
  const resources = testsToFhirServiceRequests(tests);
  return JSON.stringify(resources, null, prettyPrint ? 2 : undefined);
}

/**
 * Filter tests by category before exporting to FHIR
 * @param tests All available tests
 * @param categories Categories to include
 * @returns Filtered array of tests
 */
export function filterTestsByCategory(
  tests: Array<Test | TestWithNotes>, 
  categories: string[]
): Array<Test | TestWithNotes> {
  if (!categories || categories.length === 0) {
    return tests;
  }
  
  return tests.filter(test => categories.includes(test.category));
}

/**
 * Filter tests by subcategory before exporting to FHIR
 * @param tests All available tests
 * @param subcategories Subcategories to include
 * @returns Filtered array of tests
 */
export function filterTestsBySubcategory(
  tests: Array<Test | TestWithNotes>, 
  subcategories: string[]
): Array<Test | TestWithNotes> {
  if (!subcategories || subcategories.length === 0) {
    return tests;
  }
  
  return tests.filter(test => 
    test.subCategory && subcategories.includes(test.subCategory)
  );
}