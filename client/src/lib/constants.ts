/**
 * API endpoints for the MediRefs application
 */
export const API_ENDPOINTS = {
  // Base endpoints
  TESTS: '/api/tests',
  TEST_BY_ID: (id: string) => `/api/tests/${id}`,
  TEST_SEARCH: '/api/tests/search',
  TESTS_BY_CATEGORY: (category: string) => `/api/tests/category/${encodeURIComponent(category)}`,
  TESTS_BY_SUBCATEGORY: (subcategory: string) => `/api/tests/subcategory/${encodeURIComponent(subcategory)}`,
  TEST_COUNT_BY_CATEGORY: '/api/test-count-by-category',
  TEST_COUNT_BY_SUBCATEGORY: '/api/test-count-by-subcategory',
  
  // Laboratory Tests endpoints
  LABORATORY_TESTS: '/api/laboratory-tests',
  LABORATORY_TEST_BY_ID: (id: string) => `/api/laboratory-tests/${id}`,
  UPDATE_LOINC_CODES: '/api/laboratory-tests/update-loinc-codes',
  
  // Imaging Studies endpoints
  IMAGING_STUDIES: '/api/imaging-studies',
  IMAGING_STUDY_BY_ID: (id: string) => `/api/imaging-studies/${id}`,
  UPDATE_SNOMED_CODES: '/api/imaging-studies/update-snomed-codes',
  
  // Health check
  HEALTH: '/api/health'
};

/**
 * Category colors for badges
 */
export const CATEGORY_COLORS = {
  'Laboratory Tests': 'bg-blue-100 text-blue-800 border-blue-300',
  'Imaging Studies': 'bg-purple-100 text-purple-800 border-purple-300',
  // Default for any other categories
  'default': 'bg-gray-100 text-gray-800 border-gray-300'
};

/**
 * Subcategory colors for badges
 */
export const SUBCATEGORY_COLORS = {
  // Laboratory Tests subcategories
  'Clinical Chemistry': 'bg-sky-100 text-sky-800 border-sky-300',
  'Hematology': 'bg-red-100 text-red-800 border-red-300',
  'Immunology/Serology': 'bg-green-100 text-green-800 border-green-300',
  'Molecular Diagnostics': 'bg-amber-100 text-amber-800 border-amber-300',
  'Microbiology': 'bg-teal-100 text-teal-800 border-teal-300',
  
  // Imaging Studies subcategories
  'Computed Tomography (CT)': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'Magnetic Resonance Imaging (MRI)': 'bg-violet-100 text-violet-800 border-violet-300',
  'Ultrasound': 'bg-blue-100 text-blue-800 border-blue-300',
  'X-ray': 'bg-gray-100 text-gray-800 border-gray-300',
  'Nuclear Medicine': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Positron Emission Tomography (PET)': 'bg-pink-100 text-pink-800 border-pink-300',
  'Fluoroscopy': 'bg-orange-100 text-orange-800 border-orange-300',
  'Mammography': 'bg-rose-100 text-rose-800 border-rose-300',
  
  // Default for any other subcategories
  'default': 'bg-slate-100 text-slate-800 border-slate-300'
};