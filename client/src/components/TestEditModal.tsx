import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Test } from "@shared/schema";
import { X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { VALID_CATEGORIES, VALID_SUBCATEGORIES } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Form schema for editing a test
const editTestSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  category: z.string(),
  subCategory: z.string(),
  cptCode: z.string().optional().nullable(),
  loincCode: z.string().optional().nullable(),
  snomedCode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type EditTestValues = z.infer<typeof editTestSchema>;

interface TestEditModalProps {
  test: Test;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTest: Test) => void;
  isDarkMode?: boolean;
}

// Category to prefix mapping for test ID preview
const CATEGORY_PREFIXES: Record<string, string> = {
  'Laboratory Tests': 'LAB',
  'Imaging Studies': 'IMG',
  'Cardiovascular Tests': 'CVS',
  'Neurological Tests': 'NEU',
  'Pulmonary Tests': 'PUL',
  'Gastrointestinal Tests': 'GAS',
  'Specialty-Specific Tests': 'SPC',
  'Functional Tests': 'FNC',
};

// Subcategory to prefix mapping for test ID preview
const SUBCATEGORY_PREFIXES: Record<string, Record<string, string>> = {
  'Laboratory Tests': {
    'Clinical Chemistry': 'CHE',
    'Hematology': 'HEM',
    'Immunology/Serology': 'IMM',
    'Molecular Diagnostics': 'MOL',
    'Microbiology': 'MIC',
    'Toxicology': 'TOX',
    'Urinalysis': 'URI',
    'Endocrinology': 'END',
    'Genetic Testing': 'GEN',
    'Tumor Markers': 'TUM',
  },
  'Imaging Studies': {
    'Radiography (X-rays)': 'XRA',
    'Computed Tomography (CT)': 'CT',
    'Magnetic Resonance Imaging (MRI)': 'MRI',
    'Ultrasound': 'ULT',
    'Nuclear Medicine': 'NUC',
    'Positron Emission Tomography (PET)': 'PET',
    'Fluoroscopy': 'FLU',
    'Mammography': 'MAM',
    'Bone Densitometry': 'BON',
  },
  'Cardiovascular Tests': {
    'Electrocardiography': 'ECG',
    'Echocardiography': 'ECH',
    'Stress Testing': 'STR',
    'Cardiac Catheterization': 'CAT',
    'Electrophysiology Studies': 'EPS',
    'Vascular Studies': 'VAS',
  },
  'Neurological Tests': {
    'Electroencephalography (EEG)': 'EEG',
    'Electromyography (EMG)': 'EMG',
    'Nerve Conduction Studies': 'NCS',
    'Evoked Potentials': 'EVO',
    'Sleep Studies': 'SLP',
  },
  'Pulmonary Tests': {
    'Pulmonary Function Tests': 'PFT',
    'Bronchoscopy': 'BRO',
    'Arterial Blood Gas Analysis': 'ABG',
  },
  'Gastrointestinal Tests': {
    'Endoscopic Procedures': 'END',
    'Manometry': 'MAN',
    'Breath Tests': 'BRT',
  },
  'Specialty-Specific Tests': {
    'Gynecological': 'GYN',
    'Urological': 'URO',
    'Orthopedic': 'ORT',
    'Ophthalmological': 'OPH',
    'Dermatological': 'DER',
    'Pediatric': 'PED',
  },
  'Functional Tests': {
    'Balance and Mobility': 'BAL',
    'Cognitive Function': 'COG',
    'Exercise Tolerance': 'EXE',
    'Speech and Language': 'SPC',
    'Swallowing': 'SWA',
  },
};

export default function TestEditModal({
  test,
  isOpen,
  onClose,
  onSave,
  isDarkMode = true,
}: TestEditModalProps) {
  // State for the test ID preview
  const [testIdPreview, setTestIdPreview] = useState<string>(test.id || "TTES-???-???-#####");
  
  const form = useForm<EditTestValues>({
    resolver: zodResolver(editTestSchema),
    defaultValues: {
      name: test.name,
      category: test.category,
      subCategory: test.subCategory,
      cptCode: test.cptCode || "",
      loincCode: test.loincCode || "",
      snomedCode: test.snomedCode || "",
      description: test.description || "",
      notes: test.notes || "",
    },
  });

  // Reset form values when test changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: test.name,
        category: test.category,
        subCategory: test.subCategory,
        cptCode: test.cptCode || "",
        loincCode: test.loincCode || "",
        snomedCode: test.snomedCode || "",
        description: test.description || "",
        notes: test.notes || "",
      });
      setTestIdPreview(test.id);
    }
  }, [test, isOpen, form]);
  
  // Update the test ID preview whenever category, subcategory, or CPT code changes
  useEffect(() => {
    const category = form.watch("category");
    const subCategory = form.watch("subCategory");
    const cptCode = form.watch("cptCode");
    
    // Update the test ID preview
    let updatedPreview = "TTES";
    
    // Add category prefix
    if (category && CATEGORY_PREFIXES[category]) {
      updatedPreview += `-${CATEGORY_PREFIXES[category]}`;
    } else {
      updatedPreview += "-???";
    }
    
    // Add subcategory prefix
    if (category && subCategory && 
        SUBCATEGORY_PREFIXES[category] && 
        SUBCATEGORY_PREFIXES[category][subCategory]) {
      updatedPreview += `-${SUBCATEGORY_PREFIXES[category][subCategory]}`;
    } else {
      updatedPreview += "-???";
    }
    
    // Add CPT code or placeholder
    if (cptCode) {
      // Truncate CPT code if it's longer than 5 characters
      const cptCodeValue = cptCode.length > 5 ? cptCode.substring(0, 5) : cptCode;
      updatedPreview += `-${cptCodeValue}`;
    } else {
      updatedPreview += "-#####";
    }
    
    setTestIdPreview(updatedPreview);
  }, [form.watch("category"), form.watch("subCategory"), form.watch("cptCode"), form]);

  const { toast } = useToast();

  const onSubmit = async (data: EditTestValues) => {
    try {
      // Process any empty strings to null
      const formattedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? null : value,
        ])
      );
      
      // Include the ID from the preview if it has changed
      if (testIdPreview && testIdPreview !== test.id) {
        formattedData.id = testIdPreview;
      }

      // Send update to the server
      const response = await apiRequest(
        "PATCH",
        `/api/tests/${test.id}`,
        formattedData
      );
      
      // Parse the response JSON
      const responseData = await response.json();

      // Check if response is valid and contains the updated test
      if (responseData && responseData.success && responseData.test) {
        // Invalidate the cache to refresh the tests list
        queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
        
        // If the test has a category, also invalidate that category
        if (responseData.test.category) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/tests/category/${encodeURIComponent(responseData.test.category)}`] 
          });
        }
        
        // If the test has a subcategory, also invalidate that subcategory
        if (responseData.test.subCategory) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/tests/subcategory/${encodeURIComponent(responseData.test.subCategory)}`] 
          });
        }
        
        // Show success toast notification
        toast({
          title: "Test Updated",
          description: `The test "${responseData.test.name}" has been updated successfully.`,
        });
        
        onSave(responseData.test as Test);
        onClose();
      }
    } catch (error) {
      console.error("Failed to update test:", error);
      
      // Show error toast notification
      toast({
        title: "Update Failed",
        description: `Failed to update the test. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Always show both LOINC and SNOMED fields for all test types
  // This allows for comprehensive coding since many tests have both procedure codes (SNOMED)
  // and result codes (LOINC) for specific findings
  const showLoincField = true;
  const showSnomedField = true;

  // Get subcategories based on selected category
  const getSubcategoriesForCategory = (category: string) => {
    return VALID_SUBCATEGORIES[category] || [];
  };

  const selectedCategory = form.watch("category");
  const subcategories = getSubcategoriesForCategory(selectedCategory);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "sm:max-w-2xl border-gray-700 max-h-[70vh] sm:max-h-[75vh] md:max-h-[80vh] overflow-y-auto pr-1",
          isDarkMode
            ? "bg-gradient-to-b from-gray-800 to-gray-900 text-white"
            : "bg-white text-gray-900"
        )}
      >
        <DialogHeader className="flex justify-between items-center gap-4">
          <DialogTitle className="text-xl font-semibold">Edit Test</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto">
            {/* Test ID Preview */}
            <div className="bg-gray-800/80 p-3 rounded-md border border-gray-700 flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-blue-400" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white border-gray-700">
                    <p className="text-xs">Generated test ID based on Category, Subcategory, and CPT Code</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Test ID (generated automatically)</p>
                <Badge variant="outline" className="font-mono bg-blue-900/20 text-blue-400 border-blue-700/30">
                  {testIdPreview}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Test Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-gray-400">
                      Test Name*
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={cn(
                          "border-gray-700 bg-gray-800/50 text-white",
                          isDarkMode ? "placeholder:text-gray-500" : ""
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-gray-400">
                      Category*
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset subcategory when category changes
                        form.setValue("subCategory", "");
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={cn(
                            "border-gray-700 bg-gray-800/50 text-white",
                            isDarkMode ? "" : ""
                          )}
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        className={cn(
                          "border-gray-700",
                          isDarkMode
                            ? "bg-gray-800 text-white"
                            : "bg-white text-gray-900"
                        )}
                      >
                        {Object.keys(VALID_CATEGORIES).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Subcategory */}
              <FormField
                control={form.control}
                name="subCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-gray-400">
                      Subcategory*
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={cn(
                            "border-gray-700 bg-gray-800/50 text-white",
                            isDarkMode ? "" : ""
                          )}
                        >
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        className={cn(
                          "border-gray-700",
                          isDarkMode
                            ? "bg-gray-800 text-white"
                            : "bg-white text-gray-900"
                        )}
                      >
                        {subcategories.map((subcategory: string) => (
                          <SelectItem key={subcategory} value={subcategory}>
                            {subcategory}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CPT Code */}
              <FormField
                control={form.control}
                name="cptCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-gray-400">
                      CPT Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className={cn(
                          "border-gray-700 bg-gray-800/50 text-white",
                          isDarkMode ? "placeholder:text-gray-500" : ""
                        )}
                        placeholder="e.g., 70100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* LOINC Code - now shown for all test types */}
              {showLoincField && (
                <FormField
                  control={form.control}
                  name="loincCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-400">
                        LOINC Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          className={cn(
                            "border-gray-700 bg-gray-800/50 text-white",
                            isDarkMode ? "placeholder:text-gray-500" : ""
                          )}
                          placeholder="e.g., 12345-6"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* SNOMED Code - now shown for all test types */}
              {showSnomedField && (
                <FormField
                  control={form.control}
                  name="snomedCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-400">
                        SNOMED Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          className={cn(
                            "border-gray-700 bg-gray-800/50 text-white",
                            isDarkMode ? "placeholder:text-gray-500" : ""
                          )}
                          placeholder="e.g., 123456789"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-400">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      className={cn(
                        "min-h-24 border-gray-700 bg-gray-800/50 text-white",
                        isDarkMode ? "placeholder:text-gray-500" : ""
                      )}
                      placeholder="Enter test description..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-400">
                    Additional Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      className={cn(
                        "min-h-24 border-gray-700 bg-gray-800/50 text-white",
                        isDarkMode ? "placeholder:text-gray-500" : ""
                      )}
                      placeholder="Enter additional notes about this test..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="sticky bottom-0 pt-4 bg-inherit mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className={cn(
                  "border-gray-600",
                  isDarkMode
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : ""
                )}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}