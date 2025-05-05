import { Test } from '@shared/schema';
import { VALID_CATEGORIES } from './medical-constants';

/**
 * Error class for medical code related errors
 */
export class MedicalCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MedicalCodeError';
  }
}

// Basic LOINC code mappings for common laboratory tests
// In a production environment, this would be replaced with a database lookup or API call
export const LOINC_MAPPINGS: Record<string, string> = {
  'Complete Blood Count (CBC)': '58410-2',
  'Comprehensive Metabolic Panel': '24323-8',
  'Liver Function Tests': '1991-9',
  'Kidney Function Tests': '2160-0',
  'Hemoglobin A1c (HbA1c)': '4544-3',
  'Platelet Count': '26515-7',
  'White Blood Cell (WBC) Count': '6690-2',
  'Erythrocyte Sedimentation Rate (ESR)': '26462-2',
  'Antinuclear Antibody (ANA) Test': '53041-7',
  'Rheumatoid Factor (RF) Test': '6954-7',
  'Thyroid-Stimulating Hormone (TSH) Test': '2586-5',
  'HIV Antibody Test': '2616-1',
  'Hepatitis C Antibody Test': '2675-2',
  'Culture and Sensitivity Testing': '3150-9',
  'Blood Glucose': '2339-9'
};

// Basic SNOMED code mappings for common imaging studies
// In a production environment, this would be replaced with a database lookup or API call
export const SNOMED_MAPPINGS: Record<string, string> = {
  'Chest X-ray': '399208008',
  'Abdominal Ultrasound': '241551004',
  'CT Scan of Brain': '303653007',
  'MRI of Knee': '429530000',
  'PET Scan': '310128004',
  'Mammogram': '409372004',
  'Bone Densitometry': '113091000',
  'Coronary Angiography': '418824004',
  'Echocardiogram': '40701008',
  'Barium Swallow': '386790005'
};

/**
 * Find LOINC code for a laboratory test
 * @param test The test object
 * @returns The LOINC code or null if not found
 * @throws MedicalCodeError if the test category is not Laboratory Tests
 */
export function findLoincCode(test: Test): string | null {
  if (test.category !== VALID_CATEGORIES.LABORATORY_TESTS) {
    throw new MedicalCodeError(`LOINC codes are only applicable to Laboratory Tests, not ${test.category}`);
  }
  
  return LOINC_MAPPINGS[test.name] || test.loincCode || null;
}

/**
 * Find SNOMED code for an imaging study
 * @param test The test object
 * @returns The SNOMED code or null if not found
 * @throws MedicalCodeError if the test category is not Imaging Studies
 */
export function findSnomedCode(test: Test): string | null {
  if (test.category !== VALID_CATEGORIES.IMAGING_STUDIES) {
    throw new MedicalCodeError(`SNOMED codes are only applicable to Imaging Studies, not ${test.category}`);
  }
  
  return SNOMED_MAPPINGS[test.name] || test.snomedCode || null;
}

/**
 * Validates if a LOINC code has the correct format (number-number)
 * @param code The LOINC code to validate
 * @returns boolean indicating if the code format is valid
 */
export function isValidLoincFormat(code: string): boolean {
  // LOINC format is typically number-number
  return /^\d+-\d+$/.test(code);
}

/**
 * Validates if a SNOMED code has the correct format (numeric)
 * @param code The SNOMED code to validate
 * @returns boolean indicating if the code format is valid
 */
export function isValidSnomedFormat(code: string): boolean {
  // SNOMED codes are typically numeric
  return /^\d+$/.test(code);
}