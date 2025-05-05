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
      <h2 className="text-lg font-medium text-white mb-4">Categories</h2>
      
      {/* Main categories */}
      <div className="flex flex-col space-y-2 mb-6">
        <button
          onClick={() => onCategorySelect(null)}
          className={cn(
            "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium",
            !selectedCategory && !selectedSubCategory 
              ? "bg-blue-600 text-white" 
              : "bg-gray-700 text-gray-200 hover:bg-gray-600"
          )}
        >
          All
          <span className="ml-1.5 bg-gray-600 bg-opacity-50 px-1.5 py-0.5 rounded-full text-xs font-semibold">
            {categories.reduce((sum, cat) => sum + cat.count, 0)}
          </span>
        </button>
        
        {categories.map((category) => (
          <button
            key={category.category}
            onClick={() => onCategorySelect(category.category)}
            className={cn(
              "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium",
              selectedCategory === category.category
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            )}
          >
            {category.category}
            <span className="ml-1.5 bg-gray-600 px-1.5 py-0.5 rounded-full text-xs font-semibold">
              {category.count}
            </span>
          </button>
        ))}
      </div>
      
      {/* Subcategories */}
      <h3 className="text-sm font-medium text-gray-300 mb-3">
        {selectedCategory ? `${selectedCategory} Subcategories` : 'Subcategories'}
      </h3>
      <div className="flex flex-col space-y-2">
        {subcategories.map((subcategory) => (
          <button
            key={subcategory.subCategory}
            onClick={() => onSubCategorySelect(subcategory.subCategory)}
            className={cn(
              "inline-flex items-center justify-between px-3 py-1.5 rounded-full text-sm font-medium",
              selectedSubCategory === subcategory.subCategory
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            )}
          >
            <span>{subcategory.subCategory}</span>
            <span className="ml-1.5 bg-gray-600 px-1.5 py-0.5 rounded-full text-xs font-semibold">
              {subcategory.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
