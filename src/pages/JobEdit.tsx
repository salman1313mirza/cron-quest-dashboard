import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { mockJobs } from "@/lib/mockData";
import { JobForm, JobFormData } from "@/components/JobForm";
import { toast } from "sonner";

const JobEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = mockJobs.find((j) => j.id === id);

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

  const handleSubmit = (jobData: JobFormData) => {
    // In a real app, this would update the job in the database
    console.log("Updating job:", jobData);
    toast.success("Job updated successfully!");
    navigate(`/jobs/${id}`);
  };

  const initialData: Partial<JobFormData> = {
    name: job.name,
    url: "https://example.com/your-php-script.php",
    method: "GET",
    schedule: job.schedule,
    autoStart: job.status !== "paused",
    autoStop: false,
    autoStopAfter: 3600,
    timeout: 300,
    maxRetries: 3,
    headers: "",
    body: "",
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
