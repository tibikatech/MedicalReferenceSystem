import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategorySidebarProps {
  categories: { category: string; count: number }[];
  subcategories: { subCategory: string; count: number }[];
  selectedCategory: string | null;
  selectedSubCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  onSubCategorySelect: (subcategory: string | null) => void;
}

export default function CategorySidebar({
  categories,
  subcategories,
  selectedCategory,
  selectedSubCategory,
  onCategorySelect,
  onSubCategorySelect
}: CategorySidebarProps) {
  return (
    <div className="w-full md:w-64 mb-6 md:mb-0 md:mr-8">
      <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">Categories</h2>
      
      {/* Main categories */}
      <div className="category-tabs flex flex-wrap md:flex-col mb-6">
        <button
          onClick={() => onCategorySelect(null)}
          className={cn(
            "category-tab",
            !selectedCategory && !selectedSubCategory ? "active" : ""
          )}
        >
          All
          <span className="ml-1.5 bg-white bg-opacity-30 px-1.5 py-0.5 rounded-full text-xs font-semibold">
            {categories.reduce((sum, cat) => sum + cat.count, 0)}
          </span>
        </button>
        
        {categories.map((category) => (
          <button
            key={category.category}
            onClick={() => onCategorySelect(category.category)}
            className={cn(
              "category-tab",
              selectedCategory === category.category ? "active" : ""
            )}
          >
            {category.category}
            <span className="ml-1.5 bg-neutral-300 dark:bg-neutral-600 px-1.5 py-0.5 rounded-full text-xs font-semibold">
              {category.count}
            </span>
          </button>
        ))}
      </div>
      
      {/* Subcategories */}
      <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
        Subcategories
      </h3>
      <div className="category-tabs flex-col space-y-2">
        {subcategories.map((subcategory) => (
          <button
            key={subcategory.subCategory}
            onClick={() => onSubCategorySelect(subcategory.subCategory)}
            className={cn(
              "category-tab w-full justify-between",
              selectedSubCategory === subcategory.subCategory ? "active" : ""
            )}
          >
            <span>{subcategory.subCategory}</span>
            <span className="bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full text-xs font-semibold">
              {subcategory.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
