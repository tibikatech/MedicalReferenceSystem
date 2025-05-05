// Types for the medical test data

export interface Test {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  cptCode?: string;
  loincCode?: string;
  snomedCode?: string;
  description?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface SubcategoryCount {
  subCategory: string;
  count: number;
}

export interface TestsState {
  tests: Test[];
  filteredTests: Test[];
  categories: CategoryCount[];
  subcategories: SubcategoryCount[];
  selectedTest: Test | null;
  selectedCategory: string | null;
  selectedSubCategory: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}
