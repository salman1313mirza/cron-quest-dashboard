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
import { getAllJobs, createJob as createJobDB, updateJob, deleteJob as deleteJobDB, initDatabase } from "@/lib/database";
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
  const navigate = useNavigate();

  useEffect(() => {
    async function loadJobs() {
      await initDatabase();
      const loadedJobs = await getAllJobs();
      setJobs(loadedJobs as Job[]);
      setLoading(false);
    }
    loadJobs();
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
    const newJob: Job = {
      id: `job_${Date.now()}`,
      name: jobData.name,
      url: jobData.url,
      method: jobData.method,
      schedule: jobData.schedule,
      status: jobData.enabled ? "success" : "paused",
      lastRun: new Date().toISOString(),
      nextRun: jobData.enabled ? new Date(Date.now() + 3600000).toISOString() : "-",
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
    await updateJob(jobId, {
      status: newStatus,
      nextRun: newStatus === "paused" ? "-" : new Date(Date.now() + 3600000).toISOString()
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
        </div>
        <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Job
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Jobs</CardTitle>
        </CardHeader>
        <CardContent>
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
              {jobs.map((job) => (
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
                  <TableCell>{job.successRate}%</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(job.lastRun).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {job.nextRun !== "-" ? new Date(job.nextRun).toLocaleString() : "-"}
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
              ))}
            </TableBody>
          </Table>
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
