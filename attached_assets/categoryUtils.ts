import { TestCategory, TestSubCategory, ImagingSubCategories } from '../types';

/**
 * Normalizes a category string to match the expected enum values
 * @param category String representation of category
 * @returns Normalized category string
 */
export const normalizeCategory = (category: string): string => {
  // Convert to lowercase for comparison
  const lowerCategory = category.toLowerCase().trim();
  
  // Check for various category forms and normalize
  if (lowerCategory.includes('lab') || lowerCategory.includes('laboratory')) {
    return TestCategory.LABORATORY;
  } else if (lowerCategory.includes('imag')) {
    return 'Imaging Studies'; // Use string instead of enum for compatibility
  } else if (lowerCategory.includes('cardio')) {
    return TestCategory.CARDIOLOGY;
  } else if (lowerCategory.includes('neuro')) {
    return TestCategory.NEUROLOGY;
  } else if (lowerCategory.includes('pulmo') || lowerCategory.includes('lung')) {
    return TestCategory.PULMONARY;
  } else if (lowerCategory.includes('gastro') || lowerCategory.includes('digest')) {
    return TestCategory.GASTRO;
  }
  
  // If none of the above matches, return the original string
  return category;
};

/**
 * Returns the subcategories associated with a specific category
 * @param category The category to get subcategories for
 * @returns Array of subcategory strings
 */
export const getSubcategoriesForCategory = (category: string): string[] => {
  const categoryNormalized = normalizeCategory(category);
  
  if (categoryNormalized === TestCategory.LABORATORY) {
    return Object.values(TestSubCategory);
  } else if (categoryNormalized === 'Imaging Studies') {
    return Object.values(ImagingSubCategories);
  } else if (categoryNormalized === TestCategory.CARDIOLOGY) {
    // Cardiology doesn't have subcategories in the current implementation
    return [];
  } else if (categoryNormalized === TestCategory.NEUROLOGY) {
    // Neurology doesn't have subcategories in the current implementation
    return [];
  } else if (categoryNormalized === TestCategory.PULMONARY) {
    // Pulmonary doesn't have subcategories in the current implementation
    return [];
  } else if (categoryNormalized === TestCategory.GASTRO) {
    // Gastroenterology doesn't have subcategories in the current implementation
    return [];
  }
  
  return [];
};

/**
 * Normalizes a subcategory string based on the parent category
 * @param category The parent category
 * @param subCategory String representation of subcategory
 * @returns Normalized subcategory string
 */
export const normalizeSubCategory = (category: string, subCategory: string): string => {
  const lowerCategory = category.toLowerCase().trim();
  const lowerSubCategory = subCategory.toLowerCase().trim();
  
  // Handle laboratory subcategories
  if (lowerCategory.includes('lab') || lowerCategory.includes('laboratory')) {
    if (lowerSubCategory.includes('hemat') || lowerSubCategory.includes('blood')) {
      return TestSubCategory.HEMATOLOGY;
    } else if (lowerSubCategory.includes('chem')) {
      return TestSubCategory.CHEMISTRY;
    } else if (lowerSubCategory.includes('micro')) {
      return TestSubCategory.MICROBIOLOGY;
    } else if (lowerSubCategory.includes('immun') || lowerSubCategory.includes('sero')) {
      return TestSubCategory.IMMUNOLOGY;
    } else if (lowerSubCategory.includes('molec') || lowerSubCategory.includes('dna') || lowerSubCategory.includes('rna')) {
      return TestSubCategory.MOLECULAR;
    } else if (lowerSubCategory.includes('tox')) {
      return TestSubCategory.TOXICOLOGY;
    } else if (lowerSubCategory.includes('urin') || lowerSubCategory.includes('ua')) {
      return TestSubCategory.URINALYSIS;
    } else if (lowerSubCategory.includes('endo') || lowerSubCategory.includes('hormon')) {
      return TestSubCategory.ENDOCRINOLOGY;
    } else if (lowerSubCategory.includes('genet')) {
      return TestSubCategory.GENETICS;
    } else if (lowerSubCategory.includes('tumor') || lowerSubCategory.includes('cancer') || lowerSubCategory.includes('marker')) {
      return TestSubCategory.TUMOR_MARKERS;
    }
  }
  
  // Handle imaging subcategories
  else if (lowerCategory.includes('imag')) {
    if (lowerSubCategory.includes('x-ray') || lowerSubCategory.includes('xray') || lowerSubCategory.includes('radio')) {
      return ImagingSubCategories.RADIOGRAPHY;
    } else if (lowerSubCategory.includes('ct') || lowerSubCategory.includes('tomogra')) {
      return ImagingSubCategories.CT;
    } else if (lowerSubCategory.includes('mri') || lowerSubCategory.includes('magnetic')) {
      return ImagingSubCategories.MRI;
    } else if (lowerSubCategory.includes('ultra') || lowerSubCategory.includes('sono')) {
      return ImagingSubCategories.ULTRASOUND;
    } else if (lowerSubCategory.includes('mammo')) {
      return ImagingSubCategories.MAMMOGRAPHY;
    } else if (lowerSubCategory.includes('nuclear')) {
      return ImagingSubCategories.NUCLEAR;
    } else if (lowerSubCategory.includes('pet')) {
      return ImagingSubCategories.PET;
    } else if (lowerSubCategory.includes('fluoro')) {
      return ImagingSubCategories.FLUOROSCOPY;
    } else if (lowerSubCategory.includes('dexa') || lowerSubCategory.includes('densit')) {
      return ImagingSubCategories.DENSITOMETRY;
    } else if (lowerSubCategory.includes('angio')) {
      return ImagingSubCategories.ANGIOGRAPHY;
    }
  }
  
  // If none of the above matches, return the original string
  return subCategory;
};