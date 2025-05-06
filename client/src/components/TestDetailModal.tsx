
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Test } from "@/types";
import { X, Edit, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestDetailModalProps {
  test: Test;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (test: Test) => void;
  isDarkMode?: boolean;
}

export default function TestDetailModal({ 
  test, 
  isOpen, 
  onClose,
  onEdit,
  isDarkMode = true 
}: TestDetailModalProps) {
  if (!isOpen || !test) return null;

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

  const showLoinc = category === "Laboratory Tests";
  const showSnomed = category === "Imaging Studies";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(
        "sm:max-w-4xl border-gray-700 text-white",
        isDarkMode ? "bg-gradient-to-b from-gray-800 to-gray-900" : "bg-white"
      )}>
        <DialogHeader className="flex justify-between items-center gap-4">
          <div className="flex-1">
            <DialogTitle className="text-xl font-semibold text-white">
              {name}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {category}
              </Badge>
              <Badge className="bg-gray-700/40 text-gray-300 border border-gray-600/30">
                {subCategory}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(test)}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-4">Test Information</h4>

          <Separator className="bg-gray-700/50" />

          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
            <p className="text-gray-200">{description}</p>
          </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Reference ID</span>
                  <code className="px-2 py-1 rounded bg-gray-800 text-blue-400 text-sm">
                    {id}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">CPT Code</span>
                  <code className="px-2 py-1 rounded bg-gray-800 text-emerald-400 text-sm">
                    {cptCode || 'N/A'}
                  </code>
                </div>
                {showLoinc && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-400">LOINC Code (Primary)</span>
                    <code className="px-2 py-1 rounded bg-blue-900/30 text-blue-400 text-sm border border-blue-800/30">
                      {loincCode || 'N/A'}
                    </code>
                  </div>
                )}
                {showSnomed && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-400">SNOMED Code (Primary)</span>
                    <code className="px-2 py-1 rounded bg-blue-900/30 text-blue-400 text-sm border border-blue-800/30">
                      {snomedCode || 'N/A'}
                    </code>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-4">Related Resources</h4>
              <div className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  Clinical Guidelines
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <Button 
                  variant="ghost"
                  className="w-full justify-between text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  Medicare Coverage
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <Button 
                  variant="ghost"
                  className="w-full justify-between text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  Test Specifications
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {notes && (
            <>
              <Separator className="bg-gray-700/50" />
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-4">Additional Notes</h4>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-300">{notes}</p>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 text-xs text-gray-500">
            Note: This information is provided for reference purposes only and should be verified with the latest medical coding guidelines.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
