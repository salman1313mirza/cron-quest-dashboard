import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { mockJobs, chartData } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const totalJobs = mockJobs.length;
  const activeJobs = mockJobs.filter((j) => j.status !== "paused").length;
  const successfulToday = 167;
  const failedToday = 6;
  const successRate = ((successfulToday / (successfulToday + failedToday)) * 100).toFixed(1);

  const recentExecutions = mockJobs.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Monitor your cron jobs and system performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Jobs" value={totalJobs} icon={Clock} trend="+2 from last week" />
        <MetricCard title="Active Jobs" value={activeJobs} icon={Activity} variant="success" />
        <MetricCard
          title="Success Rate"
          value={`${successRate}%`}
          icon={CheckCircle2}
          variant="success"
          trend="Today"
        />
        <MetricCard title="Failed Today" value={failedToday} icon={XCircle} variant="destructive" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Execution Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.executions}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="successful" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExecutions.map((job) => (
                <div key={job.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{job.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">{job.schedule}</p>
                  </div>
                  <Badge
                    variant={
                      job.status === "success"
                        ? "default"
                        : job.status === "failed"
                        ? "destructive"
                        : job.status === "running"
                        ? "secondary"
                        : "outline"
                    }
                    className={
                      job.status === "success"
                        ? "bg-success text-success-foreground"
                        : job.status === "running"
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }
                  >
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
