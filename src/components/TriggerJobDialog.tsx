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
}

export function TriggerJobDialog({ open, onOpenChange, jobName, jobUrl }: TriggerJobDialogProps) {
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
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Mock API call - in real implementation, this would call your job URL
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setProgress(100);
      setResult("success");
      setMessage("Job executed successfully!");
      toast.success("Job triggered successfully!");
    } catch (error) {
      setResult("error");
      setMessage("Failed to execute job");
      toast.error("Failed to trigger job");
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
