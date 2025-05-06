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
import { apiRequest } from "@/lib/queryClient";

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

export default function TestEditModal({
  test,
  isOpen,
  onClose,
  onSave,
  isDarkMode = true,
}: TestEditModalProps) {
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
    }
  }, [test, isOpen, form]);

  const onSubmit = async (data: EditTestValues) => {
    try {
      // Process any empty strings to null
      const formattedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? null : value,
        ])
      );

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
        onSave(responseData.test as Test);
        onClose();
      }
    } catch (error) {
      console.error("Failed to update test:", error);
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
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}