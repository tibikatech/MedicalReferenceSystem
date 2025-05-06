import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TestMappingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  csvHeaders: string[];
  csvPreviewRows: string[][];
  onComplete: (mapping: Record<string, string>) => void;
  isDarkMode?: boolean;
}

const REQUIRED_FIELDS = ['name', 'category'];
const FIELD_OPTIONS = [
  { value: 'id', label: 'ID', description: 'Unique identifier for the test' },
  { value: 'name', label: 'Name', description: 'Full name of the test' },
  { value: 'category', label: 'Category', description: 'Main category (Laboratory Tests or Imaging Studies)' },
  { value: 'subCategory', label: 'Subcategory', description: 'Specialized subcategory' },
  { value: 'cptCode', label: 'CPT Code', description: 'Current Procedural Terminology code' },
  { value: 'loincCode', label: 'LOINC Code', description: 'Logical Observation Identifiers Names and Codes' },
  { value: 'snomedCode', label: 'SNOMED Code', description: 'SNOMED CT code for the test' },
  { value: 'description', label: 'Description', description: 'Detailed description of the test' },
  { value: 'notes', label: 'Notes', description: 'Additional notes or comments' }
];

export default function TestMappingWizard({
  isOpen,
  onClose,
  csvHeaders,
  csvPreviewRows,
  onComplete,
  isDarkMode = false
}: TestMappingWizardProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  // Initialize possible matches based on similar field names
  const initialMapping = () => {
    const result: Record<string, string> = {};
    
    // Try to match headers to our fields based on similarity
    csvHeaders.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      // Exact matches
      if (lowerHeader === 'id' || lowerHeader === 'test_id' || lowerHeader === 'testid') {
        result[header] = 'id';
      } 
      else if (lowerHeader === 'name' || lowerHeader === 'test_name' || lowerHeader === 'testname') {
        result[header] = 'name';
      } 
      else if (lowerHeader === 'category' || lowerHeader === 'test_category') {
        result[header] = 'category';
      }
      else if (lowerHeader === 'subcategory' || lowerHeader === 'sub_category' || lowerHeader === 'test_subcategory') {
        result[header] = 'subCategory';
      }
      else if (lowerHeader === 'cpt' || lowerHeader === 'cptcode' || lowerHeader === 'cpt_code') {
        result[header] = 'cptCode';
      }
      else if (lowerHeader === 'loinc' || lowerHeader === 'loinccode' || lowerHeader === 'loinc_code') {
        result[header] = 'loincCode';
      }
      else if (lowerHeader === 'snomed' || lowerHeader === 'snomedcode' || lowerHeader === 'snomed_code') {
        result[header] = 'snomedCode';
      }
      else if (lowerHeader === 'description' || lowerHeader === 'test_description') {
        result[header] = 'description';
      }
      else if (lowerHeader === 'notes' || lowerHeader === 'test_notes' || lowerHeader === 'comments') {
        result[header] = 'notes';
      }
      else {
        // No match
        result[header] = '';
      }
    });
    
    return result;
  };
  
  // Initialize mapping on first render
  useEffect(() => {
    setMapping(initialMapping());
  }, [csvHeaders]);
  
  // Handle field mapping change
  const handleMappingChange = (header: string, value: string) => {
    setMapping(prev => ({ ...prev, [header]: value }));
  };
  
  // Check if all required fields are mapped
  const isValidMapping = () => {
    return REQUIRED_FIELDS.every(field => 
      Object.values(mapping).includes(field)
    );
  };
  
  // Handle completion
  const handleComplete = () => {
    // Filter out empty mappings
    const finalMapping = Object.entries(mapping)
      .filter(([_, value]) => value !== '')
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, string>);
    
    onComplete(finalMapping);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl ${isDarkMode ? 'bg-gray-800 text-white' : ''}`}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? 'text-white' : ''}>
            Map CSV Columns to Test Fields
          </DialogTitle>
          <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Match your CSV columns to the corresponding test fields.
            Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className={`rounded-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4 max-h-96 overflow-auto`}>
            <Table>
              <TableHeader className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                <TableRow>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>CSV Column</TableHead>
                  <TableHead className="w-6"></TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Test Field</TableHead>
                  <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Sample Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvHeaders.map((header, index) => (
                  <TableRow key={header} className={isDarkMode ? 'border-gray-700' : 'border-gray-200'}>
                    <TableCell className={isDarkMode ? 'font-medium text-white' : 'font-medium'}>
                      {header}
                    </TableCell>
                    <TableCell>
                      <ArrowRight className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={mapping[header] || ''} 
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger className={`w-[180px] ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                            <SelectItem value="">Ignore this column</SelectItem>
                            {FIELD_OPTIONS.map(option => (
                              <SelectItem 
                                key={option.value} 
                                value={option.value}
                                className={REQUIRED_FIELDS.includes(option.value) ? 'font-semibold' : ''}
                              >
                                {option.label}{REQUIRED_FIELDS.includes(option.value) ? ' *' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <HelpCircle className="h-4 w-4" />
                                <span className="sr-only">Field description</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              {mapping[header] 
                                ? FIELD_OPTIONS.find(opt => opt.value === mapping[header])?.description 
                                : 'This column will not be imported.'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      {csvPreviewRows.length > 0 ? csvPreviewRows[0][index] : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Preview section */}
          <div>
            <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Data Preview (showing up to 5 rows)
            </Label>
            <div className={`mt-2 rounded-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-2 max-h-40 overflow-auto`}>
              <Table>
                <TableHeader className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                  <TableRow>
                    {csvHeaders.map(header => (
                      <TableHead 
                        key={header} 
                        className={isDarkMode ? 'text-gray-300 text-xs' : 'text-gray-700 text-xs'}
                      >
                        {header} {mapping[header] ? `→ ${mapping[header]}` : ''}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvPreviewRows.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className={isDarkMode ? 'border-gray-700' : 'border-gray-200'}>
                      {row.map((cell, cellIndex) => (
                        <TableCell 
                          key={cellIndex} 
                          className={`py-1 px-2 text-xs truncate max-w-[200px] ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                        >
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <div className="flex-1 text-sm text-red-500">
            {!isValidMapping() && 'Please map all required fields (marked with *).'}
          </div>
          <Button variant="outline" onClick={onClose} className={isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : ''}>
            Cancel
          </Button>
          <Button 
            onClick={handleComplete} 
            disabled={!isValidMapping()}
            className={isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
          >
            Complete Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}