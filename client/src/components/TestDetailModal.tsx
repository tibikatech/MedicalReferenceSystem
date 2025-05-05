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
      <DialogContent className="dialog sm:max-w-4xl">
        <DialogHeader className="dialog-header flex justify-between items-center">
          <DialogTitle className="dialog-title text-xl">{name}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="dialog-close absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        
        <div className="mb-4">
          <div className="test-categories flex gap-2 mb-4">
            <Badge className={`category-tag ${getCategoryBadgeClass(category)}`}>
              {category}
            </Badge>
            <Badge className={`category-tag ${getSubcategoryBadgeClass(subCategory)}`}>
              {subCategory}
            </Badge>
          </div>
          
          <DialogDescription className="text-neutral-600 mb-5 dark:text-neutral-300">
            {description}
          </DialogDescription>
        </div>
        
        <Separator />
        
        <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-neutral-500 mb-2 dark:text-neutral-400">
              Test Information
            </h4>
            <table className="min-w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-sm text-neutral-500 dark:text-neutral-400">Test ID</td>
                  <td className="py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">{id}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-neutral-500 dark:text-neutral-400">CPT Code</td>
                  <td className="py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {formatValue(cptCode)}
                  </td>
                </tr>
                <tr>
                  <td className={`py-2 text-sm ${category === 'Imaging Studies' ? 'font-semibold text-primary-700 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    SNOMED Code {category === 'Imaging Studies' && '(Primary)'}
                  </td>
                  <td className={`py-2 text-sm ${category === 'Imaging Studies' ? 'font-semibold text-primary-700 dark:text-primary-400' : 'font-medium text-neutral-900 dark:text-neutral-100'}`}>
                    {formatValue(snomedCode)}
                  </td>
                </tr>
                <tr>
                  <td className={`py-2 text-sm ${category === 'Laboratory Tests' ? 'font-semibold text-primary-700 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    LOINC Code {category === 'Laboratory Tests' && '(Primary)'}
                  </td>
                  <td className={`py-2 text-sm ${category === 'Laboratory Tests' ? 'font-semibold text-primary-700 dark:text-primary-400' : 'font-medium text-neutral-900 dark:text-neutral-100'}`}>
                    {formatValue(loincCode)}
                  </td>
                </tr>
                {/* For other test categories, we might have other specialized codes in the future */}
                {['Cardiovascular Tests', 'Neurological Tests', 'Pulmonary Tests', 'Gastrointestinal Tests', 'Specialty-Specific Tests', 'Functional Tests'].includes(category) && (
                  <tr>
                    <td className="py-2 text-sm font-semibold text-primary-700 dark:text-primary-400">
                      Specialty Code (Primary)
                    </td>
                    <td className="py-2 text-sm font-semibold text-primary-700 dark:text-primary-400">
                      {formatValue(cptCode || snomedCode || loincCode)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-neutral-500 mb-2 dark:text-neutral-400">
              Related Tests
            </h4>
            <ul className="space-y-3">
              <li className="bg-neutral-50 px-4 py-3 rounded-lg dark:bg-neutral-700">
                <a href="#" className="block hover:text-primary-600 text-sm font-medium dark:hover:text-primary-400">
                  {subCategory === "Computed Tomography (CT)" 
                    ? "Non-contrast CT of the Chest" 
                    : "Complete Blood Count (CBC)"}
                </a>
              </li>
              <li className="bg-neutral-50 px-4 py-3 rounded-lg dark:bg-neutral-700">
                <a href="#" className="block hover:text-primary-600 text-sm font-medium dark:hover:text-primary-400">
                  {subCategory === "Computed Tomography (CT)" 
                    ? "Contrast-enhanced CT of the Chest" 
                    : "Basic Metabolic Panel (BMP)"}
                </a>
              </li>
              <li className="bg-neutral-50 px-4 py-3 rounded-lg dark:bg-neutral-700">
                <a href="#" className="block hover:text-primary-600 text-sm font-medium dark:hover:text-primary-400">
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
            <Separator />
            <div className="pt-6">
              <h4 className="text-sm font-medium text-neutral-500 mb-4 dark:text-neutral-400">
                Additional Information
              </h4>
              <div className="bg-neutral-50 p-4 rounded-lg text-sm text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                <p>{notes}</p>
              </div>
            </div>
          </>
        )}
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} className="btn">
            Close
          </Button>
          <Button className="hero-btn">
            Add to Bookmarks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
