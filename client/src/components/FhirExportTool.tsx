import React from 'react';
import { Test } from '@shared/schema';
import EnhancedFhirExportTool from './EnhancedFhirExportTool';

interface FhirExportToolProps {
  isOpen: boolean;
  onClose: () => void;
  tests: Test[];
  isDarkMode?: boolean;
}

export default function FhirExportTool(props: FhirExportToolProps) {
  // Forward all props to the enhanced tool
  return <EnhancedFhirExportTool {...props} />;
}