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
  ChevronLeft
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

  const sessions: ImportSession[] = sessionsData?.sessions || [];

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
                  View detailed audit logs and reports for CSV file imports
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
          ) : sessionDetailData && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                <TabsTrigger value="summary" className="text-gray-300 data-[state=active]:bg-gray-600">Summary</TabsTrigger>
                <TabsTrigger value="logs" className="text-gray-300 data-[state=active]:bg-gray-600">Audit Logs</TabsTrigger>
                <TabsTrigger value="errors" className="text-gray-300 data-[state=active]:bg-gray-600">Errors</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
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

              <TabsContent value="logs" className="space-y-4">
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
                    {sessionDetailData.auditLogs?.map((log: ImportAuditLog) => (
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