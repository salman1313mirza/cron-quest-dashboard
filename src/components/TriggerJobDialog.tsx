import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TriggerJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobName: string;
  jobUrl: string;
  method?: string;
  headers?: string;
  body?: string;
  timeout?: number;
}

export function TriggerJobDialog({ 
  open, 
  onOpenChange, 
  jobName, 
  jobUrl,
  method = "GET",
  headers = "",
  body = "",
  timeout = 300
}: TriggerJobDialogProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [message, setMessage] = useState("");

  const triggerJob = async () => {
    setIsRunning(true);
    setProgress(10);
    setResult(null);
    setMessage("");

    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90));
      }, 200);

      // Parse headers
      let parsedHeaders: Record<string, string> = {};
      if (headers.trim()) {
        try {
          parsedHeaders = JSON.parse(headers);
        } catch {
          toast.error("Invalid JSON in headers");
          throw new Error("Invalid headers JSON");
        }
      }

      // Parse body
      let parsedBody: string | undefined;
      if (body.trim() && method !== "GET") {
        try {
          JSON.parse(body); // Validate JSON
          parsedBody = body;
        } catch {
          toast.error("Invalid JSON in body");
          throw new Error("Invalid body JSON");
        }
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

      // Make real HTTP request
      const response = await fetch(jobUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...parsedHeaders,
        },
        body: parsedBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        setResult("success");
        setMessage(`Job executed successfully! Status: ${response.status}`);
        toast.success("Job triggered successfully!");
      } else {
        setResult("error");
        setMessage(`Job failed with status ${response.status}: ${response.statusText}`);
        toast.error(`Failed with status ${response.status}`);
      }
    } catch (error) {
      setResult("error");
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setMessage(`Job timed out after ${timeout} seconds`);
          toast.error("Job execution timed out");
        } else {
          setMessage(`Error: ${error.message}`);
          toast.error("Failed to trigger job");
        }
      } else {
        setMessage("Failed to execute job");
        toast.error("Failed to trigger job");
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleClose = () => {
    if (!isRunning) {
      setProgress(0);
      setResult(null);
      setMessage("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trigger Job Manually</DialogTitle>
          <DialogDescription>Execute "{jobName}" immediately</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Endpoint:</p>
            <code className="block bg-secondary p-2 rounded text-xs break-all">{jobUrl}</code>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm">Executing job...</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {result === "success" && (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <span>{message}</span>
            </div>
          )}

          {result === "error" && (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span>{message}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isRunning}>
              Close
            </Button>
            <Button onClick={triggerJob} disabled={isRunning}>
              {isRunning ? "Running..." : "Trigger Now"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
