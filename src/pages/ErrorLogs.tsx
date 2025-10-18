import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trash2, FileText, Clock } from "lucide-react";
import { getAllErrorLogs, deleteErrorLog } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ErrorLogs() {
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedError, setSelectedError] = useState<any>(null);
  const { toast } = useToast();

  const loadErrorLogs = async () => {
    try {
      const logs = await getAllErrorLogs();
      setErrorLogs(logs);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load error logs:", error);
      toast({
        title: "Error",
        description: "Failed to load error logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadErrorLogs();
    const interval = setInterval(loadErrorLogs, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteErrorLog(id);
      toast({
        title: "Success",
        description: "Error log deleted successfully",
      });
      loadErrorLogs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete error log",
        variant: "destructive",
      });
    }
  };

  const getErrorTypeColor = (errorType: string) => {
    if (errorType.includes("Timeout")) return "destructive";
    if (errorType.includes("Network")) return "destructive";
    if (errorType.toLowerCase().includes("error")) return "destructive";
    return "secondary";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading error logs...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Error Logs & Notifications</h1>
          <p className="text-muted-foreground">Track and monitor job execution errors</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Error History</CardTitle>
          </div>
          <CardDescription>
            View all errors and exceptions from job executions. Each job has a separate error log file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No errors logged yet. All jobs are running smoothly! 🎉</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Error Type</TableHead>
                  <TableHead>Error Message</TableHead>
                  <TableHead>Status Code</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.jobName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getErrorTypeColor(log.errorType)}>
                        {log.errorType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {log.errorMessage}
                    </TableCell>
                    <TableCell>
                      {log.responseStatus ? (
                        <Badge variant="destructive">{log.responseStatus}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedError(log)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
          </DialogHeader>
          {selectedError && (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Job Name</h4>
                  <Badge>{selectedError.jobName}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Timestamp</h4>
                  <p className="text-sm font-mono">{new Date(selectedError.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Error Type</h4>
                  <Badge variant={getErrorTypeColor(selectedError.errorType)}>
                    {selectedError.errorType}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Error Message</h4>
                  <p className="text-sm bg-muted p-3 rounded">{selectedError.errorMessage}</p>
                </div>
                {selectedError.responseStatus && (
                  <div>
                    <h4 className="font-semibold mb-2">Response Status</h4>
                    <Badge variant="destructive">{selectedError.responseStatus}</Badge>
                  </div>
                )}
                {selectedError.stackTrace && (
                  <div>
                    <h4 className="font-semibold mb-2">Stack Trace</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {selectedError.stackTrace}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
