import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Test } from "@shared/schema";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { VALID_CATEGORIES, VALID_SUBCATEGORIES } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema for adding a new test
const addTestSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().min(1, "Subcategory is required"),
  cptCode: z.string().optional().nullable(),
  loincCode: z.string().optional().nullable(),
  snomedCode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type AddTestValues = z.infer<typeof addTestSchema>;

interface TestAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTest: Test) => void;
  isDarkMode?: boolean;
}

export default function TestAddModal({
  isOpen,
  onClose,
  onSuccess,
  isDarkMode = true,
}: TestAddModalProps) {
  const form = useForm<AddTestValues>({
    resolver: zodResolver(addTestSchema),
    defaultValues: {
      name: "",
      category: "",
      subCategory: "",
      cptCode: "",
      loincCode: "",
      snomedCode: "",
      description: "",
      notes: "",
    },
  });

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        category: "",
        subCategory: "",
        cptCode: "",
        loincCode: "",
        snomedCode: "",
        description: "",
        notes: "",
      });
    }
  }, [isOpen, form]);

  const { toast } = useToast();

  const onSubmit = async (data: AddTestValues) => {
    try {
      // Process any empty strings to null
      const formattedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? null : value,
        ])
      );

      // Send create request to the server
      const response = await apiRequest(
        "POST",
        `/api/tests`, // POST to create a new test
        formattedData
      );
      
      // Parse the response JSON
      const responseData = await response.json();

      // Check if response is valid and contains the created test
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
        
        // Invalidate category counts
        queryClient.invalidateQueries({ queryKey: ['/api/test-count-by-category'] });
        queryClient.invalidateQueries({ queryKey: ['/api/test-count-by-subcategory'] });
        
        // Show success toast notification
        toast({
          title: "Test Created",
          description: `The test "${responseData.test.name}" has been created successfully.`,
        });
        
        onSuccess(responseData.test as Test);
        onClose();
      }
    } catch (error) {
      console.error("Failed to create test:", error);
      
      // Show error toast notification
      toast({
        title: "Creation Failed",
        description: `Failed to create the test. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Determine which code fields to show based on category
  const showLoincField = form.watch("category") === "Laboratory Tests";
  const showSnomedField = form.watch("category") === "Imaging Studies";

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
          "sm:max-w-2xl border-gray-700",
          isDarkMode
            ? "bg-gradient-to-b from-gray-800 to-gray-900 text-white"
            : "bg-white text-gray-900"
        )}
      >
        <DialogHeader className="flex justify-between items-center gap-4">
          <DialogTitle className="text-xl font-semibold">Add New Test</DialogTitle>
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        placeholder="Enter test name"
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

              {/* Subcategory - Only enabled when a category is selected */}
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
                      disabled={!selectedCategory}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={cn(
                            "border-gray-700 bg-gray-800/50 text-white",
                            isDarkMode ? "" : "",
                            !selectedCategory ? "opacity-50 cursor-not-allowed" : ""
                          )}
                        >
                          <SelectValue placeholder={selectedCategory ? "Select subcategory" : "First select a category"} />
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

              {/* LOINC Code - conditionally shown for Laboratory Tests */}
              {showLoincField && (
                <FormField
                  control={form.control}
                  name="loincCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-blue-400">
                        LOINC Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          className={cn(
                            "border-blue-700/30 bg-blue-900/20 text-blue-400",
                            isDarkMode ? "placeholder:text-blue-600/50" : ""
                          )}
                          placeholder="e.g., 12345-6"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* SNOMED Code - conditionally shown for Imaging Studies */}
              {showSnomedField && (
                <FormField
                  control={form.control}
                  name="snomedCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-blue-400">
                        SNOMED Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          className={cn(
                            "border-blue-700/30 bg-blue-900/20 text-blue-400",
                            isDarkMode ? "placeholder:text-blue-600/50" : ""
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

            <DialogFooter>
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
                Create Test
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}