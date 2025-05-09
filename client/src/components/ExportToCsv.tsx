import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import CsvExportTool from './CsvExportTool';

interface ExportToCsvProps {
  className?: string;
}

const ExportToCsv: React.FC<ExportToCsvProps> = ({ className = '' }) => {
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <>
      <Card className={`p-6 flex flex-col items-center justify-center gap-4 ${className}`}>
        <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3 w-16 h-16 flex items-center justify-center mb-2">
          <Download className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-center">Export Tests to CSV</h3>
        
        <p className="text-muted-foreground text-center text-sm mb-2">
          Download all tests as a standard CSV file
        </p>
        
        <Button 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setShowExportModal(true)}
        >
          Export CSV
        </Button>
      </Card>
      
      {/* CSV Export Modal with filters */}
      <CsvExportTool 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)}
      />
    </>
  );
};

export default ExportToCsv;