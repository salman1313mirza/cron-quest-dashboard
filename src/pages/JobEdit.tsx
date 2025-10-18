import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { JobForm, JobFormData } from "@/components/JobForm";
import { getJobById, updateJob } from "@/lib/database";
import { calculateNextRun } from "@/lib/cronUtils";
import { toast } from "sonner";

const JobEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJob() {
      if (id) {
        const loadedJob = await getJobById(id);
        setJob(loadedJob);
        setLoading(false);
      }
    }
    loadJob();
  }, [id]);

  if (loading) {
    return <div className="p-8">Loading job...</div>;
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Job Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (jobData: JobFormData) => {
    const updates = {
      name: jobData.name,
      url: jobData.url,
      method: jobData.method,
      schedule: jobData.schedule,
      headers: jobData.headers || null,
      body: jobData.body || null,
      timeout: jobData.timeout,
      status: jobData.enabled ? "success" : "paused",
      enabled: jobData.enabled ? 1 : 0,
      nextRun: jobData.enabled ? calculateNextRun(jobData.schedule).toISOString() : "-",
    };
    
    await updateJob(id!, updates);
    toast.success("Job updated successfully!");
    navigate(`/jobs/${id}`);
  };

  const initialData: Partial<JobFormData> = {
    name: job.name,
    url: job.url,
    method: job.method,
    schedule: job.schedule,
    autoStart: job.status !== "paused",
    autoStop: false,
    autoStopAfter: 3600,
    timeout: job.timeout || 300,
    maxRetries: 3,
    headers: job.headers || "",
    body: job.body || "",
    enabled: job.status !== "paused",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/jobs/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Job</h1>
          <p className="text-muted-foreground">{job.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Configuration</CardTitle>
          <CardDescription>Update your cron job settings and schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <JobForm
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/jobs/${id}`)}
            initialData={initialData}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default JobEdit;
