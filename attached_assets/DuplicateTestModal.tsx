import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { TestWithNotes } from '../db/db';

interface DuplicateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicatesById: TestWithNotes[];
  duplicatesByCptCode: TestWithNotes[];
  onSkipAll: () => void;
  onUpdateAll: () => void;
  onDecideEach: () => void;
  isDarkMode: boolean;
}

const DuplicateTestModal: React.FC<DuplicateTestModalProps> = ({
  isOpen,
  onClose,
  duplicatesById,
  duplicatesByCptCode,
  onSkipAll,
  onUpdateAll,
  onDecideEach,
  isDarkMode
}) => {
  if (!isOpen) return null;

  const modalBgClass = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const modalTextClass = isDarkMode ? 'text-white' : 'text-gray-800';
  const headerClass = isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800';
  const buttonHoverClass = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const primaryButtonClass = isDarkMode 
    ? 'bg-blue-800 hover:bg-blue-700 text-white' 
    : 'bg-blue-500 hover:bg-blue-600 text-white';
  const secondaryButtonClass = isDarkMode 
    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  const dangerButtonClass = isDarkMode 
    ? 'bg-red-800 hover:bg-red-700 text-white' 
    : 'bg-red-500 hover:bg-red-600 text-white';
  const testItemClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const tableBorderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  const totalDuplicates = duplicatesById.length + duplicatesByCptCode.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`relative max-w-3xl w-full max-h-[80vh] overflow-y-auto rounded-lg shadow-xl ${modalBgClass}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-t-lg ${headerClass}`}>
          <div className="flex items-center">
            <AlertTriangle className="mr-2 text-yellow-500" size={20} />
            <h3 className="text-lg font-semibold">Duplicate Tests Detected</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${buttonHoverClass}`}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={`p-4 ${modalTextClass}`}>
          <p className="mb-4">
            Found {totalDuplicates} potential duplicate tests in your import file:
            <span className="block mt-2">
              • {duplicatesById.length} tests with IDs that already exist in the database
            </span>
            <span className="block">
              • {duplicatesByCptCode.length} tests with CPT codes that match existing tests
            </span>
          </p>

          <p className="mb-4 font-semibold">How would you like to handle these duplicates?</p>

          <div className="flex flex-wrap gap-3 mb-6">
            <button 
              onClick={onSkipAll} 
              className={`px-4 py-2 rounded-md ${secondaryButtonClass}`}
            >
              Skip All Duplicates
            </button>
            <button 
              onClick={onUpdateAll} 
              className={`px-4 py-2 rounded-md ${primaryButtonClass}`}
            >
              Update All Duplicates
            </button>
            <button 
              onClick={onDecideEach} 
              className={`px-4 py-2 rounded-md ${dangerButtonClass}`}
            >
              Decide For Each
            </button>
          </div>

          {duplicatesById.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Duplicate IDs:</h4>
              <div className={`border ${tableBorderClass} rounded-md overflow-hidden max-h-40 overflow-y-auto`}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={`${headerClass}`}>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">CPT Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {duplicatesById.map((test, index) => (
                      <tr key={`id-${index}`} className={`${testItemClass}`}>
                        <td className="px-3 py-2 text-sm font-mono">{test.id}</td>
                        <td className="px-3 py-2 text-sm">{test.name}</td>
                        <td className="px-3 py-2 text-sm font-mono">{test.cptCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {duplicatesByCptCode.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Duplicate CPT Codes:</h4>
              <div className={`border ${tableBorderClass} rounded-md overflow-hidden max-h-40 overflow-y-auto`}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={`${headerClass}`}>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Import ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Import Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">CPT Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Existing ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {duplicatesByCptCode.map((test, index) => (
                      <tr key={`cpt-${index}`} className={`${testItemClass}`}>
                        <td className="px-3 py-2 text-sm font-mono">{test.id}</td>
                        <td className="px-3 py-2 text-sm">{test.name}</td>
                        <td className="px-3 py-2 text-sm font-mono">{test.cptCode}</td>
                        <td className="px-3 py-2 text-sm font-mono">{test.existingTest?.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-4 py-3 border-t ${tableBorderClass}`}>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-md ${secondaryButtonClass}`}
            >
              Cancel Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateTestModal;