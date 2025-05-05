// API endpoints
export const API_ENDPOINTS = {
  ALL_TESTS: '/api/tests',
  TEST_BY_ID: (id: string) => `/api/tests/${id}`,
  TESTS_BY_CATEGORY: (category: string) => `/api/tests/category/${encodeURIComponent(category)}`,
  TESTS_BY_SUBCATEGORY: (subcategory: string) => `/api/tests/subcategory/${encodeURIComponent(subcategory)}`,
  SEARCH_TESTS: (query: string) => `/api/tests/search?q=${encodeURIComponent(query)}`,
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
};

// Color mapping for categories
export const CATEGORY_COLORS = {
  'Laboratory Tests': 'badge-laboratory',
  'Imaging Studies': 'badge-imaging',
};

// Color mapping for subcategories
export const SUBCATEGORY_COLORS = {
  'Clinical Chemistry': 'badge-clinical-chemistry',
  'Computed Tomography (CT)': 'badge-computed-tomography',
  'Hematology': 'badge-hematology',
  'Immunology/Serology': 'badge-immunology',
  'Molecular Diagnostics': 'badge-molecular',
  'Microbiology': 'badge-microbiology',
  'Magnetic Resonance Imaging (MRI)': 'badge-mri',
};
