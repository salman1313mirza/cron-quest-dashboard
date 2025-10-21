import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Play, Pause, Trash2, Settings as SettingsIcon, Zap } from "lucide-react";
import { Job } from "@/lib/mockData";
import { getAllJobs, createJob as createJobDB, updateJob, deleteJob as deleteJobDB } from "@/lib/database";
import { calculateNextRun } from "@/lib/cronUtils";
import { useNavigate } from "react-router-dom";
import { JobForm, JobFormData } from "@/components/JobForm";
import { TriggerJobDialog } from "@/components/TriggerJobDialog";
import { toast } from "sonner";

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [triggerJob, setTriggerJob] = useState<Job | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const navigate = useNavigate();

  // Load jobs from database
  const loadJobs = async () => {
    const loadedJobs = await getAllJobs();
    setJobs(loadedJobs as Job[]);
    setLastUpdated(new Date());
    if (loading) setLoading(false);
  };

  // Initial load
  useEffect(() => {
    loadJobs();
  }, []);

  // Real-time updates - refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-time clock - update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-success text-success-foreground";
      case "failed":
        return "bg-destructive text-destructive-foreground";
      case "running":
        return "bg-primary text-primary-foreground";
      case "paused":
        return "bg-muted text-muted-foreground";
      default:
        return "";
    }
  };

  const handleCreateJob = async (jobData: JobFormData) => {
    const now = new Date();
    const newJob: Job = {
      id: `job_${Date.now()}`,
      name: jobData.name,
      url: jobData.url,
      method: jobData.method,
      schedule: jobData.schedule,
      status: jobData.enabled ? "success" : "paused",
      lastRun: now.toISOString(),
      nextRun: jobData.enabled ? calculateNextRun(jobData.schedule, now).toISOString() : "-",
      successRate: 100,
      executionCount: 0,
      headers: jobData.headers,
      body: jobData.body,
      timeout: jobData.timeout,
    };
    
    await createJobDB(newJob);
    const updatedJobs = await getAllJobs();
    setJobs(updatedJobs as Job[]);
    setIsCreateDialogOpen(false);
    toast.success(`Job "${jobData.name}" created successfully!`);
  };

  const handleToggleJob = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === "paused" ? "success" : "paused";
    const job = jobs.find(j => j.id === jobId);
    
    await updateJob(jobId, {
      status: newStatus,
      nextRun: newStatus === "paused" ? "-" : calculateNextRun(job?.schedule || "0 * * * *").toISOString()
    });
    const updatedJobs = await getAllJobs();
    setJobs(updatedJobs as Job[]);
    toast.success(`Job ${newStatus === "paused" ? "paused" : "resumed"}`);
  };

  const handleDeleteJob = async (jobId: string) => {
    await deleteJobDB(jobId);
    const updatedJobs = await getAllJobs();
    setJobs(updatedJobs as Job[]);
    setDeletingJobId(null);
    toast.success("Job deleted successfully");
  };

  const handleTriggerJob = (job: Job) => {
    setTriggerJob(job);
  };

  if (loading) {
    return <div className="p-8">Loading jobs from database...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">Manage and monitor your cron jobs</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-muted-foreground">
                Live: {currentTime.toLocaleTimeString()}
              </span>
            </div>
            <span className="text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Job
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Jobs</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span>Real-time</span>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No jobs yet. Create your first cron job to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const lastRunDate = job.lastRun ? new Date(job.lastRun) : null;
                  const nextRunDate = job.nextRun && job.nextRun !== "-" ? new Date(job.nextRun) : null;
                  const isPastNextRun = nextRunDate && currentTime >= nextRunDate;
                  
                  return (
                    <TableRow
                      key={job.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell className="font-mono text-sm">{job.schedule}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                      </TableCell>
                      <TableCell>{Math.round(job.successRate || 0)}%</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lastRunDate ? (
                          <div>
                            <div>{lastRunDate.toLocaleDateString()}</div>
                            <div className="text-xs">{lastRunDate.toLocaleTimeString()}</div>
                          </div>
                        ) : (
                          <span>Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {nextRunDate ? (
                          <div className={isPastNextRun ? "text-warning" : "text-muted-foreground"}>
                            <div>{nextRunDate.toLocaleDateString()}</div>
                            <div className="text-xs">{nextRunDate.toLocaleTimeString()}</div>
                            {isPastNextRun && (
                              <div className="text-xs text-warning">Should have run</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTriggerJob(job);
                            }}
                            title="Trigger now"
                          >
                            <Zap className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleJob(job.id, job.status);
                            }}
                            title={job.status === "paused" ? "Resume" : "Pause"}
                          >
                            {job.status === "paused" ? (
                              <Play className="h-4 w-4 text-success" />
                            ) : (
                              <Pause className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/jobs/${job.id}/edit`);
                            }}
                            title="Settings"
                          >
                            <SettingsIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingJobId(job.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>
              Configure a new cron job to execute your PHP program or HTTP endpoint
            </DialogDescription>
          </DialogHeader>
          <JobForm
            onSubmit={handleCreateJob}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingJobId} onOpenChange={() => setDeletingJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingJobId && handleDeleteJob(deletingJobId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {triggerJob && (
        <TriggerJobDialog
          open={!!triggerJob}
          onOpenChange={(open) => !open && setTriggerJob(null)}
          jobName={triggerJob.name}
          jobUrl={triggerJob.url}
          jobId={triggerJob.id}
          method={triggerJob.method}
          headers={triggerJob.headers}
          body={triggerJob.body}
          timeout={triggerJob.timeout}
        />
      )}
    </div>
  );
};

export default Jobs;
