// API endpoints
export const API_ENDPOINTS = {
  ALL_TESTS: '/api/tests',
  TEST_BY_ID: (id: string) => `/api/tests/${id}`,
  TESTS_BY_CATEGORY: (category: string) => `/api/tests/category/${encodeURIComponent(category)}`,
  TESTS_BY_SUBCATEGORY: (subcategory: string) => `/api/tests/subcategory/${encodeURIComponent(subcategory)}`,
  SEARCH_TESTS: (query: string) => `/api/tests/search?q=${encodeURIComponent(query)}`,
  TEST_COUNT_BY_CATEGORY: '/api/test-count-by-category',
  TEST_COUNT_BY_SUBCATEGORY: '/api/test-count-by-subcategory',
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
