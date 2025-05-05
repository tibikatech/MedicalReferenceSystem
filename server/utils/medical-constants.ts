/**
 * Constants and validation utilities for medical references
 */

// Valid categories
export const VALID_CATEGORIES = {
  LABORATORY_TESTS: 'Laboratory Tests',
  IMAGING_STUDIES: 'Imaging Studies'
};

// Valid subcategories by category
export const VALID_SUBCATEGORIES = {
  [VALID_CATEGORIES.LABORATORY_TESTS]: [
    'Clinical Chemistry',
    'Hematology',
    'Immunology/Serology',
    'Molecular Diagnostics',
    'Microbiology'
  ],
  [VALID_CATEGORIES.IMAGING_STUDIES]: [
    'Computed Tomography (CT)',
    'Magnetic Resonance Imaging (MRI)',
    'Ultrasound',
    'X-ray',
    'Nuclear Medicine',
    'Positron Emission Tomography (PET)',
    'Fluoroscopy',
    'Mammography'
  ]
};

/**
 * Validates if the given category is valid
 * @param category The category to validate
 * @returns boolean indicating if the category is valid
 */
export function isValidCategory(category: string): boolean {
  return Object.values(VALID_CATEGORIES).includes(category);
}

/**
 * Validates if the given subcategory is valid for the specified category
 * @param category The parent category
 * @param subcategory The subcategory to validate
 * @returns boolean indicating if the subcategory is valid for the category
 */
export function isValidSubCategory(category: string, subcategory: string): boolean {
  if (!isValidCategory(category)) return false;
  return VALID_SUBCATEGORIES[category]?.includes(subcategory) || false;
}

/**
 * Generate a unique test ID based on category, subcategory, and existing count
 * @param category The test category
 * @param subcategory The test subcategory
 * @param count Current count of tests in this category/subcategory
 * @returns A formatted test ID
 */
export function generateTestId(category: string, subcategory: string, count: number): string {
  let prefix = 'TTES';
  let catCode = '';
  let subcatCode = '';
  
  // Set category code
  if (category === VALID_CATEGORIES.LABORATORY_TESTS) {
    catCode = 'LAB';
  } else if (category === VALID_CATEGORIES.IMAGING_STUDIES) {
    catCode = 'IMG';
  }
  
  // Set subcategory code (first 3 letters, simplified for this example)
  if (subcategory) {
    // Extract first 3 letters of the first word
    const matches = subcategory.match(/^(\w+)/);
    if (matches && matches[1]) {
      subcatCode = matches[1].substring(0, 3).toUpperCase();
    }
  }
  
  // Generate a 5-digit number with leading zeros
  const countStr = (count + 1).toString().padStart(5, '0');
  
  return `${prefix}-${catCode}-${subcatCode}-${countStr}`;
}

/**
 * Determines if a test requires a LOINC code based on its category
 * @param category The test category
 * @returns boolean indicating if LOINC code is required
 */
export function requiresLoincCode(category: string): boolean {
  return category === VALID_CATEGORIES.LABORATORY_TESTS;
}

/**
 * Determines if a test requires a SNOMED code based on its category
 * @param category The test category
 * @returns boolean indicating if SNOMED code is required
 */
export function requiresSnomedCode(category: string): boolean {
  return category === VALID_CATEGORIES.IMAGING_STUDIES;
}