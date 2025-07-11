/**
 * Medical constants and helper functions for the MediRefs API
 */

// Valid test categories that can be used in the system
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

// Category to prefix mapping for test IDs
const CATEGORY_PREFIXES: Record<string, string> = {
  'Laboratory Tests': 'LAB',
  'Imaging Studies': 'IMG',
  'Cardiovascular Tests': 'CVS',
  'Neurological Tests': 'NEU',
  'Pulmonary Tests': 'PUL',
  'Gastrointestinal Tests': 'GAS',
  'Specialty-Specific Tests': 'SPC',
  'Functional Tests': 'FNC',
};

// Subcategory to prefix mapping for test IDs
const SUBCATEGORY_PREFIXES: Record<string, Record<string, string>> = {
  'Laboratory Tests': {
    'Clinical Chemistry': 'CHE',
    'Hematology': 'HEM',
    'Immunology/Serology': 'IMM',
    'Molecular Diagnostics': 'MOL',
    'Microbiology': 'MIC',
    'Toxicology': 'TOX',
    'Urinalysis': 'URI',
    'Endocrinology': 'END',
    'Genetic Testing': 'GEN',
    'Tumor Markers': 'TUM',
    'Sputum': 'SPT',
    'Infectious Diseases': 'INF',
    'Stool Panel': 'STO',
  },
  'Imaging Studies': {
    'Radiography (X-rays)': 'XRA',
    'Computed Tomography (CT)': 'CT',
    'Magnetic Resonance Imaging (MRI)': 'MRI',
    'Ultrasound': 'ULT',
    'Nuclear Medicine': 'NUC',
    'Positron Emission Tomography (PET)': 'PET',
    'Fluoroscopy': 'FLU',
    'Mammography': 'MAM',
    'Bone Densitometry': 'BON',
  },
  'Cardiovascular Tests': {
    'Electrocardiography': 'ECG',
    'Echocardiography': 'ECH',
    'Stress Testing': 'STR',
    'Cardiac Catheterization': 'CAT',
    'Electrophysiology Studies': 'EPS',
    'Vascular Studies': 'VAS',
  },
  'Neurological Tests': {
    'Electroencephalography (EEG)': 'EEG',
    'Electromyography (EMG)': 'EMG',
    'Nerve Conduction Studies': 'NCS',
    'Evoked Potentials': 'EVO',
    'Sleep Studies': 'SLP',
  },
  'Pulmonary Tests': {
    'Pulmonary Function Tests': 'PFT',
    'Bronchoscopy': 'BRO',
    'Arterial Blood Gas Analysis': 'ABG',
  },
  'Gastrointestinal Tests': {
    'Endoscopic Procedures': 'END',
    'Manometry': 'MAN',
    'Breath Tests': 'BRE',
    'Motility Studies': 'MOT',
  },
  'Specialty-Specific Tests': {
    'Women\'s Health/OB-GYN': 'OBG',
    'Ophthalmology': 'OPH',
    'Audiology': 'AUD',
    'Dermatology': 'DER',
    'Allergology': 'ALL',
  },
  'Functional Tests': {
    'Exercise Tests': 'EXE',
    'Swallowing Studies': 'SWA',
    'Balance Testing': 'BAL',
  },
};

/**
 * Generates a unique test ID based on category, subcategory, CPT code, and a counter
 * Format: TTES-{CAT}-{SUB}-{CPTCODE or RAND}
 * 
 * @param category The test category
 * @param subcategory The test subcategory
 * @param cptCode Optional CPT code to use in the ID
 * @param counter A counter or number to make the ID unique (used only if no CPT code)
 * @returns A formatted test ID
 */
export function generateTestId(category: string, subcategory: string, cptCode?: string, counter?: number): string {
  // Get prefixes or use defaults
  const catPrefix = CATEGORY_PREFIXES[category] || 'UNK';
  const subPrefix = 
    subcategory && SUBCATEGORY_PREFIXES[category] ? 
      SUBCATEGORY_PREFIXES[category][subcategory] || 'UNK' : 
      'UNK';
  
  // Use CPT code if provided or generate a random number for uniqueness (5 digits)
  let suffix: string;
  if (cptCode && cptCode.trim() !== '') {
    // Truncate CPT code if it's longer than 5 characters
    suffix = cptCode.length > 5 ? cptCode.substring(0, 5) : cptCode;
  } else {
    // Generate a random number as fallback
    const randomNum = Math.floor(10000 + (counter || 0) + Math.random() * 90000);
    suffix = randomNum.toString();
  }
  
  // Format: TTES-{CAT}-{SUB}-{CPTCODE or RAND}
  return `TTES-${catPrefix}-${subPrefix}-${suffix}`;
}