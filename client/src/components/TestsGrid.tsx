import { Test } from "@/types";
import TestCard from "./TestCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TestsGridProps {
  tests: Test[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onTestSelect: (test: Test) => void;
}

export default function TestsGrid({ tests, isLoading, isError, onTestSelect }: TestsGridProps) {
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, index) => (
            <div key={index} className="bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-700 flex flex-col">
              <div className="px-4 py-5 sm:px-6 flex justify-between">
                <Skeleton className="h-6 w-3/4 bg-gray-700" />
                <Skeleton className="h-6 w-6 rounded-full bg-gray-700" />
              </div>
              <div className="border-t border-gray-700 px-4 py-4 sm:px-6">
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-5 w-20 rounded-full bg-gray-700" />
                  <Skeleton className="h-5 w-32 rounded-full bg-gray-700" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-16 mb-2 bg-gray-700" />
                    <Skeleton className="h-5 w-12 bg-gray-700" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-16 mb-2 bg-gray-700" />
                    <Skeleton className="h-5 w-20 bg-gray-700" />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-700 px-4 py-3">
                <Skeleton className="h-4 w-full mb-1 bg-gray-700" />
                <Skeleton className="h-4 w-2/3 bg-gray-700" />
              </div>
              <div className="border-t border-gray-700 px-4 py-4 sm:px-6 flex justify-end">
                <Skeleton className="h-8 w-24 rounded-md bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="flex-1">
        <Alert variant="destructive" className="bg-red-900 border-red-800 text-white">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-white">Error</AlertTitle>
          <AlertDescription className="text-gray-200">
            Failed to load test data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render empty state
  if (!tests || tests.length === 0) {
    return (
      <div className="flex-1">
        <Alert className="bg-gray-800 border-gray-700 text-white">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertTitle className="text-white">No results found</AlertTitle>
          <AlertDescription className="text-gray-300">
            Try adjusting your search or filters to find what you're looking for.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render tests grid
  return (
    <div className="flex-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <TestCard 
            key={test.id} 
            test={test} 
            onSelect={onTestSelect} 
          />
        ))}
      </div>
    </div>
  );
}
