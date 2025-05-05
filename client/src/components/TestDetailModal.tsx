import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCategoryBadgeClass, getSubcategoryBadgeClass, formatValue } from "@/lib/utils";
import { Test } from "@/types";
import { X } from "lucide-react";

interface TestDetailModalProps {
  test: Test;
  isOpen: boolean;
  onClose: () => void;
}

export default function TestDetailModal({ test, isOpen, onClose }: TestDetailModalProps) {
  const {
    id,
    name,
    category,
    subCategory,
    cptCode,
    loincCode,
    snomedCode,
    description,
    notes,
  } = test;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl bg-gray-800 border-gray-700 text-white">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl text-white">{name}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm text-gray-400 hover:text-white focus:outline-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        
        <div className="mb-4">
          <div className="flex gap-2 mb-4">
            <Badge className="bg-blue-600 text-white px-3 py-1 text-xs font-medium rounded-full">
              {category}
            </Badge>
            <Badge className="bg-gray-700 text-white px-3 py-1 text-xs font-medium rounded-full">
              {subCategory}
            </Badge>
          </div>
          
          <DialogDescription className="text-gray-400 mb-5">
            {description}
          </DialogDescription>
        </div>
        
        <Separator className="bg-gray-700" />
        
        <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              Test Information
            </h4>
            <table className="min-w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-sm text-gray-400">Test ID</td>
                  <td className="py-2 text-sm text-white bg-gray-700 px-2 rounded">{id}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-400">CPT Code</td>
                  <td className="py-2 text-sm text-white bg-gray-700 px-2 rounded">
                    {formatValue(cptCode)}
                  </td>
                </tr>
                <tr>
                  <td className={`py-2 text-sm ${category === 'Imaging Studies' ? 'font-semibold text-blue-400' : 'text-gray-400'}`}>
                    SNOMED Code {category === 'Imaging Studies' && '(Primary)'}
                  </td>
                  <td className={`py-2 text-sm ${category === 'Imaging Studies' ? 'text-white bg-blue-800' : 'text-white bg-gray-700'} px-2 rounded`}>
                    {formatValue(snomedCode)}
                  </td>
                </tr>
                <tr>
                  <td className={`py-2 text-sm ${category === 'Laboratory Tests' ? 'font-semibold text-blue-400' : 'text-gray-400'}`}>
                    LOINC Code {category === 'Laboratory Tests' && '(Primary)'}
                  </td>
                  <td className={`py-2 text-sm ${category === 'Laboratory Tests' ? 'text-white bg-blue-800' : 'text-white bg-gray-700'} px-2 rounded`}>
                    {formatValue(loincCode)}
                  </td>
                </tr>
                {/* For other test categories, we might have other specialized codes in the future */}
                {['Cardiovascular Tests', 'Neurological Tests', 'Pulmonary Tests', 'Gastrointestinal Tests', 'Specialty-Specific Tests', 'Functional Tests'].includes(category) && (
                  <tr>
                    <td className="py-2 text-sm font-semibold text-blue-400">
                      Specialty Code (Primary)
                    </td>
                    <td className="py-2 text-sm text-white bg-blue-800 px-2 rounded">
                      {formatValue(cptCode || snomedCode || loincCode)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              Related Tests
            </h4>
            <ul className="space-y-3">
              <li className="bg-gray-700 px-4 py-3 rounded-lg">
                <a href="#" className="block hover:text-blue-400 text-sm font-medium text-white">
                  {subCategory === "Computed Tomography (CT)" 
                    ? "Non-contrast CT of the Chest" 
                    : "Complete Blood Count (CBC)"}
                </a>
              </li>
              <li className="bg-gray-700 px-4 py-3 rounded-lg">
                <a href="#" className="block hover:text-blue-400 text-sm font-medium text-white">
                  {subCategory === "Computed Tomography (CT)" 
                    ? "Contrast-enhanced CT of the Chest" 
                    : "Basic Metabolic Panel (BMP)"}
                </a>
              </li>
              <li className="bg-gray-700 px-4 py-3 rounded-lg">
                <a href="#" className="block hover:text-blue-400 text-sm font-medium text-white">
                  {subCategory === "Computed Tomography (CT)" 
                    ? "CT of the Lungs (HRCT)" 
                    : "Comprehensive Metabolic Panel (CMP)"}
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {notes && (
          <>
            <Separator className="bg-gray-700" />
            <div className="pt-6">
              <h4 className="text-sm font-medium text-gray-400 mb-4">
                Additional Information
              </h4>
              <div className="bg-gray-700 p-4 rounded-lg text-sm text-gray-300">
                <p>{notes}</p>
              </div>
            </div>
          </>
        )}
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">
            Close
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Add to Bookmarks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
