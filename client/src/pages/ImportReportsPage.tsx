import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download,
  Eye,
  Clock,
  User,
  Database,
  ChevronLeft,
  AlertTriangle,
  Copy
} from "lucide-react";
import { format } from "date-fns";

interface ImportSession {
  id: number;
  userId: number;
  filename: string;
  fileSize: number;
  totalTests: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  validationErrors: string[] | null;
  importStatus: 'completed' | 'failed' | 'partial';
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
}

interface CptDuplicate {
  cptCode: string;
  count: number;
  testIds: string[];
  testNames: string[];
}

interface ImportAuditLog {
  id: number;
  sessionId: number;
  testId: string | null;
  originalTestId: string | null;
  operation: string;
  status: string;
  errorMessage: string | null;
  duplicateReason: string | null;
  originalData: any;
  processedData: any;
  createdAt: string;
}

interface ImportAuditLog {
  id: number;
  sessionId: number;
  testId: string | null;
  originalTestId: string | null;
  operation: 'insert' | 'update' | 'skip' | 'error';
  status: 'success' | 'failed' | 'duplicate' | 'validation_error';
  errorMessage: string | null;
  validationErrors: Record<string, string> | null;
  originalData: Record<string, any> | null;
  processedData: Record<string, any> | null;
  duplicateReason: string | null;
  processingTime: number | null;
  createdAt: string;
}

const ImportReportsPage = () => {
  const [selectedSession, setSelectedSession] = useState<ImportSession | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch import sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/import-sessions"],
    queryFn: async () => {
      const response = await fetch("/api/import-sessions");
      if (!response.ok) throw new Error("Failed to fetch import sessions");
      return response.json();
    }
  });

  // Fetch detailed session data when modal opens
  const { data: sessionDetailData, isLoading: detailLoading } = useQuery({
    queryKey: ["/api/import-sessions", selectedSession?.id],
    queryFn: async () => {
      if (!selectedSession) return null;
      const response = await fetch(`/api/import-sessions/${selectedSession.id}`);
      if (!response.ok) throw new Error("Failed to fetch session details");
      return response.json();
    },
    enabled: !!selectedSession && showDetailModal
  });

  // Fetch CPT duplicates data using SQL query directly
  const { data: cptDuplicatesData, isLoading: cptLoading } = useQuery({
    queryKey: ["/api/cpt-duplicates"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/cpt-duplicates");
        if (!response.ok) {
          // If API fails, return empty data
          console.warn('CPT duplicates API failed, using empty data');
          return { duplicates: [] };
        }
        return response.json();
      } catch (error) {
        console.warn('CPT duplicates fetch error:', error);
        return { duplicates: [] };
      }
    },
    enabled: showDetailModal,
    retry: false
  });

  const sessions: ImportSession[] = sessionsData?.sessions || [];
  const cptDuplicates: CptDuplicate[] = cptDuplicatesData?.duplicates || [];
  const auditLogs: ImportAuditLog[] = sessionDetailData?.auditLogs || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Partial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getOperationIcon = (operation: string, status: string) => {
    if (status === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (status === 'failed' || status === 'validation_error') {
      return <XCircle className="h-4 w-4 text-red-600" />;
    } else if (status === 'duplicate') {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const exportSessionReport = (session: ImportSession) => {
    const reportData = {
      sessionInfo: session,
      auditLogs: sessionDetailData?.auditLogs || []
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-report-${session.id}-${format(new Date(session.startedAt), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openDetailModal = (session: ImportSession) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  const renderCptDuplicatesTab = () => {
    // Get CPT-related audit logs from this import session
    const cptRelatedLogs = auditLogs.filter(log => 
      log.duplicateReason === 'cpt_code_exists' || 
      (log.processedData && log.processedData.cptCode)
    );

    // Get affected CPT codes from this import
    const importCptCodes = new Set(
      cptRelatedLogs
        .map(log => log.processedData?.cptCode)
        .filter(Boolean)
    );

    // Filter database duplicates to show those affected by this import
    const relevantDuplicates = cptDuplicates.filter(dup => 
      importCptCodes.has(dup.cptCode)
    );

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-700 border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-200 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Total CPT Duplicates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{cptDuplicates.length}</div>
              <p className="text-xs text-gray-400 mt-1">Database-wide duplicates</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-700 border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-200 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Import Affected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{relevantDuplicates.length}</div>
              <p className="text-xs text-gray-400 mt-1">CPT codes from this import</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-700 border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-200 flex items-center">
                <Copy className="h-4 w-4 mr-2" />
                CPT Conflicts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{cptRelatedLogs.length}</div>
              <p className="text-xs text-gray-400 mt-1">Tests with CPT conflicts</p>
            </CardContent>
          </Card>
        </div>

        {/* Database-wide CPT Duplicates */}
        <Card className="bg-gray-700 border-gray-600">
          <CardHeader>
            <CardTitle className="text-gray-200">All CPT Code Duplicates</CardTitle>
            <CardDescription className="text-gray-400">
              Current duplicate CPT codes in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cptDuplicates.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-200 mb-2">No CPT Duplicates</h3>
                <p className="text-gray-400">All CPT codes in the database are unique.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cptDuplicates.map((duplicate, index) => (
                  <div key={index} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge className={`px-2 py-1 text-sm font-mono ${
                          importCptCodes.has(duplicate.cptCode) 
                            ? 'bg-yellow-900 text-yellow-300 border-yellow-700' 
                            : 'bg-red-900 text-red-300 border-red-700'
                        }`}>
                          {duplicate.cptCode}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {duplicate.count} tests
                        </span>
                        {importCptCodes.has(duplicate.cptCode) && (
                          <Badge className="bg-orange-900 text-orange-300 border-orange-700 text-xs">
                            Affected by Import
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {duplicate.testIds.map((testId, testIndex) => (
                        <div key={testIndex} className="flex items-center justify-between bg-gray-900 rounded p-2">
                          <div className="flex-1">
                            <div className="font-mono text-sm text-blue-400">{testId}</div>
                            <div className="text-sm text-gray-300 truncate">
                              {duplicate.testNames[testIndex]}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Session CPT Analysis */}
        {cptRelatedLogs.length > 0 && (
          <Card className="bg-gray-700 border-gray-600">
            <CardHeader>
              <CardTitle className="text-gray-200">Import Session CPT Analysis</CardTitle>
              <CardDescription className="text-gray-400">
                CPT code conflicts and actions taken during this import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="text-gray-300">Original Test ID</TableHead>
                    <TableHead className="text-gray-300">CPT Code</TableHead>
                    <TableHead className="text-gray-300">Action</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Conflict Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cptRelatedLogs.map((log, index) => (
                    <TableRow key={index} className="border-gray-600">
                      <TableCell className="font-mono text-sm text-blue-400">
                        {log.originalTestId || log.testId}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.processedData?.cptCode || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${
                          log.operation === 'skip' 
                            ? 'bg-yellow-900 text-yellow-300' 
                            : log.operation === 'update'
                            ? 'bg-blue-900 text-blue-300'
                            : 'bg-green-900 text-green-300'
                        }`}>
                          {log.operation}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${
                          log.status === 'success' 
                            ? 'bg-green-900 text-green-300' 
                            : log.status === 'duplicate'
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {log.duplicateReason || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (sessionsLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header onSearch={() => {}} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading import reports...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header onSearch={() => {}} />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back to Home Navigation */}
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </div>

          {/* Page Header */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Import Reports</h1>
                <p className="text-gray-400 mt-2">
                  View detailed audit logs and reports for successful CSV file imports that added tests to the database
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-200">Total Imports</CardTitle>
                  <FileText className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{sessions.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-200">Successful</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {sessions.filter(s => s.importStatus === 'completed').length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-200">Failed</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {sessions.filter(s => s.importStatus === 'failed').length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-200">Tests Imported</CardTitle>
                  <Database className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {sessions.reduce((total, s) => total + s.successCount, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Import Sessions Table */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Import Sessions</CardTitle>
                <CardDescription className="text-gray-400">
                  Detailed history of all CSV import operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">File</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Tests</TableHead>
                      <TableHead className="text-gray-300">Success</TableHead>
                      <TableHead className="text-gray-300">Errors</TableHead>
                      <TableHead className="text-gray-300">Duplicates</TableHead>
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id} className="border-gray-700">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-white">{session.filename}</div>
                            <div className="text-sm text-gray-400">
                              {formatFileSize(session.fileSize)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(session.importStatus)}</TableCell>
                        <TableCell className="text-center text-gray-300">{session.totalTests}</TableCell>
                        <TableCell className="text-center text-green-600 font-medium">
                          {session.successCount}
                        </TableCell>
                        <TableCell className="text-center text-red-600 font-medium">
                          {session.errorCount}
                        </TableCell>
                        <TableCell className="text-center text-yellow-600 font-medium">
                          {session.duplicateCount}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-300">
                              {format(new Date(session.startedAt), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(session.startedAt), 'HH:mm:ss')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetailModal(session)}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => exportSessionReport(session)}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Export
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {sessions.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-200 mb-2">No Import Reports</h3>
                    <p className="text-gray-400">
                      Import reports will appear here after you upload CSV files.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Import Session Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Detailed audit log for {selectedSession?.filename}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-700">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gray-600">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="audit" className="data-[state=active]:bg-gray-600">
                  Audit Log
                </TabsTrigger>
                <TabsTrigger value="cpt-duplicates" className="data-[state=active]:bg-gray-600">
                  CPT Duplicates
                </TabsTrigger>
                <TabsTrigger value="errors" className="data-[state=active]:bg-gray-600">
                  Errors
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-sm text-gray-200">Session Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">File:</span>
                        <span className="text-sm font-medium text-gray-200">{selectedSession?.filename}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Size:</span>
                        <span className="text-sm text-gray-200">{formatFileSize(selectedSession?.fileSize || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Status:</span>
                        {getStatusBadge(selectedSession?.importStatus || '')}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Started:</span>
                        <span className="text-sm text-gray-200">
                          {selectedSession?.startedAt && format(new Date(selectedSession.startedAt), 'MMM dd, yyyy HH:mm:ss')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Completed:</span>
                        <span className="text-sm text-gray-200">
                          {selectedSession?.completedAt ? 
                            format(new Date(selectedSession.completedAt), 'MMM dd, yyyy HH:mm:ss') : 
                            'In Progress'
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-sm text-gray-200">Results Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Total Tests:</span>
                        <span className="text-sm font-medium text-gray-200">{selectedSession?.totalTests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-600">Successful:</span>
                        <span className="text-sm font-medium text-green-600">{selectedSession?.successCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-600">Errors:</span>
                        <span className="text-sm font-medium text-red-600">{selectedSession?.errorCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-yellow-600">Duplicates:</span>
                        <span className="text-sm font-medium text-yellow-600">{selectedSession?.duplicateCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="audit" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-600">
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Test ID</TableHead>
                      <TableHead className="text-gray-300">Operation</TableHead>
                      <TableHead className="text-gray-300">Processing Time</TableHead>
                      <TableHead className="text-gray-300">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log: ImportAuditLog) => (
                      <TableRow key={log.id} className="border-gray-600">
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getOperationIcon(log.operation, log.status)}
                            <span className="text-sm capitalize text-gray-300">{log.status.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-300">
                          {log.testId || log.originalTestId || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize border-gray-600 text-gray-300">
                            {log.operation}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {log.processingTime ? `${log.processingTime}ms` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {log.errorMessage && (
                            <div className="text-sm text-red-400 max-w-xs truncate">
                              {log.errorMessage}
                            </div>
                          )}
                          {log.duplicateReason && (
                            <div className="text-sm text-yellow-400">
                              Duplicate: {log.duplicateReason.replace('_', ' ')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="cpt-duplicates" className="space-y-4">
                {renderCptDuplicatesTab()}
              </TabsContent>

              <TabsContent value="errors" className="space-y-4">
                {selectedSession?.validationErrors && selectedSession.validationErrors.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-200">Validation Errors</h4>
                    {selectedSession.validationErrors.map((error, index) => (
                      <div key={index} className="bg-red-900/20 border border-red-800 rounded-md p-3">
                        <div className="flex">
                          <XCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                          <div className="text-sm text-red-300">{error}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-200 mb-2">No Errors</h3>
                    <p className="text-gray-400">This import session completed without validation errors.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default ImportReportsPage;