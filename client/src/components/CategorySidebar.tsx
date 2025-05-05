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
      <div className="bg-white p-4 rounded-lg border border-gray-100 mb-4">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Categories</h2>
        
        {/* Main categories */}
        <div className="category-tabs flex flex-wrap md:flex-col mb-6 gap-2">
          <button
            onClick={() => onCategorySelect(null)}
            className={cn(
              "category-tab flex items-center justify-between px-3 py-2 rounded-full text-sm font-medium transition-all",
              !selectedCategory && !selectedSubCategory 
                ? "bg-primary text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <span>All</span>
            <span className="ml-1.5 bg-white bg-opacity-30 px-1.5 py-0.5 rounded-full text-xs font-semibold">
              {categories.reduce((sum, cat) => sum + cat.count, 0)}
            </span>
          </button>
          
          {categories.map((category) => (
            <button
              key={category.category}
              onClick={() => onCategorySelect(category.category)}
              className={cn(
                "category-tab flex items-center justify-between px-3 py-2 rounded-full text-sm font-medium transition-all",
                selectedCategory === category.category 
                  ? "bg-primary text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <span>{category.category}</span>
              <span className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold",
                selectedCategory === category.category
                  ? "bg-white bg-opacity-30 text-white"
                  : "bg-gray-200 text-gray-700"
              )}>
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Subcategories */}
      <div className="bg-white p-4 rounded-lg border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Subcategories
        </h3>
        <div className="category-tabs flex-col space-y-2">
          {subcategories.map((subcategory) => (
            <button
              key={subcategory.subCategory}
              onClick={() => onSubCategorySelect(subcategory.subCategory)}
              className={cn(
                "category-tab w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all",
                selectedSubCategory === subcategory.subCategory 
                  ? "bg-accent text-primary" 
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              )}
            >
              <span>{subcategory.subCategory}</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs font-semibold",
                selectedSubCategory === subcategory.subCategory
                  ? "bg-primary bg-opacity-10 text-primary"
                  : "bg-gray-200 text-gray-700"
              )}>
                {subcategory.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
