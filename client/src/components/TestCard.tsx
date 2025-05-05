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
    <Card className="test-card flex flex-col bg-white overflow-hidden border border-gray-100 hover:shadow-md transition-all">
      <CardHeader className="test-header px-4 py-3 flex justify-between bg-white">
        <h3 className="test-name text-lg font-medium truncate text-primary">
          {name}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="bookmark-btn text-gray-400 hover:text-primary hover:bg-accent"
          aria-label="Bookmark test"
        >
          <Bookmark className="h-5 w-5" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-grow border-t border-gray-100 px-4 py-3">
        <div className="test-categories flex flex-wrap gap-2 mb-3">
          <Badge className="category-tag bg-accent text-primary">
            {category}
          </Badge>
          <Badge className="category-tag bg-accent text-primary">
            {subCategory}
          </Badge>
        </div>
        
        <div className="test-codes grid grid-cols-2 gap-4 text-sm">
          <div className="test-code">
            <span className="code-label text-gray-600 font-medium block mb-1">CPT Code</span>
            <span className="code-value bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono text-xs block w-fit">
              {cptCode || "N/A"}
            </span>
          </div>
          <div className="test-code">
            <span className="code-label text-gray-600 font-medium block mb-1">
              {getCodeType(category)}
            </span>
            <span className="code-value bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono text-xs block w-fit">
              {getCodeValue(category, loincCode, snomedCode, cptCode)}
            </span>
          </div>
        </div>
      </CardContent>
      
      <div className="description border-t border-gray-100 px-4 py-3 text-gray-600">
        <p className="text-sm line-clamp-2">
          {truncateText(description, 120)}
        </p>
      </div>
      
      <CardFooter className="border-t border-gray-100 px-4 py-3 flex justify-end">
        <Button
          variant="default"
          size="sm"
          onClick={() => onSelect(test)}
          className="bg-primary hover:bg-primary hover:opacity-90 text-white px-4 py-2 text-xs font-medium rounded"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
