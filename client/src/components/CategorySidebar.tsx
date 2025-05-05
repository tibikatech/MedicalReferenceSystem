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
      <div className="space-y-2 mb-6">
        <Button
          onClick={() => onCategorySelect(null)}
          className={cn(
            "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            !selectedCategory && !selectedSubCategory 
              ? "bg-primary text-white" 
              : "bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
          )}
        >
          All
          <span className="ml-1.5 bg-white bg-opacity-30 px-1.5 py-0.5 rounded-full text-xs font-semibold">
            {categories.reduce((sum, cat) => sum + cat.count, 0)}
          </span>
        </Button>
        
        {categories.map((category) => (
          <Button
            key={category.category}
            onClick={() => onCategorySelect(category.category)}
            className={cn(
              "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
              selectedCategory === category.category
                ? "bg-primary text-white"
                : "bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
            )}
          >
            {category.category}
            <span className="ml-1.5 bg-neutral-300 dark:bg-neutral-600 px-1.5 py-0.5 rounded-full text-xs font-semibold">
              {category.count}
            </span>
          </Button>
        ))}
      </div>
      
      {/* Subcategories */}
      <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
        Subcategories
      </h3>
      <div className="space-y-2">
        {subcategories.map((subcategory) => (
          <Button
            key={subcategory.subCategory}
            onClick={() => onSubCategorySelect(subcategory.subCategory)}
            className={cn(
              "inline-flex items-center px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 w-full justify-between dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700",
              selectedSubCategory === subcategory.subCategory &&
                "bg-primary/10 text-primary dark:bg-primary/20"
            )}
          >
            <span>{subcategory.subCategory}</span>
            <span className="bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full text-xs font-semibold">
              {subcategory.count}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
