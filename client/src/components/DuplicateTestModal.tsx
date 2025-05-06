import { Test } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl ${isDarkMode ? 'bg-gray-800 text-white' : ''}`}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? 'text-white' : ''}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Duplicate Tests Detected
            </div>
          </DialogTitle>
          <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
            {duplicatesById.length > 0 && (
              <span className="block">
                {duplicatesById.length} test(s) with duplicate IDs found.
              </span>
            )}
            {duplicatesByCptCode.length > 0 && (
              <span className="block">
                {duplicatesByCptCode.length} test(s) with duplicate CPT codes found.
              </span>
            )}
            Please choose how to handle these duplicates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {duplicatesById.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : ''}`}>
                Duplicate IDs
              </h3>
              <div className={`rounded-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-2 max-h-40 overflow-auto`}>
                <Table>
                  <TableHeader className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                    <TableRow>
                      <TableHead className={isDarkMode ? 'text-gray-300' : ''}>ID</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Name</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Category</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-300' : ''}>CPT Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicatesById.map((test) => (
                      <TableRow key={test.id} className={isDarkMode ? 'border-gray-700' : 'border-gray-200'}>
                        <TableCell className={isDarkMode ? 'font-medium text-white' : 'font-medium'}>
                          {test.id}
                        </TableCell>
                        <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                          {test.name}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${isDarkMode ? 'bg-gray-700 text-white' : ''}`}>
                            {test.category}
                          </Badge>
                        </TableCell>
                        <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                          {test.cptCode || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          {duplicatesByCptCode.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : ''}`}>
                Duplicate CPT Codes
              </h3>
              <div className={`rounded-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-2 max-h-40 overflow-auto`}>
                <Table>
                  <TableHeader className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                    <TableRow>
                      <TableHead className={isDarkMode ? 'text-gray-300' : ''}>ID</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Name</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Category</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-300' : ''}>CPT Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicatesByCptCode.map((test) => (
                      <TableRow key={test.id} className={isDarkMode ? 'border-gray-700' : 'border-gray-200'}>
                        <TableCell className={isDarkMode ? 'font-medium text-white' : 'font-medium'}>
                          {test.id}
                        </TableCell>
                        <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                          {test.name}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${isDarkMode ? 'bg-gray-700 text-white' : ''}`}>
                            {test.category}
                          </Badge>
                        </TableCell>
                        <TableCell className={isDarkMode ? 'text-gray-300' : ''}>
                          {test.cptCode || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          <div className={`p-4 rounded-md ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : ''}`}>
              How would you like to handle these duplicates?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-md border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex flex-col items-center text-center`}>
                <X className="h-8 w-8 text-red-500 mb-2" />
                <h4 className={`text-base font-semibold mb-2 ${isDarkMode ? 'text-white' : ''}`}>Skip All</h4>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Don't import any of the duplicate tests. Keep the existing ones in the database.
                </p>
                <Button 
                  variant="outline" 
                  className={`w-full ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : ''}`}
                  onClick={onSkipAll}
                >
                  Skip Duplicates
                </Button>
              </div>
              
              <div className={`p-4 rounded-md border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex flex-col items-center text-center`}>
                <Check className="h-8 w-8 text-green-500 mb-2" />
                <h4 className={`text-base font-semibold mb-2 ${isDarkMode ? 'text-white' : ''}`}>Update All</h4>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Replace all existing tests with the new versions being imported.
                </p>
                <Button 
                  variant="outline" 
                  className={`w-full ${isDarkMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                  onClick={onUpdateAll}
                >
                  Update All
                </Button>
              </div>
              
              <div className={`p-4 rounded-md border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex flex-col items-center text-center`}>
                <ArrowRight className="h-8 w-8 text-blue-500 mb-2" />
                <h4 className={`text-base font-semibold mb-2 ${isDarkMode ? 'text-white' : ''}`}>Decide Individually</h4>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Go through each duplicate and decide whether to skip or update.
                </p>
                <Button 
                  variant="outline" 
                  className={`w-full ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                  onClick={onDecideEach}
                >
                  Review Each
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className={isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : ''}
          >
            Cancel Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}