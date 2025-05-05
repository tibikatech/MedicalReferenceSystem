import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Bookmark } from "lucide-react";
import { getCategoryBadgeClass, getSubcategoryBadgeClass, truncateText } from "@/lib/utils";
import { Test } from "@/types";

// Helper function to determine code type based on category
function getCodeType(category: string): string {
  switch (category) {
    case 'Laboratory Tests':
      return 'LOINC';
    case 'Imaging Studies':
      return 'SNOMED';
    case 'Cardiovascular Tests':
      return 'Code';
    case 'Neurological Tests':
      return 'Code';
    case 'Pulmonary Tests':
      return 'Code';
    case 'Gastrointestinal Tests':
      return 'Code';
    case 'Specialty-Specific Tests':
      return 'Code';
    case 'Functional Tests':
      return 'Code';
    default:
      return 'Code';
  }
}

// Helper function to get the appropriate code value based on category
function getCodeValue(category: string, loincCode: string | null | undefined, snomedCode: string | null | undefined, cptCode: string | null | undefined): string {
  switch (category) {
    case 'Laboratory Tests':
      return loincCode || 'N/A';
    case 'Imaging Studies':
      return snomedCode || 'N/A';
    default:
      // For other categories, show any available code with preference order
      return loincCode || snomedCode || cptCode || 'N/A';
  }
}

interface TestCardProps {
  test: Test;
  onSelect: (test: Test) => void;
}

export default function TestCard({ test, onSelect }: TestCardProps) {
  const { 
    id, 
    name, 
    category, 
    subCategory, 
    cptCode, 
    loincCode, 
    snomedCode, 
    description 
  } = test;

  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg border border-neutral-200 flex flex-col dark:bg-neutral-800 dark:border-neutral-700">
      <CardHeader className="px-4 py-5 sm:px-6 flex justify-between">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 truncate">
          {name}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="text-neutral-400 hover:text-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-400"
          aria-label="Bookmark test"
        >
          <Bookmark className="h-5 w-5" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-grow border-t border-neutral-200 px-4 py-4 sm:px-6 dark:border-neutral-700">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="category">
            {category}
          </Badge>
          <Badge variant="subcategory">
            {subCategory}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-neutral-500 dark:text-neutral-400">CPT Code</span>
            <span className="block font-medium text-neutral-900 dark:text-neutral-100">
              {cptCode || "N/A"}
            </span>
          </div>
          <div>
            <span className="block text-neutral-500 dark:text-neutral-400">
              {getCodeType(category)}
            </span>
            <span className="block font-medium text-neutral-900 dark:text-neutral-100">
              {getCodeValue(category, loincCode, snomedCode, cptCode)}
            </span>
          </div>
        </div>
      </CardContent>
      
      <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
        <p className="text-sm text-neutral-600 line-clamp-2 dark:text-neutral-300">
          {truncateText(description, 120)}
        </p>
      </div>
      
      <CardFooter className="border-t border-neutral-200 px-4 py-4 sm:px-6 flex justify-end dark:border-neutral-700">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect(test)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-primary-900 dark:text-primary-200 dark:hover:bg-primary-800"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
