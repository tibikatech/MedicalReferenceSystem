import React, { useState, useMemo } from 'react';
import { Test } from '@shared/schema';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Search, 
  Filter, 
  Users, 
  CheckSquare, 
  Square, 
  ChevronDown,
  Layers
} from 'lucide-react';

export interface CptFamily {
  baseCptCode: string;
  tests: Test[];
  suffixVariations: string[];
  totalCount: number;
  categories: string[];
  subcategories: string[];
}

interface CptFamilyFilterProps {
  tests: Test[];
  selectedFamilies: string[];
  onFamilySelectionChange: (selectedFamilies: string[]) => void;
  selectedTests: string[];
  onTestSelectionChange: (selectedTests: string[]) => void;
}

export function CptFamilyFilter({
  tests,
  selectedFamilies,
  onFamilySelectionChange,
  selectedTests,
  onTestSelectionChange
}: CptFamilyFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBySuffix, setFilterBySuffix] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'cptCode' | 'familySize' | 'name'>('cptCode');

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

    // Sort suffix variations and convert to array
    return Array.from(familyMap.values()).map(family => ({
      ...family,
      suffixVariations: family.suffixVariations.sort()
    }));
  }, [tests]);

  // Filter and sort families
  const filteredFamilies = useMemo(() => {
    let filtered = cptFamilies;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(family => 
        family.baseCptCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        family.tests.some(test => 
          test.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply suffix filter
    if (filterBySuffix !== 'all') {
      if (filterBySuffix === 'with-suffixes') {
        filtered = filtered.filter(family => family.suffixVariations.length > 0);
      } else if (filterBySuffix === 'no-suffixes') {
        filtered = filtered.filter(family => family.suffixVariations.length === 0);
      }
    }

    // Sort families
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'familySize':
          return b.totalCount - a.totalCount;
        case 'name':
          return a.tests[0]?.name.localeCompare(b.tests[0]?.name) || 0;
        case 'cptCode':
        default:
          return a.baseCptCode.localeCompare(b.baseCptCode);
      }
    });

    return filtered;
  }, [cptFamilies, searchQuery, filterBySuffix, sortBy]);

  // Handle family selection
  const handleFamilyToggle = (baseCptCode: string) => {
    if (selectedFamilies.includes(baseCptCode)) {
      onFamilySelectionChange(selectedFamilies.filter(f => f !== baseCptCode));
    } else {
      onFamilySelectionChange([...selectedFamilies, baseCptCode]);
    }
  };

  // Handle individual test selection
  const handleTestToggle = (testId: string) => {
    if (selectedTests.includes(testId)) {
      onTestSelectionChange(selectedTests.filter(t => t !== testId));
    } else {
      onTestSelectionChange([...selectedTests, testId]);
    }
  };

  // Select all families
  const selectAllFamilies = () => {
    onFamilySelectionChange(filteredFamilies.map(f => f.baseCptCode));
  };

  // Deselect all families
  const deselectAllFamilies = () => {
    onFamilySelectionChange([]);
  };

  // Get family selection status
  const getFamilySelectionStatus = (family: CptFamily) => {
    const familyTestIds = family.tests.map(t => t.id);
    const selectedFamilyTests = selectedTests.filter(id => familyTestIds.includes(id));
    
    if (selectedFamilyTests.length === familyTestIds.length) return 'all';
    if (selectedFamilyTests.length > 0) return 'partial';
    return 'none';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          CPT Family Filter
          <Badge variant="outline" className="ml-auto">
            {filteredFamilies.length} families
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search CPT codes or test names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterBySuffix} onValueChange={setFilterBySuffix}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by suffix" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Families</SelectItem>
              <SelectItem value="with-suffixes">With Suffixes</SelectItem>
              <SelectItem value="no-suffixes">No Suffixes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: 'cptCode' | 'familySize' | 'name') => setSortBy(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cptCode">CPT Code</SelectItem>
              <SelectItem value="familySize">Family Size</SelectItem>
              <SelectItem value="name">Test Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        <div className="flex justify-between items-center py-2 border-b">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAllFamilies}>
              <CheckSquare className="h-4 w-4 mr-1" />
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAllFamilies}>
              <Square className="h-4 w-4 mr-1" />
              Deselect All
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedFamilies.length} families selected
          </div>
        </div>

        {/* CPT Families List */}
        <ScrollArea className="h-[400px] pr-4">
          <Accordion type="multiple" className="space-y-2">
            {filteredFamilies.map((family) => {
              const selectionStatus = getFamilySelectionStatus(family);
              
              return (
                <AccordionItem key={family.baseCptCode} value={family.baseCptCode}>
                  <Card className="border">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedFamilies.includes(family.baseCptCode)}
                            onCheckedChange={() => handleFamilyToggle(family.baseCptCode)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="text-left">
                            <div className="font-medium text-blue-600">
                              CPT {family.baseCptCode}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {family.tests[0]?.name}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {family.totalCount} test{family.totalCount !== 1 ? 's' : ''}
                          </Badge>
                          {family.suffixVariations.length > 0 && (
                            <Badge variant="outline">
                              {family.suffixVariations.join(', ')}
                            </Badge>
                          )}
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-4 pb-3">
                      <div className="space-y-2 ml-6">
                        {family.tests.map((test) => (
                          <div key={test.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
                            <Checkbox
                              checked={selectedTests.includes(test.id)}
                              onCheckedChange={() => handleTestToggle(test.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{test.name}</span>
                                {test.cptSuffix && (
                                  <Badge variant="outline" className="text-xs">
                                    {test.cptCode}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {test.category} • {test.subCategory}
                              </div>
                              {test.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {test.description}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>

        {filteredFamilies.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No CPT families match your search criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CptFamilyFilter;