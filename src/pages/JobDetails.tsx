import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Play, Pause, Edit, Trash2, Zap } from "lucide-react";
import { mockJobs, mockExecutions } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";
import { TriggerJobDialog } from "@/components/TriggerJobDialog";
import { toast } from "sonner";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const job = mockJobs.find((j) => j.id === id);
  const executions = mockExecutions.filter((e) => e.jobId === id);

  if (!job) {
    return <div>Job not found</div>;
  }

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

  const handleToggle = () => {
    toast.success(job.status === "paused" ? "Job resumed" : "Job paused");
  };

  const handleDelete = () => {
    toast.success("Job deleted");
    navigate("/jobs");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{job.name}</h1>
          <p className="text-muted-foreground font-mono">{job.schedule}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTriggerDialogOpen(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Trigger Now
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate(`/jobs/${id}/edit`)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleToggle}
            className={job.status === "paused" ? "text-success" : ""}
          >
            {job.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" className="text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.successRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.executionCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Next Run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {job.nextRun !== "-" ? new Date(job.nextRun).toLocaleString() : "Paused"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {executions.length > 0 ? (
              executions.map((execution) => (
                <div key={execution.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(execution.status)}>{execution.status}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(execution.startTime).toLocaleString()}
                      </span>
                    </div>
                    {execution.duration > 0 && (
                      <span className="text-sm text-muted-foreground">{execution.duration}s</span>
                    )}
                  </div>
                  <div className="bg-secondary p-3 rounded-md font-mono text-sm">
                    {execution.logs}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No execution history available</p>
            )}
          </div>
        </CardContent>
      </Card>

      <TriggerJobDialog
        open={triggerDialogOpen}
        onOpenChange={setTriggerDialogOpen}
        jobName={job.name}
        jobUrl="https://example.com/your-php-script.php"
      />
    </div>
  );
};

export default JobDetails;
