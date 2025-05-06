import React from 'react';
import { Test } from '@shared/schema';
import { AlertTriangle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

const DuplicateTestModal: React.FC<DuplicateTestModalProps> = ({
  isOpen,
  onClose,
  duplicatesById,
  duplicatesByCptCode,
  onSkipAll,
  onUpdateAll,
  onDecideEach,
  isDarkMode = true
}) => {
  const totalDuplicates = duplicatesById.length + duplicatesByCptCode.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-semibold">
            <AlertTriangle className="mr-2 text-yellow-500" size={20} />
            Duplicate Tests Detected
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            We found potential duplicates in your import file. Please choose how to proceed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <p className="mb-4">
            Found {totalDuplicates} potential duplicate tests in your import file:
            <span className="block mt-2 ml-4">
              • {duplicatesById.length} tests with IDs that already exist in the database
            </span>
            <span className="block ml-4">
              • {duplicatesByCptCode.length} tests with CPT codes that match existing tests
            </span>
          </p>

          <p className="mb-4 font-semibold">How would you like to handle these duplicates?</p>

          <div className="flex flex-wrap gap-3 mb-6">
            <Button 
              onClick={onSkipAll} 
              variant="outline"
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              Skip All Duplicates
            </Button>
            <Button 
              onClick={onUpdateAll} 
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Update All Duplicates
            </Button>
            <Button 
              onClick={onDecideEach}
              variant="destructive"
            >
              Decide For Each
            </Button>
          </div>

          {duplicatesById.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-yellow-400">ID Duplicates</h3>
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-2 text-left text-sm text-gray-400">ID</th>
                      <th className="px-4 py-2 text-left text-sm text-gray-400">Name</th>
                      <th className="px-4 py-2 text-left text-sm text-gray-400">Category</th>
                      <th className="px-4 py-2 text-left text-sm text-gray-400">CPT Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicatesById.slice(0, 5).map((test) => (
                      <tr key={test.id} className="border-b border-gray-700">
                        <td className="px-4 py-2 text-sm">{test.id}</td>
                        <td className="px-4 py-2 text-sm">{test.name}</td>
                        <td className="px-4 py-2 text-sm">
                          <Badge className="bg-blue-600">{test.category}</Badge>
                        </td>
                        <td className="px-4 py-2 text-sm font-mono">{test.cptCode || "—"}</td>
                      </tr>
                    ))}
                    {duplicatesById.length > 5 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-sm text-gray-500 text-center">
                          And {duplicatesById.length - 5} more duplicate IDs...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {duplicatesByCptCode.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 text-yellow-400">CPT Code Duplicates</h3>
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-2 text-left text-sm text-gray-400">ID</th>
                      <th className="px-4 py-2 text-left text-sm text-gray-400">Name</th>
                      <th className="px-4 py-2 text-left text-sm text-gray-400">Category</th>
                      <th className="px-4 py-2 text-left text-sm text-gray-400">CPT Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicatesByCptCode.slice(0, 5).map((test) => (
                      <tr key={test.id} className="border-b border-gray-700">
                        <td className="px-4 py-2 text-sm">{test.id}</td>
                        <td className="px-4 py-2 text-sm">{test.name}</td>
                        <td className="px-4 py-2 text-sm">
                          <Badge className="bg-blue-600">{test.category}</Badge>
                        </td>
                        <td className="px-4 py-2 text-sm font-mono">{test.cptCode}</td>
                      </tr>
                    ))}
                    {duplicatesByCptCode.length > 5 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-sm text-gray-500 text-center">
                          And {duplicatesByCptCode.length - 5} more duplicate CPT codes...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateTestModal;