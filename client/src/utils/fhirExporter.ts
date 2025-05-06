import { Test } from '@shared/schema';

/**
 * FHIR Resource Types
 */
enum ResourceType {
  ServiceRequest = 'ServiceRequest',
  Bundle = 'Bundle'
}

/**
 * FHIR Status values
 */
enum FhirStatus {
  Active = 'active',
  Completed = 'completed'
}

/**
 * FHIR Intent values
 */
enum FhirIntent {
  Order = 'order',
  OriginalOrder = 'original-order'
}

/**
 * FHIR Bundle Types
 */
enum BundleType {
  Collection = 'collection',
  Document = 'document',
  Transaction = 'transaction'
}

/**
 * Basic FHIR ServiceRequest interface
 */
interface FhirServiceRequest {
  resourceType: ResourceType.ServiceRequest;
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
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  subject?: {
    reference: string;
  };
  note?: Array<{
    text: string;
  }>;
}

/**
 * FHIR Bundle interface
 */
interface FhirBundle {
  resourceType: ResourceType.Bundle;
  type: BundleType;
  entry: Array<{
    resource: FhirServiceRequest;
  }>;
}

/**
 * Convert a MediRefs test to a FHIR ServiceRequest resource
 * @param test The test to convert
 * @returns FHIR ServiceRequest representation of the test
 */
export function testToFhirServiceRequest(test: Test): FhirServiceRequest {
  // Create base ServiceRequest
  const serviceRequest: FhirServiceRequest = {
    resourceType: ResourceType.ServiceRequest,
    id: test.id,
    status: FhirStatus.Active,
    intent: FhirIntent.Order,
    code: {
      coding: [],
      text: test.name
    }
  };

  // Add CPT code if available
  if (test.cptCode) {
    serviceRequest.code.coding.push({
      system: 'http://www.ama-assn.org/go/cpt',
      code: test.cptCode,
      display: test.name
    });
  }

  // Add LOINC code if available (typically for Laboratory Tests)
  if (test.loincCode) {
    serviceRequest.code.coding.push({
      system: 'http://loinc.org',
      code: test.loincCode,
      display: test.name
    });
  }

  // Add SNOMED code if available (typically for Imaging Studies)
  if (test.snomedCode) {
    serviceRequest.code.coding.push({
      system: 'http://snomed.info/sct',
      code: test.snomedCode,
      display: test.name
    });
  }

  // Add category based on test category
  serviceRequest.category = [{
    coding: [{
      system: 'http://terminology.hl7.org/CodeSystem/service-category',
      code: test.category === 'Laboratory Tests' ? 'LAB' : 'RAD',
      display: test.category
    }]
  }];

  // Add notes if available
  if (test.notes) {
    serviceRequest.note = [{
      text: test.notes
    }];
  }

  // Add dummy subject reference (in a real app, this would link to a Patient resource)
  serviceRequest.subject = {
    reference: 'Patient/example'
  };

  return serviceRequest;
}

/**
 * Convert multiple MediRefs tests to FHIR ServiceRequest resources
 * @param tests The tests to convert
 * @returns Array of FHIR ServiceRequest resources
 */
export function testsToFhirServiceRequests(tests: Test[]): FhirServiceRequest[] {
  return tests.map(test => testToFhirServiceRequest(test));
}

/**
 * Create a FHIR Bundle containing the test resources
 * @param tests The tests to include in the bundle
 * @returns FHIR Bundle containing the test resources
 */
export function createFhirBundle(tests: Test[]): FhirBundle {
  const serviceRequests = testsToFhirServiceRequests(tests);
  
  return {
    resourceType: ResourceType.Bundle,
    type: BundleType.Collection,
    entry: serviceRequests.map(resource => ({ resource }))
  };
}

/**
 * Export tests to a FHIR JSON string
 * @param tests The tests to export
 * @param prettyPrint Whether to format the JSON with indentation
 * @returns FHIR-compliant JSON string
 */
export function exportTestsToFhir(tests: Test[], prettyPrint = true): string {
  const bundle = createFhirBundle(tests);
  return JSON.stringify(bundle, null, prettyPrint ? 2 : 0);
}

/**
 * Generate a FHIR export file and trigger download
 * @param tests Tests to export
 * @param fileName Name of the downloaded file
 */
export function downloadFhirExport(tests: Test[], fileName = 'medirefs_fhir_export.json'): void {
  const fhirContent = exportTestsToFhir(tests);
  const blob = new Blob([fhirContent], { type: 'application/json;charset=utf-8;' });
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
 * Filter tests by category
 * @param tests All tests
 * @param categories Categories to include
 * @returns Filtered tests
 */
export function filterTestsByCategory(tests: Test[], categories: string[]): Test[] {
  if (!categories.length) return tests;
  return tests.filter(test => categories.includes(test.category));
}

/**
 * Filter tests by subcategory
 * @param tests All tests
 * @param subcategories Subcategories to include
 * @returns Filtered tests
 */
export function filterTestsBySubcategory(tests: Test[], subcategories: string[]): Test[] {
  if (!subcategories.length) return tests;
  return tests.filter(test => test.subCategory && subcategories.includes(test.subCategory));
}