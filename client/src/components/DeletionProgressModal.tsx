import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DeletionStatus {
  state: 'idle' | 'deleting' | 'complete' | 'error';
  processed: number;
  total: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  currentTestName?: string;
}

interface DeletionProgressModalProps {
  isOpen: boolean;
  status: DeletionStatus;
  isDarkMode?: boolean;
  onClose?: () => void;
}

export default function DeletionProgressModal({ 
  isOpen, 
  status, 
  isDarkMode = false,
  onClose
}: DeletionProgressModalProps) {
  // Calculate progress percentage
  const progressPercentage = status.total > 0 
    ? Math.round((status.processed / status.total) * 100) 
    : 0;
  
  // Determine title and message based on state
  let title = "";
  let description = "";
  
  switch(status.state) {
    case 'deleting':
      title = "Deleting Tests";
      description = status.currentTestName 
        ? `Deleting "${status.currentTestName}" (${status.processed} of ${status.total})`
        : `Deleting ${status.processed} of ${status.total} tests...`;
      break;
    case 'complete':
      title = "Deletion Complete";
      description = `Successfully deleted ${status.successCount} test${status.successCount !== 1 ? 's' : ''}.${status.errorCount > 0 ? ` Failed to delete ${status.errorCount} test${status.errorCount !== 1 ? 's' : ''}.` : ''}`;
      break;
    case 'error':
      title = "Deletion Error";
      description = "An error occurred during the deletion process.";
      break;
    default:
      title = "Preparing Deletion";
      description = "Getting ready to delete your tests...";
  }
  
  const canClose = status.state === 'complete' || status.state === 'error';
  
  return (
    <Dialog open={isOpen} onOpenChange={canClose ? onClose : undefined}>
      <DialogContent 
        className={`max-w-md ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white'}`}
      >
        <DialogHeader>
          <DialogTitle className={`text-xl flex items-center gap-2 ${isDarkMode ? 'text-white' : ''}`}>
            <Trash2 className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
          <DialogDescription className={isDarkMode ? 'text-gray-400' : ''}>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          {/* Status Icon */}
          <div className="flex justify-center">
            {status.state === 'complete' && status.errorCount === 0 && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {status.state === 'complete' && status.errorCount > 0 && (
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
            )}
            {status.state === 'error' && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
            {status.state === 'deleting' && (
              <Loader2 className="h-12 w-12 text-red-500 animate-spin" />
            )}
            {status.state === 'idle' && (
              <Trash2 className="h-12 w-12 text-gray-400" />
            )}
          </div>
          
          {/* Progress Bar */}
          {status.state === 'deleting' && (
            <div className="space-y-2">
              <Progress 
                value={progressPercentage} 
                className={isDarkMode 
                  ? "h-2 bg-gray-700" 
                  : "h-2"
                } 
              />
              <p className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {progressPercentage}% complete
              </p>
            </div>
          )}
          
          {/* Stats */}
          {(status.state === 'deleting' || status.state === 'complete') && status.total > 0 && (
            <div className={`text-center text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div>Total: {status.total}</div>
              <div>Processed: {status.processed}</div>
              {status.successCount > 0 && (
                <div className="text-green-600 dark:text-green-400">
                  Successfully deleted: {status.successCount}
                </div>
              )}
              {status.errorCount > 0 && (
                <div className="text-red-600 dark:text-red-400">
                  Failed: {status.errorCount}
                </div>
              )}
            </div>
          )}
          
          {/* Error Details */}
          {status.errors.length > 0 && (
            <div className={`text-xs p-3 rounded border ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-800 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Error Details:
              </p>
              <ul className="text-xs space-y-1 list-disc pl-5">
                {status.errors.slice(0, 5).map((error, index) => (
                  <li key={index} className={isDarkMode ? 'text-red-400' : 'text-red-600'}>
                    {error}
                  </li>
                ))}
                {status.errors.length > 5 && (
                  <li className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {status.errors.length - 5} more errors...
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
        
        {/* Close Button */}
        {canClose && onClose && (
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              variant={status.errorCount > 0 ? "destructive" : "default"}
              className={isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : ""}
            >
              {status.errorCount > 0 ? "Close" : "Done"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}