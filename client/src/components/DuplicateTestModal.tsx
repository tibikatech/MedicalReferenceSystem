import React from 'react';
import { Test } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from 'lucide-react';

interface DuplicateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicatesById: Test[];
  duplicatesByCptCode: Test[];
  onSkipAll: () => void;
  onUpdateAll: () => void;
  onDecideEach: () => void;
  isDarkMode?: boolean;
}

export default function DuplicateTestModal({
  isOpen,
  onClose,
  duplicatesById,
  duplicatesByCptCode,
  onSkipAll,
  onUpdateAll,
  onDecideEach,
  isDarkMode = false
}: DuplicateTestModalProps) {
  const totalDuplicates = duplicatesById.length + duplicatesByCptCode.length;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-3xl ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}
      >
        <DialogHeader>
          <DialogTitle className={`text-xl ${isDarkMode ? 'text-white' : ''}`}>
            Duplicate Tests Detected
          </DialogTitle>
          <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Found {totalDuplicates} duplicate tests in your import. Please choose how to handle these duplicates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Alert className={isDarkMode ? 'bg-yellow-900/30 border-yellow-600' : 'bg-yellow-50 border-yellow-200'}>
            <AlertCircle className={`h-4 w-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <AlertTitle className={isDarkMode ? 'text-yellow-400' : 'text-yellow-800'}>
              Warning
            </AlertTitle>
            <AlertDescription className={isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}>
              Updating all duplicates will overwrite existing tests with the same ID or CPT code.
              Skipping duplicates will ignore tests that match existing IDs or CPT codes.
            </AlertDescription>
          </Alert>
        </div>

        <Tabs defaultValue="by-id" className="w-full">
          <TabsList className={isDarkMode ? 'bg-gray-800' : ''}>
            <TabsTrigger 
              value="by-id"
              className={isDarkMode ? 'data-[state=active]:bg-gray-700 text-white' : ''}
            >
              Duplicates by ID ({duplicatesById.length})
            </TabsTrigger>
            <TabsTrigger 
              value="by-cpt"
              className={isDarkMode ? 'data-[state=active]:bg-gray-700 text-white' : ''}
            >
              Duplicates by CPT Code ({duplicatesByCptCode.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="by-id" className="mt-4">
            {duplicatesById.length === 0 ? (
              <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No duplicates by ID found.
              </p>
            ) : (
              <div className={`overflow-auto max-h-60 rounded-md p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                {duplicatesById.map(test => (
                  <div 
                    key={test.id} 
                    className={`mb-3 p-3 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{test.name}</h3>
                      <Badge className={isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'}>
                        Duplicate ID
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>ID:</div>
                      <div>{test.id}</div>
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Category:</div>
                      <div>{test.category}</div>
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>CPT Code:</div>
                      <div>{test.cptCode || "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="by-cpt" className="mt-4">
            {duplicatesByCptCode.length === 0 ? (
              <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No duplicates by CPT code found.
              </p>
            ) : (
              <div className={`overflow-auto max-h-60 rounded-md p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                {duplicatesByCptCode.map(test => (
                  <div 
                    key={test.id} 
                    className={`mb-3 p-3 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{test.name}</h3>
                      <Badge className={isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}>
                        Duplicate CPT
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>ID:</div>
                      <div>{test.id}</div>
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Category:</div>
                      <div>{test.category}</div>
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>CPT Code:</div>
                      <div>{test.cptCode || "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
          <Button
            variant="outline"
            className={`${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : ''}`}
            onClick={onSkipAll}
          >
            Skip All Duplicates
          </Button>
          <Button
            variant="outline"
            className={`${isDarkMode ? 'bg-yellow-800 text-white hover:bg-yellow-700' : ''}`}
            onClick={onDecideEach}
          >
            Decide Each Individually
          </Button>
          <Button
            variant="default"
            className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
            onClick={onUpdateAll}
          >
            Update All Duplicates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}