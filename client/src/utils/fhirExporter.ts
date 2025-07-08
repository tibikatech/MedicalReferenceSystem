import { Test } from '@shared/schema';

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
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  subcategory?: Array<{
    text: string;
  }>;
  subject?: {
    reference: string;
  };
  note?: Array<{
    text: string;
  }>;
}

interface FhirBundle {
  resourceType: string;
  type: string;
  entry: Array<{
    resource: FhirServiceRequest;
  }>;
}

/**
 * Convert a test to a FHIR ServiceRequest resource
 * @param test The test to convert
 * @returns FHIR ServiceRequest representation of the test
 */
export function testToFhirServiceRequest(test: Test): FhirServiceRequest {
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
            code: test.category === "Laboratory Tests" ? "LAB" : "RAD",
            display: test.category
          }
        ]
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
  
  // Add subcategory if present
  if (test.subCategory) {
    serviceRequest.subcategory = [
      {
        text: test.subCategory
      }
    ];
  }
  
  // Add description and notes as separate note entries
  const notes: Array<{ text: string }> = [];
  
  // Add description if present
  if (test.description) {
    notes.push({
      text: `Description: ${test.description}`
    });
  }
  
  // Add notes if present
  if (test.notes) {
    notes.push({
      text: `Notes: ${test.notes}`
    });
  }
  
  // Only add note array if we have entries
  if (notes.length > 0) {
    serviceRequest.note = notes;
  }
  
  return serviceRequest;
}

/**
 * Convert multiple tests to FHIR ServiceRequest resources
 * @param tests The tests to convert
 * @returns Array of FHIR ServiceRequest resources
 */
export function testsToFhirServiceRequests(tests: Test[]): FhirServiceRequest[] {
  return tests.map(test => testToFhirServiceRequest(test));
}

/**
 * Create a FHIR Bundle containing multiple resources
 * @param tests The tests to include in the bundle
 * @returns FHIR Bundle object
 */
export function createFhirBundle(tests: Test[]): FhirBundle {
  const resources = testsToFhirServiceRequests(tests);
  
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: resources.map(resource => ({ resource }))
  };
}

/**
 * Export tests to a FHIR JSON file and trigger download
 * @param tests Tests to export
 * @param fileName Name for the downloaded file
 */
export function downloadFhirExport(tests: Test[], fileName: string = 'medirefs_fhir_export.json'): void {
  const bundle = createFhirBundle(tests);
  const jsonContent = JSON.stringify(bundle, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Filter tests by category before exporting to FHIR
 * @param tests All available tests
 * @param categories Categories to include
 * @returns Filtered array of tests
 */
export function filterTestsByCategory(
  tests: Test[],
  categories: string[]
): Test[] {
  if (!categories.length) return tests;
  return tests.filter(test => categories.includes(test.category));
}

/**
 * Filter tests by subcategory before exporting to FHIR
 * @param tests All available tests
 * @param subcategories Subcategories to include
 * @returns Filtered array of tests
 */
export function filterTestsBySubcategory(
  tests: Test[],
  subcategories: string[]
): Test[] {
  if (!subcategories.length) return tests;
  return tests.filter(test => test.subCategory && subcategories.includes(test.subCategory));
}