import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileText, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface TestRecord {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  cptCode: string | null;
  loincCode: string | null;
  snomedCode: string | null;
  description: string | null;
  notes: string | null;
  sourceSheet?: string;
}

interface QAReport {
  csvTotal: number;
  dbTotal: number;
  matched: number;
  missingInDb: TestRecord[];
  extraInDb: TestRecord[];
  mismatched: Array<{
    id: string;
    field: string;
    csvValue: string;
    dbValue: string;
  }>;
  categoryDistribution: {
    csv: Record<string, number>;
    db: Record<string, number>;
  };
  subcategoryDistribution: {
    csv: Record<string, number>;
    db: Record<string, number>;
  };
}

interface QAVerificationToolProps {
  isDarkMode: boolean;
}

export default function QAVerificationTool({ isDarkMode }: QAVerificationToolProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qaReport, setQaReport] = useState<QAReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const cardClass = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200';
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setQaReport(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (csvContent: string): TestRecord[] => {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const record: any = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] || null;
      });
      
      return {
        id: record.id || '',
        name: record.Name || record.name || '',
        category: record.category || '',
        subCategory: record.subCategory || '',
        cptCode: record.cptCode || null,
        loincCode: record.loincCode || null,
        snomedCode: record.snomedCode || null,
        description: record.description || null,
        notes: record.notes || null,
        sourceSheet: record.sourceSheet || undefined,
      };
    });
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const fetchDatabaseTests = async (): Promise<TestRecord[]> => {
    const response = await fetch('/api/tests');
    if (!response.ok) {
      throw new Error('Failed to fetch database tests');
    }
    const data = await response.json();
    return data.tests.filter((test: TestRecord) => test.category === 'Laboratory Tests');
  };

  const generateQAReport = async () => {
    if (!csvFile) return;

    setIsProcessing(true);
    try {
      // Read CSV file
      const csvContent = await csvFile.text();
      const csvTests = parseCSV(csvContent);
      
      // Fetch database tests
      const dbTests = await fetchDatabaseTests();
      
      // Create lookup maps
      const csvMap = new Map(csvTests.map(test => [test.id, test]));
      const dbMap = new Map(dbTests.map(test => [test.id, test]));
      
      // Find differences
      const missingInDb: TestRecord[] = [];
      const extraInDb: TestRecord[] = [];
      const mismatched: Array<{
        id: string;
        field: string;
        csvValue: string;
        dbValue: string;
      }> = [];
      
      let matched = 0;
      
      // Check CSV tests against DB
      for (const csvTest of csvTests) {
        const dbTest = dbMap.get(csvTest.id);
        if (!dbTest) {
          missingInDb.push(csvTest);
        } else {
          matched++;
          // Check for mismatches
          const fieldsToCheck = ['name', 'category', 'subCategory', 'cptCode', 'loincCode', 'snomedCode', 'description', 'notes'];
          for (const field of fieldsToCheck) {
            const csvValue = String(csvTest[field as keyof TestRecord] || '');
            const dbValue = String(dbTest[field as keyof TestRecord] || '');
            if (csvValue !== dbValue) {
              mismatched.push({
                id: csvTest.id,
                field,
                csvValue,
                dbValue
              });
            }
          }
        }
      }
      
      // Check DB tests against CSV (to find extras)
      for (const dbTest of dbTests) {
        if (!csvMap.has(dbTest.id)) {
          extraInDb.push(dbTest);
        }
      }
      
      // Generate distribution statistics
      const csvCategoryDist: Record<string, number> = {};
      const dbCategoryDist: Record<string, number> = {};
      const csvSubcategoryDist: Record<string, number> = {};
      const dbSubcategoryDist: Record<string, number> = {};
      
      csvTests.forEach(test => {
        csvCategoryDist[test.category] = (csvCategoryDist[test.category] || 0) + 1;
        csvSubcategoryDist[test.subCategory] = (csvSubcategoryDist[test.subCategory] || 0) + 1;
      });
      
      dbTests.forEach(test => {
        dbCategoryDist[test.category] = (dbCategoryDist[test.category] || 0) + 1;
        dbSubcategoryDist[test.subCategory] = (dbSubcategoryDist[test.subCategory] || 0) + 1;
      });
      
      const report: QAReport = {
        csvTotal: csvTests.length,
        dbTotal: dbTests.length,
        matched,
        missingInDb,
        extraInDb,
        mismatched,
        categoryDistribution: {
          csv: csvCategoryDist,
          db: dbCategoryDist
        },
        subcategoryDistribution: {
          csv: csvSubcategoryDist,
          db: dbSubcategoryDist
        }
      };
      
      setQaReport(report);
      
      toast({
        title: "QA Report Generated",
        description: `Found ${missingInDb.length} missing tests, ${extraInDb.length} extra tests, and ${mismatched.length} mismatches`,
      });
      
    } catch (error) {
      console.error('Error generating QA report:', error);
      toast({
        title: "Error",
        description: `Failed to generate QA report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadReport = () => {
    if (!qaReport) return;
    
    const reportData = {
      summary: {
        csvTotal: qaReport.csvTotal,
        dbTotal: qaReport.dbTotal,
        matched: qaReport.matched,
        missingInDbCount: qaReport.missingInDb.length,
        extraInDbCount: qaReport.extraInDb.length,
        mismatchedCount: qaReport.mismatched.length
      },
      missingInDb: qaReport.missingInDb,
      extraInDb: qaReport.extraInDb,
      mismatched: qaReport.mismatched,
      distributions: qaReport.categoryDistribution
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className={textClass}>QA Verification Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className={textClass}>Select CSV File</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
          </div>
          
          {csvFile && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Selected file: {csvFile.name} ({Math.round(csvFile.size / 1024)} KB)
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={generateQAReport}
              disabled={!csvFile || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Generate QA Report'}
            </Button>
            
            {qaReport && (
              <Button
                variant="outline"
                onClick={downloadReport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {qaReport && (
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className={textClass}>QA Report Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{qaReport.csvTotal}</div>
                <div className={`text-sm ${mutedTextClass}`}>CSV Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{qaReport.dbTotal}</div>
                <div className={`text-sm ${mutedTextClass}`}>DB Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{qaReport.matched}</div>
                <div className={`text-sm ${mutedTextClass}`}>Matched</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{qaReport.missingInDb.length}</div>
                <div className={`text-sm ${mutedTextClass}`}>Missing in DB</div>
              </div>
            </div>

            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="missing">Missing ({qaReport.missingInDb.length})</TabsTrigger>
                <TabsTrigger value="extra">Extra ({qaReport.extraInDb.length})</TabsTrigger>
                <TabsTrigger value="mismatched">Mismatched ({qaReport.mismatched.length})</TabsTrigger>
                <TabsTrigger value="distribution">Distribution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Match Rate:</strong> {Math.round((qaReport.matched / qaReport.csvTotal) * 100)}%
                    </AlertDescription>
                  </Alert>
                  
                  <Alert variant={qaReport.missingInDb.length > 0 ? "destructive" : "default"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Missing:</strong> {qaReport.missingInDb.length} tests not in database
                    </AlertDescription>
                  </Alert>
                  
                  <Alert variant={qaReport.extraInDb.length > 0 ? "destructive" : "default"}>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Extra:</strong> {qaReport.extraInDb.length} tests only in database
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
              
              <TabsContent value="missing">
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {qaReport.missingInDb.map(test => (
                      <div key={test.id} className="p-3 border rounded">
                        <div className="font-medium">{test.name}</div>
                        <div className="text-sm text-gray-600">
                          ID: {test.id} | CPT: {test.cptCode} | Category: {test.subCategory}
                        </div>
                        {test.sourceSheet && (
                          <Badge variant="secondary" className="mt-1">
                            {test.sourceSheet}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="extra">
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {qaReport.extraInDb.map(test => (
                      <div key={test.id} className="p-3 border rounded">
                        <div className="font-medium">{test.name}</div>
                        <div className="text-sm text-gray-600">
                          ID: {test.id} | CPT: {test.cptCode} | Category: {test.subCategory}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="mismatched">
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {qaReport.mismatched.map((mismatch, index) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="font-medium">Test ID: {mismatch.id}</div>
                        <div className="text-sm">
                          <strong>Field:</strong> {mismatch.field}
                        </div>
                        <div className="text-sm">
                          <strong>CSV:</strong> {mismatch.csvValue}
                        </div>
                        <div className="text-sm">
                          <strong>DB:</strong> {mismatch.dbValue}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="distribution">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Subcategory Distribution</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">CSV File</h4>
                        <div className="space-y-1">
                          {Object.entries(qaReport.subcategoryDistribution.csv).map(([category, count]) => (
                            <div key={category} className="flex justify-between text-sm">
                              <span>{category}</span>
                              <span>{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Database</h4>
                        <div className="space-y-1">
                          {Object.entries(qaReport.subcategoryDistribution.db).map(([category, count]) => (
                            <div key={category} className="flex justify-between text-sm">
                              <span>{category}</span>
                              <span>{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}