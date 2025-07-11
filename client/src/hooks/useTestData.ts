import { useQuery } from "@tanstack/react-query";
import { Test } from "@shared/schema";

interface CategoryCount {
  category: string;
  count: number;
}

interface SubcategoryCount {
  subCategory: string;
  count: number;
}

export function useTestData(
  selectedCategory: string | null,
  selectedSubCategory: string | null,
  searchQuery: string
) {
  // Query all tests
  const testsQuery = useQuery<{ tests: Test[] }>({
    queryKey: ["/api/tests"],
  });
  
  // Query category counts
  const categoriesQuery = useQuery<{ categories: CategoryCount[] }>({
    queryKey: ["/api/test-count-by-category"],
  });
  
  // Query subcategory counts
  const subcategoriesQuery = useQuery<{ subcategories: SubcategoryCount[] }>({
    queryKey: !selectedCategory 
      ? ["/api/test-count-by-subcategory"] 
      : [`/api/test-count-by-subcategory/${encodeURIComponent(selectedCategory)}`],
  });
  
  // Get test data by selected category
  const categoryQuery = useQuery<{ tests: Test[] }>({
    queryKey: [
      `/api/tests/category/${encodeURIComponent(selectedCategory || "")}`
    ],
    enabled: !!selectedCategory && !searchQuery,
  });
  
  // Get test data by selected subcategory
  const subcategoryQuery = useQuery<{ tests: Test[] }>({
    queryKey: [
      `/api/tests/subcategory/${encodeURIComponent(selectedSubCategory || "")}`
    ],
    enabled: !!selectedSubCategory && !searchQuery,
  });
  
  // Search tests
  const searchTestsQuery = useQuery<{ tests: Test[] }>({
    queryKey: ["/api/tests/search", { q: searchQuery }],
    queryFn: async () => {
      const response = await fetch(`/api/tests/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!searchQuery,
  });
  
  // Determine which tests to display based on active filters
  // Priority: Search > Subcategory > Category > All Tests
  let tests: Test[] | undefined;
  if (searchQuery.length > 0 && searchTestsQuery.data) {
    tests = searchTestsQuery.data.tests;
  } else if (selectedSubCategory && subcategoryQuery.data) {
    // Subcategory has higher priority than category
    tests = subcategoryQuery.data.tests;
  } else if (selectedCategory && categoryQuery.data) {
    tests = categoryQuery.data.tests;
  } else if (testsQuery.data) {
    tests = testsQuery.data.tests;
  }
  
  const isLoading = testsQuery.isLoading || 
    (selectedCategory && categoryQuery.isLoading) || 
    (selectedSubCategory && subcategoryQuery.isLoading) ||
    (searchQuery.length > 0 && searchTestsQuery.isLoading);
    
  const isError = testsQuery.isError || 
    (selectedCategory && categoryQuery.isError) || 
    (selectedSubCategory && subcategoryQuery.isError) ||
    (searchQuery.length > 0 && searchTestsQuery.isError);
  
  return {
    tests,
    categories: categoriesQuery.data?.categories || [],
    subcategories: subcategoriesQuery.data?.subcategories || [],
    isLoading,
    isError,
    refetch: () => {
      testsQuery.refetch();
      categoriesQuery.refetch();
      subcategoriesQuery.refetch();
      if (selectedCategory) categoryQuery.refetch();
      if (selectedSubCategory) subcategoryQuery.refetch();
      if (searchQuery) searchTestsQuery.refetch();
    }
  };
}
