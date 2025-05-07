import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export interface UploadStatus {
  state: 'idle' | 'processing' | 'validating' | 'uploading' | 'complete' | 'error';
  processed: number;
  total: number;
  successCount: number;
  errorCount: number;
  errors: string[];
}

interface UploadProgressModalProps {
  isOpen: boolean;
  status: UploadStatus;
  isDarkMode?: boolean;
}

export default function UploadProgressModal({ 
  isOpen, 
  status, 
  isDarkMode = false 
}: UploadProgressModalProps) {
  // Calculate progress percentage
  const progressPercentage = status.total > 0 
    ? Math.round((status.processed / status.total) * 100) 
    : 0;
  
  // Determine title and message based on state
  let title = "";
  let description = "";
  
  switch(status.state) {
    case 'processing':
      title = "Processing CSV Data";
      description = "Analyzing and preparing data for import...";
      break;
    case 'validating':
      title = "Validating Tests";
      description = `Validating ${status.processed} of ${status.total} tests...`;
      break;
    case 'uploading':
      title = "Uploading Tests";
      description = `Uploading ${status.processed} of ${status.total} tests...`;
      break;
    case 'complete':
      title = "Upload Complete";
      description = `Successfully imported ${status.successCount} tests.${status.errorCount > 0 ? ` Failed to import ${status.errorCount} tests.` : ''}`;
      break;
    case 'error':
      title = "Upload Error";
      description = "An error occurred during the import process.";
      break;
    default:
      title = "Preparing Import";
      description = "Getting ready to import your tests...";
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className={`max-w-md ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}
      >
        <DialogHeader>
          <DialogTitle className={`text-xl ${isDarkMode ? 'text-white' : ''}`}>
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
            {['processing', 'validating', 'uploading', 'idle'].includes(status.state) && (
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            )}
          </div>
          
          {/* Progress Bar */}
          {['processing', 'validating', 'uploading'].includes(status.state) && (
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
          
          {/* Results Summary */}
          {status.state === 'complete' && (
            <div className={`rounded-md p-4 ${
              status.errorCount > 0 
                ? (isDarkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200') 
                : (isDarkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200')
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Success:</span>
                <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>
                  {status.successCount} tests
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Errors:</span>
                <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>
                  {status.errorCount} tests
                </span>
              </div>
            </div>
          )}
          
          {/* Error Details */}
          {status.state === 'complete' && status.errorCount > 0 && status.errors.length > 0 && (
            <div className={`mt-4 max-h-40 overflow-y-auto rounded-md p-3 ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
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
      </DialogContent>
    </Dialog>
  );
}