import React, { useMemo } from 'react';
import { Test } from '@shared/schema';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  Users, 
  Search, 
  AlertCircle,
  FileText,
  Stethoscope,
  TestTube
} from 'lucide-react';
import { CptFamily } from './CptFamilyFilter';

interface CptFamilyTestsDisplayProps {
  tests: Test[];
  selectedFamilies: string[];
  selectedTests: string[];
  onTestSelect: (test: Test) => void;
  isLoading: boolean;
}

export function CptFamilyTestsDisplay({
  tests,
  selectedFamilies,
  selectedTests,
  onTestSelect,
  isLoading
}: CptFamilyTestsDisplayProps) {
  
  // Group tests into CPT families
  const cptFamilies = useMemo(() => {
    const familyMap = new Map<string, CptFamily>();

    tests.forEach(test => {
      if (!test.baseCptCode) return;

      if (!familyMap.has(test.baseCptCode)) {
        familyMap.set(test.baseCptCode, {
          baseCptCode: test.baseCptCode,
          tests: [],
          suffixVariations: [],
          totalCount: 0,
          categories: [],
          subcategories: []
        });
      }

      const family = familyMap.get(test.baseCptCode)!;
      family.tests.push(test);
      family.totalCount++;

      if (test.cptSuffix && !family.suffixVariations.includes(test.cptSuffix)) {
        family.suffixVariations.push(test.cptSuffix);
      }

      if (!family.categories.includes(test.category)) {
        family.categories.push(test.category);
      }

      if (test.subCategory && !family.subcategories.includes(test.subCategory)) {
        family.subcategories.push(test.subCategory);
      }
    });

    return Array.from(familyMap.values()).sort((a, b) => 
      a.baseCptCode.localeCompare(b.baseCptCode)
    );
  }, [tests]);

  // Filter families to show only selected ones or all if none selected
  const displayFamilies = useMemo(() => {
    if (selectedFamilies.length === 0) {
      return cptFamilies;
    }
    return cptFamilies.filter(family => selectedFamilies.includes(family.baseCptCode));
  }, [cptFamilies, selectedFamilies]);

  // Get tests that are individually selected (not part of a family selection)
  const individuallySelectedTests = useMemo(() => {
    const familyTestIds = new Set(
      displayFamilies.flatMap(family => family.tests.map(t => t.id))
    );
    return tests.filter(test => 
      selectedTests.includes(test.id) && !familyTestIds.has(test.id)
    );
  }, [tests, selectedTests, displayFamilies]);

  const getCategoryIcon = (category: string) => {
    if (category.includes('Laboratory')) return <TestTube className="h-4 w-4" />;
    if (category.includes('Imaging')) return <Eye className="h-4 w-4" />;
    return <Stethoscope className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedFamilies.length === 0 && selectedTests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            CPT Families Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Select CPT Families or Tests</h3>
            <p className="text-muted-foreground mb-4">
              Choose CPT families or individual tests from the filter panel to view details and perform operations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium text-blue-600">{cptFamilies.length}</div>
                <div className="text-muted-foreground">Total CPT Families</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium text-green-600">{tests.length}</div>
                <div className="text-muted-foreground">Total Tests</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium text-purple-600">
                  {tests.filter(t => t.cptSuffix).length}
                </div>
                <div className="text-muted-foreground">Tests with Suffixes</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected CPT Families */}
      {displayFamilies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Selected CPT Families
              <Badge variant="outline">{displayFamilies.length} families</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[600px] pr-4">
              <div className="space-y-4">
                {displayFamilies.map((family) => (
                  <Card key={family.baseCptCode} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg text-blue-600">
                            CPT Family {family.baseCptCode}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {family.totalCount} test{family.totalCount !== 1 ? 's' : ''} • 
                            {family.categories.join(', ')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {family.suffixVariations.map(suffix => (
                            <Badge key={suffix} variant="outline" className="text-xs">
                              {family.baseCptCode}{suffix}
                            </Badge>
                          ))}
                          {family.suffixVariations.length === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              No suffixes
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {family.tests.map((test) => (
                          <div 
                            key={test.id} 
                            className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getCategoryIcon(test.category)}
                                <h4 className="font-medium truncate">{test.name}</h4>
                                {test.cptSuffix && (
                                  <Badge variant="outline" className="text-xs">
                                    {test.cptCode}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {test.category} • {test.subCategory}
                              </p>
                              {test.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {test.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onTestSelect(test)}
                              className="ml-4 flex-shrink-0"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Individual Selected Tests */}
      {individuallySelectedTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Individual Selected Tests
              <Badge variant="outline">{individuallySelectedTests.length} tests</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {individuallySelectedTests.map((test) => (
                <div 
                  key={test.id} 
                  className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getCategoryIcon(test.category)}
                      <h4 className="font-medium truncate">{test.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {test.cptCode || 'No CPT'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {test.category} • {test.subCategory}
                    </p>
                    {test.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {test.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTestSelect(test)}
                    className="ml-4 flex-shrink-0"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {displayFamilies.length === 0 && individuallySelectedTests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Tests Found</h3>
            <p className="text-muted-foreground">
              No tests match your current selection. Try adjusting your filters or selecting different CPT families.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CptFamilyTestsDisplay;