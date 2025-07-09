import { Test } from '@shared/schema';

enum ResourceType {
  ServiceRequest = 'ServiceRequest',
  ImagingStudy = 'ImagingStudy'
}

enum FhirStatus {
  Completed = 'completed',
  Active = 'active',
  Available = 'available'
}

enum FhirIntent {
  OriginalOrder = 'original-order',
  Order = 'order'
}

enum ImagingStudyStatus {
  Available = 'available',
  Cancelled = 'cancelled',
  Entered = 'entered-in-error',
  Unknown = 'unknown'
}

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
    authorString?: string;
  }>;
  // Reference to related ImagingStudy (for imaging orders)
  supportingInfo?: Array<{
    reference: string;
  }>;
}

interface FhirImagingStudy {
  resourceType: ResourceType.ImagingStudy;
  id: string;
  status: ImagingStudyStatus;
  modality: Array<{
    system: string;
    code: string;
    display: string;
  }>;
  subject?: {
    reference: string;
  };
  started?: string;
  procedureCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  }>;
  bodySite?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  }>;
  reasonCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  }>;
  description?: string;
  note?: Array<{
    text: string;
    authorString?: string;
  }>;
  // Reference to originating ServiceRequest
  basedOn?: Array<{
    reference: string;
  }>;
}

type FhirResource = FhirServiceRequest | FhirImagingStudy;

interface FhirBundle {
  resourceType: string;
  type: string;
  entry: Array<{
    resource: FhirResource;
  }>;
}

// DICOM modality mapping for imaging subcategories
const MODALITY_MAPPING: Record<string, { code: string; display: string }> = {
  'Radiography': { code: 'DX', display: 'Digital Radiography' },
  'Magnetic Resonance Imaging': { code: 'MR', display: 'Magnetic Resonance' },
  'Computed Tomography': { code: 'CT', display: 'Computed Tomography' },
  'Ultrasound': { code: 'US', display: 'Ultrasound' },
  'Fluoroscopy': { code: 'XA', display: 'X-Ray Angiography' },
  'Nuclear Medicine': { code: 'NM', display: 'Nuclear Medicine' },
  'Mammography': { code: 'MG', display: 'Mammography' },
  'Positron Emission Tomography': { code: 'PT', display: 'Positron emission tomography' },
  'Angiography': { code: 'XA', display: 'X-Ray Angiography' },
  'Doppler Ultrasound': { code: 'US', display: 'Ultrasound' },
  'Interventional Radiology': { code: 'XA', display: 'X-Ray Angiography' }
};

// Body site mapping based on test names
const BODY_SITE_MAPPING: Record<string, { code: string; display: string }> = {
  'brain': { code: '12738006', display: 'Brain structure' },
  'head': { code: '69536005', display: 'Head structure' },
  'neck': { code: '45048000', display: 'Neck structure' },
  'chest': { code: '51185008', display: 'Thoracic structure' },
  'thoracic': { code: '51185008', display: 'Thoracic structure' },
  'lumbar': { code: '122496007', display: 'Lumbar spine structure' },
  'cervical': { code: '122494005', display: 'Cervical spine structure' },
  'spine': { code: '421060004', display: 'Vertebral column structure' },
  'abdomen': { code: '818983003', display: 'Abdomen structure' },
  'pelvis': { code: '12921003', display: 'Pelvis structure' },
  'shoulder': { code: '16982005', display: 'Shoulder region structure' },
  'knee': { code: '72696002', display: 'Knee region structure' },
  'ankle': { code: '344001', display: 'Ankle region structure' },
  'hip': { code: '29836001', display: 'Hip region structure' },
  'wrist': { code: '8205005', display: 'Wrist region structure' },
  'elbow': { code: '127949000', display: 'Elbow region structure' },
  'foot': { code: '56459004', display: 'Foot structure' },
  'hand': { code: '85562004', display: 'Hand structure' },
  'extremity': { code: '66019005', display: 'Extremity structure' }
};

/**
 * Extract body site from test name for imaging studies
 * @param testName The name of the test
 * @returns Body site coding if found
 */
function extractBodySite(testName: string): { coding: Array<{ system: string; code: string; display: string }>; text: string } | undefined {
  const lowerName = testName.toLowerCase();
  
  for (const [keyword, siteInfo] of Object.entries(BODY_SITE_MAPPING)) {
    if (lowerName.includes(keyword)) {
      return {
        coding: [{
          system: "http://snomed.info/sct",
          code: siteInfo.code,
          display: siteInfo.display
        }],
        text: siteInfo.display
      };
    }
  }
  
  return undefined;
}

/**
 * Get DICOM modality code for imaging subcategory
 * @param subCategory The subcategory of the imaging test
 * @returns Modality coding
 */
function getModalityCode(subCategory: string): { system: string; code: string; display: string } {
  const modalityInfo = MODALITY_MAPPING[subCategory] || { code: 'OT', display: 'Other' };
  
  return {
    system: "http://dicom.nema.org/resources/ontology/DCM",
    code: modalityInfo.code,
    display: modalityInfo.display
  };
}

/**
 * Check if a test is an imaging study
 * @param test The test to check
 * @returns True if the test is an imaging study
 */
function isImagingStudy(test: Test): boolean {
  return test.category === "Imaging Studies";
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
    status: isImagingStudy(test) ? FhirStatus.Completed : FhirStatus.Active,
    intent: FhirIntent.OriginalOrder,
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
  
  // For imaging studies, add reference to the corresponding ImagingStudy
  if (isImagingStudy(test)) {
    serviceRequest.supportingInfo = [
      {
        reference: `ImagingStudy/${test.id}-study`
      }
    ];
  }
  
  // Add description and notes as separate entries in standard FHIR note field
  const notes: Array<{ text: string; authorString?: string }> = [];
  
  // Add description with identifier for parsing
  if (test.description) {
    notes.push({
      text: test.description,
      authorString: "Description"
    });
  }
  
  // Add notes with identifier for parsing
  if (test.notes) {
    notes.push({
      text: test.notes,
      authorString: "Notes"
    });
  }
  
  // Only add note array if we have entries
  if (notes.length > 0) {
    serviceRequest.note = notes;
  }
  
  return serviceRequest;
}

/**
 * Convert an imaging test to a FHIR ImagingStudy resource
 * @param test The imaging test to convert
 * @returns FHIR ImagingStudy representation of the test
 */
export function testToFhirImagingStudy(test: Test): FhirImagingStudy {
  if (!isImagingStudy(test)) {
    throw new Error(`Test ${test.id} is not an imaging study`);
  }

  const imagingStudy: FhirImagingStudy = {
    resourceType: ResourceType.ImagingStudy,
    id: `${test.id}-study`,
    status: ImagingStudyStatus.Available,
    modality: test.subCategory ? [getModalityCode(test.subCategory)] : [],
    basedOn: [
      {
        reference: `ServiceRequest/${test.id}`
      }
    ]
  };

  // Add procedure code (same as ServiceRequest code)
  const coding = [
    {
      system: "http://www.ama-assn.org/go/cpt",
      code: test.cptCode || "",
      display: test.name
    }
  ];

  if (test.loincCode) {
    coding.push({
      system: "http://loinc.org",
      code: test.loincCode,
      display: test.name
    });
  }

  if (test.snomedCode) {
    coding.push({
      system: "http://snomed.info/sct",
      code: test.snomedCode,
      display: test.name
    });
  }

  imagingStudy.procedureCode = [
    {
      coding,
      text: test.name
    }
  ];

  // Extract and add body site if possible
  const bodySite = extractBodySite(test.name);
  if (bodySite) {
    imagingStudy.bodySite = [bodySite];
  }

  // Add description
  if (test.description) {
    imagingStudy.description = test.description;
  }

  // Add notes
  const notes: Array<{ text: string; authorString?: string }> = [];
  
  if (test.description) {
    notes.push({
      text: test.description,
      authorString: "Description"
    });
  }
  
  if (test.notes) {
    notes.push({
      text: test.notes,
      authorString: "Notes"
    });
  }
  
  if (notes.length > 0) {
    imagingStudy.note = notes;
  }

  return imagingStudy;
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
 * Convert tests to appropriate FHIR resources (ServiceRequest + ImagingStudy for imaging tests)
 * @param tests The tests to convert
 * @returns Array of FHIR resources
 */
export function testsToFhirResources(tests: Test[]): FhirResource[] {
  const resources: FhirResource[] = [];
  
  tests.forEach(test => {
    // Always create a ServiceRequest for the order
    resources.push(testToFhirServiceRequest(test));
    
    // For imaging studies, also create an ImagingStudy resource for the results
    if (isImagingStudy(test)) {
      resources.push(testToFhirImagingStudy(test));
    }
  });
  
  return resources;
}

/**
 * Create a FHIR Bundle containing multiple resources (dual export for imaging studies)
 * @param tests The tests to include in the bundle
 * @returns FHIR Bundle object
 */
export function createFhirBundle(tests: Test[]): FhirBundle {
  const resources = testsToFhirResources(tests);
  
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: resources.map(resource => ({ resource }))
  };
}

/**
 * Create a FHIR Bundle containing only ServiceRequest resources (legacy mode)
 * @param tests The tests to include in the bundle
 * @returns FHIR Bundle object
 */
export function createLegacyFhirBundle(tests: Test[]): FhirBundle {
  const resources = testsToFhirServiceRequests(tests);
  
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: resources.map(resource => ({ resource }))
  };
}

/**
 * Export tests to a FHIR JSON file and trigger download (with dual resource support)
 * @param tests Tests to export
 * @param fileName Name for the downloaded file
 * @param useDualResourceExport Whether to use dual resource export for imaging studies (default: true)
 */
export function downloadFhirExport(tests: Test[], fileName: string = 'medirefs_fhir_export.json', useDualResourceExport: boolean = true): void {
  const bundle = useDualResourceExport ? createFhirBundle(tests) : createLegacyFhirBundle(tests);
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
 * Export tests to FHIR JSON string (with dual resource support)
 * @param tests Tests to export
 * @param prettyPrint Whether to format the JSON for readability
 * @param useDualResourceExport Whether to use dual resource export for imaging studies (default: true)
 * @returns FHIR-compliant JSON string
 */
export function exportTestsToFhir(tests: Test[], prettyPrint: boolean = true, useDualResourceExport: boolean = true): string {
  const bundle = useDualResourceExport ? createFhirBundle(tests) : createLegacyFhirBundle(tests);
  return JSON.stringify(bundle, null, prettyPrint ? 2 : undefined);
}

/**
 * Get export statistics for tests
 * @param tests Tests to analyze
 * @returns Export statistics
 */
export function getExportStatistics(tests: Test[]): {
  totalTests: number;
  imagingStudies: number;
  labTests: number;
  otherTests: number;
  totalResources: number;
  serviceRequests: number;
  imagingStudyResources: number;
} {
  const imagingStudies = tests.filter(test => isImagingStudy(test));
  const labTests = tests.filter(test => test.category === "Laboratory Tests");
  const otherTests = tests.filter(test => !isImagingStudy(test) && test.category !== "Laboratory Tests");
  
  return {
    totalTests: tests.length,
    imagingStudies: imagingStudies.length,
    labTests: labTests.length,
    otherTests: otherTests.length,
    totalResources: tests.length + imagingStudies.length, // ServiceRequests + ImagingStudy resources
    serviceRequests: tests.length, // One ServiceRequest per test
    imagingStudyResources: imagingStudies.length // One ImagingStudy per imaging test
  };
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