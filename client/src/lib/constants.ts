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
  'Cardiovascular Tests': 'bg-red-100 text-red-800 border-red-300',
  'Neurological Tests': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Pulmonary Tests': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'Gastrointestinal Tests': 'bg-amber-100 text-amber-800 border-amber-300',
  'Specialty-Specific Tests': 'bg-pink-100 text-pink-800 border-pink-300',
  'Functional Tests': 'bg-indigo-100 text-indigo-800 border-indigo-300',
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
  'Toxicology': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'Urinalysis': 'bg-blue-100 text-blue-800 border-blue-300',
  'Endocrinology': 'bg-lime-100 text-lime-800 border-lime-300',
  'Genetic Testing': 'bg-violet-100 text-violet-800 border-violet-300',
  'Tumor Markers': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
  
  // Imaging Studies subcategories
  'Radiography (X-rays)': 'bg-gray-100 text-gray-800 border-gray-300',
  'Computed Tomography (CT)': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'Magnetic Resonance Imaging (MRI)': 'bg-violet-100 text-violet-800 border-violet-300',
  'Ultrasound': 'bg-blue-100 text-blue-800 border-blue-300',
  'Nuclear Medicine': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Positron Emission Tomography (PET)': 'bg-pink-100 text-pink-800 border-pink-300',
  'Fluoroscopy': 'bg-orange-100 text-orange-800 border-orange-300',
  'Mammography': 'bg-rose-100 text-rose-800 border-rose-300',
  'Bone Densitometry': 'bg-stone-100 text-stone-800 border-stone-300',
  
  // Cardiovascular Tests subcategories
  'Electrocardiography': 'bg-red-100 text-red-800 border-red-300',
  'Echocardiography': 'bg-rose-100 text-rose-800 border-rose-300',
  'Stress Testing': 'bg-orange-100 text-orange-800 border-orange-300',
  'Cardiac Catheterization': 'bg-pink-100 text-pink-800 border-pink-300',
  'Electrophysiology Studies': 'bg-purple-100 text-purple-800 border-purple-300',
  'Vascular Studies': 'bg-red-100 text-red-800 border-red-300',
  
  // Neurological Tests subcategories
  'Electroencephalography (EEG)': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Electromyography (EMG)': 'bg-green-100 text-green-800 border-green-300',
  'Nerve Conduction Studies': 'bg-lime-100 text-lime-800 border-lime-300',
  'Evoked Potentials': 'bg-teal-100 text-teal-800 border-teal-300',
  'Sleep Studies': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  
  // Pulmonary Tests subcategories
  'Pulmonary Function Tests': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'Bronchoscopy': 'bg-blue-100 text-blue-800 border-blue-300',
  'Arterial Blood Gas Analysis': 'bg-sky-100 text-sky-800 border-sky-300',
  
  // Gastrointestinal Tests subcategories
  'Endoscopic Procedures': 'bg-amber-100 text-amber-800 border-amber-300',
  'Manometry': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Breath Tests': 'bg-orange-100 text-orange-800 border-orange-300',
  'Motility Studies': 'bg-lime-100 text-lime-800 border-lime-300',
  
  // Specialty-Specific Tests subcategories
  'Women\'s Health/OB-GYN': 'bg-pink-100 text-pink-800 border-pink-300',
  'Ophthalmology': 'bg-purple-100 text-purple-800 border-purple-300',
  'Audiology': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'Dermatology': 'bg-amber-100 text-amber-800 border-amber-300',
  'Allergology': 'bg-teal-100 text-teal-800 border-teal-300',
  
  // Functional Tests subcategories
  'Exercise Tests': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'Swallowing Studies': 'bg-blue-100 text-blue-800 border-blue-300',
  'Balance Testing': 'bg-violet-100 text-violet-800 border-violet-300',
  
  // Default for any other subcategories
  'default': 'bg-slate-100 text-slate-800 border-slate-300'
};

/**
 * Valid categories for form validation
 */
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

/**
 * Valid subcategories for each category for form validation
 */
export const VALID_SUBCATEGORIES: Record<string, string[]> = {
  'Laboratory Tests': [
    'Clinical Chemistry',
    'Hematology',
    'Immunology/Serology',
    'Molecular Diagnostics',
    'Microbiology',
    'Toxicology',
    'Urinalysis',
    'Endocrinology',
    'Genetic Testing',
    'Tumor Markers'
  ],
  'Imaging Studies': [
    'Radiography (X-rays)',
    'Computed Tomography (CT)',
    'Magnetic Resonance Imaging (MRI)',
    'Ultrasound',
    'Nuclear Medicine',
    'Positron Emission Tomography (PET)',
    'Fluoroscopy',
    'Mammography',
    'Bone Densitometry'
  ],
  'Cardiovascular Tests': [
    'Electrocardiography',
    'Echocardiography',
    'Stress Testing',
    'Cardiac Catheterization',
    'Electrophysiology Studies',
    'Vascular Studies'
  ],
  'Neurological Tests': [
    'Electroencephalography (EEG)',
    'Electromyography (EMG)',
    'Nerve Conduction Studies',
    'Evoked Potentials',
    'Sleep Studies'
  ],
  'Pulmonary Tests': [
    'Pulmonary Function Tests',
    'Bronchoscopy',
    'Arterial Blood Gas Analysis'
  ],
  'Gastrointestinal Tests': [
    'Endoscopic Procedures',
    'Manometry',
    'Breath Tests',
    'Motility Studies'
  ],
  'Specialty-Specific Tests': [
    'Women\'s Health/OB-GYN',
    'Ophthalmology',
    'Audiology',
    'Dermatology',
    'Allergology'
  ],
  'Functional Tests': [
    'Exercise Tests',
    'Swallowing Studies',
    'Balance Testing'
  ]
};